// Helper formulas for APS and GPA conversions
// All SA universities below use the official NSC achievement-level scale:
//   80-100 % → 7 pts | 70-79 % → 6 pts | 60-69 % → 5 pts
//   50-59 % → 4 pts  | 40-49 % → 3 pts  | 30-39 % → 2 pts | 0-29 % → 1 pt
// Life Orientation is excluded from the APS count.

/**
 * Convert a percentage mark to an NSC APS point (1-7).
 * Used by WITS, UP, UJ, CUT and VUT – they all follow the same official
 * NSC achievement-level bands.
 */
export function percentToNscAps(score) {
	const s = Number(score) || 0;
	if (s >= 80) return 7;
	if (s >= 70) return 6;
	if (s >= 60) return 5;
	if (s >= 50) return 4;
	if (s >= 40) return 3;
	if (s >= 30) return 2;
	return 1;
}

// University-specific helpers (all delegate to the shared NSC scale)
export const percentToApsWits = percentToNscAps;
export const percentToApsUp   = percentToNscAps;
export const percentToApsUj   = percentToNscAps;
export const percentToApsCut  = percentToNscAps;
export const percentToApsVut  = percentToNscAps;

/**
 * Convert an average percentage to a 4.0 GPA for the on-screen snapshot.
 * Uses a simplified 10-point-interval ladder that aligns with the backend
 * GPA controller's detailed scale.
 */
export function percentToGpa(score) {
	const s = Number(score) || 0;
	if (s >= 93) return 4.0;
	if (s >= 90) return 3.7;
	if (s >= 87) return 3.3;
	if (s >= 83) return 3.0;
	if (s >= 80) return 2.7;
	if (s >= 77) return 2.3;
	if (s >= 73) return 2.0;
	if (s >= 70) return 1.7;
	if (s >= 67) return 1.3;
	if (s >= 65) return 1.0;
	return 0.0;
}

const apsFormulas = { percentToNscAps, percentToApsWits, percentToApsUp, percentToApsUj, percentToApsCut, percentToApsVut, percentToGpa };
export default apsFormulas;
