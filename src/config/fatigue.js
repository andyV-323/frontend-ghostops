// Fatigue system configuration

export const CONDITION_LEVELS = [
	"Fresh",
	"Steady",
	"Worn",
	"Degraded",
	"Spent",
];

export const CONDITION_RANK = {
	Fresh: 0,
	Steady: 1,
	Worn: 2,
	Degraded: 3,
	Spent: 4,
};

export const CONDITION_META = {
	Fresh: {
		label: "Fresh",
		hex: "#4ade80",
		bg: "rgba(74,222,128,0.08)",
		border: "rgba(74,222,128,0.25)",
		desc: "Just deployed or recently rested — peak readiness",
	},
	Steady: {
		label: "Steady",
		hex: "#a3e635",
		bg: "rgba(163,230,53,0.08)",
		border: "rgba(163,230,53,0.25)",
		desc: "Operational baseline — fully mission effective",
	},
	Worn: {
		label: "Worn",
		hex: "#facc15",
		bg: "rgba(250,204,21,0.08)",
		border: "rgba(250,204,21,0.25)",
		desc: "Accumulated fatigue — still combat effective",
	},
	Degraded: {
		label: "Degraded",
		hex: "#f97316",
		bg: "rgba(249,115,22,0.08)",
		border: "rgba(249,115,22,0.25)",
		desc: "Notable performance impact — rotate soon",
	},
	Spent: {
		label: "Spent",
		hex: "#ef4444",
		bg: "rgba(239,68,68,0.08)",
		border: "rgba(239,68,68,0.25)",
		desc: "Combat-ineffective — mandatory rest required",
	},
};

// Fatigue points added per day based on mission category
export const MISSION_FATIGUE = {
	"Direct Action": 2,
	"HVT Elimination": 2,
	Recon: 1,
	Sabotage: 2,
	"Hostage Rescue": 2,
	"Convoy Interdiction": 2,
	Overwatch: 1,
	Support: 1,
};

// Fatigue points added per day based on biome
export const BIOME_FATIGUE = {
	"Volcanic Rain Forest": 2,
	"Volcanic Dessert": 2,
	"High Thundra": 2,
	"Rain Forest": 1,
	"High Cliffs": 1,
	"Salt Marsh": 1,
	Fjordlands: 1,
	"High Thundra and Rain Shadows": 1,
	"Rain Shadows": 0,
	"Mead Lands": 0,
	"Meadow Lands": 0,
	"Meadow Lands and Urban City": 0,
};

// Fatigue points added per day based on weather
export const WEATHER_FATIGUE = {
	storm: 1,
	precipitation: 1,
	overcast: 0,
	sunshine: 0,
	cloudless: 0,
};

// Points needed to reach each rank from 0
export const CONDITION_THRESHOLDS = [0, 4, 8, 12, 16];

// Rest removes this many accumulated points per rest day
export const REST_RECOVERY = 4;

export function calcConditionLevel(points) {
	let level = "Fresh";
	for (let i = CONDITION_THRESHOLDS.length - 1; i >= 0; i--) {
		if (points >= CONDITION_THRESHOLDS[i]) {
			level = CONDITION_LEVELS[i];
			break;
		}
	}
	return level;
}
