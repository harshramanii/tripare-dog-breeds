import type { Breed, CoatLength, SizeBand } from "@/types/breed";

export type TraitKey =
  | "good_with_children"
  | "good_with_dogs"
  | "good_with_strangers"
  | "trainability"
  | "energy";

export type HypoFilter = "any" | "yes" | "no";

export interface Filters {
  search: string;
  groupIds: Set<string>;
  sizes: Set<SizeBand>;
  coats: Set<CoatLength>;
  hypo: HypoFilter;
  trait: TraitKey | null;
  traitMin: number; // 0..5 (0 = disabled)
}

export const emptyFilters = (): Filters => ({
  search: "",
  groupIds: new Set(),
  sizes: new Set(),
  coats: new Set(),
  hypo: "any",
  trait: null,
  traitMin: 0,
});

export const activeFilterCount = (f: Filters): number => {
  let n = 0;
  if (f.groupIds.size) n += 1;
  if (f.sizes.size) n += 1;
  if (f.coats.size) n += 1;
  if (f.hypo !== "any") n += 1;
  if (f.trait && f.traitMin > 0) n += 1;
  return n;
};

const matchesSearch = (breed: Breed, needle: string): boolean => {
  if (!needle) return true;
  const n = needle.toLowerCase();
  if (breed.name.toLowerCase().includes(n)) return true;
  return breed.other_names.some((o) => o.toLowerCase().includes(n));
};

export function applyFilters(breeds: Breed[], f: Filters): Breed[] {
  const needle = f.search.trim().toLowerCase();
  return breeds.filter((b) => {
    if (!matchesSearch(b, needle)) return false;
    if (f.groupIds.size && (!b.group_id || !f.groupIds.has(b.group_id)))
      return false;
    if (f.sizes.size && !f.sizes.has(b.size_band)) return false;
    if (f.coats.size && (!b.coat.length || !f.coats.has(b.coat.length)))
      return false;
    if (f.hypo === "yes" && !b.hypoallergenic) return false;
    if (f.hypo === "no" && b.hypoallergenic) return false;
    if (f.trait && f.traitMin > 0) {
      const val = b.traits[f.trait];
      if (typeof val !== "number" || val < f.traitMin) return false;
    }
    return true;
  });
}
