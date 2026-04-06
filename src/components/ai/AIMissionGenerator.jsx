// ─────────────────────────────────────────────────────────────────────────────
// AIMissionGenerator.jsx
// AI-powered mission generation — single Groq call produces a full phase chain.
//
// Sub-modes:
//   ai-random  — user picks province + op type + optional context + location count.
//                AI picks which locations and how many phases (2–6).
//   ai-mission — user picks province + op type + specific locations in order.
//                AI assigns mission types and builds narrative around them.
//
// Single province per operation — full province data sent to Groq, no compression.
// Zero additional Groq calls after initial generation.
// PROVINCES_AI_CONTEXT is no longer used — removed entirely.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { PROVINCES, PROVINCE_TERRAIN } from "@/config";
import { MISSION_TYPES, generateCampaign } from "@/api/GhostOpsApi";
import { buildProvinceContext } from "@/utils/BuildProvinceContext";
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

// ── Province selector ─────────────────────────────────────────────────────────
// Shared between both sub-modes. Single province per operation.

function ProvinceSelector({ value, onChange }) {
	const allProvinceKeys = Object.keys(PROVINCES);
	return (
		<div className='flex flex-col gap-1'>
			<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
				Province
			</span>
			<div className='relative'>
				<select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className='w-full appearance-none bg-blk/60 border border-lines/25 hover:border-lines/50 focus:border-btn/60 focus:outline-none rounded-sm px-3 py-2 font-mono text-[11px] text-fontz/80 cursor-pointer transition-colors'>
					<option value=''>— Select Province —</option>
					{allProvinceKeys.map((p) => (
						<option
							key={p}
							value={p}>
							{p}
						</option>
					))}
				</select>
				<div className='absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none'>
					<div className='w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-lines/30' />
				</div>
			</div>
			{value && (
				<span className='font-mono text-[8px] text-lines/30 italic'>
					Biome: {PROVINCES[value]?.biome ?? "Unknown"}
				</span>
			)}
		</div>
	);
}

// ── Location count selector — AI Random only ──────────────────────────────────

function LocationCountSelector({ value, onChange }) {
	return (
		<div className='flex flex-col gap-1'>
			<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
				Locations{" "}
				<span className='text-lines/25 normal-case tracking-normal'>
					AI picks phases (2–6)
				</span>
			</span>
			<div className='flex gap-1'>
				{[2, 3, 4, 5, 6].map((n) => (
					<button
						key={n}
						onClick={() => onChange(n)}
						className={[
							"flex-1 py-1.5 border rounded-sm font-mono text-[11px] transition-all",
							value === n ?
								"border-btn/50 bg-btn/10 text-btn"
							:	"border-lines/15 text-lines/40 hover:border-lines/30 hover:text-fontz/60",
						].join(" ")}>
						{n}
					</button>
				))}
			</div>
			<span className='font-mono text-[8px] text-lines/25 italic'>
				AI may adjust by ±1 based on narrative complexity.
			</span>
		</div>
	);
}

// ── Location list — AI Mission only ──────────────────────────────────────────
// User picks specific locations from the selected province in order.

