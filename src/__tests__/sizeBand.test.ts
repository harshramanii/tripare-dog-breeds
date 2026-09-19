import { deriveSizeBand } from '@/utils/sizeBand';

const w = (min: number, max: number) => ({ min, max });

describe('deriveSizeBand', () => {
  it('classifies toys as small', () => {
    expect(
      deriveSizeBand({ male_weight: w(3, 5), female_weight: w(3, 5) }),
    ).toBe('small');
  });

  it('classifies mid-sized breeds', () => {
    expect(
      deriveSizeBand({ male_weight: w(12, 18), female_weight: w(10, 16) }),
    ).toBe('medium');
  });

  it('classifies retriever-sized breeds as large', () => {
    expect(
      deriveSizeBand({ male_weight: w(29, 36), female_weight: w(25, 32) }),
    ).toBe('large');
  });

  it('classifies mastiff-sized breeds as giant', () => {
    expect(
      deriveSizeBand({ male_weight: w(70, 90), female_weight: w(60, 80) }),
    ).toBe('giant');
  });

  it('falls back to medium when weight data is missing', () => {
    expect(
      deriveSizeBand({ male_weight: w(0, 0), female_weight: w(0, 0) }),
    ).toBe('medium');
  });
});
