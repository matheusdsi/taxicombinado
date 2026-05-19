'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/apiConfig';
import {
  KpiCard, EmptyState, LoadingState, Btn, fmtDate, money, num,
} from './_components';

// ─── Types ────────────────────────────────────────────────────

interface AdminStats {
  overview: {
    totalQuotes: number; quotesToday: number; quotesYesterday: number;
    quotesLast7: number; quotesLast30: number;
    totalSessions: number; sessionsToday: number;
    totalPartners: number; totalPartnerClicks: number;
    totalLeads: number; totalFeedback: number;
    avgRating: number | null;
  };
  quoteAverages: {
    distanceKm: number | null; recommendedPrice: number | null;
    totalCost: number | null; profit: number | null; margin: number | null;
    pricePerKm: number | null; sumRecommendedPrice: number | null;
  };
  timeSeries: {
    quotesPerDay: { day: string; count: number }[];
    avgPricePerDay: { day: string; avg_price: number; avg_cost: number; avg_profit: number }[];
  };
  geography: {
    topOrigins: { origin: string; count: number }[];
    topDestinations: { destination: string; count: number }[];
  };
  recentActivity: {
    quotes: QuoteRow[];
  };
}

interface QuoteRow {
  id: string; createdAt: string; originAddress?: string; destinationAddress?: string;
  distanceKm: number; recommendedPrice: number; totalCost: number; profit: number;
}

interface RideStats {
  total: number;
  byStatus: Record<string, number>;
  sumPriceMin: number | null;
  sumPriceMax: number | null;
  recentRides: RideRow[];
}

interface RideRow {
  id: string; scheduledAt: string; passengerName: string | null; passengerPhone: string | null;
  originAddress: string | null; destinationAddress: string | null;
  estimatedPriceMin: number | null; estimatedPriceMax: number | null; status: string;
}

interface UserStats {
  total: number; drivers: number; admins: number;
  recentUsers: { id: string; name: string | null; email: string | null; role: string; createdAt: string }[];
}

interface DriverRow {
  id: string; name: string | null; totalQuotes: number; totalRevenue: number;
}

// ─── Helpers ──────────────────────────────────────────────────

