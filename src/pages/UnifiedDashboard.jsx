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
	faLayerGroup,
	faGun,
} from "@fortawesome/free-solid-svg-icons";

import { SheetSide } from "@/components";
import { useAuthService } from "@/services/AuthService";
import useMissionsStore from "@/zustand/useMissionsStore";
import {
	NewMissionModal,
	MissionListSheet,
	ActiveMissionChip,
} from "@/components/mission";

import iconUrl from "/icons/GhostOpsAI.svg?url";

import BriefingPage from "./BriefingPage";
import OperatorsPage from "./OperatorsPage";
import VehiclesPage from "./VehiclesPage";
import AOBriefingPage from "./AOBriefingPage";
import Armory from "./Armory";

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV = [
	{ id: "operators",  label: "Personnel",     sub: "FOB",             icon: faUsers },
	{ id: "briefing",   label: "Ops Room",       sub: "SCIF",            icon: faCrosshairs },
	{ id: "vehicles",   label: "Asset Registry", sub: "Organic Assets",  icon: faTruck },
	{ id: "ao-briefing",label: "AO Briefing",    sub: "Intel",           icon: faLayerGroup },
	{ id: "armory",     label: "Armory",          sub: "Kit Repository",  icon: faGun },
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

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT SHELL
// ═══════════════════════════════════════════════════════════════════════════════

export default function UnifiedDashboard() {
	const [activeTab, setActiveTab] = useState("operators");
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
			case "operators":
				return <OperatorsPage />;
			case "briefing":
				return <BriefingPage onNewMission={() => setShowNewMission(true)} />;
			case "vehicles":
				return <VehiclesPage />;
			case "ao-briefing":
				return <AOBriefingPage />;
			case "armory":
				return <Armory />;
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
									<span
										className={[
											"font-mono text-[11px] tracking-widest uppercase leading-none truncate",
											active ? "text-btn" : "",
										].join(" ")}>
										{n.label}
									</span>
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
								<div className='px-3 py-2.5 flex flex-col gap-2'>
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
						<div className='flex items-center gap-2'>
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
