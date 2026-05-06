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
			min: 22, max: 34, unit: "C",
			fahrenheit: { min: 72, max: 93 },
		},
		atmosphere: [
			{ condition: "cloudless",     weight: 2  },
			{ condition: "sunshine",      weight: 5  },
			{ condition: "overcast",      weight: 23 },
			{ condition: "precipitation", weight: 45 },
			{ condition: "storm",         weight: 25 },
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
		atmosphereNotes: {
			cloudless:     ["Rare clearing — upper thermals stable for drone ops", "Elevated UV exposure on any approach above canopy line"],
			sunshine:      ["Sunlight through canopy breaks creates heat shimmer in clearings", "Ground moisture accelerating — humidity spike expected within hours"],
			overcast:      ["Standard Rain Forest ceiling — low cloud eliminates effective air support", "Diffused light kills hard shadows — thermal scopes lose effectiveness"],
			precipitation: ["Active rainfall — acoustic masking is significant, enables aggressive movement tempo", "Ground saturation critical — tracked vehicle movement not advised in current conditions", "Visibility under 100m in any open area"],
			storm:         ["Storm gusts compromise auditory detection at close range", "Lightning above canopy line — ridge and high-ground approaches are high risk", "Flash flooding possible in low-lying channels and stream beds"],
		},
		atmosphereGear: {
			cloudless:     ["Sun protection if operating above the canopy line"],
			sunshine:      ["Electrolyte management critical — heat index elevated above biome baseline"],
			overcast:      ["Current conditions nominal for kit — standard waterproof config sufficient"],
			precipitation: ["Full waterproof kit mandatory — immersion unavoidable in active precipitation", "Seal all electronics — rain will penetrate unsealed cases in sustained downpour"],
			storm:         ["Shelter where possible — extended storm exposure is a casualty risk at this heat and humidity", "Secure all loose equipment — wind will displace anything unstrapped"],
		},
	},

	// ── Volcanic Rain Forest ────────────────────────────────────────────────────
	"Volcanic Rain Forest": {
		tempRange: {
			min: 24, max: 38, unit: "C",
			fahrenheit: { min: 75, max: 100 },
		},
		atmosphere: [
			{ condition: "cloudless",     weight: 3  },
			{ condition: "sunshine",      weight: 8  },
			{ condition: "overcast",      weight: 28 },
			{ condition: "precipitation", weight: 38 },
			{ condition: "storm",         weight: 23 },
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
		atmosphereNotes: {
			cloudless:     ["Ash particulate clearly visible against clear sky — signature elevated", "Air assets viable but ash intake is a risk to rotary wing engines"],
			sunshine:      ["Solar heating combined with volcanic ground radiation compounds ambient temperature significantly", "Ash suspended in upper atmosphere creates photochemical haze that degrades long-range targeting"],
			overcast:      ["Cloud ceiling traps volcanic gas near ground level — sulfur concentration elevated", "Thermal imaging further compromised by volcanic heat combined with overhead cloud layer"],
			precipitation: ["Rainfall mixes with volcanic ash — acidic runoff is a hazard on exposed skin and optics", "Wet ash surface is near-frictionless — vehicle ops and movement highly unstable in current conditions"],
			storm:         ["Storm over active volcanic zone — ash cloud becomes ballistic projectile hazard in high wind", "Ground stability compromised — seismic activity may accompany storm system"],
		},
		atmosphereGear: {
			cloudless:     ["Respiratory protection even in clear conditions — volcanic particulate still present at ground level"],
			sunshine:      ["Full heat management protocol — ambient plus radiated volcanic heat is compounding"],
			overcast:      ["Upgrade respiratory protection to sealed system if available — gas concentration elevated"],
			precipitation: ["Full skin cover — ash-rain contact is a chemical irritant on exposed tissue", "Sealed eye protection — ash-water mix will compromise vision rapidly"],
			storm:         ["Full body cover mandatory — ash driven by storm wind creates abrasive conditions on any exposed surface"],
		},
	},

	// ── Volcanic Desert ─────────────────────────────────────────────────────────
	"Volcanic Dessert": {
		tempRange: {
			min: 32, max: 52, unit: "C",
			fahrenheit: { min: 90, max: 126 },
		},
		atmosphere: [
			{ condition: "cloudless", weight: 55 },
			{ condition: "sunshine",  weight: 40 },
			{ condition: "overcast",  weight: 5  },
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
		atmosphereNotes: {
			cloudless: ["Maximum UV exposure — no atmospheric filtering in cloudless conditions", "Heat shimmer from 09:00 — long-range engagement window is early morning only"],
			sunshine:  ["Glare from lava rock creates visual interference for unaided observation", "Ground radiation plus direct sun — operator core temperature management is critical"],
			overcast:  ["Rare cloud cover reduces heat load marginally — insertion window slightly extended", "Diffused light reduces heat shimmer — improves long-range targeting relative to baseline"],
		},
		atmosphereGear: {
			cloudless: ["Full UV protection and eye shielding essential — no atmospheric filter in current conditions"],
			sunshine:  ["Reflective surface cover for equipment — metal components become a burn hazard in direct sun"],
			overcast:  ["Conditions marginally more tolerable — maintain full heat management protocol regardless"],
		},
	},

	// ── High Cliffs ──────────────────────────────────────────────────────────────
	"High Cliffs": {
		tempRange: {
			min: 8, max: 22, unit: "C",
			fahrenheit: { min: 46, max: 72 },
		},
		atmosphere: [
			{ condition: "cloudless",     weight: 10 },
			{ condition: "sunshine",      weight: 20 },
			{ condition: "overcast",      weight: 35 },
			{ condition: "precipitation", weight: 25 },
			{ condition: "storm",         weight: 10 },
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
		atmosphereNotes: {
			cloudless:     ["Excellent long-range visibility — element fully exposed at all approach vectors", "Wind still present — cloudless does not mean calm on exposed cliff terrain"],
			sunshine:      ["Glare off the sea surface reduces maritime observation accuracy at range", "Cliff faces are dry — vertical movement is at its best in current conditions"],
			overcast:      ["Cloud ceiling reduces air asset and UAV effectiveness", "Muted light aids concealment on cliff faces — shadow movement is viable"],
			precipitation: ["Cliff faces wet — vertical movement becomes extremely high risk in current conditions", "Sea state elevated — boat exfil reliability degraded", "Rain reduces maritime patrol visibility — insertion window may be viable"],
			storm:         ["Storm-force winds on cliff terrain — HALO and LALO operations suspended", "Sea state critical — maritime approach not viable", "Cliff face approach is dangerous — wind gusts can dislodge operators on vertical sections"],
		},
		atmosphereGear: {
			cloudless:     ["Standard kit — no weather threat in current conditions, but concealment is compromised"],
			sunshine:      ["Eye protection for sea glare on maritime-facing approaches"],
			overcast:      ["Wind layer still required — overcast does not reduce coastal wind loading"],
			precipitation: ["Non-slip footwear is absolutely critical in current conditions", "All climbing equipment must be rated for wet operation"],
			storm:         ["Clip-in safety required on any vertical movement — gusts can exceed 50 knots on exposed cliff faces"],
		},
	},

	// ── Salt Marsh ───────────────────────────────────────────────────────────────
	"Salt Marsh": {
		tempRange: {
			min: 10, max: 24, unit: "C",
			fahrenheit: { min: 50, max: 75 },
		},
		atmosphere: [
			{ condition: "cloudless",     weight: 5  },
			{ condition: "sunshine",      weight: 10 },
			{ condition: "overcast",      weight: 40 },
			{ condition: "precipitation", weight: 35 },
			{ condition: "storm",         weight: 10 },
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
		atmosphereNotes: {
			cloudless:     ["Rare clear conditions — element visible across open marsh from significant range", "Low fog absent — concealment relies on reed beds and ground defilade only"],
			sunshine:      ["Evaporation off water surface creates low haze by mid-morning — partial visual cover as day progresses", "Insect activity significantly elevated in warm sunny marsh conditions"],
			overcast:      ["Standard marsh ceiling — low cloud provides partial concealment", "Fog patches likely in low-lying areas — navigation by compass required"],
			precipitation: ["Active rain raises water table — paths that were passable may now be flooded", "Rain-pitted water surface masks acoustic detection — aggressive movement near water is viable", "Drone operations suspended in current precipitation"],
			storm:         ["Storm surge risk in coastal marsh — low-lying extraction routes may flood rapidly without warning", "Visibility near zero in driving rain — maintain close formation or risk element fragmentation"],
		},
		atmosphereGear: {
			cloudless:     ["Standard marsh kit — no weather modification needed in current conditions"],
			sunshine:      ["Insect protection elevated priority — warm sunny conditions maximize parasite activity"],
			overcast:      ["Full waterproof kit despite absence of active rain — ambient moisture will penetrate non-sealed gear"],
			precipitation: ["Assume full immersion — no marsh path is reliable when water table is actively rising"],
			storm:         ["Emergency flotation relevant — storm surge can occur without warning in low-lying marsh"],
		},
	},

	// ── High Tundra ──────────────────────────────────────────────────────────────
	"High Thundra": {
		tempRange: {
			min: -18, max: 6, unit: "C",
			fahrenheit: { min: 0, max: 43 },
		},
		atmosphere: [
			{ condition: "cloudless",     weight: 20 },
			{ condition: "sunshine",      weight: 15 },
			{ condition: "overcast",      weight: 30 },
			{ condition: "precipitation", weight: 25 },
			{ condition: "storm",         weight: 10 },
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
		atmosphereNotes: {
			cloudless:     ["Maximum cold — no insulating cloud layer, temperatures are at or below the range floor", "Excellent visibility — element silhouetted clearly against snow at range"],
			sunshine:      ["Snow blindness risk — sun on snow surface creates intense UV glare", "Apparent warmth is misleading — wind chill remains extreme regardless of solar gain"],
			overcast:      ["Flat light from overcast creates near-whiteout conditions — depth perception severely compromised", "Cloud layer provides marginal insulation — temperatures 2-4°C above cloudless baseline"],
			precipitation: ["Active snowfall — tracks covered within minutes, improving route security significantly", "Snowfall accumulation on equipment requires regular clearing — optics and weapons most critical", "Visibility reduced to 50m or less in heavy snowfall"],
			storm:         ["Blizzard conditions — navigation without instruments is impossible", "Wind-driven snow at storm velocity is simultaneously an abrasion and hypothermia risk", "All vehicle operations suspended — drifts can immobilize tracked vehicles within minutes of storm onset"],
		},
		atmosphereGear: {
			cloudless:     ["Additional insulation layer warranted — radiant heat loss maximized with no cloud cover"],
			sunshine:      ["UV-rated eye protection mandatory — snow blindness onset can be rapid on open tundra", "Do not reduce layers based on sun — wind chill calculation is the actual cold threat"],
			overcast:      ["Navigation aids critical — visual references disappear in flat whiteout light"],
			precipitation: ["Shake equipment regularly — wet snow adds weight and conceals equipment malfunctions", "Sealed kit for all electronics — snowmelt infiltrates unsealed cases"],
			storm:         ["Full whiteout shelter protocol — element must be able to establish field shelter within 10 minutes of storm onset", "All exposed skin covered — frostbite onset within minutes in blizzard conditions at this temperature"],
		},
	},

	// ── Fjordlands ───────────────────────────────────────────────────────────────
	Fjordlands: {
		tempRange: {
			min: 2, max: 16, unit: "C",
			fahrenheit: { min: 36, max: 61 },
		},
		atmosphere: [
			{ condition: "cloudless",     weight: 5  },
			{ condition: "sunshine",      weight: 15 },
			{ condition: "overcast",      weight: 35 },
			{ condition: "precipitation", weight: 25 },
			{ condition: "storm",         weight: 20 },
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
		atmosphereNotes: {
			cloudless:     ["Rare clear window — element fully exposed from water surface and air observation", "Cold air is stable — long-range acoustics carry further in clear fjord conditions"],
			sunshine:      ["Low-angle sun creates long shadows on fjord walls — element may be backlit on eastern approaches", "Glare off fjord water degrades maritime patrol observation — boat insertion window viable"],
			overcast:      ["Typical fjord ceiling — sea fog at low altitude expected", "Maritime patrol visibility limited — boat insertion viable under cloud cover"],
			precipitation: ["Rain on fjord water creates acoustic masking — boat movement significantly less detectable in current conditions", "Wet rock surfaces increase hazard on any vertical cliff approach"],
			storm:         ["Storm conditions — all maritime insertion suspended, sea state is critical", "Fjord channeling effect amplifies wind velocity — gusts exceed open-water equivalent", "Element must be ashore before storm peaks — extraction options become zero once storm is established"],
		},
		atmosphereGear: {
			cloudless:     ["Cold weather kit still fully required — temperature at range floor regardless of sky"],
			sunshine:      ["Cold weather kit maintained — solar gain is minimal at these latitudes"],
			overcast:      ["Dry suit or wetsuit — water temperature is life-threatening regardless of air conditions or sky state"],
			precipitation: ["Sealed waterproof outerwear — precipitation combined with salt spray is a compounding exposure risk"],
			storm:         ["Full storm shelter kit pre-staged — no maritime ops until conditions clear"],
		},
	},

	// ── Rain Shadows ──────────────────────────────────────────────────────────────
	"Rain Shadows": {
		tempRange: {
			min: 6, max: 20, unit: "C",
			fahrenheit: { min: 43, max: 68 },
		},
		atmosphere: [
			{ condition: "cloudless",     weight: 25 },
			{ condition: "sunshine",      weight: 35 },
			{ condition: "overcast",      weight: 25 },
			{ condition: "precipitation", weight: 12 },
			{ condition: "storm",         weight: 3  },
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
		atmosphereNotes: {
			cloudless:     ["Excellent long-range visibility in both directions — element is fully exposed on open terrain", "Dust from movement is a detectable signature — pace and spacing management critical"],
			sunshine:      ["Heat shimmer from exposed rock creates visible distortion at 300m+", "Dry clear conditions strongly favor adversary ISR drone operations overhead"],
			overcast:      ["Reduced visibility narrows UAV observation window — viable infiltration corridor", "Mountain gusts still present — overcast does not indicate calm in this terrain"],
			precipitation: ["Rare rain event — terrain is unprepared, flash runoff risk in gullies and ravines", "Wet rock and sparse vegetation become unexpectedly slippery — movement pace reduces significantly"],
			storm:         ["Unusual storm for this terrain — mountain amplification of gusts likely in current conditions", "Lightning risk elevated on exposed highland terrain"],
		},
		atmosphereGear: {
			cloudless:     ["Dust covers for optics and weapons — dry conditions mean airborne particulate is constant"],
			sunshine:      ["Sun protection for extended operation on open terrain"],
			overcast:      ["Wind layer maintained — overcast conditions do not reduce mountain draft"],
			precipitation: ["Rain shell sufficient — events are brief but gully runoff can be sudden and powerful"],
			storm:         ["Avoid high ground and ridgelines — lightning hazard elevated on exposed terrain"],
		},
	},

	// ── Mead Lands ────────────────────────────────────────────────────────────────
	"Mead Lands": {
		tempRange: {
			min: 10, max: 24, unit: "C",
			fahrenheit: { min: 50, max: 75 },
		},
		atmosphere: [
			{ condition: "cloudless",     weight: 20 },
			{ condition: "sunshine",      weight: 35 },
			{ condition: "overcast",      weight: 25 },
			{ condition: "precipitation", weight: 15 },
			{ condition: "storm",         weight: 5  },
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
		atmosphereNotes: {
			cloudless:     ["Full exposure across open meadow — concealment requires deliberate use of ground folds and depressions", "ISR drone operations fully effective in current conditions — assume overhead surveillance"],
			sunshine:      ["Long shadows at golden hour — movement during low-sun windows maximizes lateral concealment", "Open terrain plus sunshine means element visible at maximum observation range from any direction"],
			overcast:      ["Reduced visibility — ISR drone effectiveness at altitude is limited", "Flat light reduces depth cues — distance estimation requires ranging equipment"],
			precipitation: ["Rain reduces observation range across open meadow — infiltration window improved", "Soft ground leaves clear tracks — route selection around firmer terrain advised"],
			storm:         ["Storm across open meadow — element exposed to full wind load with no natural shelter", "Lightning risk high on open terrain — avoid hilltops and isolated trees"],
		},
		atmosphereGear: {
			cloudless:     ["Standard kit — no weather modifier in current conditions"],
			sunshine:      ["Glare management for optics — sun angle creates washout on unshielded lenses"],
			overcast:      ["Standard kit unchanged — mild conditions with no significant weather threat"],
			precipitation: ["Rain shell sufficient for current conditions — not an extreme precipitation event"],
			storm:         ["Seek terrain defilade — flat meadow offers no storm shelter", "Secure all loose equipment before storm arrival"],
		},
	},

	// ── Meadow Lands and Urban City ───────────────────────────────────────────────
	"Meadow Lands and Urban City": {
		tempRange: {
			min: 12, max: 26, unit: "C",
			fahrenheit: { min: 54, max: 79 },
		},
		atmosphere: [
			{ condition: "cloudless",     weight: 15 },
			{ condition: "sunshine",      weight: 30 },
			{ condition: "overcast",      weight: 30 },
			{ condition: "precipitation", weight: 18 },
			{ condition: "storm",         weight: 7  },
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
		atmosphereNotes: {
			cloudless:     ["Clear urban visibility — all approach routes fully observed at camera and patrol range", "Clean satellite and UAV imagery — assume adversary ISR is also effective in current conditions"],
			sunshine:      ["Sun angle creates hard shadows in urban canyons — concealment viable in shaded alleyways throughout the day", "Glare off glass buildings creates visual interference for snipers at specific angles"],
			overcast:      ["Overcast reduces hard shadows in urban terrain — adversary snipers lose corner concealment advantage", "Coastal fog from the bay may roll in — early morning concealment window likely"],
			precipitation: ["Rain drives civilian activity indoors — element movement is less conspicuous in current conditions", "Wet streets reflect light — vehicle headlights create silhouette risk for element on foot at night", "Drainage system near capacity — basement and tunnel approach routes may be flooded"],
			storm:         ["Storm conditions restrict civilian movement — element stands out in empty streets", "Power infrastructure vulnerable in storm — grid disruption possible, use as an operational window", "Flood risk in low-lying districts near the bay in current conditions"],
		},
		atmosphereGear: {
			cloudless:     ["Standard civilian kit if cover is required — nothing weather-driven in current conditions"],
			sunshine:      ["Eye protection — urban glass glare is intense in direct sun at street level"],
			overcast:      ["Light rain shell — overcast frequently precedes coastal precipitation in this region"],
			precipitation: ["Civilian waterproof cover maintains urban blend — avoid military-style wet weather gear in public areas"],
			storm:         ["Civilian storm cover maintains blend — heavy weather gear draws no attention in current conditions"],
		},
	},

	// ── Meadow Lands (WindyIslands) ───────────────────────────────────────────────
	"Meadow Lands": {
		tempRange: {
			min: 8, max: 20, unit: "C",
			fahrenheit: { min: 46, max: 68 },
		},
		atmosphere: [
			{ condition: "cloudless",     weight: 10 },
			{ condition: "sunshine",      weight: 25 },
			{ condition: "overcast",      weight: 35 },
			{ condition: "precipitation", weight: 22 },
			{ condition: "storm",         weight: 8  },
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
		atmosphereNotes: {
			cloudless:     ["Clear skies over island — element fully exposed from sea and air observation at all times", "Wind still significant in current conditions — cloudless does not mean calm on exposed island terrain"],
			sunshine:      ["Low-angle island sun creates long exposure shadows — move during sun-at-back windows for partial concealment", "Glare off surrounding sea limits maritime patrol observation from the water"],
			overcast:      ["Standard island ceiling — reduces aerial observation effectiveness", "Wind at altitude drives cloud fast — weather windows are brief and change without warning"],
			precipitation: ["Rain on island terrain — no tree cover means full exposure to precipitation throughout", "Wet meadow ground becomes saturated quickly — movement leaves obvious tracks"],
			storm:         ["Island storm — full 360° wind exposure with no terrain shelter anywhere on the island", "Storm surge possible on coastal approaches — extraction routes may flood", "Boat exfil suspended in current storm conditions"],
		},
		atmosphereGear: {
			cloudless:     ["Wind layer still required — gusts on exposed island remain significant even in clear conditions"],
			sunshine:      ["Maintain full wind kit — solar gain does not offset island wind chill at this latitude"],
			overcast:      ["Waterproof outer layer — cloud can drop precipitation with minimal warning in island conditions"],
			precipitation: ["Full waterproof kit — no natural overhead cover on open island terrain"],
			storm:         ["Emergency shelter protocol — the island offers no natural storm protection"],
		},
	},

	// ── High Tundra and Rain Shadows ──────────────────────────────────────────────
	"High Thundra and Rain Shadows": {
		tempRange: {
			min: -10, max: 10, unit: "C",
			fahrenheit: { min: 14, max: 50 },
		},
		atmosphere: [
			{ condition: "cloudless",     weight: 20 },
			{ condition: "sunshine",      weight: 12 },
			{ condition: "overcast",      weight: 30 },
			{ condition: "precipitation", weight: 25 },
			{ condition: "storm",         weight: 13 },
		],
		humidity: "low",
		operationalNotes: [
			"High security zone — weather does not reduce sensor-based patrol density",
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
		atmosphereNotes: {
			cloudless:     ["Clear conditions at altitude — element silhouetted against snow on any elevated approach", "Maximum cold exposure — no cloud insulation in hybrid cold terrain"],
			sunshine:      ["Snow blindness risk at altitude — UV intensity higher than at sea level", "Apparent warmth is deceptive — actual cold remains extreme, wind chill unchanged"],
			overcast:      ["Flat whiteout light in snow terrain — compass and GPS are essential for any navigation", "Cloud insulation reduces temperature marginally above cloudless baseline"],
			precipitation: ["Snow or sleet — tracks concealed rapidly but visibility severely reduced", "Accumulation on equipment requires regular clearing — weapons and optics most critical in current conditions", "High-security zone: current weather does not reduce sensor-based patrol assets"],
			storm:         ["Blizzard in restricted zone — simultaneous natural hazard and elevated adversary threat", "Navigation to emergency shelter must be pre-planned — blizzard onset is rapid at altitude", "All vehicle and air assets suspended — element is isolated in current storm conditions"],
		},
		atmosphereGear: {
			cloudless:     ["Additional insulation — radiant heat loss maximized with no cloud cover at altitude"],
			sunshine:      ["UV-rated eye protection mandatory — snow blindness onset can be rapid at altitude in current conditions"],
			overcast:      ["Navigation redundancy — visual reference vanishes in flat overcast snow conditions"],
			precipitation: ["Sealed kit for all electronics — snow infiltration damages unsealed systems rapidly"],
			storm:         ["Blizzard survival kit pre-staged at waypoints — no improvisation possible in this terrain during storm conditions"],
		},
	},
};