function fmtShortDate(d: string) {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

function fmtChartLabel(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    confirmed:  { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Confirmado' },
    new:        { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Pendente' },
    completed:  { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Concluído' },
    cancelled:  { bg: 'bg-red-50',     text: 'text-red-500',     label: 'Cancelado' },
  };
  const c = cfg[status] ?? { bg: 'bg-gray-100', text: 'text-gray-500', label: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function RolePill({ role }: { role: string }) {
  const cfg: Record<string, string> = {
    driver: 'bg-blue-50 text-blue-700',
    admin: 'bg-purple-50 text-purple-700',
    passenger: 'bg-emerald-50 text-emerald-700',
  };
  const label: Record<string, string> = { driver: 'Taxista', admin: 'Admin', passenger: 'Passageiro' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg[role] ?? 'bg-gray-100 text-gray-500'}`}>
      {label[role] ?? role}
    </span>
  );
}

function Avatar({ name }: { name: string | null }) {
  const ch = (name || '?')[0].toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF8DC] text-[12px] font-bold text-[#C89000]">
      {ch}
    </div>
  );
}

// ─── Bar chart ────────────────────────────────────────────────

function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex items-end gap-1 h-28 w-full">
      {data.map((v, i) => {
        const h = Math.max(4, Math.round((v / max) * 100));
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{num(v)}</span>
            <div className="relative w-full flex items-end" style={{ height: '100px' }}>
              <div
                className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-80"
                style={{
                  height: `${h}%`,
                  background: 'linear-gradient(180deg, #F5B800 0%, #F5B80080 100%)',
                }}
              />
            </div>
            <span className="text-[9px] text-gray-400 whitespace-nowrap">{labels[i] ?? ''}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Quick access card ────────────────────────────────────────

function QuickCard({
  href, icon, label, value, sub, badge,
}: {
  href: string; icon: React.ReactNode; label: string; value?: string; sub?: string; badge?: number;
}) {
  return (
    <Link href={href} className="group flex flex-col gap-2 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-[#F5B800]/40 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF8DC] text-[#C89000]">
          {icon}
        </div>
        {badge != null && badge > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{badge}</span>
        )}
      </div>
      {value && <p className="text-[18px] font-bold text-[#0F1623] leading-none">{value}</p>}
      <div>
        <p className="text-[12px] font-semibold text-gray-700">{label}</p>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rideStats, setRideStats] = useState<RideStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, ridesRes, usersRes] = await Promise.all([
        fetch(apiUrl('/api/admin/stats'), { credentials: 'include' }),
        fetch(apiUrl('/api/admin/ride-requests?limit=5'), { credentials: 'include' }),
        fetch(apiUrl('/api/admin/users'), { credentials: 'include' }),
      ]);
      if (statsRes.status === 401) { window.location.href = '/admin/login'; return; }

      const statsJson = await statsRes.json();
      setStats(statsJson.data);

      if (ridesRes.ok) {
        const ridesJson = await ridesRes.json();
        const d = ridesJson.data ?? ridesJson;
        setRideStats({
          total: d.total ?? 0,
          byStatus: d.byStatus ?? {},
          sumPriceMin: d.sumPriceMin ?? null,
          sumPriceMax: d.sumPriceMax ?? null,
          recentRides: (d.rides ?? []).slice(0, 5),
        });
      }

      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        const users: { id: string; name: string | null; email: string | null; role: string; createdAt: string; totalQuotes: number }[] = usersJson.data ?? [];
        const driverList = users.filter((u) => u.role === 'driver');
        setUserStats({
          total: users.length,
          drivers: driverList.length,
          admins: users.filter((u) => u.role === 'admin').length,
          recentUsers: [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
        });
        setDrivers(
          driverList
            .map((u) => ({ id: u.id, name: u.name, totalQuotes: u.totalQuotes, totalRevenue: 0 }))
            .sort((a, b) => b.totalQuotes - a.totalQuotes)
            .slice(0, 5)
        );
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!stats) return;
    const id = window.setInterval(fetchAll, 60000);
    return () => window.clearInterval(id);
  }, [stats, fetchAll]);

  const chartData = useMemo(() => {
    if (!stats) return { data: [], labels: [] };
    const slice = stats.timeSeries.quotesPerDay.slice(-7);
    return {
      data: slice.map((d) => d.count),
      labels: slice.map((d) => fmtChartLabel(String(d.day))),
    };
  }, [stats]);

  const todayDelta = useMemo(() => {
    if (!stats) return 0;
    const { quotesToday, quotesYesterday } = stats.overview;
    if (!quotesYesterday) return 0;
    return ((quotesToday - quotesYesterday) / quotesYesterday) * 100;
  }, [stats]);

  const faturamentoEstimado = useMemo(() => {
    if (!rideStats?.sumPriceMin || !rideStats?.sumPriceMax) return null;
    return (rideStats.sumPriceMin + rideStats.sumPriceMax) / 2;
  }, [rideStats]);

  if (loading) return (
    <div className="p-8"><LoadingState label="Carregando dashboard..." /></div>
  );
  if (!stats) return (
    <div className="p-8 text-center text-red-500 text-sm">Erro ao carregar dados</div>
  );

  const { overview, quoteAverages, timeSeries, geography, recentActivity } = stats;
  const recentQuotes = recentActivity.quotes.slice(0, 5);
  const topDestinos = geography.topDestinations.slice(0, 5);
  const maxDestCount = Math.max(1, ...topDestinos.map((d) => d.count));

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#0F1623] leading-tight">Dashboard</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Visão geral do sistema</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Atualizar
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-[#F5B800] px-4 py-2 text-[12px] font-semibold text-[#0F1623] hover:bg-[#e0a900] transition-colors shadow-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar relatório
          </button>
        </div>
      </div>

      {/* KPI Row — 6 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label="Usuários ativos"
          value={num(userStats?.total ?? 0)}
          color="blue"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          sub={`${userStats?.drivers ?? 0} taxistas`}
        />
        <KpiCard
          label="Novos usuários"
          value={num(overview.sessionsToday)}
          color="purple"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>}
          sub="sessões hoje"
        />
        <KpiCard
          label="Cotações realizadas"
          value={num(overview.quotesLast7)}
          trend={todayDelta}
          trendLabel=" vs ontem"
          color="yellow"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
        />
        <KpiCard
          label="Agendamentos"
          value={num(rideStats?.total ?? 0)}
          color="green"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          sub={`${rideStats?.byStatus?.confirmed ?? 0} confirmados`}
        />
        <KpiCard
          label="Corridas concluídas"
          value={num(rideStats?.byStatus?.completed ?? 0)}
          color="blue"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h8l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/></svg>}
        />
        <KpiCard
          label="Faturamento taxistas"
          value={faturamentoEstimado != null ? money(faturamentoEstimado) : money(quoteAverages.recommendedPrice)}
          color="green"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          sub="estimado agendamentos"
        />
      </div>

      {/* Main content — charts + top destinos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Cotações por dia — large */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F1623]">Cotações por dia</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Últimos 7 dias</p>
            </div>
            <span className="rounded-lg bg-[#FFF8DC] px-2.5 py-1 text-[11px] font-semibold text-[#C89000]">Últimos 7 dias</span>
          </div>
          {chartData.data.length > 0 ? (
            <BarChart data={chartData.data} labels={chartData.labels} />
          ) : (
            <EmptyState title="Sem dados" />
          )}
        </div>

        {/* Cotações por região / breakdowns */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-bold text-[#0F1623]">Top origens</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Regiões mais cotadas</p>
          </div>
          <div className="space-y-3">
            {geography.topOrigins.slice(0, 5).length === 0 ? (
              <EmptyState title="Sem dados" />
            ) : (() => {
              const items = geography.topOrigins.slice(0, 5);
              const maxC = Math.max(1, ...items.map((o) => o.count));
              const total = items.reduce((s, o) => s + o.count, 0);
              return items.map((o, i) => {
                const pct = Math.round((o.count / maxC) * 100);
                const pctLabel = Math.round((o.count / total) * 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-gray-600 truncate max-w-[65%]">{o.origin || '(sem endereço)'}</span>
                      <span className="text-[11px] font-bold text-[#0F1623]">{pctLabel}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#F5B800]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Top destinos */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F1623]">Top destinos</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Mais cotados</p>
            </div>
          </div>
          <div className="space-y-1">
            {topDestinos.length === 0 ? (
              <EmptyState title="Sem dados" />
            ) : (
              topDestinos.map((d, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#FFF8DC] text-[11px] font-bold text-[#C89000]">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-gray-700 truncate">{d.destination || '(sem endereço)'}</p>
                    <div className="mt-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#F5B800]/60" style={{ width: `${Math.round((d.count / maxDestCount) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-[12px] font-bold text-[#0F1623] shrink-0">{num(d.count)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total cotado', value: money(quoteAverages.sumRecommendedPrice), highlight: true },
          { label: 'Taxímetro médio', value: money(quoteAverages.recommendedPrice) },
          { label: 'Distância média', value: quoteAverages.distanceKm ? `${quoteAverages.distanceKm.toFixed(1)} km` : '—' },
          { label: 'Ticket médio taxistas', value: money(quoteAverages.recommendedPrice) },
          { label: 'Lucro médio taxistas', value: money(quoteAverages.profit) },
          { label: 'Margem média', value: quoteAverages.margin ? `${quoteAverages.margin.toFixed(0)}%` : '—' },
        ].map((m) => (
          <div key={m.label} className={`rounded-2xl border shadow-sm p-4 ${'highlight' in m && m.highlight ? 'bg-[#FFF8DC] border-[#F5B800]/40' : 'bg-white border-gray-100'}`}>
            <p className="text-[11px] text-gray-500 mb-1.5">{m.label}</p>
            <p className={`text-[18px] font-bold ${'highlight' in m && m.highlight ? 'text-[#C89000]' : 'text-[#0F1623]'}`}>{m.value}</p>
            <p className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="18 15 12 9 6 15"/></svg>
              dados reais
            </p>
          </div>
        ))}
      </div>

      {/* Cotações recentes + Usuários recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Cotações recentes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F1623]">Cotações recentes</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Últimas cotações realizadas</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Origem → Destino</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Dist.</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotes.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[12px] text-gray-400">Nenhuma cotação recente</td></tr>
                ) : recentQuotes.map((q, i) => (
                  <tr key={q.id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="text-[12px] font-medium text-gray-700 truncate max-w-[180px]">{q.originAddress || '(origem)'}</p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[180px]">→ {q.destinationAddress || '(destino)'}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">{q.distanceKm?.toFixed(1)} km</td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-bold text-[#0F1623]">{money(q.recommendedPrice)}</span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">{fmtShortDate(q.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-50">
            <Link href="/admin/cotacoes" className="text-[12px] font-semibold text-[#C89000] hover:text-[#F5B800] transition-colors">
              Ver todas cotações →
            </Link>
          </div>
        </div>

        {/* Usuários recentes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F1623]">Usuários recentes</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Últimos cadastros</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {(userStats?.recentUsers ?? []).length === 0 ? (
                  <tr><td colSpan={3} className="py-8 text-center text-[12px] text-gray-400">Nenhum usuário</td></tr>
                ) : userStats!.recentUsers.map((u, i) => (
                  <tr key={u.id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} />
                        <span className="text-[12px] font-medium text-gray-700">{u.name || <span className="text-gray-400">Sem nome</span>}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RolePill role={u.role} /></td>
                    <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">{fmtShortDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-50">
            <Link href="/admin/usuarios" className="text-[12px] font-semibold text-[#C89000] hover:text-[#F5B800] transition-colors">
              Ver todos usuários →
            </Link>
          </div>
        </div>
      </div>

      {/* Agendamentos próximos + Desempenho taxistas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Agendamentos próximos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100">
            <h3 className="text-[14px] font-bold text-[#0F1623]">Agendamentos próximos</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Corridas agendadas recentes</p>
          </div>
          <div className="divide-y divide-gray-50">
            {(rideStats?.recentRides ?? []).length === 0 ? (
              <div className="py-10 text-center text-[12px] text-gray-400">Nenhum agendamento</div>
            ) : rideStats!.recentRides.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF8DC] text-[11px] font-bold text-[#C89000]">
                  {r.scheduledAt ? new Date(r.scheduledAt).getHours().toString().padStart(2, '0') + ':' + new Date(r.scheduledAt).getMinutes().toString().padStart(2, '0') : '—'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-700 truncate">
                    {r.originAddress || '(origem)'} → {r.destinationAddress || '(destino)'}
                  </p>
                  <p className="text-[11px] text-gray-400">{r.passengerName || 'Passageiro'}</p>
                </div>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-50">
            <Link href="/admin/corridas-agendadas" className="text-[12px] font-semibold text-[#C89000] hover:text-[#F5B800] transition-colors">
              Ver todos agendamentos →
            </Link>
          </div>
        </div>

        {/* Desempenho taxistas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100">
            <h3 className="text-[14px] font-bold text-[#0F1623]">Desempenho dos taxistas</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Ranking por cotações realizadas</p>
          </div>
          <div className="divide-y divide-gray-50">
            {drivers.length === 0 ? (
              <div className="py-10 text-center text-[12px] text-gray-400">Nenhum taxista cadastrado</div>
            ) : (() => {
              const maxQ = Math.max(1, ...drivers.map((d) => d.totalQuotes));
              return drivers.map((d, i) => (
                <div key={d.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                  <Avatar name={d.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium text-gray-700 truncate">{d.name || 'Sem nome'}</span>
                      <span className="text-[11px] font-bold text-[#0F1623] shrink-0 ml-2">{num(d.totalQuotes)} corridas</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((d.totalQuotes / maxQ) * 100)}%`,
                          background: i === 0 ? '#F5B800' : i === 1 ? '#60A5FA' : i === 2 ? '#34D399' : '#A78BFA',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
          <div className="px-5 py-3 border-t border-gray-50">
            <Link href="/admin/taxistas" className="text-[12px] font-semibold text-[#C89000] hover:text-[#F5B800] transition-colors">
              Ver todos taxistas →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick access grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <QuickCard
          href="/admin/avaliacoes"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          label="Avaliações"
          value={overview.avgRating ? `${overview.avgRating.toFixed(1)} ★` : '—'}
          sub={`${num(overview.totalFeedback)} feedbacks`}
        />
        <QuickCard
          href="/admin/notificacoes"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
          label="Notificações"
          sub="mensagens"
        />
        <QuickCard
          href="/admin/suporte"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
          label="Suporte"
          sub="chamados abertos"
        />
        <QuickCard
          href="/admin/parceiros"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 11l-4 4-2-2"/></svg>}
          label="Parceiros"
          value={num(overview.totalPartners)}
          sub="parceiros ativos"
        />
        <QuickCard
          href="/admin/financeiro"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          label="Financeiro"
          value={faturamentoEstimado != null ? money(faturamentoEstimado) : '—'}
          sub="faturamento estimado"
        />
        <QuickCard
          href="/admin/cotacoes"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          label="Cotações"
          value={num(overview.totalQuotes)}
          sub="total de cotações"
        />
        <QuickCard
          href="/admin/corridas-agendadas"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          label="Corridas Agendadas"
          value={num(rideStats?.total ?? 0)}
          sub={`${rideStats?.byStatus?.confirmed ?? 0} confirmadas`}
        />
        <QuickCard
          href="/admin/metas-desafios"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
          label="Metas e Desafios"
          sub="desafios ativos"
        />
        <QuickCard
          href="/admin/planos-assinaturas"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
          label="Planos e Assinaturas"
          sub="assinaturas ativas"
        />
        <QuickCard
          href="/admin/relatorios"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
          label="Relatórios"
          sub="relatórios gerados"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 pb-1 border-t border-gray-100">
        <p className="text-[11px] text-gray-400">Táxi Combinado Admin — Todos os direitos reservados</p>
        <p className="text-[11px] text-gray-400">Versão 1.0.0</p>
      </div>
    </div>
  );
}
