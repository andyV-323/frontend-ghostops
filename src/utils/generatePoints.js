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
	if (Array.isArray(bounds) && Array.isArray(bounds[0])) {
		const [[minX, minY], [maxX, maxY]] = bounds;
		return p[0] >= minX && p[0] <= maxX && p[1] >= minY && p[1] <= maxY;
	}
	const { minX, minY, maxX, maxY } = bounds;
	return p[0] >= minX && p[0] <= maxX && p[1] >= minY && p[1] <= maxY;
};

const randomPointNearCenter = (center, minR, maxR) => {
	const angle = Math.random() * 2 * Math.PI;
	const r = Math.sqrt(Math.random()) * (maxR - minR) + minR;
	return [
		Math.round(center[0] + r * Math.cos(angle)),
		Math.round(center[1] + r * Math.sin(angle)),
	];
};

const minDistanceToAny = (p, points) => {
	if (!points?.length) return Infinity;
	let minD = Infinity;
	for (const q of points) minD = Math.min(minD, dist(p, q));
	return minD;
};

const isInForbidden = (p, forbiddenPoints) =>
	(forbiddenPoints || []).some((q) => samePoint(p, q));

const centroid = (points) => {
	const sum = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
	return [sum[0] / points.length, sum[1] / points.length];
};

/**
 * Generate infil/exfil/fallback points.
 *
 * - Infil:          near mission within infilRadius, >= 20 from mission coords
 * - Exfil:          near mission within exfilRadius, >= 10 from mission, >= 10 from infil
 * - Fallback Exfil: near mission within exfilRadius, >= 10 from exfil
 *
 * @param {Object} params
 * @param {Array}  params.bounds                  - [[minX,minY],[maxX,maxY]]
 * @param {Array}  params.missionCoordinates       - [x,y] or array of [x,y]
 * @param {Array}  [params.allProvinceCoordinates] - named location coords (exact collision check)
 * @param {number} [params.infilRadius=250]        - max distance from mission center for infil
 * @param {number} [params.exfilRadius=150]        - max distance from mission center for exfil/fallback
 * @param {number} [params.maxAttempts=5000]
 */
export const generateInsertionExtractionPoints = ({
	bounds,
	missionCoordinates,
	allProvinceCoordinates = [],
	infilRadius = 450,
	exfilRadius = 350,
	maxAttempts = 5000,
}) => {
	const missionPoints =
		Array.isArray(missionCoordinates?.[0]) ? missionCoordinates
		: missionCoordinates ? [missionCoordinates]
		: [];

	const missionCenter =
		missionPoints.length > 0 ?
			centroid(missionPoints)
		:	[bounds[1][0] / 2, bounds[1][1] / 2];

	const points = { infilPoint: null, exfilPoint: null, fallbackExfil: null };
	const used = [];

	const pickNear = (radius, predicate) => {
		for (let i = 0; i < maxAttempts; i++) {
			const p = randomPointNearCenter(missionCenter, 10, radius);
			if (used.some((u) => samePoint(u, p))) continue;
			if (isInForbidden(p, allProvinceCoordinates)) continue;
			if (!withinBounds(p, bounds)) continue;
			if (predicate(p)) {
				used.push(p);
				return p;
			}
		}
		return null;
	};

	// INFIL — within infilRadius, >= 20 from mission coords
	points.infilPoint = pickNear(
		infilRadius,
		(p) => minDistanceToAny(p, missionPoints) >= 20,
	);

	if (!points.infilPoint) {
		throw new Error(
			"Could not generate infilPoint. Try increasing infilRadius or maxAttempts.",
		);
	}

	// EXFIL — within exfilRadius, >= 10 from mission, >= 10 from infil
	points.exfilPoint = pickNear(
		exfilRadius,
		(p) =>
			minDistanceToAny(p, missionPoints) >= 10 &&
			dist(p, points.infilPoint) >= 10,
	);

	if (!points.exfilPoint) {
		throw new Error(
			"Could not generate exfilPoint. Try increasing exfilRadius or maxAttempts.",
		);
	}

	// FALLBACK EXFIL — within exfilRadius, >= 10 from exfil
	points.fallbackExfil = pickNear(
		exfilRadius,
		(p) => dist(p, points.exfilPoint) >= 10,
	);

	if (!points.fallbackExfil) {
		throw new Error(
			"Could not generate fallbackExfil. Try increasing exfilRadius or maxAttempts.",
		);
	}

	return points;
};
