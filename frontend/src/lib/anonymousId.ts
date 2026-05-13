'use client';

const COOKIE_NAME = 'pct_anonymous_id';
const COOKIE_MAX_AGE_DAYS = 365;

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getOrCreateAnonymousId(): string {
  const existing = getCookie(COOKIE_NAME);
  if (existing && uuidRegex.test(existing)) {
    // Refresh expiry
    setCookie(COOKIE_NAME, existing, COOKIE_MAX_AGE_DAYS);
    return existing;
  }

  const newId = generateUUID();
  setCookie(COOKIE_NAME, newId, COOKIE_MAX_AGE_DAYS);
  return newId;
}

export function getAnonymousId(): string | null {
  const value = getCookie(COOKIE_NAME);
  if (value && uuidRegex.test(value)) return value;
  return null;
}

export function clearAnonymousId(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
