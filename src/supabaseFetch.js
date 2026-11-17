// Supabase/PostgREST caps every response at 1000 rows. fetchAllRows pages
// through a query with .range() so callers always get the complete result.
const PAGE = 1000;

// `build` must return a fresh query builder each call, with a stable order
// (e.g. .order('id')) so pages don't overlap or skip rows.
export async function fetchAllRows(build) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

// Item classes that official-code accessories reference (for pics/prices).
export const ACCESSORY_CLASSES = ['attachment', 'acc'];
