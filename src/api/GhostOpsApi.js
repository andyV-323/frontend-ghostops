// src/api/ghostOpsApi.js
// Groq inference — returns structured JSON with infil/exfil/rally coordinates
// plus all briefing sections. AI now owns point placement.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ── Mission type registry ─────────────────────────────────────────────────────
// Single source of truth for both the AI prompt and the UI.
// icon: FontAwesome icon name string — import the matching FA icon in your component.
// abbr: short badge label shown on the card.
// color / activeBorder / activeBg: Tailwind classes for selected state styling.
export const MISSION_TYPES = [
	// ── Direct Action ──────────────────────────────────────────────────────────
	{
		id: "DA_RAID",
		label: "Raid",
		fullLabel: "Direct Action — Raid",
		abbr: "RAID",
		category: "Direct Action",
		icon: "faCrosshairs",
		color: "text-red-400",
		activeBorder: "border-red-400/60",
		activeBg: "bg-red-400/8",
		doctrine:
			"Short-duration assault on a fixed objective to destroy, capture, or exploit. Element breaches, actions on objective, then breaks contact. Speed and violence of action are primary. Exfil immediately after objective is complete — no extended hold.",
	},
	{
		id: "DA_AMBUSH",
		label: "Ambush",
		fullLabel: "Direct Action — Ambush / Interdiction",
		abbr: "AMB",
		category: "Direct Action",
		icon: "faBolt",
		color: "text-red-400",
		activeBorder: "border-red-400/60",
		activeBg: "bg-red-400/8",
		doctrine:
			"Element occupies a pre-selected kill zone and initiates contact on a moving target (convoy, patrol, vehicle). Requires a near ambush position, initiating element, and cut-off elements. Infil must be covert and early — element must be in position before target arrives.",
	},
	{
		id: "DA_SNATCH",
		label: "Snatch & Grab",
		fullLabel: "Direct Action — Snatch & Grab (Capture HVT)",
		abbr: "CAP",
		category: "Direct Action",
		icon: "faHandsBound",
		color: "text-blue-400",
		activeBorder: "border-blue-400/60",
		activeBg: "bg-blue-400/8",
		doctrine:
			"Priority mission: capture the HVT alive and exfil without compromise. Infil low-signature (HALO, foot, or small boat at night). EXFIL IS ALWAYS HIGH-CAPACITY AND FAST — helicopter extraction or vehicle convoy, never foot or HALO. The prisoner cannot be moved covertly on foot over long distances. Plan a dedicated exfil method separate from infil method.",
	},
	{
		id: "DA_ELIMINATION",
		label: "HVT Elimination",
		fullLabel: "Direct Action — HVT Elimination",
		abbr: "HVT",
		category: "Direct Action",
		icon: "faSkull",
		color: "text-orange-400",
		activeBorder: "border-orange-400/60",
		activeBg: "bg-orange-400/8",
		doctrine:
			"Element infiltrates to eliminate a high-value individual. Can be direct assault or precision standoff depending on compromise level. No custody requirement — exfil can match infil method. Confirm kill before breaking contact.",
	},
	{
		id: "DA_SABOTAGE",
		label: "Sabotage",
		fullLabel: "Direct Action — Sabotage / Demolition",
		abbr: "SAB",
		category: "Direct Action",
		icon: "faBomb",
		color: "text-amber-400",
		activeBorder: "border-amber-400/60",
		activeBg: "bg-amber-400/8",
		doctrine:
			"Element infiltrates to destroy or disable a specific installation, piece of infrastructure, or equipment. Demo charges require vehicle or cargo infil if load is heavy. Exfil before secondary explosions draw QRF. Timed charges allow standoff exfil.",
	},
	{
		id: "DA_STRIKE",
		label: "Infrastructure Strike",
		fullLabel: "Direct Action — Targeted Infrastructure Strike",
		abbr: "STR",
		category: "Direct Action",
		icon: "faCircleRadiation",
		color: "text-yellow-400",
		activeBorder: "border-yellow-400/60",
		activeBg: "bg-yellow-400/8",
		doctrine:
			"Element infiltrates to neutralize a specific node — power grid, comms relay, fuel depot, command post. May use explosive, electronic, or direct fire methods. Precision required to avoid collateral damage. Exfil before enemy can attribute the strike.",
	},
	{
		id: "DA_CONVOY",
		label: "Convoy Interdiction",
		fullLabel: "Direct Action — Convoy Interdiction",
		abbr: "CI",
		category: "Direct Action",
		icon: "faTruck",
		color: "text-violet-400",
		activeBorder: "border-violet-400/60",
		activeBg: "bg-violet-400/8",
		doctrine:
			"Element intercepts and destroys or captures a moving enemy convoy. Requires pre-positioned blocking elements and an assault element. Vehicle infil to reach intercept point quickly. Exfil must account for destroyed vehicle debris and enemy QRF response.",
	},
	// ── Special Reconnaissance ─────────────────────────────────────────────────
	{
		id: "SR_AREA",
		label: "Area Recon",
		fullLabel: "Special Recon — Area Recon",
		abbr: "SR",
		category: "Special Reconnaissance",
		icon: "faUserSecret",
		color: "text-indigo-400",
		activeBorder: "border-indigo-400/60",
		activeBg: "bg-indigo-400/8",
		doctrine:
			"Element conducts covert observation of a broad area — enemy troop movement, logistics routes, population patterns. No contact. No signature. Infil at maximum distance from objective. Exfil only after collection window is complete. LOADOUT is null — no heavy weapons.",
	},
	{
		id: "SR_POINT",
		label: "Point Surveillance",
		fullLabel: "Special Recon — Point Surveillance",
		abbr: "OBS",
		category: "Special Reconnaissance",
		icon: "faEye",
		color: "text-indigo-400",
		activeBorder: "border-indigo-400/60",
		activeBg: "bg-indigo-400/8",
		doctrine:
			"Element establishes a covert observation post (OP) on a specific high-value location — compound, airfield, command post. Extended dwell time (hours to days). Infil must be undetected and well before the observation window. LOADOUT is null.",
	},
	{
		id: "SR_BDA",
		label: "BDA",
		fullLabel: "Special Recon — Battle Damage Assessment",
		abbr: "BDA",
		category: "Special Reconnaissance",
		icon: "faListCheck",
		color: "text-indigo-400",
		activeBorder: "border-indigo-400/60",
		activeBg: "bg-indigo-400/8",
		doctrine:
			"Element infiltrates post-strike to confirm destruction or survival of a targeted facility. Short dwell time, high risk — enemy will likely have QRF in the area. Infil immediately after the strike window. Exfil on confirmation of BDA. LOADOUT is null.",
	},
	// ── Counterterrorism ───────────────────────────────────────────────────────
	{
		id: "CT_HOSTAGE",
		label: "Hostage Rescue",
		fullLabel: "Counterterrorism — Hostage Rescue",
		abbr: "HR",
		category: "Counterterrorism",
		icon: "faHandcuffs",
		color: "text-cyan-400",
		activeBorder: "border-cyan-400/60",
		activeBg: "bg-cyan-400/8",
		doctrine:
			"Element assaults a hostile-held location to recover one or more hostages. Speed and surprise are decisive — delay increases hostage risk. EXFIL MUST BE HIGH-CAPACITY: helicopter or vehicle large enough to transport both element and rescued personnel. Infil low-signature. Exfil method must differ from infil.",
	},
	{
		id: "CT_STRIKE",
		label: "CT Strike",
		fullLabel: "Counterterrorism — Counterterrorism Strike",
		abbr: "CT",
		category: "Counterterrorism",
		icon: "faPersonRifle",
		color: "text-cyan-400",
		activeBorder: "border-cyan-400/60",
		activeBg: "bg-cyan-400/8",
		doctrine:
			"Element conducts a direct strike against a terrorist network node — safehouse, training camp, command element. High collateral damage sensitivity. Infil must be covert. Rules of engagement are strict — positive ID required before engagement. Exfil before secondary exploitation by enemy.",
	},
	{
		id: "CT_RECOVERY",
		label: "Personnel Recovery",
		fullLabel: "Counterterrorism — Personnel Recovery (CSAR)",
		abbr: "CSAR",
		category: "Counterterrorism",
		icon: "faShuffle",
		color: "text-cyan-400",
		activeBorder: "border-cyan-400/60",
		activeBg: "bg-cyan-400/8",
		doctrine:
			"Element infiltrates to recover isolated friendly personnel — downed aircrew, compromised operator, or missing asset. Time-critical. Infil fast (helicopter or vehicle if roads exist). Exfil must accommodate the recovered personnel — helicopter or vehicle mandatory. Rally point is the linkup location with the isolated individual.",
	},
	// ── Overwatch / Support ────────────────────────────────────────────────────
	{
		id: "OW_OVERWATCH",
		label: "Overwatch",
		fullLabel: "Defensive — Overwatch / Sniper Screen",
		abbr: "OW",
		category: "Overwatch",
		icon: "faEye",
		color: "text-emerald-400",
		activeBorder: "border-emerald-400/60",
		activeBg: "bg-emerald-400/8",
		doctrine:
			"Element establishes a long-range observation and fires position to provide overwatch for a friendly element or deter enemy movement. Position must have line of sight to the supported area. Infil covert and early. Exfil only after the supported element has cleared. LOADOUT focuses on precision fires and observation equipment.",
	},
	{
		id: "OW_RESUPPLY",
		label: "Resupply Run",
		fullLabel: "Support — Forward Resupply Run",
		abbr: "SUP",
		category: "Support",
		icon: "faTruck",
		color: "text-emerald-400",
		activeBorder: "border-emerald-400/60",
		activeBg: "bg-emerald-400/8",
		doctrine:
			"Element moves supplies, ammunition, or medical support to a forward element. Vehicle infil is preferred — cargo load requires it. Route must avoid known enemy patrol patterns. Speed and route security are priorities. Not a combat mission — ROE is defensive only.",
	},
];

