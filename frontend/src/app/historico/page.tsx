'use client';

import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { getQuoteHistory } from '@/lib/api';
import { formatCurrencyBRL, formatDistance } from '@/lib/formatters';
import { useAuth } from '@/context/AuthContext';
import { getLocalQuotes, LocalQuote } from '@/lib/localQuotes';
import Link from 'next/link';

interface HistoryQuote {
  id: string;
  createdAt: string;
  recommendedPrice: number;
  originAddress?: string;
  destinationAddress?: string;
  distanceKm: number;
  tripType: string;
  totalCost: number;
  profit: number;
  margin: number;
  isLocal?: boolean;
}

const tripTypeLabels: Record<string, string> = {
  one_way: 'Só ida',
  round_trip: 'Ida e volta',
  empty_return: 'Volta vazia',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function HistoricoPage() {
  const { driver } = useAuth();
  const [quotes, setQuotes] = useState<HistoryQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Tenta buscar do banco (funciona se logado ou com sessão anônima + DB online)
        const data = await getQuoteHistory({ page, limit: 15 });
        if (data.quotes.length > 0 || driver) {
          setQuotes(data.quotes);
          setTotalPages(data.totalPages);
          setLoading(false);
          return;
        }
      } catch {
        // DB offline — cai no localStorage
      }
      // Fallback: localStorage
      const local = getLocalQuotes();
      const start = (page - 1) * 15;
      setQuotes(local.slice(start, start + 15).map((q: LocalQuote) => ({ ...q, isLocal: true })));
      setTotalPages(Math.ceil(local.length / 15) || 1);
      setLoading(false);
    };
    load();
  }, [page, driver]);

  return (
    <PageContainer>
      {/* Header */}
      <div style={{ marginBottom: 16, paddingTop: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)' }}>Histórico</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
          {driver ? 'Corridas salvas na sua conta' : 'Simulações neste aparelho'}
        </p>
      </div>

      {/* Banner CTA não logado */}
      {!driver && (
        <div style={{ background: 'var(--yellow-soft)', border: '1px solid #FCEBA8', borderRadius: 16, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--yellow)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 18 }}>💡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>Salve seu histórico na nuvem</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 3 }}>
              Agora só aparece neste aparelho. Com conta, acessa de qualquer celular — e suas cotações locais vão junto.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Link href="/cadastro" style={{ background: 'var(--ink)', color: '#fff', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                Criar conta grátis
              </Link>
              <Link href="/entrar" style={{ background: 'transparent', color: 'var(--gray-700)', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--gray-200)', borderTopColor: 'var(--ink)', animation: 'spin 0.9s linear infinite' }} />
          <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Carregando...</span>
        </div>
      )}

      {!loading && quotes.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🧾</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>Nenhuma simulação ainda</div>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 6, marginBottom: 20 }}>
            Suas corridas calculadas aparecem aqui
          </p>
          <Link href="/" style={{ background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 14, padding: '14px 24px', fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
            Calcular primeira corrida
          </Link>
        </div>
      )}

      {!loading && quotes.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quotes.map((quote) => (
              <div key={quote.id} className="tc-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {quote.originAddress || quote.destinationAddress ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, flexWrap: 'wrap' as const }}>
                        <span style={{ color: 'var(--ink)' }}>{quote.originAddress || '—'}</span>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--gray-400)' }}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                        <span style={{ color: 'var(--ink)' }}>{quote.destinationAddress || '—'}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {formatDistance(quote.distanceKm)} · {tripTypeLabels[quote.tripType] || quote.tripType}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>{formatDate(quote.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                      {formatCurrencyBRL(quote.recommendedPrice)}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: quote.profit >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
                      {quote.profit >= 0 ? '+' : ''}{formatCurrencyBRL(quote.profit)} lucro
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--gray-100)', margin: '10px 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--gray-500)' }}>
                  <span>{formatDistance(quote.distanceKm)}</span>
                  <span style={{ color: 'var(--gray-200)' }}>·</span>
                  <span>Custo: {formatCurrencyBRL(quote.totalCost)}</span>
                  <span style={{ color: 'var(--gray-200)' }}>·</span>
                  <span style={{ fontWeight: 700, color: quote.margin >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {quote.margin.toFixed(1)}% margem
                  </span>
                  {quote.isLocal && (
                    <>
                      <span style={{ color: 'var(--gray-200)' }}>·</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)' }}>LOCAL</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '10px 18px', borderRadius: 12, border: '1.5px solid var(--gray-200)', background: 'var(--surface)', color: 'var(--gray-700)', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                ← Anterior
              </button>
              <span style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '10px 18px', borderRadius: 12, border: '1.5px solid var(--gray-200)', background: 'var(--surface)', color: 'var(--gray-700)', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
