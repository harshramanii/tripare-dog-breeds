import { formatLastSynced, isStale, STALE_AFTER_MS } from '@/utils/freshness';

describe('formatLastSynced', () => {
  const now = 10_000_000_000;
  it('handles never-synced', () => {
    expect(formatLastSynced(null, now)).toBe('Never synced');
  });
  it('formats seconds as "Just now"', () => {
    expect(formatLastSynced(now - 30_000, now)).toBe('Just now');
  });
  it('formats minutes', () => {
    expect(formatLastSynced(now - 5 * 60_000, now)).toBe('5 min ago');
  });
  it('formats hours', () => {
    expect(formatLastSynced(now - 3 * 60 * 60_000, now)).toBe('3h ago');
  });
  it('formats days', () => {
    expect(formatLastSynced(now - 2 * 24 * 60 * 60_000, now)).toBe('2d ago');
  });
});

describe('isStale', () => {
  const now = 10_000_000_000;
  it('null is always stale', () => {
    expect(isStale(null, now)).toBe(true);
  });
  it('fresh within window', () => {
    expect(isStale(now - STALE_AFTER_MS + 1_000, now)).toBe(false);
  });
  it('stale past window', () => {
    expect(isStale(now - STALE_AFTER_MS - 1_000, now)).toBe(true);
  });
});
