'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import {
  PageHeader, KpiCard, Card, Btn, Table, Th, Td, Tr,
  EmptyState, LoadingState, SearchInput, Select, Modal, StatRow, StatusBadge,
  FilterChip,
  num,
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
}

interface PartnerFormState {
  name: string; category: string; description: string; logoUrl: string;
  websiteUrl: string; wazeUrl: string; phone: string; whatsapp: string;
  city: string; isActive: boolean; isPremium: boolean; sortOrder: string;
}

interface LocationFormState {
  name: string; address: string; city: string; phone: string; whatsapp: string; wazeUrl: string; sortOrder: string;
}

const EMPTY_FORM: PartnerFormState = {
  name: '', category: '', description: '', logoUrl: '', websiteUrl: '',
  wazeUrl: '', phone: '', whatsapp: '', city: '', isActive: true, isPremium: false, sortOrder: '0',
};

const EMPTY_LOC_FORM: LocationFormState = {
  name: '', address: '', city: '', phone: '', whatsapp: '', wazeUrl: '', sortOrder: '0',
};

function partnerToForm(p: AdminPartner): PartnerFormState {
  return {
    name: p.name,
    category: p.category,
    description: p.description ?? '',
    logoUrl: p.logoUrl ?? '',
    websiteUrl: p.websiteUrl ?? '',
    wazeUrl: p.wazeUrl ?? '',
    phone: p.phone ?? '',
    whatsapp: p.whatsapp ?? '',
    city: p.city ?? '',
    isActive: p.isActive,
    isPremium: p.isPremium,
    sortOrder: String(p.sortOrder),
  };
}

// ─── Formulário de parceiro reutilizável ──────────────────────
function PartnerForm({
  form,
  onChange,
  onSubmit,
  saving,
  error,
  submitLabel,
  onCancel,
}: {
  form: PartnerFormState;
  onChange: (f: PartnerFormState) => void;
  onSubmit: (e: FormEvent) => void;
  saving: boolean;
  error: string;
  submitLabel: string;
  onCancel: () => void;
}) {
  const fields: { label: string; key: keyof PartnerFormState; required?: boolean }[] = [
    { label: 'Nome *', key: 'name', required: true },
    { label: 'Categoria *', key: 'category', required: true },
    { label: 'Cidade', key: 'city' },
    { label: 'Telefone', key: 'phone' },
    { label: 'WhatsApp', key: 'whatsapp' },
    { label: 'Website', key: 'websiteUrl' },
    { label: 'Logo URL', key: 'logoUrl' },
    { label: 'Waze URL', key: 'wazeUrl' },
    { label: 'Ordem', key: 'sortOrder' },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ label, key, required }) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
            <input
              type="text"
              value={String(form[key] ?? '')}
              required={required}
              onChange={(e) => onChange({ ...form, [key]: e.target.value })}
              className="rounded-xl border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#F5B800] transition-all"
            />
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Descrição</span>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          rows={3}
          className="rounded-xl border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#F5B800] transition-all resize-none"
        />
      </label>

      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
            className="h-4 w-4 rounded accent-[#F5B800]"
          />
          <span className="text-[13px] text-gray-700">Ativo</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPremium}
            onChange={(e) => onChange({ ...form, isPremium: e.target.checked })}
            className="h-4 w-4 rounded accent-[#F5B800]"
          />
          <span className="text-[13px] text-gray-700">Premium</span>
        </label>
      </div>

      {error && <p className="text-[12px] text-red-500">{error}</p>}

      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
        <Btn variant="ghost" onClick={onCancel} type="button">Cancelar</Btn>
        <Btn type="submit" disabled={saving}>{saving ? 'Salvando...' : submitLabel}</Btn>
      </div>
    </form>
  );
}

