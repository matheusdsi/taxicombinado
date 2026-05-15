'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiUrl } from '@/lib/apiConfig';
import { formatCurrencyBRL, formatDistance, formatDuration } from '@/lib/formatters';

interface AdminStats {
  overview: {
    totalQuotes: number;
    quotesToday: number;
    quotesYesterday: number;
    quotesLast7: number;
    quotesLast30: number;
    challengesTotal: number;
    challengesToday: number;
    totalSessions: number;
    sessionsToday: number;
    totalPartners: number;
    totalPartnerClicks: number;
    partnerClicksToday: number;
    totalLeads: number;
    leadsToday: number;
    totalFeedback: number;
    avgRating: number | null;
    firstQuoteAt: string | null;
  };
  quoteAverages: {
    distanceKm: number | null;
    totalDistanceKm: number | null;
    estimatedMinutes: number | null;
    recommendedPrice: number | null;
    totalCost: number | null;
    profit: number | null;
    margin: number | null;
    fuelPricePerLiter: number | null;
    consumptionKmPerLiter: number | null;
    tollTotal: number | null;
    desiredMarginPercent: number | null;
    minRecommendedPrice: number | null;
    maxRecommendedPrice: number | null;
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
    recentLeads: {
      id: string;
      name: string;
      phone: string;
      email?: string;
      createdAt: string;
      partner: { name: string; category: string };
    }[];
  };
  recentActivity: {
    quotes: {
      id: string;
      createdAt: string;
      originAddress?: string;
      destinationAddress?: string;
      tripType: string;
      distanceKm: number;
      recommendedPrice: number;
      totalCost: number;
      profit: number;
      margin: number;
      fuelType: string;
      routeMode: string;
    }[];
    sessions: { id: string; sessionId: string; createdAt: string; lastSeen: string; _count: { quotes: number } }[];
    feedback: { id: string; rating: number; category?: string; message?: string; createdAt: string }[];
  };
}

interface FeatureFlags {
  showRouteSteps: boolean;
}

interface AdminPartner {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  wazeUrl?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  isActive: boolean;
  isPremium: boolean;
  sortOrder: number;
  _count: { clicks: number; leads: number };
  clickSources?: Record<string, number>;
  locations: AdminPartnerLocation[];
}

interface AdminPartnerLocation {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  wazeUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { clicks: number };
  clickSources?: Record<string, number>;
}

interface PartnerFormState {
  name: string;
  category: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  wazeUrl: string;
  phone: string;
  whatsapp: string;
  city: string;
  isActive: boolean;
  isPremium: boolean;
  sortOrder: string;
}

interface PartnerLocationFormState {
  name: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  wazeUrl: string;
  sortOrder: string;
}

type AdminPartnerPatch = Partial<Pick<
  AdminPartner,
  'name' | 'category' | 'description' | 'logoUrl' | 'websiteUrl' | 'wazeUrl' | 'phone' | 'whatsapp' | 'city' | 'isActive' | 'isPremium' | 'sortOrder'
>>;

type AdminPartnerLocationPatch = Partial<Pick<
  AdminPartnerLocation,
  'name' | 'address' | 'city' | 'phone' | 'whatsapp' | 'wazeUrl' | 'isActive' | 'sortOrder'
>>;

type TabId = 'master' | 'quotes' | 'audience' | 'partners' | 'feedback' | 'system';

const TRIP_TYPE_LABEL: Record<string, string> = {
  one_way: 'So ida',
  round_trip: 'Ida e volta',
  empty_return: 'Volta vazia',
};

const FUEL_LABEL: Record<string, string> = {
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  gnv: 'GNV',
  diesel: 'Diesel',
  hybrid: 'Hibrido',
  electric: 'Eletrico',
  other: 'Outro',
};

const ALERT_LABEL: Record<string, string> = {
  low_profit: 'Lucro baixo',
  negative_profit: 'Lucro negativo',
  custom_price_below_minimum: 'Preco abaixo do minimo',
  empty_return_enabled: 'Volta vazia ativa',
  toll_missing: 'Pedagio nao informado',
  high_margin: 'Margem alta',
  check_route: 'Conferir rota',
};

const TABS: { id: TabId; label: string; description: string }[] = [
  { id: 'master', label: 'Painel master', description: 'Resumo executivo' },
  { id: 'quotes', label: 'Cotacoes', description: 'Rotas, precos e custos' },
  { id: 'audience', label: 'Visitantes', description: 'Sessoes anonimas' },
  { id: 'partners', label: 'Parceiros', description: 'Cliques e leads' },
  { id: 'feedback', label: 'Feedback', description: 'Notas e mensagens' },
  { id: 'system', label: 'Sistema', description: 'Controles ativos' },
];

const EMPTY_PARTNER_FORM: PartnerFormState = {
  name: '',
  category: '',
  description: '',
  logoUrl: '',
  websiteUrl: '',
  wazeUrl: '',
  phone: '',
  whatsapp: '',
  city: '',
  isActive: true,
  isPremium: false,
  sortOrder: '0',
};

const EMPTY_LOCATION_FORM: PartnerLocationFormState = {
  name: '',
  address: '',
  city: '',
  phone: '',
  whatsapp: '',
  wazeUrl: '',
  sortOrder: '0',
};

