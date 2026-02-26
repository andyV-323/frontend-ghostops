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
					"flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
					bodyClass,
				].join(" ")}>
				{children}
			</div>
		</div>
	);
}

// ─── Sheet hook ───────────────────────────────────────────────
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
function BriefingPage() {
	const [randomLocationSelection, setRandomLocationSelection] = useState([]);
	const [locationSelection, setLocationSelection] = useState([]);
	const [mapBounds, setMapBounds] = useState(null);
	const [imgURL, setImgURL] = useState("");
	const [generationMode, setGenerationMode] = useState("random");
	const [missionBriefing, setMissionBriefing] = useState("");
	const [infilPoint, setInfilPoint] = useState(null);
	const [exfilPoint, setExfilPoint] = useState(null);
	const [fallbackExfil, setFallbackExfil] = useState(null);

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

	return (
		// Mobile: natural scroll column. Desktop: 2-col grid, scrollable.
		<div className='flex-1 overflow-y-auto'>
			<div className='p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4'>
				<Panel
					title='Mission Generator'
					badge='GEN-SYS'
					className='min-h-64 sm:min-h-72'
					bodyClass='p-3'>
					<MissionGenerator
						onGenerateRandomOps={handleGenerateRandomOps}
						onGenerateOps={handleGenerateOps}
						onGenerateAIMission={handleGenerateAIMission}
						setMapBounds={setMapBounds}
						setImgURL={setImgURL}
						setGenerationMode={setGenerationMode}
						setInfilPoint={setInfilPoint}
						setExfilPoint={setExfilPoint}
						setFallbackExfil={setFallbackExfil}
						setMissionBriefing={setMissionBriefing}
						generationMode={generationMode}
					/>
				</Panel>

				<Panel
					title='Recon Tool'
					badge='ISR'
					badgeGreen
					className='min-h-64 sm:min-h-72'
					bodyClass='p-3'>
					<ReconTool />
				</Panel>

				<Panel
					title='Intel Briefing'
					badge='CLASSIFIED'
					className='min-h-40'>
					{missionBriefing ?
						<p className='font-mono text-xs leading-[1.9] tracking-wide text-fontz p-4'>
							{missionBriefing}
						</p>
					:	<div className='flex items-center justify-center min-h-40'>
							<p className='font-mono text-[10px] tracking-[0.2em] text-lines/30 uppercase'>
								// awaiting mission parameters //
							</p>
						</div>
					}
				</Panel>

				<Panel
					title='Tactical Map'
					badge='AO-LIVE'
					badgeGreen
					className='min-h-48'
					bodyClass='overflow-hidden'>
					<MapWrapper
						mapBounds={mapBounds}
						locationSelection={locationSelection}
						randomLocationSelection={randomLocationSelection}
						imgURL={imgURL}
						generationMode={generationMode}
						infilPoint={infilPoint}
						exfilPoint={exfilPoint}
						fallbackExfil={fallbackExfil}
					/>
				</Panel>
			</div>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// OPERATORS PAGE
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
		/*
      Mobile:  Single column, full natural scroll. Each panel has a min-h so
               the roster is always visible. User scrolls the page.
      Desktop: Two-column layout. Left col = full-height roster (no scroll on
               the page, the roster body scrolls internally). Right col =
               Teams + WIA/KIA stacked, also scrolling internally.
               overflow-hidden on the wrapper + flex children fill height.
    */
		<>
			{/* ── MOBILE layout (< lg) ── natural scroll, no overflow-hidden */}
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

			{/* ── DESKTOP layout (lg+) ── fixed height, internal scroll */}
			<div className='hidden lg:flex flex-1 min-h-0 overflow-hidden p-4 gap-4'>
				{/* Left: Roster fills full height */}
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

				{/* Right: Teams + WIA/KIA stacked */}
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

					{/* WIA + KIA combined card */}
					<div className='shrink-0 flex flex-col rounded-lg border border-lines/30 bg-blk/60 shadow-[0_4px_32px_rgba(0,0,0,0.75)] overflow-hidden'>
						{/* Infirmary header */}
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

						{/* KIA divider */}
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
// VEHICLES PAGE
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

	const renderPage = () => {
		switch (activeTab) {
			case "briefing":
				return <BriefingPage />;
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
				{/* Logo */}
				<div className='flex items-center gap-2 shrink-0'>
					<div className='relative w-4 h-4 sm:w-5 sm:h-5'>
						<div className='absolute inset-0 border border-btn rotate-45' />
						<div className='absolute inset-[4px] sm:inset-[5px] bg-btn' />
					</div>
					<span className='font-mono text-[11px] sm:text-xs tracking-[0.2em] text-btn uppercase leading-none'>
						Ghost<span className='text-lines/40 mx-0.5'>///</span>Recon
					</span>
				</div>

				<div className='flex-1 h-px bg-gradient-to-r from-lines/15 to-transparent' />

				{/* Status — hidden on mobile */}
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

				{/* Auth — unauthenticated only (topbar sign in/up) */}
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
				{/* ── SIDEBAR — desktop only (lg+) ── */}
				<nav className='hidden lg:flex shrink-0 w-44 flex-col bg-blk/70 border-r border-lines/15'>
					<div className='px-3 pt-3 pb-1'>
						<span className='font-mono text-[9px] tracking-[0.28em] text-lines/25 uppercase'>
							Navigation
						</span>
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
					{/* ── Sidebar footer: user profile + sign out ── */}
					<div className='mt-auto border-t border-lines/15'>
						{isAuthenticated ?
							<>
								{/* User profile block */}
								<div className='flex items-center gap-2.5 px-3 py-3 border-b border-lines/10'>
									{/* Avatar */}
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
									{/* Email + status */}
									<div className='flex flex-col min-w-0'>
										<span className='font-mono text-[9px] text-fontz/70 truncate leading-none'>
											{user?.profile?.email || "NOMAD-7"}
										</span>
										<span className='font-mono text-[8px] text-green-600 tracking-widest leading-none mt-1'>
											SYS:ONLINE
										</span>
									</div>
								</div>
								{/* Sign out */}
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
						:	/* Unauthenticated state in sidebar (fallback) */
							<div className='px-3 py-3 flex flex-col gap-2'>
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

				{/* ── MAIN ── */}
				<main className='flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden'>
					{/* Breadcrumb strip */}
					<div className='shrink-0 h-9 flex items-center gap-2 px-3 sm:px-4 bg-blk/35 border-b border-lines/15'>
						<span className='font-mono text-[11px] tracking-[0.18em] text-btn uppercase whitespace-nowrap'>
							{activeNav?.label}
						</span>
						<span className='font-mono text-[10px] text-lines/25'>//</span>
						<span className='hidden md:block font-mono text-[10px] tracking-widest text-lines/25 uppercase truncate'>
							Ghost Recon Breakpoint — Tactical Operations Center
						</span>
						<div className='flex-1 h-px bg-gradient-to-r from-lines/10 to-transparent' />
						<span className='font-mono text-[9px] tracking-widest text-green-500 border border-green-900 px-1.5 py-0.5 rounded-sm whitespace-nowrap'>
							{activeNav?.sub}
						</span>
					</div>

					{/* Page content — flex-1 so pages can choose scroll strategy */}
					<div className='flex flex-col flex-1 min-h-0 overflow-hidden'>
						{renderPage()}
					</div>
				</main>
			</div>

			{/* ══ BOTTOM TAB BAR — mobile only (< lg) ════════════════ */}
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
		</div>
	);
}
