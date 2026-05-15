'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { NumberInput } from '@/components/ui/NumberInput';
import { useAuth } from '@/context/AuthContext';
import { formatCurrencyBRL } from '@/lib/formatters';
import { getLocalQuotes } from '@/lib/localQuotes';
import {
  MyGoalData,
  calculateMyGoal,
  emptyGoalData,
  getMyGoal,
  saveMyGoal,
  trackGoalEvent,
  withGoalTotals,
} from '@/lib/myGoal';

const advancedFields: Array<{ key: keyof MyGoalData; label: string }> = [
  { key: 'seguro', label: 'Seguro' },
  { key: 'protecao_veicular', label: 'Proteção veicular' },
  { key: 'manutencao_mensal', label: 'Manutenção média mensal' },
  { key: 'lavagem_mensal', label: 'Lavagem media mensal' },
  { key: 'internet_celular', label: 'Internet/celular' },
  { key: 'estacionamento', label: 'Estacionamento' },
  { key: 'pneus', label: 'Pneus' },
  { key: 'oleo', label: 'Óleo' },
  { key: 'rastreador', label: 'Rastreador' },
  { key: 'contabilidade', label: 'Contabilidade' },
  { key: 'outros_custos', label: 'Outros custos' },
];

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="tc-card" style={{ padding: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 22, color: 'var(--ink)', fontWeight: 900, letterSpacing: '-0.03em', marginTop: 4 }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 700, marginTop: 4, lineHeight: 1.35 }}>{hint}</div>}
    </div>
  );
}

