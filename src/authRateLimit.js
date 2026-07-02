// Client-side login throttling. This is a UX deterrent only — real
// brute-force protection must live server-side. Keyed per username in
// localStorage: after MAX consecutive failures the account is locked
// locally for WINDOW_MS.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const PREFIX = 'auth_lock_';

function read(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : { count: 0, until: 0 };
  } catch (e) {
    return { count: 0, until: 0 };
  }
}

// Returns remaining lock time in ms (0 if not locked).
export function authLockRemaining(key) {
  const o = read(String(key || '').toLowerCase());
  if (o.until && o.until > Date.now()) return o.until - Date.now();
  return 0;
}

export function recordAuthFail(key) {
  const k = String(key || '').toLowerCase();
  const o = read(k);
  if (o.until && o.until <= Date.now()) { o.count = 0; o.until = 0; } // expired lock, reset
  o.count = (o.count || 0) + 1;
  if (o.count >= MAX_ATTEMPTS) o.until = Date.now() + WINDOW_MS;
  try { localStorage.setItem(PREFIX + k, JSON.stringify(o)); } catch (e) { /* ignore */ }
}

export function clearAuthFail(key) {
  try { localStorage.removeItem(PREFIX + String(key || '').toLowerCase()); } catch (e) { /* ignore */ }
}

export function lockMinutes(ms) {
  return Math.max(1, Math.ceil(ms / 60000));
}
