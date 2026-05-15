'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { trackCtaClick, trackEvent } from '@/lib/analytics';

const menuItems = [
  {
    href: '/',
    label: 'Calcular',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8"/><path d="M8 12h2M12 12h2M16 12h0"/><path d="M8 16h2M12 16h2M16 16h0"/></svg>`,
  },
  {
    href: '/historico',
    label: 'Histórico',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  },
  {
    href: '/parceiros',
    label: 'Parceiros',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>`,
  },
  {
    href: '/minha-meta',
    label: 'Minha Meta',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/></svg>`,
  },
  {
    href: '/desafio',
    label: 'Desafio',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  },
  {
    href: '/minha-conta',
    label: 'Minha Conta',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
    authOnly: true,
  },
  {
    href: '/entrar',
    label: 'Entrar / Criar conta',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
    guestOnly: true,
  },
  {
    href: '/contato',
    label: 'Contato',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  },
];

export function Header() {
  const { driver, loading, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const visibleItems = menuItems.filter((item) => {
    if (item.authOnly && !driver) return false;
    if (item.guestOnly && driver) return false;
    return true;
  });

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => {
              setOpen((v) => !v);
              trackEvent('header_menu_toggle', { open: !open });
            }}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            className="flex flex-col items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors gap-1.5 shrink-0"
          >
              <span
                className="block h-0.5 bg-gray-700 transition-all duration-200 origin-center"
                style={{ width: 20, transform: open ? 'translateY(4px) rotate(45deg)' : 'none' }}
              />
              <span
                className="block h-0.5 bg-gray-700 transition-all duration-200"
                style={{ width: 20, opacity: open ? 0 : 1 }}
              />
              <span
                className="block h-0.5 bg-gray-700 transition-all duration-200 origin-center"
                style={{ width: 20, transform: open ? 'translateY(-4px) rotate(-45deg)' : 'none' }}
              />
            </button>

          <Link href="/" onClick={() => trackCtaClick('header_logo', { placement: 'header' })} className="flex items-center gap-2 flex-1">
            <Image
              src="/logo-sem-fundo.png"
              alt="Taxi Combinado"
              width={100}
              height={100}
              className="object-contain"
            />
          </Link>

          <div className="flex items-center gap-2">
            {!loading && driver && (
              <span className="hidden sm:block text-xs text-gray-400 max-w-[130px] truncate">
                Olá, {driver.name || driver.email.split('@')[0]}
              </span>
            )}
            {!loading && !driver && (
              <Link
                href="/cadastro"
                onClick={() => trackCtaClick('header_signup', { placement: 'header' })}
                className="text-xs bg-taxi-500 text-white px-3 py-1.5 rounded-full hover:bg-taxi-600 transition-colors"
              >
                Criar conta
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setOpen(false)}
          style={{ top: 56 }}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed left-0 z-50 bg-white shadow-xl transition-transform duration-200"
        style={{
          top: 56,
          bottom: 0,
          width: 280,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          overflowY: 'auto',
        }}
      >
        <nav className="flex flex-col p-4 gap-1">
          {visibleItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  trackEvent('hamburger_nav_click', { nav_label: item.label, nav_href: item.href });
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                style={{
                  background: isActive ? 'var(--ink)' : 'transparent',
                  color: isActive ? 'var(--yellow)' : 'var(--gray-600, #4b5563)',
                  textDecoration: 'none',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: 15,
                }}
              >
                <span
                  style={{ color: isActive ? 'var(--yellow)' : 'var(--gray-400, #9ca3af)', flexShrink: 0 }}
                  dangerouslySetInnerHTML={{ __html: item.icon }}
                />
                {item.label}
              </Link>
            );
          })}

          {!loading && driver && (
            <button
              onClick={() => {
                trackCtaClick('hamburger_logout', { placement: 'hamburger' });
                logout();
                setOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors mt-2 border-t border-gray-100 pt-4 text-red-400 hover:text-red-600 hover:bg-red-50"
              style={{ fontSize: 15, fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', borderTop: '1px solid #f3f4f6', marginTop: 8, paddingTop: 16 }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </button>
          )}
        </nav>
      </div>
    </>
  );
}
