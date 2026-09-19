import { create } from "zustand";
import type { Breed, BreedGroup } from "@/types/breed";
import { fetchAllBreeds, fetchAllGroups } from "@/api/client";
import {
  loadSnapshot,
  saveBreeds,
  saveGroups,
  saveLastSyncedAt,
  clearCache,
} from "@/persistence/storage";
import {
  emptyFilters,
  type Filters,
  type HypoFilter,
  type TraitKey,
} from "./filters";
import type { CoatLength, SizeBand } from "@/types/breed";

export type SyncStatus = "idle" | "hydrating" | "syncing" | "error";

interface AppState {
  breeds: Breed[];
  groups: BreedGroup[];
  breedsById: Map<string, Breed>;
  groupsById: Map<string, BreedGroup>;
  lastSyncedAt: number | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  syncProgress: { loaded: number; total: number } | null;
  filters: Filters;

  hydrate: () => Promise<void>;
  syncAll: (opts?: { silent?: boolean }) => Promise<void>;
  refreshBreed: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;

  setSearch: (v: string) => void;
  toggleGroup: (id: string) => void;
  toggleSize: (b: SizeBand) => void;
  toggleCoat: (c: CoatLength) => void;
  setHypo: (v: HypoFilter) => void;
  setTrait: (t: TraitKey | null, min: number) => void;
  resetFilters: () => void;
}

const indexById = <T extends { id: string }>(items: T[]): Map<string, T> => {
  const m = new Map<string, T>();
  for (const it of items) m.set(it.id, it);
  return m;
};

export const useAppStore = create<AppState>((set, get) => ({
  breeds: [],
  groups: [],
  breedsById: new Map(),
  groupsById: new Map(),
  lastSyncedAt: null,
  syncStatus: "idle",
  syncError: null,
  syncProgress: null,
  filters: emptyFilters(),

  async hydrate() {
    set({ syncStatus: "hydrating" });
    const snap = await loadSnapshot();
    set({
      breeds: snap.breeds,
      groups: snap.groups,
      breedsById: indexById(snap.breeds),
      groupsById: indexById(snap.groups),
      lastSyncedAt: snap.lastSyncedAt,
      syncStatus: "idle",
    });
  },

  async syncAll(opts) {
    // Guard against overlapping syncs — a foreground event + a manual pull
    // can both fire at once.
    if (get().syncStatus === "syncing") return;
    set({
      syncStatus: "syncing",
      syncError: null,
      syncProgress: { loaded: 0, total: 283 },
    });
    try {
      const [breeds, groups] = await Promise.all([
        fetchAllBreeds((loaded, total) =>
          set({ syncProgress: { loaded, total } }),
        ),
        fetchAllGroups(),
      ]);
      const now = Date.now();
      await Promise.all([
        saveBreeds(breeds),
        saveGroups(groups),
        saveLastSyncedAt(now),
      ]);
      set({
        breeds,
        groups,
        breedsById: indexById(breeds),
        groupsById: indexById(groups),
        lastSyncedAt: now,
        syncStatus: "idle",
        syncProgress: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      // If we already had cached data, keep it and surface the error as a
      // banner. If not, the caller/UI will still see empty state + error.
      set({
        syncStatus: opts?.silent ? "idle" : "error",
        syncError: message,
        syncProgress: null,
      });
    }
  },

  async refreshBreed(id) {
    // Best-effort single-breed refresh — used on details screen to pick up
    // richer data (bigger image variants, etc.) without a full sync.
    try {
      const { fetchBreedById } = await import("@/api/client");
      const fresh = await fetchBreedById(id);
      const next = get().breeds.map((b) => (b.id === id ? fresh : b));
      const nextById = new Map(get().breedsById);
      nextById.set(id, fresh);
      set({ breeds: next, breedsById: nextById });
      await saveBreeds(next);
    } catch {
      // Swallow — details screen still has the cached record.
    }
  },

  async clearAll() {
    await clearCache();
    set({
      breeds: [],
      groups: [],
      breedsById: new Map(),
      groupsById: new Map(),
      lastSyncedAt: null,
    });
  },

  setSearch(v) {
    set((s) => ({ filters: { ...s.filters, search: v } }));
  },
  toggleGroup(id) {
    set((s) => {
      const next = new Set(s.filters.groupIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { filters: { ...s.filters, groupIds: next } };
    });
  },
  toggleSize(b) {
    set((s) => {
      const next = new Set(s.filters.sizes);
      next.has(b) ? next.delete(b) : next.add(b);
      return { filters: { ...s.filters, sizes: next } };
    });
  },
  toggleCoat(c) {
    set((s) => {
      const next = new Set(s.filters.coats);
      next.has(c) ? next.delete(c) : next.add(c);
      return { filters: { ...s.filters, coats: next } };
    });
  },
  setHypo(v) {
    set((s) => ({ filters: { ...s.filters, hypo: v } }));
  },
  setTrait(t, min) {
    set((s) => ({ filters: { ...s.filters, trait: t, traitMin: min } }));
  },
  resetFilters() {
    set((s) => ({ filters: { ...emptyFilters(), search: s.filters.search } }));
  },
}));
