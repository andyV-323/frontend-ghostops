// TeamView.jsx — Military Team Dossier

import { useTeamsStore, useOperatorsStore, useKitsStore } from "@/zustand";
import {
	activeMembers,
	reserveMembers,
	casualtyMembers,
	memberOperatorId,
} from "@/utils/teamMembers";

import { useEffect, useMemo, useState } from "react";
import { ITEMS, GARAGE, PROVINCES } from "@/config";
import { PropTypes } from "prop-types";
import ConfirmDialog from "./ConfirmDialog";
import SlotControl from "./SlotControl";
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
	faCaretUp,
	faCaretDown,
} from "@fortawesome/free-solid-svg-icons";
import { TeamsApi, OperatorsApi } from "@/api";
import { toast } from "react-toastify";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getOperatorDisplayImage } from "@/utils/operatorImage";
import { KitDetailView } from "@/components";

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

/* ─── Active operator portrait card (large, corner slot number) ─── */
function OperatorCard({
	operator,
	slotNum,
	slotClass,
	onInjuryClick,
	onKitSelectClick,
	assignedKits,
	onViewKit,
	isControlOpen,
	onToggleControl,
}) {
	const img = getOperatorDisplayImage(operator, assignedKits);
	const status = STATUS_MAP[operator.status] || STATUS_MAP.Active;
	const isKIA = operator.status === "KIA";
	const rawClass = Array.isArray(operator.class) ? operator.class[0] : operator.class;
	const effectiveClass = slotClass || rawClass;
	const activeKit =
		assignedKits.find((k) => k._id === operator.activeKitId) ||
		assignedKits[0] ||
		null;

	return (
		<div
			className={[
				"relative flex flex-col overflow-hidden border-r border-neutral-800/50 last:border-r-0 select-none",
				isKIA ? "opacity-60" : "",
			].join(" ")}>
			{/* Corner slot number — display only, no longer opens the slot menu */}
			<span
				className='absolute top-1.5 left-1.5 z-10 font-mono text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-sm border bg-neutral-950/70 border-neutral-700/60 text-neutral-200'>
				{slotNum}
			</span>

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
				<div className='absolute top-0 left-0 right-0 flex items-start justify-end p-1.5 gap-1'>
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
						<p className='font-mono text-[9px] text-neutral-500 uppercase tracking-wider leading-tight'>
							{effectiveClass || "—"}
						</p>
					</div>

					{activeKit ?
						<button
							type='button'
							onClick={(e) => {
								e.stopPropagation();
								onViewKit?.(activeKit);
							}}
							className='w-full text-left'>
							<p className='font-mono text-[9px] text-btn/60 truncate tracking-widest uppercase hover:text-btn transition-colors'>
								{activeKit.name}
							</p>
						</button>
					:	<p className='font-mono text-[8px] text-neutral-700 italic tracking-widest'>
							No loadout assigned
						</p>
					}
				</div>
			</div>

			{/* Switch Slot — opens the shared slot menu below the grid */}
			<button
				type='button'
				onClick={(e) => { e.stopPropagation(); onToggleControl(operator._id); }}
				className={[
					"w-full flex items-center justify-center gap-1 font-mono text-[8px] tracking-widest uppercase py-1.5 border-t transition-all",
					isControlOpen ?
						"text-btn border-btn/40 bg-btn/10"
					:	"text-neutral-400 border-neutral-800/60 hover:text-btn hover:border-btn/40 hover:bg-btn/5",
				].join(" ")}>
				Switch Slot
			</button>

			{/* Injury button */}
			<button
				onClick={(e) => {
					e.stopPropagation();
					onInjuryClick(operator);
				}}
				disabled={isKIA}
				className={[
					"w-full flex items-center justify-center gap-1 font-mono text-[8px] tracking-widest uppercase py-1.5 border-t transition-all",
					isKIA ?
						"text-neutral-800 border-neutral-900/40 cursor-not-allowed"
					:	"text-red-400/40 border-neutral-800/60 hover:text-red-400 hover:border-red-500/50 hover:bg-red-950/20",
				].join(" ")}>
				Casualty
			</button>
		</div>
	);
}

