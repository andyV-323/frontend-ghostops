// MissionGenerator.jsx
import { useState, useEffect } from "react";
import { PROVINCES } from "@/config";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { generateInsertionExtractionPoints } from "@/utils/generatePoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faLocationDot,
	faShuffle,
	faListCheck,
	faBolt,
	faSpinner,
	faRobot,
	faMinus,
	faPlus,
	faCrosshairs,
	faSkull,
	faBomb,
	faHandcuffs,
	faTruck,
	faEye,
	faUserSecret,
} from "@fortawesome/free-solid-svg-icons";

// ── Mission types ─────────────────────────────────────────────────────────────
const MISSION_TYPES = [
	{
		id: "Special Reconnaissance",
		abbr: "SR",
		icon: faUserSecret,
		color: "text-indigo-400",
		activeBorder: "border-indigo-400/60",
		activeBg: "bg-indigo-400/8",
	},
	{
		id: "Direct Action",
		abbr: "DA",
		icon: faCrosshairs,
		color: "text-red-400",
		activeBorder: "border-red-400/60",
		activeBg: "bg-red-400/8",
	},
	{
		id: "HVT Elimination",
		abbr: "HVT",
		icon: faSkull,
		color: "text-orange-400",
		activeBorder: "border-orange-400/60",
		activeBg: "bg-orange-400/8",
	},
	{
		id: "Sabotage / Demolition",
		abbr: "SAB",
		icon: faBomb,
		color: "text-amber-400",
		activeBorder: "border-amber-400/60",
		activeBg: "bg-amber-400/8",
	},
	{
		id: "Hostage Rescue",
		abbr: "HR",
		icon: faHandcuffs,
		color: "text-cyan-400",
		activeBorder: "border-cyan-400/60",
		activeBg: "bg-cyan-400/8",
	},
	{
		id: "Convoy Interdiction",
		abbr: "CI",
		icon: faTruck,
		color: "text-violet-400",
		activeBorder: "border-violet-400/60",
		activeBg: "bg-violet-400/8",
	},
	{
		id: "Defensive / Overwatch",
		abbr: "OW",
		icon: faEye,
		color: "text-emerald-400",
		activeBorder: "border-emerald-400/60",
		activeBg: "bg-emerald-400/8",
	},
];

const MISSION_DOCTRINE = {
	"Special Reconnaissance":
		"Covert observation only. No contact. Ghost Protocol in effect. Emphasize stealth, hide site, and silent exfil.",
	"Direct Action":
		"Speed and violence of action. Small element, hard hit, planned exfil before QRF arrives.",
	"HVT Elimination":
		"Surgical strike. Confirm target ID before engagement. Minimize collateral. Clean exfil mandatory.",
	"Sabotage / Demolition":
		"Infrastructure denial. Reach target, place charges, exfil before detonation. Noise acceptable post-breach.",
	"Hostage Rescue":
		"Time critical. Non-combatant present. No fire near HVT. Speed is life.",
	"Convoy Interdiction":
		"Mobile target. Prepare kill zone in advance. Block front and rear. Controlled ambush — no pursuit.",
	"Defensive / Overwatch":
		"Establish overwatch before enemy movement. Priority is observation and early warning. Engage on order only.",
};

const INFIL_OPTIONS = [
	"HALO jump (high altitude, avoids radar and visual detection)",
	"LALO parachute (low altitude, terrain masking, short exposure window)",
	"Helicopter fast rope (medium altitude insert, higher acoustic signature)",
	"Small bird assault insert (quick low-signature insert, limited personnel)",
	"Boat / water insertion (coastal or river approach, silent at low speed)",
	"Ground vehicle (road approach, high signature, speed advantage)",
	"On foot (zero signature, slow — best for short distances)",
];

// ── Compromise chip colors ────────────────────────────────────────────────────
const COMPROMISE_CHIP = {
	cold: {
		label: "COLD",
		color: "text-emerald-400",
		border: "border-emerald-400/50",
		bg: "bg-emerald-400/10",
	},
	warm: {
		label: "WARM",
		color: "text-amber-400",
		border: "border-amber-400/50",
		bg: "bg-amber-400/10",
	},
	engaged: {
		label: "HOT",
		color: "text-orange-400",
		border: "border-orange-400/50",
		bg: "bg-orange-400/10",
	},
	engaged_exfil: {
		label: "HOT",
		color: "text-orange-400",
		border: "border-orange-400/50",
		bg: "bg-orange-400/10",
	},
	burned: {
		label: "BURNED",
		color: "text-red-400",
		border: "border-red-400/50",
		bg: "bg-red-400/10",
	},
};

