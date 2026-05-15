'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';

export default function EntrarPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    trackEvent('login_attempt', {
      method: 'email',
    });
    try {
      await api.post('/api/auth/driver/login', { email, password });
      await refresh();
      trackEvent('login', {
        method: 'email',
      });
      router.push('/historico');
      router.refresh();
    } catch (e: unknown) {
      const error = e as { response?: { data?: { error?: string } }; message?: string };
      trackEvent('login_error', {
        method: 'email',
      });
      setError(error.response?.data?.error || error.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🚖</div>
          <h1 className="text-xl font-black text-gray-900">Entrar na sua conta</h1>
          <p className="text-sm text-gray-400 mt-1">Acesse seu histórico de qualquer aparelho</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl transition-colors disabled:opacity-50 mt-1"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-100 text-center space-y-2">
          <p className="text-xs text-gray-400">
            Ainda não tem conta?{' '}
            <Link href="/cadastro" className="text-yellow-600 font-semibold hover:underline">
              Criar conta grátis
            </Link>
          </p>
          <p className="text-xs text-gray-400">
            <Link href="/" className="text-gray-400 hover:underline">
              Continuar sem conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
