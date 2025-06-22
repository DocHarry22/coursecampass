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
      return res.json({
        WITS: calculateWits(subjects),
        UP: calculateUP(subjects),
        UJ: calculateUJ(subjects)
      });
    default:
      return res.status(400).json({ error: 'Unsupported university: ' + university });
  }
});

// ---------------------
// WITS CALCULATION LOGIC
// ---------------------
function calculateWits(subjects) {
  function baseAPS(score) {
    if (score >= 90) return 8;
    if (score >= 80) return 7;
    if (score >= 70) return 6;
    if (score >= 60) return 5;
    if (score >= 50) return 4;
    if (score >= 40) return 3;
    return 0;
  }

  function bonusForEnglishMath(score) {
    return score >= 60 ? 2 : 0;
  }

  function lifeOrientationAPS(score) {
    if (score >= 90) return 4;
    if (score >= 80) return 3;
    if (score >= 70) return 2;
    if (score >= 60) return 1;
    return 0;
  }

  const breakdown = subjects.map(({ name, score }) => {
    const lower = name.toLowerCase();
    let aps = 0;
    if (lower.includes('life orientation')) {
      aps = lifeOrientationAPS(score);
    } else {
      aps = baseAPS(score);
      if (lower.includes('english') || lower.includes('math')) {
        aps += bonusForEnglishMath(score);
      }
    }
    return { subject: name, score, aps };
  });

  const best7 = breakdown.sort((a, b) => b.aps - a.aps).slice(0, 7);
  const total = best7.reduce((sum, s) => sum + s.aps, 0);

  return {
    university: 'Wits',
    totalAPS: total,
    breakdown: best7
  };
}

// ---------------------
// Placeholder for UP logic
// ---------------------
function calculateUP(subjects) {
  return {
    university: 'UP',
    totalAPS: 0,
    breakdown: [],
    note: 'UP APS calculator logic coming soon.'
  };
}

// ---------------------
// Placeholder for UJ logic
// ---------------------
function calculateUJ(subjects) {
  return {
    university: 'UJ',
    totalAPS: 0,
    breakdown: [],
    note: 'UJ APS calculator logic coming soon.'
  };
}

module.exports = router;
