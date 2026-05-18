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
  overview: { totalQuotes: number; totalPartners: number };
}

export default function FinanceiroPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/stats'), { credentials: 'include' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      setStats(json.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const faturamento = stats
    ? (stats.quoteAverages.recommendedPrice ?? 0) * (stats.overview.totalQuotes ?? 0)
    : null;
  const custoTotal = stats
    ? (stats.quoteAverages.totalCost ?? 0) * (stats.overview.totalQuotes ?? 0)
    : null;
  const sobraTotal = faturamento && custoTotal ? faturamento - custoTotal : null;

  const priceData = stats?.timeSeries.avgPricePerDay.slice(-14).map((d) => d.avg_price) ?? [];
  const profitData = stats?.timeSeries.avgPricePerDay.slice(-14).map((d) => d.avg_profit) ?? [];

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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
              label="Faturamento estimado"
              value={money(faturamento)}
              color="yellow"
              icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            />
            <KpiCard
              label="Custo estimado"
              value={money(custoTotal)}
              color="red"
            />
            <KpiCard
              label="Sobra total estimada"
              value={money(sobraTotal)}
              color="green"
            />
            <KpiCard
              label="Ticket médio"
              value={money(stats?.quoteAverages.recommendedPrice)}
              color="blue"
              sub={`Margem: ${stats?.quoteAverages.margin?.toFixed(0) ?? '—'}%`}
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
