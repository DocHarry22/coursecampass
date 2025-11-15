// Helper formulas for APS and simple GPA conversions

export function percentToApsWits(score) {
	const s = Number(score) || 0;
	if (s >= 90) return 8;
	if (s >= 80) return 7;
	if (s >= 70) return 6;
	if (s >= 60) return 5;
	if (s >= 50) return 4;
	if (s >= 40) return 3;
	return 0;
}

export function percentToApsUp(score) {
	// For UP use the same base bands in this simplified helper
	return percentToApsWits(score);
}

export function percentToApsUj(score) {
	// UJ: same base, small bump for sciences (not enforced here)
	return percentToApsWits(score);
}

export function percentToGpa(score) {
	const s = Number(score) || 0;
	if (s >= 80) return 4.0;
	if (s >= 70) return 3.0;
	if (s >= 60) return 2.0;
	if (s >= 50) return 1.0;
	return 0.0;
}

export default { percentToApsWits, percentToApsUp, percentToApsUj, percentToGpa };
