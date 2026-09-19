/** How stale before a background sync is scheduled on app foreground. */
export const STALE_AFTER_MS = 30 * 60 * 1000;

export function formatLastSynced(
  ts: number | null,
  now: number = Date.now(),
): string {
  if (ts == null) return "Never synced";
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export const isStale = (ts: number | null, now: number = Date.now()): boolean =>
  ts == null || now - ts > STALE_AFTER_MS;
