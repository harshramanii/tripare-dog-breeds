import { getJson } from "./http";
import { mapBreed, mapGroup } from "./mappers";
import type {
  RawBreedResource,
  RawGroupResource,
  RawResponse,
} from "@/types/api";
import type { Breed, BreedGroup } from "@/types/breed";

interface BreedsPage {
  data: Breed[];
  currentPage: number;
  lastPage: number;
  totalRecords: number;
}

async function fetchBreedsPage(page: number): Promise<BreedsPage> {
  const raw = await getJson<RawResponse<RawBreedResource[]>>(
    `/breeds?page[number]=${page}`,
  );
  const pagination = raw.meta?.pagination;
  return {
    data: raw.data.map(mapBreed),
    currentPage: pagination?.current ?? page,
    lastPage: pagination?.last ?? page,
    totalRecords: pagination?.records ?? raw.data.length,
  };
}

/**
 * Fetch every page of /breeds and merge into a single list.
 *
 * We first fetch page 1 to learn `pagination.last` (the docs say 6×48 but
 * the live API currently returns 10×30 — we don't hardcode either). Pages
 * 2..N are fetched in parallel; any single-page failure surfaces via reject
 * so the caller can decide to keep cached data or show an error banner.
 */
export async function fetchAllBreeds(
  onProgress?: (loaded: number, total: number) => void,
): Promise<Breed[]> {
  const first = await fetchBreedsPage(1);
  const total = first.totalRecords;
  let loaded = first.data.length;
  onProgress?.(loaded, total);
  if (first.lastPage <= 1) return first.data;

  const pageNumbers: number[] = [];
  for (let p = 2; p <= first.lastPage; p += 1) pageNumbers.push(p);

  const rest = await Promise.all(
    pageNumbers.map(async (p) => {
      const page = await fetchBreedsPage(p);
      loaded += page.data.length;
      onProgress?.(loaded, total);
      return page.data;
    }),
  );

  const merged = first.data.concat(...rest);
  // De-dup defensively — API is well-behaved but merging pages by hand is a
  // classic place to double-count on server-side re-shuffles between requests.
  const seen = new Set<string>();
  return merged.filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
}

export async function fetchAllGroups(): Promise<BreedGroup[]> {
  const raw = await getJson<RawResponse<RawGroupResource[]>>("/groups");
  return raw.data.map(mapGroup);
}

export async function fetchBreedById(id: string): Promise<Breed> {
  const raw = await getJson<RawResponse<RawBreedResource>>(`/breeds/${id}`);
  return mapBreed(raw.data);
}