// ── Category display order for grouped UI rendering ───────────────────────────
export const MISSION_CATEGORIES = [
	"Direct Action",
	"Special Reconnaissance",
	"Counterterrorism",
	"Overwatch",
	"Support",
];

// ── Lookup helpers ────────────────────────────────────────────────────────────
export const getMissionDoctrine = (missionId) =>
	MISSION_TYPES.find((m) => m.id === missionId)?.doctrine ?? "";

export const getMissionLabel = (missionId) =>
	MISSION_TYPES.find((m) => m.id === missionId)?.label ?? missionId;

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a Ghost Recon special operations mission planner for Auroa island operations.
You produce a complete pre-mission package as a single JSON object. No markdown. No explanation outside the JSON.

SPATIAL RULES — follow exactly or points will land in the ocean:
- Map bounds are [0,0] to [768,1366] in [row, col] coordinates (row = Y axis, col = X axis).
- If terrain.isIsland is true, ocean surrounds all sides.
- If terrain.hasCoast is false, there is NO ocean — never pick boat insertion.
- coastZones are rectangles [[rowMin,colMin],[rowMax,colMax]] where ocean exists. A boat infilPoint MUST land inside one.
- INFIL must be at least 200 units from every objective coordinate.
- EXFIL must be on a different axis from INFIL and at least 150 units from every objective.
- RALLY sits between INFIL and the objective cluster, 40-60% of the approach distance, offset from the direct line.
- Never place any point within 40 units of map edge [0,0] or [768,1366] unless it is a coastZone boat insertion.
- All three coordinates must be integers. Row clamped to [40,728]. Col clamped to [40,1326].

