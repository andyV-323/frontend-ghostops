// ─────────────────────────────────────────────────────────────────────────────
// GeneratePoints.js
// Deterministic algorithm for infil / exfil / rally point generation.
// Replaces AI for point placement — zero API cost, instant, no hallucinations.
//
// Usage:
//   import { generatePoints } from './GeneratePoints';
//   const { infilPoint, infilMethod, exfilPoint, exfilMethod, rallyPoint, approachVector }
//     = generatePoints({ missionType, terrain, objectives });
// ─────────────────────────────────────────────────────────────────────────────

// ─── Constants ───────────────────────────────────────────────────────────────

const MAP_BOUNDS = {
	rowMin: 40,
	rowMax: 728,
	colMin: 40,
	colMax: 1326,
};

// Minimum distances (in map units)
const MIN_INFIL_FROM_OBJ = 200;
const MIN_EXFIL_FROM_OBJ = 150;
const MIN_EXFIL_FROM_INFIL = 200;
const RALLY_RATIO_MIN = 0.4; // 40% of the way from infil to nearest obj
const RALLY_RATIO_MAX = 0.6; // 60% of the way
const RALLY_LATERAL_MAX = 80; // max lateral offset from direct line
const MAX_PLACEMENT_TRIES = 60; // retry cap before fallback

// ─── Mission type classification ─────────────────────────────────────────────

// Missions that REQUIRE high-capacity exfil (helicopter or vehicle)
// because they involve a prisoner, hostage, or recovered person.
const HEAVY_EXFIL_MISSIONS = new Set([
	"DA_SNATCH",
	"CT_HOSTAGE",
	"CT_RECOVERY",
]);

// SR missions: no-contact, low-signature only. LOADOUT is null.
const SR_MISSIONS = new Set(["SR_AREA", "SR_POINT", "SR_BDA"]);

// Missions where vehicle infil makes doctrinal sense
const VEHICLE_OK_INFIL = new Set([
	"DA_CONVOY",
	"DA_SABOTAGE",
	"OW_RESUPPLY",
	"DA_RAID",
]);

// ─── Seeded random (deterministic per call, varies per invocation) ────────────
// Using a simple LCG so placement is reproducible if you pass a seed,
// or random if no seed provided.

