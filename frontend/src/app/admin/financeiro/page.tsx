'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import {
  PageHeader, KpiCard, Card, EmptyState, LoadingState,
  Table, Th, Td, Tr, MiniLineChart,
  fmtDay, money, num,
} from '../_components';

interface AdminStats {
  quoteAverages: {
    recommendedPrice: number | null; totalCost: number | null; profit: number | null; margin: number | null;
  };
  timeSeries: {
    avgPricePerDay: { day: string; avg_price: number; avg_cost: number; avg_profit: number }[];
  };
  overview: { totalQuotes: number; totalPartners: number; quotesLast30?: number };
}

interface RideRequestStats {
  byStatus: Record<string, number>;
  sumPriceMin: number | null;
  sumPriceMax: number | null;
  avgPriceMin: number | null;
  avgPriceMax: number | null;
}

const COMMISSION_RATE = 0.05; // 5% estimated platform commission

export default function FinanceiroPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rideStats, setRideStats] = useState<RideRequestStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ridesRes] = await Promise.all([
        fetch(apiUrl('/api/admin/stats'), { credentials: 'include' }),
        fetch(apiUrl('/api/admin/ride-requests?limit=1'), { credentials: 'include' }),
      ]);
      if (statsRes.status === 401) { window.location.href = '/admin/login'; return; }
      const statsJson = await statsRes.json();
      setStats(statsJson.data);
      if (ridesRes.ok) {
        const ridesJson = await ridesRes.json();
        const d = ridesJson.data ?? ridesJson;
        setRideStats({
          byStatus: d.byStatus ?? {},
          sumPriceMin: d.sumPriceMin ?? null,
          sumPriceMax: d.sumPriceMax ?? null,
          avgPriceMin: d.avgPriceMin ?? null,
          avgPriceMax: d.avgPriceMax ?? null,
        });
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const last30days = stats?.timeSeries.avgPricePerDay ?? [];

  const priceData = stats?.timeSeries.avgPricePerDay.slice(-14).map((d) => d.avg_price) ?? [];
  const profitData = stats?.timeSeries.avgPricePerDay.slice(-14).map((d) => d.avg_profit) ?? [];

  const completedRides = rideStats?.byStatus?.completed ?? 0;
  const totalRides = Object.values(rideStats?.byStatus ?? {}).reduce((a, b) => a + b, 0);
  const rideValueMin = rideStats?.sumPriceMin ?? null;
  const rideValueMax = rideStats?.sumPriceMax ?? null;
  const commissionMin = rideValueMin != null ? rideValueMin * COMMISSION_RATE : null;
  const commissionMax = rideValueMax != null ? rideValueMax * COMMISSION_RATE : null;

  function moneyRange(min: number | null, max: number | null) {
    if (min == null || max == null) return '—';
    if (Math.abs(min - max) < 0.01) return money(min);
    return `${money(min)} – ${money(max)}`;
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Financeiro"
        subtitle="Visão financeira estimada da plataforma (valores calculados, não recebidos)"
      />

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#C89000" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="text-[12px] text-amber-700">Estes valores são <strong>estimados</strong> com base nas cotações. Pagamentos não passam obrigatoriamente pela plataforma.</p>
          </div>

          {/* Corridas agendadas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <KpiCard
              label="Valor das corridas agendadas"
              value={moneyRange(rideValueMin, rideValueMax)}
              color="yellow"
              sub={`${num(totalRides)} corrida${totalRides !== 1 ? 's' : ''} · ${num(completedRides)} concluída${completedRides !== 1 ? 's' : ''}`}
              icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            />
            <KpiCard
              label="Comissão estimada (5%)"
              value={moneyRange(commissionMin, commissionMax)}
              color="green"
              sub="Sobre total das corridas agendadas"
              icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
              label="Ticket médio (cotações)"
              value={money(stats?.quoteAverages.recommendedPrice)}
              color="yellow"
              sub={`Margem: ${stats?.quoteAverages.margin?.toFixed(0) ?? '—'}%`}
              icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            />
            <KpiCard
              label="Custo médio (cotações)"
              value={money(stats?.quoteAverages.totalCost)}
              color="red"
              sub="Custo médio por cotação"
            />
            <KpiCard
              label="Sobra média (cotações)"
              value={money(stats?.quoteAverages.profit)}
              color="green"
              sub="Sobra média por cotação"
            />
            <KpiCard
              label="Total cotações (30 dias)"
              value={num(stats?.overview.quotesLast30 ?? 0)}
              color="blue"
              sub={`Últimas ${last30days.length} dias c/ dados`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card title="Preço médio por dia" subtitle="Últimos 14 dias">
              <div className="mt-3">
                {priceData.length > 1 ? (
                  <div>
                    <MiniLineChart data={priceData} color="#F5B800" height={80} />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">{stats?.timeSeries.avgPricePerDay.slice(-14)[0] ? fmtDay(stats.timeSeries.avgPricePerDay.slice(-14)[0].day) : ''}</span>
                      <span className="text-[11px] text-gray-400">{stats?.timeSeries.avgPricePerDay.slice(-1)[0] ? fmtDay(stats.timeSeries.avgPricePerDay.slice(-1)[0].day) : ''}</span>
                    </div>
                  </div>
                ) : (
                  <EmptyState title="Dados insuficientes" />
                )}
              </div>
            </Card>
            <Card title="Sobra média por dia" subtitle="Últimos 14 dias">
              <div className="mt-3">
                {profitData.length > 1 ? (
                  <MiniLineChart data={profitData} color="#16A34A" height={80} />
                ) : (
                  <EmptyState title="Dados insuficientes" />
                )}
              </div>
            </Card>
          </div>

          <Card title="Resumo por período" subtitle="Visão geral dos últimos dias">
            {stats?.timeSeries.avgPricePerDay.length === 0 ? (
              <EmptyState title="Sem dados" />
            ) : (
              <Table className="mt-3">
                <thead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Preço médio</Th>
                    <Th>Custo médio</Th>
                    <Th>Sobra média</Th>
                  </tr>
                </thead>
                <tbody>
                  {[...(stats?.timeSeries.avgPricePerDay ?? [])].reverse().slice(0, 14).map((d) => (
                    <Tr key={d.day}>
                      <Td className="font-medium">{fmtDay(d.day)}</Td>
                      <Td className="text-[#C89000] font-semibold">{money(d.avg_price)}</Td>
                      <Td className="text-red-500">{money(d.avg_cost)}</Td>
                      <Td className={d.avg_profit > 0 ? 'text-emerald-600 font-semibold' : 'text-red-500'}>{money(d.avg_profit)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
