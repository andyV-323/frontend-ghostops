// TeamView.jsx — Military Team Dossier

import { useTeamsStore, useOperatorsStore, useKitsStore } from "@/zustand";
import { useEffect, useMemo, useState } from "react";
import { WEAPONS, ITEMS, GARAGE, PROVINCES } from "@/config";
import { PropTypes } from "prop-types";
import ConfirmDialog from "./ConfirmDialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faShieldHalved,
	faStar,
	faGasPump,
	faWrench,
	faChevronDown,
	faChevronUp,
	faXmark,
	faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { TeamsApi, OperatorsApi } from "@/api";
import { toast } from "react-toastify";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

/* ─── Status config ─────────────────────────────────────────── */
const STATUS_MAP = {
	Active: {
		dot: "bg-green-500 shadow-[0_0_5px_rgba(74,222,128,0.6)]",
		text: "text-green-400",
		border: "border-green-900/40",
		bg: "bg-green-950/20",
		label: "ACTIVE",
	},
	Injured: {
		dot: "bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.6)]",
		text: "text-amber-400",
		border: "border-amber-900/40",
		bg: "bg-amber-950/20",
		label: "WIA",
	},
	KIA: {
		dot: "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]",
		text: "text-red-400",
		border: "border-red-900/40",
		bg: "bg-red-950/20",
		label: "KIA",
	},
};

const CONDITION_BADGE = {
	Optimal: "text-green-400 border-green-900/50 bg-green-950/30",
	Operational: "text-btn border-btn/30 bg-btn/5",
	Compromised: "text-amber-400 border-amber-900/50 bg-amber-950/30",
	Critical: "text-red-400 border-red-900/50 bg-red-950/30",
};

/* ─── Op grid columns ───────────────────────────────────────── */
function getOpCols(count) {
	if (count === 1) return "grid-cols-1";
	if (count === 2) return "grid-cols-2";
	if (count === 3) return "grid-cols-2 sm:grid-cols-3";
	if (count === 5) return "grid-cols-2 sm:grid-cols-5";
	if (count === 6) return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
	if (count === 7) return "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7";
	return "grid-cols-2 sm:grid-cols-4";
}

/* ─── Section header ────────────────────────────────────────── */
function SectionHeader({ label, count }) {
	return (
		<div className='flex items-center gap-3 px-4 py-2 border-b border-neutral-800/60 bg-neutral-950/40 shrink-0'>
			<div className='w-0.5 h-3.5 bg-btn/60 shrink-0' />
			<span className='font-mono text-[7px] tracking-[0.35em] text-neutral-500 uppercase flex-1'>
				{label}
			</span>
			{count != null && (
				<span className='font-mono text-[7px] text-btn border border-btn/25 bg-btn/5 px-1.5 py-0.5'>
					{count}
				</span>
			)}
		</div>
	);
}

/* ─── Fuel bar ──────────────────────────────────────────────── */
function FuelBar({ pct }) {
	const color =
		pct > 60 ? "bg-green-500"
		: pct > 25 ? "bg-amber-400"
		: "bg-red-500";
	return (
		<div className='flex items-center gap-2'>
			<div className='flex-1 h-1 bg-neutral-950/60 overflow-hidden border border-neutral-800/40'>
				<div
					className={["h-full transition-all", color].join(" ")}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span className='font-mono text-[9px] tabular-nums text-neutral-500 w-8 text-right shrink-0'>
				{pct}%
			</span>
		</div>
	);
}

