import { suggestOverload } from './overload';

const RANGE = { repMin: 8, repMax: 12 };

describe('suggestOverload', () => {
  it('returns none without two sessions of history', () => {
    expect(suggestOverload(RANGE, [])).toBe('none');
    expect(suggestOverload(RANGE, [[12, 12, 12]])).toBe('none');
  });

  it('suggests increasing weight when both sessions hit the top of the range', () => {
    expect(suggestOverload(RANGE, [[12, 12, 12], [12, 12, 12]])).toBe('increase-weight');
  });

  it('suggests reducing weight when both sessions fell below the range', () => {
    expect(suggestOverload(RANGE, [[6, 7, 6], [7, 6, 7]])).toBe('reduce-weight');
  });

  it('holds when only one of the two sessions hit the top', () => {
    expect(suggestOverload(RANGE, [[12, 12, 12], [10, 9, 11]])).toBe('hold');
  });

  it('holds when reps are within range but not maxed', () => {
    expect(suggestOverload(RANGE, [[9, 10, 9], [10, 9, 10]])).toBe('hold');
  });
});
