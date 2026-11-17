// All writes from the site go through the `secure_write` RPC, which checks a
// server-issued session token (from admin_login / player_login /
// player_register) and enforces who may change what. Direct table writes with
// the public anon key are rejected by RLS.
import { supabase } from './supabaseClient';
import { clearCache } from './dataCache';

export const SESSION_EXPIRED_EVENT = 'secure-session-expired';

// kind: 'admin' | 'player'; op: 'insert' | 'update' | 'delete' | 'upsert'
// opts.values: row object (or array for insert/upsert)
// opts.match:  { column: value | [values] } — required for update/delete
// opts.onConflict: ['col', ...] for upsert
// Resolves to { data: affectedRows[], error }.
export async function secureWrite(kind, token, table, op, { values = null, match = null, onConflict = null } = {}) {
  const { data, error } = await supabase.rpc('secure_write', {
    p_token: token || '', p_kind: kind, p_table: table, p_op: op,
    p_values: values, p_match: match, p_on_conflict: onConflict,
  });
  if (error && /invalid_session/.test(error.message || '')) {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: kind }));
  }
  // Data changed: drop cached page data so public pages refetch right away.
  if (!error) clearCache();
  return { data: Array.isArray(data) ? data : [], error };
}

export function logoutSession(token) {
  if (!token) return;
  supabase.rpc('session_logout', { p_token: token }).then(() => {}, () => {});
}