function LocationRow({
	index,
	location,
	provinceLocations,
	onLocationChange,
	onRemove,
	totalCount,
}) {
	return (
		<div className='flex flex-col gap-1 p-2 border rounded-sm border-lines/15 bg-blk/30'>
			<div className='flex items-center justify-between'>
				<span className='font-mono text-[8px] tracking-widest uppercase text-lines/35'>
					{`Location ${index + 1}`}
				</span>
				{totalCount > 2 && (
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
					onChange={(e) => onLocationChange(e.target.value)}
					className='w-full appearance-none bg-blk/60 border border-lines/20 hover:border-lines/40 focus:border-btn/50 focus:outline-none rounded-sm px-2.5 py-1.5 font-mono text-[10px] text-fontz/70 cursor-pointer transition-colors'>
					<option value=''>— Select Location —</option>
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
	// ── State ─────────────────────────────────────────────────────────────────
	const [aiSubMode, setAiSubMode] = useState("ai-random");
	const [province, setProvince] = useState("");
	const [opType, setOpType] = useState("");
	const [context, setContext] = useState("");
	const [locationCount, setLocationCount] = useState(3);
	const [loading, setLoading] = useState(false);

	// AI Mission: ordered list of location name strings within the selected province
	const [selectedLocations, setSelectedLocations] = useState(["", ""]);

	// ── Derived ───────────────────────────────────────────────────────────────
	const provinceLocations =
		province ? (PROVINCES[province]?.locations ?? []) : [];

	// ── Location list helpers — AI Mission ────────────────────────────────────
	const addLocation = () => {
		setSelectedLocations((prev) => {
			const withoutFinal = prev.slice(0, -1);
			const final = prev[prev.length - 1];
			return [...withoutFinal, "", final];
		});
	};

	const removeLocation = (index) => {
		setSelectedLocations((prev) => prev.filter((_, i) => i !== index));
	};

	const updateLocation = (index, value) => {
		setSelectedLocations((prev) =>
			prev.map((loc, i) => (i === index ? value : loc)),
		);
	};

	// Reset location list when province changes
	const handleProvinceChange = (newProvince) => {
		setProvince(newProvince);
		setSelectedLocations(["", ""]);
	};

	// ── Validation ────────────────────────────────────────────────────────────
	const canGenerate = () => {
		if (!opType) return false;
		if (!province) return false;
		if (aiSubMode === "ai-mission") {
			if (selectedLocations.length < 2) return false;
			return selectedLocations.every((loc) => loc !== "");
		}
		return true;
	};

	// ── Shared location/points/briefing resolver ────────────────────────────
	const resolvePhaseAssets = (campaignJSON, objectiveName, missionTypeId) => {
		const pd = PROVINCES[province];
		const terrain = PROVINCE_TERRAIN?.[province] ?? null;
		const locationObj = pd.locations.find(
			(l) => l.name.trim() === objectiveName.trim(),
		) ?? {
			name: objectiveName,
			description: "Location data unavailable.",
			coordinates: pd.AOO ?? [0, 0],
		};
		const points = GeneratePointsOnMap({
			missionType: missionTypeId,
			terrain,
			objectives: [locationObj],
		});
		const briefingText = generateBriefing({
			operationName: campaignJSON.operationName,
			province,
			biome: pd.biome,
			missionType: missionTypeId,
			locations: [locationObj],
			generator: points,
			priorPhases: [],
		});
		return { pd, locationObj, points, briefingText };
	};

	// ── Structure A — Direct Action (simultaneous multi-team) ─────────────────
	const processStructureA = (campaignJSON) => {
		return campaignJSON.teams.map((team, index) => {
			const { pd, locationObj, points, briefingText } = resolvePhaseAssets(
				campaignJSON, team.objective, team.missionTypeId,
			);
			return {
				phaseIndex: index,
				actIndex: 0,
				teamLabel: team.teamLabel,
				teamSize: "2-4 operators",
				task: team.task,
				specialistRequired: team.specialistRequired ?? null,
				label: team.teamLabel,
				objective: team.task,
				isFinal: false,
				intelGate: null,
				unlockedBy: null,
				province,
				biome: pd.biome,
				missionTypeId: team.missionTypeId,
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
				status: "active",
			};
		});
	};

	// ── Structure B — Intel Then Strike (multi-phase recon → multi-phase strike) ─
	const processStructureB = (campaignJSON) => {
		const intelGate = campaignJSON.intelGate ?? null;
		const act1Arr = Array.isArray(campaignJSON.act1) ? campaignJSON.act1 : [campaignJSON.act1];
		const act2Arr = Array.isArray(campaignJSON.act2) ? campaignJSON.act2 : [campaignJSON.act2];

		const act1Phases = act1Arr.map((phase, index) => {
			const assets = resolvePhaseAssets(campaignJSON, phase.objective, phase.missionTypeId);
			return {
				phaseIndex: index,
				actIndex: 0,
				teamLabel: phase.teamLabel ?? `Recon ${index + 1}`,
				teamSize: phase.teamSize ?? "1-2 operators",
				task: phase.task,
				specialistRequired: null,
				label: phase.teamLabel ?? `Recon ${index + 1}`,
				objective: phase.task,
				isFinal: false,
				intelGate,
				unlockedBy: null,
				province,
				biome: assets.pd.biome,
				missionTypeId: phase.missionTypeId,
				location: assets.locationObj,
				infilPoint: assets.points.infilPoint,
				exfilPoint: assets.points.exfilPoint,
				rallyPoint: assets.points.rallyPoint,
				infilMethod: assets.points.infilMethod,
				exfilMethod: assets.points.exfilMethod,
				approachVector: assets.points.approachVector,
				bounds: assets.pd.coordinates.bounds,
				imgURL: assets.pd.imgURL,
				briefingText: assets.briefingText,
				status: "active",
			};
		});

		const act2Phases = act2Arr.map((phase, index) => {
			const assets = resolvePhaseAssets(campaignJSON, phase.objective, phase.missionTypeId);
			const isLast = index === act2Arr.length - 1;
			return {
				phaseIndex: act1Phases.length + index,
				actIndex: 1,
				teamLabel: phase.teamLabel ?? `Strike ${index + 1}`,
				teamSize: phase.teamSize ?? "2-4 operators",
				task: phase.task,
				specialistRequired: phase.specialistRequired ?? null,
				label: phase.teamLabel ?? `Strike ${index + 1}`,
				objective: phase.task,
				isFinal: isLast,
				intelGate: null,
				unlockedBy: intelGate,
				province,
				biome: assets.pd.biome,
				missionTypeId: phase.missionTypeId,
				location: assets.locationObj,
				infilPoint: assets.points.infilPoint,
				exfilPoint: assets.points.exfilPoint,
				rallyPoint: assets.points.rallyPoint,
				infilMethod: assets.points.infilMethod,
				exfilMethod: assets.points.exfilMethod,
				approachVector: assets.points.approachVector,
				bounds: assets.pd.coordinates.bounds,
				imgURL: assets.pd.imgURL,
				briefingText: assets.briefingText,
				status: "pending",
			};
		});

		return [...act1Phases, ...act2Phases];
	};

	// ── Generate handler ──────────────────────────────────────────────────────
	const handleGenerate = async () => {
		if (!canGenerate()) {
			if (!opType) toast.warn("Select an operation type.");
			else if (!province) toast.warn("Select a province.");
			else toast.warn("All locations must be selected.");
			return;
		}

		setLoading(true);

		try {
			// Build province context from PROVINCES at call time — no PROVINCES_AI_CONTEXT
			const provinceContext = buildProvinceContext(province, PROVINCES);
			const provinceData = PROVINCES[province];
			const opTypeDef = OPERATION_TYPES.find((o) => o.id === opType);

			const campaignJSON = await generateCampaign({
				opType,
				opTypeDef,
				context: context.trim(),
				province,
				provinceData,
				provinceContext,
				// AI Random: null — AI picks locations freely from the province
				// AI Mission: ordered array of location name strings
				playerLocations: aiSubMode === "ai-mission" ? selectedLocations : null,
				// AI Random: how many locations the player wants (AI may adjust ±1)
				// AI Mission: null — count is determined by selectedLocations length
				locationCount: aiSubMode === "ai-random" ? locationCount : null,
				missionTypes: MISSION_TYPES.map((m) => ({
					id: m.id,
					fullLabel: m.fullLabel,
					category: m.category,
				})),
			});

			const processedPhases =
				campaignJSON.structure === "direct_action"
					? processStructureA(campaignJSON)
					: processStructureB(campaignJSON);

			if (!processedPhases.length) {
				throw new Error("Campaign generation returned no phases.");
			}

			const firstPhase = processedPhases[0];

			const payload = {
				operationName: campaignJSON.operationName,
				narrative: campaignJSON.narrative,
				opType,
				aiGenerated: true,
				operationStructure: campaignJSON.structure,
				friendlyConcerns: campaignJSON.friendlyConcerns ?? "",
				exfilPlan: campaignJSON.exfilPlan ?? "",
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
				`Operation ${campaignJSON.operationName} — ${processedPhases.length} phase(s) generated.`,
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

				{/* Province — both modes, single selection */}
				<ProvinceSelector
					value={province}
					onChange={handleProvinceChange}
				/>

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

				{/* AI Random — location count picker */}
				{aiSubMode === "ai-random" && (
					<>
						<LocationCountSelector
							value={locationCount}
							onChange={setLocationCount}
						/>
						{opType && province && (
							<div className='flex items-start gap-2 p-2.5 border border-btn/15 rounded-sm bg-btn/5'>
								<FontAwesomeIcon
									icon={faBrain}
									className='text-btn/50 text-[10px] mt-0.5 shrink-0'
								/>
								<span className='font-mono text-[9px] text-lines/40 leading-relaxed'>
									AI will select locations and sequence phases within{" "}
									<span className='text-btn/70'>{province}</span>. Add context
									above to seed the narrative.
								</span>
							</div>
						)}
					</>
				)}

				{/* AI Mission — ordered location pickers within selected province */}
				{aiSubMode === "ai-mission" && (
					<div className='flex flex-col gap-2'>
						<div className='flex items-center justify-between'>
							<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
								Locations{" "}
								<span className='text-btn/60'>
									{selectedLocations.length} selected
								</span>
							</span>
							{selectedLocations.length < 6 && province && (
								<button
									onClick={addLocation}
									className='flex items-center gap-1.5 font-mono text-[9px] text-lines/35 hover:text-btn transition-colors'>
									<FontAwesomeIcon
										icon={faPlus}
										className='text-[8px]'
									/>
									Add Location
								</button>
							)}
						</div>

						{!province && (
							<span className='font-mono text-[9px] text-lines/30 italic'>
								Select a province above to choose locations.
							</span>
						)}

						{province && (
							<div className='flex flex-col gap-1.5'>
								{selectedLocations.map((loc, index) => (
									<LocationRow
										key={index}
										index={index}
										location={loc}
										provinceLocations={provinceLocations}
										onLocationChange={(val) => updateLocation(index, val)}
										onRemove={() => removeLocation(index)}
										totalCount={selectedLocations.length}
									/>
								))}
							</div>
						)}

						<span className='font-mono text-[8px] text-lines/25 italic'>
							AI assigns mission types and distributes your locations across recon and strike phases.
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

ProvinceSelector.propTypes = {
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};

LocationCountSelector.propTypes = {
	value: PropTypes.number.isRequired,
	onChange: PropTypes.func.isRequired,
};

LocationRow.propTypes = {
	index: PropTypes.number.isRequired,
	location: PropTypes.string.isRequired,
	provinceLocations: PropTypes.array.isRequired,
	onLocationChange: PropTypes.func.isRequired,
	onRemove: PropTypes.func.isRequired,
	totalCount: PropTypes.number.isRequired,
};
