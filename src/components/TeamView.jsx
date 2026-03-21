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
		label: "ACTIVE",
	},
	Injured: {
		dot: "bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.6)]",
		text: "text-amber-400",
		label: "WIA",
	},
	KIA: {
		dot: "bg-red-500   shadow-[0_0_5px_rgba(239,68,68,0.6)]",
		text: "text-red-400",
		label: "KIA",
	},
};

const CONDITION_COLOR = {
	Optimal: "text-green-400",
	Operational: "text-btn",
	Compromised: "text-amber-400",
	Critical: "text-red-400",
};

/* ─── Section header ────────────────────────────────────────── */
function SectionHeader({ label, count }) {
	return (
		<div className='flex items-center gap-3 mb-3'>
			<div className='w-1 h-3 bg-btn shrink-0' />
			<span className='font-mono text-[10px] tracking-[0.22em] text-lines/50 uppercase'>
				{label}
			</span>
			{count !== undefined && (
				<span className='font-mono text-[9px] text-btn border border-btn/30 bg-btn/5 px-1.5 py-0.5 rounded-sm'>
					{count}
				</span>
			)}
			<div className='flex-1 h-px bg-lines/10' />
		</div>
	);
}

/* ─── Readiness factor chip ─────────────────────────────────── */
function ReadinessFactor({ label, value }) {
	const color = value >= 75 ? "text-green-400" : value >= 40 ? "text-amber-400" : "text-red-400";
	return (
		<div className='flex items-center gap-1.5'>
			<span className={`w-1.5 h-1.5 rounded-full shrink-0 ${value >= 75 ? "bg-green-500" : value >= 40 ? "bg-amber-400" : "bg-red-500"}`} />
			<span className='font-mono text-[8px] text-lines/30 uppercase tracking-widest'>{label}</span>
			<span className={`font-mono text-[8px] ${color}`}>{value}%</span>
		</div>
	);
}

/* ─── Gear chip ─────────────────────────────────────────────── */
function GearChip({ imgSrc, name, invert }) {
	return (
		<div className='flex flex-col items-center gap-1.5 bg-blk/40 border border-lines/15 rounded-sm p-2 hover:border-lines/30 transition-colors group'>
			{imgSrc ? (
				<img src={imgSrc} alt={name} className='w-9 h-9 object-contain' style={invert ? { filter: "invert(1) opacity(0.8)" } : undefined} />
			) : (
				<div className='w-9 h-9 border border-lines/10 rounded-sm bg-lines/5 flex items-center justify-center'>
					<span className='font-mono text-[7px] text-lines/20'>N/A</span>
				</div>
			)}
			<span className='font-mono text-[8px] text-lines/45 text-center leading-tight group-hover:text-lines/70 transition-colors truncate w-full'>
				{name}
			</span>
		</div>
	);
}

/* ─── Fuel bar ──────────────────────────────────────────────── */
function FuelBar({ pct }) {
	const color =
		pct > 60 ? "bg-green-500" : pct > 25 ? "bg-amber-400" : "bg-red-500";
	return (
		<div className='flex items-center gap-2'>
			<div className='flex-1 h-1 bg-blk/60 rounded-full overflow-hidden border border-lines/10'>
				<div
					className={["h-full rounded-full transition-all", color].join(" ")}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span className='font-mono text-[9px] tabular-nums text-lines/40 w-7 text-right shrink-0'>
				{pct}%
			</span>
		</div>
	);
}

