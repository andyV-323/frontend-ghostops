/**
 * Advanced recon modifier engine.
 * Handles all 6 recon types, unique question weights, and asset mismatch detection.
 *
 * @param {object} reconResult - answers from ReconDebriefAdvanced
 * @returns {object} modifiers + mismatch report
 */

// ── Asset definitions ────────────────────────────────────────────────────────
export const ASSETS = {
	scout_drone: {
		id: "scout_drone",
		label: "Scout Drone",
		description: "Small, quiet, low signature.",
	},
	armaros: {
		id: "armaros",
		label: "Armaros Drone",
		description: "Armed call-in drone, higher profile.",
	},
	helicopter: {
		id: "helicopter",
		label: "Helicopter",
		description: "Flyover or transport, high signature.",
	},
	armed_vehicle: {
		id: "armed_vehicle",
		label: "Armed Vehicle",
		description: "Ground mobility, visible presence.",
	},
	op: {
		id: "op",
		label: "Observation Post (OP)",
		description: "Embedded stationary position, zero movement.",
	},
};

// ── Recommended assets per recon type ───────────────────────────────────────
export const RECON_TYPE_META = {
	standard: {
		label: "Standard Recon",
		description:
			"General purpose debrief for any recon operation. No specialization required.",
		recommendedAssets: "Any configuration",
		goodAssets: Object.keys(ASSETS),
		badAssets: [],
	},
	route: {
		label: "Route Recon",
		description:
			"Systematic examination of a specific path or axis of advance. Confirms insertion and exfil routes are clear before committing the main element.",
		recommendedAssets: "Scout drone or light vehicle",
		goodAssets: ["scout_drone", "armed_vehicle"],
		badAssets: ["helicopter", "armaros"],
		mismatchPenalty: "intel_reduction",
	},
	area: {
		label: "Area Recon",
		description:
			"Broad reconnaissance of a defined sector to establish general enemy presence and activity patterns. Wide but shallow intel — useful when the objective isn't precisely confirmed.",
		recommendedAssets: "Armaros drone or helicopter flyover",
		goodAssets: ["armaros", "helicopter", "scout_drone"],
		badAssets: ["op"],
		mismatchPenalty: "accuracy_cap",
	},
	zone: {
		label: "Zone Recon",
		description:
			"Detailed close-target survey of a compound or facility. Produces entry point data, guard rotations, patrol timing, and HVT location. Highest intel accuracy ceiling.",
		recommendedAssets: "Scout drone or embedded OP",
		goodAssets: ["scout_drone", "op"],
		badAssets: ["helicopter", "armed_vehicle", "armaros"],
		mismatchPenalty: "compromise_bump",
	},
	rif: {
		label: "Recon-in-Force",
		description:
			"Deliberate armed probe to draw enemy reaction and assess defensive posture. Contact is intentional. Maps reinforcement patterns and response speed before a major assault.",
		recommendedAssets: "Armed vehicles or helicopter gunship overwatch",
		goodAssets: ["armed_vehicle", "helicopter"],
		badAssets: ["scout_drone", "op"],
		mismatchPenalty: "rif_reduction",
	},
	special: {
		label: "Special Recon",
		description:
			"Covert long-duration observation by a small embedded element. Operators establish a hide site and observe over time. Intel scales with duration. Catastrophic if burned.",
		recommendedAssets: "Observation post or no equipment assets",
		goodAssets: ["op"],
		badAssets: ["armaros", "helicopter", "armed_vehicle"],
		mismatchPenalty: "compromise_bump",
	},
};

// ── Compromise tier bumping ──────────────────────────────────────────────────
const COMPROMISE_TIERS = ["cold", "warm", "engaged_exfil", "engaged", "burned"];

const bumpCompromise = (current) => {
	const idx = COMPROMISE_TIERS.indexOf(current);
	return COMPROMISE_TIERS[Math.min(idx + 1, COMPROMISE_TIERS.length - 1)];
};

