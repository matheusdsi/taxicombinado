import type { RouteRequest, RouteResult } from './maps/types';

interface CacheEntry {
  expiresAt: number;
  result: RouteResult;
}

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 500;

const cache = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<RouteResult>>();

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getTtlMs(): number {
  return readPositiveIntEnv('ROUTE_CACHE_TTL_SECONDS', DEFAULT_TTL_MS / 1000) * 1000;
}

function getMaxEntries(): number {
  return readPositiveIntEnv('ROUTE_CACHE_MAX_ENTRIES', DEFAULT_MAX_ENTRIES);
}

function normalizeLocation(location: RouteRequest['origin']): string {
  if (typeof location === 'string') {
    return location.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
  }

  return `${location.lat.toFixed(6)},${location.lng.toFixed(6)}`;
}

function cloneResult(result: RouteResult): RouteResult {
  return {
    ...result,
    steps: result.steps?.map((step) => ({ ...step })),
  };
}

function pruneCache(now: number): void {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }

  const maxEntries = getMaxEntries();
  while (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
}

export function createRouteCacheKey(providerName: string, request: RouteRequest): string {
  const waypoints = request.waypoints?.map(normalizeLocation) ?? [];

  return JSON.stringify({
    provider: providerName,
    origin: normalizeLocation(request.origin),
    destination: normalizeLocation(request.destination),
    waypoints,
  });
}

export async function getCachedRoute(
  key: string,
  calculate: () => Promise<RouteResult>
): Promise<{ result: RouteResult; cacheStatus: 'hit' | 'miss' | 'pending' }> {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && cached.expiresAt > now) {
    return { result: cloneResult(cached.result), cacheStatus: 'hit' };
  }

  if (cached) cache.delete(key);

  const pendingResult = pending.get(key);
  if (pendingResult) {
    const result = await pendingResult;
    return { result: cloneResult(result), cacheStatus: 'pending' };
  }

  const calculation = calculate();
  pending.set(key, calculation);

  try {
    const result = await calculation;
    pruneCache(now);
    cache.set(key, { result: cloneResult(result), expiresAt: Date.now() + getTtlMs() });
    return { result: cloneResult(result), cacheStatus: 'miss' };
  } finally {
    pending.delete(key);
  }
}
