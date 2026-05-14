'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { getQuoteHistory } from '@/lib/api';
import { formatCurrencyBRL, formatDistance } from '@/lib/formatters';
import { useAuth } from '@/context/AuthContext';
import { getLocalQuotes, LocalQuote } from '@/lib/localQuotes';
import Link from 'next/link';

interface HistoryQuote {
  id: string;
  createdAt: string;
  recommendedPrice: number;
  farePrice?: number;
  minimumPrice?: number;
  idealPrice?: number;
  originAddress?: string;
  destinationAddress?: string;
  distanceKm: number;
  returnDistanceKm?: number;
  totalDistanceKm?: number;
  estimatedMinutes?: number;
  tripType: string;
  totalCost: number;
  fuelCost?: number;
  vehicleExtraCost?: number;
  tollTotal?: number;
  parkingCost?: number;
  extraCosts?: number;
  timeCharge?: number;
  desiredMarginPercent?: number;
  customChargedPrice?: number;
  fuelPricePerLiter?: number;
  consumptionKmPerLiter?: number;
  profit: number;
  margin: number;
  alerts?: Array<{ message: string; severity: string }>;
  isLocal?: boolean;
}

const tripTypeLabels: Record<string, string> = {
  one_way: 'Só ida',
  round_trip: 'Ida e volta',
  empty_return: 'Volta vazia',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function routeTitle(quote: HistoryQuote) {
  if (quote.originAddress || quote.destinationAddress) {
    return `${quote.originAddress || 'Origem'} -> ${quote.destinationAddress || 'Destino'}`;
  }
  return `${formatDistance(quote.totalDistanceKm || quote.distanceKm)} - ${tripTypeLabels[quote.tripType] || quote.tripType}`;
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function DetailLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
      <span style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: strong ? 900 : 800, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function Pill({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'green' | 'yellow' | 'red' }) {
  const colors = {
    gray: { bg: 'var(--gray-100)', color: 'var(--gray-700)' },
    green: { bg: 'var(--green-soft)', color: 'var(--green)' },
    yellow: { bg: 'var(--yellow-soft)', color: 'var(--ink)' },
    red: { bg: 'var(--red-soft)', color: 'var(--red)' },
  }[tone];
  return <span style={{ background: colors.bg, color: colors.color, borderRadius: 999, padding: '5px 9px', fontSize: 11, fontWeight: 900 }}>{children}</span>;
}

function QuoteDetailModal({ quote, onClose }: { quote: HistoryQuote; onClose: () => void }) {
  const taximeter = quote.farePrice || 0;
  const gainOverTaximeter = Math.max(0, quote.recommendedPrice - taximeter);
  const shownPrice = quote.customChargedPrice && quote.customChargedPrice > 0 ? quote.customChargedPrice : quote.recommendedPrice;
  const totalDistance = quote.totalDistanceKm || quote.distanceKm;
  const costLines = [
    ['Combustivel', quote.fuelCost],
    ['Desgaste do carro', quote.vehicleExtraCost],
    ['Pedagio', quote.tollTotal],
    ['Estacionamento', quote.parkingCost],
    ['Outros gastos', quote.extraCosts],
  ].filter(([, value]) => Number(value) > 0) as [string, number][];

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(17,24,39,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 12 }}>
      <div style={{ width: '100%', maxWidth: 620, maxHeight: '88vh', overflow: 'auto', background: 'var(--surface)', borderRadius: 22, boxShadow: '0 24px 80px rgba(0,0,0,.28)' }}>
        <div style={{ position: 'sticky', top: 0, background: 'var(--surface)', borderBottom: '1px solid var(--gray-100)', padding: 16, zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <Pill tone="yellow">{tripTypeLabels[quote.tripType] || quote.tripType}</Pill>
                <Pill>{shortDate(quote.createdAt)}</Pill>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)', lineHeight: 1.2 }}>{routeTitle(quote)}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Fechar detalhes" style={{ width: 36, height: 36, border: 0, borderRadius: 12, background: 'var(--gray-100)', color: 'var(--gray-700)', fontSize: 20, fontWeight: 900, cursor: 'pointer', flexShrink: 0 }}>x</button>
          </div>
        </div>

        <div style={{ padding: 16, display: 'grid', gap: 12 }}>
          <div style={{ background: 'var(--yellow-soft)', borderRadius: 18, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,.65)' }}>Valor para passar ao cliente</div>
            <div style={{ fontSize: 34, fontWeight: 950, letterSpacing: '-0.04em', color: 'var(--ink)', marginTop: 2 }}>{formatCurrencyBRL(shownPrice)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              <div style={{ background: 'rgba(17,24,39,.08)', borderRadius: 12, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(17,24,39,.55)' }}>SOBRA PARA VOCE</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: quote.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatCurrencyBRL(quote.profit)}</div>
              </div>
              <div style={{ background: 'rgba(17,24,39,.08)', borderRadius: 12, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(17,24,39,.55)' }}>PRECO POR KM</div>
                <div style={{ fontSize: 17, fontWeight: 900 }}>{formatCurrencyBRL(shownPrice / Math.max(1, totalDistance))}</div>
              </div>
            </div>
          </div>

          <div className="tc-card" style={{ margin: 0 }}>
            <div className="tc-section-title">Como esse valor foi montado</div>
            <DetailLine label="Taximetro calculado" value={taximeter > 0 ? formatCurrencyBRL(taximeter) : 'Nao informado'} />
            <DetailLine label="Ganho colocado em cima" value={gainOverTaximeter > 0 ? formatCurrencyBRL(gainOverTaximeter) : 'Sem acrescimo'} />
            <DetailLine label="Minimo para nao pagar pra trabalhar" value={quote.minimumPrice ? formatCurrencyBRL(quote.minimumPrice) : formatCurrencyBRL(quote.totalCost)} />
            {Number(quote.idealPrice) > 0 && <DetailLine label="Com folga melhor" value={formatCurrencyBRL(Number(quote.idealPrice))} />}
          </div>

          <div className="tc-card" style={{ margin: 0 }}>
            <div className="tc-section-title">O que pesou nessa corrida</div>
            {costLines.length > 0 ? costLines.map(([label, value]) => (
              <DetailLine key={label} label={label} value={formatCurrencyBRL(value)} />
            )) : (
              <p style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 700 }}>Essa cotacao antiga nao guardou a abertura dos custos.</p>
            )}
            {Number(quote.timeCharge) > 0 && <DetailLine label="Espera/parado cobrada" value={formatCurrencyBRL(Number(quote.timeCharge))} />}
            <DetailLine label="Gasto total estimado" value={formatCurrencyBRL(quote.totalCost)} strong />
          </div>

          <div className="tc-card" style={{ margin: 0 }}>
            <div className="tc-section-title">Dados usados</div>
            <DetailLine label="Distancia total" value={formatDistance(totalDistance)} />
            {Number(quote.returnDistanceKm) > 0 && <DetailLine label="Volta considerada" value={formatDistance(Number(quote.returnDistanceKm))} />}
            {Number(quote.estimatedMinutes) > 0 && <DetailLine label="Tempo de espera" value={`${Math.round(Number(quote.estimatedMinutes) / 60 * 10) / 10} h`} />}
            {Number(quote.fuelPricePerLiter) > 0 && <DetailLine label="Combustivel informado" value={formatCurrencyBRL(Number(quote.fuelPricePerLiter))} />}
            {Number(quote.consumptionKmPerLiter) > 0 && <DetailLine label="Consumo do carro" value={`${Number(quote.consumptionKmPerLiter)} km/l`} />}
          </div>

          {quote.alerts && quote.alerts.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              {quote.alerts.map((alert, index) => (
                <div key={index} style={{ background: alert.severity === 'error' ? 'var(--red-soft)' : 'var(--orange-soft)', borderRadius: 14, padding: 12, fontSize: 13, fontWeight: 800, color: alert.severity === 'error' ? 'var(--red)' : '#7C2D12' }}>
                  {alert.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HistoricoPage() {
  const { driver } = useAuth();
  const [quotes, setQuotes] = useState<HistoryQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuote, setSelectedQuote] = useState<HistoryQuote | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Tenta buscar do banco (funciona se logado ou com sessão anônima + DB online)
        const data = await getQuoteHistory({ page, limit: 15 });
        if (data.quotes.length > 0 || driver) {
          setQuotes(data.quotes);
          setTotalPages(data.totalPages);
          setLoading(false);
          return;
        }
      } catch {
        // DB offline — cai no localStorage
      }
      // Fallback: localStorage
      const local = getLocalQuotes();
      const start = (page - 1) * 15;
      setQuotes(local.slice(start, start + 15).map((q: LocalQuote) => ({ ...q, isLocal: true })));
      setTotalPages(Math.ceil(local.length / 15) || 1);
      setLoading(false);
    };
    load();
  }, [page, driver]);

  return (
    <PageContainer>
      {/* Header */}
      <div style={{ marginBottom: 16, paddingTop: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' }}>Histórico</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
          {driver ? 'Corridas salvas na sua conta' : 'Simulações neste aparelho'}
        </p>
      </div>

      {/* Banner CTA não logado */}
      {!driver && (
        <div style={{ background: 'var(--yellow-soft)', border: '1px solid #FCEBA8', borderRadius: 16, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--yellow)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 18 }}>💡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>Salve seu histórico na nuvem</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 3 }}>
              Agora só aparece neste aparelho. Com conta, acessa de qualquer celular — e suas cotações locais vão junto.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Link href="/cadastro" style={{ background: 'var(--ink)', color: '#fff', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                Criar conta grátis
              </Link>
              <Link href="/entrar" style={{ background: 'transparent', color: 'var(--gray-700)', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--gray-200)', borderTopColor: 'var(--ink)', animation: 'spin 0.9s linear infinite' }} />
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Carregando...</span>
        </div>
      )}

      {!loading && quotes.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🧾</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>Nenhuma simulação ainda</div>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 6, marginBottom: 20 }}>
            Suas corridas calculadas aparecem aqui
          </p>
          <Link href="/" style={{ background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 14, padding: '14px 24px', fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
            Calcular primeira corrida
          </Link>
        </div>
      )}

      {!loading && quotes.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quotes.map((quote) => {
              const shownPrice = quote.customChargedPrice && quote.customChargedPrice > 0 ? quote.customChargedPrice : quote.recommendedPrice;
              const totalDistance = quote.totalDistanceKm || quote.distanceKm;
              return (
              <button key={quote.id} type="button" onClick={() => setSelectedQuote(quote)} className="tc-card" style={{ padding: 14, border: '1px solid var(--gray-100)', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', width: '100%', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {quote.originAddress || quote.destinationAddress ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, flexWrap: 'wrap' as const }}>
                        <span style={{ color: 'var(--ink)' }}>{quote.originAddress || '—'}</span>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--gray-400)' }}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                        <span style={{ color: 'var(--ink)' }}>{quote.destinationAddress || '—'}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {formatDistance(quote.distanceKm)} · {tripTypeLabels[quote.tripType] || quote.tripType}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>{formatDate(quote.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                      {formatCurrencyBRL(shownPrice)}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: quote.profit >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
                      {quote.profit >= 0 ? '+' : ''}{formatCurrencyBRL(quote.profit)} sobra
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--gray-100)', margin: '10px 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--gray-500)' }}>
                  <span>{formatDistance(quote.distanceKm)}</span>
                  <span style={{ color: 'var(--gray-200)' }}>·</span>
                  <span>Custo: {formatCurrencyBRL(quote.totalCost)}</span>
                  <span style={{ color: 'var(--gray-200)' }}>·</span>
                  <span style={{ fontWeight: 700, color: quote.margin >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {quote.margin.toFixed(1)}% lucro
                  </span>
                  {quote.isLocal && (
                    <>
                      <span style={{ color: 'var(--gray-200)' }}>·</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)' }}>LOCAL</span>
                    </>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--gray-400)' }}>RODOU</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-700)' }}>{formatDistance(totalDistance)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--gray-400)' }}>GASTOU</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-700)' }}>{formatCurrencyBRL(quote.totalCost)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--gray-400)' }}>POR KM</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-700)' }}>{formatCurrencyBRL(shownPrice / Math.max(1, totalDistance))}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <Pill>{tripTypeLabels[quote.tripType] || quote.tripType}</Pill>
                    {quote.timeCharge && quote.timeCharge > 0 ? <Pill tone="yellow">Com espera</Pill> : null}
                    {quote.profit < 0 ? <Pill tone="red">Deu prejuizo</Pill> : <Pill tone="green">Sobrou dinheiro</Pill>}
                    {quote.isLocal && <Pill>Local</Pill>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--gray-400)', flexShrink: 0 }}>Ver detalhes</span>
                </div>
              </button>
            );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '10px 18px', borderRadius: 12, border: '1.5px solid var(--gray-200)', background: 'var(--surface)', color: 'var(--gray-700)', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                ← Anterior
              </button>
              <span style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '10px 18px', borderRadius: 12, border: '1.5px solid var(--gray-200)', background: 'var(--surface)', color: 'var(--gray-700)', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
                Próxima →
              </button>
            </div>
          )}
        </>
      )}

      {selectedQuote && (
        <QuoteDetailModal quote={selectedQuote} onClose={() => setSelectedQuote(null)} />
      )}
    </PageContainer>
  );
}
