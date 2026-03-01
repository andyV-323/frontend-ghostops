import { useState, useEffect } from "react";
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
	faClipboardList,
} from "@fortawesome/free-solid-svg-icons";

import { MapWrapper, SheetSide, ReconTool } from "@/components";
import { MissionGenerator } from "@/components/ai";
import {
	Roster,
	Infirmary,
	Memorial,
	Teams,
	Garage,
} from "@/components/tables";
import { useOperatorsStore, useSheetStore } from "@/zustand";
import { useAuthService } from "@/services/AuthService";
import useMissionsStore from "@/zustand/useMissionsStore";

import NewMissionModal from "@/components/mission/NewMissionModal";
import MissionListSheet from "@/components/mission/MissionListSheet";
import ActiveMissionChip from "@/components/mission/ActiveMissionChip";
import ReconHistoryPanel from "@/components/mission/ReconHistoryPanel";
import { generateInsertionExtractionPoints } from "@/utils/generatePoints";
import iconUrl from "/icons/GhostOpsAI.svg?url";
import PropTypes from "prop-types";

// ─── Nav ─────────────────────────────────────────────────────
const NAV = [
	{
		id: "briefing",
		label: "Ops Briefing",
		sub: "Mission Control",
		icon: faCrosshairs,
	},
	{ id: "operators", label: "Personnel", sub: "Roster & Teams", icon: faUsers },
	{ id: "vehicles", label: "Motor Pool", sub: "Fleet Assets", icon: faTruck },
];

// ─── Normalize a stored point to [lat, lng] array ────────────
// Handles: [lat, lng] arrays, { lat, lng } objects, { latitude, longitude }
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

// ─── Clock ───────────────────────────────────────────────────
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

// ─── Panel ───────────────────────────────────────────────────
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

// ─── Sheet hook (ISR / page-level only) ──────────────────────
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

	return { open, SheetEl };
}

// ═══════════════════════════════════════════════════════════════
// BRIEFING PAGE
// ═══════════════════════════════════════════════════════════════

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

function IntelBody({
	hasBriefing,
	missionBriefing,
	infilPoint,
	exfilPoint,
	fallbackExfil,
}) {
	if (!hasBriefing) {
		return (
			<div className='flex flex-col items-center justify-center flex-1 gap-4 p-6'>
				<div className='grid grid-cols-3 gap-1 opacity-20'>
					{[...Array(9)].map((_, i) => (
						<div
							key={i}
							className='w-2 h-2 border border-lines/50'
						/>
					))}
				</div>
				<p className='font-mono text-[9px] tracking-[0.3em] text-lines/25 uppercase'>
					// Awaiting Mission Parameters //
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
		fallbackExfil && {
			label: "RALLY",
			val: fallbackExfil,
			color: "rgba(215,162,52,0.65)",
			bg: "rgba(88,58,12,0.18)",
		},
	].filter(Boolean);
	return (
		<div className='flex flex-col h-full'>
			<div className='shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-lines/15 bg-blk/50'>
				<span className='font-mono text-[8px] tracking-[0.35em] text-red-500/35 uppercase'>
					// TOP SECRET //
				</span>
				<span className='font-mono text-[8px] tracking-widest text-lines/20'>
					NOMAD-7
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
									`${Number(val[0]).toFixed(4)}, ${Number(val[1]).toFixed(4)}`
								:	String(val)}
							</span>
						</div>
					))}
				</div>
			)}
			<div className='flex-1 min-h-0 overflow-y-auto p-4'>
				<div className='flex items-center gap-2 mb-3'>
					<div className='w-2 h-px bg-lines/25' />
					<span className='font-mono text-[8px] tracking-[0.25em] text-lines/30 uppercase'>
						OPORD FIELD ANNEX B
					</span>
					<div className='flex-1 h-px bg-lines/10' />
				</div>
				<p className='font-mono text-xs leading-[2] text-fontz/75'>
					{missionBriefing}
				</p>
			</div>
		</div>
	);
}

