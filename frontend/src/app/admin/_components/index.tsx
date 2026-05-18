'use client';

import React from 'react';

// ─── PageHeader ────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[22px] font-bold text-[#0F1623] leading-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// ─── KpiCard ───────────────────────────────────────────────────
export function KpiCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  color = 'default',
  sub,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'default' | 'yellow' | 'green' | 'blue' | 'red' | 'purple';
  sub?: string;
}) {
  const iconBg = {
    default: 'bg-gray-100 text-gray-500',
    yellow: 'bg-[#FFF8DC] text-[#C89000]',
    green: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-500',
    purple: 'bg-purple-50 text-purple-600',
  }[color];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">{label}</p>
          <p className="mt-1.5 text-[26px] font-bold text-[#0F1623] leading-none tabular-nums">{value}</p>
          {trend != null && (
            <p className={`mt-2 text-[12px] font-semibold flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend >= 0 ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="18 15 12 9 6 15"/></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="6 9 12 15 18 9"/></svg>
              )}
              {trend >= 0 ? '+' : ''}{typeof trend === 'number' && Number.isFinite(trend) ? (trend % 1 === 0 ? trend : trend.toFixed(1)) : 0}%
              {trendLabel && <span className="text-gray-400 font-normal">{trendLabel}</span>}
            </p>
          )}
          {sub && !trend && <p className="mt-2 text-[12px] text-gray-400">{sub}</p>}
        </div>
        {icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────
export function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  noPad,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  noPad?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      {(title || action) && (
        <div className={`flex items-center justify-between gap-3 ${noPad ? 'px-5 pt-5' : 'px-5 pt-5'}`}>
          <div>
            {title && <h3 className="text-[14px] font-bold text-[#0F1623]">{title}</h3>}
            {subtitle && <p className="text-[12px] text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPad ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

// ─── StatusBadge ───────────────────────────────────────────────
export function StatusBadge({
  status,
}: {
  status: 'pendente' | 'aceito' | 'realizado' | 'cancelado' | 'ativo' | 'inativo' | 'novo' | 'em_analise' | 'resolvido' | 'descartado' | string;
}) {
  const cfg: Record<string, { label: string; cls: string }> = {
    pendente:   { label: 'Pendente',   cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    aceito:     { label: 'Aceito',     cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
    realizado:  { label: 'Realizado',  cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    pago:       { label: 'Pago',       cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    cancelado:  { label: 'Cancelado',  cls: 'bg-red-50 text-red-600 ring-red-200' },
    ativo:      { label: 'Ativo',      cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    inativo:    { label: 'Inativo',    cls: 'bg-gray-100 text-gray-500 ring-gray-200' },
    novo:       { label: 'Novo',       cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
    em_analise: { label: 'Em análise', cls: 'bg-purple-50 text-purple-700 ring-purple-200' },
    resolvido:  { label: 'Resolvido',  cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    descartado: { label: 'Descartado', cls: 'bg-gray-100 text-gray-500 ring-gray-200' },
  };
  const c = cfg[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500 ring-gray-200' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${c.cls}`}>
      {c.label}
    </span>
  );
}

// ─── CategoryBadge ─────────────────────────────────────────────
export function CategoryBadge({ category }: { category: string }) {
  const cfg: Record<string, string> = {
    comum:     'bg-gray-100 text-gray-600',
    luxo:      'bg-purple-50 text-purple-700',
    executivo: 'bg-blue-50 text-blue-700',
  };
  const label = { comum: 'Comum', luxo: 'Luxo', executivo: 'Executivo' }[category] ?? category;
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${cfg[category] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

// ─── FlagBadge ─────────────────────────────────────────────────
export function FlagBadge({ flag }: { flag: 1 | 2 | number }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${flag === 2 ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
      Band. {flag}
    </span>
  );
}

// ─── TripTypeBadge ─────────────────────────────────────────────
export function TripTypeBadge({ type }: { type: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    one_way:      { label: 'Só ida',      cls: 'bg-sky-50 text-sky-700' },
    round_trip:   { label: 'Ida e volta', cls: 'bg-indigo-50 text-indigo-700' },
    empty_return: { label: 'Volta vazia', cls: 'bg-amber-50 text-amber-700' },
  };
  const c = cfg[type] ?? { label: type, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${c.cls}`}>
      {c.label}
    </span>
  );
}

// ─── EmptyState ────────────────────────────────────────────────
export function EmptyState({ icon, title, description }: { icon?: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-gray-300">{icon}</div>}
      <p className="text-[14px] font-semibold text-gray-400">{title}</p>
      {description && <p className="mt-1 text-[12px] text-gray-300 max-w-xs">{description}</p>}
    </div>
  );
}

// ─── LoadingState ──────────────────────────────────────────────
export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#F5B800]" />
        <p className="text-[13px] font-medium text-gray-400">{label}</p>
      </div>
    </div>
  );
}

// ─── Btn ───────────────────────────────────────────────────────
export function Btn({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}) {
  const v = {
    primary:   'bg-[#F5B800] text-[#0F1623] hover:bg-[#E0A900] shadow-sm shadow-[#F5B800]/30',
    secondary: 'bg-[#0F1623] text-white hover:bg-[#1a2535]',
    ghost:     'border border-gray-200 text-gray-600 hover:bg-gray-50',
    danger:    'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200',
    success:   'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200',
  }[variant];
  const s = { sm: 'px-3 py-1.5 text-[12px]', md: 'px-4 py-2 text-[13px]', lg: 'px-5 py-2.5 text-[14px]' }[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${v} ${s} ${className}`}
    >
      {children}
    </button>
  );
}

// ─── FilterBar ─────────────────────────────────────────────────
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm mb-5">
      {children}
    </div>
  );
}

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
        active
          ? 'bg-[#F5B800] text-[#0F1623]'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Table primitives ──────────────────────────────────────────
