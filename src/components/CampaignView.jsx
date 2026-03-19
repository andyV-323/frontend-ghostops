// ─────────────────────────────────────────────────────────────────────────────
// CampaignView.jsx
// Displays the AI-generated campaign phase chain.
// Shows all phases — active phase fully detailed, pending phases redacted,
// completed phases collapsed with outcome summary.
//
// Props:
//   mission       — active mission object (needs campaignPhases, operationNarrative)
//   onFileReport  — () => void — opens PhaseReportSheet for current active phase
//   onAAR         — () => void — opens AARSheet (shown when all phases complete)
//   onClose       — () => void
// ─────────────────────────────────────────────────────────────────────────────

import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faLock,
	faUnlock,
	faCheckCircle,
	faChevronDown,
	faChevronUp,
	faPlus,
	faFileLines,
	faCrosshairs,
	faEye,
	faHandcuffs,
	faSkull,
	faBomb,
	faTruck,
	faUserSecret,
	faHandsBound,
	faBolt,
	faListCheck,
	faShuffle,
	faShield,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

// ── Mission type icon map ─────────────────────────────────────────────────────

const MISSION_TYPE_META = {
	DA_RAID: { icon: faCrosshairs, color: "text-red-400", label: "Raid" },
	DA_AMBUSH: { icon: faBolt, color: "text-red-400", label: "Ambush" },
	DA_SNATCH: {
		icon: faHandsBound,
		color: "text-blue-400",
		label: "Snatch & Grab",
	},
	DA_ELIMINATION: {
		icon: faSkull,
		color: "text-orange-400",
		label: "HVT Elimination",
	},
	DA_SABOTAGE: { icon: faBomb, color: "text-amber-400", label: "Sabotage" },
	DA_STRIKE: { icon: faBolt, color: "text-yellow-400", label: "Strike" },
	DA_CONVOY: {
		icon: faTruck,
		color: "text-violet-400",
		label: "Convoy Interdiction",
	},
	SR_AREA: {
		icon: faUserSecret,
		color: "text-indigo-400",
		label: "Area Recon",
	},
	SR_POINT: {
		icon: faEye,
		color: "text-indigo-400",
		label: "Point Surveillance",
	},
	SR_BDA: { icon: faListCheck, color: "text-indigo-400", label: "BDA" },
	CT_HOSTAGE: {
		icon: faHandcuffs,
		color: "text-cyan-400",
		label: "Hostage Rescue",
	},
	CT_STRIKE: { icon: faCrosshairs, color: "text-cyan-400", label: "CT Strike" },
	CT_RECOVERY: {
		icon: faShuffle,
		color: "text-cyan-400",
		label: "Personnel Recovery",
	},
	OW_OVERWATCH: { icon: faEye, color: "text-emerald-400", label: "Overwatch" },
	OW_RESUPPLY: { icon: faTruck, color: "text-emerald-400", label: "Resupply" },
};

function getMissionTypeMeta(id) {
	return (
		MISSION_TYPE_META[id] ?? {
			icon: faCrosshairs,
			color: "text-lines/40",
			label: id,
		}
	);
}

// ── Phase status styles ───────────────────────────────────────────────────────

const STATUS_STYLES = {
	active: {
		border: "border-btn/40",
		bg: "bg-btn/5",
		dot: "bg-btn shadow-[0_0_5px_rgba(124,170,121,0.6)]",
		label: "ACTIVE",
		labelColor: "text-btn",
	},
	pending: {
		border: "border-lines/15",
		bg: "bg-transparent",
		dot: "bg-lines/20",
		label: "LOCKED",
		labelColor: "text-lines/25",
	},
	complete: {
		border: "border-green-500/25",
		bg: "bg-green-500/5",
		dot: "bg-green-400",
		label: "COMPLETE",
		labelColor: "text-green-400/70",
	},
};

// ─── Active Phase Card ────────────────────────────────────────────────────────

