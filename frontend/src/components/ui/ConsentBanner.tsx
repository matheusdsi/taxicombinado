'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'pct_cookie_consent';
const CONSENT_VERSION = '1';

export function ConsentBanner() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
    try {
      const parsed = JSON.parse(stored);
      if (parsed.version !== CONSENT_VERSION) {
        const timer = setTimeout(() => setShow(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // old format string — re-show
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const save = (choice: 'accepted' | 'declined') => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      choice,
      version: CONSENT_VERSION,
      at: new Date().toISOString(),
    }));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 0, right: 0, zIndex: 9999,
      padding: '0 12px 8px', pointerEvents: 'none',
    }}>
      <div style={{
        maxWidth: 672, margin: '0 auto',
        background: 'var(--ink)', color: '#fff',
        borderRadius: 20, padding: '16px 16px 14px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
        pointerEvents: 'all',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--yellow)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 16 }}>🍪</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>Cookies e privacidade</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2, lineHeight: 1.4 }}>
              Usamos cookies essenciais para salvar seu histórico de cotações neste dispositivo, conforme a{' '}
              <Link href="/privacidade" style={{ color: '#FDE68A', textDecoration: 'underline' }}>LGPD</Link>.
            </div>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: 12,
            padding: '10px 12px', marginBottom: 10, fontSize: 12,
            color: 'rgba(255,255,255,0.75)', lineHeight: 1.55,
          }}>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>O que coletamos:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { name: 'pct_anonymous_id', desc: 'Identificador anônimo para seu histórico de cotações (365 dias)' },
                { name: 'pct_cookie_consent', desc: 'Registro da sua escolha de consentimento' },
                { name: 'pct_local_quotes', desc: 'Histórico de cotações salvo localmente (localStorage)' },
              ].map((c) => (
                <div key={c.name} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.12)', padding: '1px 5px', borderRadius: 4, fontSize: 10, flexShrink: 0, marginTop: 1 }}>{c.name}</span>
                  <span>{c.desc}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              Nenhum cookie de rastreamento ou publicidade.{' '}
              <Link href="/cookies" style={{ color: '#FDE68A', textDecoration: 'underline' }}>Ver política completa de cookies</Link>.
            </div>
          </div>
        )}

        {/* Links e toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, fontSize: 11 }}>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
          </button>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
          <Link href="/termos" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, textDecoration: 'underline' }}>Termos de uso</Link>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
          <Link href="/privacidade" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, textDecoration: 'underline' }}>Privacidade</Link>
        </div>

        {/* Botões */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            type="button"
            onClick={() => save('declined')}
            style={{
              background: 'transparent', border: '1.5px solid rgba(255,255,255,0.25)',
              color: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '10px',
              fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            Só essenciais
          </button>
          <button
            type="button"
            onClick={() => save('accepted')}
            style={{
              background: 'var(--yellow)', color: 'var(--ink)',
              border: 0, borderRadius: 12, padding: '10px',
              fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            }}
          >
            Aceitar e continuar
          </button>
        </div>
      </div>
    </div>
  );
}