export default function ParceirosPage() {
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [catFilter, setCatFilter] = useState('all');

  // modais
  const [viewPartner, setViewPartner] = useState<AdminPartner | null>(null);
  const [editPartner, setEditPartner] = useState<AdminPartner | null>(null);
  const [editForm, setEditForm] = useState<PartnerFormState>(EMPTY_FORM);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<PartnerFormState>(EMPTY_FORM);

  // unidade nova dentro do modal de edição
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [locForm, setLocForm] = useState<LocationFormState>(EMPTY_LOC_FORM);

  const [saving, setSaving] = useState(false);
  const [savingLoc, setSavingLoc] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveLocError, setSaveLocError] = useState('');

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

  // Sincroniza o editPartner com a lista atualizada após fetch
  useEffect(() => {
    if (editPartner) {
      const updated = partners.find((p) => p.id === editPartner.id);
      if (updated) setEditPartner(updated);
    }
  }, [partners]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const uniqueCategories = useMemo(() =>
    [...new Set(partners.map((p) => p.category))],
    [partners]
  );

  // ── Criar parceiro ─────────────────────────────────────────
  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(apiUrl('/api/admin/partners'), {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm, sortOrder: Number(createForm.sortOrder || 0) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCreateForm(EMPTY_FORM);
      setShowCreate(false);
      await fetchPartners();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao criar parceiro');
    } finally { setSaving(false); }
  }

  // ── Salvar edição ──────────────────────────────────────────
  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editPartner) return;
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/partners/${editPartner.id}`), {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, sortOrder: Number(editForm.sortOrder || 0) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setEditPartner(null);
      await fetchPartners();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  // ── Toggle ativo ───────────────────────────────────────────
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

  // ── Adicionar unidade ──────────────────────────────────────
  async function handleAddLocation(e: FormEvent) {
    e.preventDefault();
    if (!editPartner) return;
    setSavingLoc(true); setSaveLocError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/partners/${editPartner.id}/locations`), {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...locForm, sortOrder: Number(locForm.sortOrder || 0), isActive: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLocForm(EMPTY_LOC_FORM);
      setShowAddLocation(false);
      await fetchPartners();
    } catch (err: unknown) {
      setSaveLocError(err instanceof Error ? err.message : 'Erro ao criar unidade');
    } finally { setSavingLoc(false); }
  }

  // ── Toggle unidade ─────────────────────────────────────────
  async function toggleLocation(locId: string, current: boolean) {
    try {
      await fetch(apiUrl(`/api/admin/partner-locations/${locId}`), {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      await fetchPartners();
    } catch { /* silent */ }
  }

  // ── Abrir modal de edição ──────────────────────────────────
  function openEdit(p: AdminPartner) {
    setEditPartner(p);
    setEditForm(partnerToForm(p));
    setSaveError('');
    setShowAddLocation(false);
    setLocForm(EMPTY_LOC_FORM);
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Parceiros"
        subtitle="Gerenciar parceiros e anunciantes"
        actions={<Btn onClick={() => { setCreateForm(EMPTY_FORM); setSaveError(''); setShowCreate(true); }}>+ Novo parceiro</Btn>}
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
          <span className="text-[12px] text-gray-400">{filtered.length} parceiro{filtered.length !== 1 ? 's' : ''}</span>
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
                <Tr key={p.id} onClick={() => setViewPartner(p)}>
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
                  <Td>
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{p.category}</span>
                  </Td>
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
                          title="Abrir WhatsApp"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.561 4.14 1.543 5.877L0 24l6.313-1.543A11.957 11.957 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.943 0-3.75-.527-5.289-1.443L3 22l1.443-3.711A9.954 9.954 0 0 1 2 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                        </a>
                      )}
                      <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}>
                        Editar
                      </Btn>
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

      {/* ── Modal: Ver detalhes ─────────────────────────────── */}
      <Modal open={!!viewPartner} onClose={() => setViewPartner(null)} title="Detalhes do parceiro" wide>
        {viewPartner && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {viewPartner.logoUrl ? (
                  <img src={viewPartner.logoUrl} alt={viewPartner.name} className="h-14 w-14 rounded-xl object-contain bg-gray-100 p-1" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFF8DC] text-xl font-bold text-[#C89000]">{viewPartner.name[0]}</div>
                )}
                <div>
                  <p className="text-[16px] font-bold text-[#0F1623]">{viewPartner.name}</p>
                  <p className="text-[12px] text-gray-500">{viewPartner.category}{viewPartner.isPremium && ' • ★ Premium'}</p>
                </div>
              </div>
              <Btn size="sm" variant="secondary" onClick={() => { setViewPartner(null); openEdit(viewPartner); }}>
                Editar parceiro
              </Btn>
            </div>

            {viewPartner.description && (
              <p className="text-[13px] text-gray-600 bg-gray-50 rounded-xl p-3">{viewPartner.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Contato</h4>
                <StatRow label="Telefone" value={viewPartner.phone} />
                <StatRow label="WhatsApp" value={viewPartner.whatsapp} />
                <StatRow label="Cidade" value={viewPartner.city} />
                <StatRow label="Website" value={viewPartner.websiteUrl
                  ? <a href={viewPartner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-[160px]">{viewPartner.websiteUrl}</a>
                  : '—'
                } />
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Métricas</h4>
                <StatRow label="Cliques totais" value={<span className="font-bold text-[15px]">{num(viewPartner._count.clicks)}</span>} />
                <StatRow label="Leads gerados" value={num(viewPartner._count.leads)} />
                <StatRow label="Status" value={<StatusBadge status={viewPartner.isActive ? 'ativo' : 'inativo'} />} />
              </div>
            </div>

            {viewPartner.locations.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Unidades ({viewPartner.locations.length})
                </h4>
                <div className="space-y-2">
                  {viewPartner.locations.map((l) => (
                    <div key={l.id} className="rounded-xl border border-gray-100 p-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-[#0F1623]">{l.name}</p>
                        <p className="text-[12px] text-gray-500">{[l.address, l.city].filter(Boolean).join(', ') || '—'}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{l._count.clicks} cliques</p>
                      </div>
                      <StatusBadge status={l.isActive ? 'ativo' : 'inativo'} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Modal: Editar parceiro ──────────────────────────── */}
      <Modal
        open={!!editPartner}
        onClose={() => { setEditPartner(null); setSaveError(''); }}
        title={`Editar: ${editPartner?.name ?? ''}`}
        wide
      >
        {editPartner && (
          <div className="space-y-6">
            {/* Formulário de edição */}
            <PartnerForm
              form={editForm}
              onChange={setEditForm}
              onSubmit={handleSaveEdit}
              saving={saving}
              error={saveError}
              submitLabel="Salvar alterações"
              onCancel={() => { setEditPartner(null); setSaveError(''); }}
            />

            {/* Gerenciar unidades */}
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[13px] font-bold text-[#0F1623]">
                  Unidades ({editPartner.locations.length})
                </h4>
                <Btn size="sm" variant="ghost" onClick={() => { setShowAddLocation((v) => !v); setSaveLocError(''); setLocForm(EMPTY_LOC_FORM); }}>
                  {showAddLocation ? 'Cancelar' : '+ Nova unidade'}
                </Btn>
              </div>

              {/* Form nova unidade */}
              {showAddLocation && (
                <form onSubmit={handleAddLocation} className="mb-4 rounded-xl border border-dashed border-gray-200 p-4 space-y-3">
                  <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Nova unidade</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { label: 'Nome *', key: 'name', required: true },
                      { label: 'Endereço', key: 'address' },
                      { label: 'Cidade', key: 'city' },
                      { label: 'Telefone', key: 'phone' },
                      { label: 'WhatsApp', key: 'whatsapp' },
                      { label: 'Waze URL', key: 'wazeUrl' },
                      { label: 'Ordem', key: 'sortOrder' },
                    ] as { label: string; key: keyof LocationFormState; required?: boolean }[]).map(({ label, key, required }) => (
                      <label key={key} className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
                        <input
                          type="text"
                          value={locForm[key]}
                          required={required}
                          onChange={(e) => setLocForm((f) => ({ ...f, [key]: e.target.value }))}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-[13px] outline-none focus:border-[#F5B800] transition-all"
                        />
                      </label>
                    ))}
                  </div>
                  {saveLocError && <p className="text-[12px] text-red-500">{saveLocError}</p>}
                  <div className="flex justify-end gap-2">
                    <Btn type="button" variant="ghost" size="sm" onClick={() => setShowAddLocation(false)}>Cancelar</Btn>
                    <Btn type="submit" size="sm" disabled={savingLoc}>{savingLoc ? 'Salvando...' : 'Adicionar unidade'}</Btn>
                  </div>
                </form>
              )}

              {/* Lista de unidades existentes */}
              {editPartner.locations.length === 0 && !showAddLocation ? (
                <p className="text-[12px] text-gray-400 text-center py-4">Nenhuma unidade cadastrada</p>
              ) : (
                <div className="space-y-2">
                  {editPartner.locations.map((l) => (
                    <div key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#0F1623] truncate">{l.name}</p>
                        <p className="text-[12px] text-gray-400 truncate">
                          {[l.address, l.city].filter(Boolean).join(', ') || '—'}
                          {l.phone && ` · ${l.phone}`}
                        </p>
                        <p className="text-[11px] text-gray-400">{l._count.clicks} cliques</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={l.isActive ? 'ativo' : 'inativo'} />
                        <Btn
                          size="sm"
                          variant={l.isActive ? 'danger' : 'success'}
                          onClick={() => toggleLocation(l.id, l.isActive)}
                        >
                          {l.isActive ? 'Desativar' : 'Ativar'}
                        </Btn>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Criar parceiro ───────────────────────────── */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setSaveError(''); }} title="Novo parceiro" wide>
        <PartnerForm
          form={createForm}
          onChange={setCreateForm}
          onSubmit={handleCreate}
          saving={saving}
          error={saveError}
          submitLabel="Criar parceiro"
          onCancel={() => { setShowCreate(false); setSaveError(''); }}
        />
      </Modal>
    </div>
  );
}
