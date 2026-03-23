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
} from "@fortawesome/free-solid-svg-icons";

import {
	MapWrapper,
	SheetSide,
	WeatherPanel,
	AARSheet,
	PhaseList,
	PhaseReportSheet,
	CampaignView,
} from "@/components";
import { MissionGenerator } from "@/components/ai";
import {
	Roster,
	Infirmary,
	Memorial,
	Teams,
	Garage,
} from "@/components/tables";
import { useOperatorsStore, useSheetStore, useSquadStore } from "@/zustand";
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

// ─── Normalize stored point → [row, col] array ───────────────────────────────

function normalizePoint(pt) {
	if (!pt) return null;
	if (Array.isArray(pt) && pt.length >= 2) return [pt[0], pt[1]];
	if (typeof pt === "object") {
		const lat = pt.lat ?? pt.latitude ?? pt.y;
		const lng = pt.lng ?? pt.longitude ?? pt.x;
		if (lat != null && lng != null) return [lat, lng];
	}
	return null;
}

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
				"flex flex-col rounded-lg border border-lines/30 bg-blk/60 shadow-[0_4px_32px_rgba(0,0,0,0.75)] overflow-hidden",
				className,
			].join(" ")}>
			<div className='flex items-center gap-2 px-4 py-2.5 bg-blk/80 border-b border-lines/20 shrink-0'>
				<span
					className={[
						"w-1.5 h-1.5 rounded-full shrink-0",
						badgeGreen ?
							"bg-green-500 shadow-[0_0_6px_rgba(74,222,128,0.55)]"
						:	"bg-btn shadow-[0_0_6px_rgba(124,170,121,0.45)]",
					].join(" ")}
				/>
				<span className='font-mono text-[10px] tracking-[0.18em] text-lines uppercase flex-1 truncate'>
					{title}
				</span>
				{badge && (
					<span
						className={[
							"font-mono text-[9px] tracking-widest px-1.5 py-0.5 border rounded-sm",
							badgeGreen ?
								"text-green-400 border-green-900"
							:	"text-btn border-highlight/50",
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

function IntelBody({
	hasBriefing,
	missionBriefing,
	infilPoint,
	exfilPoint,
	rallyPoint,
}) {
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

	const coords = [
		infilPoint && {
			label: "INFIL",
			val: infilPoint,
			color: "rgba(68,195,72,0.65)",
			bg: "rgba(28,72,22,0.18)",
		},
		exfilPoint && {
			label: "EXFIL",
			val: exfilPoint,
			color: "rgba(95,158,232,0.65)",
			bg: "rgba(22,48,95,0.18)",
		},
		rallyPoint && {
			label: "RALLY",
			val: rallyPoint,
			color: "rgba(215,162,52,0.65)",
			bg: "rgba(88,58,12,0.18)",
		},
	].filter(Boolean);

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
			{coords.length > 0 && (
				<div className='shrink-0 flex flex-wrap border-b border-lines/10'>
					{coords.map(({ label, val, color, bg }) => (
						<div
							key={label}
							className='flex items-center gap-2 px-3 py-1.5 border-r border-lines/10 last:border-r-0'
							style={{ background: bg }}>
							<span
								className='font-mono text-[8px] tracking-widest uppercase'
								style={{ color: color.replace("0.65", "0.42") }}>
								{label}
							</span>
							<span
								className='font-mono text-[9px]'
								style={{ color }}>
								{Array.isArray(val) ?
									`${Number(val[0]).toFixed(0)}, ${Number(val[1]).toFixed(0)}`
								:	String(val)}
							</span>
						</div>
					))}
				</div>
			)}
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

	// ── Points ────────────────────────────────────────────────────────────────
	const infilPoint = normalizePoint(mapSource.infilPoint);
	const exfilPoint = normalizePoint(mapSource.exfilPoint);
	const rallyPoint = normalizePoint(mapSource.rallyPoint);

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
	const hasPoints = !!(infilPoint || exfilPoint || rallyPoint);

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
				infilPoint={infilPoint}
				exfilPoint={exfilPoint}
				rallyPoint={rallyPoint}
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
						{hasPoints && (
							<BriefStatChip
								label='Points'
								value='SET'
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
						{infilPoint && (
							<BriefStatChip
								label='Infil'
								value='SET'
								live
							/>
						)}
						{exfilPoint && (
							<BriefStatChip
								label='Exfil'
								value='SET'
								live
							/>
						)}
						{rallyPoint && (
							<BriefStatChip
								label='Rally'
								value='SET'
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
					<Panel
						title='Ghost Operations AI'
						badge='GEN-SYS'
						className='h-full'
						bodyClass='p-3'>
						<MissionGenerator {...mgProps} />
					</Panel>
					<Panel
						title={
							isAIMission && activeCampaignPhase ?
								`${activeMission?.province ?? "Tactical Map"} — ${activeCampaignPhase.label}`
							:	(activeMission?.province ?? "Tactical Map")
						}
						badge='AO-LIVE'
						badgeGreen
						className='h-full'
						bodyClass='overflow-hidden p-0'>
						<MapWrapper {...mapProps} />
					</Panel>
				</div>
			</div>

			{SheetEl}
		</>
	);
}
// ═══════════════════════════════════════════════════════════════════════════════
// OPERATORS PAGE — unchanged
// ═══════════════════════════════════════════════════════════════════════════════

function OperatorsPage() {
	const { setSelectedOperator, operators, fetchOperators } =
		useOperatorsStore();
	const { squads, activeSquadId } = useSquadStore();
	const { open, SheetEl } = usePageSheet();
	const [dataUpdated, setDataUpdated] = useState(false);
	const [clickedOperator, setClickedOperator] = useState(null);
	const refreshData = () => setDataUpdated((p) => !p);

	const PanelTitle =
		activeSquadId ?
			`${squads.find((s) => s._id === activeSquadId)?.name ?? "Squad"} `
		:	"Special Operations Force";

	useEffect(() => {
		fetchOperators();
	}, [fetchOperators]);

	return (
		<>
			<div className='lg:hidden flex-1 overflow-y-auto'>
				<div className='p-3 flex flex-col gap-3'>
					<Panel
						title={PanelTitle}
						badge='ACTIVE DUTY'
						badgeGreen
						className='min-h-[420px]'>
						<Roster
							operators={operators}
							setClickedOperator={(op) => {
								setClickedOperator(op);
								setSelectedOperator(op._id);
							}}
							dataUpdated={dataUpdated}
							refreshData={refreshData}
							openSheet={open}
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
			<div className='hidden lg:flex flex-1 min-h-0 overflow-hidden p-4 gap-4'>
				<Panel
					title={PanelTitle}
					badge='ACTIVE DUTY'
					badgeGreen
					className='w-[55%] shrink-0 min-h-0'>
					<Roster
						operators={operators}
						setClickedOperator={(op) => {
							setClickedOperator(op);
							setSelectedOperator(op._id);
						}}
						dataUpdated={dataUpdated}
						refreshData={refreshData}
						openSheet={open}
					/>
				</Panel>
				<div className='flex flex-col flex-1 min-h-0 gap-4'>
					<Panel
						title='Team Room'
						badge='Fire Teams'
						className='flex-1 min-h-0'>
						<Teams
							dataUpdated={dataUpdated}
							refreshData={refreshData}
							openSheet={open}
						/>
					</Panel>
					<div className='shrink-0 flex flex-col rounded-lg border border-lines/30 bg-blk/60 shadow-[0_4px_32px_rgba(0,0,0,0.75)] overflow-hidden'>
						<div className='flex items-center gap-2 px-4 py-2.5 bg-blk/80 border-b border-lines/20 shrink-0'>
							<span className='w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]' />
							<span className='font-mono text-[10px] tracking-[0.18em] text-lines uppercase flex-1'>
								Infirmary
							</span>
							<span className='font-mono text-[9px] tracking-widest text-amber-400 border border-amber-900/50 px-1.5 py-0.5 rounded-sm'>
								WIA
							</span>
						</div>
						<div className='overflow-y-auto max-h-36'>
							<Infirmary
								dataUpdated={dataUpdated}
								refreshData={refreshData}
							/>
						</div>
						<div className='flex items-center gap-3 px-4 py-1.5 bg-blk/50 border-y border-lines/15 shrink-0'>
							<span className='w-1 h-1 rounded-full bg-red-500/40' />
							<span className='font-mono text-[9px] tracking-[0.2em] text-lines/30 uppercase'>
								Fallen Ghost
							</span>
							<div className='flex-1 h-px bg-gradient-to-r from-lines/10 to-transparent' />
							<span className='font-mono text-[9px] tracking-widest text-red-500/40 border border-red-900/30 px-1.5 py-0.5 rounded-sm'>
								KIA
							</span>
						</div>
						<div className='overflow-y-auto max-h-36'>
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
		<div className='h-screen w-screen flex flex-col overflow-hidden bg-gradient-to-br from-background to-highlight text-fontz'>
			{/* ══ TOPBAR ══════════════════════════════════════════════════════ */}
			<header className='shrink-0 h-12 flex items-center gap-3 px-4 bg-blk/90 border-b border-lines/25'>
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
				<nav className='hidden lg:flex shrink-0 w-44 flex-col bg-blk/70 border-r border-lines/15'>
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
					<div className='mt-auto border-t border-lines/15'>
						{isAuthenticated ?
							<>
								<div className='flex items-center gap-2.5 px-3 py-3 border-b border-lines/10'>
									<div className='w-8 h-8 rounded-full border border-lines/25 overflow-hidden bg-highlight shrink-0'>
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
											{user?.profile?.email || "GHOST-1"}
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
					<div className='shrink-0 h-9 flex items-center gap-2 px-3 sm:px-4 bg-blk/35 border-b border-lines/15'>
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
			<nav className='lg:hidden shrink-0 flex flex-col border-t border-lines/20 bg-blk/95'>
				{isAuthenticated && mobileMenuOpen && (
					<div className='flex items-center justify-between px-4 py-2.5 border-b border-lines/10 bg-blk/60'>
						<span className='font-mono text-[8px] tracking-widest text-fontz/40 truncate'>
							{user?.profile?.email || "GHOST-1"}
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
