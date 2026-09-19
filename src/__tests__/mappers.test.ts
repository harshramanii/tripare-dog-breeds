import { mapBreed, mapGroup } from '@/api/mappers';
import type { RawBreedResource, RawGroupResource } from '@/types/api';

const rawBreed: RawBreedResource = {
  id: 'breed-1',
  type: 'breed',
  attributes: {
    name: 'Affenpinscher',
    description: 'A small, playful dog.',
    life: { min: 14, max: 16 },
    male_weight: { min: 4, max: 6 },
    female_weight: { min: 4, max: 6 },
    male_height: { min: 23, max: 29 },
    female_height: { min: 23, max: 29 },
    hypoallergenic: true,
    origin: { era: '17th century', region: 'Central Europe', country: 'Germany' },
    coat: { type: 'wire', colors: ['black', 'gray'], length: 'short' },
    traits: {
      energy: 3,
      barking: 3,
      drooling: 1,
      grooming: 3,
      shedding: 2,
      temperament: ['playful', 'alert'],
      trainability: 3,
      good_with_dogs: 3,
      exercise_minutes: 30,
      apartment_friendly: 5,
      good_with_children: 3,
      good_with_strangers: 2,
    },
    other_names: ['Monkey Terrier'],
    recognized_by: ['AKC'],
    sources: [{ url: 'https://example.com/', title: 'AKC Standard' }],
    images: [
      {
        id: 'img-1',
        url: 'https://cdn.example.com/full.jpg',
        thumb: 'https://cdn.example.com/thumb.jpg',
        medium: 'https://cdn.example.com/med.jpg',
        large: 'https://cdn.example.com/large.jpg',
        attribution: {
          author: 'Someone',
          license: 'CC0',
          license_url: 'https://creativecommons.org/publicdomain/zero/1.0/',
          source: 'wikimedia_commons',
          source_url: 'https://commons.wikimedia.org/',
        },
      },
    ],
  },
  relationships: { group: { data: { id: 'group-1', type: 'group' } } },
};

describe('mapBreed', () => {
  it('normalizes a well-formed record into a Breed', () => {
    const b = mapBreed(rawBreed);
    expect(b.id).toBe('breed-1');
    expect(b.name).toBe('Affenpinscher');
    expect(b.hypoallergenic).toBe(true);
    expect(b.traits.temperament).toEqual(['playful', 'alert']);
    expect(b.images).toHaveLength(1);
    expect(b.images[0]?.attribution?.author).toBe('Someone');
    expect(b.group_id).toBe('group-1');
    expect(b.size_band).toBe('small');
    expect(b.coat.length).toBe('short');
  });

  it('applies safe fallbacks when fields are missing', () => {
    const minimal: RawBreedResource = { id: 'x', type: 'breed', attributes: {} };
    const b = mapBreed(minimal);
    expect(b.name).toBe('Unknown');
    expect(b.description).toBe('');
    expect(b.hypoallergenic).toBe(false);
    expect(b.life).toEqual({ min: 0, max: 0 });
    expect(b.traits.energy).toBe(0);
    expect(b.other_names).toEqual([]);
    expect(b.images).toEqual([]);
    expect(b.group_id).toBeNull();
    expect(b.size_band).toBe('medium'); // fallback when weight is missing
  });

  it('drops images that carry no url', () => {
    const raw: RawBreedResource = {
      id: 'y',
      type: 'breed',
      attributes: { images: [{ id: 'nope' }, { id: 'ok', url: 'https://x/y' }] },
    };
    const b = mapBreed(raw);
    expect(b.images.map((i) => i.id)).toEqual(['ok']);
  });

  it('rejects unknown coat lengths rather than trusting the wire value', () => {
    const raw: RawBreedResource = {
      id: 'z',
      type: 'breed',
      attributes: { coat: { length: 'fluffy' } },
    };
    expect(mapBreed(raw).coat.length).toBeNull();
  });
});

describe('mapGroup', () => {
  it('extracts a group name', () => {
    const raw: RawGroupResource = {
      id: 'g',
      type: 'group',
      attributes: { name: 'Herding' },
    };
    expect(mapGroup(raw)).toEqual({ id: 'g', name: 'Herding' });
  });
});
