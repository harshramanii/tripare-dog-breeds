/**
 * AsyncStorage keys. Bump `CACHE_VERSION` to invalidate all cached data when
 * the on-disk shape changes (mapper additions, new derived fields, etc.).
 */
export const CACHE_VERSION = "v1";
const NS = `tripare/${CACHE_VERSION}`;

export const StorageKeys = {
  breeds: `${NS}/breeds`,
  groups: `${NS}/groups`,
  lastSyncedAt: `${NS}/lastSyncedAt`,
} as const;
