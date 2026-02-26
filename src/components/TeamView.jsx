// TeamView.jsx — Military Team Dossier

import { useTeamsStore, useOperatorsStore } from "@/zustand";
import { useEffect, useMemo, useState } from "react";
import { WEAPONS, ITEMS, PERKS, GARAGE } from "@/config";
import { PropTypes } from "prop-types";
import AuroraMap from "./AuroaMap";
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

/* ─── Gear chip ─────────────────────────────────────────────── */
function GearChip({ imgSrc, name }) {
	return (
		<div className='flex flex-col items-center gap-1.5 bg-blk/50 border border-lines/15 rounded-sm p-2 hover:border-lines/30 transition-colors group'>
			{imgSrc ?
				<img
					src={imgSrc}
					alt={name}
					className='w-9 h-9 object-contain'
				/>
			:	<div className='w-9 h-9 border border-lines/10 rounded-sm bg-lines/5 flex items-center justify-center'>
					<span className='font-mono text-[7px] text-lines/20'>N/A</span>
				</div>
			}
			<span className='font-mono text-[8px] text-lines/45 text-center leading-tight group-hover:text-lines/70 transition-colors truncate w-full'>
				{name}
			</span>
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
					<span
						className={["w-1.5 h-1.5 rounded-full shrink-0", status.dot].join(
							" ",
						)}
					/>
					<span
						className={[
							"font-mono text-[8px] tracking-widest uppercase",
							status.text,
						].join(" ")}>
						{status.label}
					</span>
				</div>
				{/* Specialist badges */}
				{(operator.support || operator.aviator) && (
					<div className='absolute top-2 right-2 flex flex-col gap-1'>
						{operator.support && (
							<div className='flex items-center justify-center w-6 h-6 bg-blue-900/70 border border-blue-700/40 rounded-sm'>
								<FontAwesomeIcon
									icon={faShieldHalved}
									className='text-blue-400 text-[9px]'
								/>
							</div>
						)}
						{operator.aviator && (
							<div className='flex items-center justify-center w-6 h-6 bg-sky-900/70 border border-sky-700/40 rounded-sm'>
								<FontAwesomeIcon
									icon={faStar}
									className='text-sky-400 text-[9px]'
								/>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Info strip */}
			<div className='px-2.5 py-2 flex flex-col gap-2 flex-1 bg-blk/40'>
				{/* Callsign */}
				<div>
					<p className='font-mono text-xs font-bold text-fontz truncate'>
						{operator.callSign || "Unknown"}
					</p>
					<p className='font-mono text-[9px] text-lines/35 truncate'>
						{operator.class || "No Class"} · {operator.role || "No Role"}
					</p>
				</div>

				{/* Primary weapon */}
				{operator.weaponType && (
					<div className='flex items-center gap-2 bg-blk/40 border border-lines/10 rounded-sm p-1.5'>
						{WEAPONS[operator.weaponType]?.imgUrl && (
							<img
								src={WEAPONS[operator.weaponType].imgUrl}
								alt='weapon'
								className='w-8 h-8 object-contain shrink-0'
							/>
						)}
						<div className='min-w-0'>
							<p className='font-mono text-[8px] text-lines/25 uppercase tracking-widest'>
								Primary
							</p>
							<p className='font-mono text-[9px] text-lines/60 truncate'>
								{operator.weapon ||
									WEAPONS[operator.weaponType]?.name ||
									"Unknown"}
							</p>
						</div>
					</div>
				)}

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
						isKIA ?
							"text-lines/20 border-lines/10 cursor-not-allowed"
						:	"text-red-400/60 border-red-900/30 bg-red-900/5 hover:bg-red-900/15 hover:border-red-500/40 hover:text-red-400",
					].join(" ")}>
					<FontAwesomeIcon
						icon={faSkull}
						className='text-[9px]'
					/>
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

	return (
		<div className='bg-blk/50 border border-lines/15 rounded-sm p-3 flex items-center gap-3 hover:border-lines/30 transition-colors'>
			{assetImg && (
				<img
					src={assetImg}
					alt={a?.vehicle || "Vehicle"}
					className={[
						"w-20 h-12 object-contain shrink-0 rounded-sm",
						a?.isRepairing ? "grayscale opacity-60" : "",
					].join(" ")}
					onError={(e) => {
						e.currentTarget.style.display = "none";
					}}
				/>
			)}
			<div className='flex-1 min-w-0'>
				<p className='font-mono text-xs text-fontz/85 truncate'>{nickname}</p>
				{a?.vehicle && a.nickName !== "None" && (
					<p className='font-mono text-[9px] text-lines/35 truncate'>
						{a.vehicle}
					</p>
				)}
				<div className='flex flex-wrap gap-3 mt-1.5'>
					{a?.condition && (
						<span
							className={[
								"font-mono text-[9px] tracking-widest uppercase",
								condColor,
							].join(" ")}>
							{a.condition}
						</span>
					)}
					{typeof a?.remainingFuel === "number" && (
						<div className='flex items-center gap-1'>
							<FontAwesomeIcon
								icon={faGasPump}
								className='text-lines/30 text-[8px]'
							/>
							<span className='font-mono text-[9px] text-lines/40'>
								{a.remainingFuel}%
							</span>
						</div>
					)}
					{a?.isRepairing && (
						<div className='flex items-center gap-1'>
							<FontAwesomeIcon
								icon={faWrench}
								className='text-btn text-[8px] animate-pulse'
							/>
							<span className='font-mono text-[9px] text-btn animate-pulse'>
								Repairing
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════
   TEAMVIEW
═══════════════════════════════════════════════════════════════ */
const TeamView = ({ teamId }) => {
	const { teams, fetchTeams, assignRandomInjury, assignRandomKIAInjury } =
		useTeamsStore();
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

	const allTeamAOs = useMemo(
		() => [...new Set(teams.filter((t) => t.AO).map((t) => t.AO))],
		[teams],
	);

	// Team-wide status counts
	const statusCounts = useMemo(
		() => ({
			active: teamOps.filter((o) => o.status === "Active").length,
			wia: teamOps.filter((o) => o.status === "Injured").length,
			kia: teamOps.filter((o) => o.status === "KIA").length,
		}),
		[teamOps],
	);

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
				<div className='range-card bg-blk/60 border border-lines/20 rounded-sm px-4 py-3'>
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
						{/* Strength summary */}
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

					{/* Stat strip */}
					<div className='flex flex-wrap gap-3 mt-3 pt-3 border-t border-lines/10'>
						<div className='flex items-center gap-1.5'>
							<span className='w-1.5 h-1.5 rounded-full bg-btn shrink-0' />
							<span className='font-mono text-[9px] text-lines/40 tracking-widest uppercase'>
								Operators
							</span>
							<span className='font-mono text-[10px] text-btn'>
								{teamOps.length}
							</span>
						</div>
						{selectedTeam.assets?.length > 0 && (
							<div className='flex items-center gap-1.5'>
								<span className='w-1.5 h-1.5 rounded-full bg-btn shrink-0' />
								<span className='font-mono text-[9px] text-lines/40 tracking-widest uppercase'>
									Assets
								</span>
								<span className='font-mono text-[10px] text-btn'>
									{selectedTeam.assets.length}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* ── Operator roster ── */}
				{teamOps.length > 0 ?
					<div>
						<SectionHeader
							label='Operator Roster'
							count={teamOps.length}
						/>
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
				:	<div className='flex flex-col items-center justify-center py-12 gap-2'>
						<div className='w-6 h-6 border border-lines/20 rotate-45' />
						<p className='font-mono text-[10px] tracking-[0.2em] text-lines/25 uppercase'>
							No operators assigned
						</p>
					</div>
				}

				{/* ── Team perks ── */}
				{combinedPerks.length > 0 && (
					<div>
						<SectionHeader
							label='Team Perks'
							count={combinedPerks.length}
						/>
						<div className='grid grid-cols-4 sm:grid-cols-6 gap-2'>
							{combinedPerks.map((perk) => (
								<GearChip
									key={perk}
									imgSrc={PERKS[perk]}
									name={perk}
								/>
							))}
						</div>
					</div>
				)}

				{/* ── Team equipment ── */}
				{combinedEquipment.length > 0 && (
					<div>
						<SectionHeader
							label='Team Equipment'
							count={combinedEquipment.length}
						/>
						<div className='grid grid-cols-4 sm:grid-cols-6 gap-2'>
							{combinedEquipment.map((item) => (
								<GearChip
									key={item}
									imgSrc={ITEMS[item]}
									name={item}
								/>
							))}
						</div>
					</div>
				)}

				{/* ── Assets ── */}
				{selectedTeam.assets?.length > 0 && (
					<div>
						<SectionHeader
							label='Team Assets'
							count={selectedTeam.assets.length}
						/>
						<div className='flex flex-col gap-2'>
							{selectedTeam.assets.map((asset, i) => (
								<AssetCard
									key={typeof asset === "object" ? asset._id : i}
									asset={asset}
								/>
							))}
						</div>
					</div>
				)}

				{/* ── Map ── */}
				{allTeamAOs.length > 0 && (
					<div>
						<SectionHeader label='Area of Operations' />
						<div className='rounded-sm overflow-hidden border border-lines/20'>
							<AuroraMap
								selectedAOs={allTeamAOs}
								currentTeamAO={selectedTeam.AO}
								currentTeamId={selectedTeam._id}
							/>
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
					injuryType={injuryType}
				/>
			)}
		</div>
	);
};

TeamView.propTypes = {
	openSheet: PropTypes.func,
	teamId: PropTypes.string.isRequired,
};

export default TeamView;
