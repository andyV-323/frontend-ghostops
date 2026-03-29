// ─────────────────────────────────────────────────────────────────────────────
// PROVINCE_RESTRICTIONS.js
// Static operational restriction data per province.
//
// Design intent:
//   - Pure data — no logic, no functions
//   - Each entry describes what Ghost equipment is restricted and why
//   - source: 'terrain' | 'threat' | 'weather' | 'threat/weather' | 'terrain/weather'
//   - status tiers: 'nominal' | 'degraded' | 'denied'
//   - unlockable: true means threat-sourced, removable via campaign progression
//   - Child resolution (syncShot, intelGrenades inherit from crossCom) is
//     handled in restrictionUtils.js — not here
//
// Restriction keys:
//   isrDrone        — ISR drone / minimap + strike designator + Armaros
//   crossCom        — Cross-Com system (parent)
//     syncShot      — child of crossCom
//     intelGrenades — child of crossCom
//   aviation        — helicopters and fixed-wing
//   vehicle         — ground vehicles
//   personalDrone   — handheld quadcopter recon drone
//   nvgThermal      — NVG and thermal optics
//   satcom          — SATCOM / fire support comms
//   lrOptics        — long-range optics / binoculars
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS = {
	NOMINAL: "nominal",
	DEGRADED: "degraded",
	DENIED: "denied",
};

export const SOURCE = {
	TERRAIN: "terrain",
	THREAT: "threat",
	WEATHER: "weather",
	THREAT_WEATHER: "threat/weather",
	TERRAIN_WEATHER: "terrain/weather",
};

// ─── Entry helpers ────────────────────────────────────────────────────────────

const nom = () => ({
	status: STATUS.NOMINAL,
	source: null,
	reason: null,
	unlockable: false,
});

const deg = (source, reason, unlockable = false) => ({
	status: STATUS.DEGRADED,
	source,
	reason,
	unlockable,
});

const den = (source, reason, unlockable = false) => ({
	status: STATUS.DENIED,
	source,
	reason,
	unlockable,
});

// ─────────────────────────────────────────────────────────────────────────────

