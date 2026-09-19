import type { Breed, SizeBand } from "@/types/breed";

/**
 * Derive a size band from weight ranges. Buckets are chosen on average adult
 * weight in kg using AKC-ish cutoffs:
 *   small  < 10kg   (toys, small terriers)
 *   medium 10–25kg  (spaniels, medium herders)
 *   large  25–45kg  (retrievers, working)
 *   giant  ≥ 45kg   (Great Dane, Mastiff, etc.)
 * Falls back to `medium` when weight is missing or zeroed — the API has a
 * handful of records with 0/0 ranges we don't want to hide entirely.
 */
export function deriveSizeBand(input: {
  male_weight: { min: number; max: number };
  female_weight: { min: number; max: number };
}): SizeBand {
  const values = [
    input.male_weight.min,
    input.male_weight.max,
    input.female_weight.min,
    input.female_weight.max,
  ].filter((n) => n > 0);
  if (values.length === 0) return "medium";
  const avg = values.reduce((s, n) => s + n, 0) / values.length;
  if (avg < 10) return "small";
  if (avg < 25) return "medium";
  if (avg < 45) return "large";
  return "giant";
}

export const SIZE_BAND_LABEL: Record<SizeBand, string> = {
  small: "Small (<10kg)",
  medium: "Medium (10–25kg)",
  large: "Large (25–45kg)",
  giant: "Giant (45kg+)",
};

export const ALL_SIZE_BANDS: SizeBand[] = ["small", "medium", "large", "giant"];

export const breedWeightMidpoint = (b: Breed): number => {
  const values = [
    b.male_weight.min,
    b.male_weight.max,
    b.female_weight.min,
    b.female_weight.max,
  ].filter((n) => n > 0);
  return values.length ? values.reduce((s, n) => s + n, 0) / values.length : 0;
};
