import { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faFileShield,
	faLayerGroup,
	faPlus,
	faChevronLeft,
	faChevronRight,
	faExpand,
	faCompress,
} from "@fortawesome/free-solid-svg-icons";
import {
	MapWrapper,
	WeatherPanel,
	AARSheet,
	PhaseList,
	PhaseReportSheet,
	CampaignView,
} from "@/components";
import { MissionGenerator } from "@/components/ai";
import useMissionsStore from "@/zustand/useMissionsStore";
import { generateBriefing } from "@/utils/BriefingGenerator";
import PropTypes from "prop-types";
import { Panel, usePageSheet, getWeatherIcon } from "./dashboardHelpers";

// ─── Section colors ───────────────────────────────────────────────────────────

const SECTION_COLORS = {
	"ASSET STATUS": "text-red-400",
	"MISSION INTENT": "text-btn",
	INFILTRATION: "text-cyan-400",
	EXFILTRATION: "text-blue-400",
	"RALLY POINT": "text-amber-300",
	GEAR: "text-amber-400",
	LOADOUT: "text-orange-400",
	"RULES OF ENGAGEMENT": "text-lines/55",
	"COMMANDER'S INTENT": "text-emerald-400",
	"AREA OF OPERATIONS": "text-indigo-400",
	OBJECTIVES: "text-violet-400",
	"ENVIRONMENTAL CONDITIONS": "text-teal-400",
	"ENEMY FORCES": "text-red-300",
	"TIME OF OPERATION": "text-orange-300",
};

function getSectionColor(label) {
	for (const [key, color] of Object.entries(SECTION_COLORS)) {
		if (label.includes(key)) return color;
	}
	return "text-lines/45";
}

// ─── IntelBody ────────────────────────────────────────────────────────────────