// ── Launch window builder ────────────────────────────────────────────────────
const buildLaunchWindows = (compromise) => {
	const windows = {
		night: { label: "Night", hours: "2000 – 0400", authorized: false },
		dawn: { label: "Dawn", hours: "0400 – 0600", authorized: false },
		day: { label: "Day", hours: "0600 – 1800", authorized: false },
		dusk: { label: "Dusk", hours: "1800 – 2000", authorized: false },
	};

	if (compromise === "cold") {
		windows.night.authorized = true;
		windows.dawn.authorized = true;
		windows.day.authorized = true;
		windows.dusk.authorized = true;
	} else if (compromise === "warm") {
		windows.dusk.authorized = true;
	} else if (compromise === "engaged_exfil" || compromise === "engaged") {
		windows.dawn.authorized = true;
	} else if (compromise === "burned") {
		windows.day.authorized = true;
	}

	return windows;
};

// ── Main modifier engine ─────────────────────────────────────────────────────
export const getAdvancedMissionModifiers = (reconResult) => {
	const {
		reconType = "standard",
		survey = "full",
		compromise: rawCompromise = "cold",
		casualties = "none",
		observation = "extended",
		rifIntel = "patterns",
		routeStatus = "cleared",
		assets = [],
	} = reconResult;

	// Derive teamSize from selected assets — solo/two_man/full_squad are asset choices
	const teamSize =
		assets.includes("full_squad") ? "squad"
		: assets.includes("solo") ? "solo"
		: "two";

	const typeMeta = RECON_TYPE_META[reconType];

	const PERSONNEL_ASSETS = ["solo", "two_man", "full_squad"];

	// Only check non-personnel assets for mismatches
	const equipmentAssets = assets.filter((a) => !PERSONNEL_ASSETS.includes(a));
	const mismatchedAssets = equipmentAssets.filter((a) =>
		typeMeta.badAssets.includes(a),
	);
	const hasMismatch = mismatchedAssets.length > 0;
	const mismatchPenalty = hasMismatch ? typeMeta.mismatchPenalty : null;

	// ── Resolve effective compromise (may be bumped by mismatch) ────────
	let effectiveCompromise = rawCompromise;

	// RIF always starts at WARM minimum
	if (reconType === "rif") {
		const rifIdx = COMPROMISE_TIERS.indexOf(effectiveCompromise);
		if (rifIdx < COMPROMISE_TIERS.indexOf("warm")) {
			effectiveCompromise = "warm";
		}
	}

	// Mismatch bumps compromise one tier for zone and special recon
	if (hasMismatch && mismatchPenalty === "compromise_bump") {
		effectiveCompromise = bumpCompromise(effectiveCompromise);
	}

	// ── Base modifiers ───────────────────────────────────────────────────
	const modifiers = {
		reconType,
		reconTypeLabel: typeMeta.label,

		compromiseLevel: effectiveCompromise.toUpperCase(),
		compromiseBadge:
			(
				effectiveCompromise === "engaged_exfil" ||
				effectiveCompromise === "engaged"
			) ?
				"hot"
			:	effectiveCompromise,
		difficulty: "Regular",

		// HUD & Intel
		UAS: true,
		crossCom: true,

		// Air support
		armarosDrone: true,
		strikeDesignator: true,

		// Insertion
		vehicleInsertion: true,

		// Teammate abilities
		teammateAbilities: true,

		// Loadout
		suppressorsAvailable: true,

		// Intel
		intelAccuracy: 100,
		intelLabel: getIntelLabel(reconType),

		// Launch windows
		launchWindows: buildLaunchWindows(effectiveCompromise),

		// Team / observation
		teamSize,
		casualties,

		// Mismatch report
		hasMismatch,
		mismatchedAssets: mismatchedAssets.map((id) => ASSETS[id]?.label || id),
		mismatchPenalty,
		mismatchDescription: getMismatchDescription(
			mismatchPenalty,
			mismatchedAssets,
		),

		// Enemy
		enemyState: "Unalerted",
		enemyStateDetail: "Enemy forces have no awareness of incoming operations.",
	};

	// ── Type-specific intel accuracy base ───────────────────────────────
	if (reconType === "area") {
		// Area recon caps at 70% — always broad, never granular
		modifiers.intelAccuracy = Math.min(modifiers.intelAccuracy, 70);
	}

	if (reconType === "route") {
		modifiers.intelAccuracy =
			routeStatus === "cleared" ? 100
			: routeStatus === "partial" ? 60
			: 20;
	}

	if (reconType === "special") {
		modifiers.intelAccuracy =
			observation === "short" ? 60
			: observation === "extended" ? 85
			: 100; // long duration
		// Special recon team size is always solo/2-man — no team size question
	}

	if (reconType === "rif") {
		// RIF produces pattern intel, not positional intel
		modifiers.intelAccuracy =
			rifIntel === "patterns" ? 70
			: rifIntel === "reinforcements" ? 60
			: rifIntel === "defensive" ? 80
			: 30; // limited
		modifiers.suppressorsAvailable = false; // always went loud
	}

	// ── Survey-based accuracy (zone, area, standard) ─────────────────────
	if (["zone", "area", "standard"].includes(reconType)) {
		if (survey === "partial")
			modifiers.intelAccuracy = Math.min(
				modifiers.intelAccuracy * 0.6,
				modifiers.intelAccuracy,
			);
		if (survey === "none") {
			modifiers.intelAccuracy = 0;
			// No intel = no target data for precision assets
			modifiers.UAS = false;
			modifiers.armarosDrone = false;
			modifiers.strikeDesignator = false;
		}
	}

	// ── Mismatch accuracy penalties ──────────────────────────────────────
	if (hasMismatch) {
		if (mismatchPenalty === "accuracy_cap") {
			modifiers.intelAccuracy = Math.min(modifiers.intelAccuracy, 50);
		}
		if (mismatchPenalty === "intel_reduction") {
			modifiers.intelAccuracy = Math.max(modifiers.intelAccuracy - 25, 0);
		}
		if (mismatchPenalty === "rif_reduction") {
			modifiers.intelAccuracy = Math.max(modifiers.intelAccuracy - 30, 0);
		}
	}

	// ── Team size modifier ───────────────────────────────────────────────
	if (reconType !== "special" && reconType !== "rif") {
		if (teamSize === "solo")
			modifiers.intelAccuracy = Math.max(modifiers.intelAccuracy - 15, 0);
		if (teamSize === "squad")
			modifiers.intelAccuracy = Math.min(modifiers.intelAccuracy + 10, 100);
	}

	modifiers.intelAccuracy = Math.round(modifiers.intelAccuracy);

	// ── Compromise penalties (shared with standard logic) ────────────────
	if (effectiveCompromise === "warm") {
		modifiers.difficulty = "Advanced";
		modifiers.armarosDrone = false;
		modifiers.enemyState = "Heightened Alert";
		modifiers.enemyStateDetail =
			"Enemy forces detected unusual activity in the AO. Patrol frequency is elevated and response times are faster.";
	}

	if (effectiveCompromise === "engaged_exfil") {
		modifiers.difficulty = "Extreme";
		modifiers.armarosDrone = false;
		modifiers.strikeDesignator = false;
		modifiers.suppressorsAvailable = false;
		modifiers.enemyState = "Alerted";
		modifiers.enemyStateDetail =
			"Recon element engaged during extraction. Enemy forces are on alert. Air support unavailable — go loud.";
	}

	if (effectiveCompromise === "engaged") {
		modifiers.difficulty = "Extreme";
		modifiers.armarosDrone = false;
		modifiers.strikeDesignator = false;
		modifiers.UAS = false;
		modifiers.vehicleInsertion = false;
		modifiers.suppressorsAvailable = false;
		modifiers.enemyState = "Full Alert";
		modifiers.enemyStateDetail =
			"Recon element engaged and extracted under fire. Compound locked down. All air support offline. Foot insertion only.";
	}

	if (effectiveCompromise === "burned") {
		modifiers.difficulty = "Extreme";
		modifiers.armarosDrone = false;
		modifiers.strikeDesignator = false;
		modifiers.UAS = false;
		modifiers.crossCom = false;
		modifiers.vehicleInsertion = false;
		modifiers.teammateAbilities = false;
		modifiers.suppressorsAvailable = false;
		modifiers.enemyState = "Maximum Alert";
		modifiers.enemyStateDetail =
			"Recon element neutralized. Enemy has full awareness of the incoming operation. All assets offline. No signature, no support.";
	}

	// ── Route recon vehicle insertion override ───────────────────────────
	if (reconType === "route") {
		if (routeStatus === "partial") {
			// Partial route clearance — vehicle insertion risky but possible
			modifiers.vehicleInsertion = false;
			modifiers.suppressorsAvailable = false; // assume noise during clearance
		}
		if (routeStatus === "compromised") {
			// Route is hot — no vehicle, no suppressed approach
			modifiers.vehicleInsertion = false;
			modifiers.suppressorsAvailable = false;
			modifiers.armarosDrone = false; // signature already blown
			modifiers.difficulty =
				modifiers.difficulty === "Regular" ? "Advanced" : modifiers.difficulty;
		}
	}

	// ── Area recon — shallow intel means reduced asset confidence ────────
	if (reconType === "area") {
		// Area recon never gives precise enough intel for UAS target locking
		if (modifiers.intelAccuracy < 50) {
			modifiers.UAS = false;
			modifiers.armarosDrone = false;
			modifiers.strikeDesignator = false;
		}
	}

	// ── Special recon — observation duration affects asset availability ──
	if (reconType === "special") {
		if (observation === "short") {
			// Rushed observation — UAS data unreliable, no precision assets
			modifiers.UAS = false;
			modifiers.armarosDrone = false;
		}
		// Burned SR is catastrophic — operator was embedded close enough
		// that the enemy now knows exact team composition and approach
		if (effectiveCompromise === "burned" || effectiveCompromise === "engaged") {
			modifiers.vehicleInsertion = false;
			modifiers.teammateAbilities = false;
		}
	}

	// ── RIF — pattern intel doesn't support precision strikes ────────────
	if (reconType === "rif") {
		if (rifIntel === "limited") {
			// Probe drew no useful response — enemy aware but no intel gained
			modifiers.UAS = false;
			modifiers.strikeDesignator = false;
			modifiers.armarosDrone = false;
		}
	}

	return modifiers;
};

