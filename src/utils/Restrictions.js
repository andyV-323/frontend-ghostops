// ─────────────────────────────────────────────────────────────────────────────
// Restrictions.js
// All logic for resolving, merging, and formatting operational restrictions.
//
// Imports PROVINCE_RESTRICTIONS directly (not via the barrel) so that
// config/index.js can safely re-export STATUS and SOURCE from here without
// creating a circular dependency.
//
// Exports:
//   STATUS, SOURCE — shared operational constants
//
//   resolveRestrictions(provinceKey, weatherEvent?)
//     → per-asset {status, source, reason, unlockable} map
//       backwards-compatible with AOIntelMap, TeamView, BriefingGenerator
//
//   getWeatherConditionData(provinceKey, atmosphere)
//     → raw weather[condition] block for WeatherPanel visual display
//   getTerrainData(provinceKey)  → terrain block
//   getThreats(provinceKey)      → threats array
//
//   formatRestrictionsForBriefing(restrictions) → briefing string
//   getRestrictedKeys / getDeniedKeys / isFullyDenied / isDegraded / getUnlockableRestrictions
// ─────────────────────────────────────────────────────────────────────────────

import { PROVINCE_RESTRICTIONS } from "@/config/provinceRestrictions";

// ─── Operational status / source constants ────────────────────────────────────

export const STATUS = {
	NOMINAL: "nominal",
	DEGRADED: "degraded",
	DENIED: "denied",
};

export const SOURCE = {
	TERRAIN: "terrain",
	THREAT: "threat",
	WEATHER: "weather",
	THREAT_WEATHER: "threat_weather",
	TERRAIN_WEATHER: "terrain_weather",
};

// ─── Status rank ──────────────────────────────────────────────────────────────

const RANK = {
	[STATUS.NOMINAL]: 0,
	[STATUS.DEGRADED]: 1,
	[STATUS.DENIED]: 2,
};

// ─── Category → asset key expansion ──────────────────────────────────────────
// Maps the category names used in terrain.degraded / threats[].denies to the
// individual asset keys returned by resolveRestrictions.

const CATEGORY_EXPAND = {
	drone:       ["reconDrone", "syncDrone", "combatDrone", "supplyDrone"],
	airSupport:  ["strikeDesignator", "armarosDrone"],
	crossCom:    ["crossCom", "satelliteFeed", "sonarVision", "intelGrenades"],
	aviation:    ["aviation"],
	vehicle:     ["vehicle"],
	armarosDrone:["armarosDrone"],
};

function expandCategory(cat) {
	return CATEGORY_EXPAND[cat] ?? [cat];
}

const ALL_ASSET_KEYS = [
	"crossCom", "satelliteFeed", "sonarVision", "intelGrenades",
	"reconDrone", "syncDrone", "combatDrone", "supplyDrone",
	"strikeDesignator", "armarosDrone",
	"aviation", "vehicle",
];

// ─── Display labels ───────────────────────────────────────────────────────────

export const RESTRICTION_LABELS = {
	crossCom:       { name: "CROSS-COM",   fullName: "Cross-Com Network",      icon: "/icons/CrossCom.svg",        category: "crossCom"   },
	satelliteFeed:  { name: "SATELLITE",   fullName: "Satellite ISR Feed",      icon: "/icons/ISR.svg",             category: "crossCom"   },
	sonarVision:    { name: "SONAR",       fullName: "Sonar Vision Goggles",    icon: "/icons/SensorGoggles.svg",   category: "crossCom"   },
	intelGrenades:  { name: "INTEL GREN",  fullName: "Intel Grenades",          icon: "/icons/SensorGrenade.svg",   category: "crossCom"   },
	reconDrone:     { name: "RECON",       fullName: "Recon Drone",             icon: "/icons/ReconDrone.svg",      category: "drone"      },
	syncDrone:      { name: "SYNC",        fullName: "Sync-Shot Drone",         icon: "/icons/SyncShotDrone.svg",   category: "drone"      },
	combatDrone:    { name: "WASP",        fullName: "Wasp Combat Drone",       icon: "/icons/BattleDrone.svg",     category: "drone"      },
	supplyDrone:    { name: "SUPPLY",      fullName: "Supply Drone",            icon: "/icons/SupplyDrone.svg",     category: "drone"      },
	strikeDesignator:{ name: "DESIGNATOR", fullName: "Strike Designator",       icon: "/icons/StrikeDesignator.svg",category: "airSupport" },
	armarosDrone:   { name: "ARMAROS",     fullName: "Armaros Drone",           icon: "/icons/ArmarosDrone.svg",    category: "airSupport" },
	aviation:       { name: "AVIATION",    fullName: "Aviation Assets",         icon: "/icons/AttackHelicopter.svg",category: "mobility"   },
	vehicle:        { name: "VEHICLES",    fullName: "Ground Vehicles",         icon: "/icons/GroundVHC.svg",       category: "mobility"   },
};