function makePRNG(seed) {
	let s = seed !== undefined ? seed : Math.floor(Math.random() * 2 ** 32);
	return function () {
		s = (Math.imul(1664525, s) + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

// ─── Geometry helpers ────────────────────────────────────────────────────────

function dist(a, b) {
	return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

function centroid(points) {
	const r = points.reduce((s, p) => [s[0] + p[0], s[1] + p[1]], [0, 0]);
	return [r[0] / points.length, r[1] / points.length];
}

function clampPoint(row, col) {
	return [
		Math.round(Math.max(MAP_BOUNDS.rowMin, Math.min(MAP_BOUNDS.rowMax, row))),
		Math.round(Math.max(MAP_BOUNDS.colMin, Math.min(MAP_BOUNDS.colMax, col))),
	];
}

// Random point inside a bounds rectangle [[r0,c0],[r1,c1]]
function randInRect(bounds, rng) {
	const r0 = bounds[0][0],
		c0 = bounds[0][1];
	const r1 = bounds[1][0],
		c1 = bounds[1][1];
	return clampPoint(r0 + rng() * (r1 - r0), c0 + rng() * (c1 - c0));
}

// Random point anywhere on the map, away from all objectives by minDist
function randMapPoint(minDistFromObjs, objectives, rng) {
	for (let i = 0; i < MAX_PLACEMENT_TRIES; i++) {
		const pt = clampPoint(
			MAP_BOUNDS.rowMin + rng() * (MAP_BOUNDS.rowMax - MAP_BOUNDS.rowMin),
			MAP_BOUNDS.colMin + rng() * (MAP_BOUNDS.colMax - MAP_BOUNDS.colMin),
		);
		if (objectives.every((obj) => dist(pt, obj) >= minDistFromObjs)) return pt;
	}
	// Fallback: push to map corner furthest from objective centroid
	const c = centroid(objectives);
	const corners = [
		[MAP_BOUNDS.rowMin, MAP_BOUNDS.colMin],
		[MAP_BOUNDS.rowMin, MAP_BOUNDS.colMax],
		[MAP_BOUNDS.rowMax, MAP_BOUNDS.colMin],
		[MAP_BOUNDS.rowMax, MAP_BOUNDS.colMax],
	];
	return corners.reduce((best, pt) =>
		dist(pt, c) > dist(best, c) ? pt : best,
	);
}

// ─── Infil method selection ───────────────────────────────────────────────────

function selectInfilMethod({ missionType, terrain, rng }) {
	const isSR = SR_MISSIONS.has(missionType);
	const hasCoast = terrain.hasCoast && terrain.coastZones?.length > 0;
	const hasRoads = terrain.hasRoads;
	const isIsland = terrain.isIsland;
	const vehicleOk = VEHICLE_OK_INFIL.has(missionType) && hasRoads && !isSR;

	// SR missions: always low-signature
	if (isSR) {
		const srOptions = ["On foot"];
		if (hasCoast) srOptions.push("Boat / water insertion");
		return srOptions[Math.floor(rng() * srOptions.length)];
	}

	// Heavy exfil missions: covert infil only (no vehicles on infil)
	if (HEAVY_EXFIL_MISSIONS.has(missionType)) {
		const options = ["HALO jump", "LALO parachute", "On foot"];
		if (hasCoast && !isIsland) options.push("Boat / water insertion");
		if (hasCoast && isIsland)
			options.push("Boat / water insertion", "Boat / water insertion"); // weight up for islands
		return options[Math.floor(rng() * options.length)];
	}

	const pool = [];

	// HALO is the default for almost everything — weight it heavily
	pool.push("HALO jump", "HALO jump", "HALO jump");

	// LALO for terrain masking situations
	pool.push("LALO parachute", "LALO parachute");

	// Boat only when coast exists — weight up for islands since it's the obvious choice
	if (hasCoast) {
		pool.push("Boat / water insertion");
		if (isIsland) pool.push("Boat / water insertion", "Boat / water insertion");
	}

	// Helo inserts for specific assault mission types only
	if (["DA_RAID", "DA_ELIMINATION", "CT_STRIKE"].includes(missionType)) {
		pool.push("Helicopter fast rope", "Small bird assault insert");
	}

	// Vehicle only when doctrine explicitly supports it
	if (vehicleOk) pool.push("Ground vehicle");

	// On foot for short distances or urban blend-in
	if (["OW_OVERWATCH", "CT_STRIKE"].includes(missionType)) {
		pool.push("On foot", "On foot");
	} else {
		pool.push("On foot");
	}
	return pool[Math.floor(rng() * pool.length)];
}

// ─── Exfil method selection ───────────────────────────────────────────────────

function selectExfilMethod({ missionType, infilMethod, terrain, rng }) {
	const isSR = SR_MISSIONS.has(missionType);
	const hasCoast = terrain.hasCoast && terrain.coastZones?.length > 0;
	const hasRoads = terrain.hasRoads;

	// SR: must match infil low-sig method
	if (isSR) return infilMethod;

	// Prisoner/hostage/recovery: MUST be high-capacity
	if (HEAVY_EXFIL_MISSIONS.has(missionType)) {
		const options = ["Helicopter extract"];
		if (hasRoads) options.push("Vehicle convoy");
		// Must differ from infil for these mission types
		const filtered = options.filter((o) => o !== infilMethod);
		const pool = filtered.length > 0 ? filtered : options;
		return pool[Math.floor(rng() * pool.length)];
	}

	// All others: build pool, prefer different axis from infil
	const pool = [];

	pool.push("HALO jump");
	if (hasCoast) pool.push("Boat / water insertion");
	if (hasRoads) pool.push("Ground vehicle");
	pool.push("On foot", "Helicopter extract");

	// Slightly prefer methods different from infil for variety
	const diffPool = pool.filter((o) => o !== infilMethod);
	const finalPool = diffPool.length >= 2 ? diffPool : pool;

	return finalPool[Math.floor(rng() * finalPool.length)];
}

// ─── Infil point placement ────────────────────────────────────────────────────

function placeInfilPoint({ infilMethod, terrain, objectives, rng }) {
	const isBoat = infilMethod === "Boat / water insertion";
	const isVehicle = infilMethod === "Ground vehicle";

	// Boat: must land inside a valid coastZone
	if (isBoat && terrain.hasCoast && terrain.coastZones?.length) {
		const zones = terrain.coastZones;
		for (let i = 0; i < MAX_PLACEMENT_TRIES; i++) {
			const zone = zones[Math.floor(rng() * zones.length)];
			const pt = randInRect(zone.bounds, rng);
			if (objectives.every((obj) => dist(pt, obj) >= MIN_INFIL_FROM_OBJ))
				return pt;
		}
	}

	// Vehicle: near map edge, roads exist
	if (isVehicle && terrain.hasRoads) {
		// Pick a random edge side
		const side = Math.floor(rng() * 4);
		for (let i = 0; i < MAX_PLACEMENT_TRIES; i++) {
			let pt;
			if (side === 0)
				pt = clampPoint(
					MAP_BOUNDS.rowMin + rng() * 60,
					MAP_BOUNDS.colMin + rng() * (MAP_BOUNDS.colMax - MAP_BOUNDS.colMin),
				);
			else if (side === 1)
				pt = clampPoint(
					MAP_BOUNDS.rowMax - rng() * 60,
					MAP_BOUNDS.colMin + rng() * (MAP_BOUNDS.colMax - MAP_BOUNDS.colMin),
				);
			else if (side === 2)
				pt = clampPoint(
					MAP_BOUNDS.rowMin + rng() * (MAP_BOUNDS.rowMax - MAP_BOUNDS.rowMin),
					MAP_BOUNDS.colMin + rng() * 60,
				);
			else
				pt = clampPoint(
					MAP_BOUNDS.rowMin + rng() * (MAP_BOUNDS.rowMax - MAP_BOUNDS.rowMin),
					MAP_BOUNDS.colMax - rng() * 60,
				);
			if (objectives.every((obj) => dist(pt, obj) >= MIN_INFIL_FROM_OBJ))
				return pt;
		}
	}

	// HALO/foot/helo: random map point with distance constraint
	return randMapPoint(MIN_INFIL_FROM_OBJ, objectives, rng);
}

// ─── Exfil point placement ────────────────────────────────────────────────────

function placeExfilPoint({
	exfilMethod,
	infilPoint,
	terrain,
	objectives,
	rng,
}) {
	const objCentroid = centroid(objectives);

	// Vector from infil through centroid — exfil goes to the far side
	const vecR = objCentroid[0] - infilPoint[0];
	const vecC = objCentroid[1] - infilPoint[1];
	const len = Math.sqrt(vecR ** 2 + vecC ** 2) || 1;
	const normR = vecR / len;
	const normC = vecC / len;

	// Project 150-300 units past the centroid on the far side
	const isBoat = exfilMethod === "Boat / water insertion";

	if (isBoat && terrain.hasCoast && terrain.coastZones?.length) {
		// For boat exfil, try to find a coast zone on the far side of the objectives
		const zones = terrain.coastZones;
		for (let i = 0; i < MAX_PLACEMENT_TRIES; i++) {
			const zone = zones[Math.floor(rng() * zones.length)];
			const pt = randInRect(zone.bounds, rng);
			const farFromInfil = dist(pt, infilPoint) >= MIN_EXFIL_FROM_INFIL;
			const farFromObjs = objectives.every(
				(obj) => dist(pt, obj) >= MIN_EXFIL_FROM_OBJ,
			);
			if (farFromInfil && farFromObjs) return pt;
		}
	}

	// Default: project past centroid with random distance variance
	for (let i = 0; i < MAX_PLACEMENT_TRIES; i++) {
		const projection = 150 + rng() * 200; // 150–350 units past centroid
		const lateralOff = (rng() - 0.5) * 120; // small lateral scatter
		const perpR = -normC; // perpendicular
		const perpC = normR;
		const row = objCentroid[0] + normR * projection + perpR * lateralOff;
		const col = objCentroid[1] + normC * projection + perpC * lateralOff;
		const pt = clampPoint(row, col);
		const farFromInfil = dist(pt, infilPoint) >= MIN_EXFIL_FROM_INFIL;
		const farFromObjs = objectives.every(
			(obj) => dist(pt, obj) >= MIN_EXFIL_FROM_OBJ,
		);
		if (farFromInfil && farFromObjs) return pt;
	}

	// Last resort fallback
	return randMapPoint(MIN_EXFIL_FROM_OBJ, objectives, rng);
}

// ─── Rally point placement ────────────────────────────────────────────────────

function placeRallyPoint({ infilPoint, objectives, rng }) {
	// Find nearest objective to infil
	const nearest = objectives.reduce(
		(best, obj) =>
			dist(infilPoint, obj) < dist(infilPoint, best) ? obj : best,
		objectives[0],
	);

	// Interpolate 40-60% of the way from infil to nearest obj
	const ratio = RALLY_RATIO_MIN + rng() * (RALLY_RATIO_MAX - RALLY_RATIO_MIN);
	const midR = infilPoint[0] + (nearest[0] - infilPoint[0]) * ratio;
	const midC = infilPoint[1] + (nearest[1] - infilPoint[1]) * ratio;

	// Add lateral offset so it's not on the direct line
	const lateral = (rng() - 0.5) * 2 * RALLY_LATERAL_MAX;
	const vecR = nearest[0] - infilPoint[0];
	const vecC = nearest[1] - infilPoint[1];
	const len = Math.sqrt(vecR ** 2 + vecC ** 2) || 1;
	const perpR = -vecC / len;
	const perpC = vecR / len;

	return clampPoint(midR + perpR * lateral, midC + perpC * lateral);
}

// ─── Approach vector description ─────────────────────────────────────────────

function describeApproachVector(infilPoint, objectives, infilMethod, terrain) {
	const objCentroid = centroid(objectives);
	const deltaR = objCentroid[0] - infilPoint[0];
	const deltaC = objCentroid[1] - infilPoint[1];

	// Cardinal direction of approach
	const absR = Math.abs(deltaR);
	const absC = Math.abs(deltaC);
	let dir;
	if (absR > absC * 2) dir = deltaR > 0 ? "south" : "north";
	else if (absC > absR * 2) dir = deltaC > 0 ? "east" : "west";
	else if (deltaR > 0) dir = deltaC > 0 ? "southeast" : "southwest";
	else dir = deltaC > 0 ? "northeast" : "northwest";

	const methodDesc =
		{
			"HALO jump": "High-altitude freefall approach from the",
			"LALO parachute": "Low-altitude terrain-masking approach from the",
			"Helicopter fast rope": "Fast-rope insert via helicopter from the",
			"Small bird assault insert": "Low-signature small bird insert from the",
			"Boat / water insertion": "Maritime approach via waterway from the",
			"Ground vehicle": "Ground vehicle approach along road axis from the",
			"On foot": "Foot approach under cover from the",
			"Helicopter extract": "Helicopter extract approach from the",
		}[infilMethod] || "Approach from the";

	const biomeDesc =
		terrain.notes ?
			` through ${terrain.notes.split(".")[0].toLowerCase()}.`
		:	".";

	return `${methodDesc} ${dir}${biomeDesc}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * generatePoints
 *
 * @param {object} params
 * @param {string}   params.missionType   - Mission type ID (e.g. 'DA_RAID', 'SR_AREA')
 * @param {object}   params.terrain       - Province terrain config object from PROVINCE_TERRAIN
 * @param {Array}    params.objectives    - Array of { coordinates: [row, col] } or [[row,col], ...]
 * @param {number}   [params.seed]        - Optional seed for reproducible output
 *
 * @returns {{
 *   infilPoint:     [number, number],
 *   infilMethod:    string,
 *   exfilPoint:     [number, number],
 *   exfilMethod:    string,
 *   rallyPoint:     [number, number],
 *   approachVector: string,
 * }}
 */
export function GeneratePointsOnMap({
	missionType,
	terrain,
	objectives,
	seed,
}) {
	const rng = makePRNG(seed);

	// Normalize objectives to [row, col] tuples
	const objCoords = objectives.map((o) =>
		Array.isArray(o) ? o : o.coordinates,
	);

	if (!objCoords.length) {
		throw new Error("generatePoints: at least one objective is required");
	}

	// ── Step 1: Select methods ────────────────────────────────────────────────
	const infilMethod = selectInfilMethod({ missionType, terrain, rng });
	const exfilMethod = selectExfilMethod({
		missionType,
		infilMethod,
		terrain,
		rng,
	});

	// ── Step 2: Place infil ───────────────────────────────────────────────────
	const infilPoint = placeInfilPoint({
		infilMethod,
		terrain,
		objectives: objCoords,
		rng,
	});

	// ── Step 3: Place exfil ───────────────────────────────────────────────────
	const exfilPoint = placeExfilPoint({
		exfilMethod,
		infilPoint,
		terrain,
		objectives: objCoords,
		rng,
	});

	// ── Step 4: Place rally ───────────────────────────────────────────────────
	const rallyPoint = placeRallyPoint({
		infilPoint,
		objectives: objCoords,
		rng,
	});

	// ── Step 5: Approach vector description ───────────────────────────────────
	const approachVector = describeApproachVector(
		infilPoint,
		objCoords,
		infilMethod,
		terrain,
	);

	return {
		infilPoint,
		infilMethod,
		exfilPoint,
		exfilMethod,
		rallyPoint,
		approachVector,
	};
}

// ─── Convenience: generate multiple variants ─────────────────────────────────
// Useful if you want to show the player 2-3 insertion options to choose from.

/**
 * generatePointVariants
 * Returns N distinct point sets for the same mission parameters.
 * Each variant uses a different random seed so placement differs.
 *
 * @param {object} params  - Same as generatePoints params (without seed)
 * @param {number} count   - Number of variants to generate (default 3)
 * @returns {Array}        - Array of generatePoints results
 */
export function generatePointVariants(params, count = 3) {
	return Array.from({ length: count }, (_, i) =>
		GeneratePointsOnMap({
			...params,
			seed: Math.floor(Math.random() * 2 ** 32) + i,
		}),
	);
}
