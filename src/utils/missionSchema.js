// missionSchema.js — mission object shape, defaults, and migration

export const SCHEMA_VERSION = 1;

export const PROVINCE_DISPLAY_NAMES = {
	CapeNorth: "Cape North",
	DriftwoodIslets: "Driftwood Islets",
	Golem1: "Golem Island — Sector 1",
	Golem2: "Golem Island — Sector 2",
	Golem3: "Golem Island — Sector 3",
	WildCoast: "Wild Coast",
	SmugglersCoves: "Smugglers Coves",
	WhalersBay: "Whalers Bay",
	FenBog: "Fen Bog",
	SinkingCountry: "Sinking Country",
	GoodHopeMountain: "Good Hope Mountain",
	SilentMountain: "Silent Mountain",
	MountHodgson: "Mount Hodgson",
	Channels: "The Channels",
	SealIslands: "Seal Islands",
	NewArgyll: "New Argyll",
	NewStirling: "New Stirling",
	WindyIslands: "Windy Islands",
	Infinity: "Infinity",
	Liberty: "Liberty",
	RestrictedArea01: "Restricted Area 01",
	LakeCountry: "Lake Country",
};

export const ROE_RULES = [
	{ id: "suppressed_only", label: "Suppressed Weapons Only" },
	{ id: "No_Suppressors", label: "No Suppressors" },
	{ id: "suppressed_pistol", label: "Suppressed Pistol Only" },
	{ id: "no_hud", label: "No HUD" },
	{ id: "no_minimap", label: "No Minimap" },
	{ id: "stealth_mandatory", label: "Stealth Mandatory — Fail on Compromise" },
	{ id: "no_revives", label: "No Revives" },
	{ id: "no_drone", label: "No Drones" },
	{ id: "no_thermal", label: "No Thermal Vision" },
	{ id: "night_ops_only", label: "Night Ops Only" },
	{ id: "no_fast_travel", label: "No Fast Travel" },
	{ id: "permadeath", label: "Permadeath" },
];

export const ROE_RULE_MAP = Object.fromEntries(ROE_RULES.map((r) => [r.id, r]));

export const OBJECTIVE_TYPES = [
	"Eliminate HVT",
	"Destroy",
	"Disable",
	"Steal",
	"Recover Intel",
	"Rescue",
	"Recon-Photograph",
	"Sabotage",
];

// Target is a free-text person name for these objective types
export const PERSON_TARGET_TYPES = new Set(["Eliminate HVT", "Rescue"]);
// Target is a vehicle name from GARAGE for this type
export const VEHICLE_TARGET_TYPES = new Set(["Steal"]);
// All others: target is a province location name

export const INFIL_EXFIL_TYPES = [
	"Bivouac",
	"Terrain Location",
	"Base",
	"Abandoned Location",
];
export const APPROACH_DIRECTIONS = ["North", "South", "East", "West"];
export const PLATFORMS = ["PC", "Console", "Any"];
export const WORLDS = [
	"Any",
	"Classic",
	"Resistance",
	"Amber Sky",
	"Motherland",
];
export const DIFFICULTIES = ["Arcade", "Regular", "Advanced", "Extreme"];
export const TIMES_OF_DAY = ["Dawn", "Day", "Dusk", "Night", "Any"];
export const LOADOUT_MODES = ["Locked", "Recommended"];
export const LIST_MODES = ["None", "All", "List"];
export const MODS = ["Spartan Mod", "Fear the Radio"];

export const defaultObjective = () => ({
	type: "Eliminate HVT",
	targetId: "",
	locationId: null,
	note: "",
});

// A base is the anchor point for the objectives staged from it.
export const defaultBase = () => ({
	locationId: null,
	note: "",
	objectives: [defaultObjective()],
});

export const defaultExfil = () => ({
	type: "Terrain Location",
	locationId: null,
	note: "",
});

export const defaultWeaponSlot = () => ({ weaponId: "", attachments: {} });

// An additional province visited within the same phase, after the phase's
// primary province. approachFrom records the compass direction it's
// entered from so a map can later draw a base-to-base travel line.
export const defaultExtraProvince = () => ({
	provinceId: "",
	approachFrom: "North",
	bases: [defaultBase()],
});