function SegmentedCarCost({ value, onChange }: { value: MyGoalData['tipo_custo_carro']; onChange: (value: MyGoalData['tipo_custo_carro']) => void }) {
  const options: Array<{ value: MyGoalData['tipo_custo_carro']; label: string }> = [
    { value: 'prestacao', label: 'Prestação mensal' },
    { value: 'diaria', label: 'Diária do carro' },
    { value: 'nenhum', label: 'Não pago' },
  ];
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 7 }}>Quanto paga de prestação ou diária do carro?</div>
      <div className="tc-seg">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`tc-seg-btn ${value === option.value ? 'active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MonthSummary({ goal }: { goal: MyGoalData }) {
  const quotes = useMemo(() => getLocalQuotes(), []);
  const now = new Date();
  const monthQuotes = quotes.filter((quote) => {
    const date = new Date(quote.createdAt);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  if (monthQuotes.length === 0) {
    return (
      <div className="tc-card">
        <div className="tc-section-title">Como está seu mês</div>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 700, lineHeight: 1.45 }}>
          Calcule suas corridas para acompanhar sua evolução no mês.
        </p>
      </div>
    );
  }

  const totalQuoted = monthQuotes.reduce((sum, quote) => sum + quote.recommendedPrice, 0);
  const estimatedProfit = monthQuotes.reduce((sum, quote) => sum + quote.profit, 0);
  const missing = Math.max(0, goal.meta_minima_mensal - totalQuoted);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, daysInMonth - now.getDate() + 1);
  const adjustedDaily = missing / remainingDays;

  return (
    <div className="tc-card">
      <div className="tc-section-title">Como está seu mês</div>
      <div style={{ display: 'grid', gap: 8 }}>
        <MetricLine label="Meta mensal" value={formatCurrencyBRL(goal.meta_minima_mensal)} />
        <MetricLine label="Valor total cotado no mês" value={formatCurrencyBRL(totalQuoted)} />
        <MetricLine label="Lucro estimado no mês" value={formatCurrencyBRL(estimatedProfit)} />
        <MetricLine label="Quanto falta" value={formatCurrencyBRL(missing)} strong />
        <MetricLine label="Dias restantes" value={String(remainingDays)} />
        <MetricLine label="Nova meta diária ajustada" value={formatCurrencyBRL(adjustedDaily)} strong />
      </div>
      <p style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 700, marginTop: 12, lineHeight: 1.4 }}>
        Faltam {formatCurrencyBRL(missing)} para bater sua meta mensal. Considerando {remainingDays} dias restantes, sua nova meta diária é {formatCurrencyBRL(adjustedDaily)}.
      </p>
    </div>
  );
}

function MetricLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, borderBottom: '1px solid var(--gray-100)', paddingBottom: 8 }}>
      <span style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: strong ? 900 : 800, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function MinhaMetaPage() {
  const { driver } = useAuth();
  const [form, setForm] = useState<MyGoalData>(emptyGoalData);
  const [showResult, setShowResult] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [accountCtaDismissed, setAccountCtaDismissed] = useState(false);
  const formStarted = useRef(false);
  const advancedSaved = useRef(false);
  const accountCtaViewed = useRef(false);

  useEffect(() => {
    const saved = getMyGoal();
    if (saved) {
      setForm(saved);
      setShowResult(saved.meta_minima_mensal > 0);
    }
    trackGoalEvent('goal_page_viewed');
  }, []);

  const totals = useMemo(() => calculateMyGoal(form), [form]);
  const computedGoal = useMemo(() => withGoalTotals(form), [form]);

  useEffect(() => {
    if (showResult && !driver && !accountCtaDismissed && !accountCtaViewed.current) {
      accountCtaViewed.current = true;
      trackGoalEvent('goal_account_cta_viewed');
    }
  }, [showResult, driver, accountCtaDismissed]);

  function updateField<K extends keyof MyGoalData>(key: K, value: MyGoalData[K]) {
    if (!formStarted.current) {
      formStarted.current = true;
      trackGoalEvent('goal_form_started');
    }

    const next = { ...form, [key]: value };
    setForm(next);

    if (showResult) {
      saveMyGoal(next, driver?.id);
      if (!advancedSaved.current && (advancedFields.some((field) => field.key === key) || key === 'km_medio_mensal')) {
        advancedSaved.current = true;
        trackGoalEvent('advanced_costs_saved');
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!form.lucro_pessoal_desejado || !form.dias_trabalhados_mes || !form.horas_trabalhadas_dia || !form.combustivel_medio_mensal) return;
    if (form.tipo_custo_carro === 'prestacao' && !form.valor_prestacao_mensal) return;
    if (form.tipo_custo_carro === 'diaria' && !form.valor_diaria) return;

    const saved = saveMyGoal(form, driver?.id);
    setForm(saved);
    setShowResult(true);
    trackGoalEvent('goal_calculated', {
      meta_minima_mensal: saved.meta_minima_mensal,
      meta_diaria: saved.meta_diaria,
      has_km_goal: Boolean(saved.meta_por_km),
    });
  }

  const error = (condition: boolean, message: string) => (submitted && condition ? message : undefined);

  return (
    <PageContainer>
      <div style={{ display: 'grid', gap: 14 }}>
        <section className="tc-hero-yellow">
          <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,.62)', marginBottom: 8 }}>Minha Meta</div>
          <h1 style={{ fontSize: 29, fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.05, maxWidth: 420 }}>
            Descubra quanto você precisa faturar por dia.
          </h1>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(17,24,39,.68)', lineHeight: 1.45, marginTop: 10 }}>
            Cadastre seus custos principais e veja sua meta mínima mensal, diária, por hora e por km.
          </p>
          {!showResult && (
            <a
              href="#goal-form"
              onClick={() => trackGoalEvent('goal_hero_cta_clicked')}
              className="tc-btn-primary"
              style={{ display: 'inline-flex', textDecoration: 'none', marginTop: 16, boxShadow: 'none', background: 'var(--ink)', color: '#fff' }}
            >
              Calcular minha meta
            </a>
          )}
        </section>

        {showResult && (
          <>
            <section className="tc-hero-dark">
              <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,.65)' }}>Sua meta de hoje</div>
              <div className="tc-money-xl" style={{ color: 'var(--yellow)', marginTop: 8 }}>
                {formatCurrencyBRL(totals.metaDiaria)}
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.72)', lineHeight: 1.45, marginTop: 10 }}>
                Esse é o mínimo que você precisa faturar por dia para bater sua meta mensal.
              </p>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <MetricCard label="Meta mensal" value={formatCurrencyBRL(totals.metaMinimaMensal)} />
              <MetricCard label="Meta por hora" value={formatCurrencyBRL(totals.metaPorHora)} />
              <MetricCard label="Meta por km" value={totals.metaPorKm ? formatCurrencyBRL(totals.metaPorKm) : 'Adicionar km'} hint={!totals.metaPorKm ? 'Adicione km medio para calcular.' : undefined} />
              <MetricCard label="Custos fixos + combustivel" value={formatCurrencyBRL(totals.custosBasicosMensais + totals.custosAvancados)} />
              <MetricCard label="Lucro desejado" value={formatCurrencyBRL(form.lucro_pessoal_desejado)} />
            </section>
          </>
        )}

        <form id="goal-form" onSubmit={handleSubmit} className="tc-card" style={{ display: 'grid', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              {showResult ? 'Ajustar sua meta' : 'Comece com 5 perguntas'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 700, marginTop: 4 }}>
              Sem login, sem formulário comprido. Depois você pode melhorar os detalhes.
            </p>
          </div>

          <MoneyInput
            label="Quanto você quer tirar limpo no mês?"
            value={form.lucro_pessoal_desejado}
            onChange={(value) => updateField('lucro_pessoal_desejado', value)}
            placeholder="4.000,00"
            hint="Esse é o dinheiro que você quer que sobre para você no fim do mês."
            error={error(!form.lucro_pessoal_desejado, 'Informe quanto precisa sobrar para você.')}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <NumberInput
              label="Dias por mês"
              value={form.dias_trabalhados_mes}
              onChange={(value) => updateField('dias_trabalhados_mes', value)}
              placeholder="24"
              decimals={0}
              step={1}
              error={error(!form.dias_trabalhados_mes, 'Informe os dias.')}
              required
            />
            <NumberInput
              label="Horas por dia"
              value={form.horas_trabalhadas_dia}
              onChange={(value) => updateField('horas_trabalhadas_dia', value)}
              placeholder="8"
              decimals={0}
              step={1}
              error={error(!form.horas_trabalhadas_dia, 'Informe as horas.')}
              required
            />
          </div>

          <SegmentedCarCost value={form.tipo_custo_carro} onChange={(value) => updateField('tipo_custo_carro', value)} />

          {form.tipo_custo_carro === 'prestacao' && (
            <MoneyInput
              label="Valor da prestação mensal"
              value={form.valor_prestacao_mensal}
              onChange={(value) => updateField('valor_prestacao_mensal', value)}
              placeholder="1.800,00"
              error={error(!form.valor_prestacao_mensal, 'Informe a prestação mensal.')}
              required
            />
          )}

          {form.tipo_custo_carro === 'diaria' && (
            <MoneyInput
              label="Valor da diária do carro"
              value={form.valor_diaria}
              onChange={(value) => updateField('valor_diaria', value)}
              placeholder="120,00"
              error={error(!form.valor_diaria, 'Informe a diária.')}
              required
            />
          )}

          <MoneyInput
            label="Quanto gasta de combustível por mês?"
            value={form.combustivel_medio_mensal}
            onChange={(value) => updateField('combustivel_medio_mensal', value)}
            placeholder="1.500,00"
            hint="Se não souber, coloque uma estimativa. Depois você poderá registrar abastecimentos para calcular melhor."
            error={error(!form.combustivel_medio_mensal, 'Informe uma estimativa de combustivel.')}
            required
          />

          <button
            type="submit"
            onClick={() => trackGoalEvent('goal_submit_clicked', {
              has_result: showResult,
              car_cost_type: form.tipo_custo_carro,
            })}
            className="tc-btn-primary"
          >
            Ver minha meta
          </button>
        </form>

        {showResult && (
          <>
            <section className="tc-card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => {
                  setAdvancedOpen((open) => !open);
                  if (!advancedOpen) trackGoalEvent('advanced_costs_opened');
                }}
                style={{ width: '100%', border: 0, background: 'transparent', padding: 16, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}
              >
                <span>
                  <span style={{ display: 'block', fontSize: 16, fontWeight: 900, color: 'var(--ink)' }}>Quer deixar sua meta mais precisa?</span>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', marginTop: 4 }}>Adicione outros custos do carro para calcular uma meta mais real.</span>
                </span>
                <span style={{ width: 34, height: 34, borderRadius: 12, background: 'var(--gray-100)', display: 'grid', placeItems: 'center', flexShrink: 0, transform: advancedOpen ? 'rotate(180deg)' : 'none' }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </span>
              </button>

              {advancedOpen && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--gray-100)', display: 'grid', gap: 12 }}>
                  <div style={{ paddingTop: 14 }}>
                    <NumberInput
                      label="Km médio rodado por mês"
                      value={form.km_medio_mensal}
                      onChange={(value) => updateField('km_medio_mensal', value)}
                      placeholder="3000"
                      suffix="km"
                      step={1}
                      decimals={0}
                    />
                  </div>
                  {advancedFields.map((field) => (
                    <MoneyInput
                      key={String(field.key)}
                      label={field.label}
                      value={Number(form[field.key]) || 0}
                      onChange={(value) => updateField(field.key, value as never)}
                      placeholder="0,00"
                    />
                  ))}
                </div>
              )}
            </section>

            {!driver && !accountCtaDismissed && (
              <section className="tc-card" style={{ background: 'linear-gradient(180deg, #FFFBEC, #FFF)', borderColor: '#FCEBA8' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)' }}>Não perca sua meta</div>
                <p style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 700, lineHeight: 1.45, marginTop: 5 }}>
                  Sua meta foi salva neste aparelho. Crie uma conta grátis para acessar seus dados em qualquer celular.
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <Link
                    href="/cadastro"
                    onClick={() => trackGoalEvent('goal_account_cta_clicked', { action: 'create_account' })}
                    style={{ background: 'var(--ink)', color: '#fff', borderRadius: 12, padding: '11px 14px', fontSize: 13, fontWeight: 900, textDecoration: 'none' }}
                  >
                    Criar conta grátis
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      trackGoalEvent('goal_account_cta_dismissed');
                      setAccountCtaDismissed(true);
                    }}
                    style={{ border: 0, background: 'transparent', color: 'var(--gray-700)', borderRadius: 12, padding: '11px 10px', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}
                  >
                    Continuar sem conta
                  </button>
                </div>
              </section>
            )}

            <MonthSummary goal={computedGoal} />
          </>
        )}
      </div>
    </PageContainer>
  );
}