function BriefingPage({ onNewMission }) {
	const {
		activeMission,
		saveMissionGenerator,
		saveMissionBriefing,
		addReconReport,
	} = useMissionsStore();

	// ── Derive all display values from store — zero local mission state ──
	const g = activeMission?.generator || {};
	const generationMode = g.generationMode || "random";
	const mapBounds = g.mapBounds || null;
	const imgURL = g.imgURL || "";
	const selectedLocations = g.selectedLocations || [];
	const briefingText = activeMission?.briefingText || "";

	// Normalize stored points → [lat, lng] arrays for Leaflet
	// (generateInsertionExtractionPoints output varies; normalizePoint handles all shapes)
	const infilPoint = normalizePoint(g.infilPoint);
	const exfilPoint = normalizePoint(g.exfilPoint);
	const fallbackExfil = normalizePoint(g.fallbackExfil);

	const locationSelection = generationMode === "ops" ? selectedLocations : [];
	const randomLocationSelection =
		generationMode === "random" ? selectedLocations : [];

	const hasBriefing = !!briefingText;
	const hasPoints = !!(infilPoint || exfilPoint);
	const reconCount = activeMission?.reconReports?.length || 0;

	// ── onGenerate* callbacks — ONLY place we write to the store ─
	//
	// MissionGenerator calls setMapBounds/setImgURL/setInfilPoint etc. as
	// intermediate steps — those are noops below. The full snapshot including
	// insertion/extraction points is computed HERE and saved in one write.
	//
	const computePoints = (data) => {
		try {
			const coords = (data.randomSelection || [])
				.map((loc) => loc.coordinates)
				.filter(Boolean);
			return generateInsertionExtractionPoints({
				bounds: data.bounds,
				missionCoordinates: coords,
				allProvinceCoordinates: data.allProvinceCoordinates || [],
				maxAttempts: 20000,
			});
		} catch (e) {
			console.warn("Point generation failed:", e.message);
			return { infilPoint: null, exfilPoint: null, fallbackExfil: null };
		}
	};

	const handleGenerateRandomOps = (data) => {
		if (!activeMission?._id) return;
		const pts = computePoints(data);
		saveMissionGenerator(
			activeMission._id,
			{
				generationMode: "random",
				selectedLocations: data.randomSelection,
				mapBounds: data.bounds,
				imgURL: data.imgURL || "",
				infilPoint: pts.infilPoint,
				exfilPoint: pts.exfilPoint,
				fallbackExfil: pts.fallbackExfil,
			},
			data.selectedProvince,
			data.biome,
		);
	};

	const handleGenerateOps = (data) => {
		if (!activeMission?._id) return;
		const pts = computePoints(data);
		saveMissionGenerator(
			activeMission._id,
			{
				generationMode: "ops",
				selectedLocations: data.randomSelection,
				mapBounds: data.bounds,
				imgURL: data.imgURL || "",
				infilPoint: pts.infilPoint,
				exfilPoint: pts.exfilPoint,
				fallbackExfil: pts.fallbackExfil,
			},
			data.selectedProvince,
			data.biome,
		);
	};

	const handleGenerateAIMission = (data) => {
		if (!activeMission?._id) return;
		// AI briefing: keep existing generator data, only update briefing text
		// (map + points were set in the prior generate call)
		saveMissionBriefing(activeMission._id, data.briefing || data.result || "");
	};

	// ── Sheets ───────────────────────────────────────────────────
	const { open: openSheet, SheetEl } = usePageSheet();

	const openReconSheet = () =>
		openSheet(
			"right",
			<ReconTool
				mission={activeMission}
				onSave={(payload) => addReconReport(activeMission._id, payload)}
			/>,
			"Recon Debrief",
			"ISR // Post-Mission Assessment",
		);

	const openReconHistory = () =>
		openSheet(
			"right",
			<ReconHistoryPanel mission={activeMission} />,
			"Recon Reports",
			`${reconCount} filed — ${activeMission?.name}`,
		);

	// ── Props for MissionGenerator ───────────────────────────────
	// NO-OP setters: MissionGenerator calls these directly for live preview
	// inside its own internal state. We don't need to intercept them — the
	// full result is captured in onGenerateRandomOps / onGenerateOps above.
	const noop = () => {};
	const mgProps = {
		onGenerateRandomOps: handleGenerateRandomOps,
		onGenerateOps: handleGenerateOps,
		onGenerateAIMission: handleGenerateAIMission,
		setMapBounds: noop,
		setImgURL: noop,
		setGenerationMode: noop,
		setInfilPoint: noop,
		setExfilPoint: noop,
		setFallbackExfil: noop,
		setMissionBriefing: noop,
		generationMode,
	};

	const mapProps = {
		mapBounds,
		locationSelection,
		randomLocationSelection,
		imgURL,
		generationMode,
		infilPoint,
		exfilPoint,
		fallbackExfil,
	};

	const ActionButtons = (
		<div className='flex items-center gap-2'>
			{reconCount > 0 && (
				<button
					onClick={openReconHistory}
					className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-lines/45 hover:text-fontz border border-lines/15 hover:border-lines/35 bg-transparent hover:bg-white/[0.03] px-2 py-1 rounded-sm transition-all'>
					<FontAwesomeIcon
						icon={faClipboardList}
						className='text-[8px]'
					/>
					<span className='hidden sm:inline'>Reports</span>
					<span className='font-mono text-[9px] text-btn ml-0.5'>
						{reconCount}
					</span>
				</button>
			)}
			<button
				onClick={openReconSheet}
				className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-btn hover:text-white border border-btn/30 hover:border-btn/60 bg-btn/5 hover:bg-btn/15 px-2 py-1 rounded-sm transition-all'>
				<FontAwesomeIcon
					icon={faCrosshairs}
					className='text-[8px]'
				/>
				ISR
			</button>
		</div>
	);

	// ── No mission ───────────────────────────────────────────────
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
			{/* ══ MOBILE ══════════════════════════════════════════════ */}
			<div className='lg:hidden flex-1 overflow-y-auto'>
				<div className='p-3 flex flex-col gap-3'>
					<div className='flex flex-wrap items-center gap-2'>
						<span className='font-mono text-[9px] tracking-widest text-btn/70 uppercase truncate max-w-[150px]'>
							{activeMission.name}
						</span>
						<div className='w-px h-3 bg-lines/20' />
						<BriefStatChip
							label='Mode'
							value={generationMode === "random" ? "RAND" : "OPS"}
						/>
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
						title='Intel Briefing'
						badge={hasBriefing ? "TS//SCI" : "STANDBY"}
						badgeGreen={hasBriefing}
						className='h-64'>
						<IntelBody
							hasBriefing={hasBriefing}
							missionBriefing={briefingText}
							infilPoint={infilPoint}
							exfilPoint={exfilPoint}
							fallbackExfil={fallbackExfil}
						/>
					</Panel>

					<Panel
						title='Tactical Map'
						badge='AO-LIVE'
						badgeGreen
						className='h-72'
						bodyClass='overflow-hidden p-0'>
						<MapWrapper {...mapProps} />
					</Panel>
				</div>
			</div>

			{/* ══ DESKTOP ═════════════════════════════════════════════ */}
			<div className='hidden lg:flex flex-1 min-h-0 overflow-hidden flex-col p-4 gap-3'>
				<div className='shrink-0 flex items-center gap-3'>
					<span className='font-mono text-[9px] tracking-widest text-btn/70 uppercase truncate max-w-[200px] shrink-0'>
						{activeMission.name}
					</span>
					<div className='w-px h-3 bg-lines/20 shrink-0' />
					<div className='flex flex-wrap gap-2'>
						<BriefStatChip
							label='Mode'
							value={generationMode === "random" ? "RANDOM" : "OPS"}
						/>
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
						{reconCount > 0 && (
							<BriefStatChip
								label='Recon'
								value={reconCount}
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
					<div className='flex flex-col gap-3 min-h-0 overflow-hidden'>
						<Panel
							title='Mission Generator'
							badge='GEN-SYS'
							className='flex-[3] min-h-0'
							bodyClass='p-3'>
							<MissionGenerator {...mgProps} />
						</Panel>
						<Panel
							title='Intel Briefing'
							badge={hasBriefing ? "TS//SCI" : "STANDBY"}
							badgeGreen={hasBriefing}
							className='flex-[2] min-h-0'>
							<IntelBody
								hasBriefing={hasBriefing}
								missionBriefing={briefingText}
								infilPoint={infilPoint}
								exfilPoint={exfilPoint}
								fallbackExfil={fallbackExfil}
							/>
						</Panel>
					</div>
					<Panel
						title='Tactical Map'
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

// ═══════════════════════════════════════════════════════════════
// OPERATORS PAGE — unchanged
// ═══════════════════════════════════════════════════════════════
function OperatorsPage() {
	const { setSelectedOperator, operators, fetchOperators } =
		useOperatorsStore();
	const { open, SheetEl } = usePageSheet();
	const [dataUpdated, setDataUpdated] = useState(false);
	const [clickedOperator, setClickedOperator] = useState(null);
	const refreshData = () => setDataUpdated((p) => !p);
	useEffect(() => {
		fetchOperators();
	}, [fetchOperators]);
	return (
		<>
			<div className='lg:hidden flex-1 overflow-y-auto'>
				<div className='p-3 flex flex-col gap-3'>
					<Panel
						title='Operator Roster'
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
						title='Team Assignments'
						badge='ODA'
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
					title='Operator Roster'
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
						title='Team Assignments'
						badge='ODA'
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

// ═══════════════════════════════════════════════════════════════
// VEHICLES PAGE — unchanged
// ═══════════════════════════════════════════════════════════════
function VehiclesPage() {
	const { open, SheetEl } = usePageSheet();
	const [dataUpdated, setDataUpdated] = useState(false);
	const refreshData = () => setDataUpdated((p) => !p);
	return (
		<div className='flex-1 overflow-y-auto'>
			<div className='p-3 sm:p-4'>
				<Panel
					title='Motor Pool — Vehicle Registry'
					badge='FLEET'
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

// ═══════════════════════════════════════════════════════════════
// ROOT SHELL
// ═══════════════════════════════════════════════════════════════
export default function UnifiedDashboard() {
	const [activeTab, setActiveTab] = useState("briefing");
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
		await loadMission(m._id); // full fetch including reconReports
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
		<div className='h-screen w-screen flex flex-col overflow-hidden bg-gradient-to-br from-blk via-background to-neutral-800 text-fontz'>
			{/* ══ TOPBAR ══════════════════════════════════════════════ */}
			<header className='shrink-0 h-12 flex items-center gap-3 px-4 bg-blk/90 border-b border-lines/25'>
				<div className='flex items-center gap-2 shrink-0'>
					<img
						src={iconUrl}
						alt='description'
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

			{/* ══ BODY ════════════════════════════════════════════════ */}
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
											{user?.profile?.email || "NOMAD-7"}
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

			{/* ══ BOTTOM TAB BAR ══════════════════════════════════════ */}
			<nav className='lg:hidden shrink-0 flex border-t border-lines/20 bg-blk/95'>
				{NAV.map((n) => {
					const active = activeTab === n.id;
					return (
						<button
							key={n.id}
							onClick={() => setActiveTab(n.id)}
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
			</nav>

			{/* ══ MISSION MODAL ════════════════════════════════════════ */}
			{showNewMission && (
				<NewMissionModal
					loading={missionLoading}
					onConfirm={handleCreateMission}
					onCancel={() => setShowNewMission(false)}
				/>
			)}

			{/* ══ MISSION LIST SHEET — isolated from useSheetStore ════ */}
			{showMissionList && (
				<SheetSide
					openSheet='left'
					setOpenSheet={() => setShowMissionList(false)}
					side='left'
					title='Operations Log'
					description='NOMAD-7 // Mission Archive'
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

Panel.propTypes = {
	title: PropTypes.string,
	badge: PropTypes.string,
	badgeGreen: PropTypes.bool,
	children: PropTypes.object,
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
	fallbackExfil: PropTypes.array,
};
BriefingPage.propTypes = {
	onNewMission: PropTypes.func,
};
