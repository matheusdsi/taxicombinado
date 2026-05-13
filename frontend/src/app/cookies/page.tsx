'use client';

import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import Link from 'next/link';

const CONSENT_KEY = 'pct_cookie_consent';

const cookies = [
  {
    name: 'pct_anonymous_id',
    type: 'Essencial',
    typeColor: 'var(--green)',
    storage: 'Cookie (HttpOnly)',
    duration: '365 dias',
    purpose: 'Identificador anônimo único que associa seu histórico de cotações ao seu dispositivo sem vincular a dados pessoais. Gerado automaticamente na primeira visita.',
    canOpt: false,
  },
  {
    name: 'pct_cookie_consent',
    type: 'Essencial',
    typeColor: 'var(--green)',
    storage: 'localStorage',
    duration: 'Indefinido',
    purpose: 'Armazena a sua escolha de consentimento para que o banner não apareça a cada visita.',
    canOpt: false,
  },
  {
    name: 'pct_local_quotes',
    type: 'Funcional',
    typeColor: 'var(--blue)',
    storage: 'localStorage',
    duration: 'Indefinido',
    purpose: 'Histórico das suas cotações salvo localmente no dispositivo, acessível sem conta. Sincronizado com sua conta quando você faz login.',
    canOpt: false,
  },
  {
    name: 'pct_admin_session',
    type: 'Essencial',
    typeColor: 'var(--green)',
    storage: 'Cookie (HttpOnly, Secure)',
    duration: '8 horas',
    purpose: 'Sessão de autenticação do painel administrativo. Presente apenas em sessões administrativas.',
    canOpt: false,
  },
  {
    name: 'Google Tag Manager',
    type: 'Analytics',
    typeColor: 'var(--orange)',
    storage: 'Cookie de terceiro',
    duration: 'Variável',
    purpose: 'Coleta dados de uso agregados e anônimos para análise de desempenho e melhoria do Serviço. Ativado apenas com seu consentimento.',
    canOpt: true,
  },
];

export default function CookiesPage() {
  const [consentStatus, setConsentStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConsentStatus(parsed.choice ?? stored);
      }
    } catch {
      setConsentStatus(null);
    }
  }, []);

  const revokeConsent = () => {
    localStorage.removeItem(CONSENT_KEY);
    setConsentStatus(null);
    window.location.reload();
  };

  return (
    <PageContainer>
      <div style={{ marginBottom: 24, paddingTop: 8 }}>
        <Link href="/" style={{ color: 'var(--gray-400)', fontSize: 13, textDecoration: 'none' }}>← Voltar</Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1, marginTop: 8 }}>Política de Cookies</h1>
        <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Última atualização: maio de 2025</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <Link href="/termos" style={{ fontSize: 12, color: 'var(--gray-500)', textDecoration: 'underline' }}>Termos de Uso</Link>
          <span style={{ color: 'var(--gray-300)' }}>·</span>
          <Link href="/privacidade" style={{ fontSize: 12, color: 'var(--gray-500)', textDecoration: 'underline' }}>Privacidade</Link>
        </div>
      </div>

      {/* Sua preferência atual */}
      <div className="tc-card" style={{ marginBottom: 10, background: consentStatus === 'accepted' ? 'var(--green-soft, #F0FDF4)' : consentStatus === 'declined' ? 'var(--gray-50)' : 'var(--yellow-soft)', borderColor: consentStatus === 'accepted' ? 'var(--green)' : consentStatus === 'declined' ? 'var(--gray-200)' : '#FCEBA8' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', marginBottom: 4 }}>
          Sua preferência atual
        </div>
        {consentStatus === null ? (
          <p style={{ fontSize: 13, color: 'var(--gray-600)' }}>Nenhuma escolha registrada. O banner de consentimento aparecerá na próxima visita.</p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 10 }}>
              {consentStatus === 'accepted'
                ? 'Você aceitou todos os cookies, incluindo os de analytics.'
                : 'Você optou por usar apenas cookies essenciais.'}
            </p>
            <button
              type="button"
              onClick={revokeConsent}
              style={{ background: 'var(--ink)', color: '#fff', border: 0, borderRadius: 10, padding: '8px 14px', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
            >
              Redefinir preferências
            </button>
          </>
        )}
      </div>

      {/* O que são cookies */}
      <div className="tc-card" style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 8 }}>O que são cookies?</div>
        <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.65 }}>
          Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um site. Eles permitem que o site "lembre" informações sobre sua visita, como preferências e histórico, tornando a experiência mais eficiente.
        </p>
        <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.65, marginTop: 8 }}>
          O Taxi Combinado também utiliza o <strong>localStorage</strong> — uma tecnologia similar aos cookies, mas que armazena dados apenas no seu dispositivo e não são enviados automaticamente ao servidor.
        </p>
      </div>

      {/* Tabela de cookies */}
      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 10 }}>Cookies que utilizamos</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        {cookies.map((c) => (
          <div key={c.name} className="tc-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{c.name}</span>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                background: c.typeColor === 'var(--green)' ? '#D1FAE5' : c.typeColor === 'var(--blue)' ? '#DBEAFE' : '#FEF3C7',
                color: c.typeColor === 'var(--green)' ? '#065F46' : c.typeColor === 'var(--blue)' ? '#1E40AF' : '#92400E',
              }}>{c.type}</span>
              {c.canOpt && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)' }}>Opt-in</span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.55, marginBottom: 8 }}>{c.purpose}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Armazenamento</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginTop: 2 }}>{c.storage}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Duração</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginTop: 2 }}>{c.duration}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Como gerenciar */}
      <div className="tc-card" style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 8 }}>Como gerenciar cookies</div>
        <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.65, marginBottom: 8 }}>
          Além das preferências aqui, você pode gerenciar ou bloquear cookies diretamente no seu navegador:
        </p>
        {[
          { name: 'Google Chrome', path: 'Configurações → Privacidade e segurança → Cookies' },
          { name: 'Safari (iOS)', path: 'Ajustes → Safari → Privacidade e segurança' },
          { name: 'Firefox', path: 'Preferências → Privacidade e segurança → Cookies' },
          { name: 'Samsung Internet', path: 'Configurações → Privacidade → Cookies' },
        ].map((b) => (
          <div key={b.name} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
            <span style={{ fontWeight: 700, color: 'var(--ink)', minWidth: 130 }}>{b.name}</span>
            <span style={{ color: 'var(--gray-500)' }}>{b.path}</span>
          </div>
        ))}
        <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 10, lineHeight: 1.5 }}>
          Bloquear cookies essenciais pode afetar o funcionamento do histórico de cotações.
        </p>
      </div>

      <div className="tc-card" style={{ background: 'var(--yellow-soft)', borderColor: '#FCEBA8' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', marginBottom: 4 }}>Dúvidas sobre cookies e privacidade?</div>
        <p style={{ fontSize: 13, color: 'var(--gray-600)' }}>
          Entre em contato:{' '}
          <a href="mailto:taxicombinado@gmail.com" style={{ color: 'var(--ink)', fontWeight: 700 }}>taxicombinado@gmail.com</a>
        </p>
      </div>
    </PageContainer>
  );
}
