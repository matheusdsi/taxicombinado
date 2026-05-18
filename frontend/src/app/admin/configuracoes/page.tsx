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
    title: 'Tarifas padrão (valores default do sistema)',
    rows: [
      { label: 'Bandeirada (base)', value: 'R$ 6,55' },
      { label: 'Preço por km', value: 'R$ 4,80/km' },
      { label: 'Hora parada (espera)', value: 'R$ 55,50/h' },
    ],
  },
  {
    title: 'Bandeira 2 (multiplicador ×1,2)',
    rows: [
      { label: 'Bandeirada (base)', value: 'R$ 6,55' },
      { label: 'Preço por km', value: 'R$ 5,76/km' },
      { label: 'Hora parada (espera)', value: 'R$ 66,60/h' },
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
          <Card title="Tarifas de referência (Tabela SP)" subtitle="Apenas informativo — não afetam nenhum cálculo do sistema">
            <div className="mt-3 mb-4 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <svg className="shrink-0 mt-0.5" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-[12px] text-blue-700">
                <strong>Estes valores não são configuráveis e não afetam nenhuma cotação.</strong> Cada taxista insere suas próprias tarifas diretamente no formulário de cotação. O sistema apenas recebe esses valores como entrada e calcula o preço — não há tarifa global configurada aqui.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {TARIFF_SECTIONS.map((s) => (
                <div key={s.title} className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-[12px] font-semibold text-gray-500">{s.title}</p>
                  </div>
                  <div className="px-4">
                    {s.rows.map((r) => (
                      <div key={r.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <span className="text-[13px] text-gray-500">{r.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-gray-600">{r.value}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-400 rounded px-1.5 py-0.5">ref. only</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

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
