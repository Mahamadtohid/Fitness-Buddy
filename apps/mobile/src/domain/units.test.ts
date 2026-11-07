import {
  cmToIn,
  formatLength,
  formatWeight,
  inToCm,
  kgToLb,
  lbToKg,
  parseLengthInput,
  parseWeightInput,
} from './units';

describe('kgToLb / lbToKg round trip', () => {
  it('converts kg to lb and back within a small epsilon', () => {
    for (const kg of [0, 1, 55.5, 72.4, 159.7]) {
      expect(lbToKg(kgToLb(kg))).toBeCloseTo(kg, 6);
    }
  });

  it('matches the known 1 kg ≈ 2.2046 lb conversion factor', () => {
    expect(kgToLb(1)).toBeCloseTo(2.2046226218, 6);
  });
});

describe('cmToIn / inToCm round trip', () => {
  it('converts cm to in and back within a small epsilon', () => {
    for (const cm of [0, 2.54, 80, 180.3, 31.5]) {
      expect(inToCm(cmToIn(cm))).toBeCloseTo(cm, 6);
    }
  });

  it('matches the known 1 in = 2.54 cm conversion factor', () => {
    expect(inToCm(1)).toBeCloseTo(2.54, 6);
  });
});

describe('formatWeight', () => {
  it('formats metric as kg with one decimal', () => {
    expect(formatWeight(72.4, 'metric')).toBe('72.4 kg');
  });

  it('formats imperial as lb with one decimal', () => {
    expect(formatWeight(lbToKg(159.7), 'imperial')).toBe('159.7 lb');
  });
});

describe('formatLength', () => {
  it('formats metric as a rounded whole-number cm value', () => {
    expect(formatLength(80.4, 'metric')).toBe('80 cm');
  });

  it('formats imperial as in with one decimal', () => {
    expect(formatLength(inToCm(31.5), 'imperial')).toBe('31.5 in');
  });
});

describe('parseWeightInput', () => {
  it('leaves metric input as kg', () => {
    expect(parseWeightInput('72.4', 'metric')).toBeCloseTo(72.4);
  });

  it('converts imperial lb input to kg', () => {
    expect(parseWeightInput('159.7', 'imperial')).toBeCloseTo(lbToKg(159.7));
  });
});

describe('parseLengthInput', () => {
  it('leaves metric input as cm', () => {
    expect(parseLengthInput('80', 'metric')).toBeCloseTo(80);
  });

  it('converts imperial in input to cm', () => {
    expect(parseLengthInput('31.5', 'imperial')).toBeCloseTo(inToCm(31.5));
  });
});
