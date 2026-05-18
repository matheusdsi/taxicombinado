'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiUrl } from '@/lib/apiConfig';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: <IconDashboard /> },
  { href: '/admin/usuarios', label: 'Usuários', icon: <IconUsers /> },
  { href: '/admin/taxistas', label: 'Taxistas', icon: <IconTaxi /> },
  { href: '/admin/passageiros', label: 'Passageiros', icon: <IconPassenger /> },
  { href: '/admin/parceiros', label: 'Parceiros', icon: <IconPartner /> },
  { href: '/admin/cotacoes', label: 'Cotações', icon: <IconQuote /> },
  { href: '/admin/corridas-agendadas', label: 'Corridas Agendadas', icon: <IconCalendar /> },
  { href: '/admin/corridas-realizadas', label: 'Corridas Realizadas', icon: <IconCheck /> },
  { href: '/admin/financeiro', label: 'Financeiro', icon: <IconMoney /> },
  { href: '/admin/planos-assinaturas', label: 'Planos e Assinaturas', icon: <IconPlan /> },
  { href: '/admin/metas-desafios', label: 'Metas e Desafios', icon: <IconTarget /> },
  { href: '/admin/avaliacoes', label: 'Avaliações', icon: <IconStar /> },
  { href: '/admin/notificacoes', label: 'Notificações', icon: <IconBell />, badge: 8 },
  { href: '/admin/suporte', label: 'Suporte', icon: <IconSupport /> },
  { href: '/admin/configuracoes', label: 'Configurações', icon: <IconSettings /> },
  { href: '/admin/relatorios', label: 'Relatórios', icon: <IconReport /> },
];

function IconDashboard() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
}
function IconUsers() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconTaxi() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h8l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/><path d="M5 9h14"/></svg>;
}
function IconPassenger() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
}
function IconPartner() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 11l-4 4-2-2"/></svg>;
}
function IconQuote() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
}
function IconCalendar() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IconCheck() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><polyline points="16 8 10 14 7 11"/></svg>;
}
function IconMoney() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
}
function IconPlan() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}
function IconTarget() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}
function IconStar() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function IconBell() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
function IconSupport() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function IconSettings() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function IconReport() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function IconMenu() {
  return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}
function IconX() {
  return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}

const BYPASS_LAYOUT_PATHS = ['/admin/login', '/admin/cadastro'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string | null; email: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isBypass = BYPASS_LAYOUT_PATHS.some((p) => pathname === p);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
      if (!res.ok) { window.location.href = '/admin/login'; return; }
      const { data } = await res.json();
      if (data.role !== 'admin') { window.location.href = '/admin/login'; return; }
      setUser(data);
    } catch {
      window.location.href = '/admin/login';
    }
  }, []);

  useEffect(() => {
    if (!isBypass) checkAuth();
  }, [isBypass, checkAuth]);

  async function handleLogout() {
    await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    window.location.href = '/admin/login';
  }

  if (isBypass) return <>{children}</>;

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'A';

  return (
    <div className="flex h-screen bg-[#F0F2F5] font-sans overflow-hidden">
      {/* Overlay mobile */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          bg-[#0F1623] text-white
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.07]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5B800]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F1623" strokeWidth={2.5}>
              <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-4h8l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
              <circle cx="7.5" cy="17" r="1.5"/>
              <circle cx="16.5" cy="17" r="1.5"/>
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#F5B800] tracking-widest uppercase leading-none">Táxi Combinado</p>
            <p className="text-[13px] font-bold text-white leading-tight mt-0.5">Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-hide">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`
                  group flex items-center gap-3 rounded-xl px-3 py-2.5 mb-0.5
                  text-[13px] font-medium transition-all duration-150
                  ${active
                    ? 'bg-[#F5B800] text-[#0F1623] font-semibold shadow-lg shadow-[#F5B800]/20'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                  }
                `}
              >
                <span className={`shrink-0 ${active ? 'text-[#0F1623]' : 'text-white/40 group-hover:text-white/70'}`}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-[#0F1623]/20 text-[#0F1623]' : 'bg-[#F5B800] text-[#0F1623]'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/[0.07] px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5B800] text-[#0F1623] text-sm font-bold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-white">{user?.name || 'Administrador'}</p>
              <p className="truncate text-[10px] text-white/40">{user?.email || 'admin@taxicombinado.com'}</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" title="Online" />
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-xl border border-white/10 py-2 text-[11px] font-semibold text-white/50 hover:bg-white/[0.06] hover:text-white transition-all"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex items-center justify-between border-b border-black/[0.06] bg-white/80 backdrop-blur-sm px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <IconMenu />
            </button>
            <span className="text-sm font-bold text-[#0F1623]">Táxi Combinado Admin</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5B800] text-[#0F1623] text-xs font-bold">
            {initials}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
