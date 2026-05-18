'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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
  estimatedPriceMin?: number;
  estimatedPriceMax?: number;
  estimatedDistanceKm?: number;
  status: 'pendente' | 'aceito' | 'realizado' | 'cancelado';
  createdAt: string;
}

const STATUS_CONFIG = {
  pendente:  { label: 'Pendente',  bg: '#FFF7ED', color: '#7C2D12', dot: '#F97316' },
  aceito:    { label: 'Aceito',    bg: '#EFF6FF', color: '#1E3A8A', dot: '#3B82F6' },
  realizado: { label: 'Realizado', bg: '#F0FDF4', color: '#14532D', dot: '#22C55E' },
  cancelado: { label: 'Cancelado', bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' },
} as const;

const STATUS_FLOW: Record<string, string[]> = {
  pendente:  ['aceito', 'cancelado'],
  aceito:    ['realizado', 'cancelado'],
  realizado: [],
  cancelado: [],
};

type FilterKey = 'todos' | 'pendente' | 'aceito' | 'realizado' | 'cancelado';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '14px 16px', flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: accent ?? '#111827', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AgendamentosPage() {
  const { driver: user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<SchedulingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    setUpdatingId(id);
    try {
      const res = await api.patch(`/api/profile/me/schedules/${id}`, { status });
      setItems((prev) => prev.map((it) => it.id === id ? { ...it, status: res.data.data.status } : it));
    } catch {
      alert('Erro ao atualizar status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const buildWhatsApp = (item: SchedulingRequest) => {
    const phone = item.passengerWhatsapp.replace(/\D/g, '');
    const priceInfo = item.estimatedPriceMin && item.estimatedPriceMax
      ? ` Estimativa: R$ ${item.estimatedPriceMin}–R$ ${item.estimatedPriceMax}.` : '';
    const msg = `Olá ${item.passengerName}! Recebi sua solicitação de agendamento para ${fmtDate(item.scheduledDate)} às ${item.scheduledTime}. De: ${item.originAddress} → Para: ${item.destinationAddress}.${priceInfo} Vamos confirmar?`;
    return `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
  };

  // ── Estatísticas financeiras ─────────────────────────────────
  const pendentes = items.filter((i) => i.status === 'pendente');
  const aceitos = items.filter((i) => i.status === 'aceito');
  const realizados = items.filter((i) => i.status === 'realizado');
  const comEstimativa = realizados.filter((i) => i.estimatedPriceMin);

  const estimativaTotal = comEstimativa.reduce((sum, i) => {
    const mid = ((i.estimatedPriceMin ?? 0) + (i.estimatedPriceMax ?? i.estimatedPriceMin ?? 0)) / 2;
    return sum + mid;
  }, 0);

  const estimativaPendente = [...pendentes, ...aceitos]
    .filter((i) => i.estimatedPriceMin)
    .reduce((sum, i) => {
      const mid = ((i.estimatedPriceMin ?? 0) + (i.estimatedPriceMax ?? i.estimatedPriceMin ?? 0)) / 2;
      return sum + mid;
    }, 0);

  const distanciaTotal = realizados
    .filter((i) => i.estimatedDistanceKm)
    .reduce((sum, i) => sum + (i.estimatedDistanceKm ?? 0), 0);

  // Próximos 7 dias
  const hoje = new Date();
  const em7dias = new Date(hoje); em7dias.setDate(hoje.getDate() + 7);
  const proximosAceitos = aceitos.filter((i) => {
    const d = new Date(i.scheduledDate + 'T12:00:00');
    return d >= hoje && d <= em7dias;
  });

  // ── Filtro e ordenação ───────────────────────────────────────
  const filtered = filter === 'todos' ? items : items.filter((it) => it.status === filter);

  // Pendentes primeiro, depois por data
  const sorted = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { pendente: 0, aceito: 1, realizado: 2, cancelado: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return a.scheduledDate.localeCompare(b.scheduledDate) || a.scheduledTime.localeCompare(b.scheduledTime);
  });

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#111827', animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 100px' }}>

      {/* Cabeçalho */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#111827' }}>Agendamentos</div>
        <div style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600, marginTop: 4 }}>
          Solicitações recebidas pelo seu perfil público
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <StatCard
          label="Realizados"
          value={String(realizados.length)}
          sub={realizados.length > 0 ? `~R$ ${fmt(estimativaTotal)} estimado` : 'Nenhum ainda'}
          accent="#111827"
        />
        <StatCard
          label="Pendentes"
          value={String(pendentes.length)}
          sub={pendentes.length > 0 ? `Aguardando resposta` : 'Em dia!'}
          accent={pendentes.length > 0 ? '#F97316' : '#22C55E'}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <StatCard
          label="A confirmar"
          value={String(aceitos.length)}
          sub={proximosAceitos.length > 0 ? `${proximosAceitos.length} nos próx. 7 dias` : 'Nenhum próximo'}
          accent="#3B82F6"
        />
        <StatCard
          label="Potencial aberto"
          value={estimativaPendente > 0 ? `R$ ${fmt(estimativaPendente)}` : '—'}
          sub={distanciaTotal > 0 ? `${distanciaTotal.toFixed(0)} km rodados` : 'Em aberto'}
          accent="#8B5CF6"
        />
      </div>

      {/* Alerta de pendentes */}
      {pendentes.length > 0 && (
        <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#9A3412' }}>
              {pendentes.length} solicitação{pendentes.length > 1 ? 'ões' : ''} aguardando resposta
            </div>
            <div style={{ fontSize: 11, color: '#C2410C', fontWeight: 600, marginTop: 2 }}>
              Responda rápido — clientes que esperam demais cancelam
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {(['todos', 'pendente', 'aceito', 'realizado', 'cancelado'] as const).map((f) => {
          const count = f === 'todos' ? items.length : items.filter((i) => i.status === f).length;
          return (
            <button key={f} type="button" onClick={() => setFilter(f)}
              style={{ padding: '6px 12px', borderRadius: 20, border: '1.5px solid', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                borderColor: filter === f ? '#111827' : '#E5E7EB',
                background: filter === f ? '#111827' : '#fff',
                color: filter === f ? '#fff' : '#6B7280' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span style={{ background: filter === f ? 'rgba(255,255,255,.2)' : '#F3F4F6', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 800 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF', fontWeight: 700 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15 }}>Nenhuma solicitação {filter !== 'todos' ? `"${filter}"` : ''} encontrada</div>
          {items.length === 0 && (
            <div style={{ fontSize: 13, marginTop: 8, fontWeight: 600 }}>
              Compartilhe seu perfil público para receber agendamentos
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((item) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pendente;
          const nextStatuses = STATUS_FLOW[item.status] ?? [];
          const isExpanded = expandedId === item.id;
          const hasEstimate = item.estimatedPriceMin != null;
          const isUpdating = updatingId === item.id;

          // Verifica se a data já passou
          const itemDate = new Date(item.scheduledDate + 'T23:59:59');
          const isPast = itemDate < new Date() && item.status === 'aceito';

          return (
            <div key={item.id} style={{ background: '#fff', border: `1.5px solid ${isPast ? '#FCA5A5' : '#E5E7EB'}`, borderRadius: 16, overflow: 'hidden' }}>
              {/* Banner de alerta: data passou mas ainda aceito */}
              {isPast && (
                <div style={{ background: '#FEF2F2', padding: '6px 14px', fontSize: 11, fontWeight: 700, color: '#B91C1C', borderBottom: '1px solid #FECACA' }}>
                  ⚠️ Data da corrida já passou — marque como Realizado ou Cancelado
                </div>
              )}

              {/* Header do card — clicável para expandir */}
              <button type="button" onClick={() => setExpandedId(isExpanded ? null : item.id)}
                style={{ width: '100%', background: 'transparent', border: 0, padding: '14px 14px 0', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>{item.passengerName}</div>
                      {hasEstimate && (
                        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 800, color: '#065F46', whiteSpace: 'nowrap' }}>
                          R$ {item.estimatedPriceMin}–{item.estimatedPriceMax}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3, fontWeight: 600 }}>
                      {fmtDate(item.scheduledDate)} às {item.scheduledTime}
                      {item.estimatedDistanceKm && ` · ~${item.estimatedDistanceKm.toFixed(1)} km`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                      {cfg.label}
                    </span>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>

                {/* Rota resumida */}
                <div style={{ display: 'flex', gap: 6, fontSize: 12, color: '#374151', fontWeight: 600, marginBottom: 12, alignItems: 'center' }}>
                  <span style={{ color: '#22C55E', fontWeight: 900, flexShrink: 0 }}>A</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.originAddress}</span>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{item.destinationAddress}</span>
                  <span style={{ color: '#EF4444', fontWeight: 900, flexShrink: 0 }}>B</span>
                </div>
              </button>

              {/* Ações rápidas (sempre visíveis para pendente) */}
              {(item.status === 'pendente' || isExpanded) && nextStatuses.length > 0 && (
                <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a href={buildWhatsApp(item)} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#25D366', color: '#fff', border: 0, borderRadius: 10, padding: '8px 12px', fontFamily: 'inherit', fontWeight: 800, fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d="M12 2a10 10 0 0 0-8.6 15.07L2 22l5.07-1.32A10 10 0 1 0 12 2Zm5.27 14.27c-.22.62-1.27 1.17-1.78 1.22-.46.05-1.05.07-1.69-.1a13 13 0 0 1-1.83-.68 11.36 11.36 0 0 1-4.32-3.83c-.34-.5-1.18-1.58-1.18-3.02 0-1.43.74-2.13 1-2.43.27-.3.58-.37.78-.37l.56.01c.18 0 .42-.07.66.5l.93 2.27c.08.16.13.34.02.55l-.32.5c-.1.16-.22.34-.05.65.17.3.75 1.22 1.61 1.97 1.1.96 2.04 1.27 2.36 1.42.32.15.5.13.69-.08.18-.2.79-.92.99-1.24.2-.32.4-.27.68-.16.27.1 1.74.82 2.04.97.3.15.5.22.57.34.07.13.07.75-.16 1.37Z"/>
                    </svg>
                    WhatsApp
                  </a>
                  {nextStatuses.map((s) => {
                    const nc = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG];
                    const isCancel = s === 'cancelado';
                    return (
                      <button key={s} type="button" disabled={isUpdating} onClick={() => updateStatus(item.id, s)}
                        style={{ padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${isCancel ? '#FECACA' : '#A7F3D0'}`, background: isCancel ? '#FEF2F2' : '#ECFDF5', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, cursor: 'pointer', color: isCancel ? '#991B1B' : '#065F46', opacity: isUpdating ? 0.6 : 1 }}>
                        {isUpdating ? '...' : `Marcar ${nc?.label ?? s}`}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Detalhes expandidos */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #F3F4F6', padding: 14 }}>
                  {/* Rota completa */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ color: '#22C55E', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>A</span>
                      <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{item.originAddress}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: '#EF4444', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>B</span>
                      <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{item.destinationAddress}</span>
                    </div>
                  </div>

                  {/* Info do passageiro e corrida */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    <span style={{ background: '#F9FAFB', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                      👥 {item.passengerCount} passageiro{item.passengerCount !== 1 ? 's' : ''}
                    </span>
                    {item.luggageCount > 0 && (
                      <span style={{ background: '#F9FAFB', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                        🧳 {item.luggageCount} mala{item.luggageCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {item.estimatedDistanceKm && (
                      <span style={{ background: '#F9FAFB', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                        📏 {item.estimatedDistanceKm.toFixed(1)} km
                      </span>
                    )}
                  </div>

                  {/* Estimativa de preço destacada */}
                  {hasEstimate && (
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '10px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.04em' }}>Estimativa de corrida</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#065F46', marginTop: 2 }}>
                          R$ {item.estimatedPriceMin} – R$ {item.estimatedPriceMax}
                        </div>
                      </div>
                      <div style={{ fontSize: 24 }}>💰</div>
                    </div>
                  )}

                  {item.notes && (
                    <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#4B5563', fontWeight: 600, marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, color: '#374151' }}>Obs: </span>{item.notes}
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: '#D1D5DB', fontWeight: 600, marginTop: 4 }}>
                    Recebido em {new Date(item.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {/* Ações no expandido para realizados/cancelados */}
                  {item.status === 'aceito' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <a href={buildWhatsApp(item)} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#25D366', color: '#fff', borderRadius: 10, padding: '8px 12px', fontFamily: 'inherit', fontWeight: 800, fontSize: 12, textDecoration: 'none' }}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M12 2a10 10 0 0 0-8.6 15.07L2 22l5.07-1.32A10 10 0 1 0 12 2Zm5.27 14.27c-.22.62-1.27 1.17-1.78 1.22-.46.05-1.05.07-1.69-.1a13 13 0 0 1-1.83-.68 11.36 11.36 0 0 1-4.32-3.83c-.34-.5-1.18-1.58-1.18-3.02 0-1.43.74-2.13 1-2.43.27-.3.58-.37.78-.37l.56.01c.18 0 .42-.07.66.5l.93 2.27c.08.16.13.34.02.55l-.32.5c-.1.16-.22.34-.05.65.17.3.75 1.22 1.61 1.97 1.1.96 2.04 1.27 2.36 1.42.32.15.5.13.69-.08.18-.2.79-.92.99-1.24.2-.32.4-.27.68-.16.27.1 1.74.82 2.04.97.3.15.5.22.57.34.07.13.07.75-.16 1.37Z"/>
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Link para perfil público */}
      <div style={{ marginTop: 24, background: '#F9FAFB', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#374151' }}>Perfil público</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, marginTop: 2 }}>Configure como os passageiros te encontram</div>
        </div>
        <Link href="/meu-perfil" style={{ background: '#111827', color: '#fff', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
          Configurar →
        </Link>
      </div>
    </div>
  );
}
