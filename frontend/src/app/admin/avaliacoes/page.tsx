'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import {
  PageHeader, KpiCard, Card, EmptyState, LoadingState,
  Table, Th, Td, Tr, fmtDate, num,
} from '../_components';

interface Feedback {
  id: string; rating: number; category?: string; message?: string; createdAt: string;
}

interface AdminStats {
  overview: { totalFeedback: number; avgRating: number | null };
  recentActivity: { feedback: Feedback[] };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={s <= rating ? '#F5B800' : 'none'}
          stroke={s <= rating ? '#F5B800' : '#D1D5DB'}
          strokeWidth={1.5}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span className="ml-1 text-[12px] font-bold text-[#0F1623]">{rating}</span>
    </div>
  );
}

export default function AvaliacoesPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl('/api/admin/stats'), { credentials: 'include' });
        if (res.status === 401) { window.location.href = '/admin/login'; return; }
        const json = await res.json();
        setStats(json.data);
      } catch { /* silent */ } finally { setLoading(false); }
    }
    load();
  }, []);

  const feedback = stats?.recentActivity.feedback ?? [];
  const avgRating = stats?.overview.avgRating;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Avaliações" subtitle="Feedbacks e avaliações recebidas" />

      {loading ? <LoadingState /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
              label="Avaliação média"
              value={avgRating ? `${avgRating.toFixed(1)} ★` : '—'}
              color="yellow"
            />
            <KpiCard label="Total de avaliações" value={num(stats?.overview.totalFeedback)} color="blue" />
            <KpiCard label="Avaliações positivas (≥4)" value={num(feedback.filter((f) => f.rating >= 4).length)} color="green" />
            <KpiCard label="Avaliações negativas (<3)" value={num(feedback.filter((f) => f.rating < 3).length)} color="red" />
          </div>

          {avgRating && (
            <Card className="mb-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[48px] font-bold text-[#0F1623] leading-none">{avgRating.toFixed(1)}</p>
                  <div className="flex gap-0.5 justify-center mt-1">
                    {[1,2,3,4,5].map((s) => (
                      <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s <= Math.round(avgRating) ? '#F5B800' : '#E5E7EB'} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    ))}
                  </div>
                  <p className="text-[12px] text-gray-400 mt-1">{stats?.overview.totalFeedback} avaliações</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5,4,3,2,1].map((star) => {
                    const count = feedback.filter((f) => f.rating === star).length;
                    const pct = feedback.length ? Math.round((count / feedback.length) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-[12px] text-gray-500 w-6 text-right">{star}★</span>
                        <div className="flex-1 h-2 rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-[#F5B800]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[12px] text-gray-400 w-8">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          <Card title="Feedbacks recentes" noPad>
            {feedback.length === 0 ? (
              <EmptyState
                title="Nenhum feedback recebido"
                description="Os feedbacks dos usuários aparecerão aqui."
                icon={<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
              />
            ) : (
              <Table>
                <thead><tr>
                  <Th>Avaliação</Th>
                  <Th>Categoria</Th>
                  <Th>Comentário</Th>
                  <Th>Data</Th>
                </tr></thead>
                <tbody>
                  {feedback.map((f) => (
                    <Tr key={f.id}>
                      <Td><StarRating rating={f.rating} /></Td>
                      <Td>{f.category ? <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{f.category}</span> : <span className="text-gray-300">—</span>}</Td>
                      <Td className="max-w-[300px]">
                        <p className="text-[12px] text-gray-600 line-clamp-2">{f.message || <span className="text-gray-300">Sem comentário</span>}</p>
                      </Td>
                      <Td className="text-[11px] text-gray-400 whitespace-nowrap">{fmtDate(f.createdAt)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
