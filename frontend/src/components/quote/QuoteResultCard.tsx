'use client';

import { useState } from 'react';
import { QuoteResult, RouteStep } from '@/lib/api';
import { formatCurrencyBRL, formatDistance, generateWhatsAppText } from '@/lib/formatters';

interface QuoteResultCardProps {
  result: QuoteResult;
  quoteId: string;
  originAddress?: string;
  destinationAddress?: string;
  stops?: string[];
  routeSteps?: RouteStep[];
  onNewQuote: () => void;
}

const alertConfig: Record<string, { bg: string; color: string; iconBg: string }> = {
  error:   { bg: 'var(--red-soft)',    color: '#7F1D1D', iconBg: 'var(--red)' },
  warning: { bg: 'var(--orange-soft)', color: '#7C2D12', iconBg: 'var(--orange)' },
  info:    { bg: 'var(--blue-soft)',   color: '#1E3A8A', iconBg: 'var(--blue)' },
};

function splitMoney(n: number) {
  const s = n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [int, dec] = s.split(',');
  return { int, dec };
}

function CostRow({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 14 }}>
      <span style={{ color: bold ? 'var(--ink)' : 'var(--gray-700)', fontWeight: bold ? 800 : 600 }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 700, color: bold ? 'var(--ink)' : 'var(--gray-700)' }}>{formatCurrencyBRL(value)}</span>
    </div>
  );
}

function MoneyLine({ label, value, tone }: { label: string; value: number; tone?: 'green' | 'red' | 'ink' }) {
  const color = tone === 'green' ? 'var(--green)' : tone === 'red' ? 'var(--red)' : 'var(--ink)';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-500)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 900, color }}>{formatCurrencyBRL(value)}</span>
    </div>
  );
}

