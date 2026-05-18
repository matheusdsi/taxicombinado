'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import {
  PageHeader, KpiCard, Card, StatusBadge, CategoryBadge, FlagBadge, TripTypeBadge,
  EmptyState, LoadingState, Btn, Table, Th, Td, Tr, MiniLineChart, fmtDate, fmtDay, money, num,
  Modal, StatRow, FilterChip, FilterBar,
} from './_components';

// ─── Types ────────────────────────────────────────────────────

interface AdminStats {
  overview: {
    totalQuotes: number; quotesToday: number; quotesYesterday: number;
    quotesLast7: number; quotesLast30: number; challengesTotal: number;
    challengesToday: number; totalSessions: number; sessionsToday: number;
    totalPartners: number; totalPartnerClicks: number; partnerClicksToday: number;
    totalLeads: number; leadsToday: number; totalFeedback: number;
    avgRating: number | null; firstQuoteAt: string | null;
  };
  quoteAverages: {
    distanceKm: number | null; totalDistanceKm: number | null; estimatedMinutes: number | null;
    recommendedPrice: number | null; totalCost: number | null; profit: number | null;
    margin: number | null; fuelPricePerLiter: number | null; consumptionKmPerLiter: number | null;
    tollTotal: number | null; desiredMarginPercent: number | null;
    minRecommendedPrice: number | null; maxRecommendedPrice: number | null;
  };
  breakdowns: {
    tripType: { tripType: string; count: number; percent: number }[];
    fuelType: { fuelType: string; count: number; percent: number }[];
    routeMode: { routeMode: string; count: number }[];
    priceRanges: { range: string; count: number }[];
    distanceRanges: { range: string; count: number }[];
    alertsFrequency: { type: string; count: number }[];
  };
  timeSeries: {
    quotesPerDay: { day: string; count: number }[];
    avgPricePerDay: { day: string; avg_price: number; avg_cost: number; avg_profit: number }[];
  };
  geography: {
    topOrigins: { origin: string; count: number }[];
    topDestinations: { destination: string; count: number }[];
  };
  partners: {
    topPartners: { id?: string; name?: string; category?: string; clicks: number }[];
    recentLeads: { id: string; name: string; phone: string; email?: string; createdAt: string; partner: { name: string; category: string } }[];
  };
  recentActivity: {
    quotes: QuoteRow[];
    sessions: { id: string; sessionId: string; createdAt: string; lastSeen: string; _count: { quotes: number } }[];
    feedback: { id: string; rating: number; category?: string; message?: string; createdAt: string }[];
  };
}

interface QuoteRow {
  id: string; createdAt: string; originAddress?: string; destinationAddress?: string;
  tripType: string; distanceKm: number; totalDistanceKm?: number; recommendedPrice: number;
  farePrice?: number; totalCost: number; profit: number; margin: number; fuelType: string;
  routeMode: string; desiredMarginPercent?: number; flagMultiplier?: number;
  baseFare?: number; pricePerKm?: number; tollTotal?: number; parkingCost?: number;
  extraCosts?: number; fuelCost?: number;
}

const TRIP_LABEL: Record<string, string> = {
  one_way: 'Só ida', round_trip: 'Ida e volta', empty_return: 'Volta vazia',
};
const ALERT_LABEL: Record<string, string> = {
  low_profit: 'Lucro baixo', negative_profit: 'Lucro negativo',
  custom_price_below_minimum: 'Preço abaixo do mínimo', empty_return_enabled: 'Volta vazia ativa',
  toll_missing: 'Pedágio não informado', high_margin: 'Margem alta', check_route: 'Conferir rota',
};

