'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import {
  PageHeader, KpiCard, Card, StatusBadge, EmptyState, LoadingState,
  Table, Th, Td, Tr, fmtDate, num,
} from '../_components';

interface Feedback {
  id: string; rating: number; category?: string; message?: string; createdAt: string;
}

interface AdminStats {
  overview: { totalFeedback: number; avgRating: number | null };
  recentActivity: { feedback: Feedback[] };
}

const CATEGORY_LABEL: Record<string, string> = {
  bug: 'Bug reportado',
  value_dispute: 'Valor contestado',
  feature_request: 'Sugestão',
  other: 'Outro',
  compliment: 'Elogio',
};

function RatingBadge({ rating }: { rating: number }) {
  const color = rating >= 4 ? 'bg-emerald-50 text-emerald-700' : rating >= 3 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>{rating} ★</span>;
}

export default function SuportePage() {
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
  const negative = feedback.filter((f) => f.rating < 3);
  const bugs = feedback.filter((f) => f.category === 'bug');
  const valueDisputes = feedback.filter((f) => f.category === 'value_dispute');

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Suporte" subtitle="Feedbacks, bugs e chamados recebidos" />

      {loading ? <LoadingState /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <KpiCard label="Feedbacks totais" value={num(stats?.overview.totalFeedback)} color="blue" />
            <KpiCard label="Negativos (<3★)" value={num(negative.length)} color="red" />
            <KpiCard label="Bugs reportados" value={num(bugs.length)} color="red" />
            <KpiCard label="Valores contestados" value={num(valueDisputes.length)} color="yellow" />
            <KpiCard label="Avaliação média" value={stats?.overview.avgRating ? `${stats.overview.avgRating.toFixed(1)}★` : '—'} color="green" />
          </div>

          {negative.length > 0 && (
            <Card title="⚠️ Feedbacks negativos" subtitle="Avaliações abaixo de 3 estrelas — requerem atenção" className="mb-6 border-red-100">
              <Table className="mt-3">
                <thead><tr>
                  <Th>Nota</Th>
                  <Th>Categoria</Th>
                  <Th>Mensagem</Th>
                  <Th>Data</Th>
                </tr></thead>
                <tbody>
                  {negative.map((f) => (
                    <Tr key={f.id}>
                      <Td><RatingBadge rating={f.rating} /></Td>
                      <Td>{f.category ? <span className="text-[12px] text-gray-600">{CATEGORY_LABEL[f.category] ?? f.category}</span> : <span className="text-gray-300">—</span>}</Td>
                      <Td className="max-w-[320px]">
                        <p className="text-[12px] text-gray-700 line-clamp-2">{f.message || <span className="text-gray-300">Sem mensagem</span>}</p>
                      </Td>
                      <Td className="text-[11px] text-gray-400 whitespace-nowrap">{fmtDate(f.createdAt)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}

          <Card title="Todos os feedbacks" noPad>
            {feedback.length === 0 ? (
              <EmptyState
                title="Nenhum feedback recebido"
                description="Os feedbacks pós-cálculo dos usuários aparecerão aqui para análise."
                icon={<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
              />
            ) : (
              <Table>
                <thead><tr>
                  <Th>Nota</Th>
                  <Th>Categoria</Th>
                  <Th>Mensagem</Th>
                  <Th>Status</Th>
                  <Th>Data</Th>
                </tr></thead>
                <tbody>
                  {feedback.map((f) => (
                    <Tr key={f.id}>
                      <Td><RatingBadge rating={f.rating} /></Td>
                      <Td>{f.category ? <span className="text-[12px] text-gray-600">{CATEGORY_LABEL[f.category] ?? f.category}</span> : <span className="text-gray-300">—</span>}</Td>
                      <Td className="max-w-[280px]">
                        <p className="text-[12px] text-gray-700 line-clamp-2">{f.message || <span className="text-gray-300">Sem mensagem</span>}</p>
                      </Td>
                      <Td><StatusBadge status="novo" /></Td>
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
