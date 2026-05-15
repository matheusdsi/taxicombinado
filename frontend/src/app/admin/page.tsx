'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import { formatCurrencyBRL, formatDistance, formatDuration } from '@/lib/formatters';

// ─── Types ────────────────────────────────────────────────────

interface AdminStats {
  overview: {
    totalQuotes: number; quotesToday: number; quotesYesterday: number;
    quotesLast7: number; quotesLast30: number; challengesTotal: number;
    challengesToday: number; totalSessions: number; sessionsToday: number;
    totalPartners: number; totalPartnerClicks: number; partnerClicksToday: number;
    totalLeads: number; leadsToday: number; totalFeedback: number;
    avgRating: number | null; firstQuoteAt: string | null;
  };
  quoteAverages: {
    distanceKm: number | null; totalDistanceKm: number | null; estimatedMinutes: number | null;
    recommendedPrice: number | null; totalCost: number | null; profit: number | null;
    margin: number | null; fuelPricePerLiter: number | null; consumptionKmPerLiter: number | null;
    tollTotal: number | null; desiredMarginPercent: number | null;
    minRecommendedPrice: number | null; maxRecommendedPrice: number | null;
  };
  breakdowns: {
    tripType: { tripType: string; count: number; percent: number }[];
    fuelType: { fuelType: string; count: number; percent: number }[];
    routeMode: { routeMode: string; count: number }[];
    priceRanges: { range: string; count: number }[];
    distanceRanges: { range: string; count: number }[];
    alertsFrequency: { type: string; count: number }[];
  };
  timeSeries: {
    quotesPerDay: { day: string; count: number }[];
    avgPricePerDay: { day: string; avg_price: number; avg_cost: number; avg_profit: number }[];
  };
  geography: {
    topOrigins: { origin: string; count: number }[];
    topDestinations: { destination: string; count: number }[];
  };
  partners: {
    topPartners: { id?: string; name?: string; category?: string; clicks: number }[];
    recentLeads: { id: string; name: string; phone: string; email?: string; createdAt: string; partner: { name: string; category: string } }[];
  };
  recentActivity: {
    quotes: {
      id: string; createdAt: string; originAddress?: string; destinationAddress?: string;
      tripType: string; distanceKm: number; recommendedPrice: number; totalCost: number;
      profit: number; margin: number; fuelType: string; routeMode: string;
    }[];
    sessions: { id: string; sessionId: string; createdAt: string; lastSeen: string; _count: { quotes: number } }[];
    feedback: { id: string; rating: number; category?: string; message?: string; createdAt: string }[];
  };
}

interface FeatureFlags { showRouteSteps: boolean; }

interface AdminUser {
  id: string; name: string | null; email: string | null; phone: string | null;
  role: string; createdAt: string; totalQuotes: number; lastQuoteAt: string | null;
}

interface AdminPartner {
  id: string; name: string; category: string; description?: string | null;
  logoUrl?: string | null; websiteUrl?: string | null; wazeUrl?: string | null;
  phone?: string | null; whatsapp?: string | null; city?: string | null;
  isActive: boolean; isPremium: boolean; sortOrder: number;
  _count: { clicks: number; leads: number };
  clickSources?: Record<string, number>;
  locations: AdminPartnerLocation[];
}

interface AdminPartnerLocation {
  id: string; name: string; address?: string | null; city?: string | null;
  phone?: string | null; whatsapp?: string | null; wazeUrl?: string | null;
  isActive: boolean; sortOrder: number; _count: { clicks: number };
  clickSources?: Record<string, number>;
}

interface PartnerFormState {
  name: string; category: string; description: string; logoUrl: string;
  websiteUrl: string; wazeUrl: string; phone: string; whatsapp: string;
  city: string; isActive: boolean; isPremium: boolean; sortOrder: string;
}

interface PartnerLocationFormState {
  name: string; address: string; city: string; phone: string; whatsapp: string; wazeUrl: string; sortOrder: string;
}

type AdminPartnerPatch = Partial<Pick<AdminPartner, 'name' | 'category' | 'description' | 'logoUrl' | 'websiteUrl' | 'wazeUrl' | 'phone' | 'whatsapp' | 'city' | 'isActive' | 'isPremium' | 'sortOrder'>>;
type AdminPartnerLocationPatch = Partial<Pick<AdminPartnerLocation, 'name' | 'address' | 'city' | 'phone' | 'whatsapp' | 'wazeUrl' | 'isActive' | 'sortOrder'>>;

type NavId = 'overview' | 'quotes' | 'users' | 'partners' | 'audience' | 'feedback' | 'system';

// ─── Constants ────────────────────────────────────────────────

const TRIP_TYPE_LABEL: Record<string, string> = {
  one_way: 'Só ida', round_trip: 'Ida e volta', empty_return: 'Volta vazia',
};
const FUEL_LABEL: Record<string, string> = {
  gasoline: 'Gasolina', ethanol: 'Etanol', gnv: 'GNV', diesel: 'Diesel',
  hybrid: 'Híbrido', electric: 'Elétrico', other: 'Outro',
};
const ALERT_LABEL: Record<string, string> = {
  low_profit: 'Lucro baixo', negative_profit: 'Lucro negativo',
  custom_price_below_minimum: 'Preço abaixo do mínimo', empty_return_enabled: 'Volta vazia ativa',
  toll_missing: 'Pedágio não informado', high_margin: 'Margem alta', check_route: 'Conferir rota',
};

const EMPTY_PARTNER_FORM: PartnerFormState = {
  name: '', category: '', description: '', logoUrl: '', websiteUrl: '',
  wazeUrl: '', phone: '', whatsapp: '', city: '', isActive: true, isPremium: false, sortOrder: '0',
};
const EMPTY_LOCATION_FORM: PartnerLocationFormState = {
  name: '', address: '', city: '', phone: '', whatsapp: '', wazeUrl: '', sortOrder: '0',
};

const NAV_ITEMS: { id: NavId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Visão geral', icon: '▦' },
  { id: 'quotes', label: 'Cotações', icon: '◎' },
  { id: 'users', label: 'Usuários', icon: '◉' },
  { id: 'partners', label: 'Parceiros', icon: '◈' },
  { id: 'audience', label: 'Visitantes', icon: '◍' },
  { id: 'feedback', label: 'Feedback', icon: '◐' },
  { id: 'system', label: 'Sistema', icon: '◬' },
];

