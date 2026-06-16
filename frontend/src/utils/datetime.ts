/** Parse API datetime strings (IST ISO with offset) to epoch ms. */
export function parseMatchDatetime(iso?: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}
