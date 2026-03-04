// src/api/ghostOpsApi.js
// Groq inference — returns structured JSON with infil/exfil/rally coordinates
// plus all briefing sections. AI now owns point placement.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a Ghost Recon special operations mission planner for Auroa island operations.
You produce a complete pre-mission package as a single JSON object. No markdown. No explanation outside the JSON.

SPATIAL RULES — follow exactly or points will land in the ocean:
- Map bounds are [0,0] to [768,1366] in [row, col] coordinates (row = Y axis, col = X axis).
- If terrain.isIsland is true, ocean surrounds all sides — boat or HALO insertion only.
- If terrain.hasCoast is false, there is NO ocean — never pick boat insertion.
- coastZones are rectangles [[rowMin,colMin],[rowMax,colMax]] where ocean exists. A boat infilPoint MUST land inside one of these rectangles.
- INFIL must be at least 200 units from every objective coordinate.
- EXFIL must be on a different axis from INFIL and at least 150 units from every objective.
- RALLY sits between INFIL and the objective cluster, 40-60% of the approach distance, offset from the direct line.
- Never place any point within 40 units of map edge [0,0] or [768,1366] unless it is a coastZone boat insertion.
- All three coordinates must be integers. Row clamped to [40,728]. Col clamped to [40,1326].

DOCTRINE RULES:
- Special Reconnaissance: set sections.LOADOUT to null. Stealth, no-contact, covert exfil only.
- Match infil method to terrain: coastal/island = boat or HALO; inland tundra = HALO/LALO or ground vehicle; fjord/channel = boat; urban = small bird or ground vehicle.

GEAR RULES — follow exactly, no exceptions:
- Headgear by mission type:
  * Direct Action, HVT Elimination, Hostage Rescue, Sabotage / Demolition, Convoy Interdiction = ballistic helmet or bump helmet. Never a baseball cap.
  * Special Reconnaissance, Defensive / Overwatch = low-profile boonie hat, beanie,baseball cap, or shemagh. Never a helmet.
- Top by biome:
  * Rain Forest / jungle = lightweight jungle shirt or moisture-wicking long sleeve.
  * Tundra / arctic / High Tundra = insulated cold weather jacket or fleece.
  * Desert / arid = desert camo shirt or tan combat shirt.
  * Urban / city = plain dark shirt or civilian top with plate carrier.
  * Volcanic / rocky = earth tone shirt or ranger green base layer.
- Bottom: match biome — jungle = lightweight cargo pants, arctic = insulated pants, desert = tan/coyote pants, urban = dark cargo pants.
- Boots: jungle = waterproof jungle boots, arctic = insulated cold weather boots, desert = tan suede desert boots, urban = low-profile trail runners or black boots.
- Camo color: Rain Forest = multicam tropic or jungle green. Tundra = arctic white or grey. Desert = arid multicam or coyote tan. Urban = wolf grey or solid black. Volcanic = ranger green or earth tone.

ASSET STATUS RULES — write as tactical narrative prose, not a status list:
- Each available/online asset gets one sentence explaining what it enables operationally.
- Each offline/denied asset gets one sentence explaining the tactical consequence and any workaround.
- Examples of correct narrative style:
  * UAS ONLINE: "ISR drone is fully operational — aerial overwatch and real-time targeting available throughout the operation."
  * UAS OFFLINE: "ISR drone is being actively jammed — no aerial surveillance available, element is blind above the treeline."
  * Cross-Com ONLINE: "Cross-Com HUD is live — full team communication, target marking, and threat tracking are active."
  * Cross-Com OFFLINE: "Enemy has compromised Cross-Com — HUD is dark, fall back to hand signals and verbal callouts only."
  * Armaros OFFLINE but Strike Designator AVAILABLE: "Armaros drone is down but the strike designator is hot — call in air support on confirmed high-value targets."
  * Vehicle Insertion DENIED: "Vehicle insertion is blown — element will infiltrate on foot only, expect extended movement to OBJ."
  * Suppressors REQUIRED: "Noise discipline is mandatory — suppressors on all weapons before crossing the insertion line."
  * Launch Windows: "Authorized launch window is [window] — coordinate all direct action within this timeframe."
- Write all assets in a single flowing paragraph, not line by line.

- COMMANDERS_INTENT must name the primary objective location directly.
- Each section except ASSET_STATUS must be under 40 words. ASSET_STATUS can be up to 100 words. No markdown headers. No dash bullet points anywhere in output.

