// ─────────────────────────────────────────────────────────────────────────────
// BriefingGenerator.js
// Pure function — generates a complete pre-op briefing from config data.
// Zero API calls. Zero async. Instant.
//
// Data sources:
//   PROVINCES        — biome string, AOO coords, location names + descriptions
//   PROVINCE_TERRAIN — coast zones, inland water, roads, airfield, terrain notes
//   PROVINCE_BIOMES  — province key → biome string fallback lookup
//   BIOME_WEATHER    — temp range, humidity, operational notes, gear hints
//   MISSION_TYPES    — fullLabel, doctrine, category
//
// Output: formatted string matching existing IntelBody SECTION_COLORS keys.
// ─────────────────────────────────────────────────────────────────────────────

import {
	PROVINCES,
	PROVINCE_TERRAIN,
	PROVINCE_BIOMES,
	BIOME_WEATHER,
} from "@/config";
import { MISSION_TYPES } from "@/api/GhostOpsApi";

// ─── Config lookups ───────────────────────────────────────────────────────────

function getMissionDef(id) {
	return MISSION_TYPES.find((m) => m.id === id) ?? null;
}

function getProvinceData(key) {
	return PROVINCES[key] ?? null;
}

function getTerrainData(key) {
	return PROVINCE_TERRAIN[key] ?? null;
}

function getBiomeData(biome) {
	return BIOME_WEATHER[biome] ?? null;
}

