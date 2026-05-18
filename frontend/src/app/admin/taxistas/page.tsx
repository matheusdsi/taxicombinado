'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import {
  PageHeader, KpiCard, Card, Btn, Table, Th, Td, Tr,
  EmptyState, LoadingState, SearchInput, Select, Modal, StatRow, StatusBadge,
  fmtDate, fmtDateShort, num,
} from '../_components';

interface AdminUser {
  id: string; name: string | null; email: string | null; phone: string | null;
  role: string; createdAt: string; totalQuotes: number; lastQuoteAt: string | null;
}

interface AnonSession {
  id: string; sessionId: string; createdAt: string; lastSeen: string;
  userAgent: string | null; totalQuotes: number;
}

function deviceLabel(ua: string | null): string {
  if (!ua) return 'Dispositivo desconhecido';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua) && /Mobile/i.test(ua)) return 'Android Mobile';
  if (/Android/i.test(ua)) return 'Android Tablet';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Outro';
}

export default function TaxistasPage() {
  const [drivers, setDrivers] = useState<AdminUser[]>([]);
  const [anonSessions, setAnonSessions] = useState<AnonSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('quotes');
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, anonRes] = await Promise.all([
        fetch(apiUrl('/api/admin/users'), { credentials: 'include' }),
        fetch(apiUrl('/api/admin/anonymous-sessions'), { credentials: 'include' }),
      ]);
      if (usersRes.status === 401) { window.location.href = '/admin/login'; return; }
      const usersJson = await usersRes.json();
      const all: AdminUser[] = usersJson.data ?? [];
      setDrivers(all.filter((u) => u.role === 'driver'));
      if (anonRes.ok) {
        const anonJson = await anonRes.json();
        setAnonSessions((anonJson.data ?? []).filter((s: AnonSession) => s.totalQuotes > 0));
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const sorted = useMemo(() => {
    let list = drivers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q)
      );
    }
    if (sortBy === 'quotes') return [...list].sort((a, b) => b.totalQuotes - a.totalQuotes);
    if (sortBy === 'recent') return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [drivers, search, sortBy]);

  const stats = useMemo(() => ({
    total: drivers.length,
    withQuotes: drivers.filter((d) => d.totalQuotes > 0).length,
    top: drivers.reduce((t, d) => t + d.totalQuotes, 0),
    active: drivers.filter((d) => d.lastQuoteAt && new Date(d.lastQuoteAt) > new Date(Date.now() - 30 * 86400000)).length,
  }), [drivers]);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Taxistas" subtitle="Gerenciar taxistas cadastrados" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Cadastrados" value={num(stats.total)} color="yellow"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h8l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/></svg>}
        />
        <KpiCard label="Ativos (30d)" value={num(stats.active)} color="green"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><polyline points="16 8 10 14 7 11"/></svg>}
        />
        <KpiCard label="Com cotações" value={num(stats.withQuotes)} color="blue"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        />
        <KpiCard label="Total de cotações" value={num(stats.top)} color="purple"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
        />
      </div>

      {/* Rankings side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Ranking taxistas cadastrados */}
        <Card title="Ranking de taxistas" subtitle="Por número de cotações realizadas">
          {drivers.length === 0 ? (
            <div className="mt-4"><EmptyState title="Nenhum taxista cadastrado" /></div>
          ) : (
            <div className="mt-4 space-y-2">
              {[...drivers].sort((a, b) => b.totalQuotes - a.totalQuotes).slice(0, 8).map((d, i) => {
                const pct = Math.max(4, Math.round((d.totalQuotes / Math.max(1, ...drivers.map(x => x.totalQuotes))) * 100));
                return (
                  <div key={d.id} className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold ${i === 0 ? 'bg-[#F5B800] text-[#0F1623]' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-[#0F1623] truncate">{d.name || d.email || '—'}</span>
                        <span className="text-[12px] font-bold text-[#0F1623] ml-2 shrink-0">{num(d.totalQuotes)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${i === 0 ? 'bg-[#F5B800]' : 'bg-blue-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Ranking usuários anônimos */}
        <Card title="Ranking anônimos" subtitle="Sessões sem cadastro com mais cotações">
          {anonSessions.length === 0 ? (
            <div className="mt-4"><EmptyState title="Nenhuma sessão anônima com cotações" /></div>
          ) : (
            <div className="mt-4 space-y-2">
              {[...anonSessions].sort((a, b) => b.totalQuotes - a.totalQuotes).slice(0, 8).map((s, i) => {
                const pct = Math.max(4, Math.round((s.totalQuotes / Math.max(1, ...anonSessions.map(x => x.totalQuotes))) * 100));
                const shortId = s.sessionId.slice(0, 8);
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold ${i === 0 ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="min-w-0">
                          <span className="text-[12px] font-semibold text-gray-600 font-mono">{shortId}…</span>
                          <span className="ml-2 text-[10px] text-gray-400">{deviceLabel(s.userAgent)}</span>
                        </div>
                        <span className="text-[12px] font-bold text-[#0F1623] ml-2 shrink-0">{num(s.totalQuotes)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gray-300 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <p className="text-[11px] text-gray-400 pt-1">
                {anonSessions.length} sessão{anonSessions.length !== 1 ? 'ões' : ''} anônima{anonSessions.length !== 1 ? 's' : ''} com cotações
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card noPad>
        <div className="flex flex-wrap items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex-1 min-w-[200px]">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome, e-mail ou telefone..." />
          </div>
          <Select value={sortBy} onChange={setSortBy} options={[
            { value: 'quotes', label: 'Mais cotações' },
            { value: 'recent', label: 'Mais recentes' },
          ]} />
          <span className="text-[12px] text-gray-400">{sorted.length} taxista{sorted.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <LoadingState />
        ) : sorted.length === 0 ? (
          <EmptyState title="Nenhum taxista encontrado" icon={<svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h8l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/></svg>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Nome</Th>
                <Th>Contato</Th>
                <Th>Cotações</Th>
                <Th>Última cotação</Th>
                <Th>Cadastro</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, i) => {
                const isActive = d.lastQuoteAt && new Date(d.lastQuoteAt) > new Date(Date.now() - 30 * 86400000);
                return (
                  <Tr key={d.id} onClick={() => setSelected(d)}>
                    <Td className="text-[12px] text-gray-400 font-medium">{i + 1}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF8DC] text-[12px] font-bold text-[#C89000]">
                          {(d.name || d.email || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-[#0F1623]">{d.name || <span className="text-gray-400">Sem nome</span>}</span>
                      </div>
                    </Td>
                    <Td>
                      <p className="text-[12px] text-gray-600">{d.email || '—'}</p>
                      {d.phone && (
                        <a
                          href={`https://wa.me/55${d.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {d.phone}
                        </a>
                      )}
                    </Td>
                    <Td>
                      <span className={`font-bold text-[15px] ${d.totalQuotes > 0 ? 'text-[#0F1623]' : 'text-gray-300'}`}>
                        {num(d.totalQuotes)}
                      </span>
                    </Td>
                    <Td className="text-[12px] text-gray-500">{fmtDate(d.lastQuoteAt)}</Td>
                    <Td className="text-[12px] text-gray-500">{fmtDateShort(d.createdAt)}</Td>
                    <Td>
                      <StatusBadge status={isActive ? 'ativo' : 'inativo'} />
                    </Td>
                    <Td>
                      <Btn size="sm" variant="ghost">Ver</Btn>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalhes do taxista">
        {selected && (
          <div>
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8DC] text-xl font-bold text-[#C89000]">
                {(selected.name || selected.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-[16px] font-bold text-[#0F1623]">{selected.name || 'Sem nome'}</p>
                <p className="text-[12px] text-gray-500">{selected.email}</p>
              </div>
            </div>
            <StatRow label="Telefone / WhatsApp" value={
              selected.phone ? (
                <a href={`https://wa.me/55${selected.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{selected.phone}</a>
              ) : '—'
            } />
            <StatRow label="Cadastro" value={fmtDate(selected.createdAt)} />
            <StatRow label="Total de cotações" value={<span className="text-[#F5B800] font-bold text-[15px]">{num(selected.totalQuotes)}</span>} />
            <StatRow label="Última cotação" value={fmtDate(selected.lastQuoteAt)} />
          </div>
        )}
      </Modal>
    </div>
  );
}