export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-[13px]">{children}</table>
    </div>
  );
}

export function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-100 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3.5 text-[13px] text-[#0F1623] border-b border-gray-50 ${className}`}>
      {children}
    </td>
  );
}

export function Tr({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${onClick ? 'cursor-pointer hover:bg-[#FFFBEA]' : 'hover:bg-gray-50/60'} ${className}`}
    >
      {children}
    </tr>
  );
}

// ─── Pagination ────────────────────────────────────────────────
export function Pagination({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-sm"
      >
        ←
      </button>
      {Array.from({ length: Math.min(total, 7) }, (_, i) => {
        const p = total <= 7 ? i + 1 : page <= 4 ? i + 1 : page + i - 3;
        if (p < 1 || p > total) return null;
        return (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-semibold transition-all ${
              p === page ? 'bg-[#F5B800] text-[#0F1623]' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        );
      })}
      <button
        onClick={() => onPage(Math.min(total, page + 1))}
        disabled={page === total}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-sm"
      >
        →
      </button>
    </div>
  );
}

// ─── SimpleBar chart (SVG) ─────────────────────────────────────
export function MiniBarChart({
  data,
  color = '#F5B800',
  height = 80,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  if (!data.length) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 ${data.length * 24} ${height}`} className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const barH = Math.max(2, (d.value / max) * (height - 16));
        return (
          <g key={i}>
            <rect
              x={i * 24 + 2}
              y={height - barH - 8}
              width={20}
              height={barH}
              rx={3}
              fill={color}
              fillOpacity={0.85}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─── MiniLineChart (SVG) ───────────────────────────────────────
export function MiniLineChart({
  data,
  color = '#F5B800',
  height = 60,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(1, ...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - 8 - ((v - min) / range) * (height - 16)}`)
    .join(' ');
  const area = `0,${height} ${points} ${w},${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#lg)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── SearchInput ───────────────────────────────────────────────
export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2 text-[13px] placeholder-gray-400 outline-none focus:border-[#F5B800] focus:bg-white transition-all"
      />
    </div>
  );
}

// ─── Select ────────────────────────────────────────────────────
export function Select({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-[#F5B800] transition-all cursor-pointer ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Modal ─────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 z-10">
          <h2 className="text-[16px] font-bold text-[#0F1623]">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Stat row for modals ───────────────────────────────────────
export function StatRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 ${highlight ? 'text-[#0F1623] font-bold' : ''}`}>
      <span className="text-[12px] text-gray-500">{label}</span>
      <span className={`text-[13px] font-semibold ${highlight ? 'text-[#0F1623]' : 'text-[#0F1623]'}`}>{value ?? '—'}</span>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────
export function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
export function fmtDateShort(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
export function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
export function money(v: number | null | undefined) {
  if (v == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}
export function num(v: number | null | undefined) {
  return v == null ? '—' : v.toLocaleString('pt-BR');
}
