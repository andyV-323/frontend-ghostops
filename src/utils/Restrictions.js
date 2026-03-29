// ─────────────────────────────────────────────────────────────────────────────
// restrictionUtils.js
// All logic for resolving, merging, and formatting operational restrictions.
//
// Imports static data from PROVINCE_RESTRICTIONS.js — no data lives here.
//
// Exports:
//   resolveWeatherRestrictions(weatherEvent)
//     → partial restriction overrides for a given weather event string
//
//   resolveRestrictions(provinceKey, weatherEvent?)
//     → full resolved restriction object, weather merged, children inherited
//
//   formatRestrictionsForBriefing(restrictions)
//     → formatted string for OPERATIONAL ASSET STATUS in BriefingGenerator.js
//
//   getRestrictedKeys(restrictions)
//     → array of keys that are degraded or denied (useful for UI filtering)
//
//   isFullyDenied(restrictions, key)
//     → boolean shorthand for denied check
// ─────────────────────────────────────────────────────────────────────────────

import { PROVINCE_RESTRICTIONS, STATUS, SOURCE } from "@/config";

// ─── Status rank ─────────────────────────────────────────────────────────────
// Used to compare and escalate — higher rank = more restricted

const RANK = {
	[STATUS.NOMINAL]: 0,
	[STATUS.DEGRADED]: 1,
	[STATUS.DENIED]: 2,
};

// ─── Display labels ───────────────────────────────────────────────────────────

export const RESTRICTION_LABELS = {
	isrDrone: "ISR DRONE",
	crossCom: "CROSS-COM",
	syncShot: "SYNC SHOT",
	intelGrenades: "INTEL GRENADES",
	aviation: "AVIATION",
	vehicle: "GROUND VEHICLES",
	personalDrone: "PERSONAL DRONE",
	nvgThermal: "NVG / THERMAL",
	satcom: "SATCOM / FIRE SUPPORT",
	lrOptics: "LONG-RANGE OPTICS",
};

// ─── Weather restriction overrides ───────────────────────────────────────────
// Returns a partial restriction object keyed to whichever systems the weather
// event affects. Merge onto static province data — weather wins only if worse.

export function resolveWeatherRestrictions(weatherEvent) {
	const overrides = {};

	const deg = (reason) => ({
		status: STATUS.DEGRADED,
		source: SOURCE.WEATHER,
		reason,
		unlockable: false,
	});
	const den = (reason) => ({
		status: STATUS.DENIED,
		source: SOURCE.WEATHER,
		reason,
		unlockable: false,
	});

	switch (weatherEvent) {
		case "Blizzard":
		case "Whiteout":
			overrides.isrDrone = den(
				"Blizzard — drone operations impossible. Zero visibility.",
			);
			overrides.aviation = den("Blizzard — flight window closed entirely.");
			overrides.personalDrone = den(
				"Blizzard grounds all small drone operations.",
			);
			overrides.nvgThermal = deg(
				"Whiteout degrades NVG clarity. Extreme cold accelerates electronics failure.",
			);
			overrides.lrOptics = den("Zero visibility — optics non-functional.");
			break;

		case "Heavy Rain":
			overrides.isrDrone = deg("Heavy rain degrades optical sensor clarity.");
			overrides.personalDrone = deg(
				"Rain degrades small drone sensors and destabilizes flight.",
			);
			overrides.lrOptics = deg("Rain reduces effective optic range.");
			break;

		case "Dense Fog":
		case "Marsh Fog":
			overrides.isrDrone = deg(
				"Fog ceiling severely limits drone altitude and optical range.",
			);
			overrides.personalDrone = deg(
				"Fog reduces drone visual range to near zero.",
			);
			overrides.lrOptics = deg(
				"Fog reduces effective optic range significantly.",
			);
			break;

		case "Ash Fall":
			overrides.isrDrone = deg("Ash coats optical sensors.");
			overrides.personalDrone = deg("Ash damages rotors and degrades sensors.");
			overrides.nvgThermal = deg(
				"Ash coats lenses. Particulate heat signature affects thermal baseline.",
			);
			overrides.lrOptics = deg("Ash reduces optical clarity.");
			break;

		case "High Wind":
			overrides.aviation = deg(
				"High wind makes helicopter insertion and extraction unreliable.",
			);
			overrides.personalDrone = den(
				"High wind grounds all small drone operations.",
			);
			break;

		case "Heat Shimmer":
			overrides.isrDrone = deg(
				"Heat shimmer corrupts long-range optical feed.",
			);
			overrides.nvgThermal = deg("Ambient heat distorts thermal baseline.");
			overrides.lrOptics = deg(
				"Heat shimmer makes long-range ranging unreliable.",
			);
			break;

		case "Sea Fog":
			overrides.isrDrone = deg(
				"Sea fog ceiling limits drone altitude and optical clarity.",
			);
			overrides.personalDrone = deg("Sea fog degrades drone visual feed.");
			overrides.lrOptics = deg("Sea fog reduces effective optic range.");
			break;

		case "Storm Front":
			overrides.isrDrone = deg(
				"Storm degrades drone ceiling and optical feed.",
			);
			overrides.aviation = deg(
				"Storm front — flight conditions hazardous. Aviation unreliable.",
			);
			overrides.personalDrone = den(
				"Storm grounds all small drone operations.",
			);
			overrides.lrOptics = deg("Storm reduces effective optic range.");
			break;

		default:
			break;
	}

	return overrides;
}

