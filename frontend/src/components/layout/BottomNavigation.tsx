'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  {
    href: '/desafio',
    label: 'Desafio',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      background: 'var(--surface)',
      borderTop: '1px solid var(--gray-200)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(${navItems.length}, 1fr)`, padding: '4px 8px 8px' }}>
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
              <span style={{
                fontSize: 11, fontWeight: 600, lineHeight: 1,
                color: isActive ? 'var(--ink)' : 'var(--gray-500)',
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
