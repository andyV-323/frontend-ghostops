// ─────────────────────────────────────────────────────────────────────────────
// AIMissionGenerator.jsx
// AI-powered mission generation — single Groq call produces a full phase chain.
//
// Sub-modes:
//   ai-random  — province + op type + optional context. AI picks locations + phases.
//   ai-mission — province + op type + player-chosen locations. AI builds narrative.
//
// Single province per operation — keeps Groq prompt under token limits.
// Zero additional Groq calls after initial generation.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { PROVINCES, PROVINCES_AI_CONTEXT, PROVINCE_TERRAIN } from "@/config";
import { MISSION_TYPES, generateCampaign } from "@/api/GhostOpsApi";
import { GeneratePointsOnMap } from "@/utils/GeneratePointsOnMap";
import { generateBriefing } from "@/utils/BriefingGenerator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faBolt,
	faSpinner,
	faShuffle,
	faListCheck,
	faPlus,
	faTrash,
	faBrain,
	faCrosshairs,
	faSkull,
	faBomb,
	faHandcuffs,
	faTruck,
	faEye,
	faUserSecret,
	faHandsBound,
} from "@fortawesome/free-solid-svg-icons";

const ICON_MAP = {
	faCrosshairs,
	faSkull,
	faBomb,
	faHandcuffs,
	faTruck,
	faEye,
	faUserSecret,
	faHandsBound,
	faBolt,
	faListCheck,
	faShuffle,
};

const resolveIcon = (key) => ICON_MAP[key] ?? faCrosshairs;

// ── Operation types ───────────────────────────────────────────────────────────

export const OPERATION_TYPES = [
	{
		id: "rescue",
		label: "Personnel Recovery",
		abbr: "RECOV",
		description: "Locate and recover a missing or captured individual.",
		finalPhaseTypes: ["CT_HOSTAGE", "CT_RECOVERY"],
		buildupPhaseTypes: ["SR_POINT", "SR_AREA", "DA_SNATCH"],
	},
	{
		id: "hvt_hunt",
		label: "HVT Hunt",
		abbr: "HVT",
		description: "Locate and eliminate or capture a high-value target.",
		finalPhaseTypes: ["DA_ELIMINATION", "DA_SNATCH"],
		buildupPhaseTypes: ["SR_POINT", "SR_AREA", "SR_BDA"],
	},
	{
		id: "direct_action",
		label: "Direct Action",
		abbr: "DA",
		description: "Raid, sabotage, or destroy a specific target.",
		finalPhaseTypes: ["DA_RAID", "DA_SABOTAGE", "DA_STRIKE"],
		buildupPhaseTypes: ["SR_AREA", "SR_POINT", "OW_OVERWATCH"],
	},
	{
		id: "intel_gathering",
		label: "Intel Gathering",
		abbr: "INTEL",
		description: "Develop full intelligence picture of an area or target.",
		finalPhaseTypes: ["SR_BDA", "SR_POINT"],
		buildupPhaseTypes: ["SR_AREA", "SR_POINT", "OW_OVERWATCH"],
	},
	{
		id: "convoy_interdiction",
		label: "Convoy Interdiction",
		abbr: "CI",
		description: "Intercept and destroy an enemy logistics convoy.",
		finalPhaseTypes: ["DA_CONVOY", "DA_AMBUSH"],
		buildupPhaseTypes: ["SR_AREA", "OW_OVERWATCH", "SR_POINT"],
	},
	{
		id: "sabotage",
		label: "Sabotage",
		abbr: "SAB",
		description: "Infiltrate and destroy critical enemy infrastructure.",
		finalPhaseTypes: ["DA_SABOTAGE", "DA_STRIKE"],
		buildupPhaseTypes: ["SR_POINT", "SR_AREA", "DA_RAID"],
	},
];

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
			: icon ?
				<FontAwesomeIcon
					icon={icon}
					className='text-[10px]'
				/>
			:	null}
			{label}
		</button>
	);
}

function OpTypeSelector({ value, onChange }) {
	return (
		<div className='flex flex-col gap-1.5'>
			<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
				Operation Type
			</span>
			<div className='grid grid-cols-2 gap-1'>
				{OPERATION_TYPES.map((op) => {
					const active = value === op.id;
					return (
						<button
							key={op.id}
							onClick={() => onChange(active ? "" : op.id)}
							className={[
								"flex flex-col gap-0.5 p-2 border rounded-sm text-left transition-all",
								active ?
									"border-btn/50 bg-btn/10"
								:	"border-lines/15 hover:border-lines/30",
							].join(" ")}>
							<span
								className={`font-mono text-[9px] tracking-widest uppercase ${active ? "text-btn" : "text-lines/40"}`}>
								{op.abbr}
							</span>
							<span
								className={`font-mono text-[10px] ${active ? "text-fontz" : "text-fontz/50"}`}>
								{op.label}
							</span>
						</button>
					);
				})}
			</div>
			{value && (
				<span className='font-mono text-[8px] text-lines/35 italic'>
					{OPERATION_TYPES.find((o) => o.id === value)?.description}
				</span>
			)}
		</div>
	);
}

