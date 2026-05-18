'use client';

import { PageHeader, KpiCard, Card, EmptyState, num } from '../_components';

export default function CorridasRealizadasPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Corridas Realizadas" subtitle="Corridas concluídas e pagas" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Realizadas" value="—" color="green" />
        <KpiCard label="Valor total est." value="—" color="yellow" />
        <KpiCard label="Ticket médio" value="—" color="blue" />
        <KpiCard label="Taxistas ativos" value="—" color="purple" />
        <KpiCard label="Rotas mais comuns" value="—" color="default" />
      </div>
      <Card>
        <EmptyState
          title="Módulo em desenvolvimento"
          description="As corridas realizadas/pagas serão registradas aqui. O status 'realizado' é atualizado via painel de agendamentos."
          icon={<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><circle cx="12" cy="12" r="10"/><polyline points="16 8 10 14 7 11"/></svg>}
        />
      </Card>
    </div>
  );
}
