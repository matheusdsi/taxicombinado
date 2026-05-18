'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import {
  PageHeader, KpiCard, Card, EmptyState, LoadingState, num,
} from '../_components';

interface AdminStats {
  overview: { challengesTotal: number; challengesToday: number; totalQuotes: number };
}

export default function MetasDesafiosPage() {
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

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader title="Metas e Desafios" subtitle="Gerenciar Minha Meta e o desafio/rota do dia" />

      {loading ? <LoadingState /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Desafios totais" value={num(stats?.overview.challengesTotal)} color="yellow" />
            <KpiCard label="Desafios hoje" value={num(stats?.overview.challengesToday)} color="green" />
            <KpiCard label="Usuários com meta" value="—" color="blue" />
            <KpiCard label="Meta média diária" value="—" color="purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Minha Meta" subtitle="Usuários que configuraram metas de faturamento">
              <EmptyState
                title="Dados de metas em breve"
                description="Os dados individuais de metas dos taxistas serão exibidos aqui."
                icon={<svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
              />
            </Card>

            <Card title="Desafio / Rota do Dia" subtitle="Histórico e gestão de desafios">
              {(stats?.overview.challengesTotal ?? 0) === 0 ? (
                <EmptyState
                  title="Nenhum desafio registrado"
                  description="Os desafios/rotas do dia aparecem quando os usuários participam da funcionalidade de desafio."
                  icon={<svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                />
              ) : (
                <div className="mt-3">
                  <div className="rounded-xl bg-[#FFF8DC] border border-[#F5B800]/30 p-4">
                    <p className="text-[11px] font-bold text-[#C89000] uppercase tracking-wider">Participações registradas</p>
                    <p className="text-[28px] font-bold text-[#0F1623] mt-1">{num(stats?.overview.challengesTotal)}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">{num(stats?.overview.challengesToday)} hoje</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
