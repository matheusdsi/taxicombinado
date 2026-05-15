'use client';

import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { calculateRoute, calculateQuote, getPopularRoutes } from '@/lib/api';
import type { PopularRoute } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';

interface Challenge {
  origin: string;
  destination: string;
  hint: string;
}

const CHALLENGES: Challenge[] = [
  { origin: 'Aeroporto de Congonhas, São Paulo, SP', destination: 'Vila Madalena, São Paulo, SP', hint: 'Do aeroporto para o bairro artístico' },
  { origin: 'Terminal Tietê, São Paulo, SP', destination: 'Praça da República, São Paulo, SP', hint: 'Do terminal de ônibus ao centro histórico' },
  { origin: 'Parque Ibirapuera, São Paulo, SP', destination: 'Shopping Morumbi, São Paulo, SP', hint: 'Do parque ao shopping nobre' },
  { origin: 'Avenida Paulista, São Paulo, SP', destination: 'Lapa, São Paulo, SP', hint: 'Da avenida mais famosa ao bairro boêmio' },
  { origin: 'Aeroporto Internacional de Guarulhos, SP', destination: 'Avenida Paulista, São Paulo, SP', hint: 'Do GRU ao coração de São Paulo' },
  { origin: 'Butantã, São Paulo, SP', destination: 'Berrini, São Paulo, SP', hint: 'Da USP ao distrito financeiro' },
  { origin: 'Pinheiros, São Paulo, SP', destination: 'Tatuapé, São Paulo, SP', hint: 'Do bairro gourmet à zona leste' },
  { origin: 'Brooklin, São Paulo, SP', destination: 'Jardins, São Paulo, SP', hint: 'De um bairro nobre a outro' },
  { origin: 'Santana, São Paulo, SP', destination: 'Jabaquara, São Paulo, SP', hint: 'De ponta a ponta no eixo norte-sul' },
  { origin: 'Itaquera, São Paulo, SP', destination: 'República, São Paulo, SP', hint: 'Da Arena Corinthians ao centro' },
  { origin: 'Moema, São Paulo, SP', destination: 'Alphaville, Barueri, SP', hint: 'Do bairro fino à cidade planejada' },
  { origin: 'Santo Amaro, São Paulo, SP', destination: 'Faria Lima, São Paulo, SP', hint: 'Do sul ao coração financeiro' },
  { origin: 'Santo André, SP', destination: 'MASP, São Paulo, SP', hint: 'Da região do ABC à cultura paulistana' },
  { origin: 'Osasco, SP', destination: 'Consolação, São Paulo, SP', hint: 'Da Grande SP à vida noturna' },
];

const DEFAULT_PARAMS = {
  tripType: 'one_way' as const,
  routeMode: 'automatic' as const,
  consumptionKmPerLiter: 10,
  fuelPricePerLiter: 6.20,
  fuelType: 'gasolina',
  vehicleExtraCostPerKm: 0.15,
  baseFare: 6.00,
  pricePerKm: 2.75,
  waitingPrice: 37.80,
  waitingChargeType: 'per_hour' as const,
  flagMultiplier: 1,
  tollOutbound: 0,
  tollReturn: 0,
  parkingCost: 0,
  extraCosts: 0,
  desiredMarginPercent: 20,
  driverMinimumValue: 15,
};

interface ChallengeResult {
  recommendedPrice: number;
  distanceKm: number;
  durationMinutes: number;
  userGuess: number;
  dayIndex: number;
}

function shortAddr(addr: string): string {
  return addr.split(',')[0].trim();
}

function getDayIndex(): number {
  return Math.floor(Date.now() / 86400000) % CHALLENGES.length;
}

