'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import {
  PageHeader, KpiCard, Card, Btn, Table, Th, Td, Tr,
  EmptyState, LoadingState, SearchInput, Select, Modal, StatRow, StatusBadge,
  FilterBar, FilterChip,
  fmtDate, num,
} from '../_components';

interface AdminPartner {
  id: string; name: string; category: string; description?: string | null;
  logoUrl?: string | null; websiteUrl?: string | null; wazeUrl?: string | null;
  phone?: string | null; whatsapp?: string | null; city?: string | null;
  isActive: boolean; isPremium: boolean; sortOrder: number;
  _count: { clicks: number; leads: number };
  clickSources?: Record<string, number>;
  locations: AdminPartnerLocation[];
}

interface AdminPartnerLocation {
  id: string; name: string; address?: string | null; city?: string | null;
  phone?: string | null; whatsapp?: string | null; wazeUrl?: string | null;
  isActive: boolean; sortOrder: number; _count: { clicks: number };
  clickSources?: Record<string, number>;
}

interface PartnerFormState {
  name: string; category: string; description: string; logoUrl: string;
  websiteUrl: string; wazeUrl: string; phone: string; whatsapp: string;
  city: string; isActive: boolean; isPremium: boolean; sortOrder: string;
}

const EMPTY_FORM: PartnerFormState = {
  name: '', category: '', description: '', logoUrl: '', websiteUrl: '',
  wazeUrl: '', phone: '', whatsapp: '', city: '', isActive: true, isPremium: false, sortOrder: '0',
};

const CATEGORIES = [
  'oficina', 'seguro', 'pneus', 'lava-rápido', 'combustível', 'financeiro', 'tecnologia', 'outros'
];

