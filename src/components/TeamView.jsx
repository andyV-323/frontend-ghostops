// TeamView.jsx — Military Team Dossier

import { useTeamsStore, useOperatorsStore } from "@/zustand";
import { useEffect, useMemo, useState } from "react";
import { WEAPONS, ITEMS, PERKS, GARAGE, MISSION_PROFILES, PROVINCES, ITEM_RESTRICTION_KEYS, PERK_RESTRICTION_KEYS } from "@/config";
import { resolveRestrictions } from "@/utils/Restrictions";
import { PropTypes } from "prop-types";
import ConfirmDialog from "./ConfirmDialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faSkull,
	faShieldHalved,
	faStar,
	faGasPump,
	faWrench,
	faChevronDown,
	faChevronUp,
	faXmark,
	faLocationDot,
	faLink,
} from "@fortawesome/free-solid-svg-icons";
import { TeamsApi } from "@/api";
import { toast } from "react-toastify";
import OperatorImageView from "./OperatorImageView";
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
	Optimal:     "text-green-400 border-green-900/50 bg-green-950/30",
	Operational: "text-btn border-btn/30 bg-btn/5",
	Compromised: "text-amber-400 border-amber-900/50 bg-amber-950/30",
	Critical:    "text-red-400 border-red-900/50 bg-red-950/30",
};

const PROFILE_STYLE = {
	DA:    "text-red-400 border-red-900/50 bg-red-950/20",
	RECON: "text-emerald-400 border-emerald-900/50 bg-emerald-950/20",
	SAB:   "text-amber-400 border-amber-900/50 bg-amber-950/20",
	SUS:   "text-sky-400 border-sky-900/50 bg-sky-950/20",
	COV:   "text-violet-400 border-violet-900/50 bg-violet-950/20",
};

const RESTRICTION_STATUS_STYLE = {
	nominal:  { badge: "text-green-400 border-green-900/40 bg-green-950/20",  dot: "bg-green-500",  label: "AVAIL" },
	degraded: { badge: "text-amber-400 border-amber-900/40 bg-amber-950/20", dot: "bg-amber-400", label: "DEG"   },
	denied:   { badge: "text-red-400 border-red-900/40 bg-red-950/20",       dot: "bg-red-500",   label: "DENIED" },
};

/* ─── Section header ────────────────────────────────────────── */
function SectionHeader({ label, count }) {
	return (
		<div className='flex items-center gap-3 px-4 py-2 border-b border-neutral-800/60 bg-neutral-950/40 shrink-0'>
			<div className='w-0.5 h-3.5 bg-btn/60 shrink-0' />
			<span className='font-mono text-[7px] tracking-[0.35em] text-neutral-500 uppercase flex-1'>{label}</span>
			{count != null && (
				<span className='font-mono text-[7px] text-btn border border-btn/25 bg-btn/5 px-1.5 py-0.5'>{count}</span>
			)}
		</div>
	);
}

/* ─── Fuel bar ──────────────────────────────────────────────── */
function FuelBar({ pct }) {
	const color = pct > 60 ? "bg-green-500" : pct > 25 ? "bg-amber-400" : "bg-red-500";
	return (
		<div className='flex items-center gap-2'>
			<div className='flex-1 h-1 bg-neutral-950/60 overflow-hidden border border-neutral-800/40'>
				<div className={["h-full transition-all", color].join(" ")} style={{ width: `${pct}%` }} />
			</div>
			<span className='font-mono text-[9px] tabular-nums text-neutral-500 w-8 text-right shrink-0'>
				{pct}%
			</span>
		</div>
	);
}

