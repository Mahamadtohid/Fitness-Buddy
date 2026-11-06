import { calculateBmi, calculateCarbTarget, calculateFatTarget, calculateMacroTargets, calculateProteinTarget } from './macros';

describe('calculateBmi', () => {
  it('computes weight over height squared in meters', () => {
    expect(calculateBmi(70, 175)).toBeCloseTo(70 / (1.75 * 1.75));
  });
});

describe('calculateProteinTarget', () => {
  it('uses current weight at 1.8 g/kg when BMI is healthy', () => {
    expect(calculateProteinTarget({ weightKg: 75, heightCm: 178 })).toBeCloseTo(75 * 1.8);
  });

  it('uses goal weight instead of current weight when BMI is over 30', () => {
    // 110kg at 170cm -> BMI ~38, well over the threshold
    expect(calculateProteinTarget({ weightKg: 110, heightCm: 170, goalWeightKg: 85 })).toBeCloseTo(85 * 1.8);
  });

  it('falls back to current weight when BMI is over 30 but no goal weight is set yet', () => {
    expect(calculateProteinTarget({ weightKg: 110, heightCm: 170 })).toBeCloseTo(110 * 1.8);
  });

  it('accepts a custom g/kg multiplier within the PRD 1.6-2.2 range', () => {
    expect(calculateProteinTarget({ weightKg: 75, heightCm: 178, gPerKg: 2.2 })).toBeCloseTo(75 * 2.2);
  });
});

describe('calculateFatTarget', () => {
  it('uses 25% of calories when that is above the floor', () => {
    expect(calculateFatTarget(2500, 75)).toBeCloseTo((2500 * 0.25) / 9);
  });

  it('floors at 0.6 g/kg when 25% of calories would fall below it', () => {
    const calories = 1200;
    const weightKg = 90;
    const floor = 0.6 * weightKg;
    const fromPercent = (calories * 0.25) / 9;
    expect(fromPercent).toBeLessThan(floor);
    expect(calculateFatTarget(calories, weightKg)).toBeCloseTo(floor);
  });
});

describe('calculateCarbTarget', () => {
  it('assigns remaining calories after protein and fat to carbs', () => {
    const calories = 2500;
    const proteinG = 135;
    const fatG = 70;
    const expected = (calories - proteinG * 4 - fatG * 9) / 4;
    expect(calculateCarbTarget(calories, proteinG, fatG)).toBeCloseTo(expected);
  });

  it('never goes negative when protein and fat already exceed the calorie budget', () => {
    expect(calculateCarbTarget(1000, 150, 100)).toBe(0);
  });
});

describe('calculateMacroTargets', () => {
  it('composes protein, fat and carb targets for a calorie target', () => {
    const result = calculateMacroTargets(2200, { weightKg: 75, heightCm: 178 });
    expect(result.proteinG).toBeCloseTo(75 * 1.8);
    expect(result.fatG).toBeGreaterThan(0);
    expect(result.carbG).toBeGreaterThan(0);
  });
});
