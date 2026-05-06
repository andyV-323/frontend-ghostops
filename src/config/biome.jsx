// ─────────────────────────────────────────────────────────────────────────────
// biome.jsx
// Weather system config — maps each Auroa biome to temperature ranges,
// dynamic weather events, and operational gear considerations.
//
// atmosphere: weighted pool — higher weight = more likely to be selected.
// Conditions: cloudless | sunshine | overcast | precipitation | storm
// ─────────────────────────────────────────────────────────────────────────────

export const BIOME_WEATHER = {
	// ── Rain Forest ─────────────────────────────────────────────────────────────
	// CapeNorth, DriftwoodIslets
	// Dense tropical canopy. Perpetually humid. Heavy rain is the norm.
	"Rain Forest": {
		tempRange: {
			min: 22,
			max: 34,
			unit: "C",
			fahrenheit: { min: 72, max: 93 },
		},
		atmosphere: [
			{ condition: "cloudless",    weight: 2  },
			{ condition: "sunshine",     weight: 5  },
			{ condition: "overcast",     weight: 23 },
			{ condition: "precipitation",weight: 45 },
			{ condition: "storm",        weight: 25 },
		],
		humidity: "extreme",
		operationalNotes: [
			"Canopy provides natural concealment but limits air support visibility",
			"Mud and wet terrain slow movement and leave tracks",
			"Rain masks sound — favors close-range engagement",
			"Optics fog quickly in high humidity",
		],
		gearHints: [
			"Waterproof gear advised",
			"Jungle boots recommended",
			"Insect protection relevant in dense undergrowth",
			"Light layers — heat and humidity are the primary threat",
		],
	},

	// ── Volcanic Rain Forest ────────────────────────────────────────────────────
	// Golem1, Golem2
	// Tropical base but with volcanic activity. Ash and heat add complexity.
	"Volcanic Rain Forest": {
		tempRange: {
			min: 24,
			max: 38,
			unit: "C",
			fahrenheit: { min: 75, max: 100 },
		},
		atmosphere: [
			{ condition: "cloudless",    weight: 3  },
			{ condition: "sunshine",     weight: 8  },
			{ condition: "overcast",     weight: 28 },
			{ condition: "precipitation",weight: 38 },
			{ condition: "storm",        weight: 23 },
		],
		humidity: "high",
		operationalNotes: [
			"Ash fall reduces visibility and coats optics",
			"Volcanic terrain is unstable — limits vehicle movement near lava zones",
			"Sulfur presence can compromise respiratory function over extended exposure",
			"Heat from lava vents affects thermal imaging",
		],
		gearHints: [
			"Respiratory protection relevant near active zones",
			"Eye protection essential during ash events",
			"Heat-resistant outer layer recommended in lava-adjacent sectors",
			"Waterproof base layer still required",
		],
	},

	// ── Volcanic Desert ─────────────────────────────────────────────────────────
	// Golem3
	// No-Man's Land. Extreme heat, lava terrain, no vegetation, minimal cover.
	"Volcanic Dessert": {
		tempRange: {
			min: 32,
			max: 52,
			unit: "C",
			fahrenheit: { min: 90, max: 126 },
		},
		atmosphere: [
			{ condition: "cloudless",    weight: 55 },
			{ condition: "sunshine",     weight: 40 },
			{ condition: "overcast",     weight: 5  },
		],
		humidity: "very low",
		operationalNotes: [
			"Extreme heat degrades operator performance rapidly",
			"No natural cover — movement is fully exposed",
			"Heat shimmer severely impacts long-range targeting",
			"Lava channels create natural chokepoints and movement barriers",
			"Thermal imaging unreliable due to ambient heat signature",
		],
		gearHints: [
			"Heat protection is critical — light desert kit",
			"Hydration capacity is a limiting factor on op duration",
			"Respiratory protection essential",
			"Eye and skin protection from ash and UV",
		],
	},

	// ── High Cliffs ──────────────────────────────────────────────────────────────
	// WildCoast, SmugglersCoves, WhalersBay
	// Coastal cliff terrain. Exposed to ocean wind. Variable weather, fast changes.
	"High Cliffs": {
		tempRange: {
			min: 8,
			max: 22,
			unit: "C",
			fahrenheit: { min: 46, max: 72 },
		},
		atmosphere: [
			{ condition: "cloudless",    weight: 10 },
			{ condition: "sunshine",     weight: 20 },
			{ condition: "overcast",     weight: 35 },
			{ condition: "precipitation",weight: 25 },
			{ condition: "storm",        weight: 10 },
		],
		humidity: "moderate",
		operationalNotes: [
			"High wind makes HALO/LALO approaches unpredictable — affects drop accuracy",
			"Sea fog provides concealment but complicates navigation",
			"Cliff faces are slick when wet — vertical movement is high risk",
			"Wind affects long-range precision fire significantly",
			"Coastal approach by boat viable but sea state variable",
		],
		gearHints: [
			"Wind-resistant outer layer recommended",
			"Climbing or rappelling equipment relevant for cliff objectives",
			"Non-slip footwear critical on wet rock",
			"Layered kit for rapid temperature shifts",
		],
	},

	// ── Salt Marsh ───────────────────────────────────────────────────────────────
	// FenBog, SinkingCountry
	// Low-lying wetlands. Waterlogged terrain. Fog is a constant factor.
	"Salt Marsh": {
		tempRange: {
			min: 10,
			max: 24,
			unit: "C",
			fahrenheit: { min: 50, max: 75 },
		},
		atmosphere: [
			{ condition: "cloudless",    weight: 5  },
			{ condition: "sunshine",     weight: 10 },
			{ condition: "overcast",     weight: 40 },
			{ condition: "precipitation",weight: 35 },
			{ condition: "storm",        weight: 10 },
		],
		humidity: "very high",
		operationalNotes: [
			"Marsh fog can reduce visibility to under 20 meters",
			"Waterlogged ground severely limits vehicle movement",
			"Noise discipline difficult — wet terrain amplifies movement sound",
			"Drone operations impacted by low cloud and fog ceiling",
			"Boat movement possible through channels even in inland areas",
		],
		gearHints: [
			"Waterproof everything — immersion is likely",
			"Waders or waterproof boots are not optional",
			"Insect and parasite exposure relevant for extended ops",
			"Lighter kit preferred — wet gear weight compounds quickly",
		],
	},

	// ── High Tundra ──────────────────────────────────────────────────────────────
	// GoodHopeMountain, SilentMountain, MountHodgson
	// Alpine inland. Cold year-round. Snow and ice are operational factors.
	"High Thundra": {
		tempRange: {
			min: -18,
			max: 6,
			unit: "C",
			fahrenheit: { min: 0, max: 43 },
		},
		atmosphere: [
			{ condition: "cloudless",    weight: 20 },
			{ condition: "sunshine",     weight: 15 },
			{ condition: "overcast",     weight: 30 },
			{ condition: "precipitation",weight: 25 },
			{ condition: "storm",        weight: 10 },
		],
		humidity: "low",
		operationalNotes: [
			"Blizzard and whiteout conditions can strand elements mid-op",
			"Frozen terrain allows vehicle movement where mud would not",
			"Footprints in snow compromise route security",
			"Exposed skin freezes rapidly in blizzard conditions",
			"Optics and electronics fail faster in extreme cold",
			"HALO inserts in blizzard conditions are high risk",
		],
		gearHints: [
			"Insulated layering system essential",
			"Cold weather boots are non-negotiable below -5°C",
			"White or grey camo oversuit relevant in snow conditions",
			"Hand and face protection critical",
			"Battery and equipment cold-weather prep required",
		],
	},

	// ── Fjordlands ───────────────────────────────────────────────────────────────
	// Channels, SealIslands
	// Maritime fjord terrain. Cold water, strong tidal winds, frequent storms.
	Fjordlands: {
		tempRange: {
			min: 2,
			max: 16,
			unit: "C",
			fahrenheit: { min: 36, max: 61 },
		},
		atmosphere: [
			{ condition: "cloudless",    weight: 5  },
			{ condition: "sunshine",     weight: 15 },
			{ condition: "overcast",     weight: 35 },
			{ condition: "precipitation",weight: 25 },
			{ condition: "storm",        weight: 20 },
		],
		humidity: "high",
		operationalNotes: [
			"Storm fronts move fast — weather window for HALO may close mid-op",
			"Cold water immersion is immediately life-threatening — limit swim time",
			"Sea fog enables covert boat movement but complicates navigation",
			"Tidal wind affects sniper accuracy at all ranges",
			"Naval base proximity increases Sentinel maritime patrol density",
		],
		gearHints: [
			"Wet suit or dry suit for any water crossing",
			"Wind and waterproof outer shell",
			"Insulated mid-layer for cold water exposure recovery",
			"Anti-exposure gear relevant for extended maritime ops",
		],
	},

	// ── Rain Shadows ──────────────────────────────────────────────────────────────
	// NewArgyll
	// Dryer inland zone in the lee of mountain ranges. Variable, transitional.
	"Rain Shadows": {
		tempRange: {
			min: 6,
			max: 20,
			unit: "C",
			fahrenheit: { min: 43, max: 68 },
		},
		atmosphere: [
			{ condition: "cloudless",    weight: 25 },
			{ condition: "sunshine",     weight: 35 },
			{ condition: "overcast",     weight: 25 },
			{ condition: "precipitation",weight: 12 },
			{ condition: "storm",        weight: 3  },
		],
		humidity: "low to moderate",
		operationalNotes: [
			"Drier conditions mean dust sign and track evidence persists longer",
			"Mountain wind creates unpredictable gusts — affects air insertion",
			"Good visibility in dry conditions cuts both ways — element is also exposed",
			"Sparse vegetation reduces concealment options",
		],
		gearHints: [
			"Mid-weight layering — temperature swings between day and night",
			"Dust protection for optics and weapons",
			"Light waterproofing sufficient — rain events are brief",
		],
	},

	// ── Meadow Lands ────────────────────────────────────────────────────────────
	// NewStirling, WindyIslands, Infinity (rural)
	// Open agricultural terrain. Mild climate. Limited natural cover.
	"Mead Lands": {
		tempRange: {
			min: 10,
			max: 24,
			unit: "C",
			fahrenheit: { min: 50, max: 75 },
		},
		atmosphere: [
			{ condition: "cloudless",    weight: 20 },
			{ condition: "sunshine",     weight: 35 },
			{ condition: "overcast",     weight: 25 },
			{ condition: "precipitation",weight: 15 },
			{ condition: "storm",        weight: 5  },
		],
		humidity: "moderate",
		operationalNotes: [
			"Open terrain provides excellent fields of fire but no concealment",
			"Dawn fog is the primary natural concealment window",
			"Flat terrain makes vehicle movement easy — also easy to be tracked",
			"Clear conditions favor ISR drone operations",
		],
		gearHints: [
			"Standard kit — no extreme weather threat",
			"Lightweight layers sufficient",
			"Rain shell useful for squalls",
			"Low-profile kit if civilian cover is part of the approach",
		],
	},

	// ── Meadow Lands / Urban City ────────────────────────────────────────────────
	// Liberty
	// Urban coastal city. Mild maritime climate. Civilian environment dominant.
	"Meadow Lands and Urban City": {
		tempRange: {
			min: 12,
			max: 26,
			unit: "C",
			fahrenheit: { min: 54, max: 79 },
		},
		atmosphere: [
			{ condition: "cloudless",    weight: 15 },
			{ condition: "sunshine",     weight: 30 },
			{ condition: "overcast",     weight: 30 },
			{ condition: "precipitation",weight: 18 },
			{ condition: "storm",        weight: 7  },
		],
		humidity: "moderate",
		operationalNotes: [
			"Urban environment — civilian presence is primary constraint on movement",
			"Vertical terrain (buildings) dominates tactical geometry",
			"Rain and wet streets reduce vehicle mobility in dense districts",
			"City light pollution negates night advantage unless power is disrupted",
			"Coastal fog from Dolphin Bay can provide early morning cover",
		],
		gearHints: [
			"Civilian clothing may be appropriate for urban approach phases",
			"Concealable kit preferred over full tactical loadout in public areas",
			"Standard waterproofing for coastal rain",
			"Soft-soled footwear for noise discipline on hard surfaces",
		],
	},

	// ── Meadow Lands (WindyIslands) ──────────────────────────────────────────────
	// WindyIslands — same biome label but island context changes weather profile
	"Meadow Lands": {
		tempRange: {
			min: 8,
			max: 20,
			unit: "C",
			fahrenheit: { min: 46, max: 68 },
		},
		atmosphere: [
			{ condition: "cloudless",    weight: 10 },
			{ condition: "sunshine",     weight: 25 },
			{ condition: "overcast",     weight: 35 },
			{ condition: "precipitation",weight: 22 },
			{ condition: "storm",        weight: 8  },
		],
		humidity: "moderate to high",
		operationalNotes: [
			"Persistent wind is the defining operational factor",
			"No roads — all movement on foot after insertion",
			"Exposed island terrain — no concealment from aerial observation",
			"Wind complicates HALO accuracy — boat is the preferred infil",
		],
		gearHints: [
			"Wind-resistant outer layer",
			"Waterproof boots for wet meadow terrain",
			"Light layering — temperature is mild but wind chill is significant",
		],
	},

	// ── High Tundra and Rain Shadows ─────────────────────────────────────────────
	// RestrictedArea01 — hybrid biome, coldest inland province
	"High Thundra and Rain Shadows": {
		tempRange: {
			min: -10,
			max: 10,
			unit: "C",
			fahrenheit: { min: 14, max: 50 },
		},
		atmosphere: [
			{ condition: "cloudless",    weight: 20 },
			{ condition: "sunshine",     weight: 12 },
			{ condition: "overcast",     weight: 30 },
			{ condition: "precipitation",weight: 25 },
			{ condition: "storm",        weight: 13 },
		],
		humidity: "low",
		operationalNotes: [
			"High security zone — weather does not reduce patrol density",
			"Snow provides concealment but leaves clear tracks",
			"Mountain passes can become impassable in blizzard",
			"Cold affects electronics and battery life significantly",
			"Open highland terrain — limited concealment in clear conditions",
		],
		gearHints: [
			"Cold weather insulation required below 0°C",
			"White oversuit relevant when snow is present",
			"Hand protection critical for weapons handling in freezing temps",
			"Battery and optic cold-weather prep required",
		],
	},
};
