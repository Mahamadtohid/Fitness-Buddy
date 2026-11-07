import { estimatedOneRepMax, isPersonalRecord } from './oneRepMax';

describe('estimatedOneRepMax', () => {
  it('applies the Epley formula', () => {
    expect(estimatedOneRepMax(100, 1)).toBeCloseTo(100 * (1 + 1 / 30));
    expect(estimatedOneRepMax(100, 10)).toBeCloseTo(100 * (1 + 10 / 30));
  });

  it('returns the weight itself for a single rep', () => {
    expect(estimatedOneRepMax(80, 1)).toBeCloseTo(80 * (1 + 1 / 30));
  });

  it('increases with more reps at the same weight', () => {
    expect(estimatedOneRepMax(100, 10)).toBeGreaterThan(estimatedOneRepMax(100, 5));
  });
});

describe('isPersonalRecord', () => {
  it('returns false for an out-of-range index', () => {
    expect(isPersonalRecord([], 0)).toBe(false);
    expect(isPersonalRecord([{ weightKg: 50, reps: 5 }], 5)).toBe(false);
    expect(isPersonalRecord([{ weightKg: 50, reps: 5 }], -1)).toBe(false);
  });

  it('treats the first entry overall as a PR', () => {
    const history = [{ weightKg: 50, reps: 5 }];
    expect(isPersonalRecord(history, 0)).toBe(true);
  });

  it('is true when a later entry strictly beats every earlier estimated 1RM', () => {
    const history = [
      { weightKg: 50, reps: 5 },
      { weightKg: 60, reps: 5 },
    ];
    expect(isPersonalRecord(history, 1)).toBe(true);
  });

  it('is false when a later entry does not beat the best earlier estimated 1RM', () => {
    const history = [
      { weightKg: 60, reps: 5 },
      { weightKg: 50, reps: 5 },
    ];
    expect(isPersonalRecord(history, 1)).toBe(false);
  });

  it('is false when a later entry exactly ties the best earlier estimated 1RM', () => {
    const history = [
      { weightKg: 60, reps: 5 },
      { weightKg: 60, reps: 5 },
    ];
    expect(isPersonalRecord(history, 1)).toBe(false);
  });

  it('is true for a later lower-weight-but-more-reps set whose estimated 1RM is still higher', () => {
    // 100kg x 1 -> 100 * (1 + 1/30) ≈ 103.33
    // 80kg x 10 -> 80 * (1 + 10/30) ≈ 106.67 (higher estimated 1RM despite less weight)
    const history = [
      { weightKg: 100, reps: 1 },
      { weightKg: 80, reps: 10 },
    ];
    expect(isPersonalRecord(history, 1)).toBe(true);
  });

  it('looks at the best of all earlier entries, not just the immediately preceding one', () => {
    const history = [
      { weightKg: 100, reps: 5 }, // best earlier
      { weightKg: 90, reps: 5 }, // dip
      { weightKg: 95, reps: 5 }, // still below the first entry's e1RM
    ];
    expect(isPersonalRecord(history, 0)).toBe(true);
    expect(isPersonalRecord(history, 1)).toBe(false);
    expect(isPersonalRecord(history, 2)).toBe(false);
  });
});