function ActivePhaseCard({ phase, phaseNumber, onFileReport }) {
	const typeMeta = getMissionTypeMeta(phase.missionTypeId);
	const style = STATUS_STYLES.active;

	return (
		<div
			className={`flex flex-col border rounded-sm ${style.border} ${style.bg}`}>
			{/* Header */}
			<div className='flex items-center gap-3 px-3 py-2.5 border-b border-lines/10'>
				<span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
				<span
					className={`font-mono text-[8px] tracking-widest uppercase ${style.labelColor}`}>
					{style.label}
				</span>
				<span className='font-mono text-[8px] text-lines/20'>—</span>
				<span className='font-mono text-[9px] text-btn uppercase tracking-wider flex-1'>
					Phase {phaseNumber}: {phase.label}
				</span>
				{phase.isFinal && (
					<span className='font-mono text-[8px] uppercase tracking-widest text-red-400/60 border border-red-900/30 px-1.5 py-0.5 rounded-sm'>
						Final
					</span>
				)}
			</div>

			{/* Mission type */}
			<div className='flex items-center gap-2 px-3 pt-2.5'>
				<FontAwesomeIcon
					icon={typeMeta.icon}
					className={`text-[9px] ${typeMeta.color}`}
				/>
				<span
					className={`font-mono text-[9px] uppercase tracking-wider ${typeMeta.color}`}>
					{typeMeta.label}
				</span>
				<span className='text-lines/15'>—</span>
				<span className='font-mono text-[9px] text-lines/35'>
					{phase.province}
				</span>
			</div>

			{/* Objective */}
			<div className='px-3 pt-2 pb-1'>
				<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
					Objective
				</span>
				<p className='font-mono text-[10px] text-fontz/75 leading-relaxed mt-0.5'>
					{phase.objective}
				</p>
			</div>

			{/* Minibrief */}
			{phase.minibrief && (
				<div className='px-3 pt-1 pb-2'>
					<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
						Situation
					</span>
					<p className='font-mono text-[9px] text-lines/50 leading-relaxed mt-0.5 italic'>
						{phase.minibrief}
					</p>
				</div>
			)}

			{/* Location */}
			{phase.location?.name && (
				<div className='flex items-center gap-2 px-3 py-2 border-t border-lines/10 bg-blk/30'>
					<span className='font-mono text-[8px] tracking-widest text-lines/20 uppercase'>
						Obj
					</span>
					<span className='font-mono text-[9px] text-fontz/60'>
						{phase.location.name}
					</span>
				</div>
			)}

			{/* Infil/exfil */}
			{(phase.infilMethod || phase.exfilMethod) && (
				<div className='flex items-center gap-4 px-3 py-2 border-t border-lines/10'>
					{phase.infilMethod && (
						<div className='flex flex-col gap-0.5'>
							<span className='font-mono text-[7px] tracking-widest text-green-400/40 uppercase'>
								Infil
							</span>
							<span className='font-mono text-[8px] text-green-400/70'>
								{phase.infilMethod}
							</span>
						</div>
					)}
					{phase.exfilMethod && (
						<div className='flex flex-col gap-0.5'>
							<span className='font-mono text-[7px] tracking-widest text-blue-400/40 uppercase'>
								Exfil
							</span>
							<span className='font-mono text-[8px] text-blue-400/70'>
								{phase.exfilMethod}
							</span>
						</div>
					)}
				</div>
			)}

			{/* File report CTA */}
			<div className='px-3 pb-3 pt-1'>
				<button
					onClick={onFileReport}
					className='w-full flex items-center justify-center gap-2 font-mono text-[9px] tracking-widest uppercase text-blk bg-btn hover:bg-highlight px-3 py-2 rounded-sm transition-all'>
					<FontAwesomeIcon
						icon={faPlus}
						className='text-[8px]'
					/>
					File Phase Report
				</button>
			</div>
		</div>
	);
}

// ─── Pending Phase Card ───────────────────────────────────────────────────────

