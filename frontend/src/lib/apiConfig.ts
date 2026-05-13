const LOCAL_API_URL = 'http://localhost:3001';

function normalizeApiUrl(value: string | undefined) {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

export const API_URL =
  normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL) ||
  (process.env.NODE_ENV === 'development' ? LOCAL_API_URL : '');

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}