function detectCategory(q: QuoteRow): string {
  const base = q.baseFare ?? 0;
  if (base >= 12) return 'executivo';
  if (base >= 9) return 'luxo';
  return 'comum';
}
function detectFlag(q: QuoteRow): number {
  return (q.flagMultiplier ?? 1) >= 1.3 ? 2 : 1;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<QuoteRow | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | 'hoje'>('7d');

  const fetchStats = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(apiUrl('/api/admin/stats'), { credentials: 'include' });
      if (res.status === 401 || res.status === 403) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setStats(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchStats();
      setLoading(false);
    }
    init();
  }, [fetchStats]);

  useEffect(() => {
    if (!stats) return;
    const id = window.setInterval(fetchStats, 60000);
    return () => window.clearInterval(id);
  }, [stats, fetchStats]);

  const computed = useMemo(() => {
    if (!stats) return null;
    const { overview, quoteAverages } = stats;
    const todayDelta = overview.quotesYesterday > 0
      ? ((overview.quotesToday - overview.quotesYesterday) / overview.quotesYesterday) * 100
      : 0;
    const conversion = overview.totalSessions > 0
      ? (overview.totalQuotes / overview.totalSessions) * 100 : 0;
    return {
      todayDelta,
      conversion,
      avgTicket: quoteAverages.recommendedPrice ?? 0,
      avgProfit: quoteAverages.profit ?? 0,
    };
  }, [stats]);

  if (loading) return (
    <div className="p-8"><LoadingState label="Carregando dashboard..." /></div>
  );
  if (!stats || !computed) return (
    <div className="p-8 text-center text-red-500 text-sm">{error || 'Erro ao carregar dados'}</div>
  );

  const { overview, quoteAverages, breakdowns, timeSeries, geography, partners, recentActivity } = stats;
  const quotesChartData = timeSeries.quotesPerDay.slice(-7).map((d) => d.count);
  const priceChartData = timeSeries.avgPricePerDay.slice(-7).map((d) => d.avg_price);
  const recentQuotes = recentActivity.quotes.slice(0, 8);
  const totalTripTypes = breakdowns.tripType.reduce((s, i) => s + i.count, 0);
  const alertTotal = breakdowns.alertsFrequency.reduce((s, i) => s + i.count, 0);

  const quotesToShow = periodFilter === 'hoje'
    ? overview.quotesToday
    : periodFilter === '30d'
    ? overview.quotesLast30
    : overview.quotesLast7;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do sistema"
        actions={
          <div className="flex items-center gap-2">
            <FilterBar>
              {(['hoje', '7d', '30d'] as const).map((f) => (
                <FilterChip key={f} label={f === 'hoje' ? 'Hoje' : f === '7d' ? 'Últimos 7 dias' : 'Últimos 30 dias'} active={periodFilter === f} onClick={() => setPeriodFilter(f)} />
              ))}
            </FilterBar>
            <Btn onClick={fetchStats} variant="ghost" size="sm">
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Atualizar
              </span>
            </Btn>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard
          label="Cotações"
          value={num(quotesToShow)}
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          trend={computed.todayDelta}
          trendLabel=" vs ontem"
          color="yellow"
        />
        <KpiCard
          label="Sessões"
          value={num(overview.totalSessions)}
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          sub={`${overview.sessionsToday} hoje`}
          color="blue"
        />
        <KpiCard
          label="Ticket Médio"
          value={money(quoteAverages.recommendedPrice)}
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          sub={`Dist. média: ${quoteAverages.distanceKm?.toFixed(1) ?? '—'} km`}
          color="green"
        />
        <KpiCard
          label="Sobra Média"
          value={money(quoteAverages.profit)}
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
          sub={`Margem: ${quoteAverages.margin?.toFixed(0) ?? '—'}%`}
          color="green"
        />
        <KpiCard
          label="Parceiros"
          value={num(overview.totalPartners)}
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 11l-4 4-2-2"/></svg>}
          sub={`${overview.totalPartnerClicks} cliques`}
          color="purple"
        />
        <KpiCard
          label="Avaliação"
          value={overview.avgRating ? `${overview.avgRating.toFixed(1)} ★` : '—'}
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          sub={`${overview.totalFeedback} feedbacks`}
          color="yellow"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Cotações por dia */}
        <Card title="Cotações por dia" subtitle="Últimos 7 dias" className="lg:col-span-2">
          <div className="mt-3">
            {timeSeries.quotesPerDay.length > 0 ? (
              <div>
                <div className="flex items-end gap-1.5 h-32">
                  {timeSeries.quotesPerDay.slice(-14).map((d, i) => {
                    const max = Math.max(1, ...timeSeries.quotesPerDay.slice(-14).map(x => x.count));
                    const h = Math.max(4, Math.round((d.count / max) * 100));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="relative flex-1 w-full flex items-end">
                          <div
                            className="w-full rounded-t-md bg-[#F5B800]/20 group-hover:bg-[#F5B800]/40 transition-all"
                            style={{ height: `${h}%` }}
                            title={`${d.count} cotações`}
                          >
                            <div className="h-1 w-full rounded-t-md bg-[#F5B800]" />
                          </div>
                        </div>
                        <span className="text-[9px] text-gray-400 whitespace-nowrap">{fmtDay(d.day)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <EmptyState title="Sem dados de cotações" />
            )}
          </div>
        </Card>

        {/* Breakdown por tipo */}
        <Card title="Por tipo de corrida">
          <div className="mt-3 space-y-3">
            {breakdowns.tripType.length === 0 ? (
              <EmptyState title="Sem dados" />
            ) : (
              breakdowns.tripType.map((t) => (
                <div key={t.tripType}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-gray-600">{TRIP_LABEL[t.tripType] ?? t.tripType}</span>
                    <span className="text-[12px] font-bold text-[#0F1623]">{num(t.count)} <span className="text-gray-400 font-normal">({t.percent?.toFixed(0) ?? 0}%)</span></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#F5B800]" style={{ width: `${Math.min(100, t.percent ?? 0)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Top destinos */}
        <Card title="Top destinos" subtitle="Mais cotados" action={<span className="text-[11px] text-gray-400">{num(geography.topDestinations.length)} rotas</span>}>
          <div className="mt-2 space-y-1">
            {geography.topDestinations.slice(0, 6).length === 0 ? (
              <EmptyState title="Sem dados" />
            ) : (
              geography.topDestinations.slice(0, 6).map((d, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#FFF8DC] text-[11px] font-bold text-[#C89000]">{i + 1}</span>
                  <span className="flex-1 text-[12px] text-gray-700 truncate">{d.destination || '(sem endereço)'}</span>
                  <span className="text-[12px] font-bold text-[#0F1623]">{num(d.count)}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Agendamentos próximos */}
        <Card title="Atividade recente" subtitle="Cotações recentes" className="lg:col-span-2">
          <Table className="mt-2">
            <thead>
              <tr>
                <Th>Origem → Destino</Th>
                <Th>Tipo</Th>
                <Th>Valor</Th>
                <Th>Data</Th>
              </tr>
            </thead>
            <tbody>
              {recentQuotes.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-[12px] text-gray-400">Nenhuma cotação recente</td></tr>
              ) : (
                recentQuotes.map((q) => (
                  <Tr key={q.id} onClick={() => setSelectedQuote(q)}>
                    <Td>
                      <div className="max-w-[200px]">
                        <p className="text-[12px] font-medium text-gray-700 truncate">{q.originAddress || '(origem)'}</p>
                        <p className="text-[11px] text-gray-400 truncate">→ {q.destinationAddress || '(destino)'}</p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col gap-1">
                        <CategoryBadge category={detectCategory(q)} />
                        <TripTypeBadge type={q.tripType} />
                      </div>
                    </Td>
                    <Td>
                      <p className="font-bold text-[#0F1623]">{money(q.recommendedPrice)}</p>
                      <p className="text-[11px] text-emerald-600">Sobra: {money(q.profit)}</p>
                    </Td>
                    <Td className="text-[11px] text-gray-400 whitespace-nowrap">{fmtDate(q.createdAt)}</Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card title="Alertas" subtitle="Frequência de alertas">
          <div className="mt-3 space-y-2">
            {breakdowns.alertsFrequency.length === 0 ? (
              <p className="text-[12px] text-gray-400 py-4 text-center">Nenhum alerta</p>
            ) : (
              breakdowns.alertsFrequency.slice(0, 5).map((a) => (
                <div key={a.type} className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-600 truncate">{ALERT_LABEL[a.type] ?? a.type}</span>
                  <span className="text-[12px] font-bold text-[#0F1623] ml-2">{num(a.count)}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Faixas de preço">
          <div className="mt-3 space-y-2">
            {breakdowns.priceRanges.length === 0 ? (
              <p className="text-[12px] text-gray-400 py-4 text-center">Sem dados</p>
            ) : (
              breakdowns.priceRanges.map((r) => {
                const total = breakdowns.priceRanges.reduce((s, x) => s + x.count, 0);
                const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
                return (
                  <div key={r.range}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] text-gray-500">{r.range}</span>
                      <span className="text-[11px] font-bold text-[#0F1623]">{num(r.count)}</span>
                    </div>
                    <div className="h-1 rounded-full bg-gray-100"><div className="h-full rounded-full bg-blue-400" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card title="Top Parceiros" subtitle="Por cliques">
          <div className="mt-3 space-y-2">
            {partners.topPartners.length === 0 ? (
              <p className="text-[12px] text-gray-400 py-4 text-center">Nenhum parceiro</p>
            ) : (
              partners.topPartners.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
                    <span className="text-[12px] text-gray-700 truncate">{p.name ?? '—'}</span>
                  </div>
                  <span className="text-[12px] font-bold text-[#0F1623] shrink-0">{num(p.clicks)}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Feedbacks" subtitle="Últimos recebidos">
          <div className="mt-3 space-y-2.5">
            {recentActivity.feedback.length === 0 ? (
              <p className="text-[12px] text-gray-400 py-4 text-center">Nenhum feedback</p>
            ) : (
              recentActivity.feedback.slice(0, 4).map((f) => (
                <div key={f.id} className="flex items-start gap-2">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${f.rating >= 4 ? 'bg-emerald-50 text-emerald-600' : f.rating >= 3 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'}`}>
                    {f.rating}★
                  </div>
                  <p className="text-[12px] text-gray-600 line-clamp-2">{f.message || f.category || 'Sem comentário'}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Métricas secundárias */}
      <Card title="Métricas de cálculo" subtitle="Médias gerais de todas as cotações">
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Distância média', value: quoteAverages.distanceKm ? `${quoteAverages.distanceKm.toFixed(1)} km` : '—' },
            { label: 'Distância total', value: quoteAverages.totalDistanceKm ? `${num(Math.round(quoteAverages.totalDistanceKm))} km` : '—' },
            { label: 'Preço mínimo', value: money(quoteAverages.minRecommendedPrice) },
            { label: 'Preço máximo', value: money(quoteAverages.maxRecommendedPrice) },
            { label: 'Pedágio médio', value: money(quoteAverages.tollTotal) },
            { label: 'Margem desejada', value: quoteAverages.desiredMarginPercent ? `${quoteAverages.desiredMarginPercent.toFixed(0)}%` : '—' },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-gray-50 p-4">
              <p className="text-[11px] text-gray-400 mb-1">{m.label}</p>
              <p className="text-[16px] font-bold text-[#0F1623]">{m.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal de cotação */}
      <Modal open={!!selectedQuote} onClose={() => setSelectedQuote(null)} title="Detalhes da cotação" wide>
        {selectedQuote && (
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <CategoryBadge category={detectCategory(selectedQuote)} />
              <FlagBadge flag={detectFlag(selectedQuote)} />
              <TripTypeBadge type={selectedQuote.tripType} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Rota</h4>
                <StatRow label="Origem" value={selectedQuote.originAddress || '—'} />
                <StatRow label="Destino" value={selectedQuote.destinationAddress || '—'} />
                <StatRow label="Data/hora" value={fmtDate(selectedQuote.createdAt)} />
                <StatRow label="Distância original" value={selectedQuote.distanceKm ? `${selectedQuote.distanceKm.toFixed(1)} km` : '—'} />
                <StatRow label="Distância considerada" value={selectedQuote.totalDistanceKm ? `${selectedQuote.totalDistanceKm.toFixed(1)} km` : '—'} />
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Valores</h4>
                <StatRow label="Taxímetro base" value={money(selectedQuote.farePrice)} />
                <StatRow label="Pedágio" value={money(selectedQuote.tollTotal)} />
                <StatRow label="Extra" value={money(selectedQuote.extraCosts)} />
                <StatRow label="Custo combustível" value={money(selectedQuote.fuelCost)} />
                <StatRow label="Custo total" value={money(selectedQuote.totalCost)} />
                <StatRow label="Sobra estimada" value={<span className="text-emerald-600">{money(selectedQuote.profit)}</span>} highlight />
                <StatRow label="Preço final" value={<span className="text-[#C89000] font-bold">{money(selectedQuote.recommendedPrice)}</span>} highlight />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {selectedQuote.originAddress && selectedQuote.destinationAddress && (
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selectedQuote.originAddress!)}&destination=${encodeURIComponent(selectedQuote.destinationAddress!)}`, '_blank')}
                >
                  Abrir no Maps
                </Btn>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
