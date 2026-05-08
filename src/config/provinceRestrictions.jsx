// ─────────────────────────────────────────────────────────────────────────────
// PROVINCE_RESTRICTIONS.js
// Static operational restriction data per province.
//
// Design intent:
//   - Pure data — no logic, no functions
//   - Each entry is split into terrain / threats / weather blocks
//   - terrain.degraded accepts category names ("drone", "crossCom", "airSupport")
//     or individual restriction keys
//   - threats[].denies — same shape as terrain.degraded
//   - weather[atmosphere].mobilityConditional — flags only available if the
//     threats denying their underlying restriction are neutralized
// ─────────────────────────────────────────────────────────────────────────────

export const NOTES = {
	MOBILITY: "movement",
	VISIBILITY: "visibility",
	SOUND: "sound",
};

export const MOB = {
	AIR: "aircraft",
	GROUND: "ground vehicle",
	FOOT: "foot",
	BOAT: "boat",
};

export const VIS = {
	NVG: "night vision",
	THERMAL: "thermal vision",
	EYEPRO: "eye protection",
};

export const WEATHER = {
	CLOUDLESS: "cloudless",
	SUNSHINE: "sunshine",
	OVERCAST: "overcast",
	PRECIPITATION: "precipitation",
	STORM: "storm",
};

export const SOU = {
	LOUD: "go loud",
	SUPPRESSOR: "suppressors",
};

// ─────────────────────────────────────────────────────────────────────────────

