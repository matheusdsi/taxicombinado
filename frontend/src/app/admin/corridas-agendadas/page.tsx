'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import {
  PageHeader, KpiCard, Card, Btn, Table, Th, Td, Tr,
  EmptyState, LoadingState, Modal, StatRow, FilterChip, Select,
  fmtDate, money, num,
} from '../_components';

function fmtBR(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  // scheduledDate comes as "YYYY-MM-DD", parse without timezone conversion
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  // fallback for ISO datetime strings
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

interface RideRequest {
  id: string;
  source?: 'public' | 'scheduling';
  passengerName: string;
  passengerPhone: string;
  originAddress: string;
  destinationAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  passengerCount: number;
  needsLargeVehicle: boolean;
  needsAccessibility: boolean;
  hasLuggage: boolean;
  notes?: string | null;
  estimatedPriceMin?: number | null;
  estimatedPriceMax?: number | null;
  estimatedDistanceKm?: number | null;
  status: string;
  driverSlug?: string | null;
  driverName?: string | null;
  createdAt: string;
}

interface RidesResponse {
  rides: RideRequest[];
  total: number;
  totalPages: number;
  byStatus: Record<string, number>;
  avgPriceMin: number | null;
  avgPriceMax: number | null;
  sumPriceMin: number | null;
  sumPriceMax: number | null;
}

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  new:       { label: 'Novo',        badge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  confirmed: { label: 'Confirmado',  badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  completed: { label: 'Realizado',   badge: 'bg-purple-50 text-purple-700 ring-purple-200' },
  cancelled: { label: 'Cancelado',   badge: 'bg-red-50 text-red-600 ring-red-200' },
};

function RideStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, badge: 'bg-gray-100 text-gray-500 ring-gray-200' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${cfg.badge}`}>
      {cfg.label}
    </span>
  );
}

export default function CorridasAgendadasPage() {
  const [data, setData] = useState<RidesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<RideRequest | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await fetch(apiUrl(`/api/admin/ride-requests${qs}`), { credentials: 'include' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    try {
      await fetch(apiUrl(`/api/admin/ride-requests/${id}`), {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchRides();
      if (selected?.id === id) setSelected((s) => s ? { ...s, status } : s);
    } catch { /* silent */ } finally { setUpdatingId(null); }
  }

  const stats = useMemo(() => ({
    total: data?.total ?? 0,
    new: data?.byStatus['new'] ?? 0,
    confirmed: data?.byStatus['confirmed'] ?? 0,
    completed: data?.byStatus['completed'] ?? 0,
    cancelled: data?.byStatus['cancelled'] ?? 0,
  }), [data]);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Corridas Agendadas"
        subtitle="Solicitações recebidas via perfis públicos dos taxistas"
        actions={<Btn variant="ghost" size="sm" onClick={fetchRides}>↺ Atualizar</Btn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total" value={num(stats.total)} color="blue" />
        <KpiCard label="Novos" value={num(stats.new)} color="yellow"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <KpiCard label="Confirmados" value={num(stats.confirmed)} color="green" />
        <KpiCard label="Realizados" value={num(stats.completed)} color="purple" />
        <KpiCard label="Cancelados" value={num(stats.cancelled)} color="red" />
      </div>

      <Card noPad>
        <div className="flex flex-wrap items-center gap-2 px-5 pt-5 pb-4 border-b border-gray-100">
          {(['all', 'new', 'confirmed', 'completed', 'cancelled'] as const).map((f) => (
            <FilterChip
              key={f}
              label={f === 'all' ? 'Todos' : (STATUS_MAP[f]?.label ?? f)}
              active={statusFilter === f}
              onClick={() => setStatusFilter(f)}
            />
          ))}
          <span className="ml-auto text-[12px] text-gray-400">{data?.total ?? 0} agendamento{(data?.total ?? 0) !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <LoadingState />
        ) : !data?.rides.length ? (
          <EmptyState
            title="Nenhum agendamento encontrado"
            description="As solicitações feitas pelos passageiros nos perfis públicos dos taxistas aparecerão aqui."
            icon={<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Passageiro</Th>
                <Th>Data / Hora corrida</Th>
                <Th>Agendado em</Th>
                <Th>Rota</Th>
                <Th>Estimativa</Th>
                <Th>Info</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {data.rides.map((r) => (
                <Tr key={r.id} onClick={() => setSelected(r)}>
                  <Td>
                    <p className="font-medium text-[#0F1623]">{r.passengerName}</p>
                    <a
                      href={`https://wa.me/55${r.passengerPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {r.passengerPhone}
                    </a>
                    {r.source === 'scheduling' && r.driverName && (
                      <p className="text-[10px] text-blue-500 mt-0.5">Taxista: {r.driverName}</p>
                    )}
                    <span className={`inline-block mt-0.5 text-[9px] font-semibold rounded px-1.5 py-0.5 ${r.source === 'scheduling' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      {r.source === 'scheduling' ? 'Perfil público' : 'Formulário /agendar'}
                    </span>
                  </Td>
                  <Td>
                    <p className="text-[13px] font-semibold text-[#0F1623]">{fmtBR(r.scheduledDate)}</p>
                    <p className="text-[12px] text-gray-500">{r.scheduledTime}</p>
                  </Td>
                  <Td className="text-[12px] text-gray-500 whitespace-nowrap">{fmtBR(r.createdAt)}</Td>
                  <Td>
                    <p className="text-[12px] text-gray-700 truncate max-w-[180px]">{r.originAddress}</p>
                    <p className="text-[11px] text-gray-400 truncate max-w-[180px]">→ {r.destinationAddress}</p>
                  </Td>
                  <Td>
                    {r.estimatedPriceMin && r.estimatedPriceMax ? (
                      <span className="font-semibold text-[#C89000]">
                        R$ {r.estimatedPriceMin.toFixed(0)}–{r.estimatedPriceMax.toFixed(0)}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-[12px]">—</span>
                    )}
                    {r.estimatedDistanceKm && (
                      <p className="text-[11px] text-gray-400">{r.estimatedDistanceKm.toFixed(1)} km</p>
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-0.5 text-[11px] text-gray-500">
                      {r.passengerCount > 1 && <span>{r.passengerCount} passageiros</span>}
                      {r.needsLargeVehicle && <span className="text-blue-600">Van/7 lugares</span>}
                      {r.hasLuggage && <span>Com bagagem</span>}
                      {r.needsAccessibility && <span className="text-purple-600">Acessibilidade</span>}
                    </div>
                  </Td>
                  <Td><RideStatusBadge status={r.status} /></Td>
                  <Td>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`https://wa.me/55${r.passengerPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                        title="WhatsApp passageiro"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.561 4.14 1.543 5.877L0 24l6.313-1.543A11.957 11.957 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.943 0-3.75-.527-5.289-1.443L3 22l1.443-3.711A9.954 9.954 0 0 1 2 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                      </a>
                      <Btn size="sm" variant="ghost" onClick={() => setSelected(r)}>Ver</Btn>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Modal detalhe */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalhes do agendamento" wide>
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Passageiro</h4>
                <StatRow label="Nome" value={selected.passengerName} />
                <StatRow label="WhatsApp" value={
                  <a href={`https://wa.me/55${selected.passengerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{selected.passengerPhone}</a>
                } />
                <StatRow label="Passageiros" value={selected.passengerCount} />
                <StatRow label="Van/7 lugares" value={selected.needsLargeVehicle ? 'Sim' : 'Não'} />
                <StatRow label="Bagagem" value={selected.hasLuggage ? 'Sim' : 'Não'} />
                <StatRow label="Acessibilidade" value={selected.needsAccessibility ? 'Sim' : 'Não'} />
                {selected.driverName && <StatRow label="Taxista" value={selected.driverName} />}
                <StatRow label="Origem" value={
                  <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${selected.source === 'scheduling' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {selected.source === 'scheduling' ? 'Perfil público do taxista' : 'Formulário /agendar'}
                  </span>
                } />
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Corrida</h4>
                <StatRow label="Data" value={<span className="font-semibold">{fmtBR(selected.scheduledDate)}</span>} />
                <StatRow label="Hora" value={<span className="font-semibold">{selected.scheduledTime}</span>} />
                <StatRow label="Origem" value={<span className="text-[12px]">{selected.originAddress}</span>} />
                <StatRow label="Destino" value={<span className="text-[12px]">{selected.destinationAddress}</span>} />
                {selected.estimatedDistanceKm && <StatRow label="Distância est." value={`${selected.estimatedDistanceKm.toFixed(1)} km`} />}
                {selected.estimatedPriceMin && selected.estimatedPriceMax && (
                  <StatRow
                    label="Estimativa de preço"
                    value={<span className="font-bold text-[#C89000]">R$ {selected.estimatedPriceMin.toFixed(0)}–{selected.estimatedPriceMax.toFixed(0)}</span>}
                  />
                )}
              </div>
            </div>

            {selected.notes && (
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Observações</h4>
                <p className="text-[13px] text-gray-600 bg-gray-50 rounded-xl p-3">{selected.notes}</p>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-gray-500">Status atual:</span>
                  <RideStatusBadge status={selected.status} />
                </div>
                <span className="text-[11px] text-gray-400">Solicitado em {fmtBR(selected.createdAt)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.status !== 'confirmed' && (
                  <Btn size="sm" variant="success" disabled={updatingId === selected.id} onClick={() => updateStatus(selected.id, 'confirmed')}>
                    ✓ Confirmar
                  </Btn>
                )}
                {selected.status !== 'completed' && (
                  <Btn size="sm" variant="ghost" disabled={updatingId === selected.id} onClick={() => updateStatus(selected.id, 'completed')}>
                    Marcar como realizado
                  </Btn>
                )}
                {selected.status !== 'cancelled' && (
                  <Btn size="sm" variant="danger" disabled={updatingId === selected.id} onClick={() => updateStatus(selected.id, 'cancelled')}>
                    Cancelar
                  </Btn>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selected.originAddress)}&destination=${encodeURIComponent(selected.destinationAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Ver rota no Maps
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
