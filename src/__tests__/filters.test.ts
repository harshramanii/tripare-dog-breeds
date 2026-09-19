import { applyFilters, emptyFilters, activeFilterCount } from '@/store/filters';
import type { Breed } from '@/types/breed';

const breed = (overrides: Partial<Breed>): Breed => ({
  id: overrides.id ?? 'id',
  name: 'Labrador',
  description: '',
  life: { min: 10, max: 12 },
  male_weight: { min: 29, max: 36 },
  female_weight: { min: 25, max: 32 },
  male_height: { min: 57, max: 62 },
  female_height: { min: 55, max: 60 },
  hypoallergenic: false,
  origin: { era: null, region: null, country: null },
  coat: { type: null, colors: [], length: 'short' },
  traits: {
    energy: 5,
    barking: 3,
    drooling: 3,
    grooming: 2,
    shedding: 4,
    temperament: [],
    trainability: 5,
    good_with_dogs: 5,
    exercise_minutes: 60,
    apartment_friendly: 2,
    good_with_children: 5,
    good_with_strangers: 5,
  },
  other_names: [],
  recognized_by: [],
  sources: [],
  images: [],
  group_id: 'sporting',
  size_band: 'large',
  ...overrides,
});

describe('applyFilters', () => {
  const breeds: Breed[] = [
    breed({ id: 'lab', name: 'Labrador', other_names: ['Lab'] }),
    breed({
      id: 'poo',
      name: 'Poodle',
      hypoallergenic: true,
      size_band: 'medium',
      coat: { type: null, colors: [], length: 'long' },
      group_id: 'non-sporting',
    }),
    breed({
      id: 'chi',
      name: 'Chihuahua',
      size_band: 'small',
      traits: { ...breed({}).traits, good_with_children: 2 },
      group_id: 'toy',
    }),
  ];

  it('returns everything by default', () => {
    expect(applyFilters(breeds, emptyFilters())).toHaveLength(3);
  });

  it('filters by search across name and other_names', () => {
    const f = { ...emptyFilters(), search: 'lab' };
    expect(applyFilters(breeds, f).map((b) => b.id)).toEqual(['lab']);
  });

  it('filters by size band', () => {
    const f = { ...emptyFilters(), sizes: new Set(['small' as const]) };
    expect(applyFilters(breeds, f).map((b) => b.id)).toEqual(['chi']);
  });

  it('filters by hypoallergenic', () => {
    const f = { ...emptyFilters(), hypo: 'yes' as const };
    expect(applyFilters(breeds, f).map((b) => b.id)).toEqual(['poo']);
  });

  it('filters by group', () => {
    const f = { ...emptyFilters(), groupIds: new Set(['sporting']) };
    expect(applyFilters(breeds, f).map((b) => b.id)).toEqual(['lab']);
  });

  it('filters by trait threshold', () => {
    const f = { ...emptyFilters(), trait: 'good_with_children' as const, traitMin: 3 };
    expect(applyFilters(breeds, f).map((b) => b.id).sort()).toEqual(['lab', 'poo']);
  });

  it('combines filters with AND semantics', () => {
    const f = {
      ...emptyFilters(),
      sizes: new Set(['medium' as const]),
      hypo: 'yes' as const,
    };
    expect(applyFilters(breeds, f).map((b) => b.id)).toEqual(['poo']);
  });
});

describe('activeFilterCount', () => {
  it('ignores search but counts every real filter dimension', () => {
    const f = emptyFilters();
    expect(activeFilterCount(f)).toBe(0);
    f.search = 'lab';
    expect(activeFilterCount(f)).toBe(0);
    f.groupIds = new Set(['a']);
    f.hypo = 'yes';
    expect(activeFilterCount(f)).toBe(2);
  });
});
