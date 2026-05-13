'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminCadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', adminSecret: '' });
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
      setError('A senha deve ter ao menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          adminSecret: form.adminSecret,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao cadastrar');
      router.push('/admin');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-xl font-black text-gray-900">Criar conta Admin</h1>
          <p className="text-sm text-gray-400 mt-1">Você precisa do código de cadastro</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              placeholder="Seu nome"
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
              placeholder="Repita a senha"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Código de cadastro</label>
            <input
              type="password"
              value={form.adminSecret}
              onChange={(e) => set('adminSecret', e.target.value)}
              required
              placeholder="ADMIN_SECRET do .env"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
            <p className="text-xs text-gray-400 mt-1">
              Definido em <code className="bg-gray-100 px-1 rounded">ADMIN_SECRET</code> no servidor.
            </p>
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
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Já tem conta?{' '}
          <a href="/admin/login" className="text-yellow-600 font-semibold hover:underline">
            Fazer login
          </a>
        </p>
      </div>
    </div>
  );
}
