'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface SchedulingRequest {
  id: string;
  passengerName: string;
  passengerWhatsapp: string;
  originAddress: string;
  destinationAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  passengerCount: number;
  luggageCount: number;
  notes?: string;
  status: 'pendente' | 'aceito' | 'realizado' | 'cancelado';
  createdAt: string;
}

const STATUS_CONFIG = {
  pendente:  { label: 'Pendente',  bg: 'var(--orange-soft)', color: '#7C2D12' },
  aceito:    { label: 'Aceito',    bg: 'var(--blue-soft)',   color: '#1E3A8A' },
  realizado: { label: 'Realizado', bg: 'var(--green-soft)',  color: '#14532D' },
  cancelado: { label: 'Cancelado', bg: 'var(--gray-100)',    color: 'var(--gray-500)' },
} as const;

const STATUS_FLOW: Record<string, string[]> = {
  pendente:  ['aceito', 'cancelado'],
  aceito:    ['realizado', 'cancelado'],
  realizado: [],
  cancelado: [],
};

export default function AgendamentosPage() {
  const { driver: user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<SchedulingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'pendente' | 'aceito' | 'realizado' | 'cancelado'>('todos');

  useEffect(() => {
    if (!authLoading && !user) router.push('/entrar');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    api.get('/api/profile/me/schedules').then((res) => {
      setItems(res.data.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await api.patch(`/api/profile/me/schedules/${id}`, { status });
      setItems((prev) => prev.map((it) => it.id === id ? { ...it, status: res.data.data.status } : it));
    } catch {
      alert('Erro ao atualizar status.');
    }
  };

  const buildWhatsApp = (item: SchedulingRequest) => {
    const phone = item.passengerWhatsapp.replace(/\D/g, '');
    const msg = `Olá ${item.passengerName}! Recebi sua solicitação de agendamento para ${item.scheduledDate} às ${item.scheduledTime}. De: ${item.originAddress} → Para: ${item.destinationAddress}. Vamos confirmar?`;
    return `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
  };

  const filtered = filter === 'todos' ? items : items.filter((it) => it.status === filter);

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--gray-200)', borderTopColor: 'var(--ink)', animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 80px' }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/meu-perfil" style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-500)', textDecoration: 'none' }}>← Voltar ao perfil</Link>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 8, color: 'var(--ink)' }}>Agendamentos</div>
        <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600, marginTop: 4 }}>
          Solicitações recebidas pelo seu perfil público.
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {(['todos', 'pendente', 'aceito', 'realizado', 'cancelado'] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            style={{ padding: '6px 12px', borderRadius: 20, border: '1.5px solid', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              borderColor: filter === f ? 'var(--ink)' : 'var(--gray-200)',
              background: filter === f ? 'var(--ink)' : 'var(--surface)',
              color: filter === f ? '#fff' : 'var(--gray-600)' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray-400)', fontWeight: 700 }}>
          Nenhuma solicitação {filter !== 'todos' ? `com status "${filter}"` : ''} encontrada.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((item) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pendente;
          const nextStatuses = STATUS_FLOW[item.status] ?? [];
          return (
            <div key={item.id} style={{ background: 'var(--surface)', border: '1.5px solid var(--gray-200)', borderRadius: 16, padding: 16 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{item.passengerName}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                    {item.scheduledDate} às {item.scheduledTime}
                  </div>
                </div>
                <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                  {cfg.label}
                </span>
              </div>

              {/* Rota */}
              <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600, marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--green)', fontWeight: 800, flexShrink: 0 }}>A</span>
                  <span>{item.originAddress}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 4 }}>
                  <span style={{ color: 'var(--red)', fontWeight: 800, flexShrink: 0 }}>B</span>
                  <span>{item.destinationAddress}</span>
                </div>
              </div>

              {/* Info */}
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, marginBottom: item.notes ? 8 : 0 }}>
                <span>{item.passengerCount} passageiro{item.passengerCount !== 1 ? 's' : ''}</span>
                {item.luggageCount > 0 && <span>{item.luggageCount} mala{item.luggageCount !== 1 ? 's' : ''}</span>}
              </div>

              {item.notes && (
                <div style={{ fontSize: 12, color: 'var(--gray-600)', fontWeight: 600, background: 'var(--gray-50)', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
                  {item.notes}
                </div>
              )}

              {/* Ações */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                <a href={buildWhatsApp(item)} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#25D366', color: '#fff', border: 0, borderRadius: 10, padding: '8px 12px', fontFamily: 'inherit', fontWeight: 800, fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 2a10 10 0 0 0-8.6 15.07L2 22l5.07-1.32A10 10 0 1 0 12 2Zm5.27 14.27c-.22.62-1.27 1.17-1.78 1.22-.46.05-1.05.07-1.69-.1a13 13 0 0 1-1.83-.68 11.36 11.36 0 0 1-4.32-3.83c-.34-.5-1.18-1.58-1.18-3.02 0-1.43.74-2.13 1-2.43.27-.3.58-.37.78-.37l.56.01c.18 0 .42-.07.66.5l.93 2.27c.08.16.13.34.02.55l-.32.5c-.1.16-.22.34-.05.65.17.3.75 1.22 1.61 1.97 1.1.96 2.04 1.27 2.36 1.42.32.15.5.13.69-.08.18-.2.79-.92.99-1.24.2-.32.4-.27.68-.16.27.1 1.74.82 2.04.97.3.15.5.22.57.34.07.13.07.75-.16 1.37Z"/>
                  </svg>
                  WhatsApp
                </a>
                {nextStatuses.map((s) => {
                  const nc = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG];
                  return (
                    <button key={s} type="button" onClick={() => updateStatus(item.id, s)}
                      style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--gray-200)', background: 'var(--surface)', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, cursor: 'pointer', color: 'var(--ink)' }}>
                      Marcar como {nc?.label ?? s}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
