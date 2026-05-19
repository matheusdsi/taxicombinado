'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const navItems = [
  {
    href: '/',
    label: 'Calcular',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8"/><path d="M8 12h2M12 12h2M16 12h0"/><path d="M8 16h2M12 16h2M16 16h0"/></svg>`,
  },
  {
    href: '/historico',
    label: 'Histórico',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  },
  {
    href: '/parceiros',
    label: 'Parceiros',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>`,
  },
  {
    href: '/minha-meta',
    label: 'Minha Meta',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M5 12h14"/><path d="M6 7h12"/><path d="M8 17h8"/></svg>`,
  },
];

const INSTALL_ICON = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 10v5"/><path d="M9 13l3 3 3-3"/></svg>`;

export function BottomNavigation() {
  const pathname = usePathname();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    setIsStandalone(standalone);
    setIsIos(ios);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (pathname.startsWith('/admin')) return null;

  const handleInstallClick = async () => {
    if (isStandalone) return;
    trackEvent('pwa_install_click', { platform: isIos ? 'ios' : 'android' });
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        trackEvent('pwa_install_android_outcome', { outcome });
        if (outcome === 'accepted') setInstallPrompt(null);
      } catch {
        // prompt already used or browser blocked
      }
    } else if (isIos) {
      trackEvent('pwa_install_ios_modal_open');
      setShowIosModal(true);
    }
  };

  const handleIosModalClose = () => {
    trackEvent('pwa_install_ios_modal_close');
    setShowIosModal(false);
  };

  return (
    <>
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'var(--surface)',
        borderTop: '1px solid var(--gray-200)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', padding: '4px 8px 8px' }}>
          {navItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => trackEvent('bottom_nav_click', { nav_label: item.label, nav_href: item.href })}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 4px', borderRadius: 12 }}
              >
                <div style={{
                  width: 40, height: 28, borderRadius: 10,
                  background: isActive ? 'var(--ink)' : 'transparent',
                  color: isActive ? 'var(--yellow)' : 'var(--gray-500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s, color 0.15s',
                }}
                  dangerouslySetInnerHTML={{ __html: item.icon }}
                />
                <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1, color: isActive ? 'var(--ink)' : 'var(--gray-500)' }}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={handleInstallClick}
            style={{
              background: 'transparent', border: 'none',
              cursor: isStandalone ? 'default' : 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '6px 4px', borderRadius: 12,
            }}
          >
            <div style={{
              width: 40, height: 28, borderRadius: 10,
              color: isStandalone ? 'var(--gray-300)' : 'var(--gray-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
              dangerouslySetInnerHTML={{ __html: INSTALL_ICON }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1, color: isStandalone ? 'var(--gray-300)' : 'var(--gray-500)' }}>
              {isStandalone ? 'Instalado' : 'Instalar'}
            </span>
          </button>
        </div>
      </nav>

      {showIosModal && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)' }}
            onClick={handleIosModalClose}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61,
            background: 'white', borderRadius: '20px 20px 0 0',
            padding: '24px 20px',
            paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Adicionar à Tela de Início</p>
              <button
                type="button"
                onClick={handleIosModalClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, fontSize: 24, lineHeight: 1 }}
                aria-label="Fechar"
              >×</button>
            </div>

            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f5b800', color: '#111', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Toque em Compartilhar</p>
                <p style={{ margin: '2px 0 6px', fontSize: 13, color: '#6b7280' }}>Ícone na barra inferior do Safari</p>
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f5b800', color: '#111', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Toque em <strong>"Adicionar à Tela de Início"</strong></p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Role o menu para encontrar a opção</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f5b800', color: '#111', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Toque em <strong>"Adicionar"</strong></p>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>No canto superior direito</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
