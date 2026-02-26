// Briefing.jsx — JSOC Operations Center Theme

import { useState, useEffect } from "react";
import { MapWrapper, SheetSide, ReconTool } from "@/components";
import { MissionGenerator } from "@/components/ai";
import { useOperatorsStore, useSheetStore, useTeamsStore } from "@/zustand";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faLocationDot,
	faShieldHalved,
	faMapLocationDot,
	faSatelliteDish,
	faChevronDown,
	faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

/* ─────────────────────────────────────────────────────────────
   GLOBAL MILITARY STYLES — injected once into <head>
   Oswald = stencil display font  |  Share Tech Mono = HUD readout
───────────────────────────────────────────────────────────── */
const MIL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Oswald:wght@300;400;500;600;700&display=swap');

  /* ── Base token overrides for this page ── */
  .mil-root {
    --c-bg:        #050805;
    --c-panel:     rgba(7, 11, 5, 0.96);
    --c-border:    rgba(78, 102, 42, 0.38);
    --c-border-hi: rgba(138, 178, 58, 0.55);
    --c-text-dim:  rgba(130, 162, 72, 0.45);
    --c-text-mid:  rgba(162, 198, 98, 0.72);
    --c-text-hi:   rgba(195, 225, 138, 0.88);
    --c-accent:    #7ab832;
    --c-red:       rgba(210, 48, 48, 0.52);
    background: var(--c-bg);
  }

  /* ── Fonts ── */
  .f-stencil { font-family: 'Oswald', sans-serif; letter-spacing: 0.16em; text-transform: uppercase; }
  .f-hud     { font-family: 'Share Tech Mono', monospace; }

  /* ── Panel shell ── */
  .mil-panel {
    position: relative;
    background: var(--c-panel);
    border: 1px solid var(--c-border);
    overflow: hidden;
  }

  /* Corner brackets — top-left & bottom-right */
  .mil-panel::before,
  .mil-panel::after {
    content: '';
    position: absolute;
    width: 14px; height: 14px;
    pointer-events: none;
    z-index: 5;
  }
  .mil-panel::before {
    top: -1px; left: -1px;
    border-top:  2px solid var(--c-border-hi);
    border-left: 2px solid var(--c-border-hi);
  }
  .mil-panel::after {
    bottom: -1px; right: -1px;
    border-bottom: 2px solid var(--c-border-hi);
    border-right:  2px solid var(--c-border-hi);
  }

  /* Additional bracket — top-right */
  .mil-panel .bracket-tr,
  .mil-panel .bracket-bl {
    position: absolute;
    width: 14px; height: 14px;
    pointer-events: none; z-index: 5;
  }
  .mil-panel .bracket-tr { top: -1px; right: -1px;
    border-top:   2px solid var(--c-border-hi);
    border-right: 2px solid var(--c-border-hi); }
  .mil-panel .bracket-bl { bottom: -1px; left: -1px;
    border-bottom: 2px solid var(--c-border-hi);
    border-left:   2px solid var(--c-border-hi); }

  /* ── Subtle scanline overlay ── */
  .mil-scanlines::after {
    content: '';
    position: absolute; inset: 0;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 3px,
      rgba(0,0,0,0.055) 3px, rgba(0,0,0,0.055) 4px
    );
    pointer-events: none; z-index: 2;
  }

  /* ── Grid-paper background (for Intel panel) ── */
  .mil-grid {
    background-image:
      linear-gradient(rgba(72,102,35,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(72,102,35,0.07) 1px, transparent 1px);
    background-size: 22px 22px;
  }

  /* ── Diagonal hazard stripe ── */
  .mil-hazard {
    background: repeating-linear-gradient(
      -45deg,
      rgba(165,120,0,0.09), rgba(165,120,0,0.09) 3px,
      transparent 3px, transparent 10px
    );
  }

  /* ── Panel header ── */
  .mil-header {
    background: linear-gradient(
      90deg,
      rgba(85,125,40,0.28) 0%,
      rgba(75,108,35,0.10) 50%,
      transparent 100%
    );
    border-bottom: 1px solid rgba(88,122,42,0.32);
  }

  /* ── Range-card (stat chip border style) ── */
  .range-card {
    background: rgba(6,10,4,0.75);
    border: 1px solid rgba(72,98,38,0.30);
    border-top: 2px solid rgba(112,152,52,0.48);
  }

  /* ── Status dot animations ── */
  @keyframes pulse-live {
    0%,100% { box-shadow: 0 0 0 0   rgba(100,175,42,0.7); opacity:1; }
    55%     { box-shadow: 0 0 0 6px rgba(100,175,42,0);   opacity:.7; }
  }
  @keyframes pulse-std {
    0%,100% { opacity:1; }  50% { opacity:.6; }
  }
  .dot-live { border-radius:50%; background:#7ac038; animation: pulse-live 2.2s ease-in-out infinite; }
  .dot-std  { border-radius:50%; background:#8ab858; animation: pulse-std  3.0s ease-in-out infinite; }

  /* ── Blinking cursor ── */
  @keyframes cur { 0%,100%{opacity:1} 50%{opacity:0} }
  .blink-cursor::after {
    content:'_'; font-size:10px; margin-left:2px;
    color: rgba(130,185,55,0.65);
    animation: cur 1.1s step-end infinite;
  }

  /* ── Classification stamp ── */
  .stamp {
    display: inline-block;
    border: 2px solid var(--c-red);
    color: var(--c-red);
    font-family: 'Oswald', sans-serif;
    font-size: 8px; letter-spacing: 0.38em;
    padding: 1px 6px;
    transform: rotate(-1.5deg);
    text-transform: uppercase;
    white-space: nowrap;
  }

  /* ── Horizontal rule with label ── */
  .mil-rule {
    display: flex; align-items: center; gap: 8px;
  }
  .mil-rule::before, .mil-rule::after {
    content: ''; flex: 1; height: 1px;
    background: rgba(80,108,40,0.22);
  }
`;

function InjectMilStyles() {
	useEffect(() => {
		if (document.getElementById("mil-brief-v3")) return;
		const el = document.createElement("style");
		el.id = "mil-brief-v3";
		el.textContent = MIL_CSS;
		document.head.appendChild(el);
		return () => {
			try {
				document.head.removeChild(el);
			} catch {}
		};
	}, []);
	return null;
}

/* ─────────────────────────────────────────────────────────────
   PANEL
───────────────────────────────────────────────────────────── */
function Panel({
	title,
	sectionId,
	badge,
	badgeGreen = false,
	children,
	className = "",
	bodyClass = "",
}) {
	const [open, setOpen] = useState(true);

	return (
		<div
			className={["mil-panel mil-scanlines flex flex-col", className].join(
				" ",
			)}>
			{/* All-corner bracket elements (::before/::after cover TL+BR, these cover TR+BL) */}
			<span
				className='bracket-tr'
				aria-hidden
			/>
			<span
				className='bracket-bl'
				aria-hidden
			/>

			{/* Header */}
			<button
				onClick={() => setOpen((p) => !p)}
				className='mil-header shrink-0 flex items-center gap-2.5 px-3 py-2 w-full text-left relative z-10'>
				{/* Section tag */}
				{sectionId && (
					<span className='f-hud text-[8px] text-[var(--c-text-dim)] border border-[rgba(78,102,42,0.3)] px-1.5 py-0.5 shrink-0 leading-none tracking-widest'>
						{sectionId}
					</span>
				)}

				{/* Live dot */}
				<span
					className={["shrink-0", badgeGreen ? "dot-live" : "dot-std"].join(
						" ",
					)}
					style={{ width: 7, height: 7 }}
				/>

				{/* Title */}
				<span className='f-stencil text-[11px] font-semibold text-[var(--c-text-mid)] flex-1 truncate'>
					{title}
				</span>

				{/* Badge */}
				{badge && (
					<span
						className={[
							"f-hud text-[8px] border px-1.5 py-0.5 shrink-0 leading-none tracking-widest",
							badgeGreen ?
								"text-[rgba(88,198,52,0.65)] border-[rgba(68,155,35,0.42)]"
							:	"text-[var(--c-text-dim)] border-[rgba(78,102,42,0.35)]",
						].join(" ")}>
						{badge}
					</span>
				)}

				{/* Mobile chevron */}
				<FontAwesomeIcon
					icon={open ? faChevronUp : faChevronDown}
					className='lg:hidden text-[rgba(88,115,45,0.38)] text-[8px] shrink-0'
				/>
			</button>

			{/* Body */}
			<div
				className={[
					open ? "flex" : "hidden",
					"lg:flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10",
					bodyClass,
				].join(" ")}>
				{children}
			</div>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────
   STAT CHIP
───────────────────────────────────────────────────────────── */
function StatChip({ label, value, live = false }) {
	return (
		<div className='range-card flex items-center gap-2 px-2.5 py-1.5'>
			<span
				className={live ? "dot-live" : "dot-std"}
				style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0 }}
			/>
			<span className='f-hud text-[8px] tracking-[0.22em] text-[var(--c-text-dim)] uppercase'>
				{label}
			</span>
			{value !== undefined && (
				<span className='f-hud text-[10px] text-[var(--c-text-mid)] tabular-nums'>
					{value}
				</span>
			)}
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────
   INTEL BRIEFING BODY
───────────────────────────────────────────────────────────── */
function IntelBody({
	hasBriefing,
	missionBriefing,
	infilPoint,
	exfilPoint,
	fallbackExfil,
}) {
	if (!hasBriefing) {
		return (
			<div className='flex flex-col items-center justify-center flex-1 gap-5 p-6 mil-grid'>
				{/* Dead-signal grid */}
				<div className='grid grid-cols-5 gap-1 opacity-25'>
					{[...Array(15)].map((_, i) => (
						<div
							key={i}
							className='w-2 h-2 border border-[rgba(90,125,42,0.6)]'
							style={{ opacity: Math.random() > 0.45 ? 1 : 0.15 }}
						/>
					))}
				</div>
				<div className='text-center flex flex-col gap-1.5'>
					<p className='f-hud text-[9px] text-[var(--c-text-dim)] tracking-[0.35em] uppercase blink-cursor'>
						INTEL FEED OFFLINE
					</p>
					<p className='f-hud text-[8px] text-[rgba(78,100,40,0.28)] tracking-[0.28em] uppercase'>
						GENERATE MISSION TO UPLINK
					</p>
				</div>
			</div>
		);
	}

	const coords = [
		infilPoint && {
			label: "INFIL",
			val: infilPoint,
			color: "rgba(68,195,72,0.65)",
			border: "rgba(48,140,42,0.32)",
			bg: "rgba(28,72,22,0.22)",
		},
		exfilPoint && {
			label: "EXFIL",
			val: exfilPoint,
			color: "rgba(95,158,232,0.65)",
			border: "rgba(55,98,178,0.32)",
			bg: "rgba(22,48,95,0.22)",
		},
		fallbackExfil && {
			label: "RALLY",
			val: fallbackExfil,
			color: "rgba(215,162,52,0.65)",
			border: "rgba(155,108,28,0.35)",
			bg: "rgba(88,58,12,0.22)",
		},
	].filter(Boolean);

	return (
		<div className='flex flex-col h-full'>
			{/* Hazard-stripe classification bar */}
			<div className='shrink-0 mil-hazard flex items-center justify-between px-3 py-1.5 border-b border-[rgba(88,115,42,0.2)]'>
				<span className='stamp'>Top Secret</span>
				<span className='f-hud text-[8px] tracking-[0.28em] text-[rgba(88,112,42,0.38)] uppercase'>
					NOMAD-7 // EYES ONLY
				</span>
			</div>

			{/* Coordinate strips */}
			{coords.length > 0 && (
				<div className='shrink-0 flex flex-wrap border-b border-[rgba(78,100,38,0.18)]'>
					{coords.map(({ label, val, color, border, bg }) => (
						<div
							key={label}
							className='flex items-center gap-2 px-3 py-1.5 border-r border-[rgba(78,100,38,0.15)] last:border-r-0'
							style={{ background: bg }}>
							<FontAwesomeIcon
								icon={faLocationDot}
								style={{ color, fontSize: 8 }}
							/>
							<span
								className='f-hud text-[8px] tracking-widest uppercase'
								style={{ color: color.replace("0.65", "0.42") }}>
								{label}
							</span>
							<span
								className='f-hud text-[9px]'
								style={{ color }}>
								{val}
							</span>
						</div>
					))}
				</div>
			)}

			{/* Briefing text area */}
			<div className='flex-1 min-h-0 overflow-y-auto p-4 mil-grid'>
				<div className='mil-rule mb-3'>
					<span className='f-stencil text-[8px] font-medium text-[rgba(95,125,45,0.4)] whitespace-nowrap'>
						OPORD — FIELD ANNEX B
					</span>
				</div>
				<p className='f-hud text-[11px] leading-[2.1] text-[rgba(178,208,132,0.78)]'>
					{missionBriefing}
				</p>
			</div>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────
   TACTICAL MAP PANEL
───────────────────────────────────────────────────────────── */
function TacMapPanel({ activeAOs, mapWrapperProps }) {
	return (
		<div className='flex flex-col flex-1 min-h-0 relative'>
			{/* AO tag strip */}
			{activeAOs.length > 0 && (
				<div
					className='shrink-0 flex flex-wrap items-center gap-1.5 px-3 py-1.5 border-b border-[rgba(78,100,38,0.2)]'
					style={{ background: "rgba(5,8,4,0.85)" }}>
					<span className='f-hud text-[7px] tracking-[0.28em] text-[var(--c-text-dim)] uppercase mr-1'>
						AO
					</span>
					{activeAOs.map((ao) => (
						<span
							key={ao}
							className='f-hud text-[9px] px-1.5 py-0.5 border tracking-widest'
							style={{
								color: "rgba(148,192,68,0.7)",
								background: "rgba(58,82,22,0.2)",
								borderColor: "rgba(92,128,42,0.35)",
							}}>
							{ao}
						</span>
					))}
				</div>
			)}

			{/* Map */}
			<div className='flex-1 min-h-0 relative'>
				{/* Corner bracket overlays on the map itself */}
				{[
					{
						top: 8,
						left: 8,
						borderTop: "2px solid rgba(128,182,52,0.5)",
						borderLeft: "2px solid rgba(128,182,52,0.5)",
					},
					{
						top: 8,
						right: 8,
						borderTop: "2px solid rgba(128,182,52,0.5)",
						borderRight: "2px solid rgba(128,182,52,0.5)",
					},
					{
						bottom: 8,
						left: 8,
						borderBottom: "2px solid rgba(128,182,52,0.5)",
						borderLeft: "2px solid rgba(128,182,52,0.5)",
					},
					{
						bottom: 8,
						right: 8,
						borderBottom: "2px solid rgba(128,182,52,0.5)",
						borderRight: "2px solid rgba(128,182,52,0.5)",
					},
				].map((s, i) => (
					<div
						key={i}
						className='absolute z-[800] pointer-events-none'
						style={{ width: 18, height: 18, ...s }}
					/>
				))}
				<MapWrapper {...mapWrapperProps} />
			</div>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────
   COMMAND BAR  (desktop top strip)
───────────────────────────────────────────────────────────── */
function CommandBar({ operators, teams, activeAOs, hasBriefing }) {
	return (
		<div className='shrink-0 range-card flex items-center gap-4 px-4 py-2'>
			{/* Signal bars — decorative rank indicator */}
			<div className='flex gap-0.5 items-end shrink-0'>
				{[6, 10, 14, 10, 6].map((h, i) => (
					<div
						key={i}
						className='w-1.5 rounded-sm'
						style={{
							height: h,
							background: `rgba(118,175,48,${0.14 + i * 0.09})`,
						}}
					/>
				))}
			</div>

			<div className='flex flex-col leading-none'>
				<span className='f-stencil text-[12px] font-bold text-[var(--c-text-mid)]'>
					JSOC — Mission Control
				</span>
				<span className='f-hud text-[8px] text-[var(--c-text-dim)] tracking-[0.2em] mt-0.5'>
					OPS CENTER // ACTIVE
				</span>
			</div>

			<div className='flex-1 h-px bg-[rgba(75,102,38,0.2)]' />

			{/* Stat chips */}
			<div className='flex flex-wrap gap-2'>
				<StatChip
					label='Pax'
					value={operators.length}
					live
				/>
				<StatChip
					label='Teams'
					value={teams.length}
				/>
				<StatChip
					label='Active AOs'
					value={activeAOs.length}
				/>
				{hasBriefing && (
					<StatChip
						label='Brief'
						value='READY'
						live
					/>
				)}
			</div>

			{/* Classification stamp */}
			<span className='stamp ml-1'>Top Secret</span>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────
   BRIEFING PAGE
───────────────────────────────────────────────────────────── */
const Briefing = () => {
	const [randomLocationSelection, setRandomLocationSelection] = useState([]);
	const [locationSelection, setLocationSelection] = useState([]);
	const [mapBounds, setMapBounds] = useState(null);
	const [imgURL, setImgURL] = useState("");
	const [generationMode, setGenerationMode] = useState("random");
	const [missionBriefing, setMissionBriefing] = useState("");
	const [infilPoint, setInfilPoint] = useState(null);
	const [exfilPoint, setExfilPoint] = useState(null);
	const [fallbackExfil, setFallbackExfil] = useState(null);

	const { fetchOperators, operators } = useOperatorsStore();
	const { openSheet, setOpenSheet, closeSheet } = useSheetStore();
	const { teams } = useTeamsStore();

	const [sheetContent, setSheetContent] = useState(null);
	const [sheetTitle, setSheetTitle] = useState(null);
	const [sheetDescription, setSheetDescription] = useState(null);

	useEffect(() => {
		fetchOperators();
	}, [fetchOperators]);

	const reset = () => {
		setMissionBriefing("");
		setInfilPoint(null);
		setExfilPoint(null);
		setFallbackExfil(null);
		setRandomLocationSelection([]);
		setLocationSelection([]);
		setMapBounds(null);
		setImgURL("");
	};

	const handleGenerateAIMission = (data) => {
		reset();
		setMissionBriefing(data.briefing);
		setInfilPoint(data.infilPoint);
		setExfilPoint(data.exfilPoint);
		setFallbackExfil(data.fallbackExfil ?? null);
		setMapBounds(data.bounds);
		setImgURL(data.imgURL || "");
	};
	const handleGenerateRandomOps = (data) => {
		reset();
		setRandomLocationSelection(data.randomSelection);
		setMapBounds(data.bounds);
		setImgURL(data.imgURL || "");
	};
	const handleGenerateOps = (data) => {
		reset();
		setLocationSelection(data.randomSelection);
		setMapBounds(data.bounds);
		setImgURL(data.imgURL);
	};

	const activeAOs = [...new Set(teams.filter((t) => t.AO).map((t) => t.AO))];
	const hasBriefing = !!missionBriefing;
	const briefBadge = hasBriefing ? "TS//SCI" : "STANDBY";

	const mgProps = {
		onGenerateRandomOps: handleGenerateRandomOps,
		onGenerateOps: handleGenerateOps,
		onGenerateAIMission: handleGenerateAIMission,
		setMapBounds,
		setImgURL,
		setGenerationMode,
		setInfilPoint,
		setExfilPoint,
		setFallbackExfil,
		setMissionBriefing,
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

	return (
		<div className='mil-root contents'>
			<InjectMilStyles />

			{/* ══════════ MOBILE (< lg) — natural scroll ══════════ */}
			<div className='lg:hidden flex-1 overflow-y-auto mil-root'>
				<div className='p-3 flex flex-col gap-3'>
					{/* Mobile status strip */}
					<div className='range-card flex flex-wrap items-center gap-2 px-3 py-2'>
						<span className='f-stencil text-[9px] font-bold text-[var(--c-text-dim)] shrink-0'>
							OPS STATUS
						</span>
						<div className='w-px h-3 bg-[rgba(78,102,38,0.25)]' />
						<StatChip
							label='Pax'
							value={operators.length}
							live
						/>
						<StatChip
							label='Teams'
							value={teams.length}
						/>
						<StatChip
							label='AOs'
							value={activeAOs.length}
						/>
						{hasBriefing && (
							<StatChip
								label='Brief'
								value='READY'
								live
							/>
						)}
					</div>

					<Panel
						title='Mission Generator'
						sectionId='A-01'
						badge='GEN-SYS'
						className='h-80'
						bodyClass='p-3'>
						<MissionGenerator {...mgProps} />
					</Panel>

					<Panel
						title='Recon Debrief'
						sectionId='A-02'
						badge='ISR'
						badgeGreen
						className='h-80'
						bodyClass='p-3'>
						<ReconTool />
					</Panel>

					<Panel
						title='Intel Briefing'
						sectionId='B-01'
						badge={briefBadge}
						badgeGreen={hasBriefing}
						className='h-60'>
						<IntelBody
							hasBriefing={hasBriefing}
							missionBriefing={missionBriefing}
							infilPoint={infilPoint}
							exfilPoint={exfilPoint}
							fallbackExfil={fallbackExfil}
						/>
					</Panel>

					<Panel
						title='Tactical Map'
						sectionId='B-02'
						badge='AO-LIVE'
						badgeGreen
						className='h-72'
						bodyClass='overflow-hidden p-0'>
						<TacMapPanel
							activeAOs={activeAOs}
							mapWrapperProps={mapProps}
						/>
					</Panel>
				</div>
			</div>

			{/* ══════════ DESKTOP (lg+) — bounded, no page scroll ══════════ */}
			<div
				className='mil-root hidden lg:flex flex-1 min-h-0 overflow-hidden flex-col'
				style={{ padding: "12px", gap: "10px" }}>
				<CommandBar
					operators={operators}
					teams={teams}
					activeAOs={activeAOs}
					hasBriefing={hasBriefing}
				/>

				{/* 2×2 locked grid — cells are exactly 50% height, content CANNOT resize them */}
				<div className='grid grid-cols-2 grid-rows-2 gap-2.5 flex-1 min-h-0 overflow-hidden'>
					<Panel
						title='Mission Generator'
						sectionId='A-01'
						badge='GEN-SYS'
						className='h-full'
						bodyClass='p-3'>
						<MissionGenerator {...mgProps} />
					</Panel>

					<Panel
						title='Recon Debrief'
						sectionId='A-02'
						badge='ISR-DEBRIEF'
						badgeGreen
						className='h-full'
						bodyClass='p-3'>
						<ReconTool />
					</Panel>

					<Panel
						title='Intel Briefing'
						sectionId='B-01'
						badge={briefBadge}
						badgeGreen={hasBriefing}
						className='h-full'>
						<IntelBody
							hasBriefing={hasBriefing}
							missionBriefing={missionBriefing}
							infilPoint={infilPoint}
							exfilPoint={exfilPoint}
							fallbackExfil={fallbackExfil}
						/>
					</Panel>

					<Panel
						title='Tactical Map'
						sectionId='B-02'
						badge='AO-LIVE'
						badgeGreen
						className='h-full'
						bodyClass='overflow-hidden p-0'>
						<TacMapPanel
							activeAOs={activeAOs}
							mapWrapperProps={mapProps}
						/>
					</Panel>
				</div>

				{/* Footer classification footer bar */}
				<div className='shrink-0 flex items-center gap-3 px-1'>
					<span className='f-hud text-[7.5px] text-[rgba(72,96,35,0.28)] tracking-[0.32em] uppercase'>
						GRID REF: QV-47 // UTM 18S // DATUM WGS84
					</span>
					<div className='flex-1 h-px bg-[rgba(52,72,25,0.15)]' />
					<span className='f-hud text-[7.5px] text-[rgba(72,96,35,0.28)] tracking-[0.22em] uppercase'>
						CLASSIFICATION: TS//SCI — SPECAT CHANNELS ONLY
					</span>
				</div>
			</div>

			{/* Sheet overlay */}
			{openSheet && (
				<SheetSide
					openSheet={openSheet}
					setOpenSheet={setOpenSheet}
					side={openSheet}
					content={sheetContent}
					title={sheetTitle}
					description={sheetDescription}
					onClose={closeSheet}
				/>
			)}
		</div>
	);
};

export default Briefing;
