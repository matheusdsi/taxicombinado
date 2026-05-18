'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import {
  PageHeader, KpiCard, Card, Btn, Table, Th, Td, Tr,
  EmptyState, LoadingState, SearchInput, Select, Modal, StatRow,
  fmtDate, fmtDateShort, num,
} from '../_components';

interface AdminUser {
  id: string; name: string | null; email: string | null; phone: string | null;
  role: string; createdAt: string; totalQuotes: number; lastQuoteAt: string | null;
}

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, string> = {
    admin:    'bg-purple-50 text-purple-700',
    driver:   'bg-blue-50 text-blue-700',
    passenger:'bg-emerald-50 text-emerald-700',
  };
  const label: Record<string, string> = { admin: 'Admin', driver: 'Taxista', passenger: 'Passageiro' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${cfg[role] ?? 'bg-gray-100 text-gray-500'} ring-gray-200`}>
      {label[role] ?? role}
    </span>
  );
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/users'), { credentials: 'include' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      setUsers(json.data ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== 'all') list = list.filter((u) => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q)
      );
    }
    return list;
  }, [users, search, roleFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    drivers: users.filter((u) => u.role === 'driver').length,
    withQuotes: users.filter((u) => u.totalQuotes > 0).length,
  }), [users]);

  async function handleResetPassword() {
    if (!selected || !resetPassword || resetPassword.length < 6) return;
    setResetLoading(true); setResetError(''); setResetSuccess('');
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${selected.id}/reset-password`), {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResetSuccess('Senha redefinida com sucesso!');
      setResetPassword('');
      setTimeout(() => setResetSuccess(''), 3000);
    } catch (e: unknown) {
      setResetError(e instanceof Error ? e.message : 'Erro');
    } finally { setResetLoading(false); }
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Usuários" subtitle="Gerenciar todos os usuários do sistema" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total" value={num(stats.total)} color="blue"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <KpiCard label="Taxistas" value={num(stats.drivers)} color="yellow"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h8l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/></svg>}
        />
        <KpiCard label="Admins" value={num(stats.admins)} color="purple"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
        <KpiCard label="Com cotações" value={num(stats.withQuotes)} color="green"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        />
      </div>

      <Card noPad>
        <div className="flex flex-wrap items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex-1 min-w-[200px]">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome, e-mail ou telefone..." />
          </div>
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: 'all', label: 'Todos os tipos' },
              { value: 'driver', label: 'Taxistas' },
              { value: 'admin', label: 'Admins' },
            ]}
          />
          <span className="text-[12px] text-gray-400">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhum usuário encontrado"
            description="Tente ajustar os filtros de busca."
            icon={<svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>Contato</Th>
                <Th>Tipo</Th>
                <Th>Cotações</Th>
                <Th>Último acesso</Th>
                <Th>Cadastro</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <Tr key={u.id} onClick={() => setSelected(u)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF8DC] text-[12px] font-bold text-[#C89000]">
                        {(u.name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-[#0F1623]">{u.name || <span className="text-gray-400">Sem nome</span>}</span>
                    </div>
                  </Td>
                  <Td>
                    <p className="text-[12px] text-gray-600">{u.email || '—'}</p>
                    <p className="text-[11px] text-gray-400">{u.phone || '—'}</p>
                  </Td>
                  <Td><RoleBadge role={u.role} /></Td>
                  <Td>
                    <span className={`font-bold ${u.totalQuotes > 0 ? 'text-[#0F1623]' : 'text-gray-300'}`}>
                      {num(u.totalQuotes)}
                    </span>
                  </Td>
                  <Td className="text-[12px] text-gray-500">{fmtDate(u.lastQuoteAt)}</Td>
                  <Td className="text-[12px] text-gray-500">{fmtDateShort(u.createdAt)}</Td>
                  <Td>
                    <Btn size="sm" variant="ghost" onClick={(e) => { e?.stopPropagation?.(); setSelected(u); }}>
                      Ver
                    </Btn>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Modal detalhe */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setResetPassword(''); setResetSuccess(''); setResetError(''); }} title="Detalhe do usuário">
        {selected && (
          <div>
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8DC] text-xl font-bold text-[#C89000]">
                {(selected.name || selected.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-[16px] font-bold text-[#0F1623]">{selected.name || 'Sem nome'}</p>
                <RoleBadge role={selected.role} />
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Dados</h4>
              <StatRow label="E-mail" value={selected.email} />
              <StatRow label="Telefone" value={selected.phone} />
              <StatRow label="Função" value={selected.role} />
              <StatRow label="Cadastro" value={fmtDate(selected.createdAt)} />
              <StatRow label="Total de cotações" value={num(selected.totalQuotes)} />
              <StatRow label="Última cotação" value={fmtDate(selected.lastQuoteAt)} />
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Redefinir senha</h4>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#F5B800] transition-all"
                />
                <Btn
                  variant="secondary"
                  size="md"
                  disabled={resetLoading || resetPassword.length < 6}
                  onClick={handleResetPassword}
                >
                  {resetLoading ? '...' : 'Salvar'}
                </Btn>
              </div>
              {resetSuccess && <p className="mt-2 text-[12px] text-emerald-600">{resetSuccess}</p>}
              {resetError && <p className="mt-2 text-[12px] text-red-500">{resetError}</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