// ── Prompt builder ────────────────────────────────────────────────────────────
const buildGroqMessages = ({
	selectedProvince,
	pd,
	locations,
	missionType,
	recon,
}) => {
	const isSR = missionType === "Special Reconnaissance";

	const locationBlock = locations
		.map(
			(l, i) =>
				`  OBJ-${String(i + 1).padStart(2, "0")}: ${l.name}\n  Intel: ${l.description}`,
		)
		.join("\n\n");

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
RECON INTELLIGENCE — apply as hard rules:
  Compromise: ${(m.compromiseBadge || "unknown").toUpperCase()}
  Enemy State: ${m.enemyState || "Unknown"}
  Intel Confidence: ${m.intelAccuracy ?? "?"}%
  Authorized Windows: ${windows}

ASSET STATUS — state each as a hard rule in the ASSET STATUS section:
  UAS / TacMap: ${m.UAS ? "ONLINE" : "OFFLINE — no tactical map"}
  Cross-Com HUD: ${m.crossCom ? "ONLINE" : "OFFLINE"}
  Armaros Drone: ${m.armarosDrone ? "AVAILABLE" : "OFFLINE — do not call in"}
  Strike Designator: ${m.strikeDesignator ? "AVAILABLE" : "OFFLINE — no fire support"}
  Vehicle Insertion: ${m.vehicleInsertion ? "AUTHORIZED" : "DENIED — foot infiltration only"}
  Suppressors: ${m.suppressorsAvailable ? "REQUIRED — maintain noise discipline" : "IRRELEVANT — go loud"}
  Teammate Abilities: ${m.teammateAbilities ? "ACTIVE" : "OFFLINE"}
  Authorized Windows: ${windows}`;
	}

	const sections = [
		recon ? "ASSET STATUS" : null,
		"MISSION INTENT",
		"INFILTRATION",
		"GEAR",
		isSR ? null : "LOADOUT",
		"RULES OF ENGAGEMENT",
		"COMMANDER'S INTENT",
	]
		.filter(Boolean)
		.join(", ");

	const system = `You are a Ghost Recon special operations mission planner producing pre-mission packages for Auroa island. \
Output is read by a player before loading into the game. Be concise, tactical, specific to the location intel. \
Total output under 220 words. Use ALL CAPS section labels followed by a colon and newline. \
No markdown # headers. No bullet point dashes. Reference location names directly. \
${recon ? "State recon asset availability as hard rules in ASSET STATUS." : ""} \
${isSR ? "SR mission: emphasize stealth, no-contact doctrine, covert exfil. No LOADOUT section." : ""}`;

	const user = `OPERATION: ${selectedProvince} — ${missionType}
DOCTRINE: ${MISSION_DOCTRINE[missionType]}
PROVINCE: ${selectedProvince} | BIOME: ${pd.biome}
TARGET LOCATIONS:
${locationBlock}

AVAILABLE INFILTRATION METHODS (choose best primary + contingency):
${INFIL_OPTIONS.map((o) => `  ${o}`).join("\n")}
${reconBlock}

Generate Ghost Protocol Package. Sections in this exact order: ${sections}.
GEAR: clothing for ${pd.biome} biome — headgear, top, bottom, boots, camo color/pattern. Only what matters for this mission.
${!isSR ? `LOADOUT: generic weapon types based on mission type and environment (no specific gun model names).` : ""}
${!recon ? "\nEnd with: // No recon data — cold assumptions applied." : ""}`;

	return [
		{ role: "system", content: system },
		{ role: "user", content: user },
	];
};

// ── Sub-components ────────────────────────────────────────────────────────────
function HudSelect({ label, value, onChange, children }) {
	return (
		<div className='flex flex-col gap-1'>
			<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
				{label}
			</span>
			<div className='relative'>
				<select
					value={value}
					onChange={onChange}
					className='w-full appearance-none bg-blk/60 border border-lines/25 hover:border-lines/50 focus:border-btn/60 focus:outline-none rounded-sm px-3 py-2 font-mono text-[11px] text-fontz/80 cursor-pointer transition-colors'>
					{children}
				</select>
				<div className='absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none'>
					<div className='w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-lines/30' />
				</div>
			</div>
		</div>
	);
}

function ActionBtn({
	onClick,
	disabled,
	loading,
	icon,
	label,
	variant = "default",
	wide = false,
}) {
	const variants = {
		default:
			"text-btn border-btn/35 bg-btn/8 hover:bg-btn/18 hover:border-btn/60",
		primary: "text-blk border-btn bg-btn hover:bg-highlight",
		ai: "text-purple-300 border-purple-500/40 bg-purple-900/10 hover:bg-purple-900/20 hover:border-purple-500/60",
		muted: "text-lines/20 border-lines/10 bg-transparent cursor-not-allowed",
	};
	return (
		<button
			onClick={onClick}
			disabled={disabled || loading}
			className={[
				"flex items-center justify-center gap-2 border rounded-sm font-mono text-[10px] tracking-widest uppercase transition-all py-2",
				wide ? "w-full px-4" : "px-3",
				disabled || loading ? variants.muted : variants[variant],
			].join(" ")}>
			{loading ?
				<FontAwesomeIcon
					icon={faSpinner}
					className='animate-spin text-[10px]'
				/>
			:	icon && (
					<FontAwesomeIcon
						icon={icon}
						className='text-[10px]'
					/>
				)
			}
			{label}
		</button>
	);
}

function MissionTypeGrid({ value, onChange }) {
	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex items-center gap-2'>
				<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
					Mission Type
				</span>
				<div className='flex-1 h-px bg-lines/10' />
			</div>
			<div className='grid grid-cols-4 gap-1'>
				{MISSION_TYPES.map((t) => {
					const active = value === t.id;
					return (
						<button
							key={t.id}
							onClick={() => onChange(active ? "" : t.id)}
							title={t.id}
							className={[
								"flex flex-col items-center gap-1 py-2 px-1 border rounded-sm transition-all",
								active ?
									`${t.activeBorder} ${t.activeBg}`
								:	"border-lines/15 hover:border-lines/30",
							].join(" ")}>
							<FontAwesomeIcon
								icon={t.icon}
								className={`text-[11px] ${active ? t.color : "text-lines/25"}`}
							/>
							<span
								className={`font-mono text-[8px] tracking-widest ${active ? t.color : "text-lines/30"}`}>
								{t.abbr}
							</span>
						</button>
					);
				})}
			</div>
			{value && (
				<span className='font-mono text-[8px] text-lines/40 italic'>
					{value}
				</span>
			)}
		</div>
	);
}

function ReconChips({ reports, selectedId, onSelect }) {
	if (!reports?.length) {
		return (
			<div className='flex flex-col gap-1'>
				<div className='flex items-center gap-2'>
					<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
						Recon Intel
					</span>
					<div className='flex-1 h-px bg-lines/10' />
				</div>
				<span className='font-mono text-[8px] text-lines/20 italic'>
					No recon on file — briefing runs cold
				</span>
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex items-center gap-2'>
				<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
					Recon Intel
				</span>
				<div className='flex-1 h-px bg-lines/10' />
				<span className='font-mono text-[7px] text-lines/25 uppercase tracking-widest'>
					tap to apply
				</span>
			</div>
			<div className='flex flex-wrap gap-1.5'>
				<button
					onClick={() => onSelect(null)}
					className={[
						"font-mono text-[8px] tracking-widest px-2.5 py-1 border rounded-sm transition-all",
						selectedId === null ?
							"border-lines/35 bg-lines/8 text-lines/55"
						:	"border-lines/15 text-lines/25 hover:border-lines/30 hover:text-lines/40",
					].join(" ")}>
					NONE
				</button>
				{[...reports].reverse().map((r, i) => {
					const origIdx = reports.length - 1 - i;
					const id = r._id ?? origIdx;
					const m = r.modifiers || {};
					const meta =
						COMPROMISE_CHIP[m.compromiseBadge] || COMPROMISE_CHIP.cold;
					const intel = m.intelAccuracy != null ? `${m.intelAccuracy}%` : "—";
					const active = selectedId === id;
					return (
						<button
							key={String(id)}
							onClick={() => onSelect(active ? null : id)}
							className={[
								"font-mono text-[8px] tracking-widest px-2.5 py-1 border rounded-sm transition-all",
								active ?
									`${meta.border} ${meta.bg} ${meta.color}`
								:	`border-lines/15 text-lines/30 hover:${meta.border} hover:${meta.color}`,
							].join(" ")}>
							{meta.label} // {intel}
						</button>
					);
				})}
			</div>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// MISSION GENERATOR
// ═══════════════════════════════════════════════════════════════
function MissionGenerator({
	onGenerateRandomOps,
	onGenerateOps,
	onGenerateAIMission,
	setMapBounds,
	setImgURL,
	setMissionBriefing,
	setInfilPoint,
	setExfilPoint,
	setFallbackExfil,
	reconReports,
}) {
	const [selectedProvince, setSelectedProvince] = useState("");
	const [selectedLocations, setSelectedLocations] = useState([]);
	const [numberOfLocations, setNumberOfLocations] = useState(1);
	const [randomSelection, setRandomSelection] = useState([]);
	const [generationMode, setGenerationMode] = useState("random");
	const [missionType, setMissionType] = useState("");
	const [selectedReconId, setSelectedReconId] = useState(null);
	const [missionGenerated, setMissionGenerated] = useState(false);
	const [loading, setLoading] = useState(false);
	const [aiLoading, setAiLoading] = useState(false);

	const provinces = Object.keys(PROVINCES);
	const locationsInProvince =
		selectedProvince ? PROVINCES[selectedProvince].locations : [];
	const allProvinceCoords =
		selectedProvince ? locationsInProvince.map((l) => l.coordinates) : [];

	useEffect(() => {
		setSelectedLocations([]);
		setRandomSelection([]);
		setMissionGenerated(false);
		setMapBounds(null);
		setImgURL("");
		setInfilPoint(null);
		setExfilPoint(null);
		setFallbackExfil(null);
		setMissionBriefing("");
	}, [generationMode, selectedProvince]);

	const generateRandomOps = async () => {
		if (!selectedProvince) {
			toast.warn("Select a province.");
			throw new Error("Invalid");
		}
		const pd = PROVINCES[selectedProvince];
		const shuffled = [...pd.locations].sort(() => Math.random() - 0.5);
		const ops = shuffled.slice(0, Math.min(numberOfLocations, shuffled.length));
		onGenerateRandomOps({
			selectedProvince,
			allProvinceCoordinates: allProvinceCoords,
			bounds: pd.coordinates.bounds,
			coordinates: ops.map((l) => l.coordinates),
			randomSelection: ops,
			imgURL: pd.imgURL,
			biome: pd.biome,
		});
		setRandomSelection(ops);
		return ops;
	};

	const generateOps = async () => {
		if (!selectedProvince || selectedLocations.length === 0) {
			toast.error("Select a province and at least one location.");
			return;
		}
		const pd = PROVINCES[selectedProvince];
		const valid = selectedLocations
			.map((n) => pd.locations.find((l) => l.name === n))
			.filter((l) => l?.coordinates);
		if (!valid.length) {
			toast.error("Invalid locations selected.");
			return;
		}
		onGenerateOps({
			selectedProvince,
			allProvinceCoordinates: allProvinceCoords,
			bounds: pd.coordinates.bounds,
			coordinates: valid.map((l) => l.coordinates),
			randomSelection: valid,
			imgURL: pd.imgURL,
			biome: pd.biome,
		});
	};

	const generateNonAIPoints = (pickedLocations = null) => {
		if (!selectedProvince) return;
		const pd = PROVINCES[selectedProvince];
		let coords = [];
		if (pickedLocations?.length)
			coords = pickedLocations.map((l) => l.coordinates);
		else if (randomSelection.length)
			coords = randomSelection.map((l) => l.coordinates);
		else
			coords = selectedLocations
				.map((n) => pd.locations.find((l) => l.name === n))
				.filter(Boolean)
				.map((l) => l.coordinates);
		if (!coords.length) return;
		try {
			const pts = generateInsertionExtractionPoints({
				bounds: pd.coordinates.bounds,
				missionCoordinates: coords,
				allProvinceCoordinates: allProvinceCoords,
				maxAttempts: 20000,
			});
			setInfilPoint(pts.infilPoint);
			setExfilPoint(pts.exfilPoint);
			setFallbackExfil(pts.fallbackExfil);
		} catch (err) {
			toast.error(err.message || "Failed to generate points.");
		}
	};

	const handleGenerateMission = async () => {
		setLoading(true);
		setMissionGenerated(false);
		setMapBounds(null);
		setImgURL("");
		setInfilPoint(null);
		setExfilPoint(null);
		setFallbackExfil(null);
		try {
			if (generationMode === "random") {
				const ops = await generateRandomOps();
				generateNonAIPoints(ops);
			} else {
				await generateOps();
				generateNonAIPoints();
			}
			setMissionGenerated(true);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const handleGenerateAIBriefing = async () => {
		if (!selectedProvince || !missionType || !missionGenerated) return;
		setAiLoading(true);
		try {
			const pd = PROVINCES[selectedProvince];
			const locations =
				generationMode === "random" ? randomSelection : (
					selectedLocations
						.map((n) => pd.locations.find((l) => l.name === n))
						.filter(Boolean)
				);

			const recon =
				selectedReconId != null ?
					((reconReports || []).find(
						(r, i) => (r._id ?? i) === selectedReconId,
					) ?? null)
				:	null;

			const key = import.meta.env.VITE_GROQ_KEY;
			if (!key) throw new Error("VITE_GROQ_KEY is not set");

			const messages = buildGroqMessages({
				selectedProvince,
				pd,
				locations:
					locations.length ? locations : (
						[
							{
								name: "Primary Objective",
								description: "No location intel on file.",
							},
						]
					),
				missionType,
				recon,
			});

			const response = await fetch(
				"https://api.groq.com/openai/v1/chat/completions",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${key}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						model: "llama-3.3-70b-versatile",
						max_tokens: 450,
						temperature: 0.65,
						messages,
					}),
				},
			);

			if (!response.ok)
				throw new Error(`Groq ${response.status}: ${await response.text()}`);

			const data = await response.json();
			const briefing = data.choices?.[0]?.message?.content ?? "";
			if (!briefing) {
				toast.error("AI response was empty.");
				return;
			}

			onGenerateAIMission({ briefing: briefing.replace(/```/g, "").trim() });
			toast.success("Ghost Protocol Package generated.");
		} catch (err) {
			console.error(err);
			toast.error(err.message || "Failed to generate briefing.");
		} finally {
			setAiLoading(false);
		}
	};

	const aiDisabled = !missionGenerated || !missionType;
	const aiLabel =
		!missionGenerated ? "Generate Mission First"
		: !missionType ? "Select Mission Type"
		: "Generate AI Briefing";

	return (
		<div className='flex flex-col gap-4 h-full'>
			{/* Mode toggle */}
			<div className='flex gap-0 border border-lines/20 rounded-sm overflow-hidden shrink-0'>
				{[
					{ id: "random", icon: faShuffle, label: "Random" },
					{ id: "ops", icon: faListCheck, label: "Mission" },
				].map((m) => {
					const active = generationMode === m.id;
					return (
						<button
							key={m.id}
							onClick={() => setGenerationMode(m.id)}
							className={[
								"flex-1 flex items-center justify-center gap-2 py-2 font-mono text-[10px] tracking-widest uppercase transition-all",
								active ? "bg-btn/20 text-btn" : (
									"text-lines/35 hover:text-fontz hover:bg-white/[0.03]"
								),
							].join(" ")}>
							<FontAwesomeIcon
								icon={m.icon}
								className='text-[9px]'
							/>
							{m.label}
						</button>
					);
				})}
			</div>

			{/* Scrollable form */}
			<div className='flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto'>
				<HudSelect
					label='Province'
					value={selectedProvince}
					onChange={(e) => {
						setSelectedProvince(e.target.value);
						setSelectedLocations([]);
					}}>
					<option value=''>— Select Province —</option>
					{provinces.map((p) => (
						<option
							key={p}
							value={p}>
							{p}
						</option>
					))}
				</HudSelect>

				{generationMode === "random" && selectedProvince && (
					<div className='flex flex-col gap-1'>
						<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
							Locations
						</span>
						<div className='flex items-center gap-0 border border-lines/25 rounded-sm overflow-hidden w-32'>
							<button
								onClick={() => setNumberOfLocations((n) => Math.max(1, n - 1))}
								className='w-9 h-9 flex items-center justify-center text-lines/40 hover:text-btn hover:bg-btn/10 transition-colors border-r border-lines/20'>
								<FontAwesomeIcon
									icon={faMinus}
									className='text-[9px]'
								/>
							</button>
							<span className='flex-1 text-center font-mono text-xs text-fontz tabular-nums'>
								{numberOfLocations}
							</span>
							<button
								onClick={() => setNumberOfLocations((n) => n + 1)}
								className='w-9 h-9 flex items-center justify-center text-lines/40 hover:text-btn hover:bg-btn/10 transition-colors border-l border-lines/20'>
								<FontAwesomeIcon
									icon={faPlus}
									className='text-[9px]'
								/>
							</button>
						</div>
					</div>
				)}

				{generationMode === "ops" &&
					selectedProvince &&
					locationsInProvince.length > 0 && (
						<div className='flex flex-col gap-1'>
							<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
								Locations{" "}
								<span className='text-btn ml-1'>
									{selectedLocations.length} selected
								</span>
							</span>
							<div className='flex flex-col gap-0.5 max-h-36 overflow-y-auto border border-lines/15 rounded-sm bg-blk/40 p-1'>
								{locationsInProvince.map((loc) => {
									const checked = selectedLocations.includes(loc.name);
									return (
										<label
											key={loc.name}
											className={[
												"flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm cursor-pointer transition-colors",
												checked ?
													"bg-btn/10 border border-btn/20"
												:	"hover:bg-white/[0.03] border border-transparent",
											].join(" ")}>
											<span
												className={[
													"w-3 h-3 border rounded-sm shrink-0 flex items-center justify-center transition-colors",
													checked ? "bg-btn border-btn" : (
														"border-lines/30 bg-transparent"
													),
												].join(" ")}>
												{checked && (
													<span className='w-1.5 h-1 border-b border-r border-blk rotate-45 -translate-y-px' />
												)}
											</span>
											<input
												type='checkbox'
												className='sr-only'
												value={loc.name}
												checked={checked}
												onChange={(e) =>
													setSelectedLocations(
														e.target.checked ?
															[...selectedLocations, loc.name]
														:	selectedLocations.filter((l) => l !== loc.name),
													)
												}
											/>
											<span className='font-mono text-[10px] text-fontz/70'>
												<FontAwesomeIcon
													icon={faLocationDot}
													className='text-lines/25 mr-1.5 text-[8px]'
												/>
												{loc.name}
											</span>
										</label>
									);
								})}
							</div>
						</div>
					)}

				{/* Mission type — shown when province is selected */}
				{selectedProvince && (
					<MissionTypeGrid
						value={missionType}
						onChange={setMissionType}
					/>
				)}

				{/* ── Recon chips — unlocked after mission generates ── */}
				{missionGenerated && (
					<>
						<div className='flex items-center gap-2'>
							<div className='flex-1 h-px bg-lines/12' />
							<span className='font-mono text-[7px] tracking-[0.3em] text-lines/20 uppercase'>
								Phase 2 Intel
							</span>
							<div className='flex-1 h-px bg-lines/12' />
						</div>
						<ReconChips
							reports={reconReports}
							selectedId={selectedReconId}
							onSelect={setSelectedReconId}
						/>
					</>
				)}
			</div>

			{/* Buttons */}
			<div className='flex flex-col gap-2 shrink-0'>
				<ActionBtn
					onClick={handleGenerateMission}
					loading={loading}
					disabled={!selectedProvince}
					icon={faBolt}
					label='Generate Mission'
					variant='primary'
					wide
				/>
				{missionGenerated && (
					<ActionBtn
						onClick={handleGenerateAIBriefing}
						loading={aiLoading}
						disabled={aiDisabled}
						icon={faRobot}
						label={aiLabel}
						variant={aiDisabled ? "muted" : "ai"}
						wide
					/>
				)}
			</div>
		</div>
	);
}