export const PROVINCE_RESTRICTIONS = {
	// ── Golem Island Sector 1 ─────────────────────────────────────────────────
	Golem1: {
		isrDrone: deg(
			SOURCE.TERRAIN,
			"Dense jungle canopy limits drone line-of-sight. Ash fall coats optical sensors.",
		),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: nom(),
		vehicle: deg(
			SOURCE.TERRAIN,
			"Unstable volcanic terrain and lava channels block off-road routes.",
		),
		personalDrone: deg(
			SOURCE.TERRAIN_WEATHER,
			"Canopy blocks low-altitude flight paths. Ash degrades sensors.",
		),
		nvgThermal: deg(
			SOURCE.WEATHER,
			"Ash coats lenses. Heat shimmer from volcanic vents degrades thermal.",
		),
		satcom: nom(),
		lrOptics: deg(SOURCE.WEATHER, "Ash fall and extreme humidity fog lenses."),
	},

	// ── Golem Island Sector 2 ─────────────────────────────────────────────────
	Golem2: {
		isrDrone: deg(
			SOURCE.TERRAIN,
			"Dense canopy and ash fall degrade ISR optical feed.",
		),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: nom(),
		vehicle: deg(
			SOURCE.TERRAIN,
			"Lava channels create impassable barriers across major routes.",
		),
		personalDrone: deg(
			SOURCE.TERRAIN_WEATHER,
			"Canopy blocks flight paths. Ash degrades sensors.",
		),
		nvgThermal: deg(
			SOURCE.WEATHER,
			"Heat shimmer from lava flows corrupts thermal baseline.",
		),
		satcom: nom(),
		lrOptics: deg(SOURCE.WEATHER, "Ash and humidity degrade lens clarity."),
	},

	// ── Golem Island Sector 3 ─────────────────────────────────────────────────
	Golem3: {
		isrDrone: deg(
			SOURCE.WEATHER,
			"Severe heat shimmer over lava terrain corrupts long-range optical feed.",
		),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: nom(),
		vehicle: den(
			SOURCE.TERRAIN,
			"Active lava flows and zero road network. Ground vehicle movement impossible.",
		),
		personalDrone: deg(
			SOURCE.WEATHER,
			"Extreme ambient heat degrades sensors. Ash particulates damage rotors.",
		),
		nvgThermal: den(
			SOURCE.WEATHER,
			"Ambient volcanic heat saturates thermal imaging. Ash and heat shimmer destroy NVG clarity. Both systems non-functional.",
		),
		satcom: nom(),
		lrOptics: den(
			SOURCE.WEATHER,
			"Heat shimmer over lava terrain renders long-range ranging completely unreliable.",
		),
	},

	// ── Cape North ────────────────────────────────────────────────────────────
	CapeNorth: {
		isrDrone: deg(
			SOURCE.TERRAIN,
			"Dense jungle canopy limits drone line-of-sight. Optical feed unreliable below canopy level.",
		),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: nom(),
		vehicle: deg(
			SOURCE.TERRAIN,
			"Road network limited to primary routes. Dense jungle prevents cross-country movement.",
		),
		personalDrone: deg(
			SOURCE.TERRAIN,
			"Canopy blocks low-altitude flight paths. Effective range severely reduced.",
		),
		nvgThermal: nom(),
		satcom: nom(),
		lrOptics: deg(SOURCE.WEATHER, "Extreme humidity fogs lens coatings."),
	},

	// ── Driftwood Islets ─────────────────────────────────────────────────────
	DriftwoodIslets: {
		isrDrone: deg(SOURCE.TERRAIN, "Dense jungle canopy degrades drone LOS."),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: nom(),
		vehicle: den(
			SOURCE.TERRAIN,
			"Island terrain — no vehicle access. All movement on foot after insertion.",
		),
		personalDrone: deg(
			SOURCE.TERRAIN,
			"Canopy limits effective drone range and flight paths.",
		),
		nvgThermal: nom(),
		satcom: nom(),
		lrOptics: deg(
			SOURCE.WEATHER,
			"Humidity degrades optics in rain forest environment.",
		),
	},

	// ── Wild Coast ───────────────────────────────────────────────────────────
	WildCoast: {
		isrDrone: nom(),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: nom(),
		vehicle: deg(
			SOURCE.TERRAIN,
			"Cliff and coastal terrain limits off-road ground movement.",
		),
		personalDrone: deg(
			SOURCE.WEATHER,
			"High coastal wind shear destabilizes small drone flight. Sea fog degrades optical feed.",
		),
		nvgThermal: nom(),
		satcom: nom(),
		lrOptics: deg(
			SOURCE.WEATHER,
			"Sea fog events reduce effective range. Salt spray fogs lenses.",
		),
	},

	// ── Smugglers Coves ───────────────────────────────────────────────────────
	SmugglersCoves: {
		isrDrone: nom(),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: nom(),
		vehicle: deg(
			SOURCE.TERRAIN,
			"Cliff and coastal terrain constrains ground vehicle routes.",
		),
		personalDrone: deg(
			SOURCE.WEATHER,
			"Coastal wind and sea fog degrade small drone operations.",
		),
		nvgThermal: nom(),
		satcom: nom(),
		lrOptics: deg(SOURCE.WEATHER, "Sea fog reduces effective optic range."),
	},

	// ── Sinking Country ───────────────────────────────────────────────────────
	SinkingCountry: {
		isrDrone: deg(
			SOURCE.WEATHER,
			"Persistent marsh fog ceiling limits drone altitude and optical clarity.",
		),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: den(
			SOURCE.THREAT,
			"Active SAM network — Harrier, Osprey, and Sparrowhawk sites provide overlapping coverage. All rotary and fixed-wing assets denied.",
			true,
		),
		vehicle: deg(
			SOURCE.TERRAIN,
			"Waterlogged marsh terrain. Off-road movement restricted to established tracks.",
		),
		personalDrone: deg(
			SOURCE.WEATHER,
			"Low fog ceiling limits altitude. Moisture degrades sensor performance.",
		),
		nvgThermal: nom(),
		satcom: nom(),
		lrOptics: deg(
			SOURCE.WEATHER,
			"Marsh fog significantly reduces effective optic range.",
		),
	},

	// ── Whalers Bay ───────────────────────────────────────────────────────────
	WhalersBay: {
		isrDrone: nom(),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: nom(),
		vehicle: deg(
			SOURCE.TERRAIN,
			"Mountain and cliff terrain constrains vehicle movement to established roads.",
		),
		personalDrone: deg(
			SOURCE.WEATHER,
			"Coastal and mountain wind affects small drone stability.",
		),
		nvgThermal: nom(),
		satcom: nom(),
		lrOptics: nom(),
	},

	// ── Mount Hodgson ─────────────────────────────────────────────────────────
	MountHodgson: {
		isrDrone: deg(
			SOURCE.WEATHER,
			"Blizzard and whiteout conditions ground drone operations. Snow accumulation on sensors.",
		),
		crossCom: deg(
			SOURCE.TERRAIN,
			"Mountain terrain creates line-of-sight gaps between operators on opposite sides of ridgelines.",
		),
		syncShot: deg(
			SOURCE.TERRAIN,
			"LOS breaks in mountain passes prevent reliable sync shot coordination.",
		),
		intelGrenades: deg(
			SOURCE.WEATHER,
			"Extreme cold degrades grenade electronics and sensor package reliability.",
		),
		aviation: deg(
			SOURCE.WEATHER,
			"Blizzard events close the flight window. Mountain updrafts create unpredictable conditions.",
		),
		vehicle: deg(
			SOURCE.TERRAIN_WEATHER,
			"Snow and ice limit wheeled vehicle movement. Mountain passes may be impassable in storm.",
		),
		personalDrone: deg(
			SOURCE.WEATHER,
			"Blizzard grounds small drones. Cold degrades battery life significantly.",
		),
		nvgThermal: deg(
			SOURCE.WEATHER,
			"Electronics fail faster in extreme cold. Battery life critically reduced.",
		),
		satcom: deg(
			SOURCE.TERRAIN,
			"Mountain terrain creates SATCOM dead zones. Fire support comms intermittent.",
		),
		lrOptics: deg(
			SOURCE.WEATHER,
			"Whiteout conditions and condensation on cold optics reduce effective range.",
		),
	},

	// ── Fen Bog ───────────────────────────────────────────────────────────────
	// Most electronically restricted non-classified province
	FenBog: {
		isrDrone: deg(
			SOURCE.WEATHER,
			"Persistent marsh fog ceiling limits drone altitude and optical feed.",
		),
		crossCom: den(
			SOURCE.THREAT,
			"Active enemy EW — Control Stations Tiger 02/03 and Drone Stations W051/052 provide full-spectrum jamming coverage.",
			true,
		),
		syncShot: den(
			SOURCE.THREAT,
			"Inherited — Cross-Com denied by active jamming. Sync shot coordination impossible.",
			true,
		),
		intelGrenades: den(
			SOURCE.THREAT,
			"Inherited — Cross-Com denied. Intel grenade feed cannot transmit through jamming envelope.",
			true,
		),
		aviation: nom(),
		vehicle: deg(
			SOURCE.TERRAIN,
			"Waterlogged marsh terrain. Ground vehicles restricted to established causeways.",
		),
		personalDrone: den(
			SOURCE.THREAT_WEATHER,
			"Active jamming disrupts drone control link. Marsh fog ceiling compounds restriction.",
			true,
		),
		nvgThermal: nom(),
		satcom: deg(
			SOURCE.THREAT,
			"Enemy EW presence degrades SATCOM uplink quality. Fire support coordination unreliable.",
			true,
		),
		lrOptics: deg(SOURCE.WEATHER, "Marsh fog reduces effective optic range."),
	},

	// ── Good Hope Mountain ────────────────────────────────────────────────────
	GoodHopeMountain: {
		isrDrone: deg(
			SOURCE.WEATHER,
			"Blizzard and mountain cloud ceiling ground drone operations.",
		),
		crossCom: deg(
			SOURCE.TERRAIN,
			"Mountain ridgelines create LOS gaps between split elements.",
		),
		syncShot: deg(
			SOURCE.TERRAIN,
			"LOS breaks in mountain terrain prevent reliable sync coordination.",
		),
		intelGrenades: deg(
			SOURCE.WEATHER,
			"Cold degrades grenade electronics and sensor package.",
		),
		aviation: deg(
			SOURCE.WEATHER,
			"Blizzard events close the flight window. Mountain turbulence unpredictable.",
		),
		vehicle: deg(
			SOURCE.TERRAIN_WEATHER,
			"Snow and mountain passes restrict ground movement.",
		),
		personalDrone: deg(
			SOURCE.WEATHER,
			"Wind and blizzard conditions ground small drones. Cold drains batteries rapidly.",
		),
		nvgThermal: deg(
			SOURCE.WEATHER,
			"Cold degrades electronics. Battery life critically reduced in extreme temps.",
		),
		satcom: deg(
			SOURCE.TERRAIN,
			"Mountain terrain creates SATCOM dead zones across the AO.",
		),
		lrOptics: deg(
			SOURCE.WEATHER,
			"Whiteout conditions degrade effective range.",
		),
	},

	// ── Silent Mountain ───────────────────────────────────────────────────────
	SilentMountain: {
		isrDrone: deg(
			SOURCE.WEATHER,
			"Blizzard and mountain ceiling ground drone operations.",
		),
		crossCom: deg(
			SOURCE.TERRAIN,
			"Mountain terrain creates LOS gaps between operators.",
		),
		syncShot: deg(
			SOURCE.TERRAIN,
			"LOS breaks prevent reliable sync shot coordination.",
		),
		intelGrenades: deg(
			SOURCE.WEATHER,
			"Extreme cold degrades grenade electronics.",
		),
		aviation: deg(
			SOURCE.WEATHER,
			"Blizzard closes flight window. Mountain updrafts create hazardous conditions.",
		),
		vehicle: deg(
			SOURCE.TERRAIN_WEATHER,
			"Snow, ice, and mountain passes restrict movement.",
		),
		personalDrone: deg(
			SOURCE.WEATHER,
			"Wind and cold ground small drone operations.",
		),
		nvgThermal: deg(
			SOURCE.WEATHER,
			"Extreme cold degrades electronics and battery performance.",
		),
		satcom: deg(SOURCE.TERRAIN, "Mountain terrain creates SATCOM dead zones."),
		lrOptics: deg(SOURCE.WEATHER, "Whiteout and condensation on cold optics."),
	},

	// ── New Argyll ────────────────────────────────────────────────────────────
	NewArgyll: {
		isrDrone: nom(),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: nom(),
		vehicle: nom(),
		personalDrone: deg(
			SOURCE.WEATHER,
			"Mountain wind gusts from adjacent ranges create unpredictable flight conditions.",
		),
		nvgThermal: nom(),
		satcom: nom(),
		lrOptics: nom(),
	},

	// ── Infinity ─────────────────────────────────────────────────────────────
	Infinity: {
		isrDrone: nom(),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: nom(),
		vehicle: nom(),
		personalDrone: nom(),
		nvgThermal: deg(
			SOURCE.THREAT,
			"Dense city light pollution negates NVG night advantage. Thermal functional but element loses darkness concealment.",
		),
		satcom: nom(),
		lrOptics: nom(),
	},

	// ── Channels ─────────────────────────────────────────────────────────────
	Channels: {
		isrDrone: deg(
			SOURCE.WEATHER,
			"Storm fronts and sea fog degrade drone altitude ceiling and optical feed.",
		),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: den(
			SOURCE.THREAT,
			"Vulture and Eagle SAM sites provide overlapping air defense coverage. All aviation assets denied.",
			true,
		),
		vehicle: deg(
			SOURCE.TERRAIN,
			"Island archipelago — limited road connections. Cross-island vehicle movement not viable.",
		),
		personalDrone: deg(
			SOURCE.WEATHER,
			"Tidal wind and storm fronts destabilize small drone flight.",
		),
		nvgThermal: nom(),
		satcom: nom(),
		lrOptics: deg(
			SOURCE.WEATHER,
			"Sea fog reduces effective optic range across the archipelago.",
		),
	},

	// ── Restricted Area 01 ────────────────────────────────────────────────────
	// Most restricted province on Auroa — hardened Sentinel facility
	RestrictedArea01: {
		isrDrone: deg(
			SOURCE.THREAT_WEATHER,
			"Active Sentinel jamming degrades ISR feed. Blizzard compounds restriction.",
			true,
		),
		crossCom: den(
			SOURCE.THREAT,
			"Full-spectrum EW active — Sentinel hardened facility. Cross-Com link denied across entire AO.",
			true,
		),
		syncShot: den(
			SOURCE.THREAT,
			"Inherited — Cross-Com denied by full-spectrum jamming. No sync shot capability.",
			true,
		),
		intelGrenades: den(
			SOURCE.THREAT,
			"Inherited — Cross-Com denied. Intel grenade feed cannot transmit.",
			true,
		),
		aviation: den(
			SOURCE.THREAT,
			"Restricted airspace — Sentinel AAA emplacements enforce no-fly zone. All aviation denied.",
			true,
		),
		vehicle: deg(
			SOURCE.TERRAIN_WEATHER,
			"Snow and blizzard restrict movement. Mountain passes checkpoint-controlled — limited gated entry points.",
		),
		personalDrone: den(
			SOURCE.THREAT,
			"Active jamming disrupts control link. Personal drone operations impossible.",
			true,
		),
		nvgThermal: deg(
			SOURCE.WEATHER,
			"Extreme cold and blizzard degrade electronics and battery performance.",
		),
		satcom: den(
			SOURCE.THREAT,
			"Full-spectrum jamming blocks SATCOM uplink. External comms and fire support denied.",
			true,
		),
		lrOptics: deg(
			SOURCE.WEATHER,
			"Blizzard and whiteout reduce effective optic range.",
		),
	},

	// ── Lake Country ─────────────────────────────────────────────────────────
	LakeCountry: {
		isrDrone: nom(),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: nom(),
		vehicle: nom(),
		personalDrone: deg(
			SOURCE.WEATHER,
			"Mountain wind gusts from adjacent ranges create unpredictable conditions for small drones.",
		),
		nvgThermal: nom(),
		satcom: nom(),
		lrOptics: nom(),
	},

	// ── New Stirling ─────────────────────────────────────────────────────────
	NewStirling: {
		isrDrone: nom(),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: nom(),
		vehicle: nom(),
		personalDrone: nom(),
		nvgThermal: nom(),
		satcom: nom(),
		lrOptics: nom(),
	},

	// ── Seal Islands ─────────────────────────────────────────────────────────
	SealIslands: {
		isrDrone: deg(
			SOURCE.WEATHER,
			"Sea fog and storm fronts degrade drone ceiling and optical clarity.",
		),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: den(
			SOURCE.THREAT,
			"Buzzard, Owl, Falcon, and Condor SAM sites plus Anti-Aircraft Battery — most heavily defended airspace on Auroa.",
			true,
		),
		vehicle: deg(
			SOURCE.TERRAIN,
			"Island terrain — limited road network. Cross-island vehicle movement restricted.",
		),
		personalDrone: deg(
			SOURCE.WEATHER,
			"Tidal wind and storm fronts destabilize small drone flight.",
		),
		nvgThermal: nom(),
		satcom: nom(),
		lrOptics: deg(SOURCE.WEATHER, "Sea fog reduces effective optic range."),
	},

	// ── Liberty ───────────────────────────────────────────────────────────────
	Liberty: {
		isrDrone: nom(),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: nom(),
		vehicle: deg(
			SOURCE.TERRAIN,
			"Urban density makes vehicle movement conspicuous. Limited routes through dense districts.",
		),
		personalDrone: deg(
			SOURCE.TERRAIN,
			"Urban canyon multipath interference degrades control signal. Building density limits effective range.",
		),
		nvgThermal: deg(
			SOURCE.THREAT,
			"City light pollution negates NVG night advantage across urban core.",
		),
		satcom: nom(),
		lrOptics: deg(
			SOURCE.TERRAIN,
			"Urban canyon geometry limits effective long-range optic angles and range.",
		),
	},

	// ── Windy Islands ─────────────────────────────────────────────────────────
	WindyIslands: {
		isrDrone: deg(
			SOURCE.WEATHER,
			"Persistent high wind degrades drone stability and ISR feed accuracy.",
		),
		crossCom: nom(),
		syncShot: nom(),
		intelGrenades: nom(),
		aviation: deg(
			SOURCE.WEATHER,
			"Persistent wind makes helicopter landing and extraction unreliable.",
		),
		vehicle: den(
			SOURCE.TERRAIN,
			"Island — no roads, no vehicle access. All movement on foot after insertion.",
		),
		personalDrone: den(
			SOURCE.WEATHER,
			"Persistent high wind grounds small drone operations entirely.",
		),
		nvgThermal: nom(),
		satcom: nom(),
		lrOptics: nom(),
	},
};
