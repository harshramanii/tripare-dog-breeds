import type {
  Breed,
  BreedGroup,
  BreedImage,
  Coat,
  CoatLength,
  Range,
  Traits,
} from "@/types/breed";
import type {
  RawBreedResource,
  RawGroupResource,
  RawImage,
  RawRange,
} from "@/types/api";
import {
  asStringArray,
  isBoolean,
  isNumber,
  isObject,
  isString,
} from "@/utils/typeGuards";
import { deriveSizeBand } from "@/utils/sizeBand";

const emptyRange = (): Range => ({ min: 0, max: 0 });

const mapRange = (v: RawRange | undefined): Range => ({
  min: isNumber(v?.min) ? v!.min! : 0,
  max: isNumber(v?.max) ? v!.max! : 0,
});

const COAT_LENGTHS: readonly CoatLength[] = ["short", "medium", "long", "wire"];
const mapCoatLength = (v: unknown): CoatLength | null =>
  isString(v) && (COAT_LENGTHS as readonly string[]).includes(v)
    ? (v as CoatLength)
    : null;

const mapCoat = (raw: RawBreedResource["attributes"]["coat"]): Coat => ({
  type: isString(raw?.type) ? raw!.type! : null,
  colors: asStringArray(raw?.colors),
  length: mapCoatLength(raw?.length),
});

const numberOr = (v: unknown, fallback = 0): number =>
  isNumber(v) ? v : fallback;

const mapTraits = (raw: Record<string, unknown> | undefined): Traits => ({
  energy: numberOr(raw?.energy),
  barking: numberOr(raw?.barking),
  drooling: numberOr(raw?.drooling),
  grooming: numberOr(raw?.grooming),
  shedding: numberOr(raw?.shedding),
  temperament: asStringArray(raw?.temperament),
  trainability: numberOr(raw?.trainability),
  good_with_dogs: numberOr(raw?.good_with_dogs),
  exercise_minutes: numberOr(raw?.exercise_minutes),
  apartment_friendly: numberOr(raw?.apartment_friendly),
  good_with_children: numberOr(raw?.good_with_children),
  good_with_strangers: numberOr(raw?.good_with_strangers),
});

const mapImage = (raw: RawImage, idx: number): BreedImage | null => {
  // Skip entries with no usable url at all.
  const anyUrl = raw.url ?? raw.large ?? raw.medium ?? raw.thumb;
  if (!isString(anyUrl)) return null;
  const url = isString(raw.url) ? raw.url : anyUrl;
  return {
    id: isString(raw.id) ? raw.id : `img-${idx}`,
    url,
    thumb: isString(raw.thumb) ? raw.thumb : url,
    medium: isString(raw.medium) ? raw.medium : url,
    large: isString(raw.large) ? raw.large : url,
    attribution: isObject(raw.attribution)
      ? {
          author: isString(raw.attribution.author)
            ? raw.attribution.author
            : null,
          license: isString(raw.attribution.license)
            ? raw.attribution.license
            : null,
          license_url: isString(raw.attribution.license_url)
            ? raw.attribution.license_url
            : null,
          source: isString(raw.attribution.source)
            ? raw.attribution.source
            : null,
          source_url: isString(raw.attribution.source_url)
            ? raw.attribution.source_url
            : null,
        }
      : null,
  };
};

const mapSources = (
  raw: RawBreedResource["attributes"]["sources"],
): Breed["sources"] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => ({
      url: isString(s?.url) ? s!.url! : "",
      title: isString(s?.title) ? s!.title! : "",
    }))
    .filter((s) => s.url.length > 0);
};

export function mapBreed(raw: RawBreedResource): Breed {
  const a = raw.attributes ?? {};
  const male_weight = mapRange(a.male_weight);
  const female_weight = mapRange(a.female_weight);
  return {
    id: raw.id,
    name: isString(a.name) ? a.name : "Unknown",
    description: isString(a.description) ? a.description : "",
    life: mapRange(a.life),
    male_weight,
    female_weight,
    male_height: mapRange(a.male_height),
    female_height: mapRange(a.female_height),
    hypoallergenic: isBoolean(a.hypoallergenic) ? a.hypoallergenic : false,
    origin: {
      era: isString(a.origin?.era) ? a.origin!.era! : null,
      region: isString(a.origin?.region) ? a.origin!.region! : null,
      country: isString(a.origin?.country) ? a.origin!.country! : null,
    },
    coat: mapCoat(a.coat),
    traits: mapTraits(a.traits),
    other_names: asStringArray(a.other_names),
    recognized_by: asStringArray(a.recognized_by),
    sources: mapSources(a.sources),
    images: Array.isArray(a.images)
      ? a.images.map(mapImage).filter((i): i is BreedImage => i !== null)
      : [],
    group_id: raw.relationships?.group?.data?.id ?? null,
    size_band: deriveSizeBand({ male_weight, female_weight }),
  };
}

export function mapGroup(raw: RawGroupResource): BreedGroup {
  return {
    id: raw.id,
    name: isString(raw.attributes?.name)
      ? raw.attributes.name!
      : "Unnamed group",
  };
}

export { emptyRange };