function fmt(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

export default function DesafioPage() {
  const dayIndex = getDayIndex();
  const challenge = CHALLENGES[dayIndex];

  const [guess, setGuess] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [error, setError] = useState('');
  const [popular, setPopular] = useState<PopularRoute[]>([]);

  useEffect(() => {
    trackEvent('challenge_page_viewed', {
      challenge_id: dayIndex + 1,
    });
    try {
      const stored = localStorage.getItem('desafio_result');
      if (stored) {
        const parsed: ChallengeResult = JSON.parse(stored);
        if (parsed.dayIndex === dayIndex) {
          setGuess(parsed.userGuess.toFixed(2).replace('.', ','));
          setResult(parsed);
        }
      }
    } catch {}
  }, [dayIndex]);

  useEffect(() => {
    getPopularRoutes().then(setPopular).catch(() => {});
  }, []);

  const handleCalculate = async () => {
    const guessValue = parseFloat(guess.replace(',', '.'));
    if (isNaN(guessValue) || guessValue <= 0) {
      setError('Digite um valor válido');
      return;
    }
    setError('');
    setLoading(true);
    trackEvent('challenge_calculate_attempt', {
      challenge_id: dayIndex + 1,
      guessed_price: guessValue,
    });
    try {
      const routeInfo = await calculateRoute(challenge.origin, challenge.destination);
      if (!routeInfo.distanceKm || !routeInfo.durationMinutes) {
        throw new Error('Rota não encontrada');
      }
      const quoteResult = await calculateQuote({
        ...DEFAULT_PARAMS,
        originAddress: challenge.origin,
        destinationAddress: challenge.destination,
        distanceKm: routeInfo.distanceKm,
        estimatedMinutes: routeInfo.durationMinutes,
      });
      const data: ChallengeResult = {
        recommendedPrice: quoteResult.result.recommendedPrice,
        distanceKm: routeInfo.distanceKm,
        durationMinutes: routeInfo.durationMinutes,
        userGuess: guessValue,
        dayIndex,
      };
      setResult(data);
      localStorage.setItem('desafio_result', JSON.stringify(data));
      trackEvent('challenge_completed', {
        challenge_id: dayIndex + 1,
        guessed_price: guessValue,
        recommended_price: data.recommendedPrice,
        distance_km: data.distanceKm,
        difference_percent: Number((((guessValue - data.recommendedPrice) / data.recommendedPrice) * 100).toFixed(2)),
      });
    } catch {
      trackEvent('challenge_calculate_error', {
        challenge_id: dayIndex + 1,
      });
      setError('Erro ao calcular a rota. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const diff = result ? ((result.userGuess - result.recommendedPrice) / result.recommendedPrice) * 100 : 0;
  const absDiff = Math.abs(diff);

  let verdict = '';
  let verdictBg = '';
  let verdictColor = '';
  if (result) {
    if (absDiff <= 5) {
      verdict = '🎯 Perfeito! Você é um mestre do táxi!';
      verdictBg = '#f0fdf4'; verdictColor = '#16a34a';
    } else if (absDiff <= 10) {
      verdict = '🏆 Muito próximo! Excelente estimativa!';
      verdictBg = '#f0fdf4'; verdictColor = '#16a34a';
    } else if (absDiff <= 20) {
      verdict = '👍 Bom esforço! Quase lá.';
      verdictBg = '#fefce8'; verdictColor = '#ca8a04';
    } else if (diff > 20) {
      verdict = '😅 Você cobrou muito! Pode perder passageiros.';
      verdictBg = '#fef2f2'; verdictColor = '#dc2626';
    } else {
      verdict = '😬 Você cobrou pouco! Cuidado com o prejuízo.';
      verdictBg = '#fef2f2'; verdictColor = '#dc2626';
    }
  }

  const shareMsg = result
    ? `🚖 Desafio Táxi Combinado #${dayIndex + 1}\n\n${shortAddr(challenge.origin)} → ${shortAddr(challenge.destination)}\n\nMinha estimativa: ${fmt(result.userGuess)}\nSistema calculou: ${fmt(result.recommendedPrice)}\n${absDiff.toFixed(1)}% ${diff > 0 ? 'acima' : 'abaixo'} do ideal\n\n👉 Tente você: taxicombinado.com.br/desafio`
    : '';

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1.5px solid var(--gray-200)',
    borderRadius: 20,
    padding: '20px 16px',
    marginBottom: 12,
  };

  const pinA: React.CSSProperties = {
    width: 32, height: 32, borderRadius: '50%',
    background: 'var(--ink)', color: 'var(--yellow)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 13, flexShrink: 0,
  };
  const pinB: React.CSSProperties = {
    ...pinA, background: 'var(--yellow)', color: 'var(--ink)',
  };

  return (
    <PageContainer>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 28 }}>⚡</span>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>Desafio do Dia</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-500)' }}>Desafio #{dayIndex + 1} · Renova amanhã</p>
        </div>
      </div>

      {/* Challenge route */}
      <div style={card}>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--gray-500)', fontStyle: 'italic' }}>{challenge.hint}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={pinA}>A</div>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{shortAddr(challenge.origin)}</span>
          </div>
          <div style={{ paddingLeft: 15, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 2, height: 5, background: 'var(--gray-300)', borderRadius: 1 }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={pinB}>B</div>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{shortAddr(challenge.destination)}</span>
          </div>
        </div>
      </div>

      {!result ? (
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
            Quanto você cobraria nessa corrida?
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 15, color: 'var(--gray-500)', fontWeight: 600, pointerEvents: 'none',
              }}>R$</span>
              <input
                type="number"
                inputMode="decimal"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                placeholder="0,00"
                style={{
                  width: '100%',
                  paddingLeft: 44,
                  paddingRight: 14,
                  paddingTop: 13,
                  paddingBottom: 13,
                  border: '1.5px solid var(--gray-200)',
                  borderRadius: 12,
                  fontSize: 18,
                  fontWeight: 700,
                  background: 'var(--gray-50)',
                  color: 'var(--ink)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              onClick={handleCalculate}
              disabled={loading || !guess}
              style={{
                background: loading || !guess ? 'var(--gray-200)' : 'var(--ink)',
                color: loading || !guess ? 'var(--gray-400)' : 'var(--yellow)',
                border: 'none',
                borderRadius: 12,
                padding: '0 20px',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading || !guess ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s',
              }}
            >
              {loading ? '...' : 'Ver resultado'}
            </button>
          </div>
          {error && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#dc2626' }}>{error}</p>}
        </div>
      ) : (
        <>
          {/* Route info pills */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {[
              { label: 'Distância', value: `${result.distanceKm.toFixed(1)} km` },
              { label: 'Tempo', value: `${Math.round(result.durationMinutes)} min` },
            ].map((item) => (
              <div key={item.label} style={{
                flex: 1, background: 'var(--surface)',
                border: '1.5px solid var(--gray-200)', borderRadius: 16,
                padding: '12px 8px', textAlign: 'center',
              }}>
                <p style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Score comparison */}
          <div style={{ ...card, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sua estimativa</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>{fmt(result.userGuess)}</p>
              </div>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--gray-300)', fontSize: 18 }}>vs</p>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Táxi Combinado</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#b45309' }}>{fmt(result.recommendedPrice)}</p>
              </div>
            </div>

            <div style={{ background: verdictBg, borderRadius: 12, padding: '12px 16px', textAlign: 'center', marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: verdictColor }}>{verdict}</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray-600)' }}>
                {absDiff.toFixed(1)}% {diff > 0 ? 'acima' : 'abaixo'} do valor recomendado
              </p>
            </div>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('share', {
                method: 'whatsapp',
                content_type: 'challenge',
                item_id: String(dayIndex + 1),
              })}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#25D366', color: '#fff', borderRadius: 12,
                padding: '13px 20px', textDecoration: 'none',
                fontSize: 15, fontWeight: 700,
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Compartilhar no WhatsApp
            </a>
          </div>

          <button
            onClick={() => {
              trackEvent('challenge_retry_clicked', {
                challenge_id: dayIndex + 1,
              });
              setResult(null);
              setGuess('');
              localStorage.removeItem('desafio_result');
            }}
            style={{
              width: '100%', background: 'transparent',
              border: '1.5px solid var(--gray-200)', borderRadius: 12,
              padding: '11px 16px', fontSize: 14, fontWeight: 600,
              color: 'var(--gray-500)', cursor: 'pointer', marginBottom: 12,
            }}
          >
            Tentar novamente
          </button>
        </>
      )}

      {/* Top destinos */}
      {popular.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
            📍 Top destinos
          </p>
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--gray-200)', borderRadius: 20, overflow: 'hidden' }}>
            {popular.map((route, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderBottom: i < popular.length - 1 ? '1px solid var(--gray-100)' : 'none',
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: i < 3 ? 'var(--ink)' : 'var(--gray-100)',
                  color: i < 3 ? 'var(--yellow)' : 'var(--gray-500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {shortAddr(route.destination ?? '')}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--gray-500)' }}>
                    {route.count} {route.count === 1 ? 'cálculo' : 'cálculos'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