/* ─── Operator card ─────────────────────────────────────────── */
function OperatorCard({ operator, onInjuryClick }) {
	const img = operator.imageKey || operator.image || "/ghost/Default.png";
	const status = STATUS_MAP[operator.status] || STATUS_MAP.Active;
	const isKIA = operator.status === "KIA";

	return (
		<div className='flex flex-col bg-blk/60 border border-lines/20 rounded-sm overflow-hidden group hover:border-lines/40 transition-colors'>
			{/* Photo */}
			<div className='relative aspect-[3/4] overflow-hidden bg-highlight/10'>
				<img
					src={img}
					alt={operator.callSign || "Operator"}
					className={[
						"w-full h-full object-cover object-top transition-all",
						isKIA ? "grayscale opacity-50" : "group-hover:scale-[1.02]",
					].join(" ")}
					onError={(e) => {
						e.currentTarget.src = "/ghost/Default.png";
					}}
				/>
				{/* Status badge overlay */}
				<div
					className={[
						"absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-sm",
						"bg-blk/75 border",
						isKIA ? "border-red-900/40" : "border-lines/20",
					].join(" ")}>
					<span className={["w-1.5 h-1.5 rounded-full shrink-0", status.dot].join(" ")} />
					<span className={["font-mono text-[8px] tracking-widest uppercase", status.text].join(" ")}>
						{status.label}
					</span>
				</div>
				{/* Specialist badges */}
				{(operator.support || operator.aviator) && (
					<div className='absolute top-2 right-2 flex flex-col gap-1'>
						{operator.support && (
							<div className='flex items-center justify-center w-6 h-6 bg-blue-900/70 border border-blue-700/40 rounded-sm'>
								<FontAwesomeIcon icon={faShieldHalved} className='text-blue-400 text-[9px]' />
							</div>
						)}
						{operator.aviator && (
							<div className='flex items-center justify-center w-6 h-6 bg-sky-900/70 border border-sky-700/40 rounded-sm'>
								<FontAwesomeIcon icon={faStar} className='text-sky-400 text-[9px]' />
							</div>
						)}
					</div>
				)}
				{/* Bottom gradient with weapon info */}
				{operator.weaponType && (
					<div
						className='absolute bottom-0 left-0 right-0 px-2 pb-2 pt-4'
						style={{ background: "linear-gradient(to top, rgba(5,10,8,0.92) 0%, transparent 100%)" }}>
						<div className='flex items-center gap-1.5'>
							{WEAPONS[operator.weaponType]?.imgUrl && (
								<img
									src={WEAPONS[operator.weaponType].imgUrl}
									alt='weapon'
									className='w-6 h-6 object-contain shrink-0'
								style={{ filter: "invert(1) opacity(0.75)" }}
								/>
							)}
							<span className='font-mono text-[8px] text-lines/50 truncate'>
								{operator.weapon || WEAPONS[operator.weaponType]?.name || "Unknown"}
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Info strip */}
			<div className='px-2.5 py-2 flex flex-col gap-2 flex-1 bg-blk/40'>
				<div>
					<p className='font-mono text-xs font-bold text-fontz truncate'>
						{operator.callSign || "Unknown"}
					</p>
					<p className='font-mono text-[9px] text-lines/35 truncate'>
						{operator.class || "No Class"}{operator.role ? ` · ${operator.role}` : ""}
					</p>
				</div>

				<div className='flex-1' />

				{/* Assign injury */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						onInjuryClick(operator);
					}}
					disabled={isKIA}
					className={[
						"w-full flex items-center justify-center gap-1.5 font-mono text-[9px] tracking-widest uppercase py-1.5 border rounded-sm transition-all",
						isKIA
							? "text-lines/20 border-lines/10 cursor-not-allowed"
							: "text-red-400/60 border-red-900/30 bg-red-900/5 hover:bg-red-900/15 hover:border-red-500/40 hover:text-red-400",
					].join(" ")}>
					<FontAwesomeIcon icon={faSkull} className='text-[9px]' />
					Assign Injury
				</button>
			</div>
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
	const condColor = CONDITION_COLOR[a?.condition] || "text-lines/50";
	const condBadge = {
		Optimal: "text-green-400 border-green-900/40 bg-green-900/15",
		Operational: "text-btn border-btn/30 bg-btn/5",
		Compromised: "text-amber-400 border-amber-900/40 bg-amber-900/15",
		Critical: "text-red-400 border-red-900/40 bg-red-900/15",
	}[a?.condition] || "text-lines/40 border-lines/15 bg-blk/20";

	return (
		<div className='bg-blk/50 border border-lines/15 rounded-sm overflow-hidden hover:border-lines/30 transition-colors'>
			{/* Banner image */}
			{assetImg && (
				<div
					className='relative h-20 overflow-hidden bg-blk/60'
					style={{ background: "linear-gradient(135deg, #0c1410 0%, #182420 100%)" }}>
					<img
						src={assetImg}
						alt={a?.vehicle || "Vehicle"}
						className={[
							"w-full h-full object-contain object-center",
							a?.isRepairing ? "grayscale opacity-50" : "opacity-90",
						].join(" ")}
						onError={(e) => { e.currentTarget.style.display = "none"; }}
					/>
					<div
						className='absolute inset-0'
						style={{ background: "linear-gradient(to top, rgba(5,10,8,0.85) 0%, transparent 60%)" }}
					/>
					{/* Condition badge */}
					{a?.condition && (
						<span className={`absolute top-2 left-2 font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm border ${condBadge}`}>
							{a.condition}
						</span>
					)}
					{/* Repairing badge */}
					{a?.isRepairing && (
						<span className='absolute top-2 right-2 flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm border text-btn border-btn/30 bg-blk/70 animate-pulse'>
							<FontAwesomeIcon icon={faWrench} className='text-[7px]' />
							REPAIR
						</span>
					)}
					{/* Name overlay */}
					<div className='absolute bottom-0 left-0 right-0 px-2.5 pb-1.5'>
						<p className='font-mono text-[10px] font-bold text-fontz/90 truncate'>{nickname}</p>
						{a?.vehicle && a.nickName !== "None" && a.nickName && (
							<p className='font-mono text-[8px] text-lines/35 truncate'>{a.vehicle}</p>
						)}
					</div>
				</div>
			)}

			{/* Details strip */}
			{!assetImg && (
				<div className='px-3 py-2'>
					<p className='font-mono text-xs text-fontz/85 truncate'>{nickname}</p>
					{a?.vehicle && a.nickName !== "None" && (
						<p className='font-mono text-[9px] text-lines/35 truncate'>{a.vehicle}</p>
					)}
				</div>
			)}
			<div className='px-3 py-2 flex items-center gap-4'>
				{typeof a?.remainingFuel === "number" && (
					<div className='flex-1'>
						<div className='flex items-center gap-1 mb-1'>
							<FontAwesomeIcon icon={faGasPump} className='text-lines/30 text-[8px]' />
							<span className='font-mono text-[8px] text-lines/30 uppercase tracking-widest'>Fuel</span>
						</div>
						<FuelBar pct={a.remainingFuel} />
					</div>
				)}
				{!assetImg && a?.condition && (
					<span className={["font-mono text-[9px] tracking-widest uppercase shrink-0", condColor].join(" ")}>
						{a.condition}
					</span>
				)}
			</div>
		</div>
	);
}

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
	} = useTeamsStore();
	const { operators, fetchOperators } = useOperatorsStore();
	const userId = localStorage.getItem("userId");

	const [isInjuryDialogOpen, setIsInjuryDialogOpen] = useState(false);
	const [selectedOperator, setSelectedOperator] = useState(null);
	const [injuryType] = useState("choice");

	useEffect(() => {
		fetchOperators();
		fetchTeams();
	}, [fetchOperators, fetchTeams]);

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
		return [...new Set(all)].filter((p) =>
			Object.prototype.hasOwnProperty.call(PERKS, p),
		);
	}, [teamOps]);

	const combinedEquipment = useMemo(() => {
		const all = teamOps.flatMap((op) => op.items || []);
		return [...new Set(all)].filter((e) =>
			Object.prototype.hasOwnProperty.call(ITEMS, e),
		);
	}, [teamOps]);

	const statusCounts = useMemo(
		() => ({
			active: teamOps.filter((o) => o.status === "Active").length,
			wia: teamOps.filter((o) => o.status === "Injured").length,
			kia: teamOps.filter((o) => o.status === "KIA").length,
		}),
		[teamOps],
	);

	const FULL_TEAM_SIZE = 4;
	const CONDITION_SCORE = { Optimal: 1.0, Operational: 0.75, Compromised: 0.4, Critical: 0.1 };

	const readiness = useMemo(() => {
		if (teamOps.length === 0) return { score: 0, loadout: 0, assets: null, strength: 0 };

		// Loadout: % of operators with a primary weapon assigned
		const loadout = teamOps.length > 0
			? teamOps.filter((o) => o.weaponType).length / teamOps.length
			: 1;

		// Strength: team size relative to full team
		const strength = Math.min(teamOps.length / FULL_TEAM_SIZE, 1);

		// Asset condition: average score factoring condition, fuel, and repair status
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

		// Weighted score
		const score = assets !== null
			? loadout * 0.4 + assets * 0.35 + strength * 0.25
			: loadout * 0.6 + strength * 0.4;

		return { score: Math.round(score * 100), loadout: Math.round(loadout * 100), assets: assets !== null ? Math.round(assets * 100) : null, strength: Math.round(strength * 100) };
	}, [teamOps, selectedTeam?.assets]);

	if (!selectedTeam) {
		return (
			<div className='flex flex-col items-center justify-center py-16 gap-3'>
				<div className='w-8 h-8 border border-lines/20 rotate-45' />
				<p className='font-mono text-[10px] tracking-[0.22em] text-lines/25 uppercase'>
					Team not found
				</p>
			</div>
		);
	}

	return (
		<div className='w-full min-w-0 text-fontz'>
			<div className='flex flex-col gap-5 px-4 py-4'>
				{/* ── Team header ── */}
				<div className='bg-blk/60 border border-lines/20 rounded-sm px-4 py-3'>
					<div className='flex items-start justify-between gap-4'>
						<div className='min-w-0'>
							<h2 className='font-mono text-base font-bold text-fontz tracking-wide truncate'>
								{selectedTeam.name}
							</h2>
							{selectedTeam.AO && (
								<p className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase mt-0.5'>
									AO: {selectedTeam.AO}
								</p>
							)}
						</div>
						{/* Strength counts */}
						<div className='flex gap-3 shrink-0'>
							<div className='flex flex-col items-center gap-0.5'>
								<span className='font-mono text-sm font-bold text-green-400'>
									{statusCounts.active}
								</span>
								<span className='font-mono text-[8px] tracking-widest text-lines/30 uppercase'>
									Active
								</span>
							</div>
							{statusCounts.wia > 0 && (
								<div className='flex flex-col items-center gap-0.5'>
									<span className='font-mono text-sm font-bold text-amber-400'>
										{statusCounts.wia}
									</span>
									<span className='font-mono text-[8px] tracking-widest text-lines/30 uppercase'>
										WIA
									</span>
								</div>
							)}
							{statusCounts.kia > 0 && (
								<div className='flex flex-col items-center gap-0.5'>
									<span className='font-mono text-sm font-bold text-red-400'>
										{statusCounts.kia}
									</span>
									<span className='font-mono text-[8px] tracking-widest text-lines/30 uppercase'>
										KIA
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Readiness bar */}
					{teamOps.length > 0 && (
						<div className='mt-3 pt-3 border-t border-lines/10'>
							{(() => {
								const barColor = readiness.score >= 75 ? "bg-green-500" : readiness.score >= 40 ? "bg-amber-400" : "bg-red-500";
								const scoreColor = readiness.score >= 75 ? "text-green-400" : readiness.score >= 40 ? "text-amber-400" : "text-red-400";
								return (
									<>
										<div className='flex items-center justify-between mb-1.5'>
											<span className='font-mono text-[8px] tracking-[0.2em] text-lines/30 uppercase'>
												Combat Readiness
											</span>
											<span className={`font-mono text-sm font-bold ${scoreColor}`}>
												{readiness.score}%
											</span>
										</div>
										<div className='h-1.5 rounded-full overflow-hidden bg-blk/60 border border-lines/10'>
											<div
												className={`${barColor} h-full rounded-full transition-all duration-500`}
												style={{ width: `${readiness.score}%` }}
											/>
										</div>
										<div className='flex flex-wrap gap-x-4 gap-y-1 mt-2'>
											<ReadinessFactor label='Loadout' value={readiness.loadout} />
											{readiness.assets !== null && <ReadinessFactor label='Assets' value={readiness.assets} />}
											<ReadinessFactor label='Strength' value={readiness.strength} />
										</div>
									</>
								);
							})()}
						</div>
					)}
				</div>

				{/* ── Operator roster ── */}
				{teamOps.length > 0 ? (
					<div>
						<SectionHeader label='Operator Roster' count={teamOps.length} />
						<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5'>
							{teamOps.map((op, i) => (
								<OperatorCard
									key={op._id || i}
									operator={op}
									onInjuryClick={handleOpenInjuryDialog}
								/>
							))}
						</div>
					</div>
				) : (
					<div className='flex flex-col items-center justify-center py-12 gap-2'>
						<div className='w-6 h-6 border border-lines/20 rotate-45' />
						<p className='font-mono text-[10px] tracking-[0.2em] text-lines/25 uppercase'>
							No operators assigned
						</p>
					</div>
				)}

				{/* ── Team perks ── */}
				{combinedPerks.length > 0 && (
					<div>
						<SectionHeader label='Team Perks' count={combinedPerks.length} />
						<div className='grid grid-cols-4 sm:grid-cols-6 gap-2'>
							{combinedPerks.map((perk) => (
								<GearChip key={perk} imgSrc={PERKS[perk]} name={perk} />
							))}
						</div>
					</div>
				)}

				{/* ── Team equipment ── */}
				{combinedEquipment.length > 0 && (
					<div>
						<SectionHeader label='Team Equipment' count={combinedEquipment.length} />
						<div className='grid grid-cols-4 sm:grid-cols-6 gap-2'>
							{combinedEquipment.map((item) => (
								<GearChip key={item} imgSrc={ITEMS[item]} name={item} invert />
							))}
						</div>
					</div>
				)}

				{/* ── Assets ── */}
				{selectedTeam.assets?.length > 0 && (
					<div>
						<SectionHeader label='Team Assets' count={selectedTeam.assets.length} />
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
							{selectedTeam.assets.map((asset, i) => (
								<AssetCard
									key={typeof asset === "object" ? asset._id : i}
									asset={asset}
								/>
							))}
						</div>
					</div>
				)}
			</div>

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

ReadinessFactor.propTypes = { label: PropTypes.string, value: PropTypes.number };
SectionHeader.propTypes = {
	label: PropTypes.string,
	count: PropTypes.number,
};
GearChip.propTypes = {
	imgSrc: PropTypes.string,
	name: PropTypes.string,
};
FuelBar.propTypes = {
	pct: PropTypes.number,
};
OperatorCard.propTypes = {
	operator: PropTypes.object,
	onInjuryClick: PropTypes.func,
};
AssetCard.propTypes = {
	asset: PropTypes.object,
};
TeamView.propTypes = {
	openSheet: PropTypes.func,
	teamId: PropTypes.string.isRequired,
};

export default TeamView;