export const PROVINCE_RESTRICTIONS = {
	// ── Golem Island Sector 1 ─────────────────────────────────────────────────
	Golem1: {
		terrain: {
			description:
				"Dense jungle canopy and active volcanic ash fall. Lava channels and unstable ground block vehicle routes.",
			degraded: ["crossCom", "drone", "airSupport", "vehicle", "aviation"],
		},
		threats: [],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Golem Island Sector 2 ─────────────────────────────────────────────────
	Golem2: {
		terrain: {
			description:
				"Dense jungle canopy and active volcanic ash fall. Lava channels and unstable ground block vehicle routes.",
			degraded: ["crossCom", "drone", "airSupport", "vehicle", "aviation"],
		},
		threats: [],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Golem Island Sector 3 ─────────────────────────────────────────────────
	Golem3: {
		terrain: {
			description:
				"Extreme hot desert and active volcanic ash fall. Active lava flows and zero road network. Ground vehicle movement impossible.",
			degraded: ["crossCom", "drone", "airSupport", "vehicle", "aviation"],
		},
		threats: [],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.EYEPRO],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Cape North ────────────────────────────────────────────────────────────
	CapeNorth: {
		terrain: {
			description:
				"Dense jungle rain forest. Canopy fogs optics and limits drone line-of-sight.",
			degraded: ["drone", "vehicle"],
		},
		threats: [
			{
				name: "Bat SAM Site",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
			{
				name: "Skell Foundation Campus",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				visibility: [VIS.THERMAL],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				visibility: [VIS.THERMAL],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Driftwood Islets ─────────────────────────────────────────────────────
	DriftwoodIslets: {
		terrain: {
			description:
				"Dense jungle rain forest. Island archipelago — no road network.",
			degraded: ["drone", "vehicle"],
		},
		threats: [],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				visibility: [VIS.THERMAL],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				visibility: [VIS.THERMAL],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Wild Coast ───────────────────────────────────────────────────────────
	WildCoast: {
		terrain: {
			description: "High cliffs and windy coast. Sea fog reduces optic range.",
			degraded: ["drone", "vehicle"],
		},
		threats: [
			{
				name: "Drone Station W031",
				denies: ["armarosDrone"],
				unlockable: true,
			},
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Smugglers Coves ───────────────────────────────────────────────────────
	SmugglersCoves: {
		terrain: {
			description: "High cliffs and windy coast. Sea fog reduces optic range.",
			degraded: ["drone", "vehicle"],
		},
		threats: [
			{ name: "Foxglove Station", denies: ["crossCom"], unlockable: true },
			{ name: "Oleander Station", denies: ["crossCom"], unlockable: true },
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Sinking Country ───────────────────────────────────────────────────────
	SinkingCountry: {
		terrain: {
			description:
				"Salt marsh and wetlands. Persistent fog reduces optic and drone range.",
			degraded: ["drone"],
		},
		threats: [
			{
				name: "Howard Airfield",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
			{
				name: "Harrier SAM Site",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
			{
				name: "Osprey SAM Site",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
			{
				name: "Sparrowhawk SAM Site",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
			{
				name: "Camp Tiger",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
			{ name: "Radar Station North", denies: ["crossCom"], unlockable: true },
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Whalers Bay ───────────────────────────────────────────────────────────
	WhalersBay: {
		terrain: {
			description:
				"High cliffs and windy coast. Mountain and cliff terrain limit vehicle routes.",
			degraded: ["vehicle"],
		},
		threats: [
			{ name: "Aconite Station", denies: ["crossCom"], unlockable: true },
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Mount Hodgson ─────────────────────────────────────────────────────────
	MountHodgson: {
		terrain: {
			description:
				"High tundra. Whiteout conditions and extreme cold. Mountain LOS gaps degrade Cross-Com.",
			degraded: ["vehicle", "drone", "crossCom", "aviation"],
		},
		threats: [
			{
				name: "Drone Station W041",
				denies: ["armarosDrone"],
				unlockable: true,
			},
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Fen Bog ───────────────────────────────────────────────────────────────
	// Most electronically restricted non-classified province
	FenBog: {
		terrain: {
			description:
				"Salt marsh and wetlands. Persistent fog ceiling limits drones and optics.",
			degraded: ["drone", "vehicle"],
		},
		threats: [
			{
				name: "Drone Station W052",
				denies: ["armarosDrone", "crossCom"],
				unlockable: true,
			},
			{
				name: "Control Station Tiger 02",
				denies: ["crossCom"],
				unlockable: true,
			},
			{ name: "Hogweed Station", denies: ["crossCom"], unlockable: true },
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.AIR, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Good Hope Mountain ────────────────────────────────────────────────────
	GoodHopeMountain: {
		terrain: {
			description:
				"High tundra. Whiteout conditions and extreme cold. Mountain LOS gaps degrade Cross-Com.",
			degraded: ["vehicle", "drone", "crossCom", "aviation"],
		},
		threats: [
			{
				name: "Drone Station W111",
				denies: ["armarosDrone"],
				unlockable: true,
			},
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Silent Mountain ───────────────────────────────────────────────────────
	SilentMountain: {
		terrain: {
			description:
				"High tundra. Whiteout conditions and extreme cold. Mountain LOS gaps degrade Cross-Com.",
			degraded: ["vehicle", "drone", "crossCom"],
		},
		threats: [
			{ name: "Hemlock Station", denies: ["crossCom"], unlockable: true },
			{
				name: "Camp Black Widow",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── New Argyll ────────────────────────────────────────────────────────────
	NewArgyll: {
		terrain: {
			description: "Rain shadows and mountain gusts.",
			degraded: [],
		},
		threats: [
			{
				name: "Control Station Tiger 04",
				denies: ["crossCom"],
				unlockable: true,
			},
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.GROUND, MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.GROUND, MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.GROUND, MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.GROUND, MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Infinity ─────────────────────────────────────────────────────────────
	Infinity: {
		terrain: {
			description:
				"Dense urban core. Light pollution negates NVG advantage. Civilian density limits ROE.",
			degraded: ["drone"],
		},
		threats: [
			{
				name: "Control Station Viper 04",
				denies: ["crossCom"],
				unlockable: true,
			},
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.GROUND, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Channels ─────────────────────────────────────────────────────────────
	Channels: {
		terrain: {
			description: "Fjord-locked archipelago. Limited road network.",
			degraded: ["vehicle"],
		},
		threats: [
			{
				name: "Vulture SAM Site",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Restricted Area 01 ────────────────────────────────────────────────────
	// Most restricted province on Auroa — hardened Sentinel facility
	RestrictedArea01: {
		terrain: {
			description: "High tundra and rain shadows. Hardened Sentinel facility.",
			degraded: ["drone", "vehicle"],
		},
		threats: [
			{ name: "Manchineel Station", denies: ["crossCom"], unlockable: true },
			{
				name: "Camp Ferret",
				denies: ["airSupport", "aviation", "crossCom"],
				unlockable: true,
			},
			{
				name: "Camp Fox",
				denies: ["airSupport", "aviation", "crossCom"],
				unlockable: true,
			},
			{
				name: "Control Station Fox 02",
				denies: ["crossCom"],
				unlockable: true,
			},
			{
				name: "Control Station Fox 01",
				denies: ["crossCom"],
				unlockable: true,
			},
			{
				name: "Drone Station W161",
				denies: ["armarosDrone"],
				unlockable: true,
			},
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Lake Country ─────────────────────────────────────────────────────────
	LakeCountry: {
		terrain: {
			description: "Rain shadows. High mountain winds.",
			degraded: [],
		},
		threats: [
			{
				name: "Drone Station W121",
				denies: ["armarosDrone"],
				unlockable: true,
			},
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.GROUND, MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.GROUND, MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.GROUND, MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.GROUND, MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── New Stirling ─────────────────────────────────────────────────────────
	NewStirling: {
		terrain: {
			description: "Mead lands. Open meadow terrain with limited concealment.",
			degraded: [],
		},
		threats: [
			{
				name: "Control Station Viper 03",
				denies: ["crossCom"],
				unlockable: true,
			},
			{
				name: "Drone Station W131",
				denies: ["armarosDrone"],
				unlockable: true,
			},
			{
				name: "Drone Station W132",
				denies: ["armarosDrone"],
				unlockable: true,
			},
			{
				name: "Control Station Viper 02",
				denies: ["crossCom"],
				unlockable: true,
			},
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Seal Islands ─────────────────────────────────────────────────────────
	SealIslands: {
		terrain: {
			description:
				"Heavily defended naval base. Fjord-locked island. Multiple SAM batteries.",
			degraded: ["vehicle", "drone"],
		},
		threats: [
			{
				name: "Buzzard SAM Site",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
			{
				name: "Anti Aircraft Battery",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
			{
				name: "Owl SAM Site",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
			{
				name: "Control Station Shark 01",
				denies: ["crossCom"],
				unlockable: true,
			},
			{
				name: "Falcon SAM Site",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
			{
				name: "Condor SAM Site",
				denies: ["airSupport", "aviation"],
				unlockable: true,
			},
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				mobilityConditional: [MOB.AIR],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Liberty ───────────────────────────────────────────────────────────────
	Liberty: {
		terrain: {
			description:
				"Meadow lands and urban city. Light pollution negates NVG advantage. Civilian density limits ROE.",
			degraded: ["drone"],
		},
		threats: [
			{
				name: "Control Station Viper 01",
				denies: ["crossCom"],
				unlockable: true,
			},
			{
				name: "Drone Station W192",
				denies: ["armarosDrone"],
				unlockable: true,
			},
			{
				name: "Control Station Viper 05",
				denies: ["crossCom"],
				unlockable: true,
			},
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},

	// ── Windy Islands ─────────────────────────────────────────────────────────
	WindyIslands: {
		terrain: {
			description:
				"Exposed island terrain. Persistent high winds. No road network.",
			degraded: ["drone"],
		},
		threats: [
			{ name: "Drone Station S01", denies: ["armarosDrone"], unlockable: true },
		],
		weather: {
			[WEATHER.CLOUDLESS]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.SUNSHINE]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.OVERCAST]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.SUPPRESSOR],
			},
			[WEATHER.PRECIPITATION]: {
				mobility: [MOB.FOOT, MOB.BOAT, MOB.AIR, MOB.GROUND],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
			[WEATHER.STORM]: {
				mobility: [MOB.FOOT, MOB.GROUND, MOB.BOAT],
				visibility: [VIS.THERMAL, VIS.NVG],
				sound: [SOU.LOUD],
			},
		},
	},
};