// ─── Child inheritance resolver ───────────────────────────────────────────────
// syncShot and intelGrenades cannot be better than their parent crossCom.
// If crossCom is denied, children are denied.
// If crossCom is degraded and child is nominal, child is escalated to degraded.

function resolveChildInheritance(resolved) {
	const ccStatus = resolved.crossCom.status;
	const ccRank = RANK[ccStatus];

	["syncShot", "intelGrenades"].forEach((child) => {
		if (RANK[resolved[child].status] < ccRank) {
			resolved[child] = {
				...resolved.crossCom,
				reason:
					`Inherited — Cross-Com ${ccStatus}. ${resolved.crossCom.reason ?? ""}`.trim(),
			};
		}
	});
}

// ─── Main resolver ────────────────────────────────────────────────────────────
// 1. Deep clone the static province data
// 2. Apply weather overrides — weather wins only if it is more restrictive
// 3. Resolve child inheritance for syncShot and intelGrenades
// Returns a complete restriction object.

export function resolveRestrictions(provinceKey, weatherEvent = null) {
	const base = PROVINCE_RESTRICTIONS[provinceKey];
	if (!base) return null;

	// Deep clone — never mutate the static config
	const resolved = Object.fromEntries(
		Object.entries(base).map(([k, v]) => [k, { ...v }]),
	);

	// Merge weather overrides — escalate only
	if (weatherEvent) {
		const weatherOverrides = resolveWeatherRestrictions(weatherEvent);
		for (const [key, override] of Object.entries(weatherOverrides)) {
			if (resolved[key] && RANK[override.status] > RANK[resolved[key].status]) {
				resolved[key] = override;
			}
		}
	}

	// Resolve child inheritance
	resolveChildInheritance(resolved);

	return resolved;
}

// ─── Briefing formatter ───────────────────────────────────────────────────────
// Produces a formatted block for OPERATIONAL ASSET STATUS in BriefingGenerator.
// Nominal assets are omitted — only degraded and denied are listed.

export function formatRestrictionsForBriefing(restrictions) {
	if (!restrictions) return "Asset status unknown.";

	const lines = [];

	for (const [key, entry] of Object.entries(restrictions)) {
		if (entry.status === STATUS.NOMINAL) continue;
		const label = RESTRICTION_LABELS[key] ?? key.toUpperCase();
		const status = entry.status.toUpperCase();
		const unlockTag = entry.unlockable ? " [THREAT — UNLOCKABLE]" : "";
		lines.push(`${label}: ${status}${unlockTag} — ${entry.reason}`);
	}

	return lines.length > 0 ?
			lines.join("\n")
		:	"All assets nominal. No operational restrictions in this AO.";
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

// Returns all keys that are degraded or denied — useful for driving UI badges
export function getRestrictedKeys(restrictions) {
	if (!restrictions) return [];
	return Object.keys(restrictions).filter(
		(k) => restrictions[k].status !== STATUS.NOMINAL,
	);
}

// Returns all keys that are fully denied
export function getDeniedKeys(restrictions) {
	if (!restrictions) return [];
	return Object.keys(restrictions).filter(
		(k) => restrictions[k].status === STATUS.DENIED,
	);
}

// Shorthand boolean check for a single key
export function isFullyDenied(restrictions, key) {
	return restrictions?.[key]?.status === STATUS.DENIED;
}

export function isDegraded(restrictions, key) {
	return restrictions?.[key]?.status === STATUS.DEGRADED;
}

// Returns only threat-sourced restrictions — useful for campaign unlock tracking
export function getUnlockableRestrictions(restrictions) {
	if (!restrictions) return {};
	return Object.fromEntries(
		Object.entries(restrictions).filter(([, v]) => v.unlockable),
	);
}