// Biome resolution priority:
// 1. Explicit biome param
// 2. PROVINCES[province].biome
// 3. PROVINCE_BIOMES[province]
// 4. 'Unknown'
function resolveBiome(province, biomeOverride) {
	return (
		biomeOverride ??
		PROVINCES[province]?.biome ??
		PROVINCE_BIOMES[province] ??
		"Unknown"
	);
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatCoords(pt) {
	if (!pt) return "NOT SET";
	const arr = Array.isArray(pt) ? pt : [pt.row ?? pt[0], pt.col ?? pt[1]];
	return `[${Math.round(arr[0])}, ${Math.round(arr[1])}]`;
}

function formatTempRange(tempRange) {
	if (!tempRange) return "Unknown";
	const { min, max, fahrenheit } = tempRange;
	return `${min}–${max}°C / ${fahrenheit.min}–${fahrenheit.max}°F`;
}

// ─── Classification stamp ─────────────────────────────────────────────────────

const STAMPS = [
	"TOP SECRET // SCI // NOFORN",
	"TOP SECRET // COMINT // ORCON",
	"TOP SECRET // SI // TK // NOFORN",
];

function classificationStamp() {
	return STAMPS[Math.floor(Math.random() * STAMPS.length)];
}

// ─── DTG ─────────────────────────────────────────────────────────────────────

function buildDTG() {
	const now = new Date();
	const p = (v) => String(v).padStart(2, "0");
	const mon = now.toLocaleString("en", { month: "short" }).toUpperCase();
	return `${p(now.getUTCDate())}${mon}${now.getUTCFullYear()} ${p(now.getUTCHours())}${p(now.getUTCMinutes())}Z`;
}

// ─── Terrain section ──────────────────────────────────────────────────────────
// Uses: PROVINCE_TERRAIN notes, coastZones, inlandWater, hasRoads, hasAirfield
//       PROVINCES AOO coords

function buildTerrainSection(terrainData, provinceData) {
	if (!terrainData) return "Terrain data unavailable.";

	const parts = [];

	// Core terrain notes from PROVINCE_TERRAIN
	if (terrainData.notes) {
		parts.push(terrainData.notes);
	}

	// Island flag
	if (terrainData.isIsland) {
		parts.push("Province is an island — ocean accessible on multiple sides.");
	}

	// Coast zones — full named list from PROVINCE_TERRAIN.coastZones
	if (terrainData.hasCoast && terrainData.coastZones?.length) {
		const zoneList = terrainData.coastZones
			.map((z) => `${z.label} (${z.side} approach)`)
			.join(", ");
		parts.push(`Maritime access confirmed: ${zoneList}.`);
	} else {
		parts.push("No coastal access — maritime insertion not viable.");
	}

	// Inland water — named bodies from PROVINCE_TERRAIN.inlandWater
	if (terrainData.inlandWater?.length) {
		const waterList = terrainData.inlandWater.map((w) => w.label).join(", ");
		parts.push(`Inland water features: ${waterList}.`);
	}

	// Road network
	parts.push(
		terrainData.hasRoads ?
			"Road network present — ground vehicle movement viable."
		:	"No road network — ground vehicle movement restricted.",
	);

	// Airfield
	parts.push(
		terrainData.hasAirfield ?
			"Airfield present in AO — fixed-wing and rotary assets can stage locally."
		:	"No airfield in AO.",
	);

	// AOO center point from PROVINCES
	if (provinceData?.AOO) {
		parts.push(`AOO center: [${provinceData.AOO[0]}, ${provinceData.AOO[1]}].`);
	}

	return parts.join(" ");
}

// ─── Environmental section ────────────────────────────────────────────────────
// Uses: BIOME_WEATHER tempRange, humidity, operationalNotes

function buildEnvironmentalSection(biomeData, biomeLabel) {
	if (!biomeData)
		return `Biome: ${biomeLabel}. No environmental data available.`;

	const parts = [];

	parts.push(`Biome classification: ${biomeLabel}.`);
	parts.push(`Temperature range: ${formatTempRange(biomeData.tempRange)}.`);
	parts.push(`Ambient humidity: ${biomeData.humidity}.`);

	// All operational notes from BIOME_WEATHER — tactical implications
	if (biomeData.operationalNotes?.length) {
		biomeData.operationalNotes.forEach((note) => parts.push(note));
	}

	return parts.join(" ");
}

// ─── Gear section ─────────────────────────────────────────────────────────────
// Uses: BIOME_WEATHER gearHints + mission category context

function buildGearSection(biomeData, missionCategory) {
	const parts = [];

	// All gear hints from BIOME_WEATHER
	if (biomeData?.gearHints?.length) {
		biomeData.gearHints.forEach((hint) => parts.push(hint));
	}

	// Mission-category-specific gear additions
	const categoryGear = {
		"Special Reconnaissance":
			"Recon element carries minimal kit — no heavy weapons. Optics and comms priority over firepower.",
		Counterterrorism:
			"CT kit — breaching equipment and restraints required for any capture scenario.",
		Overwatch:
			"Long-range optics and precision rifle system mandatory. Spotting equipment required.",
		Support:
			"Carry capacity maximized for cargo or medical supplies. Personal defensive kit is secondary.",
	};

	if (categoryGear[missionCategory]) {
		parts.push(categoryGear[missionCategory]);
	}

	return parts.length > 0 ?
			parts.join(" ")
		:	"Standard kit — no extreme environmental or mission-specific threat identified.";
}

// ─── Intel status from prior phases ──────────────────────────────────────────

function buildIntelStatus(priorPhases, provinceKey) {
	if (!priorPhases?.length) {
		return (
			"No prior intelligence on this AO. " +
			"Element is operating cold — expect unknowns on enemy disposition, " +
			"patrol routes, and facility access. All assumptions unconfirmed. " +
			"Recommend heightened noise discipline and contingency planning."
		);
	}

	const relevantPhases = priorPhases.filter(
		(p) => p.province === provinceKey || p.intelDeveloped?.length > 0,
	);

	if (!relevantPhases.length) {
		return (
			`${priorPhases.length} prior phase(s) conducted in adjacent AOs. ` +
			"No direct intelligence on this province. Treat as cold."
		);
	}

	const intelTags = relevantPhases.flatMap((p) => p.intelDeveloped ?? []);
	const complications = relevantPhases.flatMap((p) => p.complications ?? []);
	const hasQRF = complications.some((c) => c.toLowerCase().includes("qrf"));
	const hasISRDown = complications.some(
		(c) =>
			c.toLowerCase().includes("isr") || c.toLowerCase().includes("cross-com"),
	);
	const hasCasualties = relevantPhases.some(
		(p) => p.casualties && p.casualties !== "none",
	);

	const lines = [
		`${relevantPhases.length} prior phase(s) conducted in this AO.`,
	];

	const tagMap = {
		patrol_timing: "Enemy patrol timing confirmed from prior surveillance.",
		enemy_strength:
			"Enemy force strength assessed — disposition partially known.",
		hvt_location: "HVT location updated from prior phase intelligence.",
		facility_layout: "Facility or base layout partially mapped.",
		supply_route: "Supply route identified in prior operation.",
		contact_activated:
			"Resistance or local contact activated — HUMINT asset available.",
		nothing_new: "No actionable intelligence developed. Intel gap persists.",
	};

	let hasAnyTag = false;
	for (const [tag, text] of Object.entries(tagMap)) {
		if (intelTags.includes(tag)) {
			lines.push(text);
			hasAnyTag = true;
		}
	}

	if (!hasAnyTag) {
		lines.push("No actionable intelligence developed. Intel gap persists.");
	}

	if (hasQRF) {
		lines.push(
			"CAUTION: QRF response faster than anticipated in prior phase — adjust time-on-target window.",
		);
	}
	if (hasISRDown) {
		lines.push(
			"ISR or Cross-Com degraded in prior phase — confirm asset status before insertion.",
		);
	}
	if (hasCasualties) {
		lines.push(
			"Element sustained casualties in prior phase. Consider reduced force strength in planning.",
		);
	}

	return lines.join(" ");
}

// ─── ROE ─────────────────────────────────────────────────────────────────────

function buildROE(category) {
	const roeMap = {
		"Direct Action":
			"Weapons free on confirmed hostile combatants. Civilian presence requires positive identification before engagement. Minimize collateral damage. Element authority to engage in self-defense at all times.",
		"Special Reconnaissance":
			"No-contact. Element will not initiate engagement under any circumstance. If compromised, break contact and exfil immediately. Weapons for emergency self-defense only. Silence is the objective.",
		Counterterrorism:
			"Positive identification required before engagement. High collateral damage sensitivity — do not engage in proximity to non-combatants without clear separation. Capture preferred over elimination where mission permits.",
		Overwatch:
			"Engage only on direct threat to supported element or confirmed hostile at command authority. Long-range fires require positive identification. No suppression fires without confirmed target.",
		Support:
			"Defensive ROE only. Element engages only in immediate self-defense. Mission priority is resupply — avoid contact.",
	};
	return (
		roeMap[category] ??
		"Standard rules of engagement apply. Positive identification required before engagement."
	);
}

// ─── Commander's Intent ───────────────────────────────────────────────────────

const MISSION_VERBS = {
	DA_RAID: "assault and clear",
	DA_AMBUSH: "interdict and neutralize the convoy passing through",
	DA_SNATCH: "capture the high-value individual at",
	DA_ELIMINATION: "eliminate the high-value target at",
	DA_SABOTAGE: "infiltrate and destroy the installation at",
	DA_STRIKE: "strike and neutralize the infrastructure node at",
	DA_CONVOY: "intercept and destroy the enemy convoy near",
	SR_AREA: "conduct covert area surveillance of",
	SR_POINT: "establish a covert observation post on",
	SR_BDA: "conduct battle damage assessment of",
	CT_HOSTAGE: "assault and recover personnel held at",
	CT_STRIKE: "strike and neutralize the terrorist network node at",
	CT_RECOVERY: "locate and recover isolated personnel near",
	OW_OVERWATCH: "establish overwatch and provide fire support at",
	OW_RESUPPLY: "deliver forward resupply to the element at",
};

const END_STATES = {
	DA_RAID:
		"Desired end state: objective neutralized, element exfilled, no unaccounted personnel.",
	DA_AMBUSH:
		"Desired end state: target convoy destroyed or disabled, kill zone cleared, element exfilled before QRF arrival.",
	DA_SNATCH:
		"Desired end state: HVT in custody, alive and cooperative, exfilled via high-capacity extract.",
	DA_ELIMINATION:
		"Desired end state: HVT confirmed eliminated, element exfilled before attribution.",
	DA_SABOTAGE:
		"Desired end state: target installation destroyed or rendered non-operational, element exfilled before secondary effects draw QRF.",
	DA_STRIKE:
		"Desired end state: infrastructure node offline, enemy capability degraded, element exfilled clean.",
	DA_CONVOY:
		"Desired end state: convoy destroyed, route denied to enemy logistics, element exfilled before QRF.",
	SR_AREA:
		"Desired end state: full collection window completed, element exfilled undetected, no intelligence signature left in AO.",
	SR_POINT:
		"Desired end state: observation post occupied for full dwell time, all collection objectives met, exfil on schedule.",
	SR_BDA:
		"Desired end state: target damage confirmed or denied, element exfilled before enemy exploits the strike window.",
	CT_HOSTAGE:
		"Desired end state: all personnel recovered, facility cleared, exfil via high-capacity extract.",
	CT_STRIKE:
		"Desired end state: network node neutralized, element exfilled before secondary attribution.",
	CT_RECOVERY:
		"Desired end state: isolated personnel linked up and exfilled, no additional casualties.",
	OW_OVERWATCH:
		"Desired end state: overwatch position maintained for full support window, supported element completes its objective, overwatch element breaks contact and exfils last.",
	OW_RESUPPLY:
		"Desired end state: forward element resupplied, route secured, element returned to staging.",
};

function buildCommandersIntent(operationName, locations, missionDef, province) {
	const primaryObj = locations[0]?.name ?? "the primary objective";
	const verb = MISSION_VERBS[missionDef?.id] ?? "conduct operations at";
	const endState =
		END_STATES[missionDef?.id] ??
		"Desired end state: mission objectives achieved, element exfilled intact.";

	return (
		`Operation ${operationName} will ${verb} ${primaryObj} in ${province}. ` +
		`${endState} ` +
		`Element must preserve operational security throughout — compromise before objective ` +
		`is grounds for abort. Exfil is the priority once actions on objective are complete.`
	);
}

// ─── Objectives block ─────────────────────────────────────────────────────────
// Uses: location.name and location.description from PROVINCES

function buildObjectivesBlock(locations) {
	if (!locations?.length) return "No objectives designated.";
	return locations
		.map((loc, i) => {
			const name = loc.name ?? String(loc);
			const desc = loc.description ?? "";
			return `OBJ-${String(i + 1).padStart(2, "0")}: ${name}\n${desc}`;
		})
		.join("\n\n");
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * generateBriefing
 *
 * @param {object} params
 * @param {string}   params.operationName  - Operation name
 * @param {string}   params.province       - Province key e.g. 'FenBog'
 * @param {string}   [params.biome]        - Biome override — auto-resolved if omitted
 * @param {string}   params.missionType    - Mission type ID e.g. 'DA_RAID'
 * @param {Array}    params.locations      - Selected location objects { name, description }
 * @param {object}   params.generator      - GeneratePoints output
 * @param {Array}    [params.priorPhases]  - Prior phase records for intel status
 *
 * @returns {string} Formatted briefing document
 */
export function generateBriefing({
	operationName,
	province,
	biome,
	missionType,
	locations = [],
	generator = {},
	priorPhases = [],
}) {
	// ── Resolve config ────────────────────────────────────────────────────────
	const missionDef = getMissionDef(missionType);
	const provinceData = getProvinceData(province);
	const terrainData = getTerrainData(province);
	const resolvedBiome = resolveBiome(province, biome);
	const biomeData = getBiomeData(resolvedBiome);

	const missionLabel = missionDef?.fullLabel ?? missionType ?? "UNCLASSIFIED";
	const missionDoctrine = missionDef?.doctrine ?? "";
	const missionCategory = missionDef?.category ?? "";
	const provinceLabel = province ?? "Unknown";

	// ── Build sections ────────────────────────────────────────────────────────
	const stamp = classificationStamp();
	const dtg = buildDTG();
	const terrain = buildTerrainSection(terrainData, provinceData);
	const enviro = buildEnvironmentalSection(biomeData, resolvedBiome);
	const gear = buildGearSection(biomeData, missionCategory);
	const intel = buildIntelStatus(priorPhases, province);
	const roe = buildROE(missionCategory);
	const cmdIntent = buildCommandersIntent(
		operationName ?? "UNKNOWN",
		locations,
		missionDef,
		provinceLabel,
	);
	const objectives = buildObjectivesBlock(locations);

	// ── Generator data ────────────────────────────────────────────────────────
	const infilPoint = formatCoords(generator.infilPoint);
	const exfilPoint = formatCoords(generator.exfilPoint);
	const rallyPoint = formatCoords(generator.rallyPoint);
	const infilMethod = generator.infilMethod ?? "Not specified";
	const exfilMethod = generator.exfilMethod ?? "Not specified";
	const approachVec = generator.approachVector ?? "Not specified";

	// ── Assemble document ─────────────────────────────────────────────────────
	const lines = [
		`// ${stamp} //`,
		"",
		`OPERATION: ${operationName}`,
		`DTG: ${dtg}`,
		`AO: ${provinceLabel} — ${resolvedBiome}`,
		`MISSION TYPE: ${missionLabel}`,
		"",
		`MISSION INTENT: ${missionDoctrine}`,
		"",
		`AREA OF OPERATIONS: ${terrain}`,
		"",
		`OBJECTIVES:\n${objectives}`,
		"",
		`INFILTRATION: Method — ${infilMethod}. ${approachVec} Infil point: ${infilPoint}.`,
		"",
		`EXFILTRATION: Method — ${exfilMethod}. Exfil point: ${exfilPoint}.`,
		"",
		`RALLY POINT: ${rallyPoint}. Element consolidates at rally prior to objective approach and post-exfil if compromised.`,
		"",
		`ENVIRONMENTAL CONDITIONS: ${enviro}`,
		"",
		`GEAR: ${gear}`,
		"",
		`ASSET STATUS: ${intel}`,
		"",
		`RULES OF ENGAGEMENT: ${roe}`,
		"",
		`COMMANDER'S INTENT: ${cmdIntent}`,
		"",
		`// ${stamp} //`,
	];

	return lines.join("\n");
}
