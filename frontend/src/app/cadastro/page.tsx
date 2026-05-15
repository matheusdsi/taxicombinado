'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';

export default function CadastroPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (form.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);
    trackEvent('sign_up_attempt', {
      method: 'email',
    });
    try {
      await api.post('/api/auth/driver/register', { name: form.name, email: form.email, password: form.password });
      await refresh();
      trackEvent('sign_up', {
        method: 'email',
      });
      router.push('/historico');
      router.refresh();
    } catch (e: unknown) {
      const error = e as { response?: { data?: { error?: string } }; message?: string };
      trackEvent('sign_up_error', {
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
          <div className="text-4xl mb-2">✅</div>
          <h1 className="text-xl font-black text-gray-900">Criar conta grátis</h1>
          <p className="text-sm text-gray-400 mt-1">Salve e acesse seu histórico de qualquer aparelho</p>
        </div>

        {/* Benefícios */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-4 space-y-1.5">
          {['Histórico de corridas em qualquer dispositivo', 'Cotações salvas com sua conta', 'Totalmente grátis'].map((b) => (
            <div key={b} className="flex items-center gap-2 text-xs text-yellow-800">
              <span className="text-yellow-500 text-base">✓</span>
              {b}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Seu nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              autoComplete="name"
              placeholder="Como quer ser chamado"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
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
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Confirmar senha</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => set('confirm', e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Repita a senha"
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
            {loading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Ao criar conta você concorda com nossa{' '}
          <Link href="/privacidade" className="underline">política de privacidade</Link>.
          Sem spam, sem venda de dados.
        </p>

        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400">
            Já tem conta?{' '}
            <Link href="/entrar" className="text-yellow-600 font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