// ─── Helpers ──────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
function fmtDateShort(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
function money(v: number | null | undefined) { return v == null ? '—' : formatCurrencyBRL(v); }
function num(v: number | null | undefined) { return v == null ? '—' : v.toLocaleString('pt-BR'); }
function pct(v: number, total: number) { return !total ? '0%' : `${Math.round((v / total) * 100)}%`; }

// ─── UI Components ────────────────────────────────────────────

function KpiCard({ label, value, sub, trend, color = 'default' }: {
  label: string; value: string | number; sub?: string;
  trend?: { delta: number; label: string }; color?: 'default' | 'amber' | 'green' | 'red' | 'blue';
}) {
  const colors = {
    default: 'bg-zinc-800/60 border-zinc-700/50',
    amber: 'bg-amber-500/10 border-amber-500/20',
    green: 'bg-emerald-500/10 border-emerald-500/20',
    red: 'bg-rose-500/10 border-rose-500/20',
    blue: 'bg-sky-500/10 border-sky-500/20',
  }[color];

  const valueColors = {
    default: 'text-white', amber: 'text-amber-300', green: 'text-emerald-300',
    red: 'text-rose-300', blue: 'text-sky-300',
  }[color];

  return (
    <div className={`rounded-xl border p-5 ${colors}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className={`mt-2 text-2xl font-black leading-none tabular-nums ${valueColors}`}>{value}</p>
      {trend != null && (
        <p className={`mt-1.5 text-xs font-bold ${trend.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend.delta >= 0 ? '↑' : '↓'} {Math.abs(trend.delta)} {trend.label}
        </p>
      )}
      {sub && !trend && <p className="mt-1.5 text-xs font-semibold text-zinc-500">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-black uppercase tracking-[0.14em] text-zinc-300">{children}</h2>
      {sub && <p className="mt-0.5 text-xs font-semibold text-zinc-500">{sub}</p>}
    </div>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-5 ${className}`}>{children}</div>;
}

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const w = total > 0 ? Math.max(3, Math.round((count / total) * 100)) : 0;
  return (
    <div className="py-1.5">
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="min-w-0 truncate font-semibold text-zinc-300">{label}</span>
        <span className="shrink-0 font-black text-white tabular-nums">{num(count)} <span className="font-semibold text-zinc-500">{pct(count, total)}</span></span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-700">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'green' | 'red' | 'amber' | 'default' | 'blue' }) {
  const cls = {
    green: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
    red: 'bg-rose-500/15 text-rose-400 ring-rose-500/20',
    amber: 'bg-amber-500/15 text-amber-300 ring-amber-500/20',
    blue: 'bg-sky-500/15 text-sky-400 ring-sky-500/20',
    default: 'bg-zinc-700/60 text-zinc-400 ring-zinc-600/30',
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${cls}`}>{children}</span>;
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '' }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md'; disabled?: boolean; className?: string;
}) {
  const variants = {
    primary: 'bg-amber-400 text-zinc-950 hover:bg-amber-300',
    ghost: 'border border-zinc-600 text-zinc-300 hover:bg-zinc-700/50',
    danger: 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 ring-1 ring-rose-500/20',
    success: 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 ring-1 ring-emerald-500/20',
  }[variant];
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }[size];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-black transition-all disabled:cursor-not-allowed disabled:opacity-40 ${variants} ${sizes} ${className}`}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</span>}
      <input
        type={type} value={value} required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-zinc-600/60 bg-zinc-700/40 px-3 py-2.5 text-xs font-semibold text-white placeholder-zinc-500 outline-none transition-all focus:border-amber-400/60 focus:bg-zinc-700/60"
      />
    </label>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-700/60 py-10 text-center text-sm font-semibold text-zinc-600">
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [adminPartners, setAdminPartners] = useState<AdminPartner[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [partnerForm, setPartnerForm] = useState<PartnerFormState>(EMPTY_PARTNER_FORM);
  const [locationForms, setLocationForms] = useState<Record<string, PartnerLocationFormState>>({});
  const [loading, setLoading] = useState(true);
  const [savingFlag, setSavingFlag] = useState(false);
  const [savingPartner, setSavingPartner] = useState(false);
  const [savingLocationFor, setSavingLocationFor] = useState<string | null>(null);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ name?: string | null; email: string } | null>(null);
  const [activeNav, setActiveNav] = useState<NavId>('overview');
  const [selectedQuote, setSelectedQuote] = useState<AdminStats['recentActivity']['quotes'][0] | null>(null);
  const [quotesPage, setQuotesPage] = useState(1);
  const [quotesFilter, setQuotesFilter] = useState<'all' | 'today'>('all');
  const [quotesData, setQuotesData] = useState<{ quotes: AdminStats['recentActivity']['quotes']; total: number; totalPages: number } | null>(null);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const fetchSettings = useCallback(async () => {
    const res = await fetch(apiUrl('/api/admin/settings'), { credentials: 'include' });
    if (!res.ok) return;
    const json = await res.json();
    setFlags(json.data);
  }, []);

  const fetchAdminPartners = useCallback(async () => {
    setLoadingPartners(true);
    try {
      const res = await fetch(apiUrl('/api/admin/partners'), { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAdminPartners(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar parceiros');
    } finally {
      setLoadingPartners(false);
    }
  }, []);

  const fetchAdminUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(apiUrl('/api/admin/users'), { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAdminUsers(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar usuários');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(apiUrl('/api/admin/stats'), { credentials: 'include' });
      if (res.status === 401 || res.status === 403) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setStats(json.data);
      await Promise.all([fetchSettings(), fetchAdminPartners(), fetchAdminUsers()]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    }
  }, [fetchAdminPartners, fetchSettings, fetchAdminUsers]);

  const fetchQuotes = useCallback(async (page: number, filter: 'all' | 'today') => {
    setQuotesLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/quotes?page=${page}&limit=20&filter=${filter}`), { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setQuotesData(json.data);
    } catch { /* silent */ } finally {
      setQuotesLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const me = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
        if (!me.ok) { window.location.href = '/admin/login'; return; }
        const { data } = await me.json();
        setUser(data);
        await fetchStats();
      } catch { window.location.href = '/admin/login'; } finally {
        setLoading(false);
      }
    }
    init();
  }, [fetchStats]);

  useEffect(() => {
    if (!stats) return;
    const id = window.setInterval(fetchStats, 60000);
    return () => window.clearInterval(id);
  }, [stats, fetchStats]);

  useEffect(() => { fetchQuotes(quotesPage, quotesFilter); }, [quotesPage, quotesFilter, fetchQuotes]);

  async function handleLogout() {
    await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    window.location.href = '/admin/login';
  }

  async function updateRouteSteps(value: boolean) {
    setSavingFlag(true);
    try {
      const res = await fetch(apiUrl('/api/admin/settings'), {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showRouteSteps: value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setFlags(json.data);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro'); } finally { setSavingFlag(false); }
  }

  async function handleCreatePartner(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSavingPartner(true); setError('');
    try {
      const res = await fetch(apiUrl('/api/admin/partners'), {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...partnerForm, sortOrder: Number(partnerForm.sortOrder || 0) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPartnerForm(EMPTY_PARTNER_FORM);
      await fetchAdminPartners(); await fetchStats();
      setActiveNav('partners');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro ao cadastrar parceiro'); } finally { setSavingPartner(false); }
  }

  function updatePartnerDraft(id: string, patch: AdminPartnerPatch) {
    setAdminPartners((cur) => cur.map((p) => p.id === id ? { ...p, ...patch } : p));
  }
  function updatePartnerLocationDraft(pid: string, lid: string, patch: AdminPartnerLocationPatch) {
    setAdminPartners((cur) => cur.map((p) => p.id !== pid ? p : {
      ...p, locations: p.locations.map((l) => l.id === lid ? { ...l, ...patch } : l),
    }));
  }

  async function updatePartner(id: string, patch: AdminPartnerPatch) {
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/partners/${id}`), {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await fetchAdminPartners(); await fetchStats();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro ao atualizar parceiro'); }
  }

  async function handleCreatePartnerLocation(e: FormEvent<HTMLFormElement>, pid: string) {
    e.preventDefault();
    const form = locationForms[pid] || EMPTY_LOCATION_FORM;
    setSavingLocationFor(pid); setError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/partners/${pid}/locations`), {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder || 0), isActive: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLocationForms((cur) => ({ ...cur, [pid]: EMPTY_LOCATION_FORM }));
      await fetchAdminPartners();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro ao cadastrar unidade'); } finally { setSavingLocationFor(null); }
  }

  async function updatePartnerLocation(id: string, patch: AdminPartnerLocationPatch) {
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/partner-locations/${id}`), {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await fetchAdminPartners();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro ao atualizar unidade'); }
  }

  async function handleResetPassword() {
    if (!resetUser || !resetPassword || resetPassword.length < 6) return;
    setResetLoading(true); setResetSuccess('');
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${resetUser.id}/reset-password`), {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResetSuccess(`Senha de ${resetUser.name || resetUser.email} redefinida com sucesso.`);
      setResetPassword('');
      setTimeout(() => { setResetUser(null); setResetSuccess(''); }, 2500);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro ao redefinir senha'); } finally { setResetLoading(false); }
  }

  const computed = useMemo(() => {
    if (!stats) return null;
    const { overview, quoteAverages } = stats;
    const conversion = overview.totalSessions > 0 ? (overview.totalQuotes / overview.totalSessions) * 100 : 0;
    const leadRate = overview.totalPartnerClicks > 0 ? (overview.totalLeads / overview.totalPartnerClicks) * 100 : 0;
    const todayDelta = overview.quotesToday - overview.quotesYesterday;
    return { conversion, leadRate, todayDelta, avgTicket: quoteAverages.recommendedPrice ?? 0, avgProfit: quoteAverages.profit ?? 0 };
  }, [stats]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return adminUsers;
    const q = userSearch.toLowerCase();
    return adminUsers.filter((u) =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q)
    );
  }, [adminUsers, userSearch]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
          <p className="text-sm font-black text-zinc-500">Carregando painel...</p>
        </div>
      </main>
    );
  }

  if (!stats || !computed) return null;

  const { overview, quoteAverages, breakdowns, timeSeries, geography, partners, recentActivity } = stats;
  const maxDailyQuotes = Math.max(1, ...timeSeries.quotesPerDay.map((d) => d.count));
  const alertTotal = breakdowns.alertsFrequency.reduce((s, i) => s + i.count, 0);
  const quotesRows = quotesData?.quotes ?? recentActivity.quotes.slice(0, 20);
  const quotesPageTotal = quotesData?.totalPages ?? 1;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-zinc-800 lg:flex">
        <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
          <div className="border-b border-zinc-800 px-5 py-5">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-400">Taxi Combinado</p>
            <p className="mt-0.5 text-base font-black text-white">Admin Master</p>
          </div>
          <nav className="flex-1 px-3 py-4">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                  activeNav === item.id
                    ? 'bg-amber-400/10 text-amber-300'
                    : 'text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-xs font-black">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="border-t border-zinc-800 px-4 py-4">
            {user && <p className="mb-2 truncate text-[10px] font-bold text-zinc-500">{user.name || user.email}</p>}
            <div className="flex gap-2">
              <button onClick={fetchStats} className="flex-1 rounded-lg border border-zinc-700 py-1.5 text-[10px] font-black text-zinc-400 hover:bg-zinc-800">
                ↺ Atualizar
              </button>
              <button onClick={handleLogout} className="flex-1 rounded-lg bg-zinc-800 py-1.5 text-[10px] font-black text-zinc-400 hover:bg-zinc-700">
                Sair
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur lg:hidden">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400">Taxi Combinado</p>
          <p className="text-sm font-black">Admin</p>
        </div>
        <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-black text-zinc-300">
          {mobileNavOpen ? '✕' : '☰ Menu'}
        </button>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-30 bg-zinc-950/95 pt-16 lg:hidden">
          <nav className="px-4 py-4">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => { setActiveNav(item.id); setMobileNavOpen(false); }}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${activeNav === item.id ? 'bg-amber-400/10 text-amber-300' : 'text-zinc-400 hover:bg-zinc-800'}`}>
                <span className="text-lg">{item.icon}</span>
                <span className="font-black">{item.label}</span>
              </button>
            ))}
            <div className="mt-4 flex gap-3">
              <button onClick={fetchStats} className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-black text-zinc-400">↺ Atualizar</button>
              <button onClick={handleLogout} className="flex-1 rounded-xl bg-zinc-800 py-3 text-sm font-black text-zinc-300">Sair</button>
            </div>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="min-w-0 flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {error && (
            <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-400">
              {error} <button onClick={() => setError('')} className="ml-3 opacity-60 hover:opacity-100">✕</button>
            </div>
          )}

          {/* ─── OVERVIEW ─────────────────────────────────────── */}
          {activeNav === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-black text-white">Visão Geral</h1>
                <p className="mt-0.5 text-xs font-semibold text-zinc-500">
                  {overview.firstQuoteAt ? `Dados desde ${new Date(overview.firstQuoteAt).toLocaleDateString('pt-BR')}` : 'Painel de operação'}
                  {' · '}atualiza a cada 60s
                </p>
              </div>

              {/* KPIs top row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiCard label="Usuários cadastrados" value={num(adminUsers.length)} sub="taxistas registrados" color="amber" />
                <KpiCard label="Cotações hoje" value={num(overview.quotesToday)} trend={{ delta: computed.todayDelta, label: 'vs ontem' }} color="green" />
                <KpiCard label="Sessões hoje" value={num(overview.sessionsToday)} sub={`${num(overview.totalSessions)} total`} color="blue" />
                <KpiCard label="Parceiros ativos" value={num(overview.totalPartners)} sub={`${num(overview.totalPartnerClicks)} cliques`} color="default" />
              </div>

              {/* Secondary KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiCard label="Cotações 7 dias" value={num(overview.quotesLast7)} color="default" />
                <KpiCard label="Cotações 30 dias" value={num(overview.quotesLast30)} color="default" />
                <KpiCard label="Preço médio" value={money(computed.avgTicket)} sub={`Lucro ${money(computed.avgProfit)}`} color="amber" />
                <KpiCard label="Taxa de conversão" value={`${computed.conversion.toFixed(1)}%`} sub="cotações por sessão" color="default" />
              </div>

              {/* Chart + Alerts */}
              <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
                <Panel>
                  <SectionTitle sub="Cotações por dia — últimos 30 dias">Volume de cotações</SectionTitle>
                  {timeSeries.quotesPerDay.length === 0 ? (
                    <EmptyRow>Nenhuma cotação nos últimos 30 dias.</EmptyRow>
                  ) : (
                    <div className="flex h-48 items-end gap-1 pt-2">
                      {timeSeries.quotesPerDay.map((day) => (
                        <div key={day.day} className="group relative flex min-w-0 flex-1 flex-col items-center gap-1">
                          <div className="relative flex h-40 w-full items-end">
                            <div
                              className="w-full rounded-t-sm bg-amber-400/70 transition-all group-hover:bg-amber-400"
                              style={{ height: `${Math.max(4, (day.count / maxDailyQuotes) * 100)}%` }}
                              title={`${fmtDay(day.day)}: ${day.count}`}
                            />
                          </div>
                          <span className="hidden text-[9px] font-bold text-zinc-600 sm:block">{fmtDay(day.day)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel>
                  <SectionTitle>Alertas frequentes</SectionTitle>
                  {breakdowns.alertsFrequency.length === 0 ? (
                    <EmptyRow>Sem alertas.</EmptyRow>
                  ) : (
                    <div className="space-y-1">
                      {breakdowns.alertsFrequency.slice(0, 7).map((item) => (
                        <Bar key={item.type} label={ALERT_LABEL[item.type] || item.type} count={item.count} total={alertTotal} />
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              {/* Recent quotes + recent leads */}
              <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                <Panel>
                  <SectionTitle>Cotações recentes</SectionTitle>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] text-xs">
                      <thead>
                        <tr className="border-b border-zinc-700/60 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
                          <th className="pb-2 text-left">Rota</th>
                          <th className="pb-2 text-right">Preço</th>
                          <th className="pb-2 text-right">Lucro</th>
                          <th className="pb-2 text-right">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {recentActivity.quotes.slice(0, 8).map((q) => (
                          <tr key={q.id} className="cursor-pointer hover:bg-zinc-700/20" onClick={() => setSelectedQuote(q)}>
                            <td className="py-2 pr-3">
                              <p className="max-w-[200px] truncate font-semibold text-zinc-200">{q.originAddress || '—'}</p>
                              <p className="max-w-[200px] truncate text-[10px] text-zinc-500">→ {q.destinationAddress || '—'}</p>
                            </td>
                            <td className="py-2 text-right font-black text-emerald-400">{money(q.recommendedPrice)}</td>
                            <td className={`py-2 text-right font-bold ${q.profit >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>{money(q.profit)}</td>
                            <td className="py-2 text-right text-zinc-500">{fmtDate(q.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => setActiveNav('quotes')} className="mt-3 w-full rounded-lg border border-zinc-700/60 py-2 text-xs font-black text-zinc-500 hover:text-zinc-300 transition-colors">
                    Ver todas as cotações →
                  </button>
                </Panel>

                <Panel>
                  <SectionTitle>Parceiros & leads</SectionTitle>
                  <div className="mb-4 space-y-1">
                    {partners.topPartners.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 py-1.5 text-xs">
                        <span className="min-w-0 truncate font-semibold text-zinc-300">{p.name || '—'}</span>
                        <Badge tone="amber">{p.clicks} cliques</Badge>
                      </div>
                    ))}
                    {partners.topPartners.length === 0 && <p className="text-xs text-zinc-600">Nenhum clique registrado.</p>}
                  </div>
                  <div className="border-t border-zinc-700/60 pt-3">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">Leads recentes</p>
                    {partners.recentLeads.slice(0, 4).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between py-1.5 text-xs">
                        <span className="font-semibold text-zinc-300">{lead.name}</span>
                        <span className="text-zinc-500">{fmtDateShort(lead.createdAt)}</span>
                      </div>
                    ))}
                    {partners.recentLeads.length === 0 && <p className="text-xs text-zinc-600">Nenhum lead ainda.</p>}
                  </div>
                </Panel>
              </div>

              {/* Feedback summary */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiCard label="Feedbacks" value={num(overview.totalFeedback)} color="default" />
                <KpiCard label="Nota média" value={overview.avgRating != null ? `${overview.avgRating}/5` : '—'} color="amber" />
                <KpiCard label="Leads totais" value={num(overview.totalLeads)} sub={`${num(overview.leadsToday)} hoje`} color="default" />
                <KpiCard label="Desafios" value={num(overview.challengesTotal)} sub={`${num(overview.challengesToday)} hoje`} color="default" />
              </div>
            </div>
          )}

          {/* ─── QUOTES ───────────────────────────────────────── */}
          {activeNav === 'quotes' && (
            <div className="space-y-5">
              <h1 className="text-xl font-black">Cotações</h1>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiCard label="Preço recomendado" value={money(quoteAverages.recommendedPrice)} color="amber" />
                <KpiCard label="Custo médio" value={money(quoteAverages.totalCost)} color="red" />
                <KpiCard label="Lucro médio" value={money(quoteAverages.profit)} color="green" />
                <KpiCard label="Margem média" value={quoteAverages.margin != null ? `${quoteAverages.margin.toFixed(1)}%` : '—'} color="blue" />
                <KpiCard label="Distância média" value={quoteAverages.distanceKm ? formatDistance(quoteAverages.distanceKm) : '—'} color="default" />
                <KpiCard label="Tempo médio" value={quoteAverages.estimatedMinutes ? formatDuration(quoteAverages.estimatedMinutes) : '—'} color="default" />
                <KpiCard label="Menor preço" value={money(quoteAverages.minRecommendedPrice)} color="default" />
                <KpiCard label="Maior preço" value={money(quoteAverages.maxRecommendedPrice)} color="default" />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Panel>
                  <SectionTitle>Tipo de corrida</SectionTitle>
                  <div className="space-y-1">
                    {breakdowns.tripType.map((item) => (
                      <Bar key={item.tripType} label={TRIP_TYPE_LABEL[item.tripType] || item.tripType} count={item.count} total={overview.totalQuotes} />
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <SectionTitle>Combustível</SectionTitle>
                  <div className="space-y-1">
                    {breakdowns.fuelType.map((item) => (
                      <Bar key={item.fuelType} label={FUEL_LABEL[item.fuelType] || item.fuelType} count={item.count} total={overview.totalQuotes} />
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <SectionTitle>Faixa de distância</SectionTitle>
                  <div className="space-y-1">
                    {breakdowns.distanceRanges.map((item) => (
                      <Bar key={item.range} label={item.range} count={item.count} total={overview.totalQuotes} />
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <SectionTitle>Faixa de preço</SectionTitle>
                  <div className="space-y-1">
                    {breakdowns.priceRanges.map((item) => (
                      <Bar key={item.range} label={item.range} count={item.count} total={overview.totalQuotes} />
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <SectionTitle>Origens mais frequentes</SectionTitle>
                  {geography.topOrigins.length === 0 ? <EmptyRow>Sem dados</EmptyRow> : (
                    <div className="divide-y divide-zinc-800/60">
                      {geography.topOrigins.map((item) => (
                        <div key={item.origin} className="flex items-center justify-between py-2 text-xs">
                          <span className="min-w-0 truncate pr-3 font-semibold text-zinc-300">{item.origin}</span>
                          <span className="shrink-0 font-black text-white tabular-nums">{num(item.count)} <span className="text-zinc-500">{pct(item.count, overview.totalQuotes)}</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
                <Panel>
                  <SectionTitle>Destinos mais frequentes</SectionTitle>
                  {geography.topDestinations.length === 0 ? <EmptyRow>Sem dados</EmptyRow> : (
                    <div className="divide-y divide-zinc-800/60">
                      {geography.topDestinations.map((item) => (
                        <div key={item.destination} className="flex items-center justify-between py-2 text-xs">
                          <span className="min-w-0 truncate pr-3 font-semibold text-zinc-300">{item.destination}</span>
                          <span className="shrink-0 font-black text-white tabular-nums">{num(item.count)} <span className="text-zinc-500">{pct(item.count, overview.totalQuotes)}</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              {/* Quotes table */}
              <Panel>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <SectionTitle>Listagem de cotações</SectionTitle>
                  <div className="flex gap-2">
                    {(['today', 'all'] as const).map((f) => (
                      <button key={f} onClick={() => { setQuotesFilter(f); setQuotesPage(1); }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${quotesFilter === f ? 'bg-amber-400 text-zinc-950' : 'border border-zinc-600 text-zinc-400 hover:bg-zinc-700/50'}`}>
                        {f === 'today' ? `Hoje (${overview.quotesToday})` : `Todas (${quotesData?.total ?? overview.totalQuotes})`}
                      </button>
                    ))}
                  </div>
                </div>
                {quotesLoading ? (
                  <div className="py-8 text-center text-sm font-bold text-zinc-500">Carregando...</div>
                ) : (
                  <QuotesTable rows={quotesRows} onSelect={setSelectedQuote} page={quotesPage} totalPages={quotesPageTotal} onPageChange={setQuotesPage} />
                )}
              </Panel>
            </div>
          )}

          {/* ─── USERS ────────────────────────────────────────── */}
          {activeNav === 'users' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black">Usuários</h1>
                  <p className="mt-0.5 text-xs font-semibold text-zinc-500">Taxistas com conta no aplicativo</p>
                </div>
                <KpiCard label="Total cadastrados" value={num(adminUsers.length)} color="amber" />
              </div>

              <Panel>
                <div className="mb-4">
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar por nome, e-mail ou telefone..."
                    className="w-full rounded-lg border border-zinc-600/60 bg-zinc-700/40 px-4 py-2.5 text-sm font-semibold text-white placeholder-zinc-500 outline-none focus:border-amber-400/60"
                  />
                </div>

                {loadingUsers ? (
                  <div className="py-8 text-center text-sm font-bold text-zinc-500">Carregando usuários...</div>
                ) : filteredUsers.length === 0 ? (
                  <EmptyRow>Nenhum usuário encontrado.</EmptyRow>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                      <thead>
                        <tr className="border-b border-zinc-700/60 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
                          <th className="pb-3 text-left">Usuário</th>
                          <th className="pb-3 text-left">Telefone</th>
                          <th className="pb-3 text-right">Cotações</th>
                          <th className="pb-3 text-right">Última cotação</th>
                          <th className="pb-3 text-right">Cadastro</th>
                          <th className="pb-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="align-middle hover:bg-zinc-700/10">
                            <td className="py-3 pr-4">
                              <p className="font-black text-zinc-100">{u.name || '—'}</p>
                              <p className="text-xs font-semibold text-zinc-500">{u.email || '—'}</p>
                            </td>
                            <td className="py-3 pr-4 text-xs font-semibold text-zinc-400">{u.phone || '—'}</td>
                            <td className="py-3 text-right">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${u.totalQuotes > 0 ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20' : 'bg-zinc-700/60 text-zinc-500'}`}>
                                {u.totalQuotes}
                              </span>
                            </td>
                            <td className="py-3 text-right text-xs font-semibold text-zinc-500">{fmtDate(u.lastQuoteAt)}</td>
                            <td className="py-3 text-right text-xs font-semibold text-zinc-500">{fmtDateShort(u.createdAt)}</td>
                            <td className="py-3 pl-4 text-right">
                              <Btn size="sm" variant="ghost" onClick={() => { setResetUser(u); setResetPassword(''); setResetSuccess(''); }}>
                                Redefinir senha
                              </Btn>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* ─── PARTNERS ─────────────────────────────────────── */}
          {activeNav === 'partners' && (
            <div className="space-y-5">
              <h1 className="text-xl font-black">Parceiros</h1>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiCard label="Parceiros ativos" value={num(overview.totalPartners)} color="green" />
                <KpiCard label="Cliques totais" value={num(overview.totalPartnerClicks)} color="amber" />
                <KpiCard label="Leads totais" value={num(overview.totalLeads)} color="amber" />
                <KpiCard label="Conversão" value={`${computed.leadRate.toFixed(1)}%`} color="default" />
              </div>

              {/* New partner form */}
              <Panel>
                <SectionTitle sub="Novo parceiro">Cadastrar parceiro</SectionTitle>
                <form onSubmit={handleCreatePartner} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Nome" value={partnerForm.name} onChange={(v) => setPartnerForm((f) => ({ ...f, name: v }))} placeholder="Ex: Oficina São José" required />
                    <Input label="Categoria" value={partnerForm.category} onChange={(v) => setPartnerForm((f) => ({ ...f, category: v }))} placeholder="oficina, seguro, guincho…" required />
                  </div>
                  <div>
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Descrição</span>
                    <textarea value={partnerForm.description} onChange={(e) => setPartnerForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Resumo para o motorista." rows={2}
                      className="w-full rounded-lg border border-zinc-600/60 bg-zinc-700/40 px-3 py-2.5 text-xs font-semibold text-white placeholder-zinc-500 outline-none focus:border-amber-400/60" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input label="Telefone" value={partnerForm.phone} onChange={(v) => setPartnerForm((f) => ({ ...f, phone: v }))} placeholder="(11) 9999-9999" />
                    <Input label="WhatsApp" value={partnerForm.whatsapp} onChange={(v) => setPartnerForm((f) => ({ ...f, whatsapp: v }))} placeholder="(11) 9999-9999" />
                    <Input label="Cidade" value={partnerForm.city} onChange={(v) => setPartnerForm((f) => ({ ...f, city: v }))} placeholder="São Paulo" />
                    <Input label="Site" type="url" value={partnerForm.websiteUrl} onChange={(v) => setPartnerForm((f) => ({ ...f, websiteUrl: v }))} placeholder="https://..." />
                    <Input label="Waze" type="url" value={partnerForm.wazeUrl} onChange={(v) => setPartnerForm((f) => ({ ...f, wazeUrl: v }))} placeholder="https://waze.com/..." />
                    <Input label="Logo URL" type="url" value={partnerForm.logoUrl} onChange={(v) => setPartnerForm((f) => ({ ...f, logoUrl: v }))} placeholder="https://..." />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-700/60 bg-zinc-700/20 px-4 py-3">
                    <div className="flex flex-wrap gap-4">
                      {[{ key: 'isActive', label: 'Ativo' }, { key: 'isPremium', label: 'Premium' }].map(({ key, label }) => (
                        <label key={key} className="flex cursor-pointer items-center gap-2 text-xs font-black text-zinc-300">
                          <input type="checkbox" checked={partnerForm[key as 'isActive' | 'isPremium']}
                            onChange={(e) => setPartnerForm((f) => ({ ...f, [key]: e.target.checked }))}
                            className="h-3.5 w-3.5 accent-amber-400" />
                          {label}
                        </label>
                      ))}
                      <label className="flex items-center gap-2 text-xs font-black text-zinc-300">
                        Ordem
                        <input type="number" value={partnerForm.sortOrder} onChange={(e) => setPartnerForm((f) => ({ ...f, sortOrder: e.target.value }))}
                          className="w-16 rounded border border-zinc-600/60 bg-zinc-700/40 px-2 py-1 text-xs font-bold text-white outline-none" />
                      </label>
                    </div>
                    <Btn disabled={savingPartner}>{savingPartner ? 'Cadastrando...' : 'Cadastrar parceiro'}</Btn>
                  </div>
                </form>
              </Panel>

              {/* Partners list */}
              <Panel>
                <SectionTitle sub={`${adminPartners.length} registros`}>Parceiros cadastrados</SectionTitle>
                {loadingPartners ? <EmptyRow>Carregando...</EmptyRow> : adminPartners.length === 0 ? <EmptyRow>Nenhum parceiro cadastrado.</EmptyRow> : (
                  <div className="space-y-4">
                    {adminPartners.map((partner) => (
                      <div key={partner.id} className="rounded-xl border border-zinc-700/60 bg-zinc-800/30 p-4">
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-black text-white">{partner.name}</p>
                              <Badge tone={partner.isActive ? 'green' : 'default'}>{partner.isActive ? 'Ativo' : 'Inativo'}</Badge>
                              {partner.isPremium && <Badge tone="amber">Premium</Badge>}
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-zinc-500">{partner.category}{partner.city ? ` · ${partner.city}` : ''}</p>
                            <p className="mt-0.5 text-[11px] text-zinc-600">{partner._count.clicks} cliques · {partner._count.leads} leads</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Btn size="sm" variant="primary" onClick={() => updatePartner(partner.id, {
                              name: partner.name, category: partner.category, description: partner.description ?? '',
                              logoUrl: partner.logoUrl ?? '', websiteUrl: partner.websiteUrl ?? '', wazeUrl: partner.wazeUrl ?? '',
                              phone: partner.phone ?? '', whatsapp: partner.whatsapp ?? '', city: partner.city ?? '',
                              isActive: partner.isActive, isPremium: partner.isPremium, sortOrder: partner.sortOrder,
                            })}>Salvar</Btn>
                            <Btn size="sm" variant="ghost" onClick={() => updatePartner(partner.id, { isPremium: !partner.isPremium })}>
                              {partner.isPremium ? '− Premium' : '+ Premium'}
                            </Btn>
                            <Btn size="sm" variant={partner.isActive ? 'danger' : 'success'} onClick={() => updatePartner(partner.id, { isActive: !partner.isActive })}>
                              {partner.isActive ? 'Desativar' : 'Ativar'}
                            </Btn>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {[
                            { ph: 'Nome', val: partner.name, key: 'name' },
                            { ph: 'Categoria', val: partner.category, key: 'category' },
                            { ph: 'Cidade', val: partner.city ?? '', key: 'city' },
                            { ph: 'Telefone', val: partner.phone ?? '', key: 'phone' },
                            { ph: 'WhatsApp', val: partner.whatsapp ?? '', key: 'whatsapp' },
                            { ph: 'Ordem', val: String(partner.sortOrder), key: 'sortOrder', type: 'number' },
                            { ph: 'Site', val: partner.websiteUrl ?? '', key: 'websiteUrl' },
                            { ph: 'Waze', val: partner.wazeUrl ?? '', key: 'wazeUrl' },
                            { ph: 'Logo URL', val: partner.logoUrl ?? '', key: 'logoUrl' },
                          ].map(({ ph, val, key, type }) => (
                            <input key={key} type={type || 'text'} value={val}
                              onChange={(e) => updatePartnerDraft(partner.id, { [key]: type === 'number' ? Number(e.target.value || 0) : e.target.value } as AdminPartnerPatch)}
                              placeholder={ph}
                              className="rounded-lg border border-zinc-700/60 bg-zinc-700/30 px-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 outline-none focus:border-amber-400/40" />
                          ))}
                        </div>
                        <textarea value={partner.description ?? ''}
                          onChange={(e) => updatePartnerDraft(partner.id, { description: e.target.value })}
                          placeholder="Descrição" rows={2}
                          className="mt-2 w-full rounded-lg border border-zinc-700/60 bg-zinc-700/30 px-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 outline-none focus:border-amber-400/40" />

                        {/* Locations */}
                        <div className="mt-4 rounded-lg border border-zinc-700/40 bg-zinc-800/40 p-3">
                          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Unidades ({partner.locations.length})</p>
                          {partner.locations.map((loc) => (
                            <div key={loc.id} className="mb-3 rounded-lg border border-zinc-700/40 bg-zinc-700/20 p-3">
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-black text-zinc-200">{loc.name}</p>
                                  <Badge tone={loc.isActive ? 'green' : 'default'}>{loc.isActive ? 'Ativa' : 'Inativa'}</Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Btn size="sm" variant="primary" onClick={() => updatePartnerLocation(loc.id, {
                                    name: loc.name, address: loc.address ?? '', city: loc.city ?? '',
                                    phone: loc.phone ?? '', whatsapp: loc.whatsapp ?? '', wazeUrl: loc.wazeUrl ?? '',
                                    isActive: loc.isActive, sortOrder: loc.sortOrder,
                                  })}>Salvar</Btn>
                                  <Btn size="sm" variant={loc.isActive ? 'danger' : 'success'} onClick={() => updatePartnerLocation(loc.id, { isActive: !loc.isActive })}>
                                    {loc.isActive ? 'Desativar' : 'Ativar'}
                                  </Btn>
                                </div>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-3">
                                {[
                                  { ph: 'Nome da unidade', val: loc.name, key: 'name' },
                                  { ph: 'Endereço', val: loc.address ?? '', key: 'address' },
                                  { ph: 'Cidade', val: loc.city ?? '', key: 'city' },
                                  { ph: 'Telefone', val: loc.phone ?? '', key: 'phone' },
                                  { ph: 'WhatsApp', val: loc.whatsapp ?? '', key: 'whatsapp' },
                                  { ph: 'Ordem', val: String(loc.sortOrder), key: 'sortOrder', type: 'number' },
                                ].map(({ ph, val, key, type }) => (
                                  <input key={key} type={type || 'text'} value={val}
                                    onChange={(e) => updatePartnerLocationDraft(partner.id, loc.id, { [key]: type === 'number' ? Number(e.target.value || 0) : e.target.value } as AdminPartnerLocationPatch)}
                                    placeholder={ph}
                                    className="rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-2 text-xs font-semibold text-white placeholder-zinc-600 outline-none focus:border-amber-400/40" />
                                ))}
                                <input type="url" value={loc.wazeUrl ?? ''}
                                  onChange={(e) => updatePartnerLocationDraft(partner.id, loc.id, { wazeUrl: e.target.value })}
                                  placeholder="Link do Waze" className="rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-2 text-xs font-semibold text-white placeholder-zinc-600 outline-none focus:border-amber-400/40 sm:col-span-3" />
                              </div>
                            </div>
                          ))}
                          <form onSubmit={(e) => handleCreatePartnerLocation(e, partner.id)} className="mt-2">
                            <div className="grid gap-2 sm:grid-cols-3">
                              {[
                                { ph: 'Nome da unidade*', key: 'name', req: true },
                                { ph: 'Endereço', key: 'address' },
                                { ph: 'Cidade', key: 'city' },
                                { ph: 'Telefone', key: 'phone' },
                                { ph: 'WhatsApp', key: 'whatsapp' },
                              ].map(({ ph, key, req }) => (
                                <input key={key} required={req}
                                  value={(locationForms[partner.id] || EMPTY_LOCATION_FORM)[key as keyof PartnerLocationFormState]}
                                  onChange={(e) => setLocationForms((fs) => ({ ...fs, [partner.id]: { ...(fs[partner.id] || EMPTY_LOCATION_FORM), [key]: e.target.value } }))}
                                  placeholder={ph}
                                  className="rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-2 text-xs font-semibold text-white placeholder-zinc-600 outline-none focus:border-amber-400/40" />
                              ))}
                              <input type="url"
                                value={(locationForms[partner.id] || EMPTY_LOCATION_FORM).wazeUrl}
                                onChange={(e) => setLocationForms((fs) => ({ ...fs, [partner.id]: { ...(fs[partner.id] || EMPTY_LOCATION_FORM), wazeUrl: e.target.value } }))}
                                placeholder="Link do Waze" className="rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-2 text-xs font-semibold text-white placeholder-zinc-600 outline-none focus:border-amber-400/40 sm:col-span-2" />
                              <Btn disabled={savingLocationFor === partner.id} className="w-full">
                                {savingLocationFor === partner.id ? 'Salvando...' : '+ Unidade'}
                              </Btn>
                            </div>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {/* Leads table */}
              <Panel>
                <SectionTitle>Leads recentes</SectionTitle>
                {partners.recentLeads.length === 0 ? <EmptyRow>Nenhum lead registrado.</EmptyRow> : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-xs">
                      <thead>
                        <tr className="border-b border-zinc-700/60 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
                          <th className="pb-2 text-left">Nome</th><th className="pb-2 text-left">WhatsApp</th>
                          <th className="pb-2 text-left">Parceiro</th><th className="pb-2 text-right">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {partners.recentLeads.map((lead) => (
                          <tr key={lead.id}>
                            <td className="py-2 pr-3 font-black text-zinc-200">{lead.name}</td>
                            <td className="py-2 pr-3"><a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="font-bold text-sky-400 hover:text-sky-300">{lead.phone}</a></td>
                            <td className="py-2 pr-3 font-semibold text-zinc-400">{lead.partner?.name || '—'}</td>
                            <td className="py-2 text-right text-zinc-500">{fmtDate(lead.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* ─── AUDIENCE ─────────────────────────────────────── */}
          {activeNav === 'audience' && (
            <div className="space-y-5">
              <h1 className="text-xl font-black">Visitantes</h1>
              <div className="grid grid-cols-3 gap-3">
                <KpiCard label="Sessões totais" value={num(overview.totalSessions)} color="blue" />
                <KpiCard label="Sessões hoje" value={num(overview.sessionsToday)} color="blue" />
                <KpiCard label="Cotações por sessão" value={`${computed.conversion.toFixed(1)}%`} color="amber" />
              </div>
              <Panel>
                <SectionTitle>Sessões recentes</SectionTitle>
                <p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] font-semibold text-amber-500/80">
                  Cada linha é uma sessão de navegador distinta. Se um mesmo usuário recarregar sem cookie ativo, aparece como nova sessão — esperado para visitantes anônimos.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-xs">
                    <thead>
                      <tr className="border-b border-zinc-700/60 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
                        <th className="pb-2 text-left">ID da sessão</th><th className="pb-2 text-right">Cotações</th>
                        <th className="pb-2 text-left">Primeira visita</th><th className="pb-2 text-left">Última atividade</th>
                        <th className="pb-2 text-right">Duração</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {recentActivity.sessions.map((session) => {
                        const diff = Math.round((new Date(session.lastSeen).getTime() - new Date(session.createdAt).getTime()) / 60000);
                        const dur = diff < 1 ? '< 1 min' : diff < 60 ? `${diff} min` : `${(diff / 60).toFixed(1)} h`;
                        return (
                          <tr key={session.id}>
                            <td className="py-2 pr-3 font-mono text-zinc-500">{session.sessionId.slice(0, 8)}…</td>
                            <td className="py-2 text-right">
                              <Badge tone={session._count.quotes > 0 ? 'green' : 'default'}>{session._count.quotes}</Badge>
                            </td>
                            <td className="py-2 pr-3 text-zinc-400">{fmtDate(session.createdAt)}</td>
                            <td className="py-2 pr-3 text-zinc-400">{fmtDate(session.lastSeen)}</td>
                            <td className="py-2 text-right text-zinc-500">{dur}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          )}

          {/* ─── FEEDBACK ─────────────────────────────────────── */}
          {activeNav === 'feedback' && (
            <div className="space-y-5">
              <h1 className="text-xl font-black">Feedback</h1>
              <div className="grid grid-cols-2 gap-3">
                <KpiCard label="Total de feedbacks" value={num(overview.totalFeedback)} color="amber" />
                <KpiCard label="Nota média" value={overview.avgRating != null ? `${overview.avgRating}/5` : '—'} color="green" />
              </div>
              <div className="grid gap-3">
                {recentActivity.feedback.length === 0 ? <EmptyRow>Nenhum feedback registrado.</EmptyRow> : (
                  recentActivity.feedback.map((item) => (
                    <Panel key={item.id} className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-black text-amber-300">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</p>
                          <span className="text-xs font-black text-white">{item.rating}/5</span>
                          {item.category && <Badge>{item.category}</Badge>}
                        </div>
                        {item.message && <p className="mt-2 text-sm font-semibold leading-6 text-zinc-400">{item.message}</p>}
                      </div>
                      <p className="text-xs font-semibold text-zinc-600">{fmtDate(item.createdAt)}</p>
                    </Panel>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ─── SYSTEM ───────────────────────────────────────── */}
          {activeNav === 'system' && (
            <div className="space-y-5">
              <h1 className="text-xl font-black">Sistema</h1>
              <div className="grid grid-cols-3 gap-3">
                <KpiCard label="Modo automático" value={num(breakdowns.routeMode.find((r) => r.routeMode === 'automatic')?.count ?? 0)} color="blue" />
                <KpiCard label="Modo manual" value={num(breakdowns.routeMode.find((r) => r.routeMode === 'manual')?.count ?? 0)} color="amber" />
                <KpiCard label="Alertas gerados" value={num(alertTotal)} color={alertTotal > 0 ? 'red' : 'green'} />
              </div>
              <Panel>
                <SectionTitle>Controles do aplicativo</SectionTitle>
                <div className="flex flex-col gap-4 rounded-xl border border-zinc-700/60 bg-zinc-700/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-white">Mostrar passo a passo da rota</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-500">Liga/desliga exibição de instruções detalhadas da rota.</p>
                  </div>
                  <button
                    disabled={!flags || savingFlag}
                    onClick={() => flags && updateRouteSteps(!flags.showRouteSteps)}
                    className={`min-w-[100px] rounded-xl px-5 py-3 text-sm font-black transition-all disabled:cursor-not-allowed disabled:opacity-40 ${flags?.showRouteSteps ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-700 text-zinc-400'}`}
                  >
                    {savingFlag ? '...' : flags?.showRouteSteps ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              </Panel>
            </div>
          )}
        </div>
      </main>

      {/* Quote modal */}
      {selectedQuote && (
        <QuoteModal quote={selectedQuote} onClose={() => setSelectedQuote(null)} />
      )}

      {/* Reset password modal */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm" onClick={() => setResetUser(null)}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-zinc-700 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Redefinir senha</p>
                <p className="mt-0.5 font-black text-white">{resetUser.name || resetUser.email}</p>
                {resetUser.name && <p className="text-xs text-zinc-500">{resetUser.email}</p>}
              </div>
              <button onClick={() => setResetUser(null)} className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-black text-zinc-400 hover:bg-zinc-700">✕</button>
            </div>
            <div className="px-5 py-5">
              {resetSuccess ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm font-bold text-emerald-400">
                  ✓ {resetSuccess}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-zinc-500">
                    Define uma nova senha para este usuário. Ele precisará usar a nova senha no próximo login.
                  </p>
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Nova senha (mín. 6 caracteres)</label>
                    <input
                      type="password" value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-zinc-600/60 bg-zinc-700/40 px-3 py-2.5 text-sm font-semibold text-white placeholder-zinc-500 outline-none focus:border-amber-400/60"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Btn variant="ghost" className="flex-1" onClick={() => setResetUser(null)}>Cancelar</Btn>
                    <Btn disabled={resetLoading || resetPassword.length < 6} className="flex-1"
                      onClick={handleResetPassword}>
                      {resetLoading ? 'Salvando...' : 'Redefinir senha'}
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function QuoteModal({ quote, onClose }: { quote: AdminStats['recentActivity']['quotes'][0]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-zinc-700 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">{fmtDate(quote.createdAt)}</p>
            <p className="mt-0.5 text-sm font-black text-white">{quote.originAddress || '—'}</p>
            <p className="text-xs font-semibold text-zinc-400">→ {quote.destinationAddress || '—'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-black text-zinc-400 hover:bg-zinc-700">✕</button>
        </div>
        <div className="px-5 py-5">
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Preço', value: formatCurrencyBRL(quote.recommendedPrice), color: 'text-emerald-400' },
              { label: 'Custo', value: formatCurrencyBRL(quote.totalCost), color: 'text-rose-400' },
              { label: 'Lucro', value: formatCurrencyBRL(quote.profit), color: quote.profit >= 0 ? 'text-sky-400' : 'text-rose-400' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500">{item.label}</p>
                <p className={`mt-1 text-base font-black tabular-nums ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="divide-y divide-zinc-800/60">
            {[
              { label: 'Distância', value: formatDistance(quote.distanceKm) },
              { label: 'Margem', value: `${quote.margin.toFixed(1)}%` },
              { label: 'Tipo', value: TRIP_TYPE_LABEL[quote.tripType] || quote.tripType },
              { label: 'Combustível', value: FUEL_LABEL[quote.fuelType] || quote.fuelType },
              { label: 'Modo de rota', value: quote.routeMode === 'automatic' ? 'Automático' : 'Manual' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 text-xs">
                <span className="font-semibold text-zinc-500">{item.label}</span>
                <span className="font-black text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuotesTable({ rows, onSelect, page, totalPages, onPageChange }: {
  rows: AdminStats['recentActivity']['quotes'];
  onSelect?: (q: AdminStats['recentActivity']['quotes'][0]) => void;
  page?: number; totalPages?: number; onPageChange?: (p: number) => void;
}) {
  if (!rows.length) return <EmptyRow>Nenhuma cotação registrada.</EmptyRow>;
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-xs">
          <thead>
            <tr className="border-b border-zinc-700/60 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
              <th className="pb-2 text-left">Data</th><th className="pb-2 text-left">Rota</th>
              <th className="pb-2 text-right">Dist.</th><th className="pb-2 text-right">Preço</th>
              <th className="pb-2 text-right">Custo</th><th className="pb-2 text-right">Lucro</th>
              <th className="pb-2 text-right">Margem</th><th className="pb-2 text-left">Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {rows.map((q) => (
              <tr key={q.id} className="cursor-pointer align-top hover:bg-zinc-700/10 transition-colors" onClick={() => onSelect?.(q)}>
                <td className="py-2 pr-3 whitespace-nowrap text-zinc-500">{fmtDate(q.createdAt)}</td>
                <td className="py-2 pr-3 max-w-[220px]">
                  <p className="truncate font-semibold text-zinc-200">{q.originAddress || '—'}</p>
                  <p className="truncate text-zinc-600">→ {q.destinationAddress || '—'}</p>
                </td>
                <td className="py-2 text-right whitespace-nowrap font-semibold text-zinc-400">{formatDistance(q.distanceKm)}</td>
                <td className="py-2 text-right whitespace-nowrap font-black text-emerald-400">{formatCurrencyBRL(q.recommendedPrice)}</td>
                <td className="py-2 text-right whitespace-nowrap font-bold text-rose-400">{formatCurrencyBRL(q.totalCost)}</td>
                <td className={`py-2 text-right whitespace-nowrap font-bold ${q.profit >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>{formatCurrencyBRL(q.profit)}</td>
                <td className="py-2 text-right whitespace-nowrap font-semibold text-zinc-400">{q.margin.toFixed(1)}%</td>
                <td className="py-2 pl-3 whitespace-nowrap font-semibold text-zinc-500">{TRIP_TYPE_LABEL[q.tripType] || q.tripType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages && totalPages > 1 && onPageChange && page && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-700/60 pt-4">
          <Btn size="sm" variant="ghost" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>← Anterior</Btn>
          <span className="text-xs font-bold text-zinc-500">{page} / {totalPages}</span>
          <Btn size="sm" variant="ghost" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Próxima →</Btn>
        </div>
      )}
    </div>
  );
}