function PendingPhaseCard({ phase, phaseNumber }) {
	const style = STATUS_STYLES.pending;

	return (
		<div
			className={`flex items-center gap-3 px-3 py-2.5 border rounded-sm ${style.border} ${style.bg}`}>
			<FontAwesomeIcon
				icon={faLock}
				className='text-lines/15 text-[9px] shrink-0'
			/>
			<div className='flex flex-col gap-0.5 flex-1 min-w-0'>
				<div className='flex items-center gap-2'>
					<span className='font-mono text-[8px] tracking-widest text-lines/20 uppercase'>
						Phase {phaseNumber}
					</span>
					{phase.isFinal && (
						<span className='font-mono text-[7px] uppercase tracking-widest text-red-400/40 border border-red-900/20 px-1 py-0.5 rounded-sm'>
							Final
						</span>
					)}
				</div>
				<span className='font-mono text-[9px] text-lines/30 truncate'>
					{phase.label}
				</span>
				{/* Redacted objective */}
				<div className='flex items-center gap-1 mt-0.5'>
					<span className='font-mono text-[8px] text-lines/15'>
						{"█".repeat(Math.min(phase.objective?.length ?? 30, 40))}
					</span>
				</div>
			</div>
			<span
				className={`font-mono text-[8px] tracking-widest uppercase shrink-0 ${style.labelColor}`}>
				{style.label}
			</span>
		</div>
	);
}

// ─── Complete Phase Card ──────────────────────────────────────────────────────