/* ─── Operator portrait card (compact grid tile) ────────────── */
function OperatorCard({ operator, onInjuryClick, missionProfile, onDetailClick }) {
	const img = operator.imageKey || operator.image || "/ghost/Default.png";
	const status = STATUS_MAP[operator.status] || STATUS_MAP.Active;
	const isKIA = operator.status === "KIA";
	const primaryWeapon = operator.weaponType ? WEAPONS[operator.weaponType] : null;
	const weaponName = operator.weapon || primaryWeapon?.name || null;

	const loadouts = operator.loadouts || [];
	const activeLoadout = loadouts.length > 0
		? (missionProfile
			? (loadouts.find((l) => l.missionProfile === missionProfile) || loadouts[0])
			: loadouts[0])
		: null;

	const [expandedSlot, setExpandedSlot] = useState(null);
	useEffect(() => { setExpandedSlot(null); }, [missionProfile, activeLoadout]);

	return (
		<div className={[
			"relative flex flex-col overflow-hidden border-r border-neutral-800/50 last:border-r-0 select-none",
			isKIA ? "opacity-60" : "",
		].join(" ")}>
			{/* Portrait — clickable for detail view */}
			<div
				role='button'
				tabIndex={0}
				onClick={() => onDetailClick(operator)}
				onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onDetailClick(operator); }}
				className='relative overflow-hidden bg-neutral-950 flex-1 cursor-pointer'
				style={{ minHeight: 280 }}>
				<img
					src={img}
					alt={operator.callSign}
					className={[
						"w-full h-full object-cover object-top absolute inset-0",
						isKIA ? "grayscale" : "",
					].join(" ")}
					onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
				/>

				{/* Top badges */}
				<div className='absolute top-0 left-0 right-0 flex items-start justify-between p-1.5 gap-1'>
					<span className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${status.dot}`} />
					<div className='flex flex-col gap-0.5'>
						{operator.support && (
							<div className='w-4 h-4 flex items-center justify-center bg-blue-950/80 border border-blue-800/50'>
								<FontAwesomeIcon icon={faShieldHalved} className='text-blue-400 text-[7px]' />
							</div>
						)}
						{operator.aviator && (
							<div className='w-4 h-4 flex items-center justify-center bg-sky-950/80 border border-sky-800/50'>
								<FontAwesomeIcon icon={faStar} className='text-sky-400 text-[7px]' />
							</div>
						)}
					</div>
				</div>

				{/* Tap hint */}
				<div className='absolute bottom-1 right-1.5 font-mono text-[5px] tracking-widest text-neutral-600 uppercase pointer-events-none'>
					tap
				</div>

				{/* Bottom gradient + identity */}
				<div
					className='absolute bottom-0 left-0 right-0 flex flex-col gap-1 px-2 pb-2 pt-14'
					style={{ background: "linear-gradient(to top, rgba(5,10,8,1) 0%, rgba(5,10,8,0.9) 40%, transparent 100%)" }}>

					<div>
						<p className='font-mono text-[10px] font-bold text-neutral-100 leading-tight truncate'>
							{operator.callSign || "Unknown"}
						</p>
						<p className='font-mono text-[7px] text-neutral-500 truncate uppercase tracking-wider'>
							{operator.class || operator.role || "—"}
						</p>
					</div>

					{activeLoadout ? (
						<div className='flex flex-col gap-0.5'>
							{[
								{ key: "primary",   label: "PRI" },
								{ key: "secondary", label: "SEC" },
								{ key: "handgun",   label: "HDG" },
							].map(({ key, label }) => {
								const slot = activeLoadout[key];
								if (!slot?.weapon) return null;
								return (
									<button
										key={key}
										type='button'
										onClick={(e) => { e.stopPropagation(); setExpandedSlot(expandedSlot === key ? null : key); }}
										className='flex items-center gap-1 min-w-0 text-left hover:opacity-80 transition-opacity'>
										<span className='font-mono text-[6px] text-neutral-600 uppercase tracking-widest shrink-0 w-5'>{label}</span>
										{WEAPONS[slot.weaponType]?.imgUrl && (
											<img src={WEAPONS[slot.weaponType].imgUrl} alt=''
												className='w-6 h-3 object-contain shrink-0'
												style={{ filter: "invert(1) opacity(0.4)" }} />
										)}
										<span className={`font-mono text-[7px] truncate ${expandedSlot === key ? "text-fontz/90" : "text-neutral-400"}`}>
											{slot.weapon}
										</span>
									</button>
								);
							})}
						</div>
					) : weaponName ? (
						<div className='flex items-center gap-1 min-w-0'>
							{primaryWeapon?.imgUrl && (
								<img src={primaryWeapon.imgUrl} alt=''
									className='w-7 h-3.5 object-contain shrink-0'
									style={{ filter: "invert(1) opacity(0.45)" }} />
							)}
							<span className='font-mono text-[7px] text-neutral-600 truncate'>{weaponName}</span>
						</div>
					) : null}
				</div>
			</div>

			{/* Attachment detail panel */}
			{expandedSlot && activeLoadout?.[expandedSlot] && (
				<div className='px-2 py-2 bg-neutral-950/90 border-t border-neutral-800/50'>
					<p className='font-mono text-[7px] font-semibold text-neutral-300 mb-1.5 uppercase tracking-wide'>
						{expandedSlot === "primary" ? "PRI" : expandedSlot === "secondary" ? "SEC" : "HDG"}
						{" · "}{activeLoadout[expandedSlot].weapon}
					</p>
					{Object.entries(activeLoadout[expandedSlot].attachments || {})
						.filter(([, v]) => v)
						.map(([k, v]) => (
							<div key={k} className='flex items-baseline gap-1.5 min-w-0'>
								<span className='font-mono text-[5px] uppercase tracking-widest text-neutral-700 shrink-0 w-12'>{k}</span>
								<span className='font-mono text-[6px] text-neutral-500 truncate'>{v}</span>
							</div>
						))}
					{!Object.values(activeLoadout[expandedSlot].attachments || {}).some(Boolean) && (
						<p className='font-mono text-[6px] text-neutral-700 italic'>No attachments</p>
					)}
				</div>
			)}

			{/* Injury button */}
			<button
				onClick={(e) => { e.stopPropagation(); onInjuryClick(operator); }}
				disabled={isKIA}
				className={[
					"w-full flex items-center justify-center gap-1 font-mono text-[6px] tracking-widest uppercase py-1 border transition-all",
					isKIA
						? "text-neutral-800 border-neutral-900/40 cursor-not-allowed"
						: "text-red-400/40 border-red-900/30 hover:text-red-400 hover:border-red-500/50 hover:bg-red-950/20",
				].join(" ")}>
				<FontAwesomeIcon icon={faSkull} className='text-[6px]' />
				Injury
			</button>
		</div>
	);
}

/* ─── Asset card ────────────────────────────────────────────── */
function AssetCard({ asset }) {
	const a = typeof asset === "object" ? asset : null;
	const garageEntry = GARAGE.find((g) => g.name === a?.vehicle);
	const assetImg = garageEntry?.imgUrl || a?.imgUrl || a?.image || null;
	const nickname = a?.nickName && a.nickName !== "None" ? a.nickName : a?.vehicle || "Unknown";
	const condBadge = CONDITION_BADGE[a?.condition] || "text-neutral-500 border-neutral-800/40 bg-neutral-900/20";

	return (
		<div className='bg-neutral-900/40 border border-neutral-800/60 overflow-hidden hover:border-neutral-700/60 transition-colors'>
			<div className='relative h-44 overflow-hidden bg-neutral-900/40'>
				{assetImg ? (
					<img
						src={assetImg}
						alt={a?.vehicle || "Vehicle"}
						className={[
							"w-full h-full object-contain object-center",
							a?.isRepairing ? "grayscale opacity-40" : "opacity-90",
						].join(" ")}
						onError={(e) => { e.currentTarget.style.display = "none"; }}
					/>
				) : (
					<div className='w-full h-full flex items-center justify-center'>
						<span className='font-mono text-[8px] text-neutral-700 tracking-widest uppercase'>No Image</span>
					</div>
				)}
				<div className='absolute inset-0' style={{ background: "linear-gradient(to top, rgba(5,10,8,0.95) 0%, transparent 55%)" }} />
				{a?.condition && (
					<span className={`absolute top-2 left-2 font-mono text-[7px] tracking-widest uppercase px-1.5 py-0.5 border ${condBadge}`}>
						{a.condition}
					</span>
				)}
				{a?.isRepairing && (
					<span className='absolute top-2 right-2 flex items-center gap-1 font-mono text-[7px] tracking-widest uppercase px-1.5 py-0.5 border text-btn border-btn/40 bg-neutral-950/80 animate-pulse'>
						<FontAwesomeIcon icon={faWrench} className='text-[6px]' /> REPAIR
					</span>
				)}
				<div className='absolute bottom-0 left-0 right-0 px-3 pb-2.5'>
					<p className='font-mono text-xs font-bold text-neutral-100 truncate'>{nickname}</p>
					{a?.vehicle && a.nickName && a.nickName !== "None" && (
						<p className='font-mono text-[8px] text-neutral-500 truncate'>{a.vehicle}</p>
					)}
				</div>
			</div>
			{typeof a?.remainingFuel === "number" && (
				<div className='px-3 py-2 border-t border-neutral-800/60'>
					<div className='flex items-center gap-1.5 mb-1.5'>
						<FontAwesomeIcon icon={faGasPump} className='text-neutral-600 text-[7px]' />
						<span className='font-mono text-[7px] tracking-[0.25em] text-neutral-600 uppercase'>Fuel</span>
					</div>
					<FuelBar pct={a.remainingFuel} />
				</div>
			)}
		</div>
	);
}

/* ─── Gear icon with optional restriction badge ─────────────── */
function GearIcon({ imgSrc, name, invert, restrictionStatus, kiaBlackout }) {
	const rs = restrictionStatus ? RESTRICTION_STATUS_STYLE[restrictionStatus] : null;
	if (kiaBlackout) {
		return (
			<div title={`${name} — KIA (unavailable)`} className='relative flex flex-col items-center gap-1.5 bg-neutral-950/60 border border-neutral-900/40 p-2.5 opacity-30'>
				<span className='absolute top-1 right-1 font-mono text-[5px] tracking-widest uppercase px-1 py-0.5 border text-red-900/60 border-red-900/30 bg-red-950/10'>
					KIA
				</span>
				{imgSrc ? (
					<img src={imgSrc} alt={name}
						className='w-9 h-9 object-contain grayscale'
						style={invert ? { filter: "invert(1) opacity(0.3)" } : { opacity: 0.3 }} />
				) : (
					<div className='w-9 h-9 border border-neutral-900/40 bg-neutral-950/40 flex items-center justify-center'>
						<span className='font-mono text-[7px] text-neutral-800'>?</span>
					</div>
				)}
				<span className='font-mono text-[6px] text-center leading-tight w-full truncate text-neutral-800'>
					{name}
				</span>
			</div>
		);
	}
	return (
		<div title={name} className='relative flex flex-col items-center gap-1.5 bg-neutral-950/60 border border-neutral-800/60 p-2.5 hover:border-neutral-700/60 transition-colors group'>
			{rs && (
				<span className={`absolute top-1 right-1 font-mono text-[5px] tracking-widest uppercase px-1 py-0.5 border ${rs.badge}`}>
					{rs.label}
				</span>
			)}
			{imgSrc ? (
				<img src={imgSrc} alt={name}
					className={["w-9 h-9 object-contain", rs?.label === "DENIED" ? "opacity-25 grayscale" : rs?.label === "DEG" ? "opacity-60" : ""].join(" ")}
					style={invert ? { filter: "invert(1) opacity(0.7)" } : { opacity: 0.75 }} />
			) : (
				<div className='w-9 h-9 border border-neutral-800/40 bg-neutral-900/40 flex items-center justify-center'>
					<span className='font-mono text-[7px] text-neutral-700'>?</span>
				</div>
			)}
			<span className={`font-mono text-[6px] text-center leading-tight w-full truncate transition-colors ${rs?.label === "DENIED" ? "text-red-900/60" : rs?.label === "DEG" ? "text-amber-700/60" : "text-neutral-600 group-hover:text-neutral-400"}`}>
				{name}
			</span>
		</div>
	);
}

const CONDITION_SCORE = { Optimal: 1.0, Operational: 0.75, Compromised: 0.4, Critical: 0.1 };

/* ═══════════════════════════════════════════════════════════════
   TEAMVIEW
═══════════════════════════════════════════════════════════════ */
const TeamView = ({ teamId, openSheet }) => {
	const { teams, fetchTeams, assignRandomInjury, assignRandomKIAInjury, assignUnknownFate, attachTeamTo, detachTeamFrom } = useTeamsStore();
	const { operators, fetchOperators } = useOperatorsStore();
	const userId = localStorage.getItem("userId");

	const [isInjuryDialogOpen, setIsInjuryDialogOpen] = useState(false);
	const [selectedOperator, setSelectedOperator] = useState(null);
	const [injuryType] = useState("choice");
	const [missionProfile, setMissionProfile] = useState(null);
	const [detailOp, setDetailOp] = useState(null);
	const [showAOSelector, setShowAOSelector] = useState(false);
	const [savingAO, setSavingAO] = useState(false);
	const [localAO, setLocalAO] = useState("");
	const [showAttachPicker, setShowAttachPicker] = useState(false);

	useEffect(() => {
		fetchOperators();
		fetchTeams();
	}, [fetchOperators, fetchTeams]);

	const handleOpenInjuryDialog = (op) => { setSelectedOperator(op); setIsInjuryDialogOpen(true); };
	const handleCloseInjuryDialog = () => { setIsInjuryDialogOpen(false); setSelectedOperator(null); };

	const handleAssignRandomInjury = async (id) => {
		await assignRandomInjury(id, userId);
		handleCloseInjuryDialog();
		await fetchTeams(); await fetchOperators();
	};
	const handleAssignRandomKIAInjury = async (id) => {
		await assignRandomKIAInjury(id, userId);
		handleCloseInjuryDialog();
		await fetchTeams(); await fetchOperators();
	};
	const handleAssignUnknownFate = async (id) => {
		await assignUnknownFate(id, userId);
		handleCloseInjuryDialog();
		await fetchTeams(); await fetchOperators();
	};

	const selectedTeam = useMemo(() => teams.find((t) => t._id === teamId), [teams, teamId]);

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

	const combinedPerks = useMemo(() => {
		const all = teamOps.flatMap((op) => op.perks || []);
		const unique = [...new Set(all)].filter((p) => Object.prototype.hasOwnProperty.call(PERKS, p));
		return unique.map((perk) => ({
			name: perk,
			kiaBlackout: !teamOps.some((op) => op.status !== "KIA" && (op.perks || []).includes(perk)),
		}));
	}, [teamOps]);

	const combinedEquipment = useMemo(() => {
		const all = teamOps.flatMap((op) => op.items || []);
		const unique = [...new Set(all)].filter((e) => Object.prototype.hasOwnProperty.call(ITEMS, e));
		return unique.map((item) => ({
			name: item,
			kiaBlackout: !teamOps.some((op) => op.status !== "KIA" && (op.items || []).includes(item)),
		}));
	}, [teamOps]);

	const statusCounts = useMemo(() => ({
		active: teamOps.filter((o) => o.status === "Active").length,
		wia:    teamOps.filter((o) => o.status === "Injured").length,
		kia:    teamOps.filter((o) => o.status === "KIA").length,
	}), [teamOps]);

	const readiness = useMemo(() => {
		const total = teamOps.length;
		if (total === 0) return { score: 0, active: 0, total: 0, assets: null };
		const active = teamOps.filter((o) => o.status === "Active").length;
		const assets = selectedTeam?.assets?.length > 0
			? selectedTeam.assets.reduce((sum, a) => {
					const obj = typeof a === "object" ? a : null;
					if (!obj) return sum + 0.75;
					let s = CONDITION_SCORE[obj.condition] ?? 0.75;
					if (obj.isRepairing) s *= 0.5;
					if (typeof obj.remainingFuel === "number" && obj.remainingFuel < 25) s *= 0.7;
					return sum + s;
				}, 0) / selectedTeam.assets.length
			: null;
		const opsScore = active / total;
		const score = assets !== null
			? Math.round((opsScore * 0.7 + assets * 0.3) * 100)
			: Math.round(opsScore * 100);
		return { score, active, total, assets: assets !== null ? Math.round(assets * 100) : null };
	}, [teamOps, selectedTeam?.assets]);

	// AO restrictions
	const aoRestrictions = useMemo(
		() => selectedTeam?.AO ? resolveRestrictions(selectedTeam.AO) : null,
		[selectedTeam?.AO],
	);

	const getItemRestriction = (itemName) => {
		if (!aoRestrictions) return null;
		const key = ITEM_RESTRICTION_KEYS[itemName];
		return key ? aoRestrictions[key]?.status : null;
	};

	const getPerkRestriction = (perkName) => {
		if (!aoRestrictions) return null;
		const key = PERK_RESTRICTION_KEYS[perkName];
		return key ? aoRestrictions[key]?.status : null;
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

	const attachedTeams = useMemo(() => selectedTeam?.attachedTeams || [], [selectedTeam]);
	const attachableTeams = useMemo(() =>
		teams.filter((t) => {
			if (t._id === teamId) return false;
			const alreadyAttached = attachedTeams.some(
				(a) => (typeof a === "object" ? a._id : a) === t._id,
			);
			return !alreadyAttached;
		}),
	[teams, teamId, attachedTeams]);

	if (!selectedTeam) {
		return (
			<div className='flex flex-col items-center justify-center py-16 gap-3'>
				<div className='w-8 h-8 border border-neutral-700/40 rotate-45' />
				<p className='font-mono text-[10px] tracking-[0.22em] text-neutral-700 uppercase'>Team not found</p>
			</div>
		);
	}

	const scoreColor = readiness.score >= 75 ? "text-green-400" : readiness.score >= 40 ? "text-amber-400" : "text-red-400";
	const barColor   = readiness.score >= 75 ? "bg-green-500"   : readiness.score >= 40 ? "bg-amber-400"   : "bg-red-500";

	const opCols =
		teamOps.length === 1 ? "grid-cols-1" :
		teamOps.length === 2 ? "grid-cols-2" :
		teamOps.length === 3 ? "grid-cols-3" :
		teamOps.length === 5 ? "grid-cols-5" :
		teamOps.length === 6 ? "grid-cols-3 sm:grid-cols-6" :
		teamOps.length === 7 ? "grid-cols-4 sm:grid-cols-7" :
		"grid-cols-4";

	const assetCount = selectedTeam?.assets?.length ?? 0;
	const hasLoadout = combinedPerks.length > 0 || combinedEquipment.length > 0;

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
					<div key={i} className={`absolute w-3 h-3 border-neutral-700/40 pointer-events-none ${cls}`} />
				))}

				<div className='flex items-start justify-between gap-4'>
					<div className='min-w-0'>
						<h2 className='font-mono text-sm font-bold text-neutral-100 tracking-wide truncate'>
							{selectedTeam.name}
						</h2>

						{/* AO row */}
						<div className='flex items-center gap-2 mt-0.5'>
							{selectedTeam.AO ? (
								<button
									onClick={() => setShowAOSelector((v) => !v)}
									className='flex items-center gap-1 font-mono text-[8px] tracking-[0.25em] text-neutral-500 uppercase hover:text-btn transition-colors'>
									<FontAwesomeIcon icon={faLocationDot} className='text-[7px]' />
									AO: {selectedTeam.AO}
									<FontAwesomeIcon icon={showAOSelector ? faChevronUp : faChevronDown} className='text-[6px]' />
								</button>
							) : (
								<button
									onClick={() => setShowAOSelector((v) => !v)}
									className='flex items-center gap-1 font-mono text-[8px] tracking-[0.25em] text-neutral-700 uppercase hover:text-btn transition-colors'>
									<FontAwesomeIcon icon={faLocationDot} className='text-[7px]' />
									Set AO
									<FontAwesomeIcon icon={showAOSelector ? faChevronUp : faChevronDown} className='text-[6px]' />
								</button>
							)}
						</div>

						{/* AO dropdown */}
						{showAOSelector && (
							<div className='mt-2 flex items-center gap-2'>
								<select
									className='flex-1 bg-neutral-950 border border-neutral-700/60 px-2 py-1 font-mono text-[9px] text-neutral-300 outline-none focus:border-btn/50'
									value={localAO}
									onChange={(e) => { setLocalAO(e.target.value); handleAOSave(e.target.value); }}
									disabled={savingAO}>
									<option value=''>— No AO —</option>
									{Object.keys(PROVINCES).map((key) => (
										<option key={key} value={key}>{key}</option>
									))}
								</select>
								{savingAO && (
									<span className='font-mono text-[8px] text-neutral-600 animate-pulse'>Saving…</span>
								)}
								<button
									onClick={() => setShowAOSelector(false)}
									className='text-neutral-600 hover:text-neutral-400 transition-colors'>
									<FontAwesomeIcon icon={faXmark} className='text-[10px]' />
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
							<span className='font-mono text-[7px] tracking-[0.3em] text-neutral-600 uppercase'>Combat Readiness</span>
							<span className={`font-mono text-sm font-bold ${scoreColor}`}>{readiness.score}%</span>
						</div>
						<div className='h-1.5 overflow-hidden bg-neutral-950/60 border border-neutral-800/40'>
							<div className={`${barColor} h-full transition-all duration-500`} style={{ width: `${readiness.score}%` }} />
						</div>
						<div className='flex items-center gap-4 mt-1.5'>
							<span className='font-mono text-[7px] text-neutral-700 uppercase tracking-wide'>
								ACTIVE <span className='text-neutral-500'>{readiness.active}/{readiness.total}</span>
							</span>
							{readiness.assets !== null && (
								<span className='font-mono text-[7px] text-neutral-700 uppercase tracking-wide'>
									ASSETS <span className='text-neutral-500'>{readiness.assets}%</span>
								</span>
							)}
						</div>
					</div>
				)}

				{/* Mission profile selector */}
				{teamOps.length > 0 && (
					<div className='mt-3 pt-3 border-t border-neutral-800/60 flex items-center justify-between'>
						<span className='font-mono text-[7px] tracking-[0.3em] text-neutral-600 uppercase'>Mission Profile</span>
						<button
							type='button'
							onClick={() => {
								const keys = Object.keys(MISSION_PROFILES);
								if (!missionProfile) {
									setMissionProfile(keys[0]);
								} else {
									const idx = keys.indexOf(missionProfile);
									setMissionProfile(idx < keys.length - 1 ? keys[idx + 1] : null);
								}
							}}
							className={[
								"flex items-center gap-1.5 font-mono text-[7px] tracking-widest uppercase px-2 py-0.5 border transition-colors",
								missionProfile
									? (PROFILE_STYLE[missionProfile] || "text-btn border-btn/30")
									: "text-neutral-600 border-neutral-700/40 hover:text-neutral-400 hover:border-neutral-600",
							].join(" ")}>
							‹ {missionProfile ? MISSION_PROFILES[missionProfile]?.name : "All Profiles"} ›
						</button>
					</div>
				)}

				{/* Attach team row */}
				<div className='mt-3 pt-3 border-t border-neutral-800/60 flex items-center gap-2 flex-wrap'>
					<span className='font-mono text-[7px] tracking-[0.3em] text-neutral-600 uppercase flex-1'>
						{attachedTeams.length > 0 ? `${attachedTeams.length} attached` : "Attached Teams"}
					</span>
					<button
						type='button'
						onClick={() => setShowAttachPicker((v) => !v)}
						className='flex items-center gap-1 font-mono text-[7px] tracking-widest uppercase px-2 py-0.5 border text-neutral-600 border-neutral-700/40 hover:text-violet-400 hover:border-violet-900/50 transition-colors'>
						<FontAwesomeIcon icon={faLink} className='text-[6px]' />
						Attach
					</button>
				</div>
				{showAttachPicker && (
					<div className='mt-2'>
						<select
							className='w-full bg-neutral-950 border border-neutral-700/60 px-2 py-1 font-mono text-[9px] text-neutral-300 outline-none focus:border-violet-900/50'
							defaultValue=''
							onChange={(e) => {
								if (e.target.value) {
									attachTeamTo(teamId, e.target.value);
									setShowAttachPicker(false);
								}
							}}>
							<option value=''>— Select Team to Attach —</option>
							{attachableTeams.map((t) => (
								<option key={t._id} value={t._id}>{t.name}</option>
							))}
						</select>
					</div>
				)}
			</div>

			{/* ── Operator lineup ──────────────────────────── */}
			<SectionHeader label='Operators' count={teamOps.length} />
			{teamOps.length > 0 ? (
				<div className={`grid border-b border-neutral-800/60 ${opCols}`}>
					{teamOps.map((op, i) => (
						<OperatorCard
							key={op._id || i}
							operator={op}
							onInjuryClick={handleOpenInjuryDialog}
							missionProfile={missionProfile}
							onDetailClick={setDetailOp}
						/>
					))}
				</div>
			) : (
				<div className='flex flex-col items-center justify-center py-12 gap-2 border-b border-neutral-800/60'>
					<div className='w-6 h-6 border border-neutral-700/40 rotate-45' />
					<p className='font-mono text-[9px] tracking-[0.2em] text-neutral-700 uppercase'>No operators assigned</p>
				</div>
			)}

			{/* ── Assets ──────────────────────────────────── */}
			{assetCount > 0 && (
				<>
					<SectionHeader label='Assets' count={assetCount} />
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-b border-neutral-800/60'>
						{selectedTeam.assets.map((asset, i) => (
							<AssetCard key={typeof asset === "object" ? asset._id || i : i} asset={asset} />
						))}
					</div>
				</>
			)}

			{/* ── Attached Teams ───────────────────────────── */}
			{attachedTeams.length > 0 && (
				<>
					<SectionHeader label='Attached Teams' count={attachedTeams.length} />
					<div className='flex flex-col divide-y divide-neutral-800/60 border-b border-neutral-800/60'>
						{attachedTeams.map((attached) => {
							const id = typeof attached === "object" ? attached._id : attached;
							const name = typeof attached === "object" ? attached.name : id;
							const ops = typeof attached === "object" ? (attached.operators || []) : [];
							const assets = typeof attached === "object" ? (attached.assets || []) : [];
							const activeCount = ops.filter((o) => o.status === "Active").length;
							const wiaCount = ops.filter((o) => o.status === "Injured").length;
							const kiaCount = ops.filter((o) => o.status === "KIA").length;

							return (
								<div key={id} className='px-4 py-3 bg-neutral-950/20'>
									{/* Row: name + detach */}
									<div className='flex items-center gap-2 mb-2'>
										<FontAwesomeIcon icon={faLink} className='text-violet-500/50 text-[8px] shrink-0' />
										<span className='font-mono text-[9px] font-semibold text-neutral-300 flex-1 truncate tracking-wide uppercase'>
											{name}
										</span>
										<button
											onClick={() => detachTeamFrom(teamId, id)}
											className='flex items-center gap-1 font-mono text-[6px] tracking-widest uppercase text-neutral-700 hover:text-red-400 border border-neutral-800/40 hover:border-red-900/40 px-1.5 py-0.5 transition-colors'>
											<FontAwesomeIcon icon={faXmark} className='text-[6px]' />
											Detach
										</button>
									</div>

									{/* Operator status summary */}
									<div className='flex items-center gap-2 mb-2'>
										{ops.length === 0 ? (
											<span className='font-mono text-[7px] text-neutral-700 italic'>No operators</span>
										) : (
											<>
												<span className='font-mono text-[7px] text-green-400/70'>{activeCount} Active</span>
												{wiaCount > 0 && <span className='font-mono text-[7px] text-amber-400/70'>{wiaCount} WIA</span>}
												{kiaCount > 0 && <span className='font-mono text-[7px] text-red-400/70'>{kiaCount} KIA</span>}
											</>
										)}
									</div>

									{/* Assets */}
									{assets.length > 0 ? (
										<div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
											{assets.map((asset, i) => (
												<AssetCard key={typeof asset === "object" ? asset._id || i : i} asset={asset} />
											))}
										</div>
									) : (
										<span className='font-mono text-[7px] text-neutral-700 italic'>No assets</span>
									)}
								</div>
							);
						})}
					</div>
				</>
			)}

			{/* ── Team Perks ──────────────────────────────── */}
			{combinedPerks.length > 0 && (
				<>
					<SectionHeader label='Team Perks' count={combinedPerks.length} />
					<div className='px-4 pt-3 pb-4 border-b border-neutral-800/60'>
						<div className='grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2'>
							{combinedPerks.map(({ name, kiaBlackout }) => (
								<GearIcon
									key={name}
									imgSrc={PERKS[name]}
									name={name}
									restrictionStatus={getPerkRestriction(name)}
									kiaBlackout={kiaBlackout}
								/>
							))}
						</div>
					</div>
				</>
			)}

			{/* ── Team Equipment ───────────────────────────── */}
			{combinedEquipment.length > 0 && (
				<>
					<SectionHeader label='Team Equipment' count={combinedEquipment.length} />
					<div className='px-4 pt-3 pb-4 border-b border-neutral-800/60'>
						<div className='grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2'>
							{combinedEquipment.map(({ name, kiaBlackout }) => (
								<GearIcon
									key={name}
									imgSrc={ITEMS[name]}
									name={name}
									invert
									restrictionStatus={getItemRestriction(name)}
									kiaBlackout={kiaBlackout}
								/>
							))}
						</div>
					</div>
				</>
			)}

			{!teamOps.length && !assetCount && !hasLoadout && (
				<div className='flex flex-col items-center justify-center py-16 gap-3'>
					<div className='w-8 h-8 border border-neutral-700/40 rotate-45' />
					<p className='font-mono text-[9px] tracking-[0.2em] text-neutral-700 uppercase'>No team data</p>
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

			{/* Operator detail — standalone sheet, closing returns here */}
			<Sheet open={!!detailOp} onOpenChange={(open) => { if (!open) setDetailOp(null); }}>
				<SheetContent side='right' className='p-0 sm:max-w-md overflow-y-auto bg-blk border-l border-neutral-800/60' aria-describedby={undefined}>
					<SheetTitle className='sr-only'>{detailOp?.callSign || "Operator"}</SheetTitle>
	{detailOp && <OperatorImageView operator={detailOp} openSheet={openSheet} />}
				</SheetContent>
			</Sheet>

		</div>
	);
};

SectionHeader.propTypes = { label: PropTypes.string, count: PropTypes.number };
FuelBar.propTypes = { pct: PropTypes.number };
GearIcon.propTypes = { imgSrc: PropTypes.string, name: PropTypes.string, invert: PropTypes.bool, restrictionStatus: PropTypes.string, kiaBlackout: PropTypes.bool };
OperatorCard.propTypes = { operator: PropTypes.object, onInjuryClick: PropTypes.func, missionProfile: PropTypes.string, onDetailClick: PropTypes.func };
AssetCard.propTypes = { asset: PropTypes.object };
TeamView.propTypes = { openSheet: PropTypes.func, teamId: PropTypes.string.isRequired };

export default TeamView;
