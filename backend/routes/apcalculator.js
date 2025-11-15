const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { university, subjects } = req.body;
  if (!university || !subjects || !Array.isArray(subjects)) {
    return res.status(400).json({ error: "Missing or invalid parameters." });
  }

  switch (university.toUpperCase()) {
    case 'WITS':
      return res.json(calculateWits(subjects));
    case 'UP':
      return res.json(calculateUP(subjects));
    case 'UJ':
      return res.json(calculateUJ(subjects));
    case 'ALL':
      // return a simple map of university -> numeric aps score (frontend expects numeric values for charts)
      return res.json({
        WITS: calculateWits(subjects).apsScore,
        UP: calculateUP(subjects).apsScore,
        UJ: calculateUJ(subjects).apsScore,
      });
    default:
      return res.status(400).json({ error: 'Unsupported university: ' + university });
  }
});

// ---------------------
// Helper scoring functions (shared patterns)
// ---------------------
function baseAPS_WITS(score) {
  if (score >= 90) return 8;
  if (score >= 80) return 7;
  if (score >= 70) return 6;
  if (score >= 60) return 5;
  if (score >= 50) return 4;
  if (score >= 40) return 3;
  return 0;
}

function lifeOrientationAPS_WITS(score) {
  if (score >= 90) return 4;
  if (score >= 80) return 3;
  if (score >= 70) return 2;
  if (score >= 60) return 1;
  return 0;
}

function calculateWits(subjects) {
  function bonusForEnglishMath(score) {
    return score >= 60 ? 2 : 0;
  }

  const breakdown = subjects.map((subject) => {
    const name = subject.subject || subject.name || 'Unnamed Subject';
    const score = typeof subject.score === 'number' ? subject.score : (typeof subject.grade === 'number' ? subject.grade : Number(subject.score || subject.grade) || 0);
    const lower = name.toLowerCase();

    let aps = 0;
    if (lower.includes('life orientation') || lower.includes('life orientation')) {
      aps = lifeOrientationAPS_WITS(score);
    } else {
      aps = baseAPS_WITS(score);
      if (lower.includes('english') || lower.includes('math') || lower.includes('mathematics')) {
        aps += bonusForEnglishMath(score);
      }
    }
    return { subject: name, score, aps };
  });

  const best7 = breakdown.sort((a, b) => b.aps - a.aps).slice(0, 7);
  const total = best7.reduce((sum, s) => sum + s.aps, 0);

  return {
    university: 'WITS',
    apsScore: total,
    breakdown: best7,
  };
}

// ---------------------
// UP calculation (slightly different scale example)
// ---------------------
function calculateUP(subjects) {
  // UP uses the same bands but no extra bonus for English/Math in this simplified implementation
  const breakdown = subjects.map((subject) => {
    const name = subject.subject || subject.name || 'Unnamed Subject';
    const score = typeof subject.score === 'number' ? subject.score : (typeof subject.grade === 'number' ? subject.grade : Number(subject.score || subject.grade) || 0);
    let aps = 0;
    if (name.toLowerCase().includes('life orientation')) {
      aps = lifeOrientationAPS_WITS(score);
    } else {
      aps = baseAPS_WITS(score);
    }
    return { subject: name, score, aps };
  });

  const best7 = breakdown.sort((a, b) => b.aps - a.aps).slice(0, 7);
  const total = best7.reduce((sum, s) => sum + s.aps, 0);

  return {
    university: 'UP',
    apsScore: total,
    breakdown: best7,
  };
}

// ---------------------
// UJ calculation (example: slightly different mapping)
// ---------------------
function calculateUJ(subjects) {
  // For UJ we'll slightly weight sciences a bit higher in this example
  const breakdown = subjects.map((subject) => {
    const name = subject.subject || subject.name || 'Unnamed Subject';
    const score = typeof subject.score === 'number' ? subject.score : (typeof subject.grade === 'number' ? subject.grade : Number(subject.score || subject.grade) || 0);
    const lower = name.toLowerCase();

    let aps = baseAPS_WITS(score);
    if (lower.includes('science') || lower.includes('physical') || lower.includes('life')) {
      // small bump for science subjects
      aps = Math.min(8, aps + (score >= 70 ? 1 : 0));
    }
    return { subject: name, score, aps };
  });

  const best7 = breakdown.sort((a, b) => b.aps - a.aps).slice(0, 7);
  const total = best7.reduce((sum, s) => sum + s.aps, 0);

  return {
    university: 'UJ',
    apsScore: total,
    breakdown: best7,
  };
}

module.exports = router;
