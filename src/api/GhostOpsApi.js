// src/api/ghostOpsApi.js
// Replaces chatGPTApi.js — Groq inference, streaming, typed features.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are a Ghost Recon special operations mission planner producing \
pre-mission packages for Auroa island operations. Your output is read by a player who wants \
to know exactly what to do before loading into the game — gear to wear, how to get in, what \
weapons to bring, and what rules apply. Be concise, tactical, and specific to the location \
intel provided. Total output must stay under 220 words. Never use markdown # symbols or \
bullet points with dashes. Use ALL CAPS section labels followed by a colon and a newline. \
Reference location names and operation names directly in your reasoning. When recon modifiers \
are provided, state asset availability as hard rules before all other sections. When no recon \
data is provided, note cold assumptions at the end.`;

const INFIL_OPTIONS = [
	"HALO jump (high altitude, low opening — avoids radar and visual detection)",
	"LALO parachute (low altitude, low opening — terrain masking, shorter exposure)",
	"Helicopter fast rope (medium insert, higher acoustic signature)",
	"Small bird assault insert (quick low-signature insert, limited personnel)",
	"Boat / water insertion (coastal or river approach, silent at low speed)",
	"Ground vehicle (road approach, high signature, speed advantage)",
	"On foot (zero signature, slow — best for short distances or compromised routes)",
];

const MISSION_DOCTRINE = {
	"Direct Action":
		"Speed and violence of action. Small element, hard hit, planned exfil before QRF arrives. Noise is acceptable.",
	"HVT Elimination":
		"Surgical strike. Confirm target ID before engagement. Minimize collateral. Clean exfil is mandatory.",
	"Sabotage / Demolition":
		"Infrastructure denial. Reach the target, place charges, exfil before detonation window. Noise acceptable post-breach.",
	"Hostage Rescue":
		"Time critical. Non-combatant present. Suppress all fire near HVT location. Speed is life — do not hold position.",
	"Convoy Interdiction":
		"Mobile target. Prepare kill zone in advance. Block front and rear simultaneously. Controlled ambush — no pursuit.",
	"Defensive / Overwatch":
		"Establish overwatch position before enemy movement. Priority is observation and early warning. Engage only on order.",
};

// ── Build the user message ────────────────────────────────────────────────────
const buildPackageMessage = ({
	missionName,
	province,
	biome,
	locations,
	missionType,
	recon,
}) => {
	const locationBlock = locations
		.map(
			(l, i) =>
				`  OBJ-${String(i + 1).padStart(2, "0")}: ${l.name}\n  Intel: ${l.description}`,
		)
		.join("\n\n");

	const doctrine =
		MISSION_DOCTRINE[missionType] ||
		"Execute mission objectives per commander's guidance.";

	let reconBlock = "";
	if (recon) {
		const authorizedWindows =
			recon.launchWindows ?
				Object.values(recon.launchWindows)
					.filter((w) => w.authorized)
					.map((w) => w.label)
					.join(", ") || "NONE"
			:	"UNKNOWN";

		reconBlock = `
RECON INTELLIGENCE — apply these as hard rules, do not override:
  Compromise: ${recon.compromiseBadge?.toUpperCase()}
  Enemy State: ${recon.enemyState}
  Intel Confidence: ${recon.intelAccuracy}%
  Mission Difficulty: ${recon.difficulty}
  Authorized Launch Windows: ${authorizedWindows}

ASSET STATUS — state each exactly as written in the ASSET STATUS section:
  UAS / TacMap: ${recon.UAS ? "ONLINE" : "OFFLINE — no tactical map"}
  Cross-Com HUD: ${recon.crossCom ? "ONLINE" : "OFFLINE"}
  Armaros Drone: ${recon.armarosDrone ? "AVAILABLE" : "OFFLINE — do not call in"}
  Strike Designator: ${recon.strikeDesignator ? "AVAILABLE" : "OFFLINE — no fire support"}
  Vehicle Insertion: ${recon.vehicleInsertion ? "AUTHORIZED" : "DENIED — foot infiltration only"}
  Suppressors: ${recon.suppressorsAvailable ? "REQUIRED — maintain noise discipline" : "IRRELEVANT — go loud"}
  Teammate Abilities: ${recon.teammateAbilities ? "ACTIVE" : "OFFLINE — solo execution only"}
`;
	}

	const sections =
		recon ?
			"ASSET STATUS, MISSION INTENT, INFILTRATION, GEAR, LOADOUT, RULES OF ENGAGEMENT, COMMANDER'S INTENT"
		:	"MISSION INTENT, INFILTRATION, GEAR, LOADOUT, RULES OF ENGAGEMENT, COMMANDER'S INTENT";

	return `OPERATION: ${missionName}
MISSION TYPE: ${missionType}
DOCTRINE: ${doctrine}

AREA OF OPERATIONS:
  Province: ${province}
  Biome: ${biome}

TARGET LOCATIONS:
${locationBlock}

AVAILABLE INFILTRATION METHODS — choose one primary and one contingency:
${INFIL_OPTIONS.map((m) => `  ${m}`).join("\n")}
${reconBlock}
Generate a Ghost Protocol Package. Sections in this exact order: ${sections}.
For GEAR: recommend clothing appropriate for the biome — headgear, top, bottom, boots, camo color. Only include what matters for this specific mission and environment.
For LOADOUT: recommend generic weapon types (not specific gun names) based on mission type and location.
${!recon ? "End with one line: // No recon data — cold assumptions applied. Run Phase 1 before insertion." : ""}`;
};

// ── Streaming export — yields text deltas ─────────────────────────────────────
export async function* streamGhostPackage(params) {
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
			max_tokens: 420,
			temperature: 0.65,
			stream: true,
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

	const reader = response.body.getReader();
	const decoder = new TextDecoder();

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		const lines = decoder.decode(value, { stream: true }).split("\n");
		for (const line of lines) {
			if (!line.startsWith("data: ")) continue;
			const payload = line.slice(6).trim();
			if (payload === "[DONE]") return;
			try {
				const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
				if (delta) yield delta;
			} catch {
				// skip malformed chunks
			}
		}
	}
}

// ── Team assignment — non-streaming, kept for existing feature ────────────────
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

	const content = `Select the best 2–4 operators for this mission. For each chosen operator write one line: CALLSIGN — one sentence justification referencing their class or role. Keep total output under 120 words.

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
