'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import { formatCurrencyBRL } from '@/lib/formatters';
import {
  PageHeader, KpiCard, Card, Btn, Table, Th, Td, Tr,
  EmptyState, LoadingState, CategoryBadge, FlagBadge, TripTypeBadge, StatusBadge,
  Select, Modal, StatRow, Pagination, FilterBar, FilterChip,
  fmtDate, money, num,
} from '../_components';

interface QuoteRow {
  id: string; createdAt: string; originAddress?: string; destinationAddress?: string;
  tripType: string; distanceKm: number; totalDistanceKm?: number; recommendedPrice: number;
  farePrice?: number; totalCost: number; profit: number; margin: number; fuelType: string;
  routeMode: string; desiredMarginPercent?: number; flagMultiplier?: number;
  baseFare?: number; pricePerKm?: number; tollTotal?: number; parkingCost?: number;
  extraCosts?: number; fuelCost?: number; estimatedMinutes?: number; trafficMinutes?: number;
}

interface QuotesResponse {
  quotes: QuoteRow[];
  total: number;
  totalPages: number;
}

const TRIP_LABEL: Record<string, string> = {
  one_way: 'Só ida', round_trip: 'Ida e volta', empty_return: 'Volta vazia',
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

export default function CotacoesPage() {
  const [quotesData, setQuotesData] = useState<QuotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'today'>('all');
  const [bandFilter, setBandFilter] = useState<'all' | 'b1' | 'b2'>('all');
  const [catFilter, setCatFilter] = useState<'all' | 'comum' | 'luxo' | 'executivo'>('all');
  const [tripFilter, setTripFilter] = useState<'all' | 'one_way' | 'round_trip' | 'empty_return'>('all');
  const [selected, setSelected] = useState<QuoteRow | null>(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        apiUrl(`/api/admin/quotes?page=${page}&limit=25&filter=${filter}`),
        { credentials: 'include' }
      );
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      setQuotesData(json.data ?? null);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const filteredQuotes = useMemo(() => {
    if (!quotesData) return [];
    return quotesData.quotes.filter((q) => {
      if (bandFilter === 'b1' && detectFlag(q) !== 1) return false;
      if (bandFilter === 'b2' && detectFlag(q) !== 2) return false;
      if (catFilter !== 'all' && detectCategory(q) !== catFilter) return false;
      if (tripFilter !== 'all' && q.tripType !== tripFilter) return false;
      return true;
    });
  }, [quotesData, bandFilter, catFilter, tripFilter]);

  const stats = useMemo(() => {
    if (!quotesData) return null;
    const qs = quotesData.quotes;
    return {
      total: quotesData.total,
      today: qs.filter((q) => new Date(q.createdAt).toDateString() === new Date().toDateString()).length,
      avgTicket: qs.length ? qs.reduce((s, q) => s + q.recommendedPrice, 0) / qs.length : 0,
      avgProfit: qs.length ? qs.reduce((s, q) => s + q.profit, 0) / qs.length : 0,
      avgDist: qs.length ? qs.reduce((s, q) => s + q.distanceKm, 0) / qs.length : 0,
      withToll: qs.filter((q) => (q.tollTotal ?? 0) > 0).length,
      withExtra: qs.filter((q) => (q.extraCosts ?? 0) > 0).length,
    };
  }, [quotesData]);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Cotações" subtitle="Auditoria completa de todas as cotações realizadas" />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
          <KpiCard label="Total" value={num(stats.total)} color="blue" />
          <KpiCard label="Hoje" value={num(stats.today)} color="yellow" />
          <KpiCard label="Ticket médio" value={money(stats.avgTicket)} color="green" />
          <KpiCard label="Sobra média" value={money(stats.avgProfit)} color="green" />
          <KpiCard label="Dist. média" value={`${stats.avgDist.toFixed(1)} km`} color="default" />
          <KpiCard label="Com pedágio" value={num(stats.withToll)} color="default" />
          <KpiCard label="Com extra" value={num(stats.withExtra)} color="default" />
        </div>
      )}

      <Card noPad>
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'today'] as const).map((f) => (
              <FilterChip key={f} label={f === 'all' ? 'Todas' : 'Hoje'} active={filter === f} onClick={() => { setFilter(f); setPage(1); }} />
            ))}
          </div>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'b1', 'b2'] as const).map((f) => (
              <FilterChip key={f} label={f === 'all' ? 'Todas bandeiras' : `Band. ${f[1]}`} active={bandFilter === f} onClick={() => setBandFilter(f)} />
            ))}
          </div>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'comum', 'luxo', 'executivo'] as const).map((f) => (
              <FilterChip key={f} label={f === 'all' ? 'Todas categ.' : f.charAt(0).toUpperCase() + f.slice(1)} active={catFilter === f} onClick={() => setCatFilter(f)} />
            ))}
          </div>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'one_way', 'round_trip', 'empty_return'] as const).map((f) => (
              <FilterChip key={f} label={TRIP_LABEL[f] ?? 'Todos'} active={tripFilter === f} onClick={() => setTripFilter(f)} />
            ))}
          </div>
          <span className="ml-auto text-[12px] text-gray-400">{filteredQuotes.length} cotações</span>
        </div>

        {loading ? (
          <LoadingState />
        ) : filteredQuotes.length === 0 ? (
          <EmptyState title="Nenhuma cotação encontrada" description="Tente ajustar os filtros." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Rota</Th>
                  <Th>Tipo</Th>
                  <Th>Dist.</Th>
                  <Th>Pedágio</Th>
                  <Th>Extra</Th>
                  <Th>Preço final</Th>
                  <Th>Sobra</Th>
                  <Th>Data</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((q) => (
                  <Tr key={q.id} onClick={() => setSelected(q)}>
                    <Td>
                      <div className="max-w-[220px]">
                        <p className="text-[12px] font-medium text-[#0F1623] truncate">{q.originAddress || '(origem)'}</p>
                        <p className="text-[11px] text-gray-400 truncate">→ {q.destinationAddress || '(destino)'}</p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1">
                          <CategoryBadge category={detectCategory(q)} />
                          <FlagBadge flag={detectFlag(q)} />
                        </div>
                        <TripTypeBadge type={q.tripType} />
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-[12px] text-gray-600">{q.distanceKm.toFixed(1)} km</Td>
                    <Td>
                      {(q.tollTotal ?? 0) > 0 ? (
                        <span className="text-[12px] font-medium text-orange-600">{money(q.tollTotal)}</span>
                      ) : (
                        <span className="text-[11px] text-gray-300">—</span>
                      )}
                    </Td>
                    <Td>
                      {(q.extraCosts ?? 0) > 0 ? (
                        <span className="text-[12px] font-medium text-purple-600">{money(q.extraCosts)}</span>
                      ) : (
                        <span className="text-[11px] text-gray-300">—</span>
                      )}
                    </Td>
                    <Td>
                      <span className="font-bold text-[15px] text-[#0F1623]">{money(q.recommendedPrice)}</span>
                    </Td>
                    <Td>
                      <span className={`text-[13px] font-semibold ${q.profit > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {money(q.profit)}
                      </span>
                    </Td>
                    <Td className="text-[11px] text-gray-400 whitespace-nowrap">{fmtDate(q.createdAt)}</Td>
                    <Td>
                      <Btn size="sm" variant="ghost">Detalhe</Btn>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <div className="px-5 pb-5">
              <Pagination page={page} total={quotesData?.totalPages ?? 1} onPage={(p) => { setPage(p); }} />
            </div>
          </>
        )}
      </Card>

      {/* Modal detalhe da cotação */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalhes da cotação" wide>
        {selected && (
          <div>
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-gray-100">
              <CategoryBadge category={detectCategory(selected)} />
              <FlagBadge flag={detectFlag(selected)} />
              <TripTypeBadge type={selected.tripType} />
              {(selected.tollTotal ?? 0) > 0 && (
                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-orange-50 text-orange-700">Pedágio</span>
              )}
              {(selected.extraCosts ?? 0) > 0 && (
                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-purple-50 text-purple-700">Extra manual</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              {/* Rota */}
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Rota</h4>
                <StatRow label="Origem" value={<span className="text-right block max-w-[200px] text-[12px]">{selected.originAddress || '—'}</span>} />
                <StatRow label="Destino" value={<span className="text-right block max-w-[200px] text-[12px]">{selected.destinationAddress || '—'}</span>} />
                <StatRow label="Data/hora" value={fmtDate(selected.createdAt)} />
                <StatRow label="Distância original" value={`${selected.distanceKm.toFixed(1)} km`} />
                <StatRow label="Distância considerada" value={selected.totalDistanceKm ? `${selected.totalDistanceKm.toFixed(1)} km` : '—'} />
                {selected.estimatedMinutes && <StatRow label="Tempo normal" value={`${Math.round(selected.estimatedMinutes)} min`} />}
                {selected.trafficMinutes && <StatRow label="Tempo com trânsito" value={`${Math.round(selected.trafficMinutes)} min`} />}
              </div>

              {/* Valores */}
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Decomposição do valor</h4>
                <StatRow label="Bandeirada base" value={money(selected.baseFare)} />
                <StatRow label="Valor por km" value={selected.pricePerKm ? `R$ ${selected.pricePerKm.toFixed(2)}/km` : '—'} />
                <StatRow label="Taxímetro base" value={money(selected.farePrice)} />
                <StatRow label="Pedágio" value={money(selected.tollTotal)} />
                <StatRow label="Extra manual" value={money(selected.extraCosts)} />
                <StatRow label="Custo combustível" value={money(selected.fuelCost)} />
                <StatRow label="Custo total" value={money(selected.totalCost)} />
                <StatRow
                  label="Sobra estimada"
                  value={<span className={selected.profit > 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>{money(selected.profit)}</span>}
                />
                <StatRow label="Margem" value={`${selected.margin?.toFixed(0) ?? '—'}%`} />
              </div>
            </div>

            {/* Bloco "Como chegamos nesse valor" */}
            <div className="mt-5 rounded-2xl bg-[#FFFBEA] border border-[#F5B800]/30 p-4">
              <p className="text-[11px] font-bold text-[#C89000] uppercase tracking-wider mb-3">Como chegamos nesse valor</p>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">1. Bandeirada</span>
                  <span className="font-semibold">{money(selected.baseFare)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">2. Km rodado ({selected.distanceKm.toFixed(1)} km × {selected.pricePerKm ? `R$ ${selected.pricePerKm.toFixed(2)}` : '—'})</span>
                  <span className="font-semibold">{selected.farePrice && selected.baseFare ? money(selected.farePrice - selected.baseFare) : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">3. Pedágio</span>
                  <span className="font-semibold">{money(selected.tollTotal ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">4. Extra manual</span>
                  <span className="font-semibold">{money(selected.extraCosts ?? 0)}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-[#F5B800]/30 flex items-center justify-between">
                  <span className="font-bold text-[#0F1623]">Total</span>
                  <span className="font-bold text-[17px] text-[#C89000]">{money(selected.recommendedPrice)}</span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="mt-5 flex flex-wrap gap-2">
              {selected.originAddress && selected.destinationAddress && (
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(
                    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selected.originAddress!)}&destination=${encodeURIComponent(selected.destinationAddress!)}`,
                    '_blank'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Ver no Maps
                  </span>
                </Btn>
              )}
              <Btn
                variant="ghost"
                size="sm"
                onClick={() => {
                  const text = [
                    `Cotação #${selected.id.slice(0, 8)}`,
                    `Origem: ${selected.originAddress || '—'}`,
                    `Destino: ${selected.destinationAddress || '—'}`,
                    `Categoria: ${detectCategory(selected)} | Bandeira ${detectFlag(selected)} | ${TRIP_LABEL[selected.tripType] ?? selected.tripType}`,
                    `Distância: ${selected.distanceKm.toFixed(1)} km`,
                    `Pedágio: ${money(selected.tollTotal)}`,
                    `Extra: ${money(selected.extraCosts)}`,
                    `Preço final: ${money(selected.recommendedPrice)}`,
                    `Sobra: ${money(selected.profit)}`,
                  ].join('\n');
                  navigator.clipboard?.writeText(text);
                }}
              >
                Copiar detalhes
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
