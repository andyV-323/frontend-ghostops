// ─────────────────────────────────────────────────────────────────────────────
// biome.jsx
// Weather system config — maps each Auroa biome to temperature ranges,
// dynamic weather events, and operational gear considerations.
//
// atmosphere: weighted pool — higher weight = more likely to be selected.
// Conditions: cloudless | sunshine | overcast | precipitation | storm
//
// operationalNotes / gearHints: base arrays, always included.
// atmosphereNotes / atmosphereGear: merged in by Weather.js based on the
//   condition rolled — these reflect the specific sky at insertion time.
// ─────────────────────────────────────────────────────────────────────────────

export const BIOME_WEATHER = {
	// ── Rain Forest ─────────────────────────────────────────────────────────────
	"Rain Forest": {
		tempRange: {
			min: 22,
			max: 34,
			unit: "C",
			fahrenheit: { min: 72, max: 93 },
		},
		atmosphere: [
			{ condition: "cloudless", weight: 2 },
			{ condition: "sunshine", weight: 5 },
			{ condition: "overcast", weight: 23 },
			{ condition: "precipitation", weight: 45 },
			{ condition: "storm", weight: 25 },
		],
		humidity: "extreme",
	},

	// ── Volcanic Rain Forest ────────────────────────────────────────────────────
	"Volcanic Rain Forest": {
		tempRange: {
			min: 24,
			max: 38,
			unit: "C",
			fahrenheit: { min: 75, max: 100 },
		},
		atmosphere: [
			{ condition: "cloudless", weight: 3 },
			{ condition: "sunshine", weight: 8 },
			{ condition: "overcast", weight: 28 },
			{ condition: "precipitation", weight: 38 },
			{ condition: "storm", weight: 23 },
		],
		humidity: "high",
	},

	// ── Volcanic Desert ─────────────────────────────────────────────────────────
	"Volcanic Dessert": {
		tempRange: {
			min: 32,
			max: 52,
			unit: "C",
			fahrenheit: { min: 90, max: 126 },
		},
		atmosphere: [
			{ condition: "cloudless", weight: 55 },
			{ condition: "sunshine", weight: 40 },
			{ condition: "overcast", weight: 5 },
		],
		humidity: "very low",
	},

	// ── High Cliffs ──────────────────────────────────────────────────────────────
	"High Cliffs": {
		tempRange: {
			min: 8,
			max: 22,
			unit: "C",
			fahrenheit: { min: 46, max: 72 },
		},
		atmosphere: [
			{ condition: "cloudless", weight: 10 },
			{ condition: "sunshine", weight: 20 },
			{ condition: "overcast", weight: 35 },
			{ condition: "precipitation", weight: 25 },
			{ condition: "storm", weight: 10 },
		],
		humidity: "moderate",
	},

	// ── Salt Marsh ───────────────────────────────────────────────────────────────
	"Salt Marsh": {
		tempRange: {
			min: 10,
			max: 24,
			unit: "C",
			fahrenheit: { min: 50, max: 75 },
		},
		atmosphere: [
			{ condition: "cloudless", weight: 5 },
			{ condition: "sunshine", weight: 10 },
			{ condition: "overcast", weight: 40 },
			{ condition: "precipitation", weight: 35 },
			{ condition: "storm", weight: 10 },
		],
		humidity: "very high",
	},

	// ── High Tundra ──────────────────────────────────────────────────────────────
	"High Thundra": {
		tempRange: {
			min: -18,
			max: 6,
			unit: "C",
			fahrenheit: { min: 0, max: 43 },
		},
		atmosphere: [
			{ condition: "cloudless", weight: 20 },
			{ condition: "sunshine", weight: 15 },
			{ condition: "overcast", weight: 30 },
			{ condition: "precipitation", weight: 25 },
			{ condition: "storm", weight: 10 },
		],
		humidity: "low",
	},

	// ── Fjordlands ───────────────────────────────────────────────────────────────
	Fjordlands: {
		tempRange: {
			min: 2,
			max: 16,
			unit: "C",
			fahrenheit: { min: 36, max: 61 },
		},
		atmosphere: [
			{ condition: "cloudless", weight: 5 },
			{ condition: "sunshine", weight: 15 },
			{ condition: "overcast", weight: 35 },
			{ condition: "precipitation", weight: 25 },
			{ condition: "storm", weight: 20 },
		],
		humidity: "high",
	},

	// ── Rain Shadows ──────────────────────────────────────────────────────────────
	"Rain Shadows": {
		tempRange: {
			min: 6,
			max: 20,
			unit: "C",
			fahrenheit: { min: 43, max: 68 },
		},
		atmosphere: [
			{ condition: "cloudless", weight: 25 },
			{ condition: "sunshine", weight: 35 },
			{ condition: "overcast", weight: 25 },
			{ condition: "precipitation", weight: 12 },
			{ condition: "storm", weight: 3 },
		],
		humidity: "low to moderate",
	},

	// ── Mead Lands ────────────────────────────────────────────────────────────────
	"Mead Lands": {
		tempRange: {
			min: 10,
			max: 24,
			unit: "C",
			fahrenheit: { min: 50, max: 75 },
		},
		atmosphere: [
			{ condition: "cloudless", weight: 20 },
			{ condition: "sunshine", weight: 35 },
			{ condition: "overcast", weight: 25 },
			{ condition: "precipitation", weight: 15 },
			{ condition: "storm", weight: 5 },
		],
		humidity: "moderate",
	},

	// ── Meadow Lands and Urban City ───────────────────────────────────────────────
	"Meadow Lands and Urban City": {
		tempRange: {
			min: 12,
			max: 26,
			unit: "C",
			fahrenheit: { min: 54, max: 79 },
		},
		atmosphere: [
			{ condition: "cloudless", weight: 15 },
			{ condition: "sunshine", weight: 30 },
			{ condition: "overcast", weight: 30 },
			{ condition: "precipitation", weight: 18 },
			{ condition: "storm", weight: 7 },
		],
		humidity: "moderate",
	},

	// ── Meadow Lands (WindyIslands) ───────────────────────────────────────────────
	"Meadow Lands": {
		tempRange: {
			min: 8,
			max: 20,
			unit: "C",
			fahrenheit: { min: 46, max: 68 },
		},
		atmosphere: [
			{ condition: "cloudless", weight: 10 },
			{ condition: "sunshine", weight: 25 },
			{ condition: "overcast", weight: 35 },
			{ condition: "precipitation", weight: 22 },
			{ condition: "storm", weight: 8 },
		],
		humidity: "moderate to high",
	},

	// ── High Tundra and Rain Shadows ──────────────────────────────────────────────
	"High Thundra and Rain Shadows": {
		tempRange: {
			min: -10,
			max: 10,
			unit: "C",
			fahrenheit: { min: 14, max: 50 },
		},
		atmosphere: [
			{ condition: "cloudless", weight: 20 },
			{ condition: "sunshine", weight: 12 },
			{ condition: "overcast", weight: 30 },
			{ condition: "precipitation", weight: 25 },
			{ condition: "storm", weight: 13 },
		],
		humidity: "low",
	},
};
