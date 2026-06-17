import {
  percentToNscAps,
  percentToApsWits,
  percentToApsUp,
  percentToApsUj,
  percentToApsCut,
  percentToApsVut,
  percentToGpa,
} from '../scenes/apcalculator/gpaFormulas';

// ---------------------------------------------------------------------------
// NSC APS scale (shared by all listed SA universities)
// 80-100 → 7 | 70-79 → 6 | 60-69 → 5 | 50-59 → 4
// 40-49  → 3 | 30-39 → 2 |  0-29 → 1
// ---------------------------------------------------------------------------
describe('percentToNscAps – official NSC achievement-level bands', () => {
  const cases = [
    [100, 7], [80, 7],
    [79, 6],  [70, 6],
    [69, 5],  [60, 5],
    [59, 4],  [50, 4],
    [49, 3],  [40, 3],
    [39, 2],  [30, 2],
    [29, 1],  [0, 1],
  ];

  test.each(cases)('%i% → %i points', (score, expected) => {
    expect(percentToNscAps(score)).toBe(expected);
  });

  test('max score is 7, never 8', () => {
    expect(percentToNscAps(100)).toBe(7);
    expect(percentToNscAps(90)).toBe(7);
  });

  test('non-numeric input returns 1 (treating 0 as level 1)', () => {
    expect(percentToNscAps(NaN)).toBe(1);
    expect(percentToNscAps(undefined)).toBe(1);
    expect(percentToNscAps('')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Per-university helpers all delegate to the NSC scale
// ---------------------------------------------------------------------------
describe('university-specific APS helpers delegate to NSC scale', () => {
  const fns = [percentToApsWits, percentToApsUp, percentToApsUj, percentToApsCut, percentToApsVut];
  const probes = [100, 85, 75, 65, 55, 45, 35, 10];

  fns.forEach((fn) => {
    test(`${fn.name || 'fn'} matches percentToNscAps for all bands`, () => {
      probes.forEach((score) => {
        expect(fn(score)).toBe(percentToNscAps(score));
      });
    });
  });
});

// ---------------------------------------------------------------------------
// GPA conversion
// ---------------------------------------------------------------------------
describe('percentToGpa – 4.0 scale', () => {
  test('≥ 93 → 4.0', () => expect(percentToGpa(93)).toBe(4.0));
  test('90–92 → 3.7', () => expect(percentToGpa(90)).toBe(3.7));
  test('87–89 → 3.3', () => expect(percentToGpa(87)).toBe(3.3));
  test('83–86 → 3.0', () => expect(percentToGpa(83)).toBe(3.0));
  test('80–82 → 2.7', () => expect(percentToGpa(80)).toBe(2.7));
  test('< 65 → 0.0', () => expect(percentToGpa(50)).toBe(0.0));

  test('NaN/undefined → 0.0', () => {
    expect(percentToGpa(NaN)).toBe(0.0);
    expect(percentToGpa(undefined)).toBe(0.0);
  });
});
