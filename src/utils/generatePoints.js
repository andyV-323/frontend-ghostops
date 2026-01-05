// src/utils/generatePoints.js

const randBetween = (min, max) => Math.random() * (max - min) + min;

const dist = (a, b) => {
	const dx = a[0] - b[0];
	const dy = a[1] - b[1];
	return Math.sqrt(dx * dx + dy * dy);
};

const samePoint = (a, b, eps = 1e-9) =>
	Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps;

const withinBounds = (p, bounds) => {
	// supports common Leaflet-like formats:
	// bounds: [[minX, minY], [maxX, maxY]] OR { minX, minY, maxX, maxY }
	if (Array.isArray(bounds) && Array.isArray(bounds[0])) {
		const [[minX, minY], [maxX, maxY]] = bounds;
		return p[0] >= minX && p[0] <= maxX && p[1] >= minY && p[1] <= maxY;
	}
	const { minX, minY, maxX, maxY } = bounds;
	return p[0] >= minX && p[0] <= maxX && p[1] >= minY && p[1] <= maxY;
};

const randomPointInBounds = (bounds) => {
	if (Array.isArray(bounds) && Array.isArray(bounds[0])) {
		const [[minX, minY], [maxX, maxY]] = bounds;
		return [randBetween(minX, maxX), randBetween(minY, maxY)];
	}
	const { minX, minY, maxX, maxY } = bounds;
	return [randBetween(minX, maxX), randBetween(minY, maxY)];
};

const minDistanceToAny = (p, points) => {
	if (!points?.length) return Infinity;
	let minD = Infinity;
	for (const q of points) {
		minD = Math.min(minD, dist(p, q));
	}
	return minD;
};

const isInForbidden = (p, forbiddenPoints) =>
	(forbiddenPoints || []).some((q) => samePoint(p, q));

/**
 * Generate infil/exfil/fallback points without AI.
 *
 * @param {Object} params
 * @param {Array} params.bounds - [[minX,minY],[maxX,maxY]] or {minX,minY,maxX,maxY}
 * @param {Array} params.missionCoordinates - [x,y] OR array of [x,y] points
 * @param {Array} params.allProvinceCoordinates - array of [x,y] points
 * @param {number} [params.maxAttempts=5000]
 */
export const generateInsertionExtractionPoints = ({
	bounds,
	missionCoordinates,
	allProvinceCoordinates = [],
	maxAttempts = 5000,
}) => {
	const missionPoints = Array.isArray(missionCoordinates?.[0])
		? missionCoordinates
		: missionCoordinates
		? [missionCoordinates]
		: [];

	// Your rules:
	// infil >= 20 from missionCoordinates AND 30 from allProvinceCoordinates
	// exfil >= 10 from missionCoordinates AND infil
	// fallback >= 10 from infil
	const points = {
		infilPoint: null,
		exfilPoint: null,
		fallbackExfil: null,
	};

	const used = [];

	const pickPoint = (predicate) => {
		for (let i = 0; i < maxAttempts; i++) {
			const p = randomPointInBounds(bounds);

			// keep uniqueness
			if (used.some((u) => samePoint(u, p))) continue;

			// cannot match province coordinates exactly
			if (isInForbidden(p, allProvinceCoordinates)) continue;

			// must be inside bounds
			if (!withinBounds(p, bounds)) continue;

			if (predicate(p)) {
				used.push(p);
				return p;
			}
		}
		return null;
	};

	// INFIL
	points.infilPoint = pickPoint((p) => {
		const dMission = minDistanceToAny(p, missionPoints);
		// Only enforce "can't match any province location" (exact match),
		// NOT "must be 30 units away from all locations"
		return dMission >= 20 && !isInForbidden(p, allProvinceCoordinates);
	});

	if (!points.infilPoint) {
		throw new Error(
			"Could not generate infilPoint with current constraints. Consider relaxing distances or increasing maxAttempts."
		);
	}

	// EXFIL
	points.exfilPoint = pickPoint((p) => {
		const dMission = minDistanceToAny(p, missionPoints);
		const dInfil = dist(p, points.infilPoint);
		return dMission >= 10 && dInfil >= 10;
	});

	if (!points.exfilPoint) {
		throw new Error(
			"Could not generate exfilPoint with current constraints. Consider relaxing distances or increasing maxAttempts."
		);
	}

	// FALLBACK EXFIL (RALLY)
	points.fallbackExfil = pickPoint((p) => {
		const dInfil = dist(p, points.infilPoint);
		return dInfil >= 10;
	});

	if (!points.fallbackExfil) {
		throw new Error(
			"Could not generate fallbackExfil with current constraints. Consider relaxing distances or increasing maxAttempts."
		);
	}

	return points;
};
