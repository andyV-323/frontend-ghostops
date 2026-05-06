// ─────────────────────────────────────────────────────────────────────────────
// Restrictions.js
// All logic for resolving, merging, and formatting operational restrictions.
//
// Imports static data from PROVINCE_RESTRICTIONS.js — no data lives here.
//
// Exports:
//   resolveAtmosphereRestrictions(atmosphere, biome)
//     → partial restriction overrides driven by the rolled atmosphere condition
//       and calibrated by biome group (volcanic / tropical / tundra / maritime
//       / marsh / urban / open). Replaces the old event-string system for
//       WeatherPanel. BriefingGenerator still uses the legacy path below.
//
//   resolveWeatherRestrictions(weatherEvent)   [legacy — BriefingGenerator]
//     → partial restriction overrides for a given weather event string
//
//   resolveRestrictions(provinceKey, weatherEvent?, atmosphereContext?)
//     → full resolved restriction object, weather merged, children inherited
//       atmosphereContext = { atmosphere, biome } — pass from WeatherPanel
//
//   formatRestrictionsForBriefing(restrictions)
//     → formatted string for OPERATIONAL ASSET STATUS in BriefingGenerator.js
//
//   getRestrictedKeys / getDeniedKeys / isFullyDenied / isDegraded
//     → UI helpers
// ─────────────────────────────────────────────────────────────────────────────

import { PROVINCE_RESTRICTIONS, STATUS, SOURCE } from "@/config";

// ─── Status rank ─────────────────────────────────────────────────────────────

const RANK = {
	[STATUS.NOMINAL]: 0,
	[STATUS.DEGRADED]: 1,
	[STATUS.DENIED]: 2,
};

// ─── Display labels ───────────────────────────────────────────────────────────

export const RESTRICTION_LABELS = {
	isrDrone:       "ISR DRONE / MINIMAP",
	crossCom:       "CROSS-COM",
	sonarVision:    "SONAR VISION",
	intelGrenades:  "INTEL GRENADES",
	aviation:       "AVIATION",
	vehicle:        "GROUND VEHICLES",
	reconDrone:     "RECON DRONE",
	syncDrone:      "SYNC-SHOT DRONE",
	combatDrone:    "WASP COMBAT DRONE",
	nvgThermal:     "NVG / THERMAL",
	supplyDrone:    "SUPPLY DRONE",
	uplinkProtocol: "ARMAROS DRONE",
	lrOptics:       "LONG-RANGE OPTICS",
};

// ─── Biome group map ──────────────────────────────────────────────────────────
// Groups biomes by the operational environment type that most influences how
// atmosphere conditions affect systems.

const BIOME_GROUP = {
	"Rain Forest":                   "tropical",
	"Volcanic Rain Forest":          "volcanic",
	"Volcanic Dessert":              "volcanic",
	"High Cliffs":                   "maritime",
	"Salt Marsh":                    "marsh",
	"High Thundra":                  "tundra",
	"Fjordlands":                    "maritime",
	"Rain Shadows":                  "open",
	"Mead Lands":                    "open",
	"Meadow Lands and Urban City":   "urban",
	"Meadow Lands":                  "open",
	"High Thundra and Rain Shadows": "tundra",
};

// ─── Atmosphere restriction overrides ────────────────────────────────────────
// Returns a partial restriction object keyed to affected systems.
// Calibrated by biome group — same atmosphere reads very differently depending
// on terrain context (storm in Fjordlands ≠ storm in a meadow).

