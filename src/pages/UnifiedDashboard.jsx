import { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCrosshairs,
	faUsers,
	faTruck,
	faClock,
	faWifi,
	faChevronRight,
	faRightFromBracket,
	faUser,
	faPlus,
	faFolderOpen,
	faFileShield,
	faLayerGroup,
	faCloudSun,
	faCloudRain,
	faSnowflake,
	faFire,
	faWind,
	faCity,
	faCheck,
	faTrash,
	faPen,
	faTimes,
} from "@fortawesome/free-solid-svg-icons";

import {
	MapWrapper,
	SheetSide,
	WeatherPanel,
	AARSheet,
	PhaseList,
	PhaseReportSheet,
	CampaignView,
	OperatorImageView,
} from "@/components";
import { MissionGenerator } from "@/components/ai";
import {
	Roster,
	Infirmary,
	Memorial,
	Teams,
	Garage,
} from "@/components/tables";
import { NewOperatorForm, AssignTeamSheet } from "@/components/forms";
import {
	useOperatorsStore,
	useSheetStore,
	useSquadStore,
	useTeamsStore,
} from "@/zustand";
import { useAuthService } from "@/services/AuthService";
import useMissionsStore from "@/zustand/useMissionsStore";

import {
	NewMissionModal,
	MissionListSheet,
	ActiveMissionChip,
} from "@/components/mission";

import { generateBriefing } from "@/utils/BriefingGenerator";
import iconUrl from "/icons/GhostOpsAI.svg?url";
import PropTypes from "prop-types";

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV = [
	{ id: "briefing", label: "Ops Room", sub: "SCIF", icon: faCrosshairs },
	{ id: "operators", label: "Personnel", sub: "FOB", icon: faUsers },
	{
		id: "vehicles",
		label: "Asset Registry",
		sub: "Organic Assets",
		icon: faTruck,
	},
];

// ─── Clock ────────────────────────────────────────────────────────────────────