export const defaultLeg = () => ({
	provinceId: "",
	infil: { type: "Terrain Location", locationId: null, note: "" },
	bases: [defaultBase()],
	extraProvinces: [],
	exfil: null,
});

export const defaultMission = () => ({
	schemaVersion: SCHEMA_VERSION,
	meta: {
		name: "",
		author: "",
		platform: "Any",
		world: "Any",
		difficulty: "Standard",
		timeOfDay: "Any",
		sitrep: "",
	},
	legs: [defaultLeg()],
	roe: { rules: [], custom: "" },
	restrictions: {
		loadout: {
			mode: "Recommended",
			primary: defaultWeaponSlot(),
			secondary: defaultWeaponSlot(),
			sidearm: defaultWeaponSlot(),
		},
		items: { mode: "All", list: [] },
		perks: { mode: "All", list: [] },
		vehicles: { mode: "All", list: [], custom: "" },
		mods: { list: [], custom: "" },
	},
});

// Objectives used to live in a flat list alongside bases; they now nest under
// the base they're staged from. Fold old drafts/links into the new shape.
function migrateBaseGroups(rawBases, legacyObjectives) {
	const bases = Array.isArray(rawBases) ? rawBases : [];
	const alreadyNested = bases.length > 0 && bases.every((b) => Array.isArray(b?.objectives));

	if (alreadyNested) {
		return bases.map((b) => ({
			...defaultBase(),
			...b,
			objectives:
				b.objectives.length > 0 ?
					b.objectives.map((o) => ({ ...defaultObjective(), ...o }))
				:	[defaultObjective()],
		}));
	}

	const objectives =
		Array.isArray(legacyObjectives) ?
			legacyObjectives.map((o) => ({ ...defaultObjective(), ...o }))
		:	[];

	if (bases.length > 0) {
		return bases.map((b, i) => ({
			...defaultBase(),
			...b,
			objectives: i === 0 && objectives.length > 0 ? objectives : [defaultObjective()],
		}));
	}

	return [{ ...defaultBase(), objectives: objectives.length > 0 ? objectives : [defaultObjective()] }];
}

// Tolerant migration — merges stored data onto defaults so new fields appear safely
export function migrate(raw) {
	if (!raw || typeof raw !== "object") return defaultMission();
	const base = defaultMission();
	return {
		...base,
		...raw,
		schemaVersion: SCHEMA_VERSION,
		meta: {
			...base.meta,
			...(raw.meta || {}),
			// "Discretion" was renamed to "Any" — keep old drafts/links valid.
			timeOfDay:
				(raw.meta || {}).timeOfDay === "Discretion" ?
					"Any"
				:	((raw.meta || {}).timeOfDay ?? base.meta.timeOfDay),
		},
		legs:
			Array.isArray(raw.legs) && raw.legs.length > 0 ?
				raw.legs.map((leg) => ({
					...defaultLeg(),
					...leg,
					bases: migrateBaseGroups(leg.bases, leg.objectives),
					extraProvinces:
						Array.isArray(leg.extraProvinces) ?
							leg.extraProvinces.map((p) => ({
								...defaultExtraProvince(),
								...p,
								bases: migrateBaseGroups(p.bases, p.objectives),
							}))
						:	[],
				}))
			:	base.legs,
		roe: { ...base.roe, ...(raw.roe || {}) },
		restrictions: {
			...base.restrictions,
			...(raw.restrictions || {}),
			loadout: {
				...base.restrictions.loadout,
				...((raw.restrictions || {}).loadout || {}),
			},
			items: {
				...base.restrictions.items,
				...((raw.restrictions || {}).items || {}),
			},
			perks: {
				...base.restrictions.perks,
				...((raw.restrictions || {}).perks || {}),
			},
			vehicles: {
				...base.restrictions.vehicles,
				...((raw.restrictions || {}).vehicles || {}),
				// "Unlock Note" was renamed to "Custom Vehicle" — keep old drafts/links valid.
				custom:
					(raw.restrictions || {}).vehicles?.custom ??
					(raw.restrictions || {}).vehicles?.unlockNote ??
					base.restrictions.vehicles.custom,
			},
			mods: {
				...base.restrictions.mods,
				...((raw.restrictions || {}).mods || {}),
			},
		},
	};
}
