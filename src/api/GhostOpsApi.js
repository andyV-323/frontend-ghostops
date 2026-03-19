// ─────────────────────────────────────────────────────────────────────────────
// ghostOpsApi.js
// Mission type registry + AAR generation via Groq.
//
// Point placement → GeneratePoints.js (algorithmic, no AI)
// Briefing generation → BriefingGenerator.js (pure function, no AI)
// AAR generation → generateAAR() below (single Groq call per operation)
// ─────────────────────────────────────────────────────────────────────────────
import { PROVINCES_AI_CONTEXT } from "@/config";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

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
	const key = import.meta.env.VITE_GROQ_KEY;
	if (!key) throw new Error("VITE_GROQ_KEY is not set in environment");

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

	// ── Groq call ─────────────────────────────────────────────────────────────
	const response = await fetch(GROQ_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${key}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: MODEL,
			max_tokens: 600,
			temperature: 0.4,
			messages: [
				{
					role: "system",
					content:
						"You are a Ghost Recon special operations debrief officer writing an after action report. " +
						"Military prose. No bullet points. No lists. No markdown headers. " +
						"One continuous document, 300–400 words. " +
						"Cover: what the operation set out to achieve, how each phase executed, " +
						"casualties sustained and their circumstances, intelligence developed, " +
						"Sentinel adaptation or threat posture changes observed, " +
						"and one specific recommended follow-on action based on the outcomes and any unresolved leads.",
				},
				{ role: "user", content: userContent },
			],
		}),
	});

	if (!response.ok) {
		const err = await response.text();
		throw new Error(`Groq API ${response.status}: ${err}`);
	}

	const data = await response.json();
	return data.choices?.[0]?.message?.content?.trim() ?? "";
}
// ─────────────────────────────────────────────────────────────────────────────
// ADD TO ghostOpsApi.js
// generateCampaign — single Groq call that produces the full phase chain.
//
// Called by AIMissionGenerator.jsx after player configures inputs.
// Returns structured JSON — no further Groq calls needed for this operation.
//
// Random mode: AI picks provinces, locations, phase count, narrative.
// Mission mode: AI sequences player-chosen locations into a narrative.
// ─────────────────────────────────────────────────────────────────────────────

