import axios from 'axios';
import { API_URL } from './apiConfig';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 500) {
      console.error('Erro interno do servidor:', error.response.data);
    }
    // 401 é esperado quando não há sessão — não loga no console
    return Promise.reject(error);
  }
);

// ─── API Functions ────────────────────────────────────────────

export interface CalculateQuotePayload {
  originAddress?: string;
  destinationAddress?: string;
  tripType: 'one_way' | 'round_trip' | 'empty_return';
  routeMode: 'manual' | 'automatic';
  distanceKm: number;
  returnDistanceKm?: number;
  totalDistanceKm?: number;
  estimatedMinutes: number;
  stops?: string[];
  consumptionKmPerLiter: number;
  fuelPricePerLiter: number;
  fuelType: string;
  vehicleExtraCostPerKm: number;
  baseFare: number;
  pricePerKm: number;
  waitingPrice: number;
  waitingChargeType: 'per_minute' | 'per_hour';
  flagMultiplier: number;
  tollOutbound: number;
  tollReturn: number;
  parkingCost: number;
  extraCosts: number;
  desiredMarginPercent: number;
  driverMinimumValue: number;
  customChargedPrice?: number;
}

export interface Alert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface QuoteResult {
  distanceKm: number;
  returnDistanceKm: number;
  totalDistanceKm: number;
  estimatedMinutes: number;
  tripType: string;
  fuelCost: number;
  vehicleExtraCost: number;
  tollTotal: number;
  parkingCost: number;
  extraCosts: number;
  totalCost: number;
  timeCharge: number;
  farePrice: number;
  minimumPrice: number;
  priceWithMargin: number;
  recommendedPrice: number;
  idealPrice: number;
  customChargedPrice?: number;
  profit: number;
  margin: number;
  alerts: Alert[];
}

export async function calculateQuote(payload: CalculateQuotePayload): Promise<{
  quoteId: string;
  result: QuoteResult;
}> {
  const res = await api.post('/api/quote/calculate', payload);
  return res.data.data;
}

export async function syncLocalQuotes(quotes: import('./localQuotes').LocalQuote[]): Promise<void> {
  if (!quotes.length) return;
  try {
    await api.post('/api/quotes/sync', { quotes });
  } catch {
    // silently ignore — sync is best-effort
  }
}

export interface RouteStep {
  instruction: string;
  distanceKm: number;
  durationMinutes: number;
}

export async function calculateRoute(origin: string, destination: string): Promise<{
  distanceKm: number | null;
  durationMinutes: number | null;
  provider: string;
  steps: RouteStep[];
}> {
  const res = await api.post('/api/route/calculate', { origin, destination });
  return res.data.data;
}

export async function getQuoteHistory(params?: { limit?: number; page?: number }): Promise<{
  quotes: Array<{
    id: string;
    createdAt: string;
    recommendedPrice: number;
    farePrice?: number;
    minimumPrice?: number;
    idealPrice?: number;
    originAddress?: string;
    destinationAddress?: string;
    distanceKm: number;
    returnDistanceKm?: number;
    totalDistanceKm?: number;
    estimatedMinutes?: number;
    tripType: string;
    totalCost: number;
    fuelCost?: number;
    vehicleExtraCost?: number;
    tollTotal?: number;
    parkingCost?: number;
    extraCosts?: number;
    timeCharge?: number;
    desiredMarginPercent?: number;
    customChargedPrice?: number;
    fuelPricePerLiter?: number;
    consumptionKmPerLiter?: number;
    profit: number;
    margin: number;
    alerts?: Array<{ message: string; severity: string }>;
  }>;
  total: number;
  page: number;
  totalPages: number;
}> {
  const res = await api.get('/api/quotes/history', { params });
  return res.data.data;
}

export async function getQuote(id: string) {
  const res = await api.get(`/api/quotes/${id}`);
  return res.data.data;
}

export interface Partner {
  id: string;
  name: string;
  category: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  wazeUrl?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  isPremium: boolean;
  sortOrder: number;
  locations?: PartnerLocation[];
  _count?: { clicks: number };
}

export interface PartnerLocation {
  id: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  whatsapp?: string;
  wazeUrl?: string;
  sortOrder: number;
}

export async function getPartners(category?: string): Promise<Partner[]> {
  const res = await api.get('/api/partners', { params: category ? { category } : undefined });
  return res.data.data;
}

export async function trackPartnerClick(partnerId: string, source?: string, partnerLocationId?: string) {
  try {
    await api.post('/api/partners/click', { partnerId, source, partnerLocationId });
  } catch {
    // Silently fail - analytics tracking shouldn't break UX
  }
}

export async function submitPartnerLead(data: {
  partnerId: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
}) {
  const res = await api.post('/api/partners/leads', data);
  return res.data;
}

export async function submitBecomePartner(data: {
  companyName: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  message?: string;
}) {
  const res = await api.post('/api/anuncie', data);
  return res.data;
}

export async function submitFeedback(data: {
  rating: number;
  category?: string;
  message?: string;
  page?: string;
}) {
  const res = await api.post('/api/feedback', data);
  return res.data;
}

export async function submitContactMessage(data: {
  name: string;
  message: string;
  type?: 'suggestion' | 'complaint';
}) {
  const label = data.type === 'complaint' ? 'Reclamação' : 'Sugestão';

  return submitFeedback({
    rating: 5,
    category: `contact_${data.type ?? 'suggestion'}`,
    page: '/contato',
    message: `Tipo: ${label}\nNome: ${data.name}\nMensagem: ${data.message}`,
  });
}

export interface DriverAccountData {
  user: { id: string; name: string | null; email: string; phone?: string | null; createdAt: string } | null;
  profile: Record<string, unknown> | null;
  vehicle: Record<string, unknown> | null;
  costs: Record<string, unknown> | null;
  maintenanceLogs: Array<Record<string, unknown>>;
  fuelLogs: Array<Record<string, unknown>>;
  summary: {
    monthlyCosts: number;
    monthlyTarget: number;
    dailyTarget: number | null;
    hourlyTarget: number | null;
    costPerKm: number | null;
    targetPerKm: number | null;
  };
}

export async function getDriverAccount(): Promise<DriverAccountData> {
  const res = await api.get('/api/account');
  return res.data.data;
}

export async function updateDriverAccount(data: {
  profile?: Record<string, unknown>;
  vehicle?: Record<string, unknown>;
  costs?: Record<string, unknown>;
}): Promise<DriverAccountData> {
  const res = await api.put('/api/account', data);
  return res.data.data;
}

export async function createMaintenanceLog(data: Record<string, unknown>) {
  const res = await api.post('/api/account/maintenance', data);
  return res.data.data;
}

export async function createFuelLog(data: Record<string, unknown>) {
  const res = await api.post('/api/account/fuel-logs', data);
  return res.data.data;
}
