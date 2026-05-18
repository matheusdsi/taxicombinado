'use client';

import { PageHeader, KpiCard, Card, EmptyState, num } from '../_components';

const PLANS = [
  { name: 'Grátis', price: 'R$ 0', color: 'bg-gray-100 text-gray-600', features: ['Calculadora básica', 'Perfil público simples', '10 cotações/dia'] },
  { name: 'Pro', price: 'R$ 29,90/mês', color: 'bg-blue-50 text-blue-700', features: ['Cotações ilimitadas', 'Perfil público completo', 'Histórico completo', 'Agendamentos'] },
  { name: 'Destaque', price: 'R$ 49,90/mês', color: 'bg-[#FFF8DC] text-[#C89000]', features: ['Tudo do Pro', 'Destaque na listagem', 'Badge premium', 'Analytics avançado'] },
  { name: 'Premium', price: 'R$ 89,90/mês', color: 'bg-purple-50 text-purple-700', features: ['Tudo do Destaque', 'Suporte prioritário', 'Múltiplos veículos', 'Relatórios personalizados'] },
];

export default function PlanosPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Planos e Assinaturas" subtitle="Estrutura de monetização da plataforma" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Assinaturas ativas" value="—" color="green" />
        <KpiCard label="Plano Grátis" value="—" color="default" />
        <KpiCard label="Plano Pro" value="—" color="blue" />
        <KpiCard label="Premium/Destaque" value="—" color="yellow" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {PLANS.map((p) => (
          <div key={p.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <span className={`inline-flex items-center rounded-xl px-3 py-1 text-[12px] font-bold mb-4 ${p.color}`}>{p.name}</span>
            <p className="text-[20px] font-bold text-[#0F1623] mb-4">{p.price}</p>
            <ul className="space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[13px] text-gray-600">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#16A34A" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Card>
        <EmptyState
          title="Módulo de assinaturas em desenvolvimento"
          description="A estrutura de planos está definida. A integração com pagamento e o controle de assinaturas ativas serão implementados em breve."
          icon={<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
        />
      </Card>
    </div>
  );
}
