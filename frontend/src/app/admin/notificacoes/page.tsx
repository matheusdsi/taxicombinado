'use client';

import { PageHeader, KpiCard, Card, EmptyState, num } from '../_components';

const NOTIFICATION_TYPES = [
  { type: 'Novo agendamento', icon: '📅', color: 'bg-blue-50 text-blue-700', desc: 'Enviada quando um passageiro solicita agendamento' },
  { type: 'Corrida cancelada', icon: '❌', color: 'bg-red-50 text-red-600', desc: 'Enviada quando uma corrida é cancelada' },
  { type: 'Lembrete de corrida', icon: '⏰', color: 'bg-amber-50 text-amber-700', desc: 'Lembrete enviado antes da corrida' },
  { type: 'Sistema', icon: '⚙️', color: 'bg-gray-100 text-gray-600', desc: 'Notificações gerais do sistema' },
  { type: 'Parceiro', icon: '🤝', color: 'bg-purple-50 text-purple-700', desc: 'Novidades de parceiros' },
  { type: 'Desafio', icon: '🏆', color: 'bg-[#FFF8DC] text-[#C89000]', desc: 'Notificação de desafio/rota do dia' },
];

export default function NotificacoesPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Notificações" subtitle="Central de notificações e templates" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Enviadas" value="—" color="blue" />
        <KpiCard label="Não lidas" value="8" color="yellow" />
        <KpiCard label="Pendentes" value="—" color="default" />
        <KpiCard label="Templates" value={num(NOTIFICATION_TYPES.length)} color="green" />
      </div>

      <Card title="Templates de notificação" subtitle="Tipos de notificação preparados para o sistema" className="mb-6">
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NOTIFICATION_TYPES.map((n) => (
            <div key={n.type} className="rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-all">
              <div className="flex items-start gap-3">
                <span className="text-xl">{n.icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-[#0F1623]">{n.type}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">{n.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <EmptyState
          title="Notificações em desenvolvimento"
          description="A central de envio de notificações (push, WhatsApp, e-mail) será implementada aqui. A estrutura de tipos e templates já está definida."
          icon={<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
        />
      </Card>
    </div>
  );
}