INFILTRATION & EXFILTRATION SELECTION — READ EVERY RULE.

INFIL METHOD SELECTION:
- HALO jump: best for island terrain with no roads, avoids radar, default for most island missions.
- LALO parachute: low altitude terrain masking, short exposure, good for tight drop zones.
- Helicopter fast rope / Small bird insert: good for time-sensitive missions, urban objectives, or when a hot exfil is also planned with the same bird.
- Boat / water insertion: valid for coastal or maritime objectives. Use when objective is within 400 units of a coastZone or when a water approach provides clear tactical advantage.
- Ground vehicle: ONLY if terrain.hasRoads is true. Good for Convoy Interdiction, Resupply, or when carrying heavy demo equipment. Never for SR missions.
- On foot: zero signature. Best for short distances, urban blend-in, or SR missions.

EXFIL METHOD SELECTION — CRITICAL RULES:
- PRISONER / RECOVERED PERSONNEL RULE: If the mission type is DA_SNATCH, CT_HOSTAGE, or CT_RECOVERY — exfilMethod MUST be helicopter extract or vehicle convoy. You cannot HALO or foot-march a prisoner or hostage. Write this explicitly in sections.INFILTRATION.
- EXFIL DIFFERS FROM INFIL: For DA_SNATCH, CT_HOSTAGE, CT_RECOVERY — always use a different exfil method than infil. Infil covert/low-sig, exfil fast/high-capacity.
- SR MISSIONS: Exfil must be the same low-signature method as infil — no vehicles, no helicopters.
- ALL OTHER MISSIONS: Exfil method can match infil unless mission doctrine says otherwise.

