// ─────────────────────────────────────────────────────────────────────────────
// ghostOpsApi.js
// Mission type registry + AAR generation via Groq.
//
// Point placement → GeneratePoints.js (algorithmic, no AI)
// Briefing generation → BriefingGenerator.js (pure function, no AI)
// AAR generation → generateAAR() below — proxied through POST /api/ai/aar
// Campaign generation → generateCampaign() below — proxied through POST /api/ai/campaign
// Groq key lives on the backend only — never exposed to the browser.
//
// PROVINCES_AI_CONTEXT has been removed entirely.
// Province context is now built at call time via buildProvinceContext() utility.
// Import that utility and PROVINCES in your caller (AIMissionGenerator.jsx).
//
// Mode structure:
//   Random Mission — zero Groq, deterministic
//   Mission        — zero Groq, deterministic
//   AI Mode
//     AI Random    — user picks province + location count, AI builds campaign
//     AI Mission   — user picks province + specific locations, AI sequences them
// ─────────────────────────────────────────────────────────────────────────────

import api from "./ApiClient";

// ─── Mission type registry ────────────────────────────────────────────────────
// Single source of truth for the UI, BriefingGenerator, and GeneratePoints.
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

// ─── Category display order ───────────────────────────────────────────────────

export const MISSION_CATEGORIES = [
	"Direct Action",
	"Special Reconnaissance",
	"Counterterrorism",
	"Overwatch",
	"Support",
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export const getMissionDoctrine = (missionId) =>
	MISSION_TYPES.find((m) => m.id === missionId)?.doctrine ?? "";

export const getMissionLabel = (missionId) =>
	MISSION_TYPES.find((m) => m.id === missionId)?.label ?? missionId;

export const getMissionFullLabel = (missionId) =>
	MISSION_TYPES.find((m) => m.id === missionId)?.fullLabel ?? missionId;

export const getMissionCategory = (missionId) =>
	MISSION_TYPES.find((m) => m.id === missionId)?.category ?? "";

// ─── AAR generation ───────────────────────────────────────────────────────────
// Single Groq call per completed operation.
// selectedPhases: array of phase objects the player chose to include.

const COMPLICATION_LABELS = {
	qrf_responded: "QRF responded faster than anticipated",
	isr_offline: "ISR went offline",
	crosscom_lost: "Cross-Com lost",
	exfil_compromised: "Exfil was compromised",
	civilian_contact: "Unexpected civilian contact",
	intel_recovered: "Intel recovered on objective",
	target_not_found: "Target not at location — new lead developed",
	asset_lost: "Asset destroyed or lost",
};

const INTEL_LABELS = {
	patrol_timing: "enemy patrol timing confirmed",
	enemy_strength: "enemy force strength assessed",
	facility_layout: "facility layout partially mapped",
	hvt_location: "HVT location updated",
	supply_route: "supply route identified",
	contact_activated: "resistance contact activated",
};

export async function generateAAR({ mission, selectedPhases }) {
	if (!selectedPhases?.length) {
		throw new Error("At least one phase must be selected to generate an AAR.");
	}

	// ── Build phase log block ─────────────────────────────────────────────────
	const phaseLog = selectedPhases
		.map((p) => {
			const complications =
				(p.complications ?? [])
					.filter((c) => c !== "none")
					.map((c) => COMPLICATION_LABELS[c] ?? c)
					.join(", ") || "None";

			const intel =
				(p.intelDeveloped ?? [])
					.filter((i) => i !== "nothing_new")
					.map((i) => INTEL_LABELS[i] ?? i)
					.join(", ") || "None";

			const casualty =
				p.casualties === "kia" ?
					`KIA${p.casualtyNote ? ` — ${p.casualtyNote}` : ""}`
				: p.casualties === "injured" ?
					`WIA${p.casualtyNote ? ` — ${p.casualtyNote}` : ""}`
				:	"None";

			const outcomeLabel =
				{
					clean: "Objective complete — clean execution",
					compromised: "Objective complete — element compromised",
					heavy_contact: "Objective complete — heavy contact sustained",
					aborted: "Aborted — objective not achieved",
					target_not_present: "Target not present — new lead required",
				}[p.outcome] ??
				p.outcome ??
				"Unknown";

			return [
				`Phase ${p.phaseNumber} — ${getMissionFullLabel(p.missionType)} — ${p.province ?? "Unknown AO"}`,
				`Outcome: ${outcomeLabel}`,
				`Squad: ${p.squadUsed || "Unknown"}`,
				`Insertion: ${p.infilMethodUsed || "Unknown"}`,
				`Complications: ${complications}`,
				`Casualties: ${casualty}`,
				`Intel developed: ${intel}`,
				p.notes ? `Field notes: ${p.notes}` : null,
			]
				.filter(Boolean)
				.join("\n");
		})
		.join("\n\n");

	// ── Build totals for context ──────────────────────────────────────────────
	const kiaCount = selectedPhases.filter((p) => p.casualties === "kia").length;
	const wiaCount = selectedPhases.filter(
		(p) => p.casualties === "injured",
	).length;
	const cleanCount = selectedPhases.filter((p) => p.outcome === "clean").length;
	const compromisedCount = selectedPhases.filter(
		(p) => p.outcome === "compromised" || p.outcome === "heavy_contact",
	).length;

	const summaryLine = [
		`${selectedPhases.length} phase(s) included`,
		`${cleanCount} clean`,
		compromisedCount > 0 ? `${compromisedCount} compromised` : null,
		kiaCount > 0 ? `${kiaCount} KIA` : null,
		wiaCount > 0 ? `${wiaCount} WIA` : null,
	]
		.filter(Boolean)
		.join(", ");

	// ── User message ──────────────────────────────────────────────────────────
	const userContent = `OPERATION: ${mission.name ?? "UNKNOWN"}
PRIMARY MISSION TYPE: ${getMissionFullLabel(mission.missionType)}
AO: ${mission.province ?? "Unknown"} — ${mission.biome ?? "Unknown biome"}
SUMMARY: ${summaryLine}

PHASE LOG:
${phaseLog}

Write the after action report.`;

	// ── Backend proxy call ───────────────────────────────────────────────────
	const systemPrompt =
		"You are a Ghost Recon special operations debrief officer writing an after action report. " +
		"Military prose. No bullet points. No lists. No markdown headers. " +
		"One continuous document, 300\u2013400 words. " +
		"Cover: what the operation set out to achieve, how each phase executed, " +
		"casualties sustained and their circumstances, intelligence developed, " +
		"Sentinel adaptation or threat posture changes observed, " +
		"and one specific recommended follow-on action based on the outcomes and any unresolved leads.";

	const res = await api.post("/ai/aar", { systemPrompt, userContent });
	return res.data.text;
}

// ─────────────────────────────────────────────────────────────────────────────
// generateCampaign
// Single Groq call producing the full operation structure for AI mode.
//
// Called by AIMissionGenerator.jsx after player configures inputs.
// Returns structured JSON — no further Groq calls needed for this operation.
//
// Caller is responsible for building provinceContext before this call:
//   import { buildProvinceContext } from '@/utils/buildProvinceContext';
//   import { PROVINCES } from '@/config';
//   const provinceContext = buildProvinceContext(selectedProvince, PROVINCES);
//   const provinceData = PROVINCES[selectedProvince];
//
// Structure A (direct_action, convoy_interdiction, sabotage):
//   Multiple teams, simultaneous objectives → returns { teams: [...] }
//
// Structure B (hvt_hunt, rescue, intel_gathering):
//   Two-act intel-then-strike → returns { act1: {...}, act2: {...} }
//
// AI Random:  playerLocations = null,  locationCount = number (2–6)
// AI Mission: playerLocations = array of location name strings, locationCount = null
// ─────────────────────────────────────────────────────────────────────────────

const STRUCTURE_A_OP_TYPES = ["direct_action", "convoy_interdiction", "sabotage"];

export async function generateCampaign({
	opType,
	opTypeDef,
	context,
	province, // single province key string e.g. "FenBog"
	provinceData, // full province object from PROVINCES[province]
	provinceContext, // string built by buildProvinceContext() before this call
	playerLocations, // null = AI Random | array of location name strings = AI Mission
	locationCount, // number = AI Random only | null = AI Mission
	missionTypes,
}) {
	const isRandom = !playerLocations;
	const isStructureA = STRUCTURE_A_OP_TYPES.includes(opType);

	const provinceLocationNames = provinceData.locations.map((l) => l.name);
	const validMissionTypeIds = new Set(missionTypes.map((m) => m.id));

	// ── Build the mission type reference list ─────────────────────────────────
	const missionTypeRef = missionTypes
		.map((m) => `  ${m.id} — ${m.fullLabel} (${m.category})`)
		.join("\n");

	// ── System prompt ─────────────────────────────────────────────────────────
	const systemPrompt =
		`You are a Ghost Recon Breakpoint special operations mission planner. ` +
		`You generate classified operation orders for Ghost operatives on Auroa — ` +
		`a remote technology archipelago seized by Sentinel Corp and defended by the Wolves, ` +
		`a rogue special forces faction.\n\n` +
		`Return ONLY valid JSON. No markdown. No explanation. No preamble.\n` +
		`All location names must exactly match names from the provided province list.\n` +
		`All missionTypeId values must exactly match values from the provided list.\n` +
		`Write in tight military prose — terse, operational, no civilian tone.`;

	// ── User prompt — branched by operation structure ─────────────────────────
	let userPrompt;

	if (isStructureA) {
		// Structure A — Direct Action: simultaneous multi-team strike
		const locationsBlock =
			playerLocations ?
				`The player has selected the following locations. Assign one team per location — use EXACTLY as listed:\n` +
				playerLocations.map((loc, i) => `  Team ${i + 1}: "${loc}"`).join("\n")
			:	`Choose ${locationCount ?? 2} distinct locations from the province list. Each becomes one team's objective.`;

		userPrompt =
			`Generate a Ghost Recon Breakpoint classified operation order.\n\n` +
			`OPERATION TYPE: ${opTypeDef.label} (${opType})\n` +
			`PLAYER CONTEXT: ${context || "No additional context provided — generate a compelling, grounded scenario."}\n` +
			`PROVINCE: ${province}\n` +
			`MODE: ${isRandom ? "AI Random" : "AI Mission"}\n\n` +
			`AVAILABLE MISSION TYPE IDs (use these exactly):\n${missionTypeRef}\n\n` +
			`PROVINCE AND AVAILABLE LOCATIONS:\n${provinceContext}\n\n` +
			`${locationsBlock}\n\n` +
			`Generate a Structure A — Direct Action operation.\n` +
			`Multiple teams strike multiple objectives simultaneously in a single deployment.\n` +
			`Each team gets one objective. Teams operate independently and exfil separately.\n\n` +
			`Return this exact JSON:\n` +
			`{\n` +
			`  "operationName": "TWO WORD CODENAME IN CAPS",\n` +
			`  "narrative": "3-4 sentences. Name the specific threat. Explain why command issued this tasking now. Include one specific Sentinel or Wolves activity detail. Military tone.",\n` +
			`  "structure": "direct_action",\n` +
			`  "friendlyConcerns": "One sentence about a secondary concern in the AO, or null if none.",\n` +
			`  "exfilPlan": "One sentence describing exfil for all teams.",\n` +
			`  "teams": [\n` +
			`    {\n` +
			`      "teamLabel": "Team 1",\n` +
			`      "objective": "<exact location name from province list>",\n` +
			`      "missionTypeId": "<exact ID from mission type list>",\n` +
			`      "task": "2-3 sentences. What this team physically does. What they must confirm or destroy. What success looks like.",\n` +
			`      "specialistRequired": "one word specialty or null"\n` +
			`    }\n` +
			`  ]\n` +
			`}\n\n` +
			`Rules:\n` +
			`- One team per location the player selected\n` +
			`- All missionTypeId values must be from the Direct Action or Overwatch categories\n` +
			`- teamLabel is Team 1, Team 2, Team 3 etc\n` +
			`- specialistRequired: "Demolition", "Sniper", "Medic", or null\n` +
			`- narrative must reference the specific province and at least one location name`;
	} else {
		// Structure B — Intel Then Strike: covert recon unlocks decisive action
		userPrompt =
			`Generate a Ghost Recon Breakpoint classified operation order.\n\n` +
			`OPERATION TYPE: ${opTypeDef.label} (${opType})\n` +
			`PLAYER CONTEXT: ${context || "No additional context provided — generate a compelling, grounded scenario."}\n` +
			`PROVINCE: ${province}\n` +
			`MODE: ${isRandom ? "AI Random" : "AI Mission"}\n\n` +
			`AVAILABLE MISSION TYPE IDs (use these exactly):\n${missionTypeRef}\n\n` +
			`PROVINCE AND AVAILABLE LOCATIONS:\n${provinceContext}\n\n` +
			`Generate a Structure B — Intel Then Strike operation.\n` +
			`Act 1 is a covert recon phase at a standoff position observing the target.\n` +
			`Act 2 is the strike phase at the actual target, unlocked after Act 1 is filed.\n` +
			`Act 1 and Act 2 happen at DIFFERENT locations — recon observes from distance, strike hits the target.\n\n` +
			`Return this exact JSON:\n` +
			`{\n` +
			`  "operationName": "TWO WORD CODENAME IN CAPS",\n` +
			`  "narrative": "3-4 sentences. Name the specific HVT or target asset. Explain why intel is needed before striking. Include time pressure or intel gap detail. Military tone.",\n` +
			`  "structure": "intel_then_strike",\n` +
			`  "friendlyConcerns": "One sentence about a secondary concern, or null.",\n` +
			`  "exfilPlan": "One sentence. Act 1 exfils quietly. Act 2 exfil method matches mission type.",\n` +
			`  "act1": {\n` +
			`    "teamLabel": "Team 1",\n` +
			`    "teamSize": "1-2 operators",\n` +
			`    "objective": "<standoff/observation location from province list — NOT the target>",\n` +
			`    "missionTypeId": "<SR_POINT or SR_AREA or OW_OVERWATCH>",\n` +
			`    "task": "2-3 sentences. Establish covert OP. What to observe. What intel to collect. No contact.",\n` +
			`    "intelGate": "snake_case_label for what this phase produces e.g. vasquez_confirmed"\n` +
			`  },\n` +
			`  "act2": {\n` +
			`    "teamLabel": "Team 2",\n` +
			`    "teamSize": "2-4 operators",\n` +
			`    "objective": "<actual target location from province list>",\n` +
			`    "missionTypeId": "<mission type matching the opType finalPhaseTypes>",\n` +
			`    "task": "2-3 sentences. The decisive action using intel from Act 1. What success looks like.",\n` +
			`    "unlockedBy": "<same value as act1 intelGate>",\n` +
			`    "specialistRequired": "one word or null"\n` +
			`  }\n` +
			`}\n\n` +
			`Rules:\n` +
			`- act1 objective and act2 objective must be DIFFERENT locations from the province list\n` +
			`- act1 missionTypeId must be SR_POINT, SR_AREA, or OW_OVERWATCH\n` +
			`- act2 missionTypeId must be one of: ${opTypeDef.finalPhaseTypes.join(", ")}\n` +
			`- intelGate and unlockedBy must match exactly\n` +
			`- narrative must reference the specific province and target`;
	}

	// ── Backend proxy call ────────────────────────────────────────────────────
	const res = await api.post("/ai/campaign", {
		systemPrompt,
		userPrompt,
		province,
		provinceLocationNames,
	});

	const campaign = res.data.campaign;

	// ── Frontend validation ───────────────────────────────────────────────────
	const isValidLoc  = (loc) => provinceLocationNames.some((n) => n.trim() === loc?.trim());
	const isValidType = (id)  => validMissionTypeIds.has(id);

	if (isStructureA) {
		if (!Array.isArray(campaign.teams) || !campaign.teams.length) {
			throw new Error("Campaign generation returned no teams. Try again.");
		}
		const bad = campaign.teams.filter(
			(t) => !isValidLoc(t.objective) || !isValidType(t.missionTypeId),
		);
		if (bad.length) {
			const detail = bad
				.map((t) => `objective="${t.objective}" type="${t.missionTypeId}"`)
				.join("; ");
			throw new Error(`Campaign returned invalid team data: ${detail}. Try again.`);
		}
	} else {
		const { act1, act2 } = campaign;
		if (!act1 || !act2) {
			throw new Error("Campaign generation missing act1 or act2. Try again.");
		}
		if (!isValidLoc(act1.objective)) {
			throw new Error(`Act 1 objective "${act1.objective}" not found in province list. Try again.`);
		}
		if (!isValidLoc(act2.objective)) {
			throw new Error(`Act 2 objective "${act2.objective}" not found in province list. Try again.`);
		}
		if (!isValidType(act1.missionTypeId)) {
			throw new Error(`Act 1 missionTypeId "${act1.missionTypeId}" is invalid. Try again.`);
		}
		if (!isValidType(act2.missionTypeId)) {
			throw new Error(`Act 2 missionTypeId "${act2.missionTypeId}" is invalid. Try again.`);
		}
		if (act1.intelGate !== act2.unlockedBy) {
			throw new Error(
				`intelGate "${act1.intelGate}" does not match unlockedBy "${act2.unlockedBy}". Try again.`,
			);
		}
		if (act1.objective === act2.objective) {
			throw new Error("Act 1 and Act 2 must use different locations. Try again.");
		}
	}

	// ── Return with normalised top-level fields ───────────────────────────────
	return {
		...campaign,
		operationStructure: campaign.structure,
		friendlyConcerns:   campaign.friendlyConcerns ?? null,
		exfilPlan:          campaign.exfilPlan ?? null,
	};
}