HudSelect.propTypes = {
	label: PropTypes.string,
	value: PropTypes.string,
	onChange: PropTypes.func,
	children: PropTypes.node,
};
ActionBtn.propTypes = {
	onClick: PropTypes.func,
	disabled: PropTypes.bool,
	loading: PropTypes.bool,
	icon: PropTypes.object,
	label: PropTypes.string,
	variant: PropTypes.string,
	wide: PropTypes.bool,
};
MissionTypeGrid.propTypes = {
	value: PropTypes.string,
	onChange: PropTypes.func.isRequired,
};
ReconChips.propTypes = {
	reports: PropTypes.array,
	selectedId: PropTypes.any,
	onSelect: PropTypes.func.isRequired,
};
MissionGenerator.propTypes = {
	onGenerateRandomOps: PropTypes.func.isRequired,
	onGenerateOps: PropTypes.func.isRequired,
	onGenerateAIMission: PropTypes.func.isRequired,
	setMapBounds: PropTypes.func.isRequired,
	setImgURL: PropTypes.func.isRequired,
	setInfilPoint: PropTypes.func.isRequired,
	setExfilPoint: PropTypes.func.isRequired,
	setFallbackExfil: PropTypes.func.isRequired,
	setMissionBriefing: PropTypes.func.isRequired,
	reconReports: PropTypes.array,
};

export default MissionGenerator;