function IntelBody({ hasBriefing, missionBriefing }) {
	if (!hasBriefing) {
		return (
			<div className='flex flex-col items-center justify-center flex-1 gap-4 p-6 h-full'>
				<div className='grid grid-cols-3 gap-1 opacity-20'>
					{[...Array(9)].map((_, i) => (
						<div
							key={i}
							className='w-2 h-2 border border-lines/50'
						/>
					))}
				</div>
				<p className='font-mono text-[9px] tracking-[0.3em] text-lines/25 uppercase text-center'>
					No OPORD Generated
				</p>
			</div>
		);
	}

	const lines = missionBriefing.split("\n");

	return (
		<div className='flex flex-col h-full'>
			<div className='flex-1 min-h-0 overflow-y-auto px-4 py-3'>
				<div className='flex flex-col gap-0.5'>
					{lines.map((line, i) => {
						const sectionMatch = line.match(/^([A-Z][A-Z\s'\/]+):\s*(.*)/);
						if (sectionMatch) {
							const [, label, rest] = sectionMatch;
							const color = getSectionColor(label.trim());
							return (
								<div
									key={i}
									className={i === 0 ? "" : "mt-2.5"}>
									<div className='flex items-center gap-2 mb-0.5'>
										<span
											className={`font-mono text-[8px] tracking-[0.2em] font-bold ${color}`}>
											{label}
										</span>
										<div className='flex-1 h-px bg-lines/10' />
									</div>
									{rest && (
										<p className='font-mono text-[10px] text-fontz/68 leading-relaxed'>
											{rest}
										</p>
									)}
								</div>
							);
						}
						if (!line.trim())
							return (
								<div
									key={i}
									className='h-0.5'
								/>
							);
						return (
							<p
								key={i}
								className='font-mono text-[10px] text-fontz/65 leading-relaxed'>
								{line}
							</p>
						);
					})}
				</div>
			</div>
		</div>
	);
}

IntelBody.propTypes = {
	hasBriefing: PropTypes.bool,
	missionBriefing: PropTypes.string,
};

// ═══════════════════════════════════════════════════════════════════════════════
// BRIEFING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function BriefingPage({ onNewMission }) {
	const {
		activeMission,
		saveMissionGenerator,
		saveMissionBriefing,
		saveMissionGeneratorAI,
		addPhase,
		saveAAR,
	} = useMissionsStore();

	// ── Derive display values from store ──────────────────────────────────────
	const g = activeMission?.generator || {};

	// ── AI campaign fields ────────────────────────────────────────────────────
	const campaignPhases = activeMission?.campaignPhases ?? [];
	const totalCampaignPhases = campaignPhases.length;
	const completedCampaignPhases = campaignPhases.filter(
		(p) => p.status === "complete",
	).length;
	const isAIMission = !!activeMission?.aiGenerated;
	const operationStructure = activeMission?.operationStructure ?? "";
	const friendlyConcerns   = activeMission?.friendlyConcerns ?? "";
	const exfilPlan          = activeMission?.exfilPlan ?? "";

	// For Structure A, multiple phases can be active simultaneously
	const activePhases = isAIMission ? campaignPhases.filter((p) => p.status === "active") : [];

	const [activePhaseIndex, setActivePhaseIndex] = useState(0);
	useEffect(() => {
		setActivePhaseIndex(0);
	}, [activePhases.length]);

	const [mapExpanded, setMapExpanded] = useState(false);

	const activeCampaignPhase =
		isAIMission ?
			operationStructure === "direct_action" && activePhases.length > 0 ?
				activePhases[Math.min(activePhaseIndex, activePhases.length - 1)]
			:	(campaignPhases.find((p) => p.status === "active") ?? null)
		:	null;

	// ── Generation mode ───────────────────────────────────────────────────────
	const serverGenerationMode = g.generationMode || "random";
	const [generationMode, setGenerationModeLocal] = useState(serverGenerationMode);
	useEffect(() => {
		setGenerationModeLocal(serverGenerationMode);
	}, [serverGenerationMode]);

	const mapSource = (isAIMission && generationMode === "ai") ? (activeCampaignPhase ?? g) : g;
	const mapBounds = mapSource.bounds ?? mapSource.mapBounds ?? null;
	const imgURL = mapSource.imgURL ?? "";

	// ── Location markers ──────────────────────────────────────────────────────
	const selectedLocations = g.selectedLocations || [];
	const aiPhaseLocations = activeCampaignPhase?.location ? [activeCampaignPhase.location] : [];
	const locationSelection =
		isAIMission ? aiPhaseLocations
		: generationMode === "ops" ? selectedLocations
		: [];
	const randomLocationSelection =
		isAIMission ? []
		: generationMode === "random" ? selectedLocations
		: [];

	// ── Phase reports ─────────────────────────────────────────────────────────
	const phases = activeMission?.phases ?? [];
	const phaseCount = phases.length;

	const briefingText = useMemo(() => {
		if (isAIMission && generationMode === "ai" && activeCampaignPhase) {
			return generateBriefing({
				operationName: activeMission.name,
				province: activeCampaignPhase.province,
				biome: activeCampaignPhase.biome,
				missionType: activeCampaignPhase.missionTypeId,
				locations: [activeCampaignPhase.location],
				generator: activeCampaignPhase,
				priorPhases: activeMission?.phases ?? [],
			});
		}
		return activeMission?.briefingText || "";
	}, [isAIMission, generationMode, activeCampaignPhase, activeMission]);

	const hasBriefing = !!briefingText;

	// ── Callbacks ─────────────────────────────────────────────────────────────

	const handleGenerateRandomOps = (data) => {
		if (!activeMission?._id) return;
		saveMissionGenerator(
			activeMission._id,
			{
				generationMode: "random",
				selectedLocations: data.randomSelection,
				mapBounds: data.bounds,
				imgURL: data.imgURL || "",
				missionType: data.missionType,
				infilPoint: data.infilPoint ?? null,
				exfilPoint: data.exfilPoint ?? null,
				rallyPoint: data.rallyPoint ?? null,
				infilMethod: data.infilMethod ?? null,
				exfilMethod: data.exfilMethod ?? null,
				approachVector: data.approachVector ?? null,
			},
			data.selectedProvince,
			data.biome,
		);
		if (data.briefing) saveMissionBriefing(activeMission._id, data.briefing);
	};

	const handleGenerateOps = (data) => {
		if (!activeMission?._id) return;
		saveMissionGenerator(
			activeMission._id,
			{
				generationMode: "ops",
				selectedLocations: data.randomSelection,
				mapBounds: data.bounds,
				imgURL: data.imgURL || "",
				missionType: data.missionType,
				infilPoint: data.infilPoint ?? null,
				exfilPoint: data.exfilPoint ?? null,
				rallyPoint: data.rallyPoint ?? null,
				infilMethod: data.infilMethod ?? null,
				exfilMethod: data.exfilMethod ?? null,
				approachVector: data.approachVector ?? null,
			},
			data.selectedProvince,
			data.biome,
		);
		if (data.briefing) saveMissionBriefing(activeMission._id, data.briefing);
	};

	const handleGenerateAI = (payload) => {
		if (!activeMission?._id) return;
		saveMissionGeneratorAI(activeMission._id, payload);
	};

	// ── Sheets ────────────────────────────────────────────────────────────────
	const { open: openSheet, close, SheetEl } = usePageSheet();

	const openWeatherSheet = () => {
		if (!activeMission?.biome) return;
		openSheet(
			"left",
			<WeatherPanel province={activeMission.biome} provinceKey={activeMission.province} />,
			"Pre-Op Conditions",
			`${activeMission.biome} — Environmental Brief`,
		);
	};

	const openIntelSheet = () =>
		openSheet(
			"top",
			<IntelBody
				hasBriefing={hasBriefing}
				missionBriefing={briefingText}
			/>,
			"OPORD",
			hasBriefing ? "" : "STANDBY — No brief generated",
		);

	const openPhaseSheet = () => {
		const phaseNumber = phaseCount + 1;
		openSheet(
			"right",
			<PhaseReportSheet
				mission={activeMission}
				phaseNumber={phaseNumber}
				onSave={async (phaseData) => {
					await addPhase(activeMission._id, phaseData);
					close();
				}}
				onClose={close}
			/>,
			`Phase ${phaseNumber} Report`,
			`${activeMission?.name} — Post-Mission Debrief`,
		);
	};

	const openAARSheet = () =>
		openSheet(
			"bottom",
			<AARSheet
				mission={activeMission}
				onSave={async (aarText) => {
					await saveAAR(activeMission._id, aarText);
				}}
				onClose={close}
			/>,
			"After Action Report",
			`${activeMission?.name} — Debrief`,
		);

	const openPhaseListSheet = () => {
		if (isAIMission) {
			openSheet(
				"bottom",
				<CampaignView
					mission={activeMission}
					operationStructure={operationStructure}
					friendlyConcerns={friendlyConcerns}
					exfilPlan={exfilPlan}
					onFileReport={() => {
						close();
						openPhaseSheet();
					}}
					onAAR={() => {
						close();
						openAARSheet();
					}}
					onClose={close}
				/>,
				"Campaign — " + (activeMission?.name ?? ""),
				`${activeMission?.name} — AI Operation Phase Chain`,
			);
		} else {
			openSheet(
				"right",
				<PhaseList
					phases={phases}
					onNewPhase={() => {
						close();
						openPhaseSheet();
					}}
					onAAR={() => {
						close();
						openAARSheet();
					}}
				/>,
				"Phase Log",
				`${activeMission?.name} — ${phaseCount} phase${phaseCount !== 1 ? "s" : ""} filed`,
			);
		}
	};

	// ── MissionGenerator props ────────────────────────────────────────────────
	const noop = () => {};
	const mgProps = {
		onGenerateRandomOps: handleGenerateRandomOps,
		onGenerateOps: handleGenerateOps,
		onGenerateAI: handleGenerateAI,
		setMapBounds: noop,
		setImgURL: noop,
		generationMode,
		operationName: activeMission?.name ?? "",
		priorPhases: phases,
		setGenerationMode: (mode) => {
			setGenerationModeLocal(mode);
			if (!activeMission?._id) return;
			saveMissionGenerator(
				activeMission._id,
				{ ...g, generationMode: mode },
				activeMission.province,
				activeMission.biome,
			);
		},
	};

	const mapProps = {
		mapBounds,
		locationSelection,
		randomLocationSelection,
		imgURL,
		generationMode: isAIMission ? "ops" : generationMode,
		infilPoint: mapSource.infilPoint ?? null,
		exfilPoint: mapSource.exfilPoint ?? null,
		infilMethod: mapSource.infilMethod ?? null,
		province: activeMission?.province ?? null,
	};

	const biome = activeMission?.biome || null;
	const weatherMeta = biome ? getWeatherIcon(biome) : null;

	// ── Action buttons ────────────────────────────────────────────────────────
	const ActionButtons = (
		<div className='flex items-center gap-2'>
			{weatherMeta && (
				<button
					onClick={openWeatherSheet}
					title={biome}
					className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase border border-lines/15 hover:border-lines/35 bg-transparent hover:bg-white/[0.03] px-2 py-1 rounded-sm transition-all'>
					<FontAwesomeIcon
						icon={weatherMeta.icon}
						className={`text-[10px] ${weatherMeta.color}`}
					/>
					<span className={`hidden sm:inline ${weatherMeta.color}`}>
						AO Brief
					</span>
				</button>
			)}
			<button
				onClick={openIntelSheet}
				className={[
					"flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase px-2 py-1 rounded-sm border transition-all",
					hasBriefing ?
						"text-purple-300 border-purple-500/40 bg-purple-900/10 hover:bg-purple-900/20 hover:border-purple-500/60"
					:	"text-lines/35 border-lines/15 hover:border-lines/30 hover:text-lines/55",
				].join(" ")}>
				<FontAwesomeIcon
					icon={faFileShield}
					className='text-[8px]'
				/>
				<span className='hidden sm:inline'>OPORD</span>
			</button>
			<button
				onClick={openPhaseListSheet}
				className={[
					"flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase px-2 py-1 rounded-sm border transition-all",
					isAIMission && totalCampaignPhases > 0 ?
						"text-btn border-btn/30 bg-btn/5 hover:bg-btn/15 hover:border-btn/60"
					: phaseCount > 0 ?
						"text-btn border-btn/30 bg-btn/5 hover:bg-btn/15 hover:border-btn/60"
					:	"text-lines/35 border-lines/15 hover:border-lines/30 hover:text-lines/55",
				].join(" ")}>
				<FontAwesomeIcon
					icon={faLayerGroup}
					className='text-[8px]'
				/>
				<span className='hidden sm:inline'>
					{isAIMission ? "Campaign" : "Phases"}
				</span>
				{isAIMission && totalCampaignPhases > 0 && (
					<span className='font-mono text-[8px] text-btn tabular-nums'>
						{completedCampaignPhases}/{totalCampaignPhases}
					</span>
				)}
				{!isAIMission && phaseCount > 0 && (
					<span className='font-mono text-[8px] text-btn tabular-nums'>
						{phaseCount}
					</span>
				)}
			</button>
		</div>
	);

	// ── No mission ────────────────────────────────────────────────────────────
	if (!activeMission) {
		return (
			<div className='flex flex-col flex-1 items-center justify-center gap-5 p-8 text-center'>
				<div className='grid grid-cols-3 gap-1.5 opacity-15'>
					{[...Array(9)].map((_, i) => (
						<div
							key={i}
							className='w-3 h-3 border border-lines/50'
						/>
					))}
				</div>
				<div className='flex flex-col items-center gap-1'>
					<p className='font-mono text-[10px] tracking-[0.3em] text-lines/30 uppercase'>
						// No Active Operation //
					</p>
					<p className='font-mono text-[9px] text-lines/20 mt-1'>
						Create or load a mission to begin
					</p>
				</div>
				<button
					onClick={onNewMission}
					className='flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-btn border border-btn/30 hover:border-btn/60 bg-btn/5 hover:bg-btn/15 px-4 py-2.5 rounded-sm transition-all'>
					<FontAwesomeIcon
						icon={faPlus}
						className='text-[9px]'
					/>
					New Operation
				</button>
			</div>
		);
	}

	return (
		<>
			{/* ══ MOBILE ══════════════════════════════════════════════════════ */}
			<div className='lg:hidden flex-1 overflow-y-auto'>
				<div className='p-3 flex flex-col gap-3'>
					{ActionButtons}

					<Panel
						className='h-[420px]'
						bodyClass='p-3'>
						<MissionGenerator {...mgProps} />
					</Panel>

					<Panel
						title={
							isAIMission && activeCampaignPhase && operationStructure === "direct_action"
								? `${activeMission?.province ?? "Tactical Map"} — ${activeCampaignPhase.teamLabel || activeCampaignPhase.label}`
								: (activeMission?.province ?? "Tactical Map")
						}
						badge='AO-LIVE'
						badgeGreen
						className={mapExpanded ? "h-[70vh]" : "h-72"}
						bodyClass='overflow-hidden p-0'
						actions={
							<button
								onClick={() => setMapExpanded((v) => !v)}
								className='w-6 h-6 flex items-center justify-center rounded-sm border border-neutral-700/60 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-all'
								title={mapExpanded ? "Collapse map" : "Expand map"}>
								<FontAwesomeIcon icon={mapExpanded ? faCompress : faExpand} className='text-[9px]' />
							</button>
						}>
						{operationStructure === "direct_action" && activePhases.length > 1 && (
							<div className='shrink-0 flex items-center justify-between px-3 py-1 border-b border-neutral-800/40 bg-neutral-900/70'>
								<button
									onClick={() => setActivePhaseIndex((i) => Math.max(0, i - 1))}
									disabled={activePhaseIndex === 0}
									className='w-6 h-6 flex items-center justify-center rounded-sm border border-neutral-700/60 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 disabled:opacity-25 disabled:cursor-not-allowed transition-all'>
									<FontAwesomeIcon icon={faChevronLeft} className='text-[8px]' />
								</button>
								<span className='font-mono text-[8px] text-neutral-500 tabular-nums'>
									Team {activePhaseIndex + 1} of {activePhases.length}
								</span>
								<button
									onClick={() => setActivePhaseIndex((i) => Math.min(activePhases.length - 1, i + 1))}
									disabled={activePhaseIndex === activePhases.length - 1}
									className='w-6 h-6 flex items-center justify-center rounded-sm border border-neutral-700/60 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 disabled:opacity-25 disabled:cursor-not-allowed transition-all'>
									<FontAwesomeIcon icon={faChevronRight} className='text-[8px]' />
								</button>
							</div>
						)}
						<div className='flex flex-col flex-1 min-h-0 overflow-hidden'>
							<MapWrapper {...mapProps} />
						</div>
					</Panel>
				</div>
			</div>

			{/* ══ DESKTOP ═════════════════════════════════════════════════════ */}
			<div className='hidden lg:flex flex-1 min-h-0 overflow-hidden flex-col p-4 gap-3'>
				{ActionButtons}

				<div className='grid grid-cols-[420px_1fr] gap-3 flex-1 min-h-0 overflow-hidden'>
					<div className='flex flex-col min-h-0 bg-neutral-900/40 border border-neutral-800/60 rounded overflow-hidden'>
						<div className='flex-1 min-h-0 overflow-y-auto p-3'>
							<MissionGenerator {...mgProps} />
						</div>
					</div>
					<div className='flex flex-col min-h-0 bg-neutral-900/40 border border-neutral-800/60 rounded overflow-hidden'>
						<div className='flex items-center gap-2 px-3 py-2 border-b border-neutral-800/60 shrink-0'>
							<span className='w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(74,222,128,0.6)] shrink-0' />
							<span className='font-mono text-[8px] tracking-[0.2em] text-neutral-500 uppercase flex-1'>
								{isAIMission && activeCampaignPhase ?
									`${activeMission?.province ?? "Tactical Map"} — ${activeCampaignPhase.teamLabel || activeCampaignPhase.label}`
								:	(activeMission?.province ?? "Tactical Map")}
							</span>
							{operationStructure === "direct_action" && activePhases.length > 1 && (
								<div className='flex items-center gap-1 shrink-0'>
									<button
										onClick={() => setActivePhaseIndex((i) => Math.max(0, i - 1))}
										disabled={activePhaseIndex === 0}
										className='w-5 h-5 flex items-center justify-center rounded-sm border border-neutral-700/60 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 disabled:opacity-25 disabled:cursor-not-allowed transition-all'>
										<FontAwesomeIcon icon={faChevronLeft} className='text-[8px]' />
									</button>
									<span className='font-mono text-[8px] text-neutral-600 tabular-nums'>
										{activePhaseIndex + 1}/{activePhases.length}
									</span>
									<button
										onClick={() => setActivePhaseIndex((i) => Math.min(activePhases.length - 1, i + 1))}
										disabled={activePhaseIndex === activePhases.length - 1}
										className='w-5 h-5 flex items-center justify-center rounded-sm border border-neutral-700/60 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 disabled:opacity-25 disabled:cursor-not-allowed transition-all'>
										<FontAwesomeIcon icon={faChevronRight} className='text-[8px]' />
									</button>
								</div>
							)}
							<span className='font-mono text-[7px] tracking-widest text-neutral-600 border border-neutral-800/60 px-1.5 py-0.5 rounded-sm'>
								AO-LIVE
							</span>
						</div>
						<div className='flex-1 min-h-0 flex flex-col overflow-hidden'>
							<MapWrapper {...mapProps} />
						</div>
					</div>
				</div>
			</div>

			{SheetEl}
		</>
	);
}

BriefingPage.propTypes = {
	onNewMission: PropTypes.func,
};