VEHICLE USAGE RULES:
- Ground vehicles are VALID for: DA_CONVOY, DA_SABOTAGE (heavy load), OW_RESUPPLY, DA_RAID (fast assault), CT_RECOVERY (time-critical), DA_SNATCH exfil.
- Ground vehicles are INVALID for: all SR missions (signature too high), DA_SNATCH infil (covert approach required), CT_STRIKE infil (attribution risk).
- If terrain.hasRoads is false, never use ground vehicle.
- Write vehicle types generically: "ground vehicle convoy", "armed utility vehicle" — no brand names.

DOCTRINE RULES:
- All SR missions (SR_AREA, SR_POINT, SR_BDA): set sections.LOADOUT to null. Stealth, no-contact only.
- Match infil to terrain: coastal/island = HALO or boat; inland tundra = HALO/LALO or vehicle; urban = small bird, vehicle, or on foot.

GEAR RULES — no exceptions:
- Headgear by mission category:
  * Direct Action, Counterterrorism = ballistic helmet or bump helmet. Never a baseball cap.
  * Special Reconnaissance, Overwatch = low-profile boonie hat, beanie, baseball cap, or shemagh. Never a helmet.
  * Support = bump helmet or soft cap.
- Top by biome: Rain Forest = lightweight jungle shirt. Tundra = insulated jacket or fleece. Desert = desert camo shirt. Urban = plain dark shirt or civilian top. Volcanic = earth tone shirt or ranger green.
- Bottom: jungle = lightweight cargo pants. Arctic = insulated pants. Desert = tan/coyote pants. Urban = dark cargo pants.
- Boots: jungle = waterproof jungle boots. Arctic = insulated cold weather boots. Desert = tan suede desert boots. Urban = low-profile trail runners or black boots.
- Camo: Rain Forest = multicam tropic or jungle green. Tundra = arctic white or grey. Desert = arid multicam or coyote tan. Urban = wolf grey or solid black. Volcanic = ranger green or earth tone.

ASSET STATUS RULES — MANDATORY PROSE FORMAT:
Write sections.ASSET_STATUS as ONE flowing paragraph of tactical prose. No lists. No label names like "Unmanned Aircraft System".
Use narrative names: ISR drone, Cross-Com HUD, Armaros drone, strike designator, vehicle insertion, suppressors, launch window.
CORRECT: "ISR drone is fully operational — aerial overwatch and real-time targeting are live. Cross-Com HUD is up, full comms and target marking active. Armaros is on station. Strike designator is hot. Vehicle insertion authorized. Suppressors mandatory before the insertion line. Launch window is dusk only."
WRONG: "Unmanned Aircraft System is operational. Uplink Channel is live." — Never write it this way.

