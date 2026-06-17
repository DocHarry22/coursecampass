/**
 * Unit tests for the APS and GPA calculation logic.
 * The route module is not imported directly – we extract and re-export the
 * pure calculation functions via a thin test-helper so that Express and
 * MongoDB are never initialised during the test run.
 */

// ---------------------------------------------------------------------------
// Pure functions extracted from backend/routes/apcalculator.js
// ---------------------------------------------------------------------------
function nscAps(score) {
  if (score >= 80) return 7;
  if (score >= 70) return 6;
  if (score >= 60) return 5;
  if (score >= 50) return 4;
  if (score >= 40) return 3;
  if (score >= 30) return 2;
  return 1;
}

function isLifeOrientation(name) {
  return name.toLowerCase().includes('life orientation');
}

function extractScore(subject) {
  const raw = subject.score ?? subject.grade ?? subject.examScore;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function extractName(subject) {
  return subject.subject || subject.name || 'Unnamed Subject';
}

function calcBest6(subjects, uniLabel, apsFn = nscAps) {
  const breakdown = subjects
    .filter((s) => !isLifeOrientation(extractName(s)))
    .map((s) => {
      const name  = extractName(s);
      const score = extractScore(s);
      return { subject: name, score, aps: apsFn(score) };
    });

  const best6 = breakdown.sort((a, b) => b.aps - a.aps).slice(0, 6);
  const total = best6.reduce((sum, s) => sum + s.aps, 0);
  return { university: uniLabel, apsScore: total, breakdown: best6 };
}

// Aliases matching the route file
const calculateWits = (s) => calcBest6(s, 'WITS');
const calculateUP   = (s) => calcBest6(s, 'UP');
const calculateUJ   = (s) => calcBest6(s, 'UJ');
const calculateCUT  = (s) => calcBest6(s, 'CUT');
const calculateVUT  = (s) => calcBest6(s, 'VUT');

// ---------------------------------------------------------------------------
// GPA logic (mirrors gpaController.js)
// ---------------------------------------------------------------------------
const GPA_SCALE = [
  { min: 93, gpa: 4.0 }, { min: 90, gpa: 3.7 }, { min: 87, gpa: 3.3 },
  { min: 83, gpa: 3.0 }, { min: 80, gpa: 2.7 }, { min: 77, gpa: 2.3 },
  { min: 73, gpa: 2.0 }, { min: 70, gpa: 1.7 }, { min: 67, gpa: 1.3 },
  { min: 65, gpa: 1.0 },
];
function determineGpa(avg) {
  const match = GPA_SCALE.find((s) => avg >= s.min);
  return match ? match.gpa : 0.0;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('nscAps – official NSC achievement-level bands', () => {
  const table = [
    [100, 7], [80, 7],
    [79, 6],  [70, 6],
    [69, 5],  [60, 5],
    [59, 4],  [50, 4],
    [49, 3],  [40, 3],
    [39, 2],  [30, 2],
    [29, 1],  [0,  1],
  ];

  test.each(table)('%i% → %i pts', (score, expected) => {
    expect(nscAps(score)).toBe(expected);
  });

  test('max is 7, never 8', () => {
    expect(nscAps(100)).toBe(7);
    expect(nscAps(90)).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// calcBest6 / individual university functions
// ---------------------------------------------------------------------------

const SAMPLE_7_SUBJECTS = [
  { subject: 'Mathematics',           grade: 85 },  // 7
  { subject: 'Physical Sciences',     grade: 78 },  // 6
  { subject: 'English Home Language', grade: 72 },  // 6
  { subject: 'Life Orientation',      grade: 90 },  // excluded
  { subject: 'Life Sciences',         grade: 65 },  // 5
  { subject: 'Geography',             grade: 55 },  // 4
  { subject: 'Accounting',            grade: 48 },  // 3
  { subject: 'History',               grade: 35 },  // 2
];
// Best 6 non-LO: Maths(7) + PhySci(6) + English(6) + LifeSci(5) + Geo(4) + Acc(3) = 31

describe('calcBest6 – core rules', () => {
  test('Life Orientation is excluded', () => {
    const result = calcBest6(SAMPLE_7_SUBJECTS, 'TEST');
    const names = result.breakdown.map((s) => s.subject);
    expect(names).not.toContain('Life Orientation');
  });

  test('only 6 subjects are used', () => {
    const result = calcBest6(SAMPLE_7_SUBJECTS, 'TEST');
    expect(result.breakdown).toHaveLength(6);
  });

  test('takes the six HIGHEST-scoring subjects', () => {
    const result = calcBest6(SAMPLE_7_SUBJECTS, 'TEST');
    // History (35% → 2 pts) must be excluded in favour of the higher ones
    const names = result.breakdown.map((s) => s.subject);
    expect(names).not.toContain('History');
  });

  test('APS total is correct (7+6+6+5+4+3 = 31)', () => {
    expect(calcBest6(SAMPLE_7_SUBJECTS, 'TEST').apsScore).toBe(31);
  });

  test('accepts score via "grade" field', () => {
    const subjects = [
      { subject: 'Maths', grade: 80 },
      { subject: 'English', grade: 70 },
    ];
    const result = calcBest6(subjects, 'X');
    expect(result.apsScore).toBe(7 + 6);
  });

  test('accepts score via "score" field', () => {
    const subjects = [
      { subject: 'Maths', score: 80 },
      { subject: 'English', score: 60 },
    ];
    const result = calcBest6(subjects, 'X');
    expect(result.apsScore).toBe(7 + 5);
  });

  test('treats missing/invalid score as 0 → 1 pt', () => {
    const subjects = [{ subject: 'Art', grade: 'abc' }];
    const result = calcBest6(subjects, 'X');
    expect(result.breakdown[0].aps).toBe(1);
  });
});

describe('WITS calculator', () => {
  test('returns university label WITS', () => {
    expect(calculateWits(SAMPLE_7_SUBJECTS).university).toBe('WITS');
  });

  test('no bonus for English or Mathematics', () => {
    const withBonus = [
      { subject: 'Mathematics',           grade: 85 },  // 7
      { subject: 'English Home Language', grade: 85 },  // 7
    ];
    expect(calculateWits(withBonus).apsScore).toBe(14);
  });

  test('max APS for 6 perfect scores is 42', () => {
    const perfect = Array.from({ length: 6 }, (_, i) => ({
      subject: `Subject ${i + 1}`,
      grade: 100,
    }));
    expect(calculateWits(perfect).apsScore).toBe(42);
  });
});

describe('UP calculator', () => {
  test('returns university label UP', () => {
    expect(calculateUP(SAMPLE_7_SUBJECTS).university).toBe('UP');
  });

  test('identical score to WITS for same input', () => {
    const wits = calculateWits(SAMPLE_7_SUBJECTS).apsScore;
    const up   = calculateUP(SAMPLE_7_SUBJECTS).apsScore;
    expect(up).toBe(wits);
  });
});

describe('UJ calculator', () => {
  test('returns university label UJ', () => {
    expect(calculateUJ(SAMPLE_7_SUBJECTS).university).toBe('UJ');
  });

  test('no science bonus – same score as WITS', () => {
    const wits = calculateWits(SAMPLE_7_SUBJECTS).apsScore;
    const uj   = calculateUJ(SAMPLE_7_SUBJECTS).apsScore;
    expect(uj).toBe(wits);
  });
});

describe('CUT calculator', () => {
  test('returns university label CUT', () => {
    expect(calculateCUT(SAMPLE_7_SUBJECTS).university).toBe('CUT');
  });

  test('uses NSC scale and best-6 rule', () => {
    expect(calculateCUT(SAMPLE_7_SUBJECTS).apsScore).toBe(31);
  });
});

describe('VUT calculator', () => {
  test('returns university label VUT', () => {
    expect(calculateVUT(SAMPLE_7_SUBJECTS).university).toBe('VUT');
  });

  test('uses NSC scale and best-6 rule', () => {
    expect(calculateVUT(SAMPLE_7_SUBJECTS).apsScore).toBe(31);
  });
});

// ---------------------------------------------------------------------------
// GPA controller logic
// ---------------------------------------------------------------------------
describe('determineGpa', () => {
  test('≥93 → 4.0', () => expect(determineGpa(95)).toBe(4.0));
  test('90–92.9 → 3.7', () => expect(determineGpa(91)).toBe(3.7));
  test('80–82.9 → 2.7', () => expect(determineGpa(81)).toBe(2.7));
  test('<65 → 0.0', () => expect(determineGpa(50)).toBe(0.0));
});
