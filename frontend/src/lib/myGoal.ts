'use client';

import { getOrCreateAnonymousId } from './anonymousId';

export type CarCostType = 'prestacao' | 'diaria' | 'nenhum';

export interface MyGoalData {
  anonymous_id?: string;
  user_id?: string;
  lucro_pessoal_desejado: number;
  dias_trabalhados_mes: number;
  horas_trabalhadas_dia: number;
  tipo_custo_carro: CarCostType;
  valor_prestacao_mensal: number;
  valor_diaria: number;
  combustivel_medio_mensal: number;
  seguro: number;
  protecao_veicular: number;
  manutencao_mensal: number;
  lavagem_mensal: number;
  internet_celular: number;
  estacionamento: number;
  pneus: number;
  oleo: number;
  rastreador: number;
  contabilidade: number;
  outros_custos: number;
  km_medio_mensal: number;
  meta_minima_mensal: number;
  meta_diaria: number;
  meta_por_hora: number;
  meta_por_km: number | null;
  updated_at?: string;
}

export interface MyGoalCalculation {
  custoCarroMensal: number;
  custosBasicosMensais: number;
  custosAvancados: number;
  metaMinimaMensal: number;
  metaDiaria: number;
  metaPorHora: number;
  metaPorKm: number | null;
}

export const MY_GOAL_STORAGE_KEY = 'tc_my_goal_v1';

export const emptyGoalData: MyGoalData = {
  lucro_pessoal_desejado: 0,
  dias_trabalhados_mes: 0,
  horas_trabalhadas_dia: 0,
  tipo_custo_carro: 'prestacao',
  valor_prestacao_mensal: 0,
  valor_diaria: 0,
  combustivel_medio_mensal: 0,
  seguro: 0,
  protecao_veicular: 0,
  manutencao_mensal: 0,
  lavagem_mensal: 0,
  internet_celular: 0,
  estacionamento: 0,
  pneus: 0,
  oleo: 0,
  rastreador: 0,
  contabilidade: 0,
  outros_custos: 0,
  km_medio_mensal: 0,
  meta_minima_mensal: 0,
  meta_diaria: 0,
  meta_por_hora: 0,
  meta_por_km: null,
};

function safeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function calculateMyGoal(data: Partial<MyGoalData>): MyGoalCalculation {
  const dias = Math.max(1, safeNumber(data.dias_trabalhados_mes));
  const horas = Math.max(1, safeNumber(data.horas_trabalhadas_dia));
  const lucro = safeNumber(data.lucro_pessoal_desejado);
  const combustivel = safeNumber(data.combustivel_medio_mensal);
  const tipo = data.tipo_custo_carro || 'nenhum';

  const custoCarroMensal =
    tipo === 'prestacao'
      ? safeNumber(data.valor_prestacao_mensal)
      : tipo === 'diaria'
        ? safeNumber(data.valor_diaria) * dias
        : 0;

  const custosAvancados =
    safeNumber(data.seguro) +
    safeNumber(data.protecao_veicular) +
    safeNumber(data.manutencao_mensal) +
    safeNumber(data.lavagem_mensal) +
    safeNumber(data.internet_celular) +
    safeNumber(data.estacionamento) +
    safeNumber(data.pneus) +
    safeNumber(data.oleo) +
    safeNumber(data.rastreador) +
    safeNumber(data.contabilidade) +
    safeNumber(data.outros_custos);

  const custosBasicosMensais = custoCarroMensal + combustivel;
  const metaMinimaMensal = custosBasicosMensais + custosAvancados + lucro;
  const metaDiaria = metaMinimaMensal / dias;
  const metaPorHora = metaDiaria / horas;
  const kmMedioMensal = safeNumber(data.km_medio_mensal);
  const metaPorKm = kmMedioMensal > 0 ? metaMinimaMensal / kmMedioMensal : null;

  return {
    custoCarroMensal,
    custosBasicosMensais,
    custosAvancados,
    metaMinimaMensal,
    metaDiaria,
    metaPorHora,
    metaPorKm,
  };
}

export function withGoalTotals(data: MyGoalData): MyGoalData {
  const totals = calculateMyGoal(data);
  return {
    ...data,
    meta_minima_mensal: totals.metaMinimaMensal,
    meta_diaria: totals.metaDiaria,
    meta_por_hora: totals.metaPorHora,
    meta_por_km: totals.metaPorKm,
  };
}

export function getMyGoal(): MyGoalData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MY_GOAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MyGoalData;
    return withGoalTotals({ ...emptyGoalData, ...parsed });
  } catch {
    return null;
  }
}

export function saveMyGoal(data: MyGoalData, userId?: string): MyGoalData {
  const anonymousId = getOrCreateAnonymousId();
  const saved = withGoalTotals({
    ...emptyGoalData,
    ...data,
    anonymous_id: anonymousId,
    user_id: userId,
    updated_at: new Date().toISOString(),
  });
  localStorage.setItem(MY_GOAL_STORAGE_KEY, JSON.stringify(saved));
  return saved;
}

export function hasMyGoal(): boolean {
  const goal = getMyGoal();
  return Boolean(goal && goal.meta_minima_mensal > 0 && goal.meta_diaria > 0);
}

export function trackGoalEvent(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const analyticsWindow = window as typeof window & {
    dataLayer?: Array<Record<string, unknown>>;
  };
  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  analyticsWindow.dataLayer.push({ event, ...params });
}