// ── Phase location row — location only, province locked at top level ──────────

function PhaseLocationRow({
	phaseIndex,
	location,
	onChange,
	onRemove,
	isFinal,
	provinceLocations,
}) {
	return (
		<div
			className={[
				"flex flex-col gap-1.5 p-2 border rounded-sm",
				isFinal ?
					"border-red-400/30 bg-red-400/5"
				:	"border-lines/15 bg-blk/30",
			].join(" ")}>
			<div className='flex items-center justify-between'>
				<span
					className={`font-mono text-[8px] tracking-widest uppercase ${isFinal ? "text-red-400/60" : "text-lines/35"}`}>
					{isFinal ? "Final Phase" : `Phase ${phaseIndex + 1}`}
				</span>
				{!isFinal && (
					<button
						onClick={onRemove}
						className='text-lines/25 hover:text-red-400/60 transition-colors'>
						<FontAwesomeIcon
							icon={faTrash}
							className='text-[9px]'
						/>
					</button>
				)}
			</div>
			<div className='relative'>
				<select
					value={location}
					onChange={(e) => onChange(e.target.value)}
					className='w-full appearance-none bg-blk/60 border border-lines/20 hover:border-lines/40 focus:border-btn/50 focus:outline-none rounded-sm px-2.5 py-1.5 font-mono text-[10px] text-fontz/70 cursor-pointer transition-colors'>
					<option value=''>— Location —</option>
					{provinceLocations.map((loc) => (
						<option
							key={loc.name}
							value={loc.name}>
							{loc.name}
						</option>
					))}
				</select>
				<div className='absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none'>
					<div className='w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-lines/25' />
				</div>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AIMissionGenerator({
	onGenerateAI,
	setMapBounds,
	setImgURL,
}) {
	// ── State — all at top level ──────────────────────────────────────────────
	const [aiSubMode, setAiSubMode] = useState("ai-random");
	const [selectedProvince, setSelectedProvince] = useState("");
	const [opType, setOpType] = useState("");
	const [context, setContext] = useState("");
	const [loading, setLoading] = useState(false);
	const [missionPhases, setMissionPhases] = useState([
		{ location: "" },
		{ location: "" },
	]);

	// ── Derived ───────────────────────────────────────────────────────────────
	const provinceKeys = Object.keys(PROVINCES_AI_CONTEXT);

	// Full location objects for province — used in phase row dropdowns
	const provinceLocations =
		selectedProvince ? (PROVINCES[selectedProvince]?.locations ?? []) : [];

	// ── Province change — reset phases ───────────────────────────────────────
	const handleProvinceChange = (province) => {
		setSelectedProvince(province);
		setMissionPhases([{ location: "" }, { location: "" }]);
	};

	// ── Phase helpers ─────────────────────────────────────────────────────────
	const addPhase = () => {
		setMissionPhases((prev) => {
			const withoutFinal = prev.slice(0, -1);
			const final = prev[prev.length - 1];
			return [...withoutFinal, { location: "" }, final];
		});
	};

	const removePhase = (index) => {
		setMissionPhases((prev) => prev.filter((_, i) => i !== index));
	};

	const updatePhaseLocation = (index, location) => {
		setMissionPhases((prev) =>
			prev.map((p, i) => (i === index ? { location } : p)),
		);
	};

	// ── Validation ────────────────────────────────────────────────────────────
	const canGenerate = () => {
		if (!opType || !selectedProvince) return false;
		if (aiSubMode === "ai-mission") {
			return missionPhases.every((p) => p.location);
		}
		return true;
	};

	// ── Province context for Groq — single province, lean format ─────────────
	const buildProvinceContext = (provinceKey) => {
		const data = PROVINCES_AI_CONTEXT[provinceKey];
		if (!data) return "";
		const locs = data.locations
			.map((l) => `  - ${l.name}: ${l.desc}`)
			.join("\n");
		return `${provinceKey} (${data.biome}):\n${locs}`;
	};

	// ── Process Groq phases → full payloads ───────────────────────────────────
	const processCampaignPhases = (campaignJSON) => {
		return campaignJSON.phases.map((phase, index) => {
			const provinceKey = phase.province;

			// ← Always use full PROVINCES — has coordinates, bounds, imgURL
			const pd = PROVINCES[provinceKey];
			const terrain = PROVINCE_TERRAIN?.[provinceKey] ?? null;

			if (!pd) {
				console.warn(`AI returned unknown province: ${provinceKey}`);
				return { ...phase, error: "Province not found" };
			}

			// ← Trim both sides — PROVINCES has trailing spaces on some names
			const locationObj = pd.locations.find(
				(l) => l.name.trim() === phase.location.trim(),
			) ?? {
				name: phase.location,
				description: "Location data unavailable.",
				coordinates: pd.AOO ?? [0, 0],
			};

			const points = GeneratePointsOnMap({
				missionType: phase.missionTypeId,
				terrain,
				objectives: [locationObj],
			});

			const briefingText = generateBriefing({
				operationName: campaignJSON.operationName,
				province: provinceKey,
				biome: pd.biome,
				missionType: phase.missionTypeId,
				locations: [locationObj],
				generator: points,
				priorPhases: [],
			});

			return {
				phaseIndex: index,
				label: phase.label,
				objective: phase.objective,
				minibrief: phase.minibrief,
				isFinal: phase.isFinal ?? false,
				intelGate: phase.intelGate ?? null,
				province: provinceKey,
				biome: pd.biome,
				missionTypeId: phase.missionTypeId,
				location: locationObj,
				infilPoint: points.infilPoint,
				exfilPoint: points.exfilPoint,
				rallyPoint: points.rallyPoint,
				infilMethod: points.infilMethod,
				exfilMethod: points.exfilMethod,
				approachVector: points.approachVector,
				bounds: pd.coordinates.bounds,
				imgURL: pd.imgURL,
				briefingText,
				status: index === 0 ? "active" : "pending",
			};
		});
	};

	// ── Generate handler ──────────────────────────────────────────────────────
	const handleGenerate = async () => {
		if (!canGenerate()) {
			if (!opType) toast.warn("Select an operation type.");
			else if (!selectedProvince) toast.warn("Select a province.");
			else toast.warn("All phases need a location.");
			return;
		}

		setLoading(true);

		try {
			const provinceContext = buildProvinceContext(selectedProvince);
			const opTypeDef = OPERATION_TYPES.find((o) => o.id === opType);

			const playerPhases =
				aiSubMode === "ai-mission" ?
					missionPhases.map((p, i) => ({
						phaseNumber: i + 1,
						province: selectedProvince,
						location: p.location,
						isFinal: i === missionPhases.length - 1,
					}))
				:	null;

			const campaignJSON = await generateCampaign({
				opType,
				opTypeDef,
				context: context.trim(),
				provinceContext,
				playerPhases,
				missionTypes: MISSION_TYPES.map((m) => ({
					id: m.id,
					fullLabel: m.fullLabel,
					category: m.category,
				})),
			});

			const processedPhases = processCampaignPhases(campaignJSON);

			if (!processedPhases.length) {
				throw new Error("Campaign generation returned no phases.");
			}

			const firstPhase = processedPhases[0];

			const payload = {
				operationName: campaignJSON.operationName,
				narrative: campaignJSON.narrative,
				opType,
				aiGenerated: true,
				campaignPhases: processedPhases,
				selectedProvince: firstPhase.province,
				biome: firstPhase.biome,
				bounds: firstPhase.bounds,
				imgURL: firstPhase.imgURL,
				missionType: firstPhase.missionTypeId,
				randomSelection: [firstPhase.location],
				briefing: firstPhase.briefingText,
				infilPoint: firstPhase.infilPoint,
				exfilPoint: firstPhase.exfilPoint,
				rallyPoint: firstPhase.rallyPoint,
				infilMethod: firstPhase.infilMethod,
				exfilMethod: firstPhase.exfilMethod,
				approachVector: firstPhase.approachVector,
			};

			onGenerateAI(payload);
			setMapBounds(firstPhase.bounds);
			setImgURL(firstPhase.imgURL);

			toast.success(
				`Operation ${campaignJSON.operationName} — ${processedPhases.length} phases generated.`,
			);
		} catch (err) {
			console.error(err);
			toast.error(err.message || "Campaign generation failed.");
		} finally {
			setLoading(false);
		}
	};

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<div className='flex flex-col gap-4 h-full'>
			{/* Sub-mode toggle */}
			<div className='flex gap-0 border border-btn/20 rounded-sm overflow-hidden shrink-0'>
				{[
					{ id: "ai-random", icon: faShuffle, label: "AI Random" },
					{ id: "ai-mission", icon: faListCheck, label: "AI Mission" },
				].map((m) => {
					const active = aiSubMode === m.id;
					return (
						<button
							key={m.id}
							onClick={() => setAiSubMode(m.id)}
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

			{/* Form body */}
			<div className='flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto'>
				{/* Op type — both modes */}
				<OpTypeSelector
					value={opType}
					onChange={setOpType}
				/>

				{/* Province — both modes */}
				<HudSelect
					label='Province'
					value={selectedProvince}
					onChange={(e) => handleProvinceChange(e.target.value)}>
					<option value=''>— Select Province —</option>
					{provinceKeys.map((p) => (
						<option
							key={p}
							value={p}>
							{p}
						</option>
					))}
				</HudSelect>

				{/* Context — both modes */}
				<div className='flex flex-col gap-1'>
					<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
						Context{" "}
						<span className='text-lines/25 normal-case tracking-normal'>
							optional
						</span>
					</span>
					<textarea
						value={context}
						onChange={(e) => setContext(e.target.value)}
						maxLength={200}
						rows={2}
						placeholder='e.g. find and rescue a captured Skell engineer'
						className='w-full bg-blk/60 border border-lines/25 hover:border-lines/40 focus:border-btn/50 focus:outline-none rounded-sm px-3 py-2 font-mono text-[10px] text-fontz/70 placeholder:text-lines/20 resize-none transition-colors'
					/>
					<span className='font-mono text-[8px] text-lines/20 text-right'>
						{context.length}/200
					</span>
				</div>

				{/* AI Random — info blurb */}
				{aiSubMode === "ai-random" && opType && selectedProvince && (
					<div className='flex items-start gap-2 p-2.5 border border-btn/15 rounded-sm bg-btn/5'>
						<FontAwesomeIcon
							icon={faBrain}
							className='text-btn/50 text-[10px] mt-0.5 shrink-0'
						/>
						<span className='font-mono text-[9px] text-lines/40 leading-relaxed'>
							AI will select locations and phase sequence from{" "}
							{selectedProvince}. Add context above to seed the narrative.
						</span>
					</div>
				)}

				{/* AI Mission — phase location pickers */}
				{aiSubMode === "ai-mission" && !selectedProvince && (
					<span className='font-mono text-[9px] text-lines/25 italic'>
						Select a province to configure phase locations.
					</span>
				)}

				{aiSubMode === "ai-mission" && selectedProvince && (
					<div className='flex flex-col gap-2'>
						<div className='flex items-center justify-between'>
							<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
								Phases{" "}
								<span className='text-btn/60'>
									{missionPhases.length} total
								</span>
							</span>
							{missionPhases.length < 5 && (
								<button
									onClick={addPhase}
									className='flex items-center gap-1.5 font-mono text-[9px] text-lines/35 hover:text-btn transition-colors'>
									<FontAwesomeIcon
										icon={faPlus}
										className='text-[8px]'
									/>
									Add Phase
								</button>
							)}
						</div>
						<div className='flex flex-col gap-1.5'>
							{missionPhases.map((phase, index) => (
								<PhaseLocationRow
									key={index}
									phaseIndex={index}
									location={phase.location}
									onChange={(loc) => updatePhaseLocation(index, loc)}
									onRemove={() => removePhase(index)}
									isFinal={index === missionPhases.length - 1}
									provinceLocations={provinceLocations}
								/>
							))}
						</div>
						<span className='font-mono text-[8px] text-lines/25 italic'>
							AI builds the narrative and assigns mission types around your
							locations.
						</span>
					</div>
				)}
			</div>

			{/* Generate button */}
			<div className='shrink-0'>
				<ActionBtn
					onClick={handleGenerate}
					loading={loading}
					disabled={!canGenerate()}
					icon={faBrain}
					label={loading ? "Generating..." : "Generate Campaign"}
					variant='primary'
					wide
				/>
			</div>
		</div>
	);
}

// ─── PropTypes ────────────────────────────────────────────────────────────────

AIMissionGenerator.propTypes = {
	onGenerateAI: PropTypes.func.isRequired,
	setMapBounds: PropTypes.func.isRequired,
	setImgURL: PropTypes.func.isRequired,
};

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

OpTypeSelector.propTypes = {
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};

PhaseLocationRow.propTypes = {
	phaseIndex: PropTypes.number.isRequired,
	location: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	onRemove: PropTypes.func.isRequired,
	isFinal: PropTypes.bool,
	provinceLocations: PropTypes.array.isRequired,
};
