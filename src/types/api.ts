/**
 * Raw JSON:API-ish shapes returned by dogapi.dog v2. Kept intentionally loose
 * so the mapper (src/api/mappers.ts) is the only place that trusts the wire
 * format — everything downstream deals in the Breed/BreedGroup app types.
 */

export interface RawPagination {
  current: number;
  next: number | null;
  last: number;
  records: number;
}

export interface RawMeta {
  pagination?: RawPagination;
}

export interface RawImage {
  id?: string;
  url?: string;
  thumb?: string;
  medium?: string;
  large?: string;
  attribution?: {
    author?: string | null;
    license?: string | null;
    license_url?: string | null;
    source?: string | null;
    source_url?: string | null;
  } | null;
}

export interface RawRange {
  min?: number;
  max?: number;
}

export interface RawBreedAttributes {
  name?: string;
  description?: string;
  life?: RawRange;
  male_weight?: RawRange;
  female_weight?: RawRange;
  male_height?: RawRange;
  female_height?: RawRange;
  hypoallergenic?: boolean;
  origin?: {
    era?: string | null;
    region?: string | null;
    country?: string | null;
  };
  coat?: { type?: string | null; colors?: string[]; length?: string | null };
  traits?: Record<string, unknown>;
  other_names?: string[];
  recognized_by?: string[];
  sources?: Array<{ url?: string; title?: string }>;
  images?: RawImage[];
}

export interface RawBreedResource {
  id: string;
  type: "breed";
  attributes: RawBreedAttributes;
  relationships?: {
    group?: { data?: { id: string; type: "group" } | null };
  };
}

export interface RawGroupAttributes {
  name?: string;
}

export interface RawGroupResource {
  id: string;
  type: "group";
  attributes: RawGroupAttributes;
}

export interface RawResponse<T> {
  data: T;
  meta?: RawMeta;
  links?: Record<string, string>;
}
