'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import {
  PageHeader, Card, Btn, LoadingState,
} from '../_components';

interface FeatureFlags { showRouteSteps: boolean; }

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-[14px] font-semibold text-[#0F1623]">{label}</p>
        {description && <p className="text-[12px] text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${checked ? 'bg-[#F5B800]' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

const TARIFF_SECTIONS = [
  {
    title: 'Tarifas — Comum (Bandeira 1)',
    rows: [
      { label: 'Bandeirada', value: 'R$ 5,50', editable: false },
      { label: 'Km rodado', value: 'R$ 2,75/km', editable: false },
      { label: 'Hora parada', value: 'R$ 28,00/h', editable: false },
    ],
  },
  {
    title: 'Tarifas — Comum (Bandeira 2)',
    rows: [
      { label: 'Bandeirada', value: 'R$ 5,50', editable: false },
      { label: 'Km rodado', value: 'R$ 3,30/km', editable: false },
      { label: 'Hora parada', value: 'R$ 33,00/h', editable: false },
    ],
  },
];

export default function ConfiguracoesPage() {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/settings'), { credentials: 'include' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      setFlags(json.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  async function updateFlag(key: keyof FeatureFlags, value: boolean) {
    setSaving(true); setSaveSuccess('');
    try {
      const res = await fetch(apiUrl('/api/admin/settings'), {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setFlags(json.data);
      setSaveSuccess('Configuração salva!');
      setTimeout(() => setSaveSuccess(''), 2500);
    } catch { /* silent */ } finally { setSaving(false); }
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Configurações" subtitle="Configurar regras e funcionalidades do sistema" />

      {loading ? <LoadingState /> : (
        <div className="space-y-6">
          {/* Feature flags */}
          <Card title="Funcionalidades" subtitle="Ativar e desativar recursos do sistema">
            {flags && (
              <Toggle
                checked={flags.showRouteSteps}
                onChange={(v) => updateFlag('showRouteSteps', v)}
                label="Mostrar passos da rota"
                description="Exibe as etapas detalhadas da rota no resultado da cotação"
              />
            )}
            {saveSuccess && <p className="mt-2 text-[12px] text-emerald-600">{saveSuccess}</p>}
          </Card>

          {/* Tarifas (informativo) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {TARIFF_SECTIONS.map((s) => (
              <Card key={s.title} title={s.title}>
                <div className="mt-3 space-y-0">
                  {s.rows.map((r) => (
                    <div key={r.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <span className="text-[13px] text-gray-600">{r.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#0F1623]">{r.value}</span>
                        {!r.editable && (
                          <span className="text-[10px] bg-gray-100 text-gray-400 rounded px-1.5 py-0.5">Tabela SP</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Trânsito */}
          <Card title="Regras de trânsito" subtitle="Configuração do adicional de trânsito">
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-[13px] text-amber-700">
                O adicional de trânsito é calculado automaticamente com base na duração com trânsito vs. sem trânsito.
                O valor é proporcional ao tempo extra estimado pela API de rotas.
                Esta regra é calculada no backend e não é configurável via interface no momento.
              </p>
            </div>
          </Card>

          {/* Categorias */}
          <Card title="Categorias de veículo" subtitle="Como as categorias são detectadas automaticamente">
            <div className="mt-3 space-y-3">
              {[
                { cat: 'Comum', rule: 'Bandeirada base < R$ 9,00', color: 'bg-gray-100 text-gray-600' },
                { cat: 'Luxo', rule: 'Bandeirada base entre R$ 9,00 e R$ 12,00', color: 'bg-purple-50 text-purple-700' },
                { cat: 'Executivo', rule: 'Bandeirada base ≥ R$ 12,00', color: 'bg-blue-50 text-blue-700' },
              ].map((c) => (
                <div key={c.cat} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-semibold ${c.color}`}>{c.cat}</span>
                  <span className="text-[12px] text-gray-500">{c.rule}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
