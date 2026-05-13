const KEY = 'pct_local_quotes';
const MAX = 50;

export interface LocalQuote {
  id: string;
  createdAt: string;
  originAddress?: string;
  destinationAddress?: string;
  distanceKm: number;
  tripType: string;
  totalCost: number;
  recommendedPrice: number;
  profit: number;
  margin: number;
  synced?: boolean;
}

export function getLocalQuotes(): LocalQuote[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalQuote(quote: LocalQuote): void {
  try {
    const existing = getLocalQuotes();
    // avoid duplicates by id
    const filtered = existing.filter((q) => q.id !== quote.id);
    const updated = [quote, ...filtered].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function markLocalQuotesSynced(): void {
  try {
    const existing = getLocalQuotes();
    const updated = existing.map((q) => ({ ...q, synced: true }));
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export function clearLocalQuotes(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function getUnsyncedLocalQuotes(): LocalQuote[] {
  return getLocalQuotes().filter((q) => !q.synced);
}