// ── Helper: intel label per recon type ──────────────────────────────────────
const getIntelLabel = (reconType) => {
	switch (reconType) {
		case "route":
			return "Route Clearance Assessment";
		case "area":
			return "Sector Survey Coverage";
		case "zone":
			return "Compound Intel Coverage";
		case "rif":
			return "Enemy Pattern Assessment";
		case "special":
			return "Observation Confidence";
		default:
			return "Intel Accuracy";
	}
};

// ── Helper: mismatch description ────────────────────────────────────────────
const getMismatchDescription = (penalty, mismatchedAssets) => {
	if (!penalty || mismatchedAssets.length === 0) return null;

	const assetNames = mismatchedAssets
		.map((id) => ASSETS[id]?.label || id)
		.join(", ");

	switch (penalty) {
		case "compromise_bump":
			return `${assetNames} introduced too much signature for this recon type. Compromise level escalated one tier.`;
		case "accuracy_cap":
			return `${assetNames} insufficient to cover the required area. Intel accuracy capped at 50%.`;
		case "intel_reduction":
			return `${assetNames} inappropriate for route clearance. Objective intel reduced by 25%.`;
		case "rif_reduction":
			return `${assetNames} insufficient to draw a meaningful enemy response. Pattern intel reduced.`;
		default:
			return null;
	}
};

export const COMPROMISE_META = {
	cold: {
		label: "COLD",
		color: "text-emerald-400",
		border: "border-emerald-400/40",
		bg: "bg-emerald-400/10",
		dot: "bg-emerald-400",
	},
	warm: {
		label: "WARM",
		color: "text-amber-400",
		border: "border-amber-400/40",
		bg: "bg-amber-400/10",
		dot: "bg-amber-400",
	},
	hot: {
		label: "HOT",
		color: "text-orange-400",
		border: "border-orange-400/40",
		bg: "bg-orange-400/10",
		dot: "bg-orange-400",
	},
	burned: {
		label: "BURNED",
		color: "text-red-400",
		border: "border-red-400/40",
		bg: "bg-red-400/10",
		dot: "bg-red-400 animate-pulse",
	},
};