- COMMANDERS_INTENT must name the primary objective location directly.
- Sections except ASSET_STATUS: under 40 words. ASSET_STATUS: up to 120 words. No markdown, no bullet points.

SECTION QUALITY RULES:
- MISSION INTENT: one sentence — what the element does, why it matters, what success looks like.
- INFILTRATION: describe infil AND exfil method. For prisoner/hostage missions, explicitly state how the prisoner/hostage exfils with the element.
- GEAR: kit description prose, not a list.
- RULES OF ENGAGEMENT: specific to this mission type and compromise level.
- COMMANDERS_INTENT: name the objective, desired end state, what the element must preserve or avoid.

RESPOND WITH ONLY THIS JSON STRUCTURE:
{
  "infilPoint":     [row, col],
  "infilMethod":    "string",
  "exfilPoint":     [row, col],
  "exfilMethod":    "string",
  "rallyPoint":     [row, col],
  "approachVector": "one sentence describing the approach axis",
  "sections": {
    "ASSET_STATUS":        "string or null",
    "MISSION_INTENT":      "string",
    "INFILTRATION":        "string — describe both infil and exfil, especially for prisoner/hostage missions",
    "GEAR":                "string",
    "LOADOUT":             "string or null if SR mission",
    "RULES_OF_ENGAGEMENT": "string",
    "COMMANDERS_INTENT":   "string"
  }
}`;

// ── Infil/Exfil options ───────────────────────────────────────────────────────
const INFIL_OPTIONS = [
	"HALO jump — high altitude, avoids radar, default for most island missions",
	"LALO parachute — low altitude terrain masking, short exposure window",
	"Helicopter fast rope — medium altitude insert, good when same bird can extract",
	"Small bird assault insert — quick low-signature insert, good for urban",
	"Boat / water insertion — coastal or river approach, valid when objective is near water",
	"Swim / water insertion — silent coastal approach, very short distances",
	"Ground vehicle — only if terrain.hasRoads is true, good for heavy loads and fast movement",
	"On foot — zero signature, best for short distances, urban blend-in, or all SR missions",
];

const EXFIL_OPTIONS = [
	"Helicopter extract (hot or cold LZ) — MANDATORY for DA_SNATCH, CT_HOSTAGE, CT_RECOVERY",
	"Vehicle convoy — MANDATORY for prisoner/hostage missions if no helo, also post-sabotage with heavy equipment",
	"Boat / water exfil — valid for coastal objectives",
	"HALO jump — only for missions with NO prisoner or hostage",
	"On foot — only for SR missions or short distances with no prisoner",
	"Match infil method — only when mission type doctrine allows it",
];

// ── Build user message ────────────────────────────────────────────────────────
const buildPackageMessage = ({
	missionName,
	province,
	biome,
	locations,
	allLocations,
	missionType,
	missionDoctrine,
	terrain,
	recon,
}) => {
	const allLocsBlock = allLocations
		.map((l) => `  ${l.name}: [${l.coordinates[0]}, ${l.coordinates[1]}]`)
		.join("\n");

	const objBlock = locations
		.map(
			(l, i) =>
				`  OBJ-${String(i + 1).padStart(2, "0")}: ${l.name} @ [${l.coordinates[0]}, ${l.coordinates[1]}]\n  Intel: ${l.description}`,
		)
		.join("\n\n");

	const coastDesc =
		terrain.hasCoast && terrain.coastZones?.length ?
			terrain.coastZones
				.map(
					(z) =>
						`    ${z.side.toUpperCase()} - ${z.label}: rows ${z.bounds[0][0]}-${z.bounds[1][0]}, cols ${z.bounds[0][1]}-${z.bounds[1][1]}`,
				)
				.join("\n")
		:	"    NONE - no ocean on this map. Do not pick boat insertion.";

	const inlandDesc =
		terrain.inlandWater?.length ?
			terrain.inlandWater
				.map(
					(w) =>
						`    ${w.label}: rows ${w.bounds[0][0]}-${w.bounds[1][0]}, cols ${w.bounds[0][1]}-${w.bounds[1][1]}`,
				)
				.join("\n")
		:	"    None";

	const requiresHeavyExfil = [
		"DA_SNATCH",
		"CT_HOSTAGE",
		"CT_RECOVERY",
	].includes(missionType);
	const requiresNullLoadout = ["SR_AREA", "SR_POINT", "SR_BDA"].includes(
		missionType,
	);

	let reconBlock = "";
	if (recon) {
		const m = recon.modifiers || {};
		const windows =
			m.launchWindows ?
				Object.values(m.launchWindows)
					.filter((w) => w?.authorized)
					.map((w) => w.label)
					.join(", ") || "NONE"
			:	"UNKNOWN";

		reconBlock = `
