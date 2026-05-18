'use client';

import { useEffect, useState } from 'react';
import {
  PageHeader, KpiCard, Card, EmptyState,
} from '../_components';

export default function PassageirosPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Passageiros"
        subtitle="Passageiros que solicitaram agendamentos ou usaram formulários"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Passageiros únicos" value="—" color="blue"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
        />
        <KpiCard label="Com agendamento" value="—" color="green"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <KpiCard label="Recorrentes" value="—" color="yellow"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>}
        />
        <KpiCard label="Novos (30d)" value="—" color="purple"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>}
        />
      </div>

      <Card>
        <EmptyState
          title="Módulo de passageiros em breve"
          description="Os dados de passageiros serão exibidos aqui conforme o módulo de agendamentos evolui. Passageiros são identificados via formulário de agendamento nos perfis públicos dos taxistas."
          icon={<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
        />
      </Card>
    </div>
  );
}