// ─── Child inheritance ────────────────────────────────────────────────────────

function resolveChildInheritance(resolved) {
	const ccStatus = resolved.crossCom?.status;
	if (!ccStatus) return;
	const ccRank = RANK[ccStatus] ?? 0;
	["sonarVision", "intelGrenades"].forEach((child) => {
		if ((RANK[resolved[child]?.status] ?? 0) < ccRank) {
			resolved[child] = {
				...resolved.crossCom,
				reason: `Inherited — Cross-Com ${ccStatus}. ${resolved.crossCom.reason ?? ""}`.trim(),
			};
		}
	});
}

// ─── Legacy weather event overrides (BriefingGenerator path) ─────────────────

export function resolveWeatherRestrictions(weatherEvent) {
	const overrides = {};
	const deg = (reason) => ({ status: STATUS.DEGRADED, source: SOURCE.WEATHER, reason, unlockable: false });
	const den = (reason) => ({ status: STATUS.DENIED,   source: SOURCE.WEATHER, reason, unlockable: false });

	switch (weatherEvent) {
		case "Blizzard":
		case "Whiteout":
			overrides.reconDrone  = den("Blizzard — zero visibility. Drone ops impossible.");
			overrides.syncDrone   = den("Blizzard grounds drone operations.");
			overrides.combatDrone = den("Blizzard grounds drone operations.");
			overrides.supplyDrone = den("Blizzard grounds drone operations.");
			overrides.aviation    = den("Blizzard — flight window closed entirely.");
			break;
		case "Heavy Rain":
			overrides.reconDrone = deg("Heavy rain degrades optical sensor clarity.");
			overrides.syncDrone  = deg("Rain destabilizes drone flight.");
			break;
		case "Dense Fog":
		case "Marsh Fog":
		case "Sea Fog":
			overrides.reconDrone = deg("Fog reduces drone visual range to near zero.");
			break;
		case "Ash Fall":
			overrides.reconDrone = deg("Ash damages rotors and degrades sensors.");
			break;
		case "High Wind":
			overrides.aviation   = deg("High wind makes helicopter insertion unreliable.");
			overrides.reconDrone = den("High wind grounds all small drone operations.");
			overrides.syncDrone  = den("High wind grounds all small drone operations.");
			break;
		case "Storm Front":
			overrides.aviation    = deg("Storm front — flight conditions hazardous.");
			overrides.reconDrone  = den("Storm grounds all small drone operations.");
			overrides.syncDrone   = den("Storm grounds all small drone operations.");
			overrides.combatDrone = den("Storm grounds all small drone operations.");
			overrides.supplyDrone = den("Storm grounds all small drone operations.");
			break;
		default:
			break;
	}
	return overrides;
}

// ─── Main resolver ────────────────────────────────────────────────────────────
// Translates the new terrain / threats / weather data format into a backwards-
// compatible per-asset {status, source, reason, unlockable} map for use in
// AOIntelMap, TeamView, and BriefingGenerator.