/* ─── Empty active slot ─────────────────────────────────────── */
function EmptySlotCard({ slotNum }) {
	return (
		<div className='flex flex-col items-center justify-center gap-2 border-r border-neutral-800/50 last:border-r-0 h-56 sm:h-60 border-dashed'>
			<span className='font-mono text-2xl text-neutral-800'>{slotNum}</span>
			<span className='font-mono text-[8px] tracking-widest text-neutral-700 uppercase'>Empty</span>
		</div>
	);
}

/* ─── Reserve card (compact, half height) ──────────────────── */
// Reorder (▲▼) moves into the shared expanded tray in the TeamView body when
// this card is open — a 112px card has no room for it inline.
function ReserveCard({ operator, slotClass, isControlOpen, onToggleControl }) {
	const status = STATUS_MAP[operator.status] || STATUS_MAP.Active;
	return (
		<button
			type='button'
			onClick={() => onToggleControl(operator._id)}
			title={isControlOpen ? "Close" : "Reassign"}
			className={[
				"flex flex-col items-center gap-1.5 border p-2 w-28 shrink-0 transition-colors",
				isControlOpen ?
					"border-btn/60 bg-btn/5"
				:	"border-neutral-800/60 bg-neutral-900/30 hover:border-neutral-700/60",
			].join(" ")}>
			{/* Status dot must live outside the overflow-hidden circular mask,
			    or the corner dot gets clipped away by the rounded-full avatar. */}
			<div className='relative w-12 h-12 shrink-0'>
				<div className='w-12 h-12 rounded-full overflow-hidden border border-neutral-700/60'>
					<img
						src={operator.image || "/ghost/Default.png"}
						alt={operator.callSign}
						className='w-full h-full object-cover object-top grayscale-[50%] opacity-80'
						onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
					/>
				</div>
				<span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-neutral-900 ${status.dot}`} />
			</div>
			<p className='font-mono text-[9px] text-neutral-300 truncate max-w-full leading-none'>{operator.callSign}</p>
			<p className='font-mono text-[7px] text-neutral-600 uppercase tracking-widest truncate max-w-full leading-none'>
				{slotClass || (Array.isArray(operator.class) ? operator.class[0] : "") || "—"}
			</p>
		</button>
	);
}

/* ─── Casualty card — same visual + interaction pattern as Reserve. Only
   reassignable once status has recovered back to Active — a still-Injured/
   KIA operator stays display-only. ──────────────────────────────── */
function CasualtyCard({ operator, slotClass, isControlOpen, onToggleControl }) {
	const status = STATUS_MAP[operator.status] || STATUS_MAP.Active;
	const reassignable = operator.status === "Active";
	return (
		<button
			type='button'
			disabled={!reassignable}
			onClick={() => onToggleControl(operator._id)}
			title={
				reassignable ? (isControlOpen ? "Close" : "Recovered — tap to reassign")
				:	"Casualty"
			}
			className={[
				"flex flex-col items-center gap-1.5 border p-2 w-28 shrink-0 transition-colors",
				!reassignable ?
					"border-neutral-800/60 bg-neutral-900/30 cursor-default"
				: isControlOpen ?
					"border-btn/60 bg-btn/5"
				:	"border-neutral-800/60 bg-neutral-900/30 hover:border-neutral-700/60",
			].join(" ")}>
			<div className='relative w-12 h-12 shrink-0'>
				<div className='w-12 h-12 rounded-full overflow-hidden border border-neutral-700/60'>
					<img
						src={operator.image || "/ghost/Default.png"}
						alt={operator.callSign}
						className='w-full h-full object-cover object-top grayscale opacity-70'
						onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
					/>
				</div>
				<span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-neutral-900 ${status.dot}`} />
			</div>
			<p className='font-mono text-[9px] text-neutral-300 truncate max-w-full leading-none'>{operator.callSign}</p>
			<p className='font-mono text-[7px] text-neutral-600 uppercase tracking-widest truncate max-w-full leading-none'>
				{slotClass || (Array.isArray(operator.class) ? operator.class[0] : "") || "—"}
			</p>
		</button>
	);
}