export function resolveAtmosphereRestrictions(atmosphere, biome) {
	const group = BIOME_GROUP[biome] ?? "open";
	const overrides = {};

	const deg = (reason) => ({ status: STATUS.DEGRADED, source: SOURCE.WEATHER, reason, unlockable: false });
	const den = (reason) => ({ status: STATUS.DENIED,   source: SOURCE.WEATHER, reason, unlockable: false });

	switch (atmosphere) {

		// ── Cloudless ──────────────────────────────────────────────────────────
		// Optimal for most systems. Volcanic terrain is the exception — heat
		// shimmer from bare rock and lava is worst in direct sun / clear sky.
		case "cloudless":
			if (group === "volcanic") {
				overrides.isrDrone   = deg("Cloudless sky amplifies heat shimmer over volcanic terrain — ISR optical feed distorted at range.");
				overrides.nvgThermal = deg("Ambient volcanic heat saturates thermal baseline. No cloud layer to reduce radiated heat signature noise.");
				overrides.lrOptics   = deg("Heat shimmer over exposed lava rock renders long-range ranging unreliable in current conditions.");
			}
			break;

		// ── Sunshine ──────────────────────────────────────────────────────────
		// Similar to cloudless for volcanic biomes. Urban glass glare degrades
		// precision optics. Otherwise no meaningful restriction.
		case "sunshine":
			if (group === "volcanic") {
				overrides.isrDrone   = deg("Direct solar heating compounds volcanic ground radiation — heat shimmer severely degrades ISR optical feed.");
				overrides.nvgThermal = deg("Thermal imaging non-functional — volcanic ambient heat plus direct sun saturates the sensor baseline.");
				overrides.lrOptics   = deg("Heat shimmer and photochemical haze from volcanic ash degrade long-range optical clarity.");
			} else if (group === "urban") {
				overrides.lrOptics   = deg("Glass facade glare creates optical washout at specific approach angles — long-range precision targeting affected.");
			}
			break;

		// ── Overcast ──────────────────────────────────────────────────────────
		// Cloud ceiling reduces ISR altitude and drone effectiveness across the
		// board. Severity escalates in mountain and maritime terrain where cloud
		// layer combines with terrain hazard.
		case "overcast":
			overrides.isrDrone   = deg("Cloud ceiling reduces drone operating altitude and degrades optical sensor clarity.");
			overrides.reconDrone = deg("Cloud ceiling limits effective recon drone altitude and optical range.");

			if (group === "tundra") {
				overrides.aviation   = deg("Mountain overcast closes flight window — ceiling too low for safe rotary approach.");
				overrides.lrOptics   = deg("Flat whiteout light in snow terrain eliminates depth perception and effective optic range.");
			} else if (group === "maritime") {
				overrides.aviation   = deg("Maritime overcast combined with sea fog potential — aviation ceiling unreliable.");
				overrides.lrOptics   = deg("Sea haze under overcast sky reduces effective optic range across open water.");
			} else if (group === "marsh") {
				overrides.reconDrone = deg("Low cloud combined with marsh fog ceiling grounds effective recon drone operations.");
				overrides.lrOptics   = deg("Overcast over wetland terrain intensifies ambient fog — effective optic range significantly reduced.");
			}
			break;

		// ── Precipitation ─────────────────────────────────────────────────────
		// Degrades sensor-based systems across all biomes. Severity escalates
		// significantly in biomes where precipitation is heavy and sustained
		// (tropical, marsh) vs rare and brief (open, rain-shadow terrain).
		// Snow in tundra brings additional cold-weather electronic failures.
		case "precipitation":
			overrides.isrDrone   = deg("Precipitation coats optical sensors — ISR feed clarity degraded.");
			overrides.lrOptics   = deg("Rain reduces visibility at range — effective optic distance reduced.");
			overrides.syncDrone  = deg("Precipitation degrades sync shot drone sensors and flight stability.");
			overrides.combatDrone = deg("Rain reduces combat drone optical targeting accuracy.");

			if (group === "tropical" || group === "marsh") {
				// Heavy sustained rain in already-wet biomes makes small drones unviable
				overrides.reconDrone  = den("Active heavy precipitation in saturated biome — small drone operations impossible. Rain volume and wind make flight uncontrollable.");
				overrides.supplyDrone = deg("Heavy precipitation degrades supply drone navigation and delivery accuracy.");
			} else if (group === "tundra") {
				// Snow and sleet — additional cold-weather effects
				overrides.reconDrone  = den("Snowfall grounds small drone operations — accumulation on rotors and electronics, combined with mountain wind, make flight impossible.");
				overrides.aviation    = deg("Snow and mountain cloud ceiling — rotary flight window degraded. Icing risk on approach.");
				overrides.nvgThermal  = deg("Cold precipitation accelerates electronics failure. Battery life critically reduced.");
			} else if (group === "maritime") {
				overrides.reconDrone  = deg("Rain and coastal wind combine to destabilize small drone operations.");
				overrides.aviation    = deg("Precipitation over maritime terrain — sea spray, rain, and wind combine to degrade rotary approach reliability.");
			} else if (group === "volcanic") {
				overrides.reconDrone  = deg("Rain mixing with ash particulates damages rotor systems and coats sensors.");
				overrides.nvgThermal  = deg("Ash-rain particulate coats lenses. Volcanic heat combined with rain creates thermal noise.");
			} else {
				// open / urban / other
				overrides.reconDrone  = deg("Rain degrades small drone sensor package and destabilizes flight in current conditions.");
			}
			break;

		// ── Storm ─────────────────────────────────────────────────────────────
		// Storm grounds all small drone operations everywhere. Aviation and
		// ISR are fully denied in maritime, tundra, and volcanic terrain where
		// storm force winds combine with terrain hazard. In open and urban
		// terrain, systems are degraded rather than denied.
		case "storm":
			overrides.reconDrone  = den("Storm conditions ground all small drone operations — wind gusts make flight impossible and electronics are at risk.");
			overrides.syncDrone   = deg("Storm wind disrupts sync shot drone stability and targeting approach.");
			overrides.combatDrone = deg("Storm wind and zero visibility degrade combat drone flight and targeting systems.");
			overrides.isrDrone    = deg("Storm degrades drone ceiling and severely corrupts optical sensor feed.");
			overrides.lrOptics    = deg("Storm reduces effective optic range — wind-driven precipitation eliminates long-range visibility.");

			if (group === "maritime") {
				overrides.aviation    = den("Storm-force maritime conditions — sea state critical, wind gusts exceed safe aviation envelope. All rotary and fixed-wing assets grounded.");
				overrides.isrDrone    = den("Storm over maritime terrain — drone operations impossible. Wind exceeds structural limits for all drone platforms.");
				overrides.combatDrone = den("Storm grounds combat drone — wind velocity and zero visibility make operations impossible in current maritime conditions.");
			} else if (group === "tundra") {
				overrides.aviation    = den("Blizzard conditions — mountain flight window fully closed. Icing, zero visibility, and gusts exceed all safe aviation parameters.");
				overrides.isrDrone    = den("Blizzard grounds ISR drone — snow accumulation, wind, and zero visibility make drone operations impossible.");
				overrides.combatDrone = den("Blizzard conditions — combat drone cannot operate. Wind and cold render electronics unreliable.");
				overrides.nvgThermal  = deg("Blizzard-driven cold accelerates electronics failure. Snow accumulation on optics and battery life critically reduced.");
				overrides.supplyDrone = den("Blizzard grounds supply drone — delivery precision impossible in zero-visibility conditions.");
			} else if (group === "volcanic") {
				overrides.aviation    = deg("Storm over volcanic terrain — wind-driven ash becomes ballistic hazard to aircraft. Rotary approach unreliable.");
				overrides.nvgThermal  = deg("Storm-driven ash coats thermal and NVG optics — both systems significantly degraded.");
			} else if (group === "tropical" || group === "marsh") {
				overrides.aviation    = deg("Tropical storm conditions — wind and visibility degrade rotary approach. Insertion window unreliable.");
				overrides.nvgThermal  = deg("Storm rain volume degrades thermal baseline — water on sensor creates noise across the frame.");
			} else {
				// open / urban
				overrides.aviation    = deg("Storm conditions — flight window degraded. Element should be ashore before storm peaks.");
			}
			break;

		default:
			break;
	}

	return overrides;
}

