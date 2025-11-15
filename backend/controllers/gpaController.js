const VALID_SCORE_MIN = 0;
const VALID_SCORE_MAX = 100;

const GPA_SCALE = [
	{ min: 93, gpa: 4.0 },
	{ min: 90, gpa: 3.7 },
	{ min: 87, gpa: 3.3 },
	{ min: 83, gpa: 3.0 },
	{ min: 80, gpa: 2.7 },
	{ min: 77, gpa: 2.3 },
	{ min: 73, gpa: 2.0 },
	{ min: 70, gpa: 1.7 },
	{ min: 67, gpa: 1.3 },
	{ min: 65, gpa: 1.0 },
];

const normalizeScore = (subject, index) => {
	if (typeof subject !== 'object' || subject === null) {
		throw new Error(`Subject at index ${index} must be an object`);
	}

	const value = subject.score ?? subject.grade;
	const numericValue = typeof value === 'number' ? value : Number(value);

	if (!Number.isFinite(numericValue)) {
		throw new Error(`Subject at index ${index} must contain a numeric score or grade`);
	}

	if (numericValue < VALID_SCORE_MIN || numericValue > VALID_SCORE_MAX) {
		throw new Error(
			`Score for subject at index ${index} must be between ${VALID_SCORE_MIN} and ${VALID_SCORE_MAX}`
		);
	}

	return numericValue;
};

const determineGpa = (average) => {
	const matchingScale = GPA_SCALE.find((scale) => average >= scale.min);
	return matchingScale ? matchingScale.gpa : 0.0;
};

const calculateGpa = (req, res) => {
	const { subjects } = req.body || {};

	if (!Array.isArray(subjects) || subjects.length === 0) {
		return res.status(400).json({ error: 'Request body must include a non-empty subjects array' });
	}

	let scores;
	try {
		scores = subjects.map(normalizeScore);
	} catch (error) {
		return res.status(422).json({ error: error.message });
	}

	if (scores.length === 0) {
		return res
			.status(400)
			.json({ error: 'Request body must include at least one subject with a valid score' });
	}

	const sum = scores.reduce((acc, current) => acc + current, 0);
	const average = sum / scores.length;
	const gpa = determineGpa(average);

	return res.json({
		average: Math.round(average * 100) / 100,
		gpa,
	});
};

module.exports = { calculateGpa };
