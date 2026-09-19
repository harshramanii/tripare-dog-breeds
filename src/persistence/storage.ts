import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Breed, BreedGroup } from "@/types/breed";
import { StorageKeys } from "./keys";

export interface CachedSnapshot {
  breeds: Breed[];
  groups: BreedGroup[];
  lastSyncedAt: number | null;
}

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt entry — drop it so the next sync writes cleanly.
    await AsyncStorage.removeItem(key);
    return null;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadSnapshot(): Promise<CachedSnapshot> {
  const [breeds, groups, ts] = await Promise.all([
    readJson<Breed[]>(StorageKeys.breeds),
    readJson<BreedGroup[]>(StorageKeys.groups),
    AsyncStorage.getItem(StorageKeys.lastSyncedAt),
  ]);
  return {
    breeds: breeds ?? [],
    groups: groups ?? [],
    lastSyncedAt: ts ? Number(ts) : null,
  };
}

export async function saveBreeds(breeds: Breed[]): Promise<void> {
  await writeJson(StorageKeys.breeds, breeds);
}

export async function saveGroups(groups: BreedGroup[]): Promise<void> {
  await writeJson(StorageKeys.groups, groups);
}

export async function saveLastSyncedAt(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.lastSyncedAt, String(timestamp));
}

export async function clearCache(): Promise<void> {
  await AsyncStorage.multiRemove([
    StorageKeys.breeds,
    StorageKeys.groups,
    StorageKeys.lastSyncedAt,
  ]);
}
