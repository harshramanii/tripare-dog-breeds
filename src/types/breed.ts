export type CoatLength = "short" | "medium" | "long" | "wire";
export type CoatType =
  | "wire"
  | "smooth"
  | "double"
  | "curly"
  | "silky"
  | "hairless"
  | string;

export type Range = { min: number; max: number };

export interface Origin {
  era: string | null;
  region: string | null;
  country: string | null;
}

export interface Coat {
  type: CoatType | null;
  colors: string[];
  length: CoatLength | null;
}

export interface Traits {
  energy: number;
  barking: number;
  drooling: number;
  grooming: number;
  shedding: number;
  temperament: string[];
  trainability: number;
  good_with_dogs: number;
  exercise_minutes: number;
  apartment_friendly: number;
  good_with_children: number;
  good_with_strangers: number;
}

export interface BreedImageAttribution {
  author: string | null;
  license: string | null;
  license_url: string | null;
  source: string | null;
  source_url: string | null;
}

export interface BreedImage {
  id: string;
  url: string;
  thumb: string;
  medium: string;
  large: string;
  attribution: BreedImageAttribution | null;
}

/** Derived, in-app size band. */
export type SizeBand = "small" | "medium" | "large" | "giant";

export interface Breed {
  id: string;
  name: string;
  description: string;
  life: Range;
  male_weight: Range;
  female_weight: Range;
  male_height: Range;
  female_height: Range;
  hypoallergenic: boolean;
  origin: Origin;
  coat: Coat;
  traits: Traits;
  other_names: string[];
  recognized_by: string[];
  sources: Array<{ url: string; title: string }>;
  images: BreedImage[];
  /** Group id from relationships.group.data.id */
  group_id: string | null;
  /** Derived helper — cached avg weight midpoint for filtering/sorting. */
  size_band: SizeBand;
}

export interface BreedGroup {
  id: string;
  name: string;
}
