import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

export async function getQuoteHistory(params?: { limit?: number; page?: number }): Promise<{
  quotes: Array<{ id: string; createdAt: string; recommendedPrice: number; originAddress?: string; destinationAddress?: string; distanceKm: number; tripType: string; totalCost: number; profit: number; margin: number }>;
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
  phone?: string;
  city?: string;
  isPremium: boolean;
  _count?: { clicks: number };
}

export async function getPartners(category?: string): Promise<Partner[]> {
  const res = await api.get('/api/partners', { params: category ? { category } : undefined });
  return res.data.data;
}

export async function trackPartnerClick(partnerId: string, source?: string) {
  try {
    await api.post('/api/partners/click', { partnerId, source });
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
