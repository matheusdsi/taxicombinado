'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import {
  PageHeader, KpiCard, Card, Btn, LoadingState, EmptyState,
  Table, Th, Td, Tr, FilterBar, FilterChip, Select,
  fmtDay, money, num,
} from '../_components';

interface AdminStats {
  overview: { totalQuotes: number };
  timeSeries: {
    quotesPerDay: { day: string; count: number }[];
    avgPricePerDay: { day: string; avg_price: number; avg_cost: number; avg_profit: number }[];
  };
  geography: {
    topOrigins: { origin: string; count: number }[];
    topDestinations: { destination: string; count: number }[];
  };
  breakdowns: {
    tripType: { tripType: string; count: number; percent: number }[];
    priceRanges: { range: string; count: number }[];
    distanceRanges: { range: string; count: number }[];
  };
}

const TRIP_LABEL: Record<string, string> = {
  one_way: 'Só ida', round_trip: 'Ida e volta', empty_return: 'Volta vazia',
};

const REPORT_TYPES = [
  { id: 'quotas_period', label: 'Cotações por período' },
  { id: 'quotas_category', label: 'Cotações por categoria' },
  { id: 'quotas_flag', label: 'Cotações por bandeira' },
  { id: 'routes', label: 'Rotas mais calculadas' },
  { id: 'trip_type', label: 'Por tipo de corrida' },
  { id: 'price_ranges', label: 'Faixas de preço' },
  { id: 'distance_ranges', label: 'Faixas de distância' },
];