RECON INTELLIGENCE:
  Compromise: ${(m.compromiseBadge || "unknown").toUpperCase()}
  Enemy State: ${m.enemyState || "Unknown"}
  Intel Confidence: ${m.intelAccuracy ?? "?"}%

ASSET STATUS DATA — write sections.ASSET_STATUS as ONE flowing prose paragraph. No lists.
Use: ISR drone, Cross-Com HUD, Armaros drone, strike designator, vehicle insertion, suppressors, launch window.

  ISR drone: ${m.UAS ? "ONLINE — aerial overwatch and real-time targeting available" : "OFFLINE — actively jammed, element is blind above treeline"}
  Cross-Com HUD: ${m.crossCom ? "ONLINE — full team comms, target marking, threat tracking active" : "OFFLINE — HUD is dark, fall back to hand signals"}
  Armaros drone: ${m.armarosDrone ? "AVAILABLE — on station and ready for uplink" : "OFFLINE — enemy jammer active, Armaros is down"}
  Strike designator: ${m.strikeDesignator ? "AVAILABLE — designator is hot, call in strikes on confirmed HVTs" : "OFFLINE — no air support this operation"}
  Vehicle insertion: ${m.vehicleInsertion ? "AUTHORIZED" : "DENIED — infil on foot only"}
  Suppressors: ${m.suppressorsAvailable ? "REQUIRED — noise discipline mandatory, suppressors on before insertion line" : "NOT REQUIRED"}
  Launch windows: ${windows}`;
	}

	return `OPERATION: ${missionName}
MISSION TYPE: ${missionType}
PROVINCE: ${province} | BIOME: ${biome}
MAP BOUNDS: [0,0] to [768,1366] — [row, col]

MISSION DOCTRINE — apply these rules exactly when planning infil, exfil, and sections:
${missionDoctrine}

ALL PROVINCE LOCATIONS (for spatial reasoning):
${allLocsBlock}

TARGET OBJECTIVES:
${objBlock}

TERRAIN:
  Island (ocean all sides): ${terrain.isIsland ? "YES" : "NO"}
  Has Ocean Coast: ${terrain.hasCoast ? "YES" : "NO — no boat insertion"}
  Has Roads: ${terrain.hasRoads ? "YES" : "NO — no ground vehicle"}
  Has Airfield: ${terrain.hasAirfield ? "YES" : "NO"}
  Notes: ${terrain.notes}

  COAST ZONES:
${coastDesc}

  INLAND WATER (freshwater — not valid for ocean boat insertion):
${inlandDesc}

AVAILABLE INFILTRATION METHODS:
${INFIL_OPTIONS.map((o) => `  ${o}`).join("\n")}

AVAILABLE EXFILTRATION METHODS:
${EXFIL_OPTIONS.map((o) => `  ${o}`).join("\n")}
${reconBlock}

