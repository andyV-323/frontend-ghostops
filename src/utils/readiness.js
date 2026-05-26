import { calcConditionLevel } from "@/config/fatigue";

export { calcConditionLevel };

const MAX_FATIGUE = 16;

// 3-level readiness bands derived from fatiguePoints percentage
export function getReadinessLevel(fatiguePoints = 0) {
	const pct = fatiguePoints / MAX_FATIGUE;
	if (pct >= 0.67) return "CombatIneffective";
	if (pct >= 0.34) return "Degraded";
	return "Ready";
}

// Returns the fatiguePoints value to set when resting one readiness band down.
// CI → Degraded: cap at top of Degraded band (10 pts, 62.5%)
// Degraded → Ready: cap at top of Ready band (5 pts, 31.25%)
// Ready: full rest to 0
export function getRestTarget(fatiguePoints = 0) {
	const level = getReadinessLevel(fatiguePoints);
	if (level === "CombatIneffective") return 10;
	if (level === "Degraded") return 5;
	return 0;
}

export const READINESS_META = {
	Ready: {
		label: "Ready",
		hex: "#4ade80",
		bg: "rgba(74,222,128,0.08)",
		border: "rgba(74,222,128,0.25)",
		desc: "Fully rested and combat effective",
	},
	Degraded: {
		label: "Degraded",
		hex: "#fbbf24",
		bg: "rgba(251,191,36,0.08)",
		border: "rgba(251,191,36,0.25)",
		desc: "Fatigued — soft warning, still mission capable",
	},
	CombatIneffective: {
		label: "Combat Ineffective",
		hex: "#ef4444",
		bg: "rgba(239,68,68,0.08)",
		border: "rgba(239,68,68,0.25)",
		desc: "Exhausted — hard lock, mandatory rest required",
	},
};