// ─── Legacy weather restriction overrides ────────────────────────────────────
// Retained for BriefingGenerator.js which passes old event strings.

export function resolveWeatherRestrictions(weatherEvent) {
	const overrides = {};

	const deg = (reason) => ({ status: STATUS.DEGRADED, source: SOURCE.WEATHER, reason, unlockable: false });
	const den = (reason) => ({ status: STATUS.DENIED,   source: SOURCE.WEATHER, reason, unlockable: false });

	switch (weatherEvent) {
		case "Blizzard":
		case "Whiteout":
			overrides.isrDrone   = den("Blizzard — drone operations impossible. Zero visibility.");
			overrides.aviation   = den("Blizzard — flight window closed entirely.");
			overrides.reconDrone = den("Blizzard grounds all small drone operations.");
			overrides.nvgThermal = deg("Whiteout degrades NVG clarity. Extreme cold accelerates electronics failure.");
			overrides.lrOptics   = den("Zero visibility — optics non-functional.");
			break;
		case "Heavy Rain":
			overrides.isrDrone   = deg("Heavy rain degrades optical sensor clarity.");
			overrides.reconDrone = deg("Rain degrades small drone sensors and destabilizes flight.");
			overrides.lrOptics   = deg("Rain reduces effective optic range.");
			break;
		case "Dense Fog":
		case "Marsh Fog":
			overrides.isrDrone   = deg("Fog ceiling severely limits drone altitude and optical range.");
			overrides.reconDrone = deg("Fog reduces drone visual range to near zero.");
			overrides.lrOptics   = deg("Fog reduces effective optic range significantly.");
			break;
		case "Ash Fall":
			overrides.isrDrone   = deg("Ash coats optical sensors.");
			overrides.reconDrone = deg("Ash damages rotors and degrades sensors.");
			overrides.nvgThermal = deg("Ash coats lenses. Particulate heat signature affects thermal baseline.");
			overrides.lrOptics   = deg("Ash reduces optical clarity.");
			break;
		case "High Wind":
			overrides.aviation   = deg("High wind makes helicopter insertion and extraction unreliable.");
			overrides.reconDrone = den("High wind grounds all small drone operations.");
			break;
		case "Heat Shimmer":
			overrides.isrDrone   = deg("Heat shimmer corrupts long-range optical feed.");
			overrides.nvgThermal = deg("Ambient heat distorts thermal baseline.");
			overrides.lrOptics   = deg("Heat shimmer makes long-range ranging unreliable.");
			break;
		case "Sea Fog":
			overrides.isrDrone   = deg("Sea fog ceiling limits drone altitude and optical clarity.");
			overrides.reconDrone = deg("Sea fog degrades drone visual feed.");
			overrides.lrOptics   = deg("Sea fog reduces effective optic range.");
			break;
		case "Storm Front":
			overrides.isrDrone   = deg("Storm degrades drone ceiling and optical feed.");
			overrides.aviation   = deg("Storm front — flight conditions hazardous. Aviation unreliable.");
			overrides.reconDrone = den("Storm grounds all small drone operations.");
			overrides.lrOptics   = deg("Storm reduces effective optic range.");
			break;
		default:
			break;
	}

	return overrides;
}