PLANNING INSTRUCTIONS:
1. infilPoint: boat = inside coastZone. HALO/LALO = 200+ units from objectives. Vehicle = road-accessible map edge.
2. exfilPoint: opposite side of objective cluster, 150+ units from any objective.
3. rallyPoint: between infilPoint and nearest objective, 40-60% of approach, offset from direct line.
4. Points: [row, col] integers. Row [40,728]. Col [40,1326].
5. ${requiresNullLoadout ? "SR MISSION: sections.LOADOUT = null. No-contact doctrine." : "sections.LOADOUT: generic weapon types only, no brand names."}
6. ${requiresHeavyExfil ? "PRISONER/RECOVERY MISSION: exfilMethod MUST be helicopter extract or vehicle convoy. State this explicitly in sections.INFILTRATION." : "Exfil method per mission doctrine above."}
7. ${!recon ? "No recon: sections.ASSET_STATUS = null. End sections.COMMANDERS_INTENT with: Cold assumptions applied." : "Recon present: sections.ASSET_STATUS = one flowing prose paragraph, no lists."}

Respond with ONLY the JSON object.`;
};

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateGhostPackage(params) {
	const key = import.meta.env.VITE_GROQ_KEY;
	if (!key) throw new Error("VITE_GROQ_KEY is not set in environment");

	const missionDoctrine =
		params.missionDoctrine ?? getMissionDoctrine(params.missionType);

	const response = await fetch(GROQ_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${key}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: MODEL,
			max_tokens: 1400,
			temperature: 0.5,
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{
					role: "user",
					content: buildPackageMessage({ ...params, missionDoctrine }),
				},
			],
		}),
	});

	if (!response.ok) {
		const err = await response.text();
		throw new Error(`Groq API ${response.status}: ${err}`);
	}

	const data = await response.json();
	const raw = data.choices?.[0]?.message?.content ?? "";

	const clean = raw
		.replace(/```(?:json)?/gi, "")
		.replace(/```/g, "")
		.trim();

	let parsed;
	try {
		parsed = JSON.parse(clean);
	} catch {
		const match = clean.match(/\{[\s\S]*\}/);
		if (match) {
			try {
				parsed = JSON.parse(match[0]);
			} catch {
				throw new Error("AI returned malformed JSON — please try again.");
			}
		} else {
			throw new Error("AI returned a non-JSON response — please try again.");
		}
	}

	const clamp = (pt) => {
		if (!Array.isArray(pt) || pt.length < 2) return [200, 400];
		return [
			Math.max(40, Math.min(728, Math.round(Number(pt[0]) || 200))),
			Math.max(40, Math.min(1326, Math.round(Number(pt[1]) || 400))),
		];
	};

	return {
		infilPoint: clamp(parsed.infilPoint),
		infilMethod: parsed.infilMethod || "On foot",
		exfilPoint: clamp(parsed.exfilPoint),
		exfilMethod: parsed.exfilMethod || "On foot",
		rallyPoint: clamp(parsed.rallyPoint),
		approachVector: parsed.approachVector || "",
		sections: parsed.sections || {},
	};
}

// ── Team assignment ───────────────────────────────────────────────────────────
export async function generateTeamAssignment({
	availableOperators,
	missionType,
	missionDescription,
}) {
	const key = import.meta.env.VITE_GROQ_KEY;
	if (!key) throw new Error("VITE_GROQ_KEY is not set in environment");

	const missionLabel = getMissionLabel(missionType);

	const operatorList = availableOperators
		.map((op) =>
			[
				op.callSign,
				op.class,
				op.role || null,
				op.weaponType || null,
				op.support ? "Support" : null,
				op.aviator ? "Aviator" : null,
			]
				.filter(Boolean)
				.join(" / "),
		)
		.join("\n");

	const content = `Select the best 2-4 operators for this mission. For each chosen operator write one line: CALLSIGN — one sentence justification referencing their class or role. Keep total output under 120 words.

Operators:
${operatorList}

Mission type: ${missionLabel}
${missionDescription ? `Context: ${missionDescription}` : ""}`;

	const response = await fetch(GROQ_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${key}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: MODEL,
			max_tokens: 200,
			temperature: 0.6,
			messages: [
				{
					role: "system",
					content:
						"You are a Ghost Recon special operations team commander. Be concise and tactical.",
				},
				{ role: "user", content },
			],
		}),
	});

	if (!response.ok) throw new Error(`Groq API ${response.status}`);
	const data = await response.json();
	return data.choices?.[0]?.message?.content ?? "";
}