export function QuoteResultCard({ result, quoteId, originAddress, destinationAddress, stops = [], routeSteps = [], onNewQuote }: QuoteResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const profitRecommended = result.profit;
  const lucroPositivo = profitRecommended > 0;
  const rec = splitMoney(result.recommendedPrice);
  const gainOverTaximeter = Math.max(0, result.recommendedPrice - result.farePrice);

  const tripLabel = result.tripType === 'one_way' ? 'Só ida' : result.tripType === 'round_trip' ? 'Ida e volta' : 'Volta vazia';

  const copyText = () => {
    const lines = [
      '🚖 Orçamento Taxi Combinado',
      '',
      originAddress      && `📍 Origem: ${originAddress}`,
      ...stops.map((s, i) => `📌 Parada ${i + 1}: ${s}`),
      destinationAddress && `🏁 Destino: ${destinationAddress}`,
      `🗺️ Distância: ${formatDistance(result.distanceKm)}`,
      '',
      `💰 Preço estimado: ${formatCurrencyBRL(result.recommendedPrice)}`,
      `📊 Custo da corrida: ${formatCurrencyBRL(result.totalCost)}`,
      `✅ Lucro estimado: ${formatCurrencyBRL(profitRecommended)}`,
      '',
      'Calculado com Taxi Combinado',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    const text = generateWhatsAppText({
      origin: originAddress,
      destination: destinationAddress,
      recommendedPrice: result.recommendedPrice,
      distanceKm: result.distanceKm,
      estimatedMinutes: result.estimatedMinutes,
      tripType: result.tripType,
    });
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ─── Hero amarelo ─── */}
      <div className="tc-hero-yellow">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(17,24,39,.7)' }}>Preço estimado</span>
          <span style={{ background: 'rgba(17,24,39,.1)', color: 'var(--ink)', padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase' as const }}>
            Lucro {Math.round(result.margin)}%
          </span>
        </div>
        <div className="tc-money-xl">
          R$ {rec.int}<span className="cents">,{rec.dec}</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(17,24,39,.65)', marginTop: 6 }}>
          Com base no taxímetro estimado, incluindo tempo parado em trânsito, no ganho escolhido e nos custos informados.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 16 }}>
          {[
            { lab: 'CUSTO',  val: formatCurrencyBRL(result.totalCost),    color: undefined },
            { lab: 'LUCRO',  val: formatCurrencyBRL(profitRecommended),   color: lucroPositivo ? '#0F5132' : '#7F1D1D' },
            { lab: 'POR KM', val: formatCurrencyBRL(result.recommendedPrice / Math.max(1, result.totalDistanceKm)), color: undefined },
          ].map((it) => (
            <div key={it.lab} style={{ background: 'rgba(17,24,39,.09)', padding: '10px 8px', borderRadius: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.06em', color: 'rgba(17,24,39,.6)' }}>{it.lab}</div>
              <div style={{ fontSize: 14, fontWeight: 800, marginTop: 3, color: it.color }}>{it.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="tc-card">
        <div className="tc-section-title">Resumo no bolso</div>
        <MoneyLine label="Taximetro da corrida" value={result.farePrice} />
        {gainOverTaximeter > 0 && <MoneyLine label="Ganho colocado em cima" value={gainOverTaximeter} />}
        <MoneyLine label="Gasto para fazer a corrida" value={result.totalCost} />
        <MoneyLine label="Sobra estimada para voce" value={profitRecommended} tone={profitRecommended >= 0 ? 'green' : 'red'} />
      </div>

      {/* ─── Ações rápidas ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button type="button" onClick={shareWhatsApp}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--ink)', color: '#fff', border: 0, borderRadius: 14, padding: '14px 16px', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.6 15.07L2 22l5.07-1.32A10 10 0 1 0 12 2Zm5.27 14.27c-.22.62-1.27 1.17-1.78 1.22-.46.05-1.05.07-1.69-.1a13 13 0 0 1-1.83-.68 11.36 11.36 0 0 1-4.32-3.83c-.34-.5-1.18-1.58-1.18-3.02 0-1.43.74-2.13 1-2.43.27-.3.58-.37.78-.37l.56.01c.18 0 .42-.07.66.5l.93 2.27c.08.16.13.34.02.55l-.32.5c-.1.16-.22.34-.05.65.17.3.75 1.22 1.61 1.97 1.1.96 2.04 1.27 2.36 1.42.32.15.5.13.69-.08.18-.2.79-.92.99-1.24.2-.32.4-.27.68-.16.27.1 1.74.82 2.04.97.3.15.5.22.57.34.07.13.07.75-.16 1.37Z"/>
          </svg>
          WhatsApp
        </button>
        <button type="button" onClick={copyText}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--surface)', color: 'var(--ink)', border: '1.5px solid var(--gray-200)', borderRadius: 14, padding: '14px 16px', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
          {copied ? (
            <>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              Copiado!
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
              Copiar
            </>
          )}
        </button>
      </div>

      {/* ─── Alertas ─── */}
      {result.alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {result.alerts.map((alert, i) => {
            const cfg = alertConfig[alert.severity] ?? alertConfig.info;
            return (
              <div key={i} style={{ background: cfg.bg, color: cfg.color, borderRadius: 14, padding: '11px 13px', fontSize: 13, fontWeight: 600, lineHeight: 1.35, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: cfg.iconBg, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
                </div>
                {alert.message}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Resumo da rota ─── */}
      {(originAddress || destinationAddress) && (
        <div className="tc-card">
          <div className="tc-section-title">Resumo da rota</div>
          {(() => {
            const allPoints = [
              { pinClass: 'pin-a', label: 'A', address: originAddress || '—', sublabel: 'Saída' },
              ...stops.map((s, i) => ({ pinClass: 'pin-stop', label: String(i + 1), address: s, sublabel: `Parada ${i + 1}` })),
              { pinClass: 'pin-b', label: 'B', address: destinationAddress || '—', sublabel: 'Destino' },
            ];
            return (
              <div>
                {allPoints.map((pt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                      <span className={pt.pinClass}>{pt.label}</span>
                      {i < allPoints.length - 1 && (
                        <span style={{ width: 1.5, flex: 1, minHeight: 20, background: 'var(--gray-200)', margin: '4px 0', display: 'block' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, paddingBottom: i < allPoints.length - 1 ? 10 : 0, paddingTop: 2 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{pt.address}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{pt.sublabel}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          <div style={{ height: 1, background: 'var(--gray-200)', margin: '14px 0' }}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            {[
              { lab: 'Distância', val: formatDistance(result.totalDistanceKm) },
              { lab: 'Tipo',      val: tripLabel },
              { lab: 'ID',        val: quoteId.startsWith('local-') ? 'LOCAL' : `#${quoteId.slice(0, 6)}` },
            ].map((it) => (
              <div key={it.lab}>
                <div style={{ fontSize: 10, color: 'var(--gray-500)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.04em' }}>{it.lab}</div>
                <div style={{ fontWeight: 800, fontSize: 14, marginTop: 3 }}>{it.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Faixas de preço ─── */}
      {(() => {
        const hasMargin = result.priceWithMargin > result.farePrice + 0.01;
        const bands = [
          { lab: 'Mínimo — cobre seus custos', val: result.minimumPrice, color: 'var(--gray-500)', highlight: false },
          { lab: 'Taxímetro estimado',          val: result.farePrice,   color: 'var(--gray-700)', highlight: !hasMargin },
          ...(hasMargin ? [{ lab: 'Com o ganho que você escolheu', val: result.recommendedPrice, color: 'var(--ink)', highlight: true }] : []),
          { lab: 'Você pode cobrar mais — até', val: result.idealPrice,  color: 'var(--green)',    highlight: false },
        ];
        return (
          <div className="tc-card">
            <div className="tc-section-title">Faixas de preço</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {bands.map((p) => (
                <div key={p.lab} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: p.highlight ? '10px 12px' : '7px 4px',
                  background: p.highlight ? 'var(--yellow-soft)' : 'transparent',
                  borderRadius: p.highlight ? 10 : 0,
                }}>
                  <span style={{ fontSize: 13, color: p.color, fontWeight: p.highlight ? 800 : 600 }}>{p.lab}</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: p.color }}>{formatCurrencyBRL(p.val)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ─── Detalhamento de custos ─── */}
      <div className="tc-card" style={{ padding: 0, overflow: 'hidden' }}>
        <button type="button" onClick={() => setShowDetails(!showDetails)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: 0, background: 'transparent', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' as const }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>Para onde vai o dinheiro</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: showDetails ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--gray-400)' }}>
            <path d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        {showDetails && (
          <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--gray-100)' }}>
            <div style={{ paddingTop: 12 }}>
              <CostRow label="Combustível"     value={result.fuelCost} />
              {result.vehicleExtraCost > 0 && <CostRow label="Desgaste do carro" value={result.vehicleExtraCost} />}
              {result.tollTotal > 0    && <CostRow label="Pedágio"         value={result.tollTotal} />}
              {result.parkingCost > 0  && <CostRow label="Estacionamento"   value={result.parkingCost} />}
              {result.extraCosts > 0   && <CostRow label="Outros gastos"     value={result.extraCosts} />}
              {result.timeCharge > 0   && <CostRow label="Tempo no taxímetro (trânsito/espera)" value={result.timeCharge} />}
              <div style={{ height: 1, background: 'var(--gray-200)', margin: '8px 0' }}/>
              <CostRow label="Total que sai do seu bolso" value={result.totalCost} bold />
            </div>
          </div>
        )}
      </div>

      {/* ─── Caminho sugerido ─── */}
      {routeSteps.length > 0 && (
        <div className="tc-card" style={{ padding: 0, overflow: 'hidden' }}>
          <button type="button" onClick={() => setShowSteps(!showSteps)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: 0, background: 'transparent', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' as const }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>Caminho sugerido</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: showSteps ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--gray-400)', flexShrink: 0 }}>
              <path d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          {showSteps && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--gray-100)' }}>
              {routeSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, paddingTop: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? 'var(--ink)' : i === routeSteps.length - 1 ? 'var(--green)' : 'var(--gray-200)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: i === 0 || i === routeSteps.length - 1 ? '#fff' : 'var(--gray-500)' }}>{i + 1}</span>
                    </div>
                    {i < routeSteps.length - 1 && (
                      <div style={{ width: 1.5, flex: 1, minHeight: 16, background: 'var(--gray-200)', margin: '3px 0' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35 }}>{step.instruction}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                      {step.distanceKm >= 1 ? `${step.distanceKm.toFixed(1)} km` : `${Math.round(step.distanceKm * 1000)} m`}
                      {' · '}
                      {Math.round(step.durationMinutes)} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Valor informado ─── */}
      {result.customChargedPrice && result.customChargedPrice > 0 && (
        <div style={{
          background: result.customChargedPrice < result.minimumPrice ? 'var(--red-soft)' : 'var(--gray-50)',
          border: `1px solid ${result.customChargedPrice < result.minimumPrice ? 'var(--red)' : 'var(--gray-200)'}`,
          borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase' as const, letterSpacing: '.04em' }}>Valor que você quer cobrar</div>
            <div style={{ fontSize: 13, marginTop: 4, fontWeight: 600, color: result.customChargedPrice < result.minimumPrice ? 'var(--red)' : 'var(--gray-500)' }}>
              {result.customChargedPrice < result.minimumPrice
                ? 'Abaixo do mínimo — pode dar prejuízo'
                : `Lucro: ${formatCurrencyBRL(result.profit)}`}
            </div>
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, color: result.customChargedPrice < result.minimumPrice ? 'var(--red)' : 'var(--ink)' }}>
            {formatCurrencyBRL(result.customChargedPrice)}
          </div>
        </div>
      )}

      {/* ─── Card parceiro ─── */}
      <div className="tc-card" style={{ background: 'linear-gradient(180deg, #FFFBEC, #FFF)', borderColor: '#FCEBA8' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--ink)', color: 'var(--yellow)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>%</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Economize nos custos do carro</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 3 }}>Pneus, manutenção e combustível pesam para quem roda todo dia.</div>
          </div>
          <a href="/parceiros"
            style={{ background: 'var(--ink)', color: '#fff', border: 0, borderRadius: 12, padding: '10px 14px', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer', textDecoration: 'none', flexShrink: 0 }}>
            Ver
          </a>
        </div>
      </div>

      {/* ─── Nova cotação ─── */}
      <button type="button" onClick={onNewQuote}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--gray-100)', color: 'var(--gray-700)', border: 0, borderRadius: 14, padding: '14px 16px', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 6l-6 6 6 6"/>
        </svg>
        Recalcular
      </button>
    </div>
  );
}
