/**
 * Computes mission modifier package from recon debrief answers.
 * @param {{ survey: string, compromise: string, casualties: string }} reconResult
 * @returns {object} modifiers
 */
export const getMissionModifiers = (reconResult) => {
	const { survey, compromise, casualties } = reconResult;

	// Base modifiers — full COLD state, all advantages active
	const modifiers = {
		compromiseLevel: "COLD",
		compromiseBadge: "cold",
		difficulty: "Regular",

		// HUD & Intel
		UAS: true,
		crossCom: true,

		// Vehicle insertion
		vehicleInsertion: true,

		// Air support — vanilla compatible
		armarosDrone: true, // in-game call-in drone, available to all players
		strikeDesignator: true, // artillery / A-10 roleplay strike designator

		// Teammate abilities — single on/off
		teammateAbilities: true,

		// Suppressors — available = advantage. Lost = go loud penalty
		suppressorsAvailable: true,

		// Intel
		intelAccuracy: 100,

		// Team size intel modifier
		teamSize: "two",

		// Launch windows — derived from compromise, set below
		launchWindows: {},
		enemyState: "Unalerted",
		enemyStateDetail:
			"Enemy forces have no awareness of incoming operations. Full asset package authorized. Maintain Ghost Protocol.",

		casualties,
	};

	// ── Intel accuracy from survey ──────────────────────────────────
	if (survey === "partial") modifiers.intelAccuracy = 60;
	if (survey === "none") modifiers.intelAccuracy = 0;

	// ── Compromise penalties ────────────────────────────────────────

	if (compromise === "warm") {
		modifiers.compromiseLevel = "WARM";
		modifiers.compromiseBadge = "warm";
		modifiers.difficulty = "Advanced";
		modifiers.enemyState = "Heightened Alert";
		modifiers.enemyStateDetail =
			"Enemy forces detected unusual activity in the AO. Patrol frequency is elevated and response times are faster. Reaper strike is too high-profile for current threat conditions.";
		modifiers.armarosDrone = false;
		modifiers.intelAccuracy = Math.max(modifiers.intelAccuracy - 10, 0);
	}

	if (compromise === "engaged_exfil") {
		modifiers.compromiseLevel = "HOT";
		modifiers.compromiseBadge = "hot";
		modifiers.difficulty = "Extreme";
		modifiers.enemyState = "Alerted";
		modifiers.enemyStateDetail =
			"Recon element engaged during extraction. Enemy forces are on alert. High-profile air assets are offline. Go loud — suppressors are no longer an advantage.";
		modifiers.armarosDrone = false;
		modifiers.strikeDesignator = false;
		modifiers.suppressorsAvailable = false;
		modifiers.intelAccuracy = Math.max(modifiers.intelAccuracy - 15, 0);
	}

	if (compromise === "engaged") {
		modifiers.compromiseLevel = "HOT";
		modifiers.compromiseBadge = "hot";
		modifiers.difficulty = "Extreme";
		modifiers.enemyState = "Full Alert";
		modifiers.enemyStateDetail =
			"Recon element engaged and extracted under fire. Compound is locked down. All air support offline. UAS compromised. Vehicle insertion is blown — foot infil only. Go loud.";
		modifiers.armarosDrone = false;
		modifiers.strikeDesignator = false;
		modifiers.UAS = false;
		modifiers.vehicleInsertion = false;
		modifiers.suppressorsAvailable = false;
		modifiers.intelAccuracy = Math.max(modifiers.intelAccuracy - 30, 0);
	}

	if (compromise === "burned") {
		modifiers.compromiseLevel = "BURNED";
		modifiers.compromiseBadge = "burned";
		modifiers.difficulty = "Extreme";
		modifiers.enemyState = "Maximum Alert";
		modifiers.enemyStateDetail =
			"Recon element neutralized. Enemy has full awareness of the incoming operation. All air assets, UAS, and Cross-Com are offline. Teammate support is unavailable. Foot insertion only. No suppressors — they know you're coming.";
		modifiers.armarosDrone = false;
		modifiers.strikeDesignator = false;
		modifiers.UAS = false;
		modifiers.crossCom = false;
		modifiers.vehicleInsertion = false;
		modifiers.teammateAbilities = false;
		modifiers.suppressorsAvailable = false;
		modifiers.intelAccuracy = 0;
	}

	// ── Launch window — derived from compromise ──────────────────────────
	// Defines which time windows are authorized for the main operation
	const TIME_WINDOWS = {
		night: { label: "Night", hours: "2000 – 0400", authorized: false },
		dawn: { label: "Dawn", hours: "0400 – 0600", authorized: false },
		day: { label: "Day", hours: "0600 – 1800", authorized: false },
		dusk: { label: "Dusk", hours: "1800 – 2000", authorized: false },
	};

	if (compromise === "cold") {
		// All windows open
		TIME_WINDOWS.night.authorized = true;
		TIME_WINDOWS.dawn.authorized = true;
		TIME_WINDOWS.day.authorized = true;
		TIME_WINDOWS.dusk.authorized = true;
	} else if (compromise === "warm") {
		// Night and transitional only — daylight too exposed
		TIME_WINDOWS.dusk.authorized = true;
	} else if (compromise === "engaged_exfil" || compromise === "engaged") {
		// Transitional windows only
		TIME_WINDOWS.dawn.authorized = true;
	} else if (compromise === "burned") {
		// Daytime only — enemy is fully prepared, darkness favors them now
		TIME_WINDOWS.day.authorized = true;
	}

	modifiers.launchWindows = TIME_WINDOWS;

	// ── Team size intel modifier ─────────────────────────────────────────
	const teamSize = reconResult.teamSize || "two";
	modifiers.teamSize = teamSize;

	if (teamSize === "solo") {
		// One set of eyes — intel accuracy penalty regardless of survey result
		modifiers.intelAccuracy = Math.max(modifiers.intelAccuracy - 15, 0);
	} else if (teamSize === "squad") {
		// Multiple operators cross-confirming — small accuracy bonus, capped at 100
		modifiers.intelAccuracy = Math.min(modifiers.intelAccuracy + 10, 100);
	}

	return modifiers;
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