function CompletePhaseCard({ phase, phaseNumber }) {
	const [expanded, setExpanded] = useState(false);
	const typeMeta = getMissionTypeMeta(phase.missionTypeId);
	const style = STATUS_STYLES.complete;

	return (
		<div
			className={`flex flex-col border rounded-sm ${style.border} ${style.bg}`}>
			<button
				onClick={() => setExpanded((v) => !v)}
				className='flex items-center gap-3 px-3 py-2.5 w-full text-left'>
				<FontAwesomeIcon
					icon={faCheckCircle}
					className='text-green-400/60 text-[9px] shrink-0'
				/>
				<div className='flex flex-col gap-0.5 flex-1 min-w-0'>
					<div className='flex items-center gap-2'>
						<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
							Phase {phaseNumber}
						</span>
						<span className='font-mono text-[8px] text-lines/15'>—</span>
						<span className='font-mono text-[9px] text-green-400/50 truncate'>
							{phase.label}
						</span>
					</div>
					<div className='flex items-center gap-1.5'>
						<FontAwesomeIcon
							icon={typeMeta.icon}
							className={`text-[8px] ${typeMeta.color} opacity-60`}
						/>
						<span className='font-mono text-[8px] text-lines/25'>
							{phase.province}
						</span>
					</div>
				</div>
				<span
					className={`font-mono text-[8px] tracking-widest uppercase shrink-0 ${style.labelColor}`}>
					{style.label}
				</span>
				<FontAwesomeIcon
					icon={expanded ? faChevronUp : faChevronDown}
					className='text-[8px] text-lines/20 shrink-0'
				/>
			</button>

			{expanded && (
				<div className='px-3 pb-3 pt-1 border-t border-lines/10 flex flex-col gap-1.5'>
					<p className='font-mono text-[9px] text-lines/40 leading-relaxed'>
						{phase.objective}
					</p>
					{phase.intelGate && (
						<div className='flex items-center gap-2 mt-1'>
							<span className='font-mono text-[8px] tracking-widest text-lines/20 uppercase'>
								Intel produced
							</span>
							<span className='font-mono text-[8px] text-indigo-400/60 border border-indigo-900/20 px-1.5 py-0.5 rounded-sm'>
								{phase.intelGate.replace(/_/g, " ")}
							</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─── CampaignView ─────────────────────────────────────────────────────────────

export default function CampaignView({
	mission,
	onFileReport,
	onAAR,
	onClose,
}) {
	const campaignPhases = mission?.campaignPhases ?? [];
	const narrative = mission?.operationNarrative ?? "";
	const operationName = mission?.name ?? "UNKNOWN";

	const activePhase = campaignPhases.find((p) => p.status === "active");
	const completedCount = campaignPhases.filter(
		(p) => p.status === "complete",
	).length;
	const totalCount = campaignPhases.length;
	const isComplete = completedCount === totalCount && totalCount > 0;

	if (!campaignPhases.length) {
		return (
			<div className='flex flex-col items-center justify-center h-full gap-4 p-6 text-center'>
				<p className='font-mono text-[9px] tracking-[0.25em] text-lines/25 uppercase'>
					// No campaign data //
				</p>
				<p className='font-mono text-[8px] text-lines/15 leading-relaxed'>
					Generate an AI campaign to see the phase chain
				</p>
			</div>
		);
	}

	return (
		<div className='flex flex-col h-full min-h-0'>
			{/* ── Header ── */}
			<div className='shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-lines/15 bg-blk/40'>
				<div className='flex items-center gap-2'>
					<span className='w-1.5 h-1.5 rounded-full bg-btn shadow-[0_0_4px_rgba(124,170,121,0.45)] shrink-0' />
					<span className='font-mono text-[10px] tracking-[0.18em] text-lines uppercase'>
						Campaign — {operationName}
					</span>
				</div>
				<div className='flex items-center gap-2'>
					{isComplete && (
						<button
							onClick={onAAR}
							className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-amber-400 border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 px-2 py-1 rounded-sm transition-all'>
							<FontAwesomeIcon
								icon={faFileLines}
								className='text-[8px]'
							/>
							AAR
						</button>
					)}
				</div>
			</div>

			{/* ── Progress bar ── */}
			<div className='shrink-0 flex items-center gap-3 px-4 py-2 border-b border-lines/10 bg-blk/20'>
				<div className='flex items-center gap-1 flex-1'>
					{campaignPhases.map((phase, i) => (
						<div
							key={i}
							className={[
								"h-1 flex-1 rounded-full transition-all duration-500",
								phase.status === "complete" ? "bg-green-400"
								: phase.status === "active" ? "bg-btn"
								: "bg-lines/10",
							].join(" ")}
						/>
					))}
				</div>
				<span className='font-mono text-[8px] text-lines/30 shrink-0 tabular-nums'>
					{completedCount}/{totalCount}
				</span>
			</div>

			{/* ── Narrative ── */}
			{narrative && (
				<div className='shrink-0 px-4 py-3 border-b border-lines/10 bg-blk/30'>
					<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase block mb-1'>
						Operational Background
					</span>
					<p className='font-mono text-[9px] text-lines/45 leading-relaxed italic'>
						{narrative}
					</p>
				</div>
			)}

			{/* ── Phase cards ── */}
			<div className='flex-1 min-h-0 overflow-y-auto'>
				<div className='flex flex-col gap-2 p-4'>
					{campaignPhases.map((phase, index) => {
						const phaseNumber = index + 1;

						if (phase.status === "complete") {
							return (
								<CompletePhaseCard
									key={index}
									phase={phase}
									phaseNumber={phaseNumber}
								/>
							);
						}

						if (phase.status === "active") {
							return (
								<ActivePhaseCard
									key={index}
									phase={phase}
									phaseNumber={phaseNumber}
									onFileReport={onFileReport}
								/>
							);
						}

						// pending
						return (
							<PendingPhaseCard
								key={index}
								phase={phase}
								phaseNumber={phaseNumber}
							/>
						);
					})}

					{/* Operation complete state */}
					{isComplete && (
						<div className='flex flex-col items-center gap-3 p-4 border border-green-500/20 rounded-sm bg-green-500/5 mt-2'>
							<FontAwesomeIcon
								icon={faShield}
								className='text-green-400/60 text-lg'
							/>
							<p className='font-mono text-[9px] tracking-[0.2em] text-green-400/60 uppercase text-center'>
								Operation Complete
							</p>
							<p className='font-mono text-[8px] text-lines/25 text-center'>
								All phases executed. File the After Action Report.
							</p>
							<button
								onClick={onAAR}
								className='flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase text-blk bg-amber-400 hover:bg-amber-300 px-4 py-2 rounded-sm transition-all'>
								<FontAwesomeIcon
									icon={faFileLines}
									className='text-[8px]'
								/>
								Generate AAR
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// ─── PropTypes ────────────────────────────────────────────────────────────────

CampaignView.propTypes = {
	mission: PropTypes.object.isRequired,
	onFileReport: PropTypes.func.isRequired,
	onAAR: PropTypes.func.isRequired,
	onClose: PropTypes.func,
};

ActivePhaseCard.propTypes = {
	phase: PropTypes.object.isRequired,
	phaseNumber: PropTypes.number.isRequired,
	onFileReport: PropTypes.func.isRequired,
};

PendingPhaseCard.propTypes = {
	phase: PropTypes.object.isRequired,
	phaseNumber: PropTypes.number.isRequired,
};

CompletePhaseCard.propTypes = {
	phase: PropTypes.object.isRequired,
	phaseNumber: PropTypes.number.isRequired,
};