export function resolveRestrictions(provinceKey, weatherEvent = null) {
	const base = PROVINCE_RESTRICTIONS[provinceKey];
	if (!base) return null;

	const nominal = () => ({ status: STATUS.NOMINAL, source: null, reason: null, unlockable: false });
	const resolved = Object.fromEntries(ALL_ASSET_KEYS.map((k) => [k, nominal()]));

	// Terrain degradations
	for (const cat of (base.terrain?.degraded ?? [])) {
		for (const key of expandCategory(cat)) {
			if (resolved[key] && RANK[STATUS.DEGRADED] > RANK[resolved[key].status]) {
				resolved[key] = {
					status:    STATUS.DEGRADED,
					source:    SOURCE.TERRAIN,
					reason:    base.terrain.description,
					unlockable:false,
				};
			}
		}
	}

	// Threat denials
	for (const threat of (base.threats ?? [])) {
		for (const cat of (threat.denies ?? [])) {
			for (const key of expandCategory(cat)) {
				if (resolved[key] && RANK[STATUS.DENIED] > RANK[resolved[key].status]) {
					resolved[key] = {
						status:    STATUS.DENIED,
						source:    SOURCE.THREAT,
						reason:    `${threat.name} — deny zone active.`,
						unlockable:threat.unlockable ?? false,
					};
				}
			}
		}
	}

	// Legacy weather event overrides
	if (weatherEvent) {
		const overrides = resolveWeatherRestrictions(weatherEvent);
		for (const [key, override] of Object.entries(overrides)) {
			if (resolved[key] && RANK[override.status] > RANK[resolved[key].status]) {
				const prev = resolved[key].source;
				const newSource =
					prev === SOURCE.TERRAIN ? SOURCE.TERRAIN_WEATHER
					: prev === SOURCE.THREAT ? SOURCE.THREAT_WEATHER
					: SOURCE.WEATHER;
				resolved[key] = { ...override, source: newSource };
			}
		}
	}

	resolveChildInheritance(resolved);
	return resolved;
}

// ─── New-format helpers for WeatherPanel / AOBriefingPage ────────────────────

export function getWeatherConditionData(provinceKey, atmosphere) {
	const base = PROVINCE_RESTRICTIONS[provinceKey];
	if (!base || !atmosphere) return null;
	return base.weather?.[atmosphere] ?? null;
}

export function getTerrainData(provinceKey) {
	return PROVINCE_RESTRICTIONS[provinceKey]?.terrain ?? null;
}

export function getThreats(provinceKey) {
	return PROVINCE_RESTRICTIONS[provinceKey]?.threats ?? [];
}

// ─── Briefing formatter ───────────────────────────────────────────────────────

export function formatRestrictionsForBriefing(restrictions) {
	if (!restrictions) return "Asset status unknown.";
	const lines = [];
	for (const [key, entry] of Object.entries(restrictions)) {
		if (entry.status === STATUS.NOMINAL) continue;
		const label = RESTRICTION_LABELS[key]?.name ?? key.toUpperCase();
		const unlockTag = entry.unlockable ? " [THREAT — UNLOCKABLE]" : "";
		lines.push(`${label}: ${entry.status.toUpperCase()}${unlockTag} — ${entry.reason}`);
	}
	return lines.length > 0
		? lines.join("\n")
		: "All assets nominal. No operational restrictions in this AO.";
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export function getRestrictedKeys(restrictions) {
	if (!restrictions) return [];
	return Object.keys(restrictions).filter((k) => restrictions[k].status !== STATUS.NOMINAL);
}

export function getDeniedKeys(restrictions) {
	if (!restrictions) return [];
	return Object.keys(restrictions).filter((k) => restrictions[k].status === STATUS.DENIED);
}

export function isFullyDenied(restrictions, key) {
	return restrictions?.[key]?.status === STATUS.DENIED;
}

export function isDegraded(restrictions, key) {
	return restrictions?.[key]?.status === STATUS.DEGRADED;
}

export function getUnlockableRestrictions(restrictions) {
	if (!restrictions) return {};
	return Object.fromEntries(Object.entries(restrictions).filter(([, v]) => v.unlockable));
}
