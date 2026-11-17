// Stale-while-revalidate cache for Supabase queries.
// Pages render cached data instantly (from memory, or from localStorage after
// a reload / revisit) and ALWAYS refetch in the background on mount, so admin
// edits show up on the next visit/refresh (the cache only speeds up first paint).
import { useState, useEffect, useCallback, useRef } from 'react';

const cache = {};
const TTL = 30 * 1000; // within one SPA session, skip refetching data younger than 30s
const LS_PREFIX = 'dc1:'; // bump to invalidate every persisted entry
const LS_MAX_CHARS = 1500000; // skip persisting very large payloads

function readStorage(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || typeof entry.ts !== 'number') return null;
    return entry;
  } catch (e) { return null; }
}

function writeStorage(key, entry) {
  try {
    const raw = JSON.stringify(entry);
    if (raw.length > LS_MAX_CHARS) return;
    localStorage.setItem(LS_PREFIX + key, raw);
  } catch (e) { /* quota / private mode: memory cache still works */ }
}

function getEntry(key) {
  if (cache[key]) return cache[key];
  const stored = readStorage(key);
  if (stored) cache[key] = stored;
  return stored;
}

export function getCached(key) {
  const entry = getEntry(key);
  return entry ? entry.data : null;
}

// Only data fetched during THIS page load counts as fresh; anything restored
// from localStorage is always revalidated.
const fetchedThisLoad = new Set();
export function isFresh(key) {
  const entry = cache[key];
  return fetchedThisLoad.has(key) && !!entry && Date.now() - entry.ts < TTL;
}

export function setCache(key, data) {
  const entry = { data, ts: Date.now() };
  cache[key] = entry;
  fetchedThisLoad.add(key);
  writeStorage(key, entry);
}

export function clearCache(key) {
  const keys = key ? [key] : Object.keys(cache);
  if (!key) {
    // also drop persisted entries from earlier page loads
    try { Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX)).forEach(k => keys.push(k.slice(LS_PREFIX.length))); } catch (e) { /* ignore */ }
  }
  keys.forEach(k => {
    delete cache[k];
    fetchedThisLoad.delete(k);
    try { localStorage.removeItem(LS_PREFIX + k); } catch (e) { /* ignore */ }
  });
}

// Hook: returns [data, loading, refresh]
// Shows cached data immediately (loading=false), fetches fresh in background.
export function useCachedData(key, fetchFn) {
  const [data, setData] = useState(() => getCached(key));
  const [loading, setLoading] = useState(() => getCached(key) == null);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const refresh = useCallback(async () => {
    try {
      const result = await fetchRef.current();
      setData(result);
      setCache(key, result);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [key]);

  useEffect(() => {
    const cached = getCached(key);
    if (cached != null) {
      setData(cached);
      setLoading(false);
      if (!isFresh(key)) refresh();
    } else {
      setLoading(true);
      refresh();
    }
  }, [key, refresh]);

  return [data, loading, refresh];
}
