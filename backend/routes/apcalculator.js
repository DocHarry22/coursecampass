// backend/routes/calculate.js
const express = require('express');
const router = express.Router();

// Example APS calculation scales
const apsScales = {
  wits: score => (score >= 90 ? 8 : score >= 80 ? 7 : score >= 70 ? 6 : score >= 60 ? 5 : score >= 50 ? 4 : score >= 40 ? 3 : score >= 30 ? 2 : 0),
  up: score => (score >= 90 ? 8 : score >= 80 ? 7 : score >= 70 ? 6 : score >= 60 ? 5 : score >= 50 ? 4 : score >= 40 ? 3 : score >= 30 ? 1 : 0),
  uj: score => (score >= 80 ? 7 : score >= 70 ? 6 : score >= 60 ? 5 : score >= 50 ? 4 : score >= 40 ? 3 : score >= 30 ? 2 : 0),
  uct: score => (score >= 90 ? 8 : score >= 80 ? 7 : score >= 70 ? 6 : score >= 60 ? 5 : score >= 50 ? 4 : score >= 40 ? 3 : score >= 30 ? 2 : 1),
  sun: score => (score >= 80 ? 7 : score >= 70 ? 6 : score >= 60 ? 5 : score >= 50 ? 4 : score >= 40 ? 3 : score >= 30 ? 2 : 1)
};

router.post('/calculate', (req, res) => {
  const { subjects, university } = req.body;

  if (!Array.isArray(subjects)) {
    return res.status(400).json({ error: 'Subjects must be an array' });
  }

  const calculateAPS = (scaleFn) => {
    return subjects.reduce((total, { grade }) => {
      const score = parseFloat(grade);
      return total + (isNaN(score) ? 0 : scaleFn(score));
    }, 0);
  };

  if (university === 'all') {
    const result = {};
    for (const [uniKey, scaleFn] of Object.entries(apsScales)) {
      result[uniKey] = calculateAPS(scaleFn);
    }
    return res.json(result);
  }

  if (!apsScales[university]) {
    return res.status(400).json({ error: 'Unsupported university' });
  }

  const apsScore = calculateAPS(apsScales[university]);
  res.json({ apsScore });
});

module.exports = router;