function fmtDate(iso?: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function pct(value: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function money(value: number | null | undefined) {
  return value == null ? '-' : formatCurrencyBRL(value);
}

function numberBR(value: number | null | undefined) {
  return value == null ? '-' : value.toLocaleString('pt-BR');
}

function partnerClickSourceCount(partner: AdminPartner, source: string) {
  return partner.clickSources?.[source] ?? 0;
}

function locationClickSourceCount(location: AdminPartnerLocation, source: string) {
  return location.clickSources?.[source] ?? 0;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-zinc-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function SectionHeader({ title, eyebrow }: { title: string; eyebrow?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">{eyebrow}</p>}
        <h2 className="text-lg font-black text-zinc-950">{title}</h2>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone = 'dark',
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'dark' | 'yellow' | 'green' | 'blue' | 'red';
}) {
  const toneClass = {
    dark: 'bg-zinc-950 text-white border-zinc-950',
    yellow: 'bg-taxi-50 text-zinc-950 border-taxi-200',
    green: 'bg-emerald-50 text-emerald-950 border-emerald-200',
    blue: 'bg-sky-50 text-sky-950 border-sky-200',
    red: 'bg-rose-50 text-rose-950 border-rose-200',
  }[tone];

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black leading-none">{value}</p>
      {detail && <p className="mt-2 text-xs font-semibold opacity-70">{detail}</p>}
    </div>
  );
}

function BarRow({ label, count, total, detail }: { label: string; count: number; total: number; detail?: string }) {
  const width = total > 0 ? Math.max(3, Math.round((count / total) * 100)) : 0;
  return (
    <div className="py-2">
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-bold text-zinc-700">{label}</span>
        <span className="shrink-0 font-black text-zinc-950">
          {numberBR(count)} <span className="font-semibold text-zinc-400">{detail ?? pct(count, total)}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full rounded-full bg-zinc-950" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-zinc-200 p-5 text-center text-sm font-semibold text-zinc-400">{children}</p>;
}

function TopList({ items, total }: { items: { label: string; count: number; sub?: string }[]; total: number }) {
  if (!items.length) return <EmptyState>Nenhum dado registrado ainda.</EmptyState>;
  return (
    <div className="divide-y divide-zinc-100">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-zinc-800">{item.label || '(em branco)'}</p>
            {item.sub && <p className="text-xs font-semibold text-zinc-400">{item.sub}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-zinc-950">{numberBR(item.count)}</p>
            <p className="text-[11px] font-bold text-zinc-400">{pct(item.count, total)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [adminPartners, setAdminPartners] = useState<AdminPartner[]>([]);
  const [partnerForm, setPartnerForm] = useState<PartnerFormState>(EMPTY_PARTNER_FORM);
  const [locationForms, setLocationForms] = useState<Record<string, PartnerLocationFormState>>({});
  const [loading, setLoading] = useState(true);
  const [savingFlag, setSavingFlag] = useState(false);
  const [savingPartner, setSavingPartner] = useState(false);
  const [savingLocationFor, setSavingLocationFor] = useState<string | null>(null);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ name?: string | null; email: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('master');
  const [adminSelectedQuote, setAdminSelectedQuote] = useState<AdminStats['recentActivity']['quotes'][0] | null>(null);
  const [quotesTablePage, setQuotesTablePage] = useState(1);
  const [quotesFilter, setQuotesFilter] = useState<'all' | 'today'>('all');
  const [quotesData, setQuotesData] = useState<{ quotes: AdminStats['recentActivity']['quotes']; total: number; totalPages: number } | null>(null);
  const [quotesLoading, setQuotesLoading] = useState(false);

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
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar parceiros');
      setAdminPartners(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar parceiros');
    } finally {
      setLoadingPartners(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(apiUrl('/api/admin/stats'), { credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/admin/login';
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar dados do admin');
      setStats(json.data);
      await fetchSettings();
      await fetchAdminPartners();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados do admin');
    }
  }, [fetchAdminPartners, fetchSettings]);

  const fetchQuotes = useCallback(async (page: number, filter: 'all' | 'today') => {
    setQuotesLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/quotes?page=${page}&limit=20&filter=${filter}`), { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar cotações');
      setQuotesData(json.data);
    } catch {
      // silently fail, table shows last data
    } finally {
      setQuotesLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const me = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
        if (!me.ok) {
          window.location.href = '/admin/login';
          return;
        }
        const { data } = await me.json();
        setUser(data);
        await fetchStats();
      } catch {
        window.location.href = '/admin/login';
      } finally {
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

  useEffect(() => {
    fetchQuotes(quotesTablePage, quotesFilter);
  }, [quotesTablePage, quotesFilter, fetchQuotes]);

  async function handleLogout() {
    await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    window.location.href = '/admin/login';
  }

  async function updateRouteSteps(value: boolean) {
    setSavingFlag(true);
    try {
      const res = await fetch(apiUrl('/api/admin/settings'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showRouteSteps: value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar configuracao');
      setFlags(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar configuracao');
    } finally {
      setSavingFlag(false);
    }
  }

  async function handleCreatePartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPartner(true);
    setError('');
    try {
      const payload = {
        ...partnerForm,
        sortOrder: Number(partnerForm.sortOrder || 0),
      };
      const res = await fetch(apiUrl('/api/admin/partners'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao cadastrar parceiro');
      setPartnerForm(EMPTY_PARTNER_FORM);
      await fetchAdminPartners();
      await fetchStats();
      setActiveTab('partners');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao cadastrar parceiro');
    } finally {
      setSavingPartner(false);
    }
  }

  function updatePartnerDraft(partnerId: string, patch: AdminPartnerPatch) {
    setAdminPartners((current) => current.map((partner) => (
      partner.id === partnerId ? { ...partner, ...patch } : partner
    )));
  }

  function updatePartnerLocationDraft(partnerId: string, locationId: string, patch: AdminPartnerLocationPatch) {
    setAdminPartners((current) => current.map((partner) => {
      if (partner.id !== partnerId) return partner;

      return {
        ...partner,
        locations: partner.locations.map((location) => (
          location.id === locationId ? { ...location, ...patch } : location
        )),
      };
    }));
  }

  async function updatePartner(partnerId: string, patch: AdminPartnerPatch) {
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/partners/${partnerId}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao atualizar parceiro');
      await fetchAdminPartners();
      await fetchStats();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar parceiro');
    }
  }

  async function handleCreatePartnerLocation(event: FormEvent<HTMLFormElement>, partnerId: string) {
    event.preventDefault();
    const form = locationForms[partnerId] || EMPTY_LOCATION_FORM;
    setSavingLocationFor(partnerId);
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/partners/${partnerId}/locations`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder || 0), isActive: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao cadastrar unidade');
      setLocationForms((current) => ({ ...current, [partnerId]: EMPTY_LOCATION_FORM }));
      await fetchAdminPartners();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao cadastrar unidade');
    } finally {
      setSavingLocationFor(null);
    }
  }

  async function updatePartnerLocation(locationId: string, patch: AdminPartnerLocationPatch) {
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/admin/partner-locations/${locationId}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao atualizar unidade');
      await fetchAdminPartners();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar unidade');
    }
  }

  const computed = useMemo(() => {
    if (!stats) return null;
    const { overview, quoteAverages } = stats;
    const conversion = overview.totalSessions > 0 ? (overview.totalQuotes / overview.totalSessions) * 100 : 0;
    const leadRate = overview.totalPartnerClicks > 0 ? (overview.totalLeads / overview.totalPartnerClicks) * 100 : 0;
    const todayDelta = overview.quotesToday - overview.quotesYesterday;
    const avgTicket = quoteAverages.recommendedPrice ?? 0;
    const avgProfit = quoteAverages.profit ?? 0;
    return { conversion, leadRate, todayDelta, avgTicket, avgProfit };
  }, [stats]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-100 p-4">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-950" />
            <p className="font-extrabold text-zinc-700">Carregando painel master...</p>
          </Card>
        </div>
      </main>
    );
  }

  if (error && !stats) {
    return (
      <main className="min-h-screen bg-zinc-100 p-4">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <Card className="p-6 text-center">
            <p className="mb-4 font-bold text-rose-600">{error}</p>
            <button onClick={fetchStats} className="rounded-lg bg-zinc-950 px-5 py-3 text-sm font-black text-white">
              Tentar novamente
            </button>
          </Card>
        </div>
      </main>
    );
  }

  if (!stats || !computed) return null;

  const { overview, quoteAverages, breakdowns, timeSeries, geography, partners, recentActivity } = stats;
  const maxDailyQuotes = Math.max(1, ...timeSeries.quotesPerDay.map((item) => item.count));
  const alertTotal = breakdowns.alertsFrequency.reduce((sum, item) => sum + item.count, 0);
  const recentPriceRows = [...timeSeries.avgPricePerDay].reverse().slice(0, 10);
  const quotesRows = quotesData?.quotes ?? recentActivity.quotes.slice(0, 20);
  const quotesPageTotal = quotesData?.totalPages ?? 1;

  return (
    <main className="min-h-screen bg-[#f4f3ef] text-zinc-950">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-taxi-700">Taxi Combinado</p>
              <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">Admin master</h1>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                {overview.firstQuoteAt ? `Dados desde ${new Date(overview.firstQuoteAt).toLocaleDateString('pt-BR')}` : 'Painel de operacao'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {user && <span className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-500">{user.name || user.email}</span>}
              <button onClick={fetchStats} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-800 hover:bg-zinc-50">
                Atualizar
              </button>
              <button onClick={handleLogout} className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-black text-white hover:bg-zinc-800">
                Sair
              </button>
            </div>
          </div>
          {error && <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[250px_1fr]">
        <aside className="lg:sticky lg:top-5 lg:self-start">
          <Card className="overflow-hidden p-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mb-1 w-full rounded-md px-3 py-3 text-left transition-colors last:mb-0 ${
                  activeTab === tab.id ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <span className="block text-sm font-black">{tab.label}</span>
                <span className={`block text-xs font-semibold ${activeTab === tab.id ? 'text-zinc-300' : 'text-zinc-400'}`}>{tab.description}</span>
              </button>
            ))}
          </Card>
        </aside>

        <section className="min-w-0">
          {activeTab === 'master' && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Cotacoes totais" value={numberBR(overview.totalQuotes)} detail={`${overview.quotesToday} hoje, ${overview.quotesYesterday} ontem`} />
                <MetricCard label="Preco medio" value={money(computed.avgTicket)} detail={`Lucro medio ${money(computed.avgProfit)}`} tone="yellow" />
                <MetricCard label="Visitantes" value={numberBR(overview.totalSessions)} detail={`${computed.conversion.toFixed(1)}% cotacoes por sessao`} tone="blue" />
                <MetricCard label="Parceiros" value={numberBR(overview.totalPartners)} detail={`${overview.totalPartnerClicks} cliques, ${overview.totalLeads} leads`} tone="green" />
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
                <Card className="p-5">
                  <SectionHeader title="Ritmo dos ultimos 30 dias" eyebrow="Volume" />
                  {timeSeries.quotesPerDay.length === 0 ? (
                    <EmptyState>Nenhuma cotacao nos ultimos 30 dias.</EmptyState>
                  ) : (
                    <div className="flex h-64 items-end gap-2 border-b border-zinc-200 pt-5">
                      {timeSeries.quotesPerDay.map((day) => (
                        <div key={day.day} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
                          <div className="relative flex h-52 w-full items-end rounded-t-md bg-zinc-100">
                            <div
                              className="w-full rounded-t-md bg-taxi-500 transition-all group-hover:bg-zinc-950"
                              style={{ height: `${Math.max(5, (day.count / maxDailyQuotes) * 100)}%` }}
                              title={`${fmtDay(day.day)}: ${day.count} cotacoes`}
                            />
                          </div>
                          <span className="hidden text-[10px] font-bold text-zinc-400 sm:block">{fmtDay(day.day)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-5">
                  <SectionHeader title="Leitura rapida" eyebrow="Hoje" />
                  <div className="space-y-3">
                    <div className="rounded-lg bg-zinc-950 p-4 text-white">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Comparado com ontem</p>
                      <p className="mt-2 text-3xl font-black">{computed.todayDelta >= 0 ? '+' : ''}{computed.todayDelta}</p>
                      <p className="text-xs font-semibold text-zinc-400">cotacoes de diferenca</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard label="7 dias" value={overview.quotesLast7} tone="yellow" />
                      <MetricCard label="30 dias" value={overview.quotesLast30} tone="blue" />
                      <MetricCard label="Leads hoje" value={overview.leadsToday} tone="green" />
                      <MetricCard label="Cliques hoje" value={overview.partnerClicksToday} tone="green" />
                      <MetricCard label="Desafios hoje" value={overview.challengesToday} detail={`${overview.challengesTotal} total`} tone="yellow" />
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                <Card className="p-5 xl:col-span-2">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <SectionHeader title="Cotacoes" eyebrow="Operacao" />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setQuotesFilter('today'); setQuotesTablePage(1); }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${quotesFilter === 'today' ? 'bg-zinc-950 text-white' : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                      >
                        Hoje {quotesFilter === 'today' && quotesData ? `(${quotesData.total})` : `(${overview.quotesToday})`}
                      </button>
                      <button
                        onClick={() => { setQuotesFilter('all'); setQuotesTablePage(1); }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${quotesFilter === 'all' ? 'bg-zinc-950 text-white' : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                      >
                        Todas {quotesFilter === 'all' && quotesData ? `(${quotesData.total})` : `(${overview.totalQuotes})`}
                      </button>
                    </div>
                  </div>
                  {quotesLoading ? (
                    <p className="py-6 text-center text-sm font-bold text-zinc-400">Carregando...</p>
                  ) : (
                    <QuotesTable
                      rows={quotesRows}
                      onSelect={setAdminSelectedQuote}
                      page={quotesTablePage}
                      totalPages={quotesPageTotal}
                      onPageChange={(p) => setQuotesTablePage(p)}
                    />
                  )}
                </Card>
                <Card className="p-5">
                  <SectionHeader title="Alertas frequentes" eyebrow="Risco" />
                  {breakdowns.alertsFrequency.length === 0 ? (
                    <EmptyState>Nenhum alerta registrado.</EmptyState>
                  ) : (
                    breakdowns.alertsFrequency.slice(0, 8).map((item) => (
                      <BarRow key={item.type} label={ALERT_LABEL[item.type] || item.type} count={item.count} total={alertTotal} />
                    ))
                  )}
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Preco recomendado" value={money(quoteAverages.recommendedPrice)} tone="yellow" />
                <MetricCard label="Custo medio" value={money(quoteAverages.totalCost)} tone="red" />
                <MetricCard label="Lucro medio" value={money(quoteAverages.profit)} tone="green" />
                <MetricCard label="Margem media" value={quoteAverages.margin != null ? `${quoteAverages.margin.toFixed(1)}%` : '-'} tone="blue" />
                <MetricCard label="Distancia media" value={quoteAverages.distanceKm ? formatDistance(quoteAverages.distanceKm) : '-'} tone="blue" />
                <MetricCard label="Tempo medio" value={quoteAverages.estimatedMinutes ? formatDuration(quoteAverages.estimatedMinutes) : '-'} tone="blue" />
                <MetricCard label="Menor preco" value={money(quoteAverages.minRecommendedPrice)} />
                <MetricCard label="Maior preco" value={money(quoteAverages.maxRecommendedPrice)} />
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <Card className="p-5">
                  <SectionHeader title="Tipo de corrida" />
                  {breakdowns.tripType.map((item) => (
                    <BarRow key={item.tripType} label={TRIP_TYPE_LABEL[item.tripType] || item.tripType} count={item.count} total={overview.totalQuotes} detail={`${item.percent}%`} />
                  ))}
                </Card>
                <Card className="p-5">
                  <SectionHeader title="Combustivel usado" />
                  {breakdowns.fuelType.map((item) => (
                    <BarRow key={item.fuelType} label={FUEL_LABEL[item.fuelType] || item.fuelType} count={item.count} total={overview.totalQuotes} detail={`${item.percent}%`} />
                  ))}
                </Card>
                <Card className="p-5">
                  <SectionHeader title="Faixa de distancia" />
                  {breakdowns.distanceRanges.map((item) => (
                    <BarRow key={item.range} label={item.range} count={item.count} total={overview.totalQuotes} />
                  ))}
                </Card>
                <Card className="p-5">
                  <SectionHeader title="Faixa de preco" />
                  {breakdowns.priceRanges.map((item) => (
                    <BarRow key={item.range} label={item.range} count={item.count} total={overview.totalQuotes} />
                  ))}
                </Card>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <Card className="p-5">
                  <SectionHeader title="Origens mais frequentes" />
                  <TopList items={geography.topOrigins.map((item) => ({ label: item.origin, count: item.count }))} total={overview.totalQuotes} />
                </Card>
                <Card className="p-5">
                  <SectionHeader title="Destinos mais frequentes" />
                  <TopList items={geography.topDestinations.map((item) => ({ label: item.destination, count: item.count }))} total={overview.totalQuotes} />
                </Card>
              </div>

              <Card className="p-5">
                <SectionHeader title="Preco, custo e lucro por dia" eyebrow="Ultimos registros" />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-xs font-black uppercase tracking-[0.12em] text-zinc-400">
                        <th className="py-3 text-left">Dia</th>
                        <th className="py-3 text-right">Preco medio</th>
                        <th className="py-3 text-right">Custo medio</th>
                        <th className="py-3 text-right">Lucro medio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {recentPriceRows.map((item) => (
                        <tr key={item.day}>
                          <td className="py-3 font-bold text-zinc-600">{fmtDay(item.day)}</td>
                          <td className="py-3 text-right font-black text-emerald-700">{formatCurrencyBRL(item.avg_price)}</td>
                          <td className="py-3 text-right font-bold text-rose-600">{formatCurrencyBRL(item.avg_cost)}</td>
                          <td className="py-3 text-right font-bold text-sky-700">{formatCurrencyBRL(item.avg_profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'audience' && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard label="Sessoes totais" value={numberBR(overview.totalSessions)} tone="blue" />
                <MetricCard label="Sessoes hoje" value={numberBR(overview.sessionsToday)} tone="blue" />
                <MetricCard label="Cotacoes por sessao" value={`${computed.conversion.toFixed(1)}%`} tone="yellow" />
              </div>
              <Card className="p-5">
                <SectionHeader title="Sessoes recentes" />
                <p className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800">
                  Cada linha é uma sessão de navegador distinta. Se um mesmo usuário recarregar a página sem o cookie ativo, aparece como nova sessão — isso é esperado para visitantes anônimos.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-xs font-black uppercase tracking-[0.12em] text-zinc-400">
                        <th className="py-3 text-left">ID da sessão</th>
                        <th className="py-3 text-right">Cotações feitas</th>
                        <th className="py-3 text-left">Primeira visita</th>
                        <th className="py-3 text-left">Última atividade</th>
                        <th className="py-3 text-right">Duração</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {recentActivity.sessions.map((session) => {
                        const firstMs = new Date(session.createdAt).getTime();
                        const lastMs = new Date(session.lastSeen).getTime();
                        const diffMin = Math.round((lastMs - firstMs) / 60000);
                        const duration = diffMin < 1 ? '< 1 min' : diffMin < 60 ? `${diffMin} min` : `${(diffMin / 60).toFixed(1)} h`;
                        const hasQuotes = session._count.quotes > 0;
                        return (
                          <tr key={session.id}>
                            <td className="py-3 font-mono text-xs font-bold text-zinc-400">{session.sessionId.slice(0, 8)}…</td>
                            <td className="py-3 text-right">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-black ${hasQuotes ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400'}`}>
                                {session._count.quotes} {session._count.quotes === 1 ? 'cotação' : 'cotações'}
                              </span>
                            </td>
                            <td className="py-3 text-xs font-semibold text-zinc-500">{fmtDate(session.createdAt)}</td>
                            <td className="py-3 text-xs font-semibold text-zinc-500">{fmtDate(session.lastSeen)}</td>
                            <td className="py-3 text-right text-xs font-bold text-zinc-400">{duration}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'partners' && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <MetricCard label="Parceiros ativos" value={overview.totalPartners} tone="green" />
                <MetricCard label="Cliques totais" value={overview.totalPartnerClicks} tone="green" />
                <MetricCard label="Leads totais" value={overview.totalLeads} tone="yellow" />
                <MetricCard label="Conversao lead" value={`${computed.leadRate.toFixed(1)}%`} tone="blue" />
              </div>

              <Card className="p-5">
                <SectionHeader title="Cadastrar parceiro" eyebrow="Novo" />
                <form onSubmit={handleCreatePartner} className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Nome</span>
                      <input
                        required
                        value={partnerForm.name}
                        onChange={(event) => setPartnerForm((form) => ({ ...form, name: event.target.value }))}
                        className="rounded-lg border border-zinc-200 px-3 py-3 text-sm font-bold outline-none focus:border-zinc-950"
                        placeholder="Ex: Oficina Sao Jose"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Categoria</span>
                      <input
                        required
                        value={partnerForm.category}
                        onChange={(event) => setPartnerForm((form) => ({ ...form, category: event.target.value }))}
                        className="rounded-lg border border-zinc-200 px-3 py-3 text-sm font-bold outline-none focus:border-zinc-950"
                        placeholder="Ex: oficina, seguro, guincho"
                      />
                    </label>
                  </div>

                  <label className="grid gap-1">
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Descricao</span>
                    <textarea
                      value={partnerForm.description}
                      onChange={(event) => setPartnerForm((form) => ({ ...form, description: event.target.value }))}
                      className="min-h-[86px] rounded-lg border border-zinc-200 px-3 py-3 text-sm font-bold outline-none focus:border-zinc-950"
                      placeholder="Resumo curto que aparece para o motorista."
                    />
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Telefone</span>
                      <input
                        value={partnerForm.phone}
                        onChange={(event) => setPartnerForm((form) => ({ ...form, phone: event.target.value }))}
                        className="rounded-lg border border-zinc-200 px-3 py-3 text-sm font-bold outline-none focus:border-zinc-950"
                        placeholder="(11) 99999-9999"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">WhatsApp</span>
                      <input
                        value={partnerForm.whatsapp}
                        onChange={(event) => setPartnerForm((form) => ({ ...form, whatsapp: event.target.value }))}
                        className="rounded-lg border border-zinc-200 px-3 py-3 text-sm font-bold outline-none focus:border-zinc-950"
                        placeholder="(11) 99999-9999"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Cidade</span>
                      <input
                        value={partnerForm.city}
                        onChange={(event) => setPartnerForm((form) => ({ ...form, city: event.target.value }))}
                        className="rounded-lg border border-zinc-200 px-3 py-3 text-sm font-bold outline-none focus:border-zinc-950"
                        placeholder="Sao Paulo"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Site</span>
                      <input
                        type="url"
                        value={partnerForm.websiteUrl}
                        onChange={(event) => setPartnerForm((form) => ({ ...form, websiteUrl: event.target.value }))}
                        className="rounded-lg border border-zinc-200 px-3 py-3 text-sm font-bold outline-none focus:border-zinc-950"
                        placeholder="https://..."
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Link do Waze</span>
                      <input
                        type="url"
                        value={partnerForm.wazeUrl}
                        onChange={(event) => setPartnerForm((form) => ({ ...form, wazeUrl: event.target.value }))}
                        className="rounded-lg border border-zinc-200 px-3 py-3 text-sm font-bold outline-none focus:border-zinc-950"
                        placeholder="https://waze.com/ul?..."
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-zinc-400">Logo URL</span>
                      <input
                        type="url"
                        value={partnerForm.logoUrl}
                        onChange={(event) => setPartnerForm((form) => ({ ...form, logoUrl: event.target.value }))}
                        className="rounded-lg border border-zinc-200 px-3 py-3 text-sm font-bold outline-none focus:border-zinc-950"
                        placeholder="https://..."
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 rounded-lg bg-zinc-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 text-sm font-black text-zinc-700">
                        <input
                          type="checkbox"
                          checked={partnerForm.isActive}
                          onChange={(event) => setPartnerForm((form) => ({ ...form, isActive: event.target.checked }))}
                          className="h-4 w-4 accent-zinc-950"
                        />
                        Ativo
                      </label>
                      <label className="flex items-center gap-2 text-sm font-black text-zinc-700">
                        <input
                          type="checkbox"
                          checked={partnerForm.isPremium}
                          onChange={(event) => setPartnerForm((form) => ({ ...form, isPremium: event.target.checked }))}
                          className="h-4 w-4 accent-zinc-950"
                        />
                        Premium
                      </label>
                      <label className="flex items-center gap-2 text-sm font-black text-zinc-700">
                        Ordem
                        <input
                          type="number"
                          value={partnerForm.sortOrder}
                          onChange={(event) => setPartnerForm((form) => ({ ...form, sortOrder: event.target.value }))}
                          className="w-20 rounded-lg border border-zinc-200 px-2 py-2 text-sm font-bold outline-none focus:border-zinc-950"
                        />
                      </label>
                    </div>
                    <button
                      disabled={savingPartner}
                      className="rounded-lg bg-zinc-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingPartner ? 'Cadastrando...' : 'Cadastrar parceiro'}
                    </button>
                  </div>
                </form>
              </Card>

              <Card className="p-5">
                <SectionHeader title="Parceiros cadastrados" eyebrow={`${adminPartners.length} registros`} />
                {loadingPartners ? (
                  <EmptyState>Carregando parceiros...</EmptyState>
                ) : adminPartners.length === 0 ? (
                  <EmptyState>Nenhum parceiro cadastrado ainda.</EmptyState>
                ) : (
                  <div className="grid gap-3">
                    {adminPartners.map((partner) => (
                      <div key={partner.id} className="rounded-lg border border-zinc-200 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-black text-zinc-950">{partner.name}</p>
                              <span className={`rounded-full px-2 py-1 text-[11px] font-black ${partner.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                                {partner.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                              {partner.isPremium && <span className="rounded-full bg-taxi-50 px-2 py-1 text-[11px] font-black text-taxi-800">Premium</span>}
                            </div>
                            <p className="mt-1 text-sm font-bold text-zinc-500">
                              {partner.category}
                              {partner.city ? ` · ${partner.city}` : ''}
                            </p>
                            {partner.description && <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-zinc-600">{partner.description}</p>}
                            <div className="mt-3 grid gap-2 md:grid-cols-3">
                              <input value={partner.name} onChange={(event) => updatePartnerDraft(partner.id, { name: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="Nome" />
                              <input value={partner.category} onChange={(event) => updatePartnerDraft(partner.id, { category: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="Categoria" />
                              <input value={partner.city ?? ''} onChange={(event) => updatePartnerDraft(partner.id, { city: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="Cidade" />
                              <input value={partner.phone ?? ''} onChange={(event) => updatePartnerDraft(partner.id, { phone: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="Telefone" />
                              <input value={partner.whatsapp ?? ''} onChange={(event) => updatePartnerDraft(partner.id, { whatsapp: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="WhatsApp" />
                              <input type="number" value={partner.sortOrder} onChange={(event) => updatePartnerDraft(partner.id, { sortOrder: Number(event.target.value || 0) })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="Ordem" />
                              <input type="url" value={partner.websiteUrl ?? ''} onChange={(event) => updatePartnerDraft(partner.id, { websiteUrl: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="Site" />
                              <input type="url" value={partner.wazeUrl ?? ''} onChange={(event) => updatePartnerDraft(partner.id, { wazeUrl: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="Waze" />
                              <input type="url" value={partner.logoUrl ?? ''} onChange={(event) => updatePartnerDraft(partner.id, { logoUrl: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="Logo URL" />
                            </div>
                            <textarea value={partner.description ?? ''} onChange={(event) => updatePartnerDraft(partner.id, { description: event.target.value })} className="mt-2 min-h-[72px] w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="Descricao" />
                            <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-zinc-400">
                              <span>{partner._count.clicks} cliques</span>
                              <span>{partner._count.leads} leads</span>
                              <span>Oferta {partnerClickSourceCount(partner, 'partners_page_offer')}</span>
                              <span>Waze {partnerClickSourceCount(partner, 'partners_page_waze')}</span>
                              <span>WhatsApp {partnerClickSourceCount(partner, 'partners_page_whatsapp')}</span>
                              <span>Ligacao {partnerClickSourceCount(partner, 'partners_page_phone')}</span>
                              {partner.phone && <span>{partner.phone}</span>}
                              {partner.whatsapp && <span>WhatsApp {partner.whatsapp}</span>}
                              {partner.websiteUrl && (
                                <a className="text-sky-700" href={partner.websiteUrl} target="_blank" rel="noreferrer">
                                  Abrir site
                                </a>
                              )}
                              {partner.wazeUrl && (
                                <a className="text-sky-700" href={partner.wazeUrl} target="_blank" rel="noreferrer">
                                  Abrir Waze
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <button
                              onClick={() => updatePartner(partner.id, {
                                name: partner.name,
                                category: partner.category,
                                description: partner.description ?? '',
                                logoUrl: partner.logoUrl ?? '',
                                websiteUrl: partner.websiteUrl ?? '',
                                wazeUrl: partner.wazeUrl ?? '',
                                phone: partner.phone ?? '',
                                whatsapp: partner.whatsapp ?? '',
                                city: partner.city ?? '',
                                isActive: partner.isActive,
                                isPremium: partner.isPremium,
                                sortOrder: partner.sortOrder,
                              })}
                              className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-black text-white hover:bg-zinc-800"
                            >
                              Salvar dados
                            </button>
                            <button
                              onClick={() => updatePartner(partner.id, { isPremium: !partner.isPremium })}
                              className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700 hover:bg-zinc-50"
                            >
                              {partner.isPremium ? 'Remover premium' : 'Marcar premium'}
                            </button>
                            <button
                              onClick={() => updatePartner(partner.id, { isActive: !partner.isActive })}
                              className={`rounded-lg px-3 py-2 text-xs font-black ${
                                partner.isActive ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {partner.isActive ? 'Desativar' : 'Ativar'}
                            </button>
                          </div>
                        </div>
                        <div className="mt-4 rounded-lg bg-zinc-50 p-3">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-black text-zinc-800">Unidades</p>
                            <span className="text-xs font-bold text-zinc-400">{partner.locations.length} cadastradas</span>
                          </div>
                          {partner.locations.length > 0 && (
                            <div className="mb-3 grid gap-2">
                              {partner.locations.map((location) => (
                                <div key={location.id} className="rounded-lg border border-zinc-200 bg-white p-3">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-black text-zinc-900">{location.name}</p>
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-black ${location.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                                          {location.isActive ? 'Ativa' : 'Inativa'}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-xs font-semibold text-zinc-500">
                                        {[location.address, location.city].filter(Boolean).join(' · ') || 'Sem endereco'}
                                      </p>
                                      <div className="mt-2 grid gap-2 md:grid-cols-3">
                                        <input value={location.name} onChange={(event) => updatePartnerLocationDraft(partner.id, location.id, { name: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="Nome da unidade" />
                                        <input value={location.address ?? ''} onChange={(event) => updatePartnerLocationDraft(partner.id, location.id, { address: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="Endereco" />
                                        <input value={location.city ?? ''} onChange={(event) => updatePartnerLocationDraft(partner.id, location.id, { city: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="Cidade" />
                                        <input value={location.phone ?? ''} onChange={(event) => updatePartnerLocationDraft(partner.id, location.id, { phone: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="Telefone" />
                                        <input value={location.whatsapp ?? ''} onChange={(event) => updatePartnerLocationDraft(partner.id, location.id, { whatsapp: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="WhatsApp" />
                                        <label className="grid gap-1">
                                          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">Ordem da unidade</span>
                                          <input type="number" value={location.sortOrder} onChange={(event) => updatePartnerLocationDraft(partner.id, location.id, { sortOrder: Number(event.target.value || 0) })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950" placeholder="0" />
                                        </label>
                                        <input type="url" value={location.wazeUrl ?? ''} onChange={(event) => updatePartnerLocationDraft(partner.id, location.id, { wazeUrl: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950 md:col-span-3" placeholder="Link do Waze" />
                                      </div>
                                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-bold text-zinc-400">
                                        <span>{location._count.clicks} cliques</span>
                                        <span>Waze {locationClickSourceCount(location, 'partners_page_waze')}</span>
                                        <span>WhatsApp {locationClickSourceCount(location, 'partners_page_whatsapp')}</span>
                                        <span>Ligacao {locationClickSourceCount(location, 'partners_page_phone')}</span>
                                        {location.phone && <span>{location.phone}</span>}
                                        {location.whatsapp && <span>WhatsApp {location.whatsapp}</span>}
                                        {location.wazeUrl && <a className="text-sky-700" href={location.wazeUrl} target="_blank" rel="noreferrer">Abrir Waze</a>}
                                      </div>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap gap-2">
                                      <button
                                        onClick={() => updatePartnerLocation(location.id, {
                                          name: location.name,
                                          address: location.address ?? '',
                                          city: location.city ?? '',
                                          phone: location.phone ?? '',
                                          whatsapp: location.whatsapp ?? '',
                                          wazeUrl: location.wazeUrl ?? '',
                                          isActive: location.isActive,
                                          sortOrder: location.sortOrder,
                                        })}
                                        className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-black text-white hover:bg-zinc-800"
                                      >
                                        Salvar unidade
                                      </button>
                                      <button
                                        onClick={() => updatePartnerLocation(location.id, { isActive: !location.isActive })}
                                        className={`rounded-lg px-3 py-2 text-xs font-black ${
                                          location.isActive ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                        }`}
                                      >
                                        {location.isActive ? 'Desativar' : 'Ativar'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <form onSubmit={(event) => handleCreatePartnerLocation(event, partner.id)} className="grid gap-2">
                            <div className="grid gap-2 md:grid-cols-3">
                              <input
                                required
                                value={(locationForms[partner.id] || EMPTY_LOCATION_FORM).name}
                                onChange={(event) => setLocationForms((forms) => ({ ...forms, [partner.id]: { ...(forms[partner.id] || EMPTY_LOCATION_FORM), name: event.target.value } }))}
                                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950"
                                placeholder="Nome da unidade"
                              />
                              <input
                                value={(locationForms[partner.id] || EMPTY_LOCATION_FORM).address}
                                onChange={(event) => setLocationForms((forms) => ({ ...forms, [partner.id]: { ...(forms[partner.id] || EMPTY_LOCATION_FORM), address: event.target.value } }))}
                                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950"
                                placeholder="Endereco"
                              />
                              <input
                                value={(locationForms[partner.id] || EMPTY_LOCATION_FORM).city}
                                onChange={(event) => setLocationForms((forms) => ({ ...forms, [partner.id]: { ...(forms[partner.id] || EMPTY_LOCATION_FORM), city: event.target.value } }))}
                                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950"
                                placeholder="Cidade"
                              />
                              <input
                                value={(locationForms[partner.id] || EMPTY_LOCATION_FORM).phone}
                                onChange={(event) => setLocationForms((forms) => ({ ...forms, [partner.id]: { ...(forms[partner.id] || EMPTY_LOCATION_FORM), phone: event.target.value } }))}
                                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950"
                                placeholder="Telefone"
                              />
                              <input
                                value={(locationForms[partner.id] || EMPTY_LOCATION_FORM).whatsapp}
                                onChange={(event) => setLocationForms((forms) => ({ ...forms, [partner.id]: { ...(forms[partner.id] || EMPTY_LOCATION_FORM), whatsapp: event.target.value } }))}
                                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950"
                                placeholder="WhatsApp"
                              />
                              <input
                                type="url"
                                value={(locationForms[partner.id] || EMPTY_LOCATION_FORM).wazeUrl}
                                onChange={(event) => setLocationForms((forms) => ({ ...forms, [partner.id]: { ...(forms[partner.id] || EMPTY_LOCATION_FORM), wazeUrl: event.target.value } }))}
                                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold outline-none focus:border-zinc-950"
                                placeholder="Link do Waze"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <label className="flex items-center gap-2 text-xs font-black text-zinc-600">
                                Ordem da unidade
                                <input
                                  type="number"
                                  value={(locationForms[partner.id] || EMPTY_LOCATION_FORM).sortOrder}
                                  onChange={(event) => setLocationForms((forms) => ({ ...forms, [partner.id]: { ...(forms[partner.id] || EMPTY_LOCATION_FORM), sortOrder: event.target.value } }))}
                                  className="w-20 rounded-lg border border-zinc-200 px-2 py-2 text-xs font-bold outline-none focus:border-zinc-950"
                                />
                              </label>
                              <button
                                disabled={savingLocationFor === partner.id}
                                className="rounded-lg bg-zinc-950 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {savingLocationFor === partner.id ? 'Salvando...' : 'Adicionar unidade'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
                <Card className="p-5">
                  <SectionHeader title="Parceiros mais clicados" />
                  <TopList items={partners.topPartners.map((item) => ({ label: item.name || '-', sub: item.category || '-', count: item.clicks }))} total={Math.max(1, overview.totalPartnerClicks)} />
                </Card>
                <Card className="p-5">
                  <SectionHeader title="Leads recentes" />
                  {partners.recentLeads.length === 0 ? (
                    <EmptyState>Nenhum lead registrado ainda.</EmptyState>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 text-xs font-black uppercase tracking-[0.12em] text-zinc-400">
                            <th className="py-3 text-left">Nome</th>
                            <th className="py-3 text-left">WhatsApp</th>
                            <th className="py-3 text-left">Parceiro</th>
                            <th className="py-3 text-left">Data</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {partners.recentLeads.map((lead) => (
                            <tr key={lead.id}>
                              <td className="py-3 font-black text-zinc-800">{lead.name}</td>
                              <td className="py-3 font-bold text-sky-700">
                                <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                                  {lead.phone}
                                </a>
                              </td>
                              <td className="py-3 font-semibold text-zinc-500">{lead.partner?.name || '-'}</td>
                              <td className="py-3 font-semibold text-zinc-500">{fmtDate(lead.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard label="Total de feedbacks" value={overview.totalFeedback} tone="yellow" />
                <MetricCard label="Nota media" value={overview.avgRating != null ? `${overview.avgRating}/5` : '-'} tone="green" />
              </div>
              <div className="grid gap-3">
                {recentActivity.feedback.length === 0 ? (
                  <Card className="p-5">
                    <EmptyState>Nenhum feedback registrado ainda.</EmptyState>
                  </Card>
                ) : (
                  recentActivity.feedback.map((item) => (
                    <Card key={item.id} className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-black text-zinc-950">Nota {item.rating}/5</p>
                          {item.category && <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-400">{item.category}</p>}
                        </div>
                        <p className="text-xs font-bold text-zinc-400">{fmtDate(item.createdAt)}</p>
                      </div>
                      {item.message && <p className="mt-3 text-sm font-semibold leading-6 text-zinc-600">{item.message}</p>}
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-5">
              <Card className="p-5">
                <SectionHeader title="Controles do aplicativo" eyebrow="Backend existente" />
                <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-zinc-950">Mostrar passo a passo da rota</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-500">Liga ou desliga a exibicao de instrucoes detalhadas da rota quando disponivel.</p>
                  </div>
                  <button
                    disabled={!flags || savingFlag}
                    onClick={() => flags && updateRouteSteps(!flags.showRouteSteps)}
                    className={`w-full rounded-lg px-4 py-3 text-sm font-black sm:w-auto ${
                      flags?.showRouteSteps ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-600'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {savingFlag ? 'Salvando...' : flags?.showRouteSteps ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              </Card>

              <Card className="p-5">
                <SectionHeader title="Resumo tecnico visivel" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Modo automatico" value={breakdowns.routeMode.find((item) => item.routeMode === 'automatic')?.count ?? 0} tone="blue" />
                  <MetricCard label="Modo manual" value={breakdowns.routeMode.find((item) => item.routeMode === 'manual')?.count ?? 0} tone="yellow" />
                  <MetricCard label="Alertas gerados" value={alertTotal} tone={alertTotal > 0 ? 'red' : 'green'} />
                </div>
              </Card>
            </div>
          )}
        </section>
      </div>
      {adminSelectedQuote && (
        <AdminQuoteModal quote={adminSelectedQuote} onClose={() => setAdminSelectedQuote(null)} />
      )}
    </main>
  );
}

function AdminQuoteModal({ quote, onClose }: { quote: AdminStats['recentActivity']['quotes'][0]; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(17,24,39,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 18, boxShadow: '0 24px 80px rgba(0,0,0,.28)', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0ef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{fmtDate(quote.createdAt)}</p>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#09090b', marginTop: 2 }}>
              {quote.originAddress || '—'} → {quote.destinationAddress || '—'}
            </h2>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: 0, background: '#f4f4f5', fontSize: 18, fontWeight: 900, cursor: 'pointer', color: '#52525b' }}>×</button>
        </div>
        <div style={{ padding: '16px 20px', display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { lab: 'Preço', val: formatCurrencyBRL(quote.recommendedPrice), color: '#047857' },
              { lab: 'Custo', val: formatCurrencyBRL(quote.totalCost), color: '#be123c' },
              { lab: 'Lucro', val: formatCurrencyBRL(quote.profit), color: quote.profit >= 0 ? '#0369a1' : '#be123c' },
            ].map((item) => (
              <div key={item.lab} style={{ background: '#f9f9f8', borderRadius: 12, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.lab}</p>
                <p style={{ fontSize: 16, fontWeight: 900, color: item.color, marginTop: 3 }}>{item.val}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
            {[
              { lab: 'Distância', val: formatDistance(quote.distanceKm) },
              { lab: 'Margem', val: `${quote.margin.toFixed(1)}%` },
              { lab: 'Tipo', val: TRIP_TYPE_LABEL[quote.tripType] || quote.tripType },
              { lab: 'Combustível', val: FUEL_LABEL[quote.fuelType] || quote.fuelType },
              { lab: 'Modo de rota', val: quote.routeMode === 'automatic' ? 'Automático' : 'Manual' },
            ].map((item) => (
              <div key={item.lab} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f4f4f5' }}>
                <span style={{ color: '#71717a', fontWeight: 700 }}>{item.lab}</span>
                <span style={{ fontWeight: 800, color: '#09090b' }}>{item.val}</span>
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
  onSelect?: (quote: AdminStats['recentActivity']['quotes'][0]) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (p: number) => void;
}) {
  if (!rows.length) return <EmptyState>Nenhuma cotacao registrada ainda.</EmptyState>;
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs font-black uppercase tracking-[0.12em] text-zinc-400">
              <th className="py-3 text-left">Data</th>
              <th className="py-3 text-left">Rota</th>
              <th className="py-3 text-right">Distancia</th>
              <th className="py-3 text-right">Preco</th>
              <th className="py-3 text-right">Custo</th>
              <th className="py-3 text-right">Lucro</th>
              <th className="py-3 text-right">Margem</th>
              <th className="py-3 text-left">Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((quote) => (
              <tr
                key={quote.id}
                className="align-top cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => onSelect?.(quote)}
              >
                <td className="whitespace-nowrap py-3 pr-4 text-xs font-bold text-zinc-400">{fmtDate(quote.createdAt)}</td>
                <td className="max-w-[260px] py-3 pr-4">
                  <p className="truncate font-bold text-zinc-800">{quote.originAddress || '-'}</p>
                  <p className="truncate text-xs font-semibold text-zinc-400">para {quote.destinationAddress || '-'}</p>
                </td>
                <td className="whitespace-nowrap py-3 text-right font-bold text-zinc-600">{formatDistance(quote.distanceKm)}</td>
                <td className="whitespace-nowrap py-3 text-right font-black text-emerald-700">{formatCurrencyBRL(quote.recommendedPrice)}</td>
                <td className="whitespace-nowrap py-3 text-right font-bold text-rose-600">{formatCurrencyBRL(quote.totalCost)}</td>
                <td className="whitespace-nowrap py-3 text-right font-bold text-sky-700">{formatCurrencyBRL(quote.profit)}</td>
                <td className="whitespace-nowrap py-3 text-right font-bold text-zinc-700">{quote.margin.toFixed(1)}%</td>
                <td className="whitespace-nowrap py-3 pl-4 font-semibold text-zinc-500">{TRIP_TYPE_LABEL[quote.tripType] || quote.tripType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages && totalPages > 1 && onPageChange && page && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-xs font-bold text-zinc-400">{page} / {totalPages}</span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