export default function ParceirosPage() {
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [catFilter, setCatFilter] = useState('all');
  const [selected, setSelected] = useState<AdminPartner | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<PartnerFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/partners'), { credentials: 'include' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      setPartners(json.data ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const filtered = useMemo(() => {
    let list = partners;
    if (statusFilter === 'active') list = list.filter((p) => p.isActive);
    if (statusFilter === 'inactive') list = list.filter((p) => !p.isActive);
    if (catFilter !== 'all') list = list.filter((p) => p.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q));
    }
    return list;
  }, [partners, statusFilter, catFilter, search]);

  const stats = useMemo(() => ({
    total: partners.length,
    active: partners.filter((p) => p.isActive).length,
    premium: partners.filter((p) => p.isPremium).length,
    totalClicks: partners.reduce((s, p) => s + p._count.clicks, 0),
    totalLeads: partners.reduce((s, p) => s + p._count.leads, 0),
  }), [partners]);

  const uniqueCategories = useMemo(() => {
    const cats = [...new Set(partners.map((p) => p.category))];
    return cats;
  }, [partners]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(apiUrl('/api/admin/partners'), {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder || 0) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setForm(EMPTY_FORM);
      setShowCreate(false);
      await fetchPartners();
    } catch (e: unknown) { setSaveError(e instanceof Error ? e.message : 'Erro'); } finally { setSaving(false); }
  }

  async function toggleActive(p: AdminPartner) {
    try {
      await fetch(apiUrl(`/api/admin/partners/${p.id}`), {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      await fetchPartners();
    } catch { /* silent */ }
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Parceiros"
        subtitle="Gerenciar parceiros e anunciantes"
        actions={<Btn onClick={() => setShowCreate(true)}>+ Novo parceiro</Btn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total" value={num(stats.total)} color="blue" />
        <KpiCard label="Ativos" value={num(stats.active)} color="green" />
        <KpiCard label="Premium" value={num(stats.premium)} color="yellow" />
        <KpiCard label="Cliques" value={num(stats.totalClicks)} color="purple" />
        <KpiCard label="Leads" value={num(stats.totalLeads)} color="green" />
      </div>

      <Card noPad>
        <div className="flex flex-wrap items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex-1 min-w-[200px]">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar parceiro..." />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <FilterChip
                key={f}
                label={f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Inativos'}
                active={statusFilter === f}
                onClick={() => setStatusFilter(f)}
              />
            ))}
          </div>
          {uniqueCategories.length > 0 && (
            <Select
              value={catFilter}
              onChange={setCatFilter}
              options={[
                { value: 'all', label: 'Todas as categorias' },
                ...uniqueCategories.map((c) => ({ value: c, label: c })),
              ]}
            />
          )}
        </div>

        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState title="Nenhum parceiro encontrado" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Parceiro</Th>
                <Th>Categoria</Th>
                <Th>Cidade</Th>
                <Th>Cliques</Th>
                <Th>Leads</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <Tr key={p.id} onClick={() => setSelected(p)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {p.logoUrl ? (
                        <img src={p.logoUrl} alt={p.name} className="h-8 w-8 rounded-lg object-contain bg-gray-100" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF8DC] text-[11px] font-bold text-[#C89000]">
                          {p.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[#0F1623]">{p.name}</p>
                        {p.isPremium && <span className="text-[10px] font-bold text-[#C89000]">★ Premium</span>}
                      </div>
                    </div>
                  </Td>
                  <Td><span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{p.category}</span></Td>
                  <Td className="text-[13px] text-gray-500">{p.city || '—'}</Td>
                  <Td><span className="font-bold">{num(p._count.clicks)}</span></Td>
                  <Td><span className="font-bold">{num(p._count.leads)}</span></Td>
                  <Td><StatusBadge status={p.isActive ? 'ativo' : 'inativo'} /></Td>
                  <Td>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {p.whatsapp && (
                        <a
                          href={`https://wa.me/55${p.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.561 4.14 1.543 5.877L0 24l6.313-1.543A11.957 11.957 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.943 0-3.75-.527-5.289-1.443L3 22l1.443-3.711A9.954 9.954 0 0 1 2 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                        </a>
                      )}
                      <Btn
                        size="sm"
                        variant={p.isActive ? 'danger' : 'success'}
                        onClick={() => toggleActive(p)}
                      >
                        {p.isActive ? 'Desativar' : 'Ativar'}
                      </Btn>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Modal detalhe */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalhes do parceiro" wide>
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              {selected.logoUrl ? (
                <img src={selected.logoUrl} alt={selected.name} className="h-14 w-14 rounded-xl object-contain bg-gray-100 p-1" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFF8DC] text-xl font-bold text-[#C89000]">{selected.name[0]}</div>
              )}
              <div>
                <p className="text-[16px] font-bold text-[#0F1623]">{selected.name}</p>
                <p className="text-[12px] text-gray-500">{selected.category} {selected.isPremium && '• ★ Premium'}</p>
              </div>
            </div>

            {selected.description && <p className="text-[13px] text-gray-600 bg-gray-50 rounded-xl p-3">{selected.description}</p>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Contato</h4>
                <StatRow label="Telefone" value={selected.phone} />
                <StatRow label="WhatsApp" value={selected.whatsapp} />
                <StatRow label="Cidade" value={selected.city} />
                <StatRow label="Website" value={selected.websiteUrl ? <a href={selected.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-[160px]">{selected.websiteUrl}</a> : '—'} />
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Métricas</h4>
                <StatRow label="Cliques totais" value={<span className="font-bold text-[15px]">{num(selected._count.clicks)}</span>} />
                <StatRow label="Leads gerados" value={num(selected._count.leads)} />
                <StatRow label="Status" value={<StatusBadge status={selected.isActive ? 'ativo' : 'inativo'} />} />
              </div>
            </div>

            {selected.locations.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Unidades ({selected.locations.length})</h4>
                <div className="space-y-2">
                  {selected.locations.map((l) => (
                    <div key={l.id} className="rounded-xl border border-gray-100 p-3">
                      <p className="text-[13px] font-semibold text-[#0F1623]">{l.name}</p>
                      <p className="text-[12px] text-gray-500">{[l.address, l.city].filter(Boolean).join(', ') || '—'}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{l._count.clicks} cliques</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal criar parceiro */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo parceiro" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Nome *', key: 'name', required: true },
              { label: 'Categoria *', key: 'category', required: true },
              { label: 'Cidade', key: 'city' },
              { label: 'Telefone', key: 'phone' },
              { label: 'WhatsApp', key: 'whatsapp' },
              { label: 'Website', key: 'websiteUrl' },
              { label: 'Logo URL', key: 'logoUrl' },
              { label: 'Ordem', key: 'sortOrder' },
            ].map(({ label, key, required }) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
                <input
                  type="text"
                  value={(form as Record<string, string>)[key] ?? ''}
                  required={required}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#F5B800] transition-all"
                />
              </label>
            ))}
          </div>
          <label className="flex flex-col gap-1 col-span-2">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Descrição</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="rounded-xl border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#F5B800] transition-all resize-none"
            />
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded" />
              <span className="text-[13px] text-gray-700">Ativo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPremium} onChange={(e) => setForm((f) => ({ ...f, isPremium: e.target.checked }))} className="rounded" />
              <span className="text-[13px] text-gray-700">Premium</span>
            </label>
          </div>
          {saveError && <p className="text-[12px] text-red-500">{saveError}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Btn>
            <Btn type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Criar parceiro'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
