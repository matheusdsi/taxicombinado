'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrencyBRL, formatDistance, formatDuration } from '@/lib/formatters';
import { apiUrl } from '@/lib/apiConfig';

// ─── Types ────────────────────────────────────────────────────

interface AdminStats {
  overview: {
    totalQuotes: number;
    quotesToday: number;
    quotesYesterday: number;
    quotesLast7: number;
    quotesLast30: number;
    totalSessions: number;
    sessionsToday: number;
    totalPartners: number;
    totalPartnerClicks: number;
    partnerClicksToday: number;
    totalLeads: number;
    leadsToday: number;
    totalFeedback: number;
    avgRating: number | null;
    firstQuoteAt: string | null;
  };
  quoteAverages: {
    distanceKm: number | null;
    totalDistanceKm: number | null;
    estimatedMinutes: number | null;
    recommendedPrice: number | null;
    totalCost: number | null;
    profit: number | null;
    margin: number | null;
    fuelPricePerLiter: number | null;
    consumptionKmPerLiter: number | null;
    tollTotal: number | null;
    desiredMarginPercent: number | null;
    minRecommendedPrice: number | null;
    maxRecommendedPrice: number | null;
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
    quotes: {
      id: string;
      createdAt: string;
      originAddress?: string;
      destinationAddress?: string;
      tripType: string;
      distanceKm: number;
      recommendedPrice: number;
      totalCost: number;
      profit: number;
      margin: number;
      fuelType: string;
      routeMode: string;
    }[];
    sessions: { id: string; sessionId: string; createdAt: string; lastSeen: string; _count: { quotes: number } }[];
    feedback: { id: string; rating: number; category?: string; message?: string; createdAt: string }[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────

const TRIP_TYPE_LABEL: Record<string, string> = {
  one_way: 'Só ida',
  round_trip: 'Ida e volta',
  empty_return: 'Volta vazia',
};

const FUEL_LABEL: Record<string, string> = {
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  gnv: 'GNV',
  diesel: 'Diesel',
  hybrid: 'Híbrido',
  electric: 'Elétrico',
  other: 'Outro',
};

const ALERT_LABEL: Record<string, string> = {
  low_profit: 'Lucro baixo',
  negative_profit: 'Lucro negativo',
  custom_price_below_minimum: 'Preço abaixo do mínimo',
  empty_return_enabled: 'Volta vazia ativa',
  toll_missing: 'Pedágio não informado',
  high_margin: 'Margem alta',
  check_route: 'Conferir rota',
};

function pct(n: number, total: number) {
  if (!total) return '0%';
  return Math.round((n / total) * 100) + '%';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────────────

function KpiCard({ label, value, sub, color = 'yellow' }: { label: string; value: string | number; sub?: string; color?: string }) {
  const border = color === 'green' ? 'border-green-400' : color === 'blue' ? 'border-blue-400' : color === 'purple' ? 'border-purple-400' : 'border-yellow-400';
  const text = color === 'green' ? 'text-green-600' : color === 'blue' ? 'text-blue-600' : color === 'purple' ? 'text-purple-600' : 'text-yellow-600';
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${border}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-black ${text}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold text-gray-800 mt-6 mb-3 flex items-center gap-2">{children}</h2>;
}

function BarRow({ label, count, total, extra }: { label: string; count: number; total: number; extra?: string }) {
  const width = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-800">{count} {extra && <span className="text-gray-400 font-normal">{extra}</span>}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2 bg-yellow-400 rounded-full" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ name?: string | null; email: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'users' | 'partners' | 'feedback'>('overview');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/admin/stats'), { credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/admin/login';
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro desconhecido');
      setStats(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar sessão e carregar dados
  useEffect(() => {
    async function init() {
      try {
        const me = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
        if (!me.ok) { window.location.href = '/admin/login'; return; }
        const { data } = await me.json();
        setUser(data);
        await fetchStats();
      } catch {
        window.location.href = '/admin/login';
      }
    }
    init();
  }, [fetchStats]);

  // Auto-refresh a cada 60s
  useEffect(() => {
    if (!stats) return;
    const id = setInterval(fetchStats, 60000);
    return () => clearInterval(id);
  }, [stats, fetchStats]);

  async function handleLogout() {
    await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    window.location.href = '/admin/login';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-gray-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 text-center max-w-sm w-full shadow-sm">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={fetchStats} className="bg-yellow-400 text-gray-900 font-bold px-6 py-2 rounded-xl">Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { overview, quoteAverages, breakdowns, timeSeries, geography, partners, recentActivity } = stats;
  const totalQuotes = overview.totalQuotes;

  const tabs = [
    { id: 'overview', label: '📊 Visão Geral' },
    { id: 'quotes', label: '🧾 Cotações' },
    { id: 'users', label: '👤 Visitantes' },
    { id: 'partners', label: '🤝 Parceiros' },
    { id: 'feedback', label: '💬 Feedback' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-black text-gray-900 text-lg">🚖 Admin</h1>
            <p className="text-xs text-gray-400">
              {overview.firstQuoteAt ? `Desde ${new Date(overview.firstQuoteAt).toLocaleDateString('pt-BR')}` : 'Taxi Combinado'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs text-gray-400 hidden sm:block">
                {user.name || user.email}
              </span>
            )}
            <button
              onClick={fetchStats}
              className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded-lg font-semibold"
            >
              ↻ Atualizar
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === t.id
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16">

        {/* ── VISÃO GERAL ─────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            <SectionTitle>🔢 Cotações</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Total" value={totalQuotes.toLocaleString('pt-BR')} color="yellow" />
              <KpiCard label="Hoje" value={overview.quotesToday} sub={`Ontem: ${overview.quotesYesterday}`} color="yellow" />
              <KpiCard label="Últimos 7 dias" value={overview.quotesLast7} color="yellow" />
              <KpiCard label="Últimos 30 dias" value={overview.quotesLast30} color="yellow" />
            </div>

            <SectionTitle>👤 Visitantes</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <KpiCard label="Total de sessões" value={overview.totalSessions.toLocaleString('pt-BR')} color="blue" />
              <KpiCard label="Sessões hoje" value={overview.sessionsToday} color="blue" />
              <KpiCard label="Cotações/sessão" value={overview.totalSessions > 0 ? (totalQuotes / overview.totalSessions).toFixed(1) : '—'} color="blue" />
            </div>

            <SectionTitle>💰 Médias por Cotação</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <KpiCard label="Preço Recomendado Médio" value={quoteAverages.recommendedPrice ? formatCurrencyBRL(quoteAverages.recommendedPrice) : '—'} color="green" />
              <KpiCard label="Custo Total Médio" value={quoteAverages.totalCost ? formatCurrencyBRL(quoteAverages.totalCost) : '—'} color="green" />
              <KpiCard label="Lucro Médio" value={quoteAverages.profit ? formatCurrencyBRL(quoteAverages.profit) : '—'} color="green" />
              <KpiCard label="Margem Média" value={quoteAverages.margin != null ? `${quoteAverages.margin.toFixed(1)}%` : '—'} color="green" />
              <KpiCard label="Distância Média (ida)" value={quoteAverages.distanceKm ? formatDistance(quoteAverages.distanceKm) : '—'} color="blue" />
              <KpiCard label="Tempo Médio" value={quoteAverages.estimatedMinutes ? formatDuration(quoteAverages.estimatedMinutes) : '—'} color="blue" />
              <KpiCard label="Combustível Médio/L" value={quoteAverages.fuelPricePerLiter ? formatCurrencyBRL(quoteAverages.fuelPricePerLiter) : '—'} color="yellow" />
              <KpiCard label="Consumo Médio" value={quoteAverages.consumptionKmPerLiter ? `${quoteAverages.consumptionKmPerLiter.toFixed(1)} km/l` : '—'} color="yellow" />
              <KpiCard label="Pedágio Médio" value={quoteAverages.tollTotal ? formatCurrencyBRL(quoteAverages.tollTotal) : '—'} color="yellow" />
              <KpiCard label="Menor Preço Cotado" value={quoteAverages.minRecommendedPrice ? formatCurrencyBRL(quoteAverages.minRecommendedPrice) : '—'} color="purple" />
              <KpiCard label="Maior Preço Cotado" value={quoteAverages.maxRecommendedPrice ? formatCurrencyBRL(quoteAverages.maxRecommendedPrice) : '—'} color="purple" />
              <KpiCard label="Margem Desejada Média" value={quoteAverages.desiredMarginPercent != null ? `${quoteAverages.desiredMarginPercent.toFixed(1)}%` : '—'} color="purple" />
            </div>

            <SectionTitle>🤝 Parceiros</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Parceiros Ativos" value={overview.totalPartners} color="purple" />
              <KpiCard label="Cliques Total" value={overview.totalPartnerClicks} color="purple" />
              <KpiCard label="Cliques Hoje" value={overview.partnerClicksToday} color="purple" />
              <KpiCard label="Leads Total" value={overview.totalLeads} sub={`Hoje: ${overview.leadsToday}`} color="purple" />
            </div>

            <SectionTitle>📈 Cotações por dia (últimos 30 dias)</SectionTitle>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {timeSeries.quotesPerDay.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Nenhum dado ainda</p>
              ) : (
                <div className="space-y-1">
                  {[...timeSeries.quotesPerDay].reverse().slice(0, 14).map((d) => (
                    <div key={d.day} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-20 shrink-0">
                        {new Date(d.day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-5 bg-yellow-400 rounded-full flex items-center justify-end pr-1"
                          style={{ width: `${Math.max(4, (d.count / Math.max(...timeSeries.quotesPerDay.map((x) => x.count))) * 100)}%` }}
                        >
                          <span className="text-xs font-bold text-gray-800">{d.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <SectionTitle>💸 Preço médio por dia (últimos 30 dias)</SectionTitle>
            <div className="bg-white rounded-2xl p-4 shadow-sm overflow-x-auto">
              {timeSeries.avgPricePerDay.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Nenhum dado ainda</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b">
                      <th className="text-left pb-2">Dia</th>
                      <th className="text-right pb-2">Preço Rec.</th>
                      <th className="text-right pb-2">Custo</th>
                      <th className="text-right pb-2">Lucro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...timeSeries.avgPricePerDay].reverse().slice(0, 14).map((d) => (
                      <tr key={d.day} className="border-b border-gray-50">
                        <td className="py-1.5 text-gray-500">{new Date(d.day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td>
                        <td className="py-1.5 text-right font-semibold text-green-600">{formatCurrencyBRL(d.avg_price)}</td>
                        <td className="py-1.5 text-right text-red-500">{formatCurrencyBRL(d.avg_cost)}</td>
                        <td className="py-1.5 text-right text-blue-600">{formatCurrencyBRL(d.avg_profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── COTAÇÕES ────────────────────────────────────── */}
        {activeTab === 'quotes' && (
          <>
            <SectionTitle>🛣️ Tipo de corrida</SectionTitle>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {breakdowns.tripType.map((t) => (
                <BarRow key={t.tripType} label={TRIP_TYPE_LABEL[t.tripType] || t.tripType} count={t.count} total={totalQuotes} extra={`(${t.percent}%)`} />
              ))}
            </div>

            <SectionTitle>⛽ Combustível mais usado</SectionTitle>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {breakdowns.fuelType.map((f) => (
                <BarRow key={f.fuelType} label={FUEL_LABEL[f.fuelType] || f.fuelType} count={f.count} total={totalQuotes} extra={`(${f.percent}%)`} />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-sm text-gray-700 mb-3">📏 Distância das corridas</h3>
                {breakdowns.distanceRanges.map((r) => (
                  <BarRow key={r.range} label={r.range} count={r.count} total={totalQuotes} extra={pct(r.count, totalQuotes)} />
                ))}
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-sm text-gray-700 mb-3">💵 Faixa de preço cobrado</h3>
                {breakdowns.priceRanges.map((r) => (
                  <BarRow key={r.range} label={r.range} count={r.count} total={totalQuotes} extra={pct(r.count, totalQuotes)} />
                ))}
              </div>
            </div>

            <SectionTitle>🚦 Modo de cálculo</SectionTitle>
            <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-6">
              {breakdowns.routeMode.map((r) => (
                <div key={r.routeMode} className="text-center">
                  <p className="text-2xl font-black text-gray-800">{r.count}</p>
                  <p className="text-xs text-gray-500">{r.routeMode === 'manual' ? 'Manual' : 'Automático'}</p>
                </div>
              ))}
            </div>

            <SectionTitle>⚠️ Alertas mais frequentes</SectionTitle>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {breakdowns.alertsFrequency.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum dado ainda</p>
              ) : (
                breakdowns.alertsFrequency.map((a) => (
                  <BarRow key={a.type} label={ALERT_LABEL[a.type] || a.type} count={a.count} total={breakdowns.alertsFrequency.reduce((s, x) => s + x.count, 0)} />
                ))
              )}
            </div>

            <SectionTitle>📍 Origens mais frequentes</SectionTitle>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {geography.topOrigins.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum dado ainda</p>
              ) : (
                geography.topOrigins.map((o, i) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0 text-sm">
                    <span className="text-gray-700 truncate flex-1 mr-3">{o.origin || '(em branco)'}</span>
                    <span className="font-bold text-gray-800 shrink-0">{o.count}×</span>
                  </div>
                ))
              )}
            </div>

            <SectionTitle>🏁 Destinos mais frequentes</SectionTitle>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {geography.topDestinations.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum dado ainda</p>
              ) : (
                geography.topDestinations.map((d, i) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0 text-sm">
                    <span className="text-gray-700 truncate flex-1 mr-3">{d.destination || '(em branco)'}</span>
                    <span className="font-bold text-gray-800 shrink-0">{d.count}×</span>
                  </div>
                ))
              )}
            </div>

            <SectionTitle>🕐 Últimas cotações</SectionTitle>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr className="text-gray-400">
                      <th className="text-left p-3">Data</th>
                      <th className="text-left p-3">Rota</th>
                      <th className="text-right p-3">Dist.</th>
                      <th className="text-right p-3">Preço Rec.</th>
                      <th className="text-right p-3">Custo</th>
                      <th className="text-right p-3">Lucro</th>
                      <th className="text-right p-3">Margem</th>
                      <th className="text-left p-3">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.quotes.map((q) => (
                      <tr key={q.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="p-3 whitespace-nowrap text-gray-400">{fmtDate(q.createdAt)}</td>
                        <td className="p-3 text-gray-700 max-w-[160px]">
                          <span className="block truncate">{q.originAddress || '—'}</span>
                          <span className="block truncate text-gray-400">→ {q.destinationAddress || '—'}</span>
                        </td>
                        <td className="p-3 text-right text-gray-600">{formatDistance(q.distanceKm)}</td>
                        <td className="p-3 text-right font-bold text-green-600">{formatCurrencyBRL(q.recommendedPrice)}</td>
                        <td className="p-3 text-right text-red-500">{formatCurrencyBRL(q.totalCost)}</td>
                        <td className="p-3 text-right text-blue-600">{formatCurrencyBRL(q.profit)}</td>
                        <td className="p-3 text-right">{q.margin.toFixed(1)}%</td>
                        <td className="p-3 text-gray-500">{TRIP_TYPE_LABEL[q.tripType] || q.tripType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── VISITANTES ──────────────────────────────────── */}
        {activeTab === 'users' && (
          <>
            <SectionTitle>👤 Sessões anônimas recentes</SectionTitle>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr className="text-gray-400">
                      <th className="text-left p-3">ID da sessão</th>
                      <th className="text-right p-3">Cotações</th>
                      <th className="text-left p-3">Primeira visita</th>
                      <th className="text-left p-3">Última visita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.sessions.map((s) => (
                      <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="p-3 font-mono text-gray-500">{s.sessionId.slice(0, 8)}…</td>
                        <td className="p-3 text-right font-bold text-yellow-600">{s._count.quotes}</td>
                        <td className="p-3 text-gray-400">{fmtDate(s.createdAt)}</td>
                        <td className="p-3 text-gray-400">{fmtDate(s.lastSeen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">IDs abreviados — dados de sessão são anônimos por design.</p>
          </>
        )}

        {/* ── PARCEIROS ───────────────────────────────────── */}
        {activeTab === 'partners' && (
          <>
            <SectionTitle>🏆 Parceiros mais clicados</SectionTitle>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {partners.topPartners.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum clique registrado ainda</p>
              ) : (
                partners.topPartners.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{p.name || '—'}</p>
                      <p className="text-xs text-gray-400">{p.category || '—'}</p>
                    </div>
                    <span className="font-black text-yellow-600 text-lg">{p.clicks}</span>
                  </div>
                ))
              )}
            </div>

            <SectionTitle>📋 Leads recentes</SectionTitle>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {partners.recentLeads.length === 0 ? (
                <p className="text-gray-400 text-sm p-4">Nenhum lead ainda</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr className="text-gray-400">
                        <th className="text-left p-3">Nome</th>
                        <th className="text-left p-3">WhatsApp</th>
                        <th className="text-left p-3">Parceiro</th>
                        <th className="text-left p-3">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partners.recentLeads.map((l) => (
                        <tr key={l.id} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="p-3 font-semibold text-gray-800">{l.name}</td>
                          <td className="p-3 text-blue-600">
                            <a href={`https://wa.me/${l.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{l.phone}</a>
                          </td>
                          <td className="p-3 text-gray-500">{l.partner?.name || '—'}</td>
                          <td className="p-3 text-gray-400">{fmtDate(l.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── FEEDBACK ────────────────────────────────────── */}
        {activeTab === 'feedback' && (
          <>
            <SectionTitle>⭐ Resumo</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="Total de feedbacks" value={overview.totalFeedback} color="purple" />
              <KpiCard label="Nota média" value={overview.avgRating != null ? `${overview.avgRating}/5` : '—'} color="green" />
            </div>

            <SectionTitle>💬 Feedbacks recentes</SectionTitle>
            <div className="space-y-3">
              {recentActivity.feedback.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum feedback ainda</p>
              ) : (
                recentActivity.feedback.map((f) => (
                  <div key={f.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < f.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{fmtDate(f.createdAt)}</span>
                    </div>
                    {f.category && <span className="inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mb-2">{f.category}</span>}
                    {f.message && <p className="text-sm text-gray-700">{f.message}</p>}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