/* ─── Operator portrait card (compact grid tile) ────────────── */
function OperatorCard({
	operator,
	onInjuryClick,
	onKitSelectClick,
	assignedKits,
}) {
	const img = operator.imageKey || operator.image || "/ghost/Default.png";
	const status = STATUS_MAP[operator.status] || STATUS_MAP.Active;
	const isKIA = operator.status === "KIA";

	const [kitIdx, setKitIdx] = useState(0);
	const [expandedSlot, setExpandedSlot] = useState(null);

	const safeIdx =
		assignedKits.length > 0 ? Math.min(kitIdx, assignedKits.length - 1) : 0;
	const activeKit = assignedKits[safeIdx] || null;

	useEffect(() => {
		setKitIdx(0);
		setExpandedSlot(null);
	}, [operator._id]);

	const kitWeapons =
		activeKit ?
			[
				activeKit.primary?.weapon && {
					key: "primary",
					label: "PRI",
					weapon: activeKit.primary.weapon,
					weaponType: activeKit.primary.weaponType,
					attachments: activeKit.primary.attachments,
				},
				activeKit.secondary?.weapon && {
					key: "secondary",
					label: "SEC",
					weapon: activeKit.secondary.weapon,
					weaponType: activeKit.secondary.weaponType,
					attachments: activeKit.secondary.attachments,
				},
				activeKit.handgun?.weapon && {
					key: "handgun",
					label: "HDG",
					weapon: activeKit.handgun.weapon,
					weaponType: "HDG",
					attachments: activeKit.handgun.attachments,
				},
			].filter(Boolean)
		:	[];

	const expandedWeapon = kitWeapons.find((w) => w.key === expandedSlot);

	return (
		<div
			className={[
				"relative flex flex-col overflow-hidden border-r border-neutral-800/50 last:border-r-0 select-none",
				isKIA ? "opacity-60" : "",
			].join(" ")}>
			{/* Portrait — clickable for kit selection */}
			<div
				role='button'
				tabIndex={0}
				onClick={() => onKitSelectClick(operator)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") onKitSelectClick(operator);
				}}
				className='relative overflow-hidden bg-neutral-950 shrink-0 cursor-pointer h-56 sm:h-60'>
				<img
					src={img}
					alt={operator.callSign}
					className={[
						"w-full h-full object-contain absolute inset-0",
						isKIA ? "grayscale" : "",
					].join(" ")}
					style={{ objectPosition: "center bottom" }}
					onError={(e) => {
						e.currentTarget.src = "/ghost/Default.png";
					}}
				/>

				{/* Top badges */}
				<div className='absolute top-0 left-0 right-0 flex items-start justify-between p-1.5 gap-1'>
					<span
						className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${status.dot}`}
					/>
					<div className='flex flex-col gap-0.5'>
						{operator.support && (
							<div className='w-4 h-4 flex items-center justify-center bg-blue-950/80 border border-blue-800/50'>
								<FontAwesomeIcon
									icon={faShieldHalved}
									className='text-blue-400 text-[7px]'
								/>
							</div>
						)}
						{operator.aviator && (
							<div className='w-4 h-4 flex items-center justify-center bg-sky-950/80 border border-sky-800/50'>
								<FontAwesomeIcon
									icon={faStar}
									className='text-sky-400 text-[7px]'
								/>
							</div>
						)}
					</div>
				</div>

				{/* Tap hint */}
				<div className='absolute bottom-1 right-1.5 font-mono text-[10px] tracking-widest text-neutral-600 uppercase pointer-events-none'>
					kit
				</div>

				{/* Bottom gradient + identity */}
				<div
					className='absolute bottom-0 left-0 right-0 flex flex-col gap-1 px-2 pb-2 pt-20'
					style={{
						background:
							"linear-gradient(to top, rgba(5,10,8,1) 0%, rgba(5,10,8,0.9) 40%, transparent 100%)",
					}}>
					<div>
						<p className='font-mono text-xs font-bold text-neutral-100 leading-tight truncate'>
							{operator.callSign || "Unknown"}
						</p>
						<p className='font-mono text-[9px] text-neutral-500 truncate uppercase tracking-wider'>
							{operator.class || "—"}
						</p>
						<p className='font-mono text-[9px] text-neutral-500 truncate uppercase tracking-wider'>
							{operator.role || "—"}
						</p>
					</div>

					{activeKit ?
						<div className='flex flex-col gap-0.5'>
							{/* Kit name + cycle controls */}
							<div className='flex items-center gap-1 min-w-0'>
								{assignedKits.length > 1 && (
									<button
										type='button'
										onClick={(e) => {
											e.stopPropagation();
											setKitIdx((i) =>
												i > 0 ? i - 1 : assignedKits.length - 1,
											);
											setExpandedSlot(null);
										}}
										className='font-mono text-[11px] text-neutral-600 hover:text-neutral-300 shrink-0 leading-none'>
										‹
									</button>
								)}
								<p className='font-mono text-[9px] text-btn/60 truncate tracking-widest uppercase flex-1'>
									{activeKit.name}
								</p>
								{assignedKits.length > 1 && (
									<>
										<button
											type='button'
											onClick={(e) => {
												e.stopPropagation();
												setKitIdx((i) =>
													i < assignedKits.length - 1 ? i + 1 : 0,
												);
												setExpandedSlot(null);
											}}
											className='font-mono text-[11px] text-neutral-600 hover:text-neutral-300 shrink-0 leading-none'>
											›
										</button>
										<span className='font-mono text-[7px] text-neutral-700 shrink-0 tabular-nums'>
											{safeIdx + 1}/{assignedKits.length}
										</span>
									</>
								)}
							</div>
							{kitWeapons.map(({ key, label, weapon, weaponType }) => (
								<button
									key={key}
									type='button'
									onClick={(e) => {
										e.stopPropagation();
										setExpandedSlot(expandedSlot === key ? null : key);
									}}
									className='flex items-center gap-1 min-w-0 text-left hover:opacity-80 transition-opacity'>
									<span className='font-mono text-[8px] text-neutral-600 uppercase tracking-widest shrink-0 w-6'>
										{label}
									</span>
									{WEAPONS[weaponType]?.imgUrl && (
										<img
											src={WEAPONS[weaponType].imgUrl}
											alt=''
											className='w-7 h-3.5 object-contain shrink-0'
											style={{ filter: "invert(1) opacity(0.4)" }}
										/>
									)}
									<span
										className={`font-mono text-[9px] truncate ${expandedSlot === key ? "text-fontz/90" : "text-neutral-400"}`}>
										{weapon}
									</span>
								</button>
							))}
						</div>
					:	<p className='font-mono text-[8px] text-neutral-700 italic tracking-widest'>
							No kit assigned
						</p>
					}
				</div>
			</div>

			{/* Attachment detail panel */}
			{expandedSlot && expandedWeapon && (
				<div className='px-2 py-2 bg-neutral-950/90 border-t border-neutral-800/50'>
					<p className='font-mono text-[9px] font-semibold text-neutral-300 mb-1.5 uppercase tracking-wide'>
						{expandedWeapon.label} · {expandedWeapon.weapon}
					</p>
					{Object.entries(expandedWeapon.attachments || {})
						.filter(([, v]) => v)
						.map(([k, v]) => (
							<div
								key={k}
								className='flex items-baseline gap-1.5 min-w-0'>
								<span className='font-mono text-[8px] uppercase tracking-widest text-neutral-600 shrink-0 w-14'>
									{k}
								</span>
								<span className='font-mono text-[8px] text-neutral-500 truncate'>
									{v}
								</span>
							</div>
						))}
					{!Object.values(expandedWeapon.attachments || {}).some(Boolean) && (
						<p className='font-mono text-[8px] text-neutral-700 italic'>
							No attachments
						</p>
					)}
				</div>
			)}

			{/* Injury button */}
			<button
				onClick={(e) => {
					e.stopPropagation();
					onInjuryClick(operator);
				}}
				disabled={isKIA}
				className={[
					"w-full flex items-center justify-center gap-1 font-mono text-[8px] tracking-widest uppercase py-1.5 border transition-all",
					isKIA ?
						"text-neutral-800 border-neutral-900/40 cursor-not-allowed"
					:	"text-red-400/40 border-red-900/30 hover:text-red-400 hover:border-red-500/50 hover:bg-red-950/20",
				].join(" ")}>
				Casualty
			</button>
		</div>
	);
}

/* ─── Asset card ────────────────────────────────────────────── */
function AssetCard({ asset }) {
	const a = typeof asset === "object" ? asset : null;
	const garageEntry = GARAGE.find((g) => g.name === a?.vehicle);
	const assetImg = garageEntry?.imgUrl || a?.imgUrl || a?.image || null;
	const nickname =
		a?.nickName && a.nickName !== "None" ? a.nickName : a?.vehicle || "Unknown";
	const condBadge =
		CONDITION_BADGE[a?.condition] ||
		"text-neutral-500 border-neutral-800/40 bg-neutral-900/20";

	return (
		<div className='bg-neutral-900/40 border border-neutral-800/60 overflow-hidden hover:border-neutral-700/60 transition-colors'>
			<div className='relative h-44 overflow-hidden bg-neutral-900/40'>
				{assetImg ?
					<img
						src={assetImg}
						alt={a?.vehicle || "Vehicle"}
						className={[
							"w-full h-full object-contain object-center",
							a?.isRepairing ? "grayscale opacity-40" : "opacity-90",
						].join(" ")}
						onError={(e) => {
							e.currentTarget.style.display = "none";
						}}
					/>
				:	<div className='w-full h-full flex items-center justify-center'>
						<span className='font-mono text-[8px] text-neutral-700 tracking-widest uppercase'>
							No Image
						</span>
					</div>
				}
				<div
					className='absolute inset-0'
					style={{
						background:
							"linear-gradient(to top, rgba(5,10,8,0.95) 0%, transparent 55%)",
					}}
				/>
				{a?.condition && (
					<span
						className={`absolute top-2 left-2 font-mono text-[7px] tracking-widest uppercase px-1.5 py-0.5 border ${condBadge}`}>
						{a.condition}
					</span>
				)}
				{a?.isRepairing && (
					<span className='absolute top-2 right-2 flex items-center gap-1 font-mono text-[7px] tracking-widest uppercase px-1.5 py-0.5 border text-btn border-btn/40 bg-neutral-950/80 animate-pulse'>
						<FontAwesomeIcon
							icon={faWrench}
							className='text-[6px]'
						/>{" "}
						REPAIR
					</span>
				)}
				<div className='absolute bottom-0 left-0 right-0 px-3 pb-2.5'>
					<p className='font-mono text-xs font-bold text-neutral-100 truncate'>
						{nickname}
					</p>
					{a?.vehicle && a.nickName && a.nickName !== "None" && (
						<p className='font-mono text-[8px] text-neutral-500 truncate'>
							{a.vehicle}
						</p>
					)}
				</div>
			</div>
			{typeof a?.remainingFuel === "number" && (
				<div className='px-3 py-2 border-t border-neutral-800/60'>
					<div className='flex items-center gap-1.5 mb-1.5'>
						<FontAwesomeIcon
							icon={faGasPump}
							className='text-neutral-600 text-[7px]'
						/>
						<span className='font-mono text-[7px] tracking-[0.25em] text-neutral-600 uppercase'>
							Fuel
						</span>
					</div>
					<FuelBar pct={a.remainingFuel} />
				</div>
			)}
		</div>
	);
}

const CONDITION_SCORE = {
	Optimal: 1.0,
	Operational: 0.75,
	Compromised: 0.4,
	Critical: 0.1,
};

/* ─── Kit selector sheet (multi-select) ─────────────────────── */
function KitSelectorSheet({ operator, kits, onToggleKit }) {
	const img = operator.imageKey || operator.image || "/ghost/Default.png";
	const status = STATUS_MAP[operator.status] || STATUS_MAP.Active;
	const isKIA = operator.status === "KIA";
	const assigned = new Set(operator.assignedKitIds || []);

	return (
		<div className='flex flex-col h-full'>
			{/* Operator header */}
			<div
				className='relative shrink-0 flex items-stretch border-b border-neutral-800/60'
				style={{ height: 140 }}>
				<div className='relative w-28 shrink-0 overflow-hidden bg-neutral-950'>
					<img
						src={img}
						alt={operator.callSign}
						className={[
							"w-full h-full object-contain object-bottom",
							isKIA ? "grayscale opacity-50" : "",
						].join(" ")}
						style={{ objectPosition: "center bottom" }}
						onError={(e) => {
							e.currentTarget.src = "/ghost/Default.png";
						}}
					/>
				</div>
				<div className='flex-1 flex flex-col justify-between px-4 py-3 bg-neutral-950/60 min-w-0'>
					<div className='min-w-0'>
						<h3 className='font-mono text-base font-bold text-white tracking-wide leading-tight truncate'>
							{operator.callSign || "Unknown"}
						</h3>
						<p className='font-mono text-[9px] text-neutral-500 uppercase tracking-widest mt-0.5'>
							{operator.class || operator.role || "—"}
						</p>
					</div>
					<div className='flex items-center gap-2'>
						<span
							className={`inline-flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 border ${status.border} ${status.bg} ${status.text}`}>
							<span
								className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`}
							/>
							{status.label}
						</span>
						{assigned.size > 0 && (
							<span className='font-mono text-[7px] text-btn border border-btn/25 bg-btn/5 px-1.5 py-0.5'>
								{assigned.size} kit{assigned.size !== 1 ? "s" : ""}
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Section label */}
			<div className='shrink-0 px-4 py-2 border-b border-neutral-800/60 bg-neutral-950/40'>
				<p className='font-mono text-[7px] tracking-[0.35em] text-neutral-500 uppercase'>
					Kit Assignment — tap to add / remove
				</p>
			</div>

			{/* Kit list */}
			<div className='flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2'>
				{kits.length === 0 ?
					<p className='font-mono text-[8px] text-neutral-700 italic py-4 text-center'>
						No kits in armory. Create kits in the Armory section.
					</p>
				:	kits.map((kit) => {
						const isAssigned = assigned.has(kit._id);
						const weapons = [
							kit.primary?.weapon,
							kit.secondary?.weapon,
							kit.handgun?.weapon,
						].filter(Boolean);

						return (
							<button
								key={kit._id}
								type='button'
								onClick={() => onToggleKit(operator, kit._id)}
								className={[
									"flex flex-col gap-1.5 px-3 py-2.5 border transition-colors text-left",
									isAssigned ?
										"border-btn/50 bg-btn/5"
									:	"border-neutral-800/60 hover:border-neutral-700/60",
								].join(" ")}>
								<div className='flex items-center gap-2'>
									{/* Checkbox indicator */}
									<div
										className={[
											"w-3.5 h-3.5 border shrink-0 flex items-center justify-center transition-colors",
											isAssigned ?
												"border-btn bg-btn/20"
											:	"border-neutral-700",
										].join(" ")}>
										{isAssigned && <div className='w-1.5 h-1.5 bg-btn' />}
									</div>
									<span
										className={`font-mono text-[10px] font-semibold tracking-wide uppercase flex-1 truncate ${isAssigned ? "text-btn" : "text-neutral-300"}`}>
										{kit.name}
									</span>
									{isAssigned && (
										<span className='font-mono text-[7px] text-btn shrink-0'>
											ASSIGNED
										</span>
									)}
								</div>
								{weapons.length > 0 && (
									<p className='font-mono text-[7px] text-neutral-600 truncate pl-5'>
										{weapons.join(" · ")}
									</p>
								)}
								{kit.items?.length > 0 && (
									<div className='flex gap-1 pl-5 flex-wrap'>
										{kit.items.slice(0, 6).map(
											(item) =>
												ITEMS[item] && (
													<img
														key={item}
														src={ITEMS[item]}
														alt={item}
														title={item}
														className='w-4 h-4 object-contain'
														style={{ filter: "invert(1) opacity(0.35)" }}
													/>
												),
										)}
									</div>
								)}
							</button>
						);
					})
				}
			</div>
		</div>
	);
}