export async function generateCampaign({
	opType,
	opTypeDef,
	context,
	provinceContext,
	playerPhases, // null = random mode, array = mission mode
	missionTypes,
}) {
	const key = import.meta.env.VITE_GROQ_KEY;
	if (!key) throw new Error("VITE_GROQ_KEY is not set in environment");

	const isRandom = !playerPhases;

	// ── Build the mission type reference list ─────────────────────────────────
	const missionTypeRef = missionTypes
		.map((m) => `  ${m.id} — ${m.fullLabel} (${m.category})`)
		.join("\n");

	// ── Build player phase instructions (mission mode only) ───────────────────
	const playerPhaseBlock =
		playerPhases ?
			`The player has selected the following phase locations in order. Use these EXACTLY — do not change the province or location names:
${playerPhases
	.map(
		(p) =>
			`  Phase ${p.phaseNumber}${p.isFinal ? " (FINAL)" : ""}: Province "${p.province}", Location "${p.location}"`,
	)
	.join("\n")}

Assign an appropriate missionTypeId from the list above to each phase based on its role in the narrative. The final phase missionTypeId must be one of: ${opTypeDef.finalPhaseTypes.join(", ")}.`
		:	`Choose ${opTypeDef.finalPhaseTypes.length > 1 ? "one of" : ""} [${opTypeDef.finalPhaseTypes.join(", ")}] as the final phase mission type. Build 2–4 build-up phases before it using types from [${opTypeDef.buildupPhaseTypes.join(", ")}]. Choose provinces and locations that make narrative sense — build-up phases should feel like they lead logically to the final phase.`;

	// ── System prompt ─────────────────────────────────────────────────────────
	const systemPrompt = `You are a Ghost Recon Breakpoint special operations mission planner generating a classified operation briefing.

You MUST return ONLY valid JSON — no preamble, no explanation, no markdown, no code blocks.
Every province name and location name you use MUST exactly match a name from the provided list.
Never invent province names or location names.

The operation takes place on Auroa — a technology island controlled by Sentinel Corp and the Wolves faction. Players are Ghost operatives conducting covert and direct action missions. Write narrative in military style — terse, operational, no-nonsense.`;

	// ── User prompt ───────────────────────────────────────────────────────────
	const userPrompt = `Generate a Ghost Recon Breakpoint operation.

OPERATION TYPE: ${opTypeDef.label} (${opType})
PLAYER CONTEXT: ${context || "No context provided — generate a compelling scenario."}
MODE: ${isRandom ? "Full AI generation — choose all provinces and locations." : "Player-defined locations — build narrative around them."}

AVAILABLE MISSION TYPE IDs (use these exactly):
${missionTypeRef}

AVAILABLE PROVINCES AND LOCATIONS:
${provinceContext}

${playerPhaseBlock}

Return this exact JSON structure:
{
  "operationName": "Two-word classified name in all caps e.g. IRON COVENANT",
  "narrative": "2-3 sentence operational backstory. Who is involved, what happened, why this mission matters. Military tone.",
  "opType": "${opType}",
  "phaseCount": <number 3-5>,
  "phases": [
    {
      "phaseIndex": 0,
      "label": "Short phase name e.g. Cold Canvas",
      "province": "<exact province key from list>",
      "location": "<exact location name from list>",
      "missionTypeId": "<exact mission type ID from list>",
      "objective": "One sentence — what the player does in this phase.",
      "minibrief": "2-3 sentences of immersive narrative flavor for this phase. Reference the specific location. Make it feel real.",
      "intelGate": "snake_case label for what this phase produces e.g. witness_statement",
      "isFinal": false
    }
  ]
}

Rules:
- phases array length must equal phaseCount
- Last phase must have isFinal: true
- All other phases must have isFinal: false  
- province and location values must match the provided list EXACTLY (case-sensitive)
- missionTypeId must match a value from the provided list EXACTLY
- Build-up phases should feel like genuine intelligence-gathering steps
- The final phase should feel like the payoff — the actual strike, rescue, or capture
- Each phase objective must connect logically to the next`;

	// ── Groq call ─────────────────────────────────────────────────────────────
	const response = await fetch(GROQ_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${key}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: MODEL,
			max_tokens: 1500,
			temperature: 0.6,
			response_format: { type: "json_object" },
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
		}),
	});

	if (!response.ok) {
		const err = await response.text();
		throw new Error(`Groq API ${response.status}: ${err}`);
	}

	const data = await response.json();
	const raw = data.choices?.[0]?.message?.content?.trim() ?? "";

	// ── Parse and validate ────────────────────────────────────────────────────
	let campaign;
	try {
		campaign = JSON.parse(raw);
	} catch {
		throw new Error("Campaign generation returned invalid JSON. Try again.");
	}

	if (!campaign.phases?.length) {
		throw new Error("Campaign generation returned no phases. Try again.");
	}

	// Validate province + location names against config
	// Import PROVINCES at top of ghostOpsApi.js if not already imported:
	// import { PROVINCES } from "@/config";
	const invalidPhases = campaign.phases.filter((p) => {
		const pd = PROVINCES_AI_CONTEXT[p.province];
		if (!pd) return true;
		const locExists = pd.locations.some(
			(l) => l.name.trim() === p.location.trim(),
		);
		return !locExists;
	});

	if (invalidPhases.length > 0) {
		const details = invalidPhases
			.map((p) => `"${p.province}" / "${p.location}"`)
			.join(", ");
		throw new Error(
			`AI selected invalid province/location combinations: ${details}. Try generating again.`,
		);
	}

	return campaign;
}