RESPOND WITH ONLY THIS JSON STRUCTURE — no other text:
{
  "infilPoint":     [row, col],
  "infilMethod":    "string",
  "exfilPoint":     [row, col],
  "exfilMethod":    "string",
  "rallyPoint":     [row, col],
  "approachVector": "one sentence describing the approach axis",
  "sections": {
    "ASSET_STATUS":        "string — tactical narrative paragraph, or null if no recon",
    "MISSION_INTENT":      "string",
    "INFILTRATION":        "string referencing infilMethod and approach direction",
    "GEAR":                "string — helmet/headgear, top, bottom, boots, camo color matching biome and mission type",
    "LOADOUT":             "string or null if Special Reconnaissance",
    "RULES_OF_ENGAGEMENT": "string",
    "COMMANDERS_INTENT":   "string naming the objective directly"
  }
}`;

// ── Infil method options ──────────────────────────────────────────────────────
const INFIL_OPTIONS = [
	"HALO jump (high altitude, avoids radar and visual detection)",
	"LALO parachute (low altitude, terrain masking, short exposure window)",
	"Helicopter fast rope (medium altitude insert, higher acoustic signature)",
	"Small bird assault insert (quick low-signature insert, limited personnel)",
	"Boat / water insertion (coastal or river approach, silent at low speed)",
	"Ground vehicle (road approach, high signature, speed advantage)",
	"On foot (zero signature, slow — best for short distances)",
];

// ── Build user message ────────────────────────────────────────────────────────
const buildPackageMessage = ({
	missionName,
	province,
	biome,
	locations,
	allLocations,
	missionType,
	terrain,
	recon,
}) => {
	// All province locations for spatial reference
	const allLocsBlock = allLocations
		.map((l) => `  ${l.name}: [${l.coordinates[0]}, ${l.coordinates[1]}]`)
		.join("\n");

	// Selected objective locations
	const objBlock = locations
		.map(
			(l, i) =>
				`  OBJ-${String(i + 1).padStart(2, "0")}: ${l.name} @ [${l.coordinates[0]}, ${l.coordinates[1]}]\n  Intel: ${l.description}`,
		)
		.join("\n\n");

	// Coast zones block
	const coastDesc =
		terrain.hasCoast && terrain.coastZones?.length ?
			terrain.coastZones
				.map(
					(z) =>
						`    ${z.side.toUpperCase()} - ${z.label}: rows ${z.bounds[0][0]}-${z.bounds[1][0]}, cols ${z.bounds[0][1]}-${z.bounds[1][1]}`,
				)
				.join("\n")
		:	"    NONE - no ocean on this map. Do not pick boat insertion.";

	// Inland water block
	const inlandDesc =
		terrain.inlandWater?.length ?
			terrain.inlandWater
				.map(
					(w) =>
						`    ${w.label}: rows ${w.bounds[0][0]}-${w.bounds[1][0]}, cols ${w.bounds[0][1]}-${w.bounds[1][1]}`,
				)
				.join("\n")
		:	"    None";

	// Recon block
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
RECON INTELLIGENCE - apply as hard rules:
  Compromise: ${(m.compromiseBadge || "unknown").toUpperCase()}
  Enemy State: ${m.enemyState || "Unknown"}
  Intel Confidence: ${m.intelAccuracy ?? "?"}%

ASSET DATA — convert each item below into a tactical narrative sentence for sections.ASSET_STATUS.
  Write as a single flowing paragraph. Do NOT list them. Use the narrative style from the ASSET STATUS RULES.
  UAS / TacMap: ${m.UAS ? "ONLINE" : "OFFLINE"}
  Cross-Com HUD: ${m.crossCom ? "ONLINE" : "OFFLINE"}
  Armaros Drone: ${m.armarosDrone ? "AVAILABLE" : "OFFLINE"}
  Strike Designator: ${m.strikeDesignator ? "AVAILABLE" : "OFFLINE"}
  Vehicle Insertion: ${m.vehicleInsertion ? "AUTHORIZED" : "DENIED"}
  Suppressors: ${m.suppressorsAvailable ? "REQUIRED" : "NOT REQUIRED"}
  Teammate Abilities: ${m.teammateAbilities ? "ACTIVE" : "OFFLINE"}
  Launch Windows: ${windows}`;
	}

	return `OPERATION: ${missionName}
MISSION TYPE: ${missionType}
PROVINCE: ${province} | BIOME: ${biome}
MAP BOUNDS: [0,0] to [768,1366] — [row, col]

ALL PROVINCE LOCATIONS (use for spatial reasoning when placing points):
${allLocsBlock}

TARGET OBJECTIVES:
${objBlock}

TERRAIN:
  Island (ocean all sides): ${terrain.isIsland ? "YES" : "NO"}
  Has Ocean Coast: ${terrain.hasCoast ? "YES" : "NO - no boat insertion available"}
  Has Roads: ${terrain.hasRoads ? "YES" : "NO - no ground vehicle insertion"}
  Has Airfield: ${terrain.hasAirfield ? "YES" : "NO"}
  Notes: ${terrain.notes}

  COAST ZONES (boat infilPoint must land inside one of these rectangles):
${coastDesc}

  INLAND WATER (freshwater only - not valid for ocean boat insertion):
${inlandDesc}

AVAILABLE INFILTRATION METHODS (choose best fit for terrain and mission):
${INFIL_OPTIONS.map((o) => `  ${o}`).join("\n")}
${reconBlock}

PLACEMENT INSTRUCTIONS:
1. infilPoint: if boat insertion, must be inside a coastZone rectangle above. If HALO/LALO, place 200+ units from all objectives. If ground vehicle, place near a road-accessible map edge.
2. exfilPoint: place on the OPPOSITE side of the objective cluster from infilPoint, 150+ units from any objective.
3. rallyPoint: place between infilPoint and the nearest objective, 40-60% of approach distance, offset from the direct line.
4. All three points must be [row, col] integer pairs clamped to row [40,728] and col [40,1326].
5. ${missionType === "Special Reconnaissance" ? "SR MISSION: set sections.LOADOUT to null. Stealth and no-contact doctrine applies." : "Include sections.LOADOUT with generic weapon types only — no specific model names."}
6. ${!recon ? "No recon data provided: set sections.ASSET_STATUS to null. End sections.COMMANDERS_INTENT with: Cold assumptions applied." : "Recon data present: write sections.ASSET_STATUS as a tactical narrative paragraph using the asset data above — not a list."}

SECTION QUALITY RULES — each section must read like a real special operations briefing, not a label or a summary:
- MISSION INTENT: one sentence stating what the element will do, why it matters, and what success looks like. Never just the mission type name. Example: "Element will penetrate the Detention Center perimeter, neutralize Sentinel security presence, and extract the facility intel package before QRF can respond."
- INFILTRATION: describe the actual approach — what method, from which direction, what cover or terrain feature is being used, and why it was chosen for this specific location.
- GEAR: write as a kit description, not a comma list. Example: "Ballistic helmet and multicam tropic shirt over lightweight cargo pants — jungle boots for the wet terrain. Green-toned camo throughout."
- RULES OF ENGAGEMENT: specific to this mission type and compromise level — not generic. DA with warm compromise = different ROE than SR with cold compromise.
- COMMANDERS_INTENT: name the objective, state the desired end state, and what the element must preserve or avoid. Never just "Secure [location]."

Respond with ONLY the JSON object. No preamble, no explanation, no markdown fences.`;
};