// ─── Child inheritance resolver ───────────────────────────────────────────────

function resolveChildInheritance(resolved) {
	const ccStatus = resolved.crossCom.status;
	const ccRank = RANK[ccStatus];

	["sonarVision", "intelGrenades"].forEach((child) => {
		if (RANK[resolved[child].status] < ccRank) {
			resolved[child] = {
				...resolved.crossCom,
				reason: `Inherited — Cross-Com ${ccStatus}. ${resolved.crossCom.reason ?? ""}`.trim(),
			};
		}
	});
}

// ─── Main resolver ────────────────────────────────────────────────────────────
// 1. Deep clone the static province data
// 2. Apply weather overrides — weather wins only if more restrictive
//    Accepts either the legacy weatherEvent string (BriefingGenerator path)
//    or atmosphereContext = { atmosphere, biome } (WeatherPanel path).
// 3. Resolve child inheritance for sonarVision and intelGrenades

export function resolveRestrictions(provinceKey, weatherEvent = null, atmosphereContext = null) {
	const base = PROVINCE_RESTRICTIONS[provinceKey];
	if (!base) return null;

	const resolved = Object.fromEntries(
		Object.entries(base).map(([k, v]) => [k, { ...v }]),
	);

	// Prefer atmosphere context over legacy weather event when both are present
	const overrides = atmosphereContext
		? resolveAtmosphereRestrictions(atmosphereContext.atmosphere, atmosphereContext.biome)
		: weatherEvent
			? resolveWeatherRestrictions(weatherEvent)
			: null;

	if (overrides) {
		for (const [key, override] of Object.entries(overrides)) {
			if (resolved[key] && RANK[override.status] > RANK[resolved[key].status]) {
				resolved[key] = override;
			}
		}
	}

	resolveChildInheritance(resolved);

	return resolved;
}

// ─── Briefing formatter ───────────────────────────────────────────────────────

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