function HUDClock() {
	const [time, setTime] = useState("");
	useEffect(() => {
		const tick = () => {
			const n = new Date();
			const p = (v) => String(v).padStart(2, "0");
			setTime(
				`${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())}Z`,
			);
		};
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, []);
	return (
		<span className='font-mono text-xs tracking-widest text-btn tabular-nums'>
			<FontAwesomeIcon
				icon={faClock}
				className='mr-1.5 opacity-60'
			/>
			{time}
		</span>
	);
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function Panel({
	title,
	badge,
	badgeGreen = false,
	children,
	className = "",
	bodyClass = "",
}) {
	return (
		<div
			className={[
				"flex flex-col rounded border border-neutral-700/50 bg-neutral-800/80 shadow-[0_2px_16px_rgba(0,0,0,0.5)] overflow-hidden",
				className,
			].join(" ")}>
			<div className='flex items-center gap-3 px-4 py-2.5 bg-neutral-800 border-b border-neutral-700/50 shrink-0'>
				<span
					className={[
						"w-1.5 h-1.5 rounded-full shrink-0",
						badgeGreen ?
							"bg-green-500 shadow-[0_0_5px_rgba(74,222,128,0.6)]"
						:	"bg-btn/80 shadow-[0_0_5px_rgba(124,170,121,0.4)]",
					].join(" ")}
				/>
				<span className='font-mono text-[10px] tracking-[0.2em] text-neutral-400 uppercase flex-1 truncate'>
					{title}
				</span>
				{badge && (
					<span
						className={[
							"font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 border rounded-sm",
							badgeGreen ?
								"text-green-400/80 border-green-800/50 bg-green-950/30"
							:	"text-btn/70 border-btn/20 bg-btn/5",
						].join(" ")}>
						{badge}
					</span>
				)}
			</div>
			<div
				className={[
					"flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
					bodyClass,
				].join(" ")}>
				{children}
			</div>
		</div>
	);
}

// ─── Sheet hook ───────────────────────────────────────────────────────────────

function usePageSheet() {
	const { openSheet, setOpenSheet, closeSheet } = useSheetStore();
	const [content, setContent] = useState(null);
	const [title, setTitle] = useState(null);
	const [description, setDescription] = useState(null);

	const open = (side, c, t, d) => {
		setOpenSheet(side);
		setContent(c);
		setTitle(t);
		setDescription(d);
	};

	const SheetEl =
		openSheet ?
			<SheetSide
				openSheet={openSheet}
				setOpenSheet={setOpenSheet}
				side={openSheet}
				content={content}
				title={title}
				description={description}
				onClose={closeSheet}
			/>
		:	null;

	return { open, close: closeSheet, SheetEl };
}

// ─── Biome → weather icon ─────────────────────────────────────────────────────

const BIOME_ICON_MAP = {
	"Rain Forest": { icon: faCloudRain, color: "text-green-400" },
	"Volcanic Rain Forest": { icon: faFire, color: "text-orange-400" },
	"Volcanic Dessert": { icon: faFire, color: "text-red-400" },
	"High Cliffs": { icon: faWind, color: "text-slate-300" },
	"Salt Marsh": { icon: faCloudRain, color: "text-teal-400" },
	"High Thundra": { icon: faSnowflake, color: "text-blue-300" },
	Fjordlands: { icon: faSnowflake, color: "text-cyan-400" },
	"Rain Shadows": { icon: faCloudSun, color: "text-yellow-400" },
	"Mead Lands": { icon: faCloudSun, color: "text-lime-400" },
	"Meadow Lands and Urban City": { icon: faCity, color: "text-zinc-300" },
	"Meadow Lands": { icon: faWind, color: "text-lime-300" },
	"High Thundra and Rain Shadows": {
		icon: faSnowflake,
		color: "text-indigo-300",
	},
	"Rain SHadows": { icon: faCloudSun, color: "text-yellow-400" },
};

function getWeatherIcon(biome) {
	return BIOME_ICON_MAP[biome] ?? { icon: faCloudSun, color: "text-lines/40" };
}

// ─── BriefStatChip ────────────────────────────────────────────────────────────

function BriefStatChip({ label, value, live = false }) {
	return (
		<div className='flex items-center gap-2 bg-blk/50 border border-lines/15 px-2.5 py-1.5 rounded-sm'>
			<span
				className={[
					"w-1.5 h-1.5 rounded-full shrink-0",
					live ?
						"bg-green-500 shadow-[0_0_5px_rgba(74,222,128,0.6)]"
					:	"bg-btn shadow-[0_0_4px_rgba(124,170,121,0.45)]",
				].join(" ")}
			/>
			<span className='font-mono text-[9px] tracking-widest text-lines/35 uppercase'>
				{label}
			</span>
			{value !== undefined && (
				<span className='font-mono text-[10px] text-btn tabular-nums'>
					{value}
				</span>
			)}
		</div>
	);
}

// ─── Section colors — updated to match BriefingGenerator output ───────────────

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
					// Awaiting Mission Brief //
				</p>
				<p className='font-mono text-[8px] text-lines/15 text-center leading-relaxed'>
					Select province → mission type → Generate
				</p>
			</div>
		);
	}

	const lines = missionBriefing.split("\n");

	return (
		<div className='flex flex-col h-full'>
			<div className='shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-lines/15 bg-blk/50'>
				<span className='font-mono text-[8px] tracking-[0.35em] text-red-500/35 uppercase'>
					// TOP SECRET //
				</span>
				<span className='font-mono text-[8px] tracking-widest text-lines/20'>
					GHOST PROTOCOL
				</span>
			</div>
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
						if (line.trim().startsWith("//")) {
							return (
								<p
									key={i}
									className='font-mono text-[9px] text-lines/25 italic mt-2 border-t border-lines/10 pt-2'>
									{line}
								</p>
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

// ═══════════════════════════════════════════════════════════════════════════════
// BRIEFING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function BriefingPage({ onNewMission }) {
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

	// ── AI campaign fields — declared first, used throughout ──────────────────
	const campaignPhases = activeMission?.campaignPhases ?? [];
	const totalCampaignPhases = campaignPhases.length;
	const completedCampaignPhases = campaignPhases.filter(
		(p) => p.status === "complete",
	).length;
	const isAIMission = !!activeMission?.aiGenerated;

	// Active campaign phase — drives map for AI missions
	const activeCampaignPhase =
		isAIMission ?
			(campaignPhases.find((p) => p.status === "active") ?? null)
		:	null;

	// ── Generation mode ───────────────────────────────────────────────────────
	const generationMode = g.generationMode || "random";
	const MODE_LABEL = { random: "RAND", ops: "OPS", ai: "AI OPS" };

	// ── Map source — AI uses active phase, standard uses generator ─────────────
	const mapSource = activeCampaignPhase ?? g;

	const mapBounds = mapSource.bounds ?? mapSource.mapBounds ?? null;
	const imgURL = mapSource.imgURL ?? "";

	// ── Location markers for map ──────────────────────────────────────────────
	const selectedLocations = g.selectedLocations || [];

	const aiPhaseLocations =
		activeCampaignPhase?.location ? [activeCampaignPhase.location] : [];

	const locationSelection =
		isAIMission ? aiPhaseLocations
		: generationMode === "ops" ? selectedLocations
		: [];

	const randomLocationSelection =
		isAIMission ? []
		: generationMode === "random" ? selectedLocations
		: [];

	// ── Phase reports (player-filed) ──────────────────────────────────────────
	const phases = activeMission?.phases ?? [];
	const phaseCount = phases.length;

	const briefingText = useMemo(() => {
		if (isAIMission && activeCampaignPhase) {
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
	}, [isAIMission, activeCampaignPhase, activeMission]);

	const hasBriefing = !!briefingText;

	// ── Generate callbacks ────────────────────────────────────────────────────

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
			<WeatherPanel province={activeMission.biome} />,
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
			"Mission Brief",
			hasBriefing ?
				"TS//SCI — Ghost Protocol Package"
			:	"STANDBY — No brief generated",
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
		// AI missions render locationSelection (ops mode behavior) for objective markers
		generationMode: isAIMission ? "ops" : generationMode,
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
						Weather
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
				<span className='hidden sm:inline'>Brief</span>
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
					<div className='flex flex-wrap items-center gap-2'>
						<span className='font-mono text-[9px] tracking-widest text-btn/70 uppercase truncate max-w-[150px]'>
							{activeMission.name}
						</span>

						{isAIMission && activeMission.operationNarrative && (
							<span className='w-full font-mono text-[8px] text-lines/30 italic truncate'>
								{activeMission.operationNarrative}
							</span>
						)}

						<div className='w-px h-3 bg-lines/20' />

						<BriefStatChip
							label='Mode'
							value={MODE_LABEL[generationMode] ?? generationMode.toUpperCase()}
						/>

						{/* AI Campaign tag — mobile */}
						{isAIMission && (
							<div className='flex items-center gap-1.5 bg-btn/8 border border-btn/25 px-2 py-1 rounded-sm'>
								<span className='w-1.5 h-1.5 rounded-full bg-btn animate-pulse shrink-0' />
								<span className='font-mono text-[8px] tracking-widest text-btn uppercase'>
									AI OPS
								</span>
								{totalCampaignPhases > 0 && (
									<span className='font-mono text-[8px] text-btn/70'>
										{completedCampaignPhases}/{totalCampaignPhases}
									</span>
								)}
							</div>
						)}

						{hasBriefing && (
							<BriefStatChip
								label='Brief'
								value='READY'
								live
							/>
						)}
						{(isAIMission ? totalCampaignPhases > 0 : phaseCount > 0) && (
							<BriefStatChip
								label='Phases'
								value={
									isAIMission && totalCampaignPhases > 0 ?
										`${completedCampaignPhases}/${totalCampaignPhases}`
									:	phaseCount
								}
							/>
						)}

						<div className='ml-auto'>{ActionButtons}</div>
					</div>

					<Panel
						title='Mission Generator'
						badge='GEN-SYS'
						className='h-[420px]'
						bodyClass='p-3'>
						<MissionGenerator {...mgProps} />
					</Panel>

					<Panel
						title={activeMission?.province ?? "Tactical Map"}
						badge='AO-LIVE'
						badgeGreen
						className='h-72'
						bodyClass='overflow-hidden p-0'>
						<MapWrapper {...mapProps} />
					</Panel>
				</div>
			</div>

			{/* ══ DESKTOP ═════════════════════════════════════════════════════ */}
			<div className='hidden lg:flex flex-1 min-h-0 overflow-hidden flex-col p-4 gap-3'>
				<div className='shrink-0 flex items-center gap-3'>
					<div className='flex flex-col shrink-0 max-w-[200px]'>
						<span className='font-mono text-[9px] tracking-widest text-btn/70 uppercase truncate'>
							{activeMission.name}
						</span>
						{isAIMission && activeMission.operationNarrative && (
							<span className='font-mono text-[8px] text-lines/30 italic truncate'>
								{activeMission.operationNarrative}
							</span>
						)}
					</div>

					<div className='w-px h-3 bg-lines/20 shrink-0' />

					<div className='flex flex-wrap gap-2'>
						<BriefStatChip
							label='Mode'
							value={MODE_LABEL[generationMode] ?? generationMode.toUpperCase()}
						/>

						{/* AI Campaign tag — desktop, single instance */}
						{isAIMission && (
							<div className='flex items-center gap-1.5 bg-btn/8 border border-btn/25 px-2 py-1 rounded-sm'>
								<span className='w-1.5 h-1.5 rounded-full bg-btn shadow-[0_0_4px_rgba(124,170,121,0.45)] shrink-0 animate-pulse' />
								<span className='font-mono text-[8px] tracking-widest text-btn uppercase'>
									AI Campaign
								</span>
								{totalCampaignPhases > 0 && (
									<span className='font-mono text-[8px] text-btn/70 tabular-nums'>
										{completedCampaignPhases}/{totalCampaignPhases}
									</span>
								)}
							</div>
						)}

						{hasBriefing && (
							<BriefStatChip
								label='Brief'
								value='READY'
								live
							/>
						)}
						{(isAIMission ? totalCampaignPhases > 0 : phaseCount > 0) && (
							<BriefStatChip
								label='Phases'
								value={
									isAIMission && totalCampaignPhases > 0 ?
										`${completedCampaignPhases}/${totalCampaignPhases}`
									:	phaseCount
								}
							/>
						)}
					</div>

					<div className='flex-1 h-px bg-gradient-to-r from-lines/10 to-transparent' />
					{ActionButtons}
					<span className='font-mono text-[8px] tracking-[0.28em] text-lines/20 uppercase'>
						Mission Control
					</span>
				</div>

				<div className='grid grid-cols-[420px_1fr] gap-3 flex-1 min-h-0 overflow-hidden'>
					<div className='flex flex-col min-h-0 bg-neutral-900/40 border border-neutral-800/60 rounded overflow-hidden'>
						<div className='flex items-center gap-2 px-3 py-2 border-b border-neutral-800/60 shrink-0'>
							<span className='w-1.5 h-1.5 rounded-full bg-btn/60 shrink-0' />
							<span className='font-mono text-[8px] tracking-[0.2em] text-neutral-500 uppercase flex-1'>
								Ghost Operations AI
							</span>
							<span className='font-mono text-[7px] tracking-widest text-neutral-600 border border-neutral-800/60 px-1.5 py-0.5 rounded-sm'>
								GEN-SYS
							</span>
						</div>
						<div className='flex-1 min-h-0 overflow-y-auto p-3'>
							<MissionGenerator {...mgProps} />
						</div>
					</div>
					<div className='flex flex-col min-h-0 bg-neutral-900/40 border border-neutral-800/60 rounded overflow-hidden'>
						<div className='flex items-center gap-2 px-3 py-2 border-b border-neutral-800/60 shrink-0'>
							<span className='w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(74,222,128,0.6)] shrink-0' />
							<span className='font-mono text-[8px] tracking-[0.2em] text-neutral-500 uppercase flex-1'>
								{isAIMission && activeCampaignPhase ?
									`${activeMission?.province ?? "Tactical Map"} — ${activeCampaignPhase.label}`
								:	(activeMission?.province ?? "Tactical Map")}
							</span>
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
// ═══════════════════════════════════════════════════════════════════════════════
// OPERATORS PAGE — unchanged
// ═══════════════════════════════════════════════════════════════════════════════

function SquadEditSheet({ squad, onClose }) {
	const { renameSquad, deleteSquad } = useSquadStore();
	const [name, setName] = useState(squad.name);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const handleSave = async () => {
		const t = name.trim();
		if (!t || t === squad.name) {
			onClose();
			return;
		}
		await renameSquad(squad._id, t);
		onClose();
	};
	const handleDelete = async () => {
		await deleteSquad(squad._id);
		onClose();
	};
	return (
		<div className='flex flex-col gap-4 p-4'>
			<div>
				<label className='font-mono text-[8px] tracking-[0.2em] uppercase text-lines/40 block mb-1'>
					Squad Name
				</label>
				<input
					autoFocus
					value={name}
					onChange={(e) => setName(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleSave()}
					className='w-full font-mono text-[11px] bg-blk/60 border border-lines/20 focus:border-btn/60 text-fontz px-3 py-2 rounded outline-none transition-colors'
				/>
			</div>
			<button
				onClick={handleSave}
				disabled={!name.trim()}
				className='w-full flex items-center justify-center gap-1.5 font-mono text-[9px] tracking-widest uppercase bg-btn/80 hover:bg-btn disabled:opacity-30 text-blk py-2 rounded transition-colors'>
				<FontAwesomeIcon
					icon={faCheck}
					className='text-[8px]'
				/>{" "}
				Save
			</button>
			<div className='border-t border-lines/10 pt-4'>
				{!confirmDelete ?
					<button
						onClick={() => setConfirmDelete(true)}
						className='w-full flex items-center justify-center gap-1.5 font-mono text-[9px] tracking-widest uppercase border border-red-900/40 text-red-400/60 hover:text-red-400 hover:border-red-500/50 hover:bg-red-900/10 py-2 rounded transition-colors'>
						<FontAwesomeIcon
							icon={faTrash}
							className='text-[8px]'
						/>{" "}
						Delete Squad
					</button>
				:	<div className='flex flex-col gap-2'>
						<p className='font-mono text-[9px] text-lines/50 text-center'>
							Delete <span className='text-red-400'>{squad.name}</span>? Cannot
							be undone.
						</p>
						<div className='flex gap-2'>
							<button
								onClick={() => setConfirmDelete(false)}
								className='flex-1 font-mono text-[9px] tracking-widest uppercase border border-lines/20 hover:border-lines/40 text-lines/40 hover:text-fontz py-1.5 rounded transition-colors'>
								Cancel
							</button>
							<button
								onClick={handleDelete}
								className='flex-1 font-mono text-[9px] tracking-widest uppercase bg-red-700/80 hover:bg-red-700 text-white py-1.5 rounded transition-colors'>
								Confirm
							</button>
						</div>
					</div>
				}
			</div>
		</div>
	);
}
SquadEditSheet.propTypes = {
	squad: PropTypes.object.isRequired,
	onClose: PropTypes.func.isRequired,
};

function SquadsSheet({ activeSquad, onSelectSquad }) {
	const { squads, fetchSquads, createSquad, renameSquad, deleteSquad } =
		useSquadStore();
	const [newName, setNewName] = useState("");
	const [showAdd, setShowAdd] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [editName, setEditName] = useState("");
	const [confirmDeleteId, setConfirmDeleteId] = useState(null);

	useEffect(() => {
		fetchSquads();
	}, [fetchSquads]);

	const handleCreate = async () => {
		const t = newName.trim();
		if (!t) return;
		await createSquad(t);
		setNewName("");
		setShowAdd(false);
	};

	const handleRename = async (id) => {
		const t = editName.trim();
		if (t) await renameSquad(id, t);
		setEditingId(null);
		setEditName("");
	};

	const handleDelete = async (id) => {
		await deleteSquad(id);
		if (activeSquad === id) onSelectSquad(null);
		setConfirmDeleteId(null);
	};

	return (
		<div className='flex flex-col gap-0 divide-y divide-lines/10'>
			{squads.length === 0 && (
				<p className='font-mono text-[9px] text-lines/30 text-center py-6'>
					No squads yet.
				</p>
			)}
			{squads.map((sq) =>
				editingId === sq._id ?
					<div
						key={sq._id}
						className='flex items-center gap-2 px-4 py-2.5'>
						<input
							autoFocus
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleRename(sq._id);
								if (e.key === "Escape") setEditingId(null);
							}}
							className='flex-1 font-mono text-[10px] bg-blk/60 border border-lines/20 focus:border-btn/60 text-fontz px-2 py-1 rounded outline-none'
						/>
						<button
							onClick={() => handleRename(sq._id)}
							disabled={!editName.trim()}
							className='w-6 h-6 flex items-center justify-center bg-btn/70 hover:bg-btn disabled:opacity-30 text-neutral-900 rounded-sm transition-colors'>
							<FontAwesomeIcon
								icon={faCheck}
								className='text-[7px]'
							/>
						</button>
						<button
							onClick={() => setEditingId(null)}
							className='w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-400 transition-colors'>
							<FontAwesomeIcon
								icon={faTimes}
								className='text-[7px]'
							/>
						</button>
					</div>
				: confirmDeleteId === sq._id ?
					<div
						key={sq._id}
						className='flex flex-col gap-2 px-4 py-2.5 bg-red-950/20'>
						<p className='font-mono text-[9px] text-lines/50'>
							Delete <span className='text-red-400'>{sq.name}</span>? Cannot be
							undone.
						</p>
						<div className='flex gap-2'>
							<button
								onClick={() => setConfirmDeleteId(null)}
								className='flex-1 font-mono text-[9px] tracking-widest uppercase border border-lines/20 hover:border-lines/40 text-lines/40 hover:text-fontz py-1 rounded transition-colors'>
								Cancel
							</button>
							<button
								onClick={() => handleDelete(sq._id)}
								className='flex-1 font-mono text-[9px] tracking-widest uppercase bg-red-700/80 hover:bg-red-700 text-white py-1 rounded transition-colors'>
								Confirm
							</button>
						</div>
					</div>
				:	<div
						key={sq._id}
						className={[
							"flex items-center gap-2 px-4 py-2.5 transition-colors",
							activeSquad === sq._id ? "bg-btn/10" : "hover:bg-lines/5",
						].join(" ")}>
						<button
							onClick={() =>
								onSelectSquad(activeSquad === sq._id ? null : sq._id)
							}
							className='flex-1 text-left'>
							<span
								className={[
									"font-mono text-[10px] tracking-wide",
									activeSquad === sq._id ?
										"text-btn"
									:	"text-fontz/70 hover:text-fontz",
								].join(" ")}>
								{sq.name}
							</span>
						</button>
						<button
							onClick={() => {
								setEditingId(sq._id);
								setEditName(sq.name);
							}}
							className='w-5 h-5 flex items-center justify-center text-neutral-700 hover:text-btn transition-colors'>
							<FontAwesomeIcon
								icon={faPen}
								className='text-[7px]'
							/>
						</button>
						<button
							onClick={() => setConfirmDeleteId(sq._id)}
							className='w-5 h-5 flex items-center justify-center text-neutral-700 hover:text-red-400 transition-colors'>
							<FontAwesomeIcon
								icon={faTrash}
								className='text-[7px]'
							/>
						</button>
					</div>,
			)}
			<div className='px-4 py-3'>
				{showAdd ?
					<div className='flex items-center gap-2'>
						<input
							autoFocus
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleCreate();
								if (e.key === "Escape") setShowAdd(false);
							}}
							placeholder='Squad name'
							className='flex-1 font-mono text-[10px] bg-blk/60 border border-lines/20 focus:border-btn/60 text-fontz placeholder-lines/30 px-2 py-1 rounded outline-none'
						/>
						<button
							onClick={handleCreate}
							disabled={!newName.trim()}
							className='w-6 h-6 flex items-center justify-center bg-btn/70 hover:bg-btn disabled:opacity-30 text-neutral-900 rounded-sm transition-colors'>
							<FontAwesomeIcon
								icon={faCheck}
								className='text-[7px]'
							/>
						</button>
						<button
							onClick={() => setShowAdd(false)}
							className='w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-400 transition-colors'>
							<FontAwesomeIcon
								icon={faTimes}
								className='text-[7px]'
							/>
						</button>
					</div>
				:	<button
						onClick={() => setShowAdd(true)}
						className='w-full flex items-center justify-center gap-1.5 font-mono text-[9px] tracking-widest uppercase border border-lines/20 hover:border-btn/40 text-lines/40 hover:text-btn py-1.5 rounded transition-colors'>
						<FontAwesomeIcon
							icon={faPlus}
							className='text-[7px]'
						/>
						New Squad
					</button>
				}
			</div>
		</div>
	);
}
SquadsSheet.propTypes = {
	activeSquad: PropTypes.string,
	onSelectSquad: PropTypes.func.isRequired,
};

function OperatorsPage() {
	const { setSelectedOperator, operators, fetchOperators } =
		useOperatorsStore();
	const { squads, fetchSquads } = useSquadStore();
	const { teams, fetchTeams } = useTeamsStore();
	const { open, SheetEl } = usePageSheet();
	const [dataUpdated, setDataUpdated] = useState(false);
	const [selectedOp, setSelectedOp] = useState(null);
	const [activeSquad, setActiveSquad] = useState(null);
	const [activeOpTab, setActiveOpTab] = useState("operators");
	const refreshData = () => setDataUpdated((p) => !p);
	const activeSquadName =
		squads.find((s) => s._id === activeSquad)?.name ?? "Active";

	useEffect(() => {
		fetchOperators();
		fetchSquads();
		fetchTeams();
	}, [fetchOperators, fetchSquads, fetchTeams, dataUpdated]);

	// Auto-select first active operator
	useEffect(() => {
		if (!selectedOp && operators.length > 0) {
			const first = operators.find(
				(o) => !o.support && !o.aviator && o.status?.toLowerCase() !== "kia",
			);
			if (first) {
				setSelectedOp(first);
				setSelectedOperator(first._id);
			}
		}
	}, [operators, selectedOp, setSelectedOperator]);

	const selectOp = (op) => {
		setSelectedOp(op);
		setSelectedOperator(op._id);
	};

	// Grouping helpers
	const getSquadId = (op) =>
		(typeof op.squad === "object" ? op.squad?._id : op.squad) ?? null;
	const regular = operators.filter((o) => !o.support && !o.aviator);
	const filtered =
		activeSquad ?
			regular.filter((o) => getSquadId(o) === activeSquad)
		:	regular;
	const active = filtered.filter((o) => {
		const s = o.status?.toLowerCase();
		return s !== "kia" && s !== "injured" && s !== "wounded";
	});
	const wia = filtered.filter((o) => {
		const s = o.status?.toLowerCase();
		return s === "injured" || s === "wounded";
	});
	const kia = filtered.filter((o) => o.status?.toLowerCase() === "kia");
	const support = operators.filter((o) => o.support);
	const aviators = operators.filter((o) => o.aviator);

	const statusDot = (op) => {
		const s = op.status?.toLowerCase();
		if (s === "kia") return "bg-red-500";
		if (s === "injured" || s === "wounded") return "bg-amber-400";
		return "bg-green-500";
	};

	const RowSection = ({ label, color, ops }) =>
		ops.length === 0 ?
			null
		:	<>
				<div
					className={`px-3 py-1 font-mono text-[7px] tracking-[0.3em] uppercase border-b border-neutral-800/80 ${color}`}>
					{label}
				</div>
				{ops.map((op) => {
					const assignedTeam = teams.find((t) =>
						t.operators?.some((m) => m._id === op._id),
					);
					return (
						<div
							key={op._id}
							className={[
								"w-full flex items-center gap-2 px-3 py-1.5 border-b border-neutral-800/40 transition-colors",
								selectedOp?._id === op._id ?
									"bg-neutral-700/60 border-l-2 border-l-btn"
								:	"hover:bg-neutral-800/60 border-l-2 border-l-transparent",
							].join(" ")}>
							<button
								onClick={() => selectOp(op)}
								className='flex items-center gap-2 flex-1 min-w-0 text-left'>
								<span
									className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(op)}`}
								/>
								<span className='font-mono text-[10px] text-neutral-200 truncate flex-1 leading-none'>
									{op.callSign || "—"}
								</span>
							</button>
							<button
								onClick={() =>
									open(
										"bottom",
										<AssignTeamSheet
											operator={op}
											onComplete={() => {
												fetchTeams();
												useSheetStore.getState().closeSheet();
											}}
										/>,
										"Assign to Team",
										`Assign ${op.callSign} to a team.`,
									)
								}
								className='font-mono text-[7px] tracking-widest uppercase shrink-0 px-1.5 py-0.5 rounded border border-neutral-800 hover:border-btn/40 transition-colors'>
								<span
									className={assignedTeam ? "text-btn" : "text-neutral-700"}>
									{assignedTeam ? assignedTeam.name : "—"}
								</span>
							</button>
						</div>
					);
				})}
			</>;

	return (
		<>
			{/* ── MOBILE ─────────────────────────────────────────── */}
			<div className='lg:hidden flex-1 overflow-y-auto'>
				<div className='p-3 flex flex-col gap-3'>
					<Panel
						title='Special Operations Force'
						badge='ACTIVE DUTY'
						badgeGreen
						className='min-h-[420px]'>
						<Roster
							dataUpdated={dataUpdated}
							refreshData={refreshData}
							openSheet={open}
							setClickedOperator={(op) => {
								setSelectedOp(op);
								setSelectedOperator(op._id);
							}}
						/>
					</Panel>
					<Panel
						title='Team Room'
						badge='Fire Teams'
						className='min-h-64'>
						<Teams
							dataUpdated={dataUpdated}
							refreshData={refreshData}
							openSheet={open}
						/>
					</Panel>
					<Panel
						title='Infirmary'
						badge='WIA'
						className='min-h-40'>
						<Infirmary
							dataUpdated={dataUpdated}
							refreshData={refreshData}
						/>
					</Panel>
					<Panel
						title='Fallen Ghost'
						badge='KIA'
						className='min-h-40'>
						<Memorial
							dataUpdated={dataUpdated}
							refreshData={refreshData}
						/>
					</Panel>
				</div>
			</div>

			{/* ── DESKTOP ─────────────────────────────────────────── */}
			<div className='hidden lg:flex flex-1 min-h-0 overflow-hidden'>
				{/* LEFT — Operator list */}
				<div className='w-80 shrink-0 flex flex-col border-r border-neutral-700/40 bg-neutral-900/60'>
					{/* Tab row: Operators | Enablers | Aviators | [Squads] [+] */}
					<div className='flex items-center border-b border-neutral-700/40 bg-neutral-900 shrink-0'>
						{[
							{ id: "operators", label: "Operators" },
							{ id: "enablers", label: "Enablers" },
							{ id: "aviators", label: "Aviators" },
						].map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveOpTab(tab.id)}
								className={[
									"font-mono text-[8px] tracking-widest uppercase px-3 py-2 border-b-2 shrink-0 transition-all",
									activeOpTab === tab.id ?
										"border-btn text-btn"
									:	"border-transparent text-neutral-600 hover:text-neutral-400",
								].join(" ")}>
								{tab.label}
							</button>
						))}
						<div className='ml-auto flex items-center gap-0.5 pr-2'>
							<button
								onClick={() =>
									open(
										"left",
										<SquadsSheet
											activeSquad={activeSquad}
											onSelectSquad={(id) => {
												setActiveSquad(id);
												useSheetStore.getState().closeSheet();
											}}
										/>,
										"Squads",
										"Manage fire team squads",
									)
								}
								className='font-mono text-[8px] tracking-widest uppercase px-2 py-1 border border-neutral-700/60 hover:border-btn/50 text-neutral-600 hover:text-btn rounded-sm transition-all'>
								Squads
							</button>
							<button
								onClick={() =>
									open(
										"left",
										<NewOperatorForm />,
										"New Operator",
										"Add an elite operator.",
									)
								}
								className='w-5 h-5 flex items-center justify-center bg-btn/80 hover:bg-btn text-neutral-900 rounded-sm transition-colors ml-1'
								title='Add operator'>
								<FontAwesomeIcon
									icon={faPlus}
									className='text-[8px]'
								/>
							</button>
						</div>
					</div>

					{/* Operator rows */}
					<div className='flex-1 overflow-y-auto '>
						{activeOpTab === "operators" && (
							<>
								<RowSection
									label={activeSquadName}
									color='text-neutral-600'
									ops={active}
								/>
								<RowSection
									label='WIA'
									color='text-amber-600/70'
									ops={wia}
								/>
								<RowSection
									label='KIA'
									color='text-red-700/60'
									ops={kia}
								/>
							</>
						)}
						{activeOpTab === "enablers" && (
							<RowSection
								label='Enablers'
								color='text-neutral-600'
								ops={support}
							/>
						)}
						{activeOpTab === "aviators" && (
							<RowSection
								label='Aviation'
								color='text-neutral-600'
								ops={aviators}
							/>
						)}
						{operators.length === 0 && (
							<div className='flex flex-col items-center justify-center gap-2 py-10'>
								<div className='w-5 h-5 border border-neutral-700 rotate-45' />
								<span className='font-mono text-[8px] tracking-widest text-neutral-700 uppercase'>
									No operators
								</span>
							</div>
						)}
					</div>
				</div>

				{/* CENTER — Operator profile */}
				<div className='w-80 shrink-0 min-h-0 overflow-y-auto border-r border-neutral-700/40 bg-neutral-950/30'>
					{selectedOp ?
						<OperatorImageView
							operator={selectedOp}
							openSheet={open}
						/>
					:	<div className='flex flex-col items-center justify-center h-full gap-3'>
							<div className='w-10 h-10 border border-neutral-700/50 rotate-45' />
							<span className='font-mono text-[9px] tracking-[0.3em] text-neutral-700 uppercase'>
								Select Operator
							</span>
						</div>
					}
				</div>

				{/* RIGHT — Teams + WIA/KIA */}

				<div className='flex-1 min-h-0 flex flex-col border-l border-neutral-800/40'>
					<div className='flex-1 min-h-0 flex flex-col bg-neutral-900/40'>
						<div className='flex items-center gap-2 px-3 py-2 border-b border-neutral-800/60 shrink-0'>
							<span className='w-1.5 h-1.5 rounded-full bg-btn/60 shrink-0' />
							<span className='font-mono text-[8px] tracking-[0.2em] text-neutral-500 uppercase flex-1'>
								Team Room
							</span>
							<span className='font-mono text-[7px] tracking-widest text-neutral-600 border border-neutral-800/60 px-1.5 py-0.5 rounded-sm'>
								Fire Teams
							</span>
						</div>
						<div className='flex-1 min-h-0 overflow-y-auto'>
							<Teams
								dataUpdated={dataUpdated}
								refreshData={refreshData}
								openSheet={open}
							/>
						</div>
					</div>
					<div className='shrink-0 flex flex-col border-t border-amber-900/20 bg-neutral-900/40'>
						<div className='flex items-center gap-2 px-3 py-2 border-b border-amber-900/20'>
							<span className='w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0' />
							<span className='font-mono text-[8px] tracking-[0.2em] text-neutral-500 uppercase flex-1'>
								Infirmary
							</span>
							<span className='font-mono text-[7px] tracking-widest text-amber-500/50 border border-amber-800/30 px-1.5 py-0.5 rounded-sm'>
								WIA
							</span>
						</div>
						<div className='overflow-y-auto max-h-32'>
							<Infirmary
								dataUpdated={dataUpdated}
								refreshData={refreshData}
							/>
						</div>
						<div className='flex items-center gap-2 px-3 py-2 border-y border-red-900/15'>
							<span className='w-1.5 h-1.5 rounded-full bg-red-500/40 shrink-0' />
							<span className='font-mono text-[8px] tracking-[0.2em] text-neutral-500 uppercase flex-1'>
								Fallen Ghost
							</span>
							<span className='font-mono text-[7px] tracking-widest text-red-500/40 border border-red-900/25 px-1.5 py-0.5 rounded-sm'>
								KIA
							</span>
						</div>
						<div className='overflow-y-auto max-h-32'>
							<Memorial
								dataUpdated={dataUpdated}
								refreshData={refreshData}
							/>
						</div>
					</div>
				</div>
			</div>
			{SheetEl}
		</>
	);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VEHICLES PAGE — unchanged
// ═══════════════════════════════════════════════════════════════════════════════

function VehiclesPage() {
	const { open, SheetEl } = usePageSheet();
	const [dataUpdated, setDataUpdated] = useState(false);
	const refreshData = () => setDataUpdated((p) => !p);
	return (
		<div className='flex-1 overflow-y-auto'>
			<div className='p-3 sm:p-4'>
				<Panel
					title='Asset Registry — Organic Assets'
					badge='S4-LOG'
					className='min-h-[500px]'>
					<Garage
						dataUpdated={dataUpdated}
						refreshData={refreshData}
						openSheet={open}
					/>
				</Panel>
			</div>
			{SheetEl}
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT SHELL
// ═══════════════════════════════════════════════════════════════════════════════

export default function UnifiedDashboard() {
	const [activeTab, setActiveTab] = useState("briefing");
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const activeNav = NAV.find((n) => n.id === activeTab);

	const { isAuthenticated, user, signIn, signUp, signOut } = useAuthService();
	const {
		missions,
		activeMission,
		loading: missionLoading,
		fetchMissions,
		createMission,
		loadMission,
		deleteMission,
	} = useMissionsStore();

	const [showNewMission, setShowNewMission] = useState(false);
	const [showMissionList, setShowMissionList] = useState(false);

	useEffect(() => {
		if (isAuthenticated) fetchMissions();
	}, [isAuthenticated, fetchMissions]);

	const handleCreateMission = async (name) => {
		await createMission(name);
		setShowNewMission(false);
	};

	const handleLoadMission = async (m) => {
		await loadMission(m._id);
		setShowMissionList(false);
	};

	const renderPage = () => {
		switch (activeTab) {
			case "briefing":
				return <BriefingPage onNewMission={() => setShowNewMission(true)} />;
			case "operators":
				return <OperatorsPage />;
			case "vehicles":
				return <VehiclesPage />;
			default:
				return null;
		}
	};

	return (
		<div className='h-screen w-screen flex flex-col overflow-hidden bg-neutral-900 text-fontz'>
			{/* ══ TOPBAR ══════════════════════════════════════════════════════ */}
			<header className='shrink-0 h-12 flex items-center gap-3 px-4 bg-neutral-950 border-b border-lines/25'>
				<div className='flex items-center gap-2 shrink-0'>
					<img
						src={iconUrl}
						alt='GhostOpsAI'
						className='w-20 h-20 lg:w-30 lg:h-30 xl:w-40 xl:h-40'
					/>
				</div>
				<div className='flex-1 h-px bg-gradient-to-r from-lines/15 to-transparent' />
				<div className='hidden sm:flex items-center gap-3 font-mono text-[10px] tracking-widest text-lines/40 uppercase'>
					<span className='flex items-center gap-1.5'>
						<FontAwesomeIcon
							icon={faWifi}
							className='text-green-500 text-[8px] animate-pulse'
						/>
						Link Active
					</span>
					<span className='text-lines/15'>|</span>
					<span>
						Mode: <span className='text-btn'>{activeNav?.label}</span>
					</span>
				</div>
				{isAuthenticated && (
					<>
						<ActiveMissionChip
							mission={activeMission}
							onClick={() => setShowMissionList(true)}
						/>
						<button
							onClick={() => setShowNewMission(true)}
							className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-lines/40 hover:text-btn border border-lines/15 hover:border-btn/30 bg-transparent hover:bg-btn/5 px-2 py-1 rounded-sm transition-all shrink-0'>
							<FontAwesomeIcon
								icon={faPlus}
								className='text-[8px]'
							/>
							<span className='hidden sm:inline'>New Op</span>
						</button>
						<button
							onClick={() => setShowMissionList(true)}
							className='flex items-center gap-1 text-lines/25 hover:text-btn transition-colors sm:hidden'>
							<FontAwesomeIcon
								icon={faFolderOpen}
								className='text-sm'
							/>
						</button>
					</>
				)}
				{!isAuthenticated && (
					<div className='flex items-center gap-2 shrink-0'>
						<button
							onClick={signIn}
							className='font-mono text-[10px] tracking-widest uppercase text-lines/50 hover:text-btn transition-colors'>
							Sign In
						</button>
						<button
							onClick={signUp}
							className='font-mono text-[9px] tracking-widest uppercase text-blk bg-btn hover:bg-highlight px-2.5 py-1 rounded-sm transition-colors'>
							Sign Up
						</button>
					</div>
				)}
				<HUDClock />
			</header>

			{/* ══ BODY ════════════════════════════════════════════════════════ */}
			<div className='flex flex-1 min-h-0 overflow-hidden'>
				<nav className='hidden lg:flex shrink-0 w-44 flex-col bg-neutral-950 border-r border-neutral-700/40'>
					<div className='px-3 pt-3 pb-1 flex items-center justify-between'>
						<span className='font-mono text-[9px] tracking-[0.28em] text-lines/25 uppercase'>
							Navigation
						</span>
						{isAuthenticated && (
							<button
								onClick={() => setShowMissionList(true)}
								title='Mission Log'
								className='text-lines/25 hover:text-btn transition-colors p-0.5'>
								<FontAwesomeIcon
									icon={faFolderOpen}
									className='text-[10px]'
								/>
							</button>
						)}
					</div>
					<div className='flex flex-col gap-0.5 p-1.5'>
						{NAV.map((n) => {
							const active = activeTab === n.id;
							return (
								<button
									key={n.id}
									onClick={() => setActiveTab(n.id)}
									className={[
										"group flex items-center gap-3 rounded px-2 py-2.5 w-full text-left border-l-2 transition-all duration-150 outline-none",
										active ?
											"border-btn bg-btn/10 text-btn"
										:	"border-transparent text-lines/45 hover:text-fontz hover:bg-white/[0.03]",
									].join(" ")}>
									<FontAwesomeIcon
										icon={n.icon}
										className={[
											"text-sm w-4 shrink-0 transition-colors",
											active ? "text-btn" : (
												"text-lines/35 group-hover:text-fontz"
											),
										].join(" ")}
									/>
									<div className='flex flex-col gap-0.5 flex-1 min-w-0'>
										<span
											className={[
												"font-mono text-[11px] tracking-widest uppercase leading-none truncate",
												active ? "text-btn" : "",
											].join(" ")}>
											{n.label}
										</span>
										<span className='font-mono text-[8px] tracking-widest text-lines/25 leading-none'>
											{n.sub}
										</span>
									</div>
									{active && (
										<FontAwesomeIcon
											icon={faChevronRight}
											className='ml-auto text-[8px] text-btn/50 shrink-0'
										/>
									)}
								</button>
							);
						})}
					</div>
					<div className='mt-auto border-t border-neutral-700/40'>
						{isAuthenticated ?
							<>
								<div className='flex items-center gap-2.5 px-3 py-3 border-b border-neutral-700/30'>
									<div className='w-8 h-8 rounded-full border border-neutral-600/40 overflow-hidden bg-neutral-700 shrink-0'>
										{user?.profile?.picture ?
											<img
												src={user.profile.picture}
												alt='avatar'
												className='w-full h-full object-cover'
											/>
										:	<div className='w-full h-full flex items-center justify-center'>
												<FontAwesomeIcon
													icon={faUser}
													className='text-lines/30 text-xs'
												/>
											</div>
										}
									</div>
									<div className='flex flex-col min-w-0'>
										<span className='font-mono text-[9px] text-fontz/70 truncate leading-none'>
											{user?.profile?.["cognito:username"] ||
												user?.profile?.preferred_username ||
												user?.profile?.email ||
												"GHOST-1"}
										</span>
										<span className='font-mono text-[8px] text-green-600 tracking-widest leading-none mt-1'>
											SYS:ONLINE
										</span>
									</div>
								</div>
								<div className='px-3 py-2.5'>
									<button
										onClick={signOut}
										className='w-full flex items-center justify-center gap-2 font-mono text-[9px] tracking-widest uppercase text-lines/35 hover:text-red-400 border border-lines/15 hover:border-red-900/40 bg-transparent hover:bg-red-900/10 rounded-sm py-1.5 transition-all'>
										<FontAwesomeIcon
											icon={faRightFromBracket}
											className='text-[9px]'
										/>
										Sign Out
									</button>
								</div>
							</>
						:	<div className='px-3 py-3 flex flex-col gap-2'>
								<button
									onClick={signIn}
									className='w-full font-mono text-[9px] tracking-widest uppercase text-lines/40 hover:text-btn border border-lines/15 hover:border-btn/30 rounded-sm py-1.5 transition-all'>
									Sign In
								</button>
								<button
									onClick={signUp}
									className='w-full font-mono text-[9px] tracking-widest uppercase text-blk bg-btn hover:bg-highlight rounded-sm py-1.5 transition-all'>
									Sign Up
								</button>
							</div>
						}
					</div>
				</nav>

				<main className='flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden'>
					<div className='shrink-0 h-9 flex items-center gap-2 px-3 sm:px-4 bg-neutral-900/80 border-b border-neutral-700/40'>
						<span className='font-mono text-[11px] tracking-[0.18em] text-btn uppercase whitespace-nowrap'>
							{activeNav?.label}
						</span>
						<span className='font-mono text-[10px] text-lines/25'>//</span>
						<span className='hidden md:block font-mono text-[10px] tracking-widest text-lines/25 uppercase truncate'>
							{activeMission ?
								activeMission.name
							:	"Ghost Recon Breakpoint — Tactical Operations Center"}
						</span>
						<div className='flex-1 h-px bg-gradient-to-r from-lines/10 to-transparent' />
						<span className='font-mono text-[9px] tracking-widest text-green-500 border border-green-900 px-1.5 py-0.5 rounded-sm whitespace-nowrap'>
							{activeNav?.sub}
						</span>
					</div>
					<div className='flex flex-col flex-1 min-h-0 overflow-hidden'>
						{renderPage()}
					</div>
				</main>
			</div>

			{/* ══ BOTTOM TAB BAR ══════════════════════════════════════════════ */}
			<nav className='lg:hidden shrink-0 flex flex-col border-t border-neutral-700/40 bg-neutral-950'>
				{isAuthenticated && mobileMenuOpen && (
					<div className='flex items-center justify-between px-4 py-2.5 border-b border-neutral-700/30 bg-neutral-800/60'>
						<span className='font-mono text-[8px] tracking-widest text-fontz/40 truncate'>
							{user?.profile?.["cognito:username"] ||
								user?.profile?.preferred_username ||
								user?.profile?.email ||
								"GHOST-1"}
						</span>
						<button
							onClick={signOut}
							className='flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase text-lines/35 hover:text-red-400 border border-lines/15 hover:border-red-900/40 hover:bg-red-900/10 px-2 py-1 rounded-sm transition-all'>
							<FontAwesomeIcon
								icon={faRightFromBracket}
								className='text-[8px]'
							/>
							Sign Out
						</button>
					</div>
				)}
				<div className='flex'>
					{NAV.map((n) => {
						const active = activeTab === n.id;
						return (
							<button
								key={n.id}
								onClick={() => {
									setActiveTab(n.id);
									setMobileMenuOpen(false);
								}}
								className={[
									"flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all duration-150",
									active ? "text-btn" : "text-lines/35 hover:text-fontz",
								].join(" ")}>
								<FontAwesomeIcon
									icon={n.icon}
									className={[
										"text-base transition-colors",
										active ? "text-btn" : "",
									].join(" ")}
								/>
								<span
									className={[
										"font-mono text-[8px] tracking-widest uppercase leading-none",
										active ? "text-btn" : "",
									].join(" ")}>
									{n.label.split(" ")[0]}
								</span>
								{active && <span className='w-4 h-0.5 rounded-full bg-btn' />}
							</button>
						);
					})}
					<button
						onClick={() => setMobileMenuOpen((prev) => !prev)}
						className={[
							"flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all duration-150",
							mobileMenuOpen ? "text-btn" : "text-lines/35 hover:text-fontz",
						].join(" ")}>
						<div className='w-5 h-5 rounded-full border border-lines/25 overflow-hidden bg-highlight'>
							{user?.profile?.picture ?
								<img
									src={user.profile.picture}
									alt='avatar'
									className='w-full h-full object-cover'
								/>
							:	<div className='w-full h-full flex items-center justify-center'>
									<FontAwesomeIcon
										icon={faUser}
										className='text-[9px] text-lines/40'
									/>
								</div>
							}
						</div>
						<span className='font-mono text-[8px] tracking-widest uppercase leading-none'>
							OPSEC
						</span>
						{mobileMenuOpen && (
							<span className='w-4 h-0.5 rounded-full bg-btn' />
						)}
					</button>
				</div>
			</nav>

			{/* ══ MODALS ══════════════════════════════════════════════════════ */}
			{showNewMission && (
				<NewMissionModal
					loading={missionLoading}
					onConfirm={handleCreateMission}
					onCancel={() => setShowNewMission(false)}
				/>
			)}
			{showMissionList && (
				<SheetSide
					openSheet='left'
					setOpenSheet={() => setShowMissionList(false)}
					side='left'
					title='Operations Log'
					description='GHOST-1 // Mission Archive'
					onClose={() => setShowMissionList(false)}
					content={
						<MissionListSheet
							missions={missions}
							activeMissionId={activeMission?._id}
							onLoad={handleLoadMission}
							onDelete={(id) => deleteMission(id)}
							onNew={() => {
								setShowMissionList(false);
								setShowNewMission(true);
							}}
						/>
					}
				/>
			)}
		</div>
	);
}

// ─── PropTypes ────────────────────────────────────────────────────────────────

Panel.propTypes = {
	title: PropTypes.string,
	badge: PropTypes.string,
	badgeGreen: PropTypes.bool,
	children: PropTypes.node,
	className: PropTypes.string,
	bodyClass: PropTypes.string,
};
BriefStatChip.propTypes = {
	label: PropTypes.string,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	live: PropTypes.bool,
};
IntelBody.propTypes = {
	hasBriefing: PropTypes.bool,
	missionBriefing: PropTypes.string,
	infilPoint: PropTypes.array,
	exfilPoint: PropTypes.array,
	rallyPoint: PropTypes.array,
};
BriefingPage.propTypes = {
	onNewMission: PropTypes.func,
};