KitSelectorSheet.propTypes = {
	operator: PropTypes.object.isRequired,
	kits: PropTypes.array.isRequired,
	onToggleKit: PropTypes.func.isRequired,
};

/* ═══════════════════════════════════════════════════════════════
   TEAMVIEW
═══════════════════════════════════════════════════════════════ */
const TeamView = ({ teamId }) => {
	const {
		teams,
		fetchTeams,
		assignRandomInjury,
		assignRandomKIAInjury,
		assignUnknownFate,
		attachTeamTo,
		detachTeamFrom,
	} = useTeamsStore();
	const { operators, fetchOperators } = useOperatorsStore();
	const { kits, fetchKits } = useKitsStore();
	const userId = localStorage.getItem("userId");

	const [isInjuryDialogOpen, setIsInjuryDialogOpen] = useState(false);
	const [selectedOperator, setSelectedOperator] = useState(null);
	const [injuryType] = useState("choice");
	const [kitSelectorOp, setKitSelectorOp] = useState(null);
	const [showAOSelector, setShowAOSelector] = useState(false);
	const [savingAO, setSavingAO] = useState(false);
	const [localAO, setLocalAO] = useState("");
	const [showAttachPicker, setShowAttachPicker] = useState(false);
	const [missionProfile, setMissionProfile] = useState(null);

	useEffect(() => {
		fetchOperators();
		fetchTeams();
		fetchKits();
	}, [fetchOperators, fetchTeams, fetchKits]);

	const handleOpenInjuryDialog = (op) => {
		setSelectedOperator(op);
		setIsInjuryDialogOpen(true);
	};
	const handleCloseInjuryDialog = () => {
		setIsInjuryDialogOpen(false);
		setSelectedOperator(null);
	};

	const handleAssignRandomInjury = async (id) => {
		await assignRandomInjury(id, userId);
		handleCloseInjuryDialog();
		await fetchTeams();
		await fetchOperators();
	};
	const handleAssignRandomKIAInjury = async (id) => {
		await assignRandomKIAInjury(id, userId);
		handleCloseInjuryDialog();
		await fetchTeams();
		await fetchOperators();
	};
	const handleAssignUnknownFate = async (id) => {
		await assignUnknownFate(id, userId);
		handleCloseInjuryDialog();
		await fetchTeams();
		await fetchOperators();
	};

	const selectedTeam = useMemo(
		() => teams.find((t) => t._id === teamId),
		[teams, teamId],
	);

	useEffect(() => {
		setLocalAO(selectedTeam?.AO || "");
	}, [selectedTeam?.AO]);

	const teamOps = useMemo(() => {
		if (!selectedTeam?.operators || operators.length === 0) return [];
		return selectedTeam.operators
			.map((op) => {
				const id = typeof op === "object" ? op._id : op;
				return operators.find((o) => o._id === id) || op;
			})
			.filter(Boolean);
	}, [selectedTeam, operators]);

	const statusCounts = useMemo(
		() => ({
			active: teamOps.filter((o) => o.status === "Active").length,
			wia: teamOps.filter((o) => o.status === "Injured").length,
			kia: teamOps.filter((o) => o.status === "KIA").length,
		}),
		[teamOps],
	);

	const readiness = useMemo(() => {
		const total = teamOps.length;
		if (total === 0) return { score: 0, active: 0, total: 0, assets: null };
		const active = teamOps.filter((o) => o.status === "Active").length;
		const assets =
			selectedTeam?.assets?.length > 0 ?
				selectedTeam.assets.reduce((sum, a) => {
					const obj = typeof a === "object" ? a : null;
					if (!obj) return sum + 0.75;
					let s = CONDITION_SCORE[obj.condition] ?? 0.75;
					if (obj.isRepairing) s *= 0.5;
					if (typeof obj.remainingFuel === "number" && obj.remainingFuel < 25)
						s *= 0.7;
					return sum + s;
				}, 0) / selectedTeam.assets.length
			:	null;
		const opsScore = active / total;
		const base =
			assets !== null ?
				Math.round((opsScore * 0.7 + assets * 0.3) * 100)
			:	Math.round(opsScore * 100);
		const attachedBonus = (selectedTeam?.attachedTeams?.length ?? 0) * 10;
		const score = Math.min(100, base + attachedBonus);
		return {
			score,
			active,
			total,
			assets: assets !== null ? Math.round(assets * 100) : null,
			attachedBonus,
		};
	}, [teamOps, selectedTeam?.assets, selectedTeam?.attachedTeams]);

	/* Kit map: operatorId → kit[] (all assigned kits in order) */
	const kitMap = useMemo(() => {
		const map = {};
		operators.forEach((op) => {
			const ids = op.assignedKitIds || [];
			map[op._id] = ids
				.map((id) => kits.find((k) => k._id === id))
				.filter(Boolean);
		});
		return map;
	}, [operators, kits]);

	const handleToggleKit = async (operator, kitId) => {
		const current = new Set(operator.assignedKitIds || []);
		if (current.has(kitId)) {
			current.delete(kitId);
		} else {
			current.add(kitId);
		}
		const newIds = [...current];
		try {
			await OperatorsApi.updateOperator(operator._id, {
				...operator,
				assignedKitIds: newIds,
			});
			await fetchOperators();
			// Keep sheet open with updated operator state
			if (kitSelectorOp?._id === operator._id) {
				setKitSelectorOp((prev) => ({ ...prev, assignedKitIds: newIds }));
			}
		} catch {
			toast.error("Failed to update kit");
		}
	};

	const handleAOSave = async (newAO) => {
		if (!selectedTeam) return;
		setSavingAO(true);
		try {
			await TeamsApi.updateTeam(selectedTeam._id, {
				createdBy: selectedTeam.createdBy,
				name: selectedTeam.name,
				AO: newAO || null,
				operators: (selectedTeam.operators || []).map((op) =>
					typeof op === "object" ? op._id : op,
				),
				assets: (selectedTeam.assets || []).map((a) =>
					typeof a === "object" ? a._id : a,
				),
			});
			await fetchTeams();
			toast.success(newAO ? `AO set to ${newAO}` : "AO cleared");
			setShowAOSelector(false);
		} catch (err) {
			toast.error("Failed to save AO");
			console.error("AO save error:", err);
		} finally {
			setSavingAO(false);
		}
	};

	const attachedTeams = useMemo(
		() => selectedTeam?.attachedTeams || [],
		[selectedTeam],
	);

	const attachableTeams = useMemo(
		() =>
			teams.filter((t) => {
				if (t._id === teamId) return false;
				const alreadyAttached = attachedTeams.some(
					(a) => (typeof a === "object" ? a._id : a) === t._id,
				);
				return !alreadyAttached;
			}),
		[teams, teamId, attachedTeams],
	);

	if (!selectedTeam) {
		return (
			<div className='flex flex-col items-center justify-center py-16 gap-3'>
				<div className='w-8 h-8 border border-neutral-700/40 rotate-45' />
				<p className='font-mono text-[10px] tracking-[0.22em] text-neutral-700 uppercase'>
					Team not found
				</p>
			</div>
		);
	}

	const scoreColor =
		readiness.score >= 75 ? "text-green-400"
		: readiness.score >= 40 ? "text-amber-400"
		: "text-red-400";
	const barColor =
		readiness.score >= 75 ? "bg-green-500"
		: readiness.score >= 40 ? "bg-amber-400"
		: "bg-red-500";

	const opCols = getOpCols(teamOps.length);

	const assetCount = selectedTeam?.assets?.length ?? 0;

	return (
		<div className='relative w-full min-w-0 text-fontz flex flex-col'>
			{/* ── Team header ─────────────────────────────── */}
			<div className='px-5 py-4 bg-neutral-950/60 border-b border-neutral-800/60 relative shrink-0'>
				{[
					"top-2 left-2 border-t border-l",
					"top-2 right-2 border-t border-r",
					"bottom-2 left-2 border-b border-l",
					"bottom-2 right-2 border-b border-r",
				].map((cls, i) => (
					<div
						key={i}
						className={`absolute w-3 h-3 border-neutral-700/40 pointer-events-none ${cls}`}
					/>
				))}

				<div className='flex items-start justify-between gap-4'>
					<div className='min-w-0'>
						<h2 className='font-mono text-sm font-bold text-neutral-100 tracking-wide truncate'>
							{selectedTeam.name}
						</h2>

						{/* AO row */}
						<div className='flex items-center gap-2 mt-0.5'>
							{selectedTeam.AO ?
								<button
									onClick={() => setShowAOSelector((v) => !v)}
									className='flex items-center gap-1 font-mono text-[8px] tracking-[0.25em] text-neutral-500 uppercase hover:text-btn transition-colors'>
									<FontAwesomeIcon
										icon={faLocationDot}
										className='text-[7px]'
									/>
									AO: {selectedTeam.AO}
									<FontAwesomeIcon
										icon={showAOSelector ? faChevronUp : faChevronDown}
										className='text-[6px]'
									/>
								</button>
							:	<button
									onClick={() => setShowAOSelector((v) => !v)}
									className='flex items-center gap-1 font-mono text-[8px] tracking-[0.25em] text-neutral-700 uppercase hover:text-btn transition-colors'>
									<FontAwesomeIcon
										icon={faLocationDot}
										className='text-[7px]'
									/>
									Set AO
									<FontAwesomeIcon
										icon={showAOSelector ? faChevronUp : faChevronDown}
										className='text-[6px]'
									/>
								</button>
							}
						</div>

						{/* AO dropdown */}
						{showAOSelector && (
							<div className='mt-2 flex items-center gap-2'>
								<select
									className='flex-1 bg-neutral-950 border border-neutral-700/60 px-2 py-1 font-mono text-[9px] text-neutral-300 outline-none focus:border-btn/50'
									value={localAO}
									onChange={(e) => {
										setLocalAO(e.target.value);
										handleAOSave(e.target.value);
									}}
									disabled={savingAO}>
									<option value=''>— No AO —</option>
									{Object.keys(PROVINCES).map((key) => (
										<option
											key={key}
											value={key}>
											{key}
										</option>
									))}
								</select>
								{savingAO && (
									<span className='font-mono text-[8px] text-neutral-600 animate-pulse'>
										Saving…
									</span>
								)}
								<button
									onClick={() => setShowAOSelector(false)}
									className='text-neutral-600 hover:text-neutral-400 transition-colors'>
									<FontAwesomeIcon
										icon={faXmark}
										className='text-[10px]'
									/>
								</button>
							</div>
						)}
					</div>

					<div className='flex flex-wrap items-center gap-1.5 shrink-0 justify-end'>
						<span className='font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 border text-green-400 border-green-900/40 bg-green-950/20'>
							{statusCounts.active} Active
						</span>
						{statusCounts.wia > 0 && (
							<span className='font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 border text-amber-400 border-amber-900/40 bg-amber-950/20'>
								{statusCounts.wia} WIA
							</span>
						)}
						{statusCounts.kia > 0 && (
							<span className='font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 border text-red-400 border-red-900/40 bg-red-950/20'>
								{statusCounts.kia} KIA
							</span>
						)}
					</div>
				</div>

				{teamOps.length > 0 && (
					<div className='mt-3 pt-3 border-t border-neutral-800/60'>
						<div className='flex items-center justify-between mb-1.5'>
							<span className='font-mono text-[7px] tracking-[0.3em] text-neutral-600 uppercase'>
								Combat Readiness
							</span>
							<span className={`font-mono text-sm font-bold ${scoreColor}`}>
								{readiness.score}%
							</span>
						</div>
						<div className='h-1.5 overflow-hidden bg-neutral-950/60 border border-neutral-800/40'>
							<div
								className={`${barColor} h-full transition-all duration-500`}
								style={{ width: `${readiness.score}%` }}
							/>
						</div>
						<div className='flex items-center gap-4 mt-1.5'>
							<span className='font-mono text-[7px] text-neutral-700 uppercase tracking-wide'>
								ACTIVE{" "}
								<span className='text-neutral-500'>
									{readiness.active}/{readiness.total}
								</span>
							</span>
							{readiness.assets !== null && (
								<span className='font-mono text-[7px] text-neutral-700 uppercase tracking-wide'>
									ASSETS{" "}
									<span className='text-neutral-500'>{readiness.assets}%</span>
								</span>
							)}
							{readiness.attachedBonus > 0 && (
								<span className='font-mono text-[7px] text-btn uppercase tracking-wide'>
									ATTACHED{" "}
									<span className='text-btn'>+{readiness.attachedBonus}%</span>
								</span>
							)}
						</div>
					</div>
				)}

				{/* Attach team row */}
				<div className='mt-3 pt-3 border-t border-neutral-800/60 flex items-center gap-2 flex-wrap'>
					<span className='font-mono text-[7px] tracking-[0.3em] text-neutral-600 uppercase flex-1'>
						{attachedTeams.length > 0 ?
							`${attachedTeams.length} attached`
						:	"Attached Teams"}
					</span>
					<button
						type='button'
						onClick={() => setShowAttachPicker((v) => !v)}
						className='flex items-center gap-1 font-mono text-[7px] tracking-widest uppercase px-2 py-0.5 border text-neutral-600 border-neutral-700/40 hover:text-btn hover:border-btn transition-colors'>
						Attach
					</button>
				</div>
				{showAttachPicker && (
					<div className='mt-2'>
						<select
							className='w-full bg-neutral-950 border border-neutral-700/60 px-2 py-1 font-mono text-[9px] text-neutral-300 outline-none focus:border-btn'
							defaultValue=''
							onChange={(e) => {
								if (e.target.value) {
									attachTeamTo(teamId, e.target.value);
									setShowAttachPicker(false);
								}
							}}>
							<option value=''>— Select Team to Attach —</option>
							{attachableTeams.map((t) => (
								<option
									key={t._id}
									value={t._id}>
									{t.name}
								</option>
							))}
						</select>
					</div>
				)}
			</div>

			{/* ── Operator lineup ──────────────────────────── */}
			<SectionHeader
				label='Operators'
				count={teamOps.length}
			/>
			{teamOps.length > 0 ?
				<div className={`grid border-b border-neutral-800/60 ${opCols}`}>
					{teamOps.map((op, i) => (
						<OperatorCard
							key={op._id || i}
							operator={op}
							onInjuryClick={handleOpenInjuryDialog}
							onKitSelectClick={setKitSelectorOp}
							assignedKits={kitMap[op._id] || []}
						/>
					))}
				</div>
			:	<div className='flex flex-col items-center justify-center py-12 gap-2 border-b border-neutral-800/60'>
					<div className='w-6 h-6 border border-neutral-700/40 rotate-45' />
					<p className='font-mono text-[9px] tracking-[0.2em] text-neutral-700 uppercase'>
						No operators assigned
					</p>
				</div>
			}

			{/* ── Assets ──────────────────────────────────── */}
			{assetCount > 0 && (
				<>
					<SectionHeader
						label='Assets'
						count={assetCount}
					/>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-b border-neutral-800/60'>
						{selectedTeam.assets.map((asset, i) => (
							<AssetCard
								key={typeof asset === "object" ? asset._id || i : i}
								asset={asset}
							/>
						))}
					</div>
				</>
			)}

			{/* ── Attached Teams ───────────────────────────── */}
			{attachedTeams.length > 0 && (
				<>
					<SectionHeader
						label='Attached Teams'
						count={attachedTeams.length}
					/>
					<div className='flex flex-col divide-y divide-neutral-800/60 border-b border-neutral-800/60'>
						{attachedTeams.map((attached) => {
							const id = typeof attached === "object" ? attached._id : attached;
							const name = typeof attached === "object" ? attached.name : id;
							const ops =
								typeof attached === "object" ? attached.operators || [] : [];
							const assets =
								typeof attached === "object" ? attached.assets || [] : [];

							return (
								<div
									key={id}
									className='px-4 py-3 bg-neutral-950/20'>
									<div className='flex items-center gap-2 mb-2'>
										<span className='font-mono text-[9px] font-semibold text-neutral-300 flex-1 truncate tracking-wide uppercase'>
											{name}
										</span>
										<button
											onClick={() => detachTeamFrom(teamId, id)}
											className='flex items-center gap-1 font-mono text-[6px] tracking-widest uppercase text-neutral-700 hover:text-red-400 border border-neutral-800/40 hover:border-red-900/40 px-1.5 py-0.5 transition-colors'>
											<FontAwesomeIcon
												icon={faXmark}
												className='text-[6px]'
											/>
											Detach
										</button>
									</div>

									{ops.length > 0 ?
										<div className={`grid mb-2 ${getOpCols(ops.length)}`}>
											{ops.map((op, i) => {
												const resolved =
													typeof op === "object" && op._id ?
														operators.find((o) => o._id === op._id) || op
													:	op;
												return (
													<OperatorCard
														key={resolved._id || i}
														operator={resolved}
														onInjuryClick={() => {}}
														onKitSelectClick={setKitSelectorOp}
														assignedKits={kitMap[resolved._id] || []}
													/>
												);
											})}
										</div>
									:	<span className='font-mono text-[7px] text-neutral-700 italic mb-2 block'>
											No operators
										</span>
									}

									{assets.length > 0 && (
										<div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
											{assets.map((asset, i) => (
												<AssetCard
													key={typeof asset === "object" ? asset._id || i : i}
													asset={asset}
												/>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</>
			)}

			{!teamOps.length && !assetCount && (
				<div className='flex flex-col items-center justify-center py-16 gap-3'>
					<div className='w-8 h-8 border border-neutral-700/40 rotate-45' />
					<p className='font-mono text-[9px] tracking-[0.2em] text-neutral-700 uppercase'>
						No team data
					</p>
				</div>
			)}

			{/* Injury dialog */}
			{isInjuryDialogOpen && selectedOperator && (
				<ConfirmDialog
					isOpen={isInjuryDialogOpen}
					closeDialog={handleCloseInjuryDialog}
					selectedOperator={selectedOperator}
					onRandomInjury={() => handleAssignRandomInjury(selectedOperator._id)}
					onKIAInjury={() => handleAssignRandomKIAInjury(selectedOperator._id)}
					onUnknownFate={() => handleAssignUnknownFate(selectedOperator._id)}
					injuryType={injuryType}
				/>
			)}

			{/* Kit selector sheet */}
			<Sheet
				open={!!kitSelectorOp}
				onOpenChange={(open) => {
					if (!open) setKitSelectorOp(null);
				}}>
				<SheetContent
					side='right'
					className='p-0 sm:max-w-md overflow-hidden flex flex-col bg-blk border-l border-neutral-800/60'
					aria-describedby={undefined}>
					<SheetTitle className='sr-only'>
						{kitSelectorOp?.callSign || "Operator"}
					</SheetTitle>
					{kitSelectorOp && (
						<KitSelectorSheet
							operator={kitSelectorOp}
							kits={kits}
							onToggleKit={handleToggleKit}
						/>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
};

SectionHeader.propTypes = { label: PropTypes.string, count: PropTypes.number };
FuelBar.propTypes = { pct: PropTypes.number };
OperatorCard.propTypes = {
	operator: PropTypes.object,
	onInjuryClick: PropTypes.func,
	onKitSelectClick: PropTypes.func,
	assignedKits: PropTypes.array,
};
AssetCard.propTypes = { asset: PropTypes.object };
TeamView.propTypes = { teamId: PropTypes.string.isRequired };

export default TeamView;
