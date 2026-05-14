'use client';

import { FormEvent, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { submitContactMessage } from '@/lib/api';

type ContactType = 'suggestion' | 'complaint';

export default function ContatoPage() {
  const [name, setName] = useState('');
  const [type, setType] = useState<ContactType>('suggestion');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(false);
    setError('');

    if (!name.trim() || !message.trim()) {
      setError('Informe seu nome e a mensagem.');
      return;
    }

    setLoading(true);
    try {
      await submitContactMessage({
        name: name.trim(),
        type,
        message: message.trim(),
      });
      setName('');
      setType('suggestion');
      setMessage('');
      setSuccess(true);
    } catch {
      setError('Não foi possível enviar agora. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <div className="mb-4 pt-2">
        <h1 className="text-2xl font-black text-gray-950">Contato</h1>
        <p className="mt-1 text-sm font-semibold text-gray-500">
          Envie sugestões, reclamações ou ideias para melhorar o Táxi Combinado.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="tc-card flex flex-col gap-4">
        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-400">Nome *</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="tc-input"
            placeholder="Seu nome"
            required
          />
        </label>

        <div className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-400">Tipo</span>
          <div className="tc-seg">
            <button
              type="button"
              onClick={() => setType('suggestion')}
              className={`tc-seg-btn${type === 'suggestion' ? ' active' : ''}`}
            >
              Sugestão
            </button>
            <button
              type="button"
              onClick={() => setType('complaint')}
              className={`tc-seg-btn${type === 'complaint' ? ' active' : ''}`}
            >
              Reclamação
            </button>
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-400">Mensagem *</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="tc-input min-h-[150px] resize-none leading-6"
            placeholder="Escreva sua mensagem"
            required
          />
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>
        )}

        {success && (
          <p className="rounded-xl bg-green-50 px-3 py-2 text-sm font-bold text-green-700">
            Mensagem enviada. Obrigado por ajudar a melhorar o Táxi Combinado.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="tc-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Enviando...' : 'Enviar mensagem'}
        </button>
      </form>
    </PageContainer>
  );
}
