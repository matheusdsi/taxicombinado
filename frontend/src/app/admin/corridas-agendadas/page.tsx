'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import {
  PageHeader, KpiCard, Card, Btn, Table, Th, Td, Tr,
  EmptyState, LoadingState, StatusBadge, Modal, StatRow, FilterChip,
  fmtDate, money, num,
} from '../_components';

interface ScheduledRide {
  id: string;
  createdAt: string;
  rideDate?: string;
  rideTime?: string;
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  origin?: string;
  destination?: string;
  estimatedValue?: number;
  status: string;
  notes?: string;
  driverName?: string;
  driverPhone?: string;
}

export default function CorridasAgendadasPage() {
  const [rides, setRides] = useState<ScheduledRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<ScheduledRide | null>(null);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/stats'), { credentials: 'include' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      setRides([]);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return rides;
    return rides.filter((r) => r.status === statusFilter);
  }, [rides, statusFilter]);

  const stats = useMemo(() => ({
    total: rides.length,
    pendentes: rides.filter((r) => r.status === 'pendente').length,
    aceitos: rides.filter((r) => r.status === 'aceito').length,
    hoje: rides.filter((r) => r.rideDate && new Date(r.rideDate).toDateString() === new Date().toDateString()).length,
    cancelados: rides.filter((r) => r.status === 'cancelado').length,
  }), [rides]);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Corridas Agendadas" subtitle="Gerenciar solicitações de agendamento" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total" value={num(stats.total)} color="blue" />
        <KpiCard label="Pendentes" value={num(stats.pendentes)} color="yellow"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <KpiCard label="Aceitos" value={num(stats.aceitos)} color="green" />
        <KpiCard label="Hoje" value={num(stats.hoje)} color="yellow" />
        <KpiCard label="Cancelados" value={num(stats.cancelados)} color="red" />
      </div>

      <Card noPad>
        <div className="flex flex-wrap items-center gap-2 px-5 pt-5 pb-4 border-b border-gray-100">
          {(['all', 'pendente', 'aceito', 'realizado', 'cancelado'] as const).map((f) => (
            <FilterChip
              key={f}
              label={f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
              active={statusFilter === f}
              onClick={() => setStatusFilter(f)}
            />
          ))}
        </div>

        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhum agendamento encontrado"
            description="Os agendamentos realizados pelos passageiros nos perfis públicos dos taxistas aparecerão aqui."
            icon={<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Passageiro</Th>
                <Th>Taxista</Th>
                <Th>Data/Hora da corrida</Th>
                <Th>Rota</Th>
                <Th>Valor est.</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <Tr key={r.id} onClick={() => setSelected(r)}>
                  <Td>
                    <p className="font-medium text-[#0F1623]">{r.passengerName || '—'}</p>
                    {r.passengerPhone && (
                      <a href={`https://wa.me/55${r.passengerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                        {r.passengerPhone}
                      </a>
                    )}
                  </Td>
                  <Td>
                    <p className="text-[13px] text-gray-700">{r.driverName || '—'}</p>
                    {r.driverPhone && <p className="text-[11px] text-gray-400">{r.driverPhone}</p>}
                  </Td>
                  <Td>
                    <p className="text-[13px] font-medium text-[#0F1623]">{r.rideDate || '—'}</p>
                    <p className="text-[11px] text-gray-400">{r.rideTime || ''}</p>
                  </Td>
                  <Td>
                    <p className="text-[12px] text-gray-600 truncate max-w-[160px]">{r.origin || '—'}</p>
                    <p className="text-[11px] text-gray-400 truncate max-w-[160px]">→ {r.destination || '—'}</p>
                  </Td>
                  <Td>{r.estimatedValue ? <span className="font-semibold">{money(r.estimatedValue)}</span> : <span className="text-gray-300">—</span>}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {r.passengerPhone && (
                        <a
                          href={`https://wa.me/55${r.passengerPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.561 4.14 1.543 5.877L0 24l6.313-1.543A11.957 11.957 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.943 0-3.75-.527-5.289-1.443L3 22l1.443-3.711A9.954 9.954 0 0 1 2 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                        </a>
                      )}
                      <Btn size="sm" variant="ghost">Ver</Btn>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalhes do agendamento" wide>
        {selected && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Passageiro</h4>
              <StatRow label="Nome" value={selected.passengerName} />
              <StatRow label="WhatsApp" value={
                selected.passengerPhone ? (
                  <a href={`https://wa.me/55${selected.passengerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{selected.passengerPhone}</a>
                ) : '—'
              } />
              <StatRow label="E-mail" value={selected.passengerEmail} />
            </div>
            <div>
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Corrida</h4>
              <StatRow label="Data" value={selected.rideDate} />
              <StatRow label="Hora" value={selected.rideTime} />
              <StatRow label="Origem" value={selected.origin} />
              <StatRow label="Destino" value={selected.destination} />
              <StatRow label="Valor estimado" value={selected.estimatedValue ? money(selected.estimatedValue) : '—'} />
              <StatRow label="Status" value={<StatusBadge status={selected.status} />} />
            </div>
            {selected.notes && (
              <div className="col-span-2">
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Observações</h4>
                <p className="text-[13px] text-gray-600 bg-gray-50 rounded-xl p-3">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