// ── Main export — returns parsed JSON with points + sections ──────────────────
export async function generateGhostPackage(params) {
	const key = import.meta.env.VITE_GROQ_KEY;
	if (!key) throw new Error("VITE_GROQ_KEY is not set in environment");

	const response = await fetch(GROQ_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${key}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: MODEL,
			max_tokens: 900,
			temperature: 0.5,
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: buildPackageMessage(params) },
			],
		}),
	});

	if (!response.ok) {
		const err = await response.text();
		throw new Error(`Groq API ${response.status}: ${err}`);
	}

	const data = await response.json();
	const raw = data.choices?.[0]?.message?.content ?? "";

	// Strip any markdown fences the model adds despite instructions
	const clean = raw
		.replace(/```(?:json)?/gi, "")
		.replace(/```/g, "")
		.trim();

	let parsed;
	try {
		parsed = JSON.parse(clean);
	} catch {
		// Fallback: extract the JSON object from surrounding text
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

	// Clamp all points to valid inner map bounds
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

// ── Team assignment — non-streaming, unchanged from original ──────────────────
export async function generateTeamAssignment({
	availableOperators,
	missionType,
	missionDescription,
}) {
	const key = import.meta.env.VITE_GROQ_KEY;
	if (!key) throw new Error("VITE_GROQ_KEY is not set in environment");

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

Mission type: ${missionType || "Not specified"}
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
