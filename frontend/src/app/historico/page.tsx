'use client';

import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { getQuoteHistory } from '@/lib/api';
import { formatCurrencyBRL, formatDistance, formatDuration } from '@/lib/formatters';
import { useAuth } from '@/context/AuthContext';
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
}

const tripTypeLabels: Record<string, string> = {
  one_way: 'Só ida',
  round_trip: 'Ida e volta',
  empty_return: 'Volta vazia',
};

export default function HistoricoPage() {
  const { driver } = useAuth();
  const [quotes, setQuotes] = useState<HistoryQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async (p: number) => {
    setLoading(true);
    try {
      const data = await getQuoteHistory({ page: p, limit: 15 });
      setQuotes(data.quotes);
      setTotalPages(data.totalPages);
    } catch {
      setError('Não foi possível carregar o histórico. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PageContainer>
      <div className="mb-4 pt-2">
        <h1 className="text-2xl font-black text-gray-900">Histórico</h1>
        <p className="text-gray-500 text-sm mt-1">
          {driver ? `Corridas salvas na sua conta` : 'Simulações deste aparelho'}
        </p>
      </div>

      {/* Banner CTA para quem não está logado */}
      {!driver && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <span className="text-2xl shrink-0">💡</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-yellow-900">Crie uma conta para salvar seu histórico</p>
            <p className="text-xs text-yellow-700 mt-0.5">Agora só aparece neste aparelho. Com conta, você acessa de qualquer celular.</p>
            <div className="flex gap-2 mt-2">
              <Link href="/cadastro" className="text-xs bg-yellow-400 text-gray-900 font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-500 transition-colors">
                Criar conta grátis
              </Link>
              <Link href="/entrar" className="text-xs text-yellow-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-yellow-100 transition-colors">
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-3 border-taxi-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Carregando histórico...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => fetchHistory(page)}
            className="mt-2 text-red-600 font-medium text-sm underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && quotes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-6xl mb-4">🧾</span>
          <h2 className="font-bold text-gray-700 text-lg">Nenhuma simulação ainda</h2>
          <p className="text-gray-400 text-sm mt-1 mb-6">
            Suas corridas calculadas aparecem aqui
          </p>
          <Link
            href="/"
            className="bg-taxi-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-taxi-600 transition-colors"
          >
            Calcular primeira corrida
          </Link>
        </div>
      )}

      {!loading && quotes.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {quotes.map((quote) => (
              <div key={quote.id} className="bg-white rounded-2xl shadow-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    {quote.originAddress || quote.destinationAddress ? (
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {quote.originAddress || '—'} → {quote.destinationAddress || '—'}
                      </p>
                    ) : (
                      <p className="font-semibold text-gray-800 text-sm">
                        {formatDistance(quote.distanceKm)} · {tripTypeLabels[quote.tripType] || quote.tripType}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(quote.createdAt)}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-lg font-black text-taxi-600">
                      {formatCurrencyBRL(quote.recommendedPrice)}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        quote.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {quote.profit >= 0 ? '+' : ''}{formatCurrencyBRL(quote.profit)} lucro
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {formatDistance(quote.distanceKm)}
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400">
                    Custo: {formatCurrencyBRL(quote.totalCost)}
                  </span>
                  <span className="text-gray-200">·</span>
                  <span
                    className={`text-xs font-medium ${
                      quote.margin >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {quote.margin.toFixed(1)}% margem
                  </span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
