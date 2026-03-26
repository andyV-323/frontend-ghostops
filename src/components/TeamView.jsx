// TeamView.jsx — Military Team Dossier

import { useTeamsStore, useOperatorsStore } from "@/zustand";
import { useEffect, useMemo, useState } from "react";
import { WEAPONS, ITEMS, PERKS, GARAGE } from "@/config";
import { PropTypes } from "prop-types";
import ConfirmDialog from "./ConfirmDialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faSkull,
	faShieldHalved,
	faStar,
	faGasPump,
	faWrench,
} from "@fortawesome/free-solid-svg-icons";

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

/* ─── Operator portrait card ────────────────────────────────── */
function OperatorCard({ operator, onInjuryClick }) {
	const img = operator.imageKey || operator.image || "/ghost/Default.png";
	const status = STATUS_MAP[operator.status] || STATUS_MAP.Active;
	const isKIA = operator.status === "KIA";
	const primaryWeapon = operator.weaponType ? WEAPONS[operator.weaponType] : null;
	const weaponName = operator.weapon || primaryWeapon?.name || null;

	return (
		<div className={[
			"relative flex flex-col overflow-hidden border-r border-neutral-800/50 last:border-r-0 select-none",
			isKIA ? "opacity-60" : "",
		].join(" ")}>
			{/* Portrait image — fills the card */}
			<div className='relative overflow-hidden bg-neutral-950 flex-1' style={{ minHeight: 280 }}>
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

					{weaponName && (
						<div className='flex items-center gap-1 min-w-0'>
							{primaryWeapon?.imgUrl && (
								<img src={primaryWeapon.imgUrl} alt=''
									className='w-7 h-3.5 object-contain shrink-0'
									style={{ filter: "invert(1) opacity(0.45)" }} />
							)}
							<span className='font-mono text-[7px] text-neutral-600 truncate'>{weaponName}</span>
						</div>
					)}

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
			</div>
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
			{/* Large vehicle image */}
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
				{/* Condition badge */}
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
				{/* Name overlay */}
				<div className='absolute bottom-0 left-0 right-0 px-3 pb-2.5'>
					<p className='font-mono text-xs font-bold text-neutral-100 truncate'>{nickname}</p>
					{a?.vehicle && a.nickName && a.nickName !== "None" && (
						<p className='font-mono text-[8px] text-neutral-500 truncate'>{a.vehicle}</p>
					)}
				</div>
			</div>
			{/* Fuel strip */}
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

/* ─── Gear icon ─────────────────────────────────────────────── */
function GearIcon({ imgSrc, name, invert }) {
	return (
		<div title={name} className='flex flex-col items-center gap-1.5 bg-neutral-950/60 border border-neutral-800/60 p-2.5 hover:border-neutral-700/60 transition-colors group'>
			{imgSrc ? (
				<img src={imgSrc} alt={name}
					className='w-9 h-9 object-contain'
					style={invert ? { filter: "invert(1) opacity(0.7)" } : { opacity: 0.75 }} />
			) : (
				<div className='w-9 h-9 border border-neutral-800/40 bg-neutral-900/40 flex items-center justify-center'>
					<span className='font-mono text-[7px] text-neutral-700'>?</span>
				</div>
			)}
			<span className='font-mono text-[6px] text-neutral-600 text-center leading-tight group-hover:text-neutral-400 transition-colors w-full truncate'>
				{name}
			</span>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════
   TEAMVIEW
═══════════════════════════════════════════════════════════════ */
const TeamView = ({ teamId }) => {
	const { teams, fetchTeams, assignRandomInjury, assignRandomKIAInjury, assignUnknownFate } = useTeamsStore();
	const { operators, fetchOperators } = useOperatorsStore();
	const userId = localStorage.getItem("userId");

	const [isInjuryDialogOpen, setIsInjuryDialogOpen] = useState(false);
	const [selectedOperator, setSelectedOperator] = useState(null);
	const [injuryType] = useState("choice");

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
		return [...new Set(all)].filter((p) => Object.prototype.hasOwnProperty.call(PERKS, p));
	}, [teamOps]);

	const combinedEquipment = useMemo(() => {
		const all = teamOps.flatMap((op) => op.items || []);
		return [...new Set(all)].filter((e) => Object.prototype.hasOwnProperty.call(ITEMS, e));
	}, [teamOps]);

	const statusCounts = useMemo(() => ({
		active: teamOps.filter((o) => o.status === "Active").length,
		wia:    teamOps.filter((o) => o.status === "Injured").length,
		kia:    teamOps.filter((o) => o.status === "KIA").length,
	}), [teamOps]);

	const FULL_TEAM_SIZE = 4;
	const CONDITION_SCORE = { Optimal: 1.0, Operational: 0.75, Compromised: 0.4, Critical: 0.1 };

	const readiness = useMemo(() => {
		if (teamOps.length === 0) return { score: 0, loadout: 0, strength: 0 };
		const loadout = teamOps.filter((o) => o.weaponType).length / teamOps.length;
		const strength = Math.min(teamOps.length / FULL_TEAM_SIZE, 1);
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
		const score = assets !== null
			? loadout * 0.4 + assets * 0.35 + strength * 0.25
			: loadout * 0.6 + strength * 0.4;
		return {
			score: Math.round(score * 100),
			loadout: Math.round(loadout * 100),
			strength: Math.round(strength * 100),
		};
	}, [teamOps, selectedTeam?.assets]);

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

	// Operator grid columns: fill row based on count
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
		<div className='w-full min-w-0 text-fontz flex flex-col'>

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
						{selectedTeam.AO && (
							<p className='font-mono text-[8px] tracking-[0.25em] text-neutral-600 uppercase mt-0.5'>
								AO: {selectedTeam.AO}
							</p>
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
					</div>
				)}
			</div>

			{/* ── Operator lineup (team photo) ─────────────── */}
			<SectionHeader label='Operators' count={teamOps.length} />
			{teamOps.length > 0 ? (
				<div className={`grid border-b border-neutral-800/60 ${opCols}`}>
					{teamOps.map((op, i) => (
						<OperatorCard key={op._id || i} operator={op} onInjuryClick={handleOpenInjuryDialog} />
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

			{/* ── Perks ───────────────────────────────────── */}
			{combinedPerks.length > 0 && (
				<>
					<SectionHeader label='Team Perks' count={combinedPerks.length} />
					<div className='grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 p-4 border-b border-neutral-800/60'>
						{combinedPerks.map((perk) => (
							<GearIcon key={perk} imgSrc={PERKS[perk]} name={perk} />
						))}
					</div>
				</>
			)}

			{/* ── Equipment ───────────────────────────────── */}
			{combinedEquipment.length > 0 && (
				<>
					<SectionHeader label='Team Equipment' count={combinedEquipment.length} />
					<div className='grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 p-4 border-b border-neutral-800/60'>
						{combinedEquipment.map((item) => (
							<GearIcon key={item} imgSrc={ITEMS[item]} name={item} invert />
						))}
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
		</div>
	);
};

SectionHeader.propTypes = { label: PropTypes.string, count: PropTypes.number };
FuelBar.propTypes = { pct: PropTypes.number };
GearIcon.propTypes = { imgSrc: PropTypes.string, name: PropTypes.string, invert: PropTypes.bool };
OperatorCard.propTypes = { operator: PropTypes.object, onInjuryClick: PropTypes.func };
AssetCard.propTypes = { asset: PropTypes.object };
TeamView.propTypes = { openSheet: PropTypes.func, teamId: PropTypes.string.isRequired };

export default TeamView;
