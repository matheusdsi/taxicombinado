const CACHE_VERSION = 'taxi-combinado-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

const OFFLINE_URL = '/offline';
const PRECACHE_URLS = ['/', OFFLINE_URL, '/manifest.json'];
const API_OR_DYNAMIC_PATTERNS = [
  /^\/api\//,
  /^\/health$/,
  /^\/historico/,
  /^\/parceiros/,
  /^\/minha-conta/,
  /^\/agendar/,
  /^\/entrar/,
  /^\/cadastro/,
  /^\/admin/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, PAGE_CACHE].includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (API_OR_DYNAMIC_PATTERNS.some((pattern) => pattern.test(url.pathname))) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/apple-touch-icon.png' ||
    /\.(?:png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf|otf|css|js)$/.test(url.pathname)
  );
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match(OFFLINE_URL);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}
