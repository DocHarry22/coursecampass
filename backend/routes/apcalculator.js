const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { university, subjects } = req.body;
  if (!university || !subjects || !Array.isArray(subjects)) {
    return res.status(400).json({ error: 'Missing or invalid parameters.' });
  }

  const key = university.toLowerCase();
  switch (key) {
    case 'wits': return res.json(calculateWits(subjects));
    case 'up':   return res.json(calculateUP(subjects));
    case 'uj':   return res.json(calculateUJ(subjects));
    case 'cut':  return res.json(calculateCUT(subjects));
    case 'vut':  return res.json(calculateVUT(subjects));
    case 'all':
      return res.json({
        WITS: calculateWits(subjects).apsScore,
        UP:   calculateUP(subjects).apsScore,
        UJ:   calculateUJ(subjects).apsScore,
        CUT:  calculateCUT(subjects).apsScore,
        VUT:  calculateVUT(subjects).apsScore,
      });
    default:
      return res.status(400).json({ error: 'Unsupported university: ' + university });
  }
});

// ---------------------------------------------------------------------------
// Official SA NSC achievement-level APS bands (all universities below)
// 80-100 → 7 | 70-79 → 6 | 60-69 → 5 | 50-59 → 4
// 40-49  → 3 | 30-39 → 2 | 0-29  → 1
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

/**
 * Generic best-6 NSC APS calculator.
 * Life Orientation is excluded (per official rules for all listed institutions).
 * @param {Array}  subjects   – subject objects
 * @param {string} uniLabel   – label for the response
 * @param {Function} [apsFn]  – optional override for the point function
 */
function calcBest6(subjects, uniLabel, apsFn = nscAps) {
  const breakdown = subjects
    .filter((s) => !isLifeOrientation(extractName(s)))
    .map((s) => {
      const name  = extractName(s);
      const score = extractScore(s);
      return { subject: name, score, aps: apsFn(score) };
    });

  const best6  = breakdown.sort((a, b) => b.aps - a.aps).slice(0, 6);
  const total  = best6.reduce((sum, s) => sum + s.aps, 0);

  return { university: uniLabel, apsScore: total, breakdown: best6 };
}

// ---------------------------------------------------------------------------
// University calculators
// All four institutions use the identical NSC achievement-level scale and
// the best-6-subjects rule (Life Orientation excluded).
// ---------------------------------------------------------------------------

function calculateWits(subjects) {
  return calcBest6(subjects, 'WITS');
}

function calculateUP(subjects) {
  return calcBest6(subjects, 'UP');
}

function calculateUJ(subjects) {
  return calcBest6(subjects, 'UJ');
}

function calculateCUT(subjects) {
  return calcBest6(subjects, 'CUT');
}

function calculateVUT(subjects) {
  return calcBest6(subjects, 'VUT');
}

module.exports = router;