/* ─── Assign table — replaces the old "ADD TO {TEAM}" drawer ─── */
function AssignTable({ team, teams, operators, onAdd }) {
	const [expandedId, setExpandedId] = useState(null);
	const [pendingClass, setPendingClass] = useState("");

	const onThisTeamIds = new Set(
		[...activeMembers(team), ...reserveMembers(team), ...casualtyMembers(team)].map(memberOperatorId),
	);

	const teamOfOperator = (opId) => {
		for (const t of teams) {
			if (t._id === team._id) continue;
			const ids = [...activeMembers(t), ...reserveMembers(t), ...casualtyMembers(t)].map(memberOperatorId);
			if (ids.includes(opId)) return t;
		}
		return null;
	};

	const eligible = operators.filter((op) => op.status !== "KIA");
	const unassigned = eligible.filter((op) => !onThisTeamIds.has(op._id) && !teamOfOperator(op._id));
	const onOtherTeam = eligible.filter((op) => !onThisTeamIds.has(op._id) && teamOfOperator(op._id));
	const onThisTeam = eligible.filter((op) => onThisTeamIds.has(op._id));

	const classesFor = (op) =>
		(Array.isArray(op.class) ? op.class : op.class ? [op.class] : []).filter(Boolean);

	const handleRowClick = (op) => {
		const classes = classesFor(op);
		if (classes.length <= 1) {
			onAdd(op._id, classes[0] || "");
			return;
		}
		if (expandedId === op._id) {
			onAdd(op._id, pendingClass || classes[0]);
			setExpandedId(null);
		} else {
			setExpandedId(op._id);
			setPendingClass(classes[0]);
		}
	};

	const Row = ({ op, disabled, teamBadge }) => {
		const classes = classesFor(op);
		return (
			<div className='border-b border-neutral-800/40 last:border-0'>
				<button
					type='button'
					disabled={disabled}
					onClick={() => handleRowClick(op)}
					className={[
						"w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
						disabled ?
							"opacity-40 cursor-not-allowed"
						:	"hover:bg-neutral-800/40",
					].join(" ")}>
					<img
						src={op.image || "/ghost/Default.png"}
						alt={op.callSign}
						className='w-7 h-7 rounded-full border border-neutral-700/60 object-cover object-top bg-neutral-900 shrink-0'
						onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
					/>
					<div className='min-w-0 flex-1'>
						<p className='font-mono text-[11px] text-neutral-200 truncate'>{op.callSign}</p>
						<p className='font-mono text-[8px] text-neutral-600 truncate'>{classes.join(" / ") || "—"}</p>
					</div>
					{teamBadge && (
						<span className='font-mono text-[7px] tracking-widest uppercase text-btn/60 border border-btn/25 px-1.5 py-0.5 shrink-0'>
							{teamBadge}
						</span>
					)}
				</button>
				{expandedId === op._id && classes.length > 1 && (
					<div className='px-4 pb-2 flex flex-wrap gap-1.5'>
						{classes.map((cls) => (
							<button
								key={cls}
								onClick={() => setPendingClass(cls)}
								className={[
									"font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 border transition-all",
									pendingClass === cls ?
										"border-btn bg-btn/10 text-btn"
									:	"border-neutral-700 text-neutral-400 hover:border-btn/50",
								].join(" ")}>
								{cls}
							</button>
						))}
						<button
							onClick={() => { onAdd(op._id, pendingClass); setExpandedId(null); }}
							className='font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 border border-btn/50 text-btn bg-btn/5 hover:bg-btn/10 transition-all'>
							Confirm
						</button>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className='flex flex-col'>
			<SectionHeader label='Assign Operator' count={unassigned.length + onOtherTeam.length} />
			{unassigned.length === 0 && onOtherTeam.length === 0 && onThisTeam.length === 0 && (
				<p className='font-mono text-[9px] text-neutral-700 italic px-4 py-6 text-center'>No operators available</p>
			)}
			{unassigned.length > 0 && (
				<>
					<div className='px-4 py-1.5 bg-neutral-950/40'>
						<span className='font-mono text-[8px] tracking-widest text-neutral-600 uppercase'>Unassigned</span>
					</div>
					{unassigned.map((op) => <Row key={op._id} op={op} />)}
				</>
			)}
			{onOtherTeam.length > 0 && (
				<>
					<div className='px-4 py-1.5 bg-neutral-950/40'>
						<span className='font-mono text-[8px] tracking-widest text-neutral-600 uppercase'>Other Teams</span>
					</div>
					{onOtherTeam.map((op) => (
						<Row key={op._id} op={op} teamBadge={teamOfOperator(op._id)?.name} />
					))}
				</>
			)}
			{onThisTeam.length > 0 && (
				<>
					<div className='px-4 py-1.5 bg-neutral-950/40'>
						<span className='font-mono text-[8px] tracking-widest text-neutral-600 uppercase'>On This Team</span>
					</div>
					{onThisTeam.map((op) => <Row key={op._id} op={op} disabled />)}
				</>
			)}
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
function KitSelectorSheet({ operator, kits, onToggleKit, onSetActiveKit }) {
	const img = getOperatorDisplayImage(operator, kits);
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
							{(Array.isArray(operator.class) ? operator.class[0] : operator.class) || operator.role || "—"}
						</p>
					</div>
					<div className='flex items-center gap-2'>
						<span
							className={`inline-flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 border ${status.border} ${status.bg} ${status.text}`}>
							<span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
							{status.label}
						</span>
						{assigned.size > 0 && (
							<span className='font-mono text-[7px] text-btn border border-btn/25 bg-btn/5 px-1.5 py-0.5'>
								{assigned.size} loadout{assigned.size !== 1 ? "s" : ""}
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Section label */}
			<div className='shrink-0 px-4 py-2 border-b border-neutral-800/60 bg-neutral-950/40'>
				<p className='font-mono text-[7px] tracking-[0.35em] text-neutral-500 uppercase'>
					Tap loadout name to activate · ✕ to unassign
				</p>
			</div>

			{/* Kit list */}
			<div className='flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2'>
				{kits.length === 0 ?
					<p className='font-mono text-[8px] text-neutral-700 italic py-4 text-center'>
						No loadouts in armory. Create loadouts in the Armory section.
					</p>
				:	kits.map((kit) => {
						const isAssigned = assigned.has(kit._id);
						const isActive = kit._id === operator.activeKitId;
						const weapons = [
							kit.primary?.weapon,
							kit.secondary?.weapon,
							kit.handgun?.weapon,
						].filter(Boolean);

						return (
							<div
								key={kit._id}
								className={[
									"flex flex-col gap-1.5 px-3 py-2.5 border transition-colors",
									isActive ?
										"border-green-600/50 bg-green-950/10"
									: isAssigned ?
										"border-btn/50 bg-btn/5"
									:	"border-neutral-800/60 hover:border-neutral-700/60",
								].join(" ")}>
								<div className='flex items-center gap-2'>
									<button
										type='button'
										className='flex-1 min-w-0 text-left'
										onClick={() =>
											isAssigned ?
												onSetActiveKit(operator, kit._id)
											:	onToggleKit(operator, kit._id)
										}>
										<span
											className={`font-mono text-[10px] font-semibold tracking-wide uppercase truncate block ${isActive ? "text-green-400" : isAssigned ? "text-btn" : "text-neutral-400"}`}>
											{kit.name}
										</span>
									</button>
									{isActive && (
										<span className='font-mono text-[7px] text-green-400 shrink-0'>
											● ACTIVE
										</span>
									)}
									{isAssigned && !isActive && (
										<span className='font-mono text-[7px] text-btn/60 shrink-0'>
											ASSIGNED
										</span>
									)}
									{isAssigned ?
										<button
											type='button'
											onClick={() => onToggleKit(operator, kit._id)}
											className='w-5 h-5 flex items-center justify-center font-mono text-[9px] text-neutral-600 hover:text-red-400 shrink-0 transition-colors'>
											✕
										</button>
									:	<button
											type='button'
											onClick={() => onToggleKit(operator, kit._id)}
											className='font-mono text-[7px] text-neutral-600 hover:text-btn border border-neutral-800/40 hover:border-btn/30 px-1.5 py-0.5 shrink-0 transition-colors'>
											+ Add
										</button>
									}
								</div>
								{weapons.length > 0 && (
									<p className='font-mono text-[7px] text-neutral-600 truncate'>
										{weapons.join(" · ")}
									</p>
								)}
								{kit.items?.length > 0 && (
									<div className='flex gap-1 flex-wrap'>
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
							</div>
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
	onSetActiveKit: PropTypes.func.isRequired,
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
		assignSlot,
		reorderReserve,
		addToTeam,
		unassignOperatorFromTeam,
	} = useTeamsStore();
	const { operators, fetchOperators } = useOperatorsStore();
	const { kits, fetchKits } = useKitsStore();
	const userId = localStorage.getItem("userId");

	// Which member's slot control is expanded — shared by Active + Reserve
	// sections. The control itself needs ~220px (five 44px tap targets) so it
	// renders in a full-width row below the grid/strip, not inside a card.
	const [controlOperatorId, setControlOperatorId] = useState(null);
	const toggleControl = (operatorId) =>
		setControlOperatorId((cur) => (cur === operatorId ? null : operatorId));

	const [isInjuryDialogOpen, setIsInjuryDialogOpen] = useState(false);
	const [selectedOperator, setSelectedOperator] = useState(null);
	const [injuryType] = useState("choice");
	const [kitSelectorOp, setKitSelectorOp] = useState(null);
	const [viewingKit, setViewingKit] = useState(null);
	const [showAOSelector, setShowAOSelector] = useState(false);
	const [savingAO, setSavingAO] = useState(false);
	const [localAO, setLocalAO] = useState("");


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

	// Resolve a membership record to its Operator (populated or looked up
	// from the operators store), tolerating either shape.
	const resolveOp = (member) => {
		if (!member) return null;
		const id = memberOperatorId(member);
		return operators.find((o) => o._id === id) || (typeof member.operatorId === "object" ? member.operatorId : null);
	};

	// activeOps[i] is the resolved operator for slot i+1, or null if empty.
	const activeOps = useMemo(
		() => (selectedTeam?.activeSlots ?? []).map((m) => (m ? resolveOp(m) : null)),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[selectedTeam, operators],
	);
	const reserveOps = useMemo(
		() => (selectedTeam?.reserves ?? []).map((m) => resolveOp(m)).filter(Boolean),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[selectedTeam, operators],
	);
	const casualtyOps = useMemo(
		() => (selectedTeam?.casualties ?? []).map((m) => resolveOp(m)).filter(Boolean),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[selectedTeam, operators],
	);

	// Readiness/status counts cover the whole roster (active + reserve +
	// casualties) so a WIA/KIA operator moving into Casualties doesn't just
	// vanish from the team's status badges and readiness denominator.
	const teamOps = useMemo(
		() => [...activeOps.filter(Boolean), ...reserveOps, ...casualtyOps],
		[activeOps, reserveOps, casualtyOps],
	);

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
		return {
			score: Math.min(100, base),
			active,
			total,
			assets: assets !== null ? Math.round(assets * 100) : null,
		};
	}, [teamOps, selectedTeam?.assets]);

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
		const isAdding = !current.has(kitId);
		if (isAdding) {
			current.add(kitId);
		} else {
			current.delete(kitId);
		}
		const newIds = [...current];
		let newActiveKitId = operator.activeKitId ?? null;
		if (isAdding) {
			newActiveKitId = kitId; // assigning always activates the kit
		} else if (!isAdding && operator.activeKitId === kitId) {
			newActiveKitId = newIds[0] ?? null;
		}
		try {
			await OperatorsApi.updateOperator(operator._id, {
				...operator,
				assignedKitIds: newIds,
				activeKitId: newActiveKitId,
			});
			await fetchOperators();
			if (kitSelectorOp?._id === operator._id) {
				setKitSelectorOp((prev) => ({
					...prev,
					assignedKitIds: newIds,
					activeKitId: newActiveKitId,
				}));
			}
		} catch {
			toast.error("Failed to update loadout");
		}
	};

	const handleSetActiveKit = async (operator, kitId) => {
		if (operator.activeKitId === kitId) return;
		try {
			await OperatorsApi.updateOperator(operator._id, {
				...operator,
				activeKitId: kitId,
			});
			await fetchOperators();
			if (kitSelectorOp?._id === operator._id) {
				setKitSelectorOp((prev) => ({ ...prev, activeKitId: kitId }));
			}
		} catch {
			toast.error("Failed to set active loadout");
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
						</div>
					</div>
				)}

			</div>

			{/* ── Active lineup — 4 fixed slots ────────────── */}
			<SectionHeader
				label='Active'
				count={activeOps.filter(Boolean).length}
			/>
			<div className='grid grid-cols-2 sm:grid-cols-4'>
				{activeOps.map((op, i) =>
					op ?
						<OperatorCard
							key={op._id}
							operator={op}
							slotNum={i + 1}
							slotClass={selectedTeam.activeSlots?.[i]?.class}
							onInjuryClick={handleOpenInjuryDialog}
							onKitSelectClick={setKitSelectorOp}
							assignedKits={kitMap[op._id] || []}
							onViewKit={(kit) => setViewingKit(kit)}
							isControlOpen={controlOperatorId === op._id}
							onToggleControl={toggleControl}
						/>
					:	<EmptySlotCard key={`empty-${i}`} slotNum={i + 1} />,
				)}
			</div>
			{(() => {
				const openIdx = activeOps.findIndex((op) => op && op._id === controlOperatorId);
				if (openIdx === -1) return null;
				return (
					<div className='flex justify-center py-2 border-t border-neutral-800/60 bg-neutral-950/40'>
						<SlotControl
							currentSlot={openIdx + 1}
							onSelect={(slot) => {
								assignSlot(selectedTeam._id, controlOperatorId, slot);
								setControlOperatorId(null);
							}}
							onUnassign={() => {
								unassignOperatorFromTeam(controlOperatorId, selectedTeam._id);
								setControlOperatorId(null);
							}}
						/>
					</div>
				);
			})()}
			<div className='border-b border-neutral-800/60' />

			{/* ── Reserve ─────────────────────────────────── */}
			<SectionHeader label='Reserve' count={reserveOps.length} />
			{reserveOps.length > 0 ?
				<div className='flex gap-2 overflow-x-auto px-3 py-3 border-b border-neutral-800/60'>
					{reserveOps.map((op, i) => (
						<ReserveCard
							key={op._id}
							operator={op}
							slotClass={selectedTeam.reserves?.[i]?.class}
							isControlOpen={controlOperatorId === op._id}
							onToggleControl={toggleControl}
						/>
					))}
				</div>
			:	<div className='flex items-center justify-center py-6 border-b border-neutral-800/60'>
					<p className='font-mono text-[9px] text-neutral-700 uppercase tracking-widest'>No reserves</p>
				</div>
			}
			{(() => {
				const openIdx = reserveOps.findIndex((op) => op._id === controlOperatorId);
				if (openIdx === -1) return null;
				return (
					<div className='flex items-center justify-center gap-3 py-2 border-b border-neutral-800/60 bg-neutral-950/40'>
						<div className='flex items-center gap-1'>
							<button
								disabled={openIdx === 0}
								onClick={() => reorderReserve(selectedTeam._id, controlOperatorId, "up")}
								className='text-neutral-600 hover:text-btn disabled:opacity-20 disabled:cursor-not-allowed transition-colors'>
								<FontAwesomeIcon icon={faCaretUp} className='text-[12px]' />
							</button>
							<button
								disabled={openIdx === reserveOps.length - 1}
								onClick={() => reorderReserve(selectedTeam._id, controlOperatorId, "down")}
								className='text-neutral-600 hover:text-btn disabled:opacity-20 disabled:cursor-not-allowed transition-colors'>
								<FontAwesomeIcon icon={faCaretDown} className='text-[12px]' />
							</button>
						</div>
						<SlotControl
							currentSlot={null}
							onSelect={(slot) => {
								assignSlot(selectedTeam._id, controlOperatorId, slot);
								setControlOperatorId(null);
							}}
							onUnassign={() => {
								unassignOperatorFromTeam(controlOperatorId, selectedTeam._id);
								setControlOperatorId(null);
							}}
						/>
					</div>
				);
			})()}

			{/* ── Casualties — same pattern as Reserve ────── */}
			<SectionHeader label='Casualties' count={casualtyOps.length} />
			{casualtyOps.length > 0 ?
				<div className='flex gap-2 overflow-x-auto px-3 py-3 border-b border-neutral-800/60'>
					{casualtyOps.map((op, i) => (
						<CasualtyCard
							key={op._id}
							operator={op}
							slotClass={selectedTeam.casualties?.[i]?.class}
							isControlOpen={controlOperatorId === op._id}
							onToggleControl={toggleControl}
						/>
					))}
				</div>
			:	<div className='flex items-center justify-center py-6 border-b border-neutral-800/60'>
					<p className='font-mono text-[9px] text-neutral-700 uppercase tracking-widest'>No casualties</p>
				</div>
			}
			{(() => {
				const openIdx = casualtyOps.findIndex((op) => op._id === controlOperatorId);
				if (openIdx === -1) return null;
				return (
					<div className='flex justify-center py-2 border-b border-neutral-800/60 bg-neutral-950/40'>
						<SlotControl
							currentSlot={null}
							onSelect={(slot) => {
								assignSlot(selectedTeam._id, controlOperatorId, slot);
								setControlOperatorId(null);
							}}
							onUnassign={() => {
								unassignOperatorFromTeam(controlOperatorId, selectedTeam._id);
								setControlOperatorId(null);
							}}
						/>
					</div>
				);
			})()}

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

			{/* ── Assign table — replaces the old add-to-team drawer ──── */}
			<AssignTable
				team={selectedTeam}
				teams={teams}
				operators={operators}
				onAdd={(operatorId, cls) => addToTeam(selectedTeam._id, operatorId, cls)}
			/>

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
							onSetActiveKit={handleSetActiveKit}
						/>
					)}
				</SheetContent>
			</Sheet>

			{/* Kit detail sheet */}
			<Sheet
				open={!!viewingKit}
				onOpenChange={(open) => {
					if (!open) setViewingKit(null);
				}}>
				<SheetContent
					side='right'
					className='p-0 sm:max-w-md overflow-hidden flex flex-col bg-blk border-l border-neutral-800/60'
					aria-describedby={undefined}>
					<SheetTitle className='sr-only'>
						{viewingKit?.name || "Loadout"}
					</SheetTitle>
					{viewingKit && (
						<KitDetailView
							kit={viewingKit}
							onClose={() => setViewingKit(null)}
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
	slotNum: PropTypes.number,
	slotClass: PropTypes.string,
	onInjuryClick: PropTypes.func,
	onKitSelectClick: PropTypes.func,
	assignedKits: PropTypes.array,
	onViewKit: PropTypes.func,
	isControlOpen: PropTypes.bool,
	onToggleControl: PropTypes.func,
};
EmptySlotCard.propTypes = { slotNum: PropTypes.number };
ReserveCard.propTypes = {
	operator: PropTypes.object,
	slotClass: PropTypes.string,
	isControlOpen: PropTypes.bool,
	onToggleControl: PropTypes.func,
};
CasualtyCard.propTypes = {
	operator: PropTypes.object,
	slotClass: PropTypes.string,
	isControlOpen: PropTypes.bool,
	onToggleControl: PropTypes.func,
};
AssetCard.propTypes = { asset: PropTypes.object };
TeamView.propTypes = { teamId: PropTypes.string.isRequired };

export default TeamView;
