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
// Single Groq call producing the full phase chain for AI mode operations.
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
// AI Random:  playerLocations = null,  locationCount = number (2–6)
// AI Mission: playerLocations = array of location name strings, locationCount = null
// ─────────────────────────────────────────────────────────────────────────────

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

	// ── Build the mission type reference list ─────────────────────────────────
	const missionTypeRef = missionTypes
		.map((m) => `  ${m.id} — ${m.fullLabel} (${m.category})`)
		.join("\n");

	// ── Build player phase block ──────────────────────────────────────────────
	// AI Random: AI picks locations and phase count from the province.
	// AI Mission: locations are locked to player selection, AI assigns types and narrative.

	const playerPhaseBlock =
		playerLocations ?
			`The player has selected the following locations in order. Use these EXACTLY — do not change or substitute any location name:
${playerLocations.map((loc, i) => `  Phase ${i + 1}: "${loc}"`).join("\n")}

Assign an appropriate missionTypeId from the list above to each phase based on its role in the narrative.
The final phase missionTypeId must be one of: ${opTypeDef.finalPhaseTypes.join(", ")}.
Phase count equals the number of locations the player selected — do not add or remove phases.
The final location is the decisive action — make it the operational climax.`
		:	`Choose locations from the province that form a logical operational sequence.
Generate between 2 and 6 phases — choose the count that fits the narrative, not a default.
The player requested approximately ${locationCount} locations as a guide, but adjust by 1 if narrative coherence requires it.
A tight 2-phase direct action is valid. A 6-phase multi-stage campaign is valid. Never pad phases to reach a number.
Each phase must produce intelligence or shape the battlefield that the next phase directly exploits.
The final phase missionTypeId must be one of: ${opTypeDef.finalPhaseTypes.join(", ")}.
Build-up phases use types from: [${opTypeDef.buildupPhaseTypes.join(", ")}].
The final phase is the decisive action — make it the operational climax.`;

	// ── System prompt ─────────────────────────────────────────────────────────
	const systemPrompt = `You are a Ghost Recon Breakpoint special operations mission planner generating a classified operation order.

You MUST return ONLY valid JSON — no preamble, no explanation, no markdown, no code blocks.
Every location name you use MUST exactly match a name from the provided province location list.
Never invent location names.

The operation takes place on Auroa — a remote technology archipelago seized by Sentinel Corp and defended by the Wolves, a rogue special forces faction armed with advanced Skell Technology drones, autonomous weapons, and armed vehicles. Ghost operatives operate without official acknowledgment. Write in tight military prose — no filler, no civilian tone.`;

	// ── User prompt ───────────────────────────────────────────────────────────
	const userPrompt = `Generate a Ghost Recon Breakpoint classified operation order.

OPERATION TYPE: ${opTypeDef.label} (${opType})
PLAYER CONTEXT: ${context || "No additional context provided — generate a compelling, grounded scenario."}
MODE: ${isRandom ? "AI Random — choose locations and phase sequence from the province list below." : "AI Mission — player has locked the locations, build the narrative around them."}

AVAILABLE MISSION TYPE IDs (use these exactly):
${missionTypeRef}

PROVINCE AND AVAILABLE LOCATIONS:
${provinceContext}

${playerPhaseBlock}

Return this exact JSON structure:
{
  "operationName": "Two-word codename in ALL CAPS — sounds classified e.g. IRON COVENANT, PALE EMBER, DEAD RECKONING",
  "narrative": "3-4 sentences. Name the specific threat actor or asset. Explain why Auroa command issued this tasking. Include one specific detail about Sentinel or Wolves activity that triggered this operation. Military tone — no vague generalities.",
  "opType": "${opType}",
  "phaseCount": <number between 2 and 6 — chosen by narrative need, not defaulted to 4>,
  "phases": [
    {
      "phaseIndex": 0,
      "label": "Short phase codename e.g. Cold Canvas, Iron Vigil, Dead Drop",
      "location": "<exact location name from the province list above>",
      "missionTypeId": "<exact mission type ID from the list above>",
      "timeOfDay": "<one of: night, dawn, day, dusk — SR missions must use night or dawn; DA strikes prefer night or dusk; final phases prefer night>",
      "threatLevel": "<one of: low, medium, high, critical — build-up phases escalate; final phase is always high or critical>",
      "objective": "Two sentences. First: what the player physically does at this location. Second: why this matters to the campaign — what it unlocks or confirms for the next phase.",
      "intelGate": "snake_case label for the intelligence this phase produces e.g. patrol_timing, facility_layout, hvt_confirmed",
      "isFinal": false
    }
  ]
}

Rules:
- phases array length must equal phaseCount
- Last phase must have isFinal: true, all others isFinal: false
- location values must match the provided province location list EXACTLY (case-sensitive)
- missionTypeId must match a value from the mission type list EXACTLY
- timeOfDay must be one of: night, dawn, day, dusk
- threatLevel must be one of: low, medium, high, critical
- phaseCount is determined by operation complexity — a 2-phase op is valid, a 6-phase op is valid, never default to 4
- Build-up phases must feel like genuine ISR or shaping actions that logically enable the next phase
- The final phase is the decisive action — objective text must reflect the operational climax
- Each phase intelGate must reference something the following phase actually exploits
- Do NOT include a province field in phases — all phases are in ${province}
- Do NOT include minibrief — tactical environmental detail is handled by BriefingGenerator
- Do NOT include enemyForce — enemy presence is handled by a separate config`;

	// ── Backend proxy call ───────────────────────────────────────────────────
	const res = await api.post("/ai/campaign", {
		systemPrompt,
		userPrompt,
		province,
		provinceLocationNames: provinceData.locations.map((l) => l.name),
	});
	return res.data.campaign;
}