export default function RelatoriosPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('quotas_period');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl('/api/admin/stats'), { credentials: 'include' });
        if (res.status === 401) { window.location.href = '/admin/login'; return; }
        const json = await res.json();
        setStats(json.data);
      } catch { /* silent */ } finally { setLoading(false); }
    }
    load();
  }, []);

  function exportCSV(data: Record<string, string | number>[], filename: string) {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((r) => Object.values(r).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Relatórios"
        subtitle="Exportar e visualizar relatórios da operação"
      />

      {loading ? <LoadingState /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Cotações totais" value={num(stats?.overview.totalQuotes)} color="blue" />
            <KpiCard label="Dias com dados" value={num(stats?.timeSeries.quotesPerDay.length)} color="yellow" />
            <KpiCard label="Origens distintas" value={num(stats?.geography.topOrigins.length)} color="green" />
            <KpiCard label="Destinos distintos" value={num(stats?.geography.topDestinations.length)} color="purple" />
          </div>

          {/* Seletor de relatório */}
          <div className="mb-5 flex flex-wrap gap-2">
            {REPORT_TYPES.map((r) => (
              <FilterChip key={r.id} label={r.label} active={activeReport === r.id} onClick={() => setActiveReport(r.id)} />
            ))}
          </div>

          {/* Cotações por período */}
          {activeReport === 'quotas_period' && (
            <Card
              title="Cotações por período"
              action={
                <Btn size="sm" variant="ghost" onClick={() => exportCSV(
                  stats?.timeSeries.quotesPerDay.map((d) => ({ data: fmtDay(d.day), cotacoes: d.count })) ?? [],
                  'cotacoes_por_dia'
                )}>
                  Exportar CSV
                </Btn>
              }
              noPad
            >
              <Table>
                <thead><tr>
                  <Th>Data</Th>
                  <Th>Cotações</Th>
                  <Th>Preço médio</Th>
                  <Th>Custo médio</Th>
                  <Th>Sobra média</Th>
                </tr></thead>
                <tbody>
                  {[...(stats?.timeSeries.quotesPerDay ?? [])].reverse().map((d, i) => {
                    const priceDay = stats?.timeSeries.avgPricePerDay.find((p) => p.day === d.day);
                    return (
                      <Tr key={d.day}>
                        <Td className="font-medium">{fmtDay(d.day)}</Td>
                        <Td><span className="font-bold">{num(d.count)}</span></Td>
                        <Td>{priceDay ? <span className="text-[#C89000] font-semibold">{money(priceDay.avg_price)}</span> : '—'}</Td>
                        <Td>{priceDay ? <span className="text-red-500">{money(priceDay.avg_cost)}</span> : '—'}</Td>
                        <Td>{priceDay ? <span className={priceDay.avg_profit > 0 ? 'text-emerald-600 font-semibold' : 'text-red-500'}>{money(priceDay.avg_profit)}</span> : '—'}</Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card>
          )}

          {/* Por tipo de corrida */}
          {activeReport === 'trip_type' && (
            <Card
              title="Por tipo de corrida"
              action={
                <Btn size="sm" variant="ghost" onClick={() => exportCSV(
                  stats?.breakdowns.tripType.map((t) => ({ tipo: TRIP_LABEL[t.tripType] ?? t.tripType, cotacoes: t.count, percentual: `${t.percent?.toFixed(1) ?? 0}%` })) ?? [],
                  'tipo_corrida'
                )}>Exportar CSV</Btn>
              }
              noPad
            >
              <Table>
                <thead><tr><Th>Tipo</Th><Th>Cotações</Th><Th>Percentual</Th></tr></thead>
                <tbody>
                  {stats?.breakdowns.tripType.map((t) => (
                    <Tr key={t.tripType}>
                      <Td className="font-medium">{TRIP_LABEL[t.tripType] ?? t.tripType}</Td>
                      <Td><span className="font-bold">{num(t.count)}</span></Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-[120px] h-2 rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-[#F5B800]" style={{ width: `${t.percent ?? 0}%` }} />
                          </div>
                          <span className="text-[12px] text-gray-600">{t.percent?.toFixed(1) ?? 0}%</span>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}

          {/* Faixas de preço */}
          {activeReport === 'price_ranges' && (
            <Card
              title="Faixas de preço"
              action={
                <Btn size="sm" variant="ghost" onClick={() => exportCSV(
                  stats?.breakdowns.priceRanges.map((r) => ({ faixa: r.range, cotacoes: r.count })) ?? [],
                  'faixas_preco'
                )}>Exportar CSV</Btn>
              }
              noPad
            >
              <Table>
                <thead><tr><Th>Faixa de preço</Th><Th>Cotações</Th><Th>Distribuição</Th></tr></thead>
                <tbody>
                  {stats?.breakdowns.priceRanges.map((r) => {
                    const total = stats.breakdowns.priceRanges.reduce((s, x) => s + x.count, 0);
                    const pct = total ? Math.round((r.count / total) * 100) : 0;
                    return (
                      <Tr key={r.range}>
                        <Td className="font-medium">{r.range}</Td>
                        <Td><span className="font-bold">{num(r.count)}</span></Td>
                        <Td>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-[120px] h-2 rounded-full bg-gray-100">
                              <div className="h-full rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[12px] text-gray-600">{pct}%</span>
                          </div>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card>
          )}

          {/* Rotas mais calculadas */}
          {activeReport === 'routes' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="Top origens" action={
                <Btn size="sm" variant="ghost" onClick={() => exportCSV(stats?.geography.topOrigins.map((o) => ({ origem: o.origin, cotacoes: o.count })) ?? [], 'top_origens')}>CSV</Btn>
              } noPad>
                <Table>
                  <thead><tr><Th>#</Th><Th>Origem</Th><Th>Cotações</Th></tr></thead>
                  <tbody>
                    {stats?.geography.topOrigins.slice(0, 10).map((o, i) => (
                      <Tr key={i}>
                        <Td className="text-gray-400 font-medium">{i + 1}</Td>
                        <Td>{o.origin || '—'}</Td>
                        <Td><span className="font-bold">{num(o.count)}</span></Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
              <Card title="Top destinos" action={
                <Btn size="sm" variant="ghost" onClick={() => exportCSV(stats?.geography.topDestinations.map((d) => ({ destino: d.destination, cotacoes: d.count })) ?? [], 'top_destinos')}>CSV</Btn>
              } noPad>
                <Table>
                  <thead><tr><Th>#</Th><Th>Destino</Th><Th>Cotações</Th></tr></thead>
                  <tbody>
                    {stats?.geography.topDestinations.slice(0, 10).map((d, i) => (
                      <Tr key={i}>
                        <Td className="text-gray-400 font-medium">{i + 1}</Td>
                        <Td>{d.destination || '—'}</Td>
                        <Td><span className="font-bold">{num(d.count)}</span></Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            </div>
          )}

          {/* Demais relatórios — fallback */}
          {!['quotas_period', 'trip_type', 'price_ranges', 'routes'].includes(activeReport) && (
            <Card>
              <EmptyState
                title="Relatório em desenvolvimento"
                description="Este relatório específico será implementado em breve com mais dados disponíveis."
                icon={<svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
