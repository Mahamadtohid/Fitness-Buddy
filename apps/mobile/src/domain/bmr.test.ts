import { calculateAgeFromBirthDate, calculateBmr, calculateRestDayTarget, calculateTrainingDayTarget } from './bmr';

describe('calculateBmr', () => {
  it('applies the Mifflin-St Jeor formula for men', () => {
    const bmr = calculateBmr({
      sex: 'male',
      weightKg: 75,
      heightCm: 178,
      ageYears: 30,
      lifestyleFactor: 1.3,
      rateKgPerWeek: 0,
    });
    expect(bmr).toBeCloseTo(10 * 75 + 6.25 * 178 - 5 * 30 + 5);
  });

  it('applies the Mifflin-St Jeor formula for women', () => {
    const bmr = calculateBmr({
      sex: 'female',
      weightKg: 60,
      heightCm: 165,
      ageYears: 28,
      lifestyleFactor: 1.2,
      rateKgPerWeek: 0,
    });
    expect(bmr).toBeCloseTo(10 * 60 + 6.25 * 165 - 5 * 28 - 161);
  });
});

describe('calculateRestDayTarget', () => {
  it('reduces the target for a planned loss rate', () => {
    const profile = {
      sex: 'male' as const,
      weightKg: 75,
      heightCm: 178,
      ageYears: 30,
      lifestyleFactor: 1.3,
      rateKgPerWeek: -0.5,
    };
    const maintain = calculateRestDayTarget({ ...profile, rateKgPerWeek: 0 });
    const losing = calculateRestDayTarget(profile);
    expect(losing).toBeLessThan(maintain);
  });
});

describe('calculateTrainingDayTarget', () => {
  it('adds the training-day bump on top of the rest-day target', () => {
    const profile = {
      sex: 'male' as const,
      weightKg: 75,
      heightCm: 178,
      ageYears: 30,
      lifestyleFactor: 1.3,
      rateKgPerWeek: 0,
    };
    const rest = calculateRestDayTarget(profile);
    expect(calculateTrainingDayTarget(profile)).toBeCloseTo(rest + 300);
    expect(calculateTrainingDayTarget(profile, 450)).toBeCloseTo(rest + 450);
  });
});

describe('calculateAgeFromBirthDate', () => {
  it('returns the age when the birthday has already passed this year', () => {
    expect(calculateAgeFromBirthDate('1990-01-15', new Date('2026-11-07T00:00:00Z'))).toBe(36);
  });

  it('subtracts one when the birthday has not happened yet this year', () => {
    expect(calculateAgeFromBirthDate('1990-12-15', new Date('2026-11-07T00:00:00Z'))).toBe(35);
  });

  it('counts the birthday itself as already turned', () => {
    expect(calculateAgeFromBirthDate('1990-11-07', new Date('2026-11-07T00:00:00Z'))).toBe(36);
  });
});
