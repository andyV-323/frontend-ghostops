// ─────────────────────────────────────────────────────────────────────────────
// CampaignView.jsx
// Displays the AI-generated campaign operation.
// Supports two operation structures:
//   direct_action    — Structure A: all teams strike simultaneously
//   intel_then_strike — Structure B: two-act sequential (recon unlocks strike)
// Legacy linear phase chain is also supported as a fallback.
//
// Props:
//   mission       — active mission object
//   onFileReport  — () => void — opens PhaseReportSheet for current active phase
//   onAAR         — () => void — opens AARSheet (shown when all phases complete)
//   onClose       — () => void
// ─────────────────────────────────────────────────────────────────────────────

import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faLock,
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
	faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

// ── Mission type icon map ─────────────────────────────────────────────────────

const MISSION_TYPE_META = {
	DA_RAID:       { icon: faCrosshairs, color: "text-red-400",     label: "Raid" },
	DA_AMBUSH:     { icon: faBolt,       color: "text-red-400",     label: "Ambush" },
	DA_SNATCH:     { icon: faHandsBound, color: "text-blue-400",    label: "Snatch & Grab" },
	DA_ELIMINATION:{ icon: faSkull,      color: "text-orange-400",  label: "HVT Elimination" },
	DA_SABOTAGE:   { icon: faBomb,       color: "text-amber-400",   label: "Sabotage" },
	DA_STRIKE:     { icon: faBolt,       color: "text-yellow-400",  label: "Strike" },
	DA_CONVOY:     { icon: faTruck,      color: "text-violet-400",  label: "Convoy Interdiction" },
	SR_AREA:       { icon: faUserSecret, color: "text-indigo-400",  label: "Area Recon" },
	SR_POINT:      { icon: faEye,        color: "text-indigo-400",  label: "Point Surveillance" },
	SR_BDA:        { icon: faListCheck,  color: "text-indigo-400",  label: "BDA" },
	CT_HOSTAGE:    { icon: faHandcuffs,  color: "text-cyan-400",    label: "Hostage Rescue" },
	CT_STRIKE:     { icon: faCrosshairs, color: "text-cyan-400",    label: "CT Strike" },
	CT_RECOVERY:   { icon: faShuffle,    color: "text-cyan-400",    label: "Personnel Recovery" },
	OW_OVERWATCH:  { icon: faEye,        color: "text-emerald-400", label: "Overwatch" },
	OW_RESUPPLY:   { icon: faTruck,      color: "text-emerald-400", label: "Resupply" },
};

function getMissionTypeMeta(id) {
	return MISSION_TYPE_META[id] ?? { icon: faCrosshairs, color: "text-lines/40", label: id };
}

// ── File Report button (shared) ───────────────────────────────────────────────

function FileReportButton({ onClick }) {
	return (
		<button
			onClick={onClick}
			className='w-full flex items-center justify-center gap-2 font-mono text-[9px] tracking-widest uppercase text-blk bg-btn hover:bg-highlight px-3 py-2 rounded-sm transition-all'>
			<FontAwesomeIcon icon={faPlus} className='text-[8px]' />
			File Phase Report
		</button>
	);
}

// ─── Structure A — Team Card ──────────────────────────────────────────────────
// One card per team, all simultaneously active.

function StructureATeamCard({ phase, onFileReport }) {
	const typeMeta = getMissionTypeMeta(phase.missionTypeId);

	return (
		<div className='flex flex-col border rounded-sm border-btn/40 bg-btn/5'>
			{/* Header */}
			<div className='flex items-center gap-3 px-3 py-2.5 border-b border-lines/10'>
				<span className='w-1.5 h-1.5 rounded-full bg-btn shadow-[0_0_5px_rgba(124,170,121,0.6)] shrink-0 animate-pulse' />
				<span className='font-mono text-[9px] text-btn uppercase tracking-wider flex-1'>
					{phase.teamLabel}
				</span>
				{phase.specialistRequired && (
					<span className='font-mono text-[7px] uppercase tracking-widest text-amber-400/70 border border-amber-500/25 px-1.5 py-0.5 rounded-sm'>
						{phase.specialistRequired}
					</span>
				)}
			</div>

			{/* Mission type + location */}
			<div className='flex items-center gap-2 px-3 pt-2.5'>
				<FontAwesomeIcon icon={typeMeta.icon} className={`text-[9px] ${typeMeta.color}`} />
				<span className={`font-mono text-[9px] uppercase tracking-wider ${typeMeta.color}`}>
					{typeMeta.label}
				</span>
				<span className='text-lines/15'>—</span>
				<span className='font-mono text-[9px] text-lines/35'>{phase.location?.name}</span>
			</div>

			{/* Task */}
			<div className='px-3 pt-2 pb-1'>
				<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
					Task
				</span>
				<p className='font-mono text-[10px] text-fontz/75 leading-relaxed mt-0.5'>
					{phase.task ?? phase.objective}
				</p>
			</div>

			{/* File report */}
			<div className='px-3 pb-3 pt-1'>
				<FileReportButton onClick={onFileReport} />
			</div>
		</div>
	);
}

// ─── Structure B — Act Card ───────────────────────────────────────────────────
// Used for both Act 1 and Act 2. Act 2 is locked when status === "pending".

function StructureBActCard({ phase, actLabel, onFileReport }) {
	const typeMeta = getMissionTypeMeta(phase.missionTypeId);
	const isLocked = phase.status === "pending";
	const isActive = phase.status === "active";

	return (
		<div className={[
			"flex flex-col border rounded-sm",
			isActive  ? "border-btn/40 bg-btn/5"
			: isLocked ? "border-lines/15 bg-transparent"
			: "border-green-500/25 bg-green-500/5",
		].join(" ")}>
			{/* Act section label */}
			<div className='flex items-center gap-2 px-3 py-2 border-b border-lines/10'>
				<span className={`font-mono text-[8px] tracking-[0.25em] uppercase ${isActive ? "text-btn/60" : isLocked ? "text-lines/25" : "text-green-400/50"}`}>
					{actLabel}
				</span>
				{isLocked && (
					<span className='ml-auto font-mono text-[8px] tracking-widest uppercase text-red-400/50 flex items-center gap-1.5'>
						<FontAwesomeIcon icon={faLock} className='text-[8px]' />
						Locked — awaiting Act 1 intel
					</span>
				)}
				{isActive && (
					<span className='ml-auto w-1.5 h-1.5 rounded-full bg-btn shadow-[0_0_5px_rgba(124,170,121,0.6)] animate-pulse' />
				)}
			</div>

			{isLocked ? (
				/* Redacted view */
				<div className='px-3 py-3 flex flex-col gap-1.5'>
					<span className='font-mono text-[9px] text-lines/25 uppercase tracking-wider'>
						{phase.teamLabel}
					</span>
					<div className='flex items-center gap-1 mt-0.5'>
						<span className='font-mono text-[8px] text-lines/15 leading-relaxed break-all'>
							{"█".repeat(Math.min(phase.task?.length ?? phase.objective?.length ?? 30, 48))}
						</span>
					</div>
				</div>
			) : (
				/* Full view */
				<>
					{/* Team + size */}
					<div className='flex items-center gap-2 px-3 pt-2.5'>
						<span className='font-mono text-[9px] text-lines/50 uppercase tracking-wider'>
							{phase.teamLabel}
						</span>
						{phase.teamSize && (
							<>
								<span className='text-lines/15'>·</span>
								<span className='font-mono text-[8px] text-lines/30'>{phase.teamSize}</span>
							</>
						)}
					</div>

					{/* Mission type + location */}
					<div className='flex items-center gap-2 px-3 pt-1.5'>
						<FontAwesomeIcon icon={typeMeta.icon} className={`text-[9px] ${typeMeta.color}`} />
						<span className={`font-mono text-[9px] uppercase tracking-wider ${typeMeta.color}`}>
							{typeMeta.label}
						</span>
						<span className='text-lines/15'>—</span>
						<span className='font-mono text-[9px] text-lines/35'>{phase.location?.name}</span>
					</div>

					{/* Task */}
					<div className='px-3 pt-2 pb-1'>
						<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
							Task
						</span>
						<p className='font-mono text-[10px] text-fontz/75 leading-relaxed mt-0.5'>
							{phase.task ?? phase.objective}
						</p>
					</div>

					{/* Specialist */}
					{phase.specialistRequired && (
						<div className='px-3 pb-2'>
							<span className='font-mono text-[7px] uppercase tracking-widest text-amber-400/70 border border-amber-500/25 px-1.5 py-0.5 rounded-sm'>
								{phase.specialistRequired} required
							</span>
						</div>
					)}

					{/* File report (only when active) */}
					{isActive && (
						<div className='px-3 pb-3 pt-1'>
							<FileReportButton onClick={onFileReport} />
						</div>
					)}
				</>
			)}
		</div>
	);
}

// ─── Complete Phase Card ──────────────────────────────────────────────────────
// Collapsed with outcome summary, expands on tap. Unchanged from original.

function CompletePhaseCard({ phase, phaseLabel }) {
	const [expanded, setExpanded] = useState(false);
	const typeMeta = getMissionTypeMeta(phase.missionTypeId);

	return (
		<div className='flex flex-col border rounded-sm border-green-500/25 bg-green-500/5'>
			<button
				onClick={() => setExpanded((v) => !v)}
				className='flex items-center gap-3 px-3 py-2.5 w-full text-left'>
				<FontAwesomeIcon icon={faCheckCircle} className='text-green-400/60 text-[9px] shrink-0' />
				<div className='flex flex-col gap-0.5 flex-1 min-w-0'>
					<div className='flex items-center gap-2'>
						<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
							{phaseLabel}
						</span>
						<span className='font-mono text-[8px] text-lines/15'>—</span>
						<span className='font-mono text-[9px] text-green-400/50 truncate'>
							{phase.teamLabel ?? phase.label}
						</span>
					</div>
					<div className='flex items-center gap-1.5'>
						<FontAwesomeIcon icon={typeMeta.icon} className={`text-[8px] ${typeMeta.color} opacity-60`} />
						<span className='font-mono text-[8px] text-lines/25'>
							{phase.location?.name ?? phase.province}
						</span>
					</div>
				</div>
				<span className='font-mono text-[8px] tracking-widest uppercase shrink-0 text-green-400/70'>
					Complete
				</span>
				<FontAwesomeIcon
					icon={expanded ? faChevronUp : faChevronDown}
					className='text-[8px] text-lines/20 shrink-0'
				/>
			</button>

			{expanded && (
				<div className='px-3 pb-3 pt-1 border-t border-lines/10 flex flex-col gap-1.5'>
					<p className='font-mono text-[9px] text-lines/40 leading-relaxed'>
						{phase.task ?? phase.objective}
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
	operationStructure: operationStructureProp,
	friendlyConcerns: friendlyConcernsProp,
	exfilPlan: exfilPlanProp,
}) {
	const campaignPhases     = mission?.campaignPhases ?? [];
	const narrative          = mission?.operationNarrative ?? "";
	const operationName      = mission?.name ?? "UNKNOWN";
	const operationStructure = operationStructureProp ?? mission?.operationStructure ?? "";
	const friendlyConcerns   = friendlyConcernsProp   ?? mission?.friendlyConcerns ?? "";
	const exfilPlan          = exfilPlanProp          ?? mission?.exfilPlan ?? "";

	const completedCount = campaignPhases.filter((p) => p.status === "complete").length;
	const totalCount     = campaignPhases.length;
	const isComplete     = completedCount === totalCount && totalCount > 0;

	const structureBadgeLabel =
		operationStructure === "direct_action"   ? "Direct Action"
		: operationStructure === "intel_then_strike" ? "Intel Then Strike"
		: null;

	if (!campaignPhases.length) {
		return (
			<div className='flex flex-col items-center justify-center h-full gap-4 p-6 text-center'>
				<p className='font-mono text-[9px] tracking-[0.25em] text-lines/25 uppercase'>
					// No campaign data //
				</p>
				<p className='font-mono text-[8px] text-lines/15 leading-relaxed'>
					Generate an AI campaign to see the operation
				</p>
			</div>
		);
	}

	// ── Structure A rendering ─────────────────────────────────────────────────
	const renderStructureA = () => (
		<div className='flex flex-col gap-2 p-4'>
			{campaignPhases.map((phase, index) =>
				phase.status === "complete" ? (
					<CompletePhaseCard
						key={index}
						phase={phase}
						phaseLabel={phase.teamLabel ?? `Team ${index + 1}`}
					/>
				) : (
					<StructureATeamCard
						key={index}
						phase={phase}
						onFileReport={onFileReport}
					/>
				),
			)}
			{isComplete && <OperationCompleteBlock onAAR={onAAR} />}
		</div>
	);

	// ── Structure B rendering ─────────────────────────────────────────────────
	const renderStructureB = () => {
		const act1Phases = campaignPhases.filter((p) => p.actIndex === 0);
		const act2Phases = campaignPhases.filter((p) => p.actIndex === 1);
		return (
			<div className='flex flex-col gap-3 p-4'>
				<span className='font-mono text-[8px] tracking-[0.25em] text-lines/25 uppercase'>
					Act 1 — Intelligence
				</span>
				{act1Phases.map((phase, i) =>
					phase.status === "complete" ? (
						<CompletePhaseCard
							key={phase.phaseIndex ?? i}
							phase={phase}
							phaseLabel={phase.teamLabel ?? `Recon ${i + 1}`}
						/>
					) : (
						<StructureBActCard
							key={phase.phaseIndex ?? i}
							phase={phase}
							actLabel={phase.teamLabel ?? `Recon ${i + 1}`}
							onFileReport={onFileReport}
						/>
					),
				)}

				<span className='font-mono text-[8px] tracking-[0.25em] text-lines/25 uppercase mt-1'>
					Act 2 — Strike
				</span>
				{act2Phases.map((phase, i) =>
					phase.status === "complete" ? (
						<CompletePhaseCard
							key={phase.phaseIndex ?? i}
							phase={phase}
							phaseLabel={phase.teamLabel ?? `Strike ${i + 1}`}
						/>
					) : (
						<StructureBActCard
							key={phase.phaseIndex ?? i}
							phase={phase}
							actLabel={phase.teamLabel ?? `Strike ${i + 1}`}
							onFileReport={onFileReport}
						/>
					),
				)}

				{isComplete && <OperationCompleteBlock onAAR={onAAR} />}
			</div>
		);
	};

	// ── Legacy linear rendering (no operationStructure set) ───────────────────
	const renderLegacy = () => (
		<div className='flex flex-col gap-2 p-4'>
			{campaignPhases.map((phase, index) => {
				const phaseNumber = index + 1;
				if (phase.status === "complete") {
					return (
						<CompletePhaseCard key={index} phase={phase} phaseLabel={`Phase ${phaseNumber}`} />
					);
				}
				if (phase.status === "active") {
					return (
						<LegacyActiveCard key={index} phase={phase} phaseNumber={phaseNumber} onFileReport={onFileReport} />
					);
				}
				return <LegacyPendingCard key={index} phase={phase} phaseNumber={phaseNumber} />;
			})}
			{isComplete && <OperationCompleteBlock onAAR={onAAR} />}
		</div>
	);

	return (
		<div className='flex flex-col h-full min-h-0'>
			{/* ── Header bar ── */}
			<div className='shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-lines/15 bg-blk/40'>
				<div className='flex items-center gap-2'>
					<span className='w-1.5 h-1.5 rounded-full bg-btn shadow-[0_0_4px_rgba(124,170,121,0.45)] shrink-0' />
					<span className='font-mono text-[10px] tracking-[0.18em] text-lines uppercase'>
						Campaign — {operationName}
					</span>
				</div>
				{isComplete && (
					<button
						onClick={onAAR}
						className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-amber-400 border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 px-2 py-1 rounded-sm transition-all'>
						<FontAwesomeIcon icon={faFileLines} className='text-[8px]' />
						AAR
					</button>
				)}
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
								: phase.status === "active"  ? "bg-btn"
								: "bg-lines/10",
							].join(" ")}
						/>
					))}
				</div>
				<span className='font-mono text-[8px] text-lines/30 shrink-0 tabular-nums'>
					{completedCount}/{totalCount}
				</span>
			</div>

			{/* ── Operation info ── */}
			<div className='shrink-0 flex flex-col gap-0 border-b border-lines/10'>
				{/* Narrative */}
				{narrative && (
					<div className='px-4 py-3 border-b border-lines/8 bg-blk/30'>
						<div className='flex items-center gap-2 mb-1'>
							<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
								Operational Background
							</span>
							{structureBadgeLabel && (
								<span className='ml-auto font-mono text-[7px] uppercase tracking-widest text-btn/50 border border-btn/20 px-1.5 py-0.5 rounded-sm'>
									{structureBadgeLabel}
								</span>
							)}
						</div>
						<p className='font-mono text-[9px] text-lines/45 leading-relaxed italic'>
							{narrative}
						</p>
					</div>
				)}

				{/* Secondary concern */}
				{friendlyConcerns && (
					<div className='flex items-start gap-2.5 px-4 py-2.5 border-b border-lines/8 bg-amber-500/5'>
						<FontAwesomeIcon
							icon={faTriangleExclamation}
							className='text-amber-400/60 text-[9px] mt-0.5 shrink-0'
						/>
						<div className='flex flex-col gap-0.5'>
							<span className='font-mono text-[7px] tracking-widest text-amber-400/50 uppercase'>
								Secondary Concern
							</span>
							<p className='font-mono text-[9px] text-amber-400/70 leading-relaxed'>
								{friendlyConcerns}
							</p>
						</div>
					</div>
				)}

				{/* Exfil plan */}
				{exfilPlan && (
					<div className='flex items-start gap-2.5 px-4 py-2.5 bg-blk/20'>
						<div className='flex flex-col gap-0.5'>
							<span className='font-mono text-[7px] tracking-widest text-lines/25 uppercase'>
								Exfil Plan
							</span>
							<p className='font-mono text-[9px] text-lines/45 leading-relaxed'>
								{exfilPlan}
							</p>
						</div>
					</div>
				)}
			</div>

			{/* ── Phase display (structure-aware) ── */}
			<div className='flex-1 min-h-0 overflow-y-auto'>
				{operationStructure === "direct_action"    && renderStructureA()}
				{operationStructure === "intel_then_strike" && renderStructureB()}
				{!operationStructure                        && renderLegacy()}
			</div>
		</div>
	);
}

// ─── Operation Complete block (shared) ────────────────────────────────────────

function OperationCompleteBlock({ onAAR }) {
	return (
		<div className='flex flex-col items-center gap-3 p-4 border border-green-500/20 rounded-sm bg-green-500/5 mt-2'>
			<FontAwesomeIcon icon={faShield} className='text-green-400/60 text-lg' />
			<p className='font-mono text-[9px] tracking-[0.2em] text-green-400/60 uppercase text-center'>
				Operation Complete
			</p>
			<p className='font-mono text-[8px] text-lines/25 text-center'>
				All phases executed. File the After Action Report.
			</p>
			<button
				onClick={onAAR}
				className='flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase text-blk bg-amber-400 hover:bg-amber-300 px-4 py-2 rounded-sm transition-all'>
				<FontAwesomeIcon icon={faFileLines} className='text-[8px]' />
				Generate AAR
			</button>
		</div>
	);
}

// ─── Legacy cards (backwards compat for pre-structure-field missions) ─────────

function LegacyActiveCard({ phase, phaseNumber, onFileReport }) {
	const typeMeta = getMissionTypeMeta(phase.missionTypeId);
	return (
		<div className='flex flex-col border rounded-sm border-btn/40 bg-btn/5'>
			<div className='flex items-center gap-3 px-3 py-2.5 border-b border-lines/10'>
				<span className='w-1.5 h-1.5 rounded-full bg-btn shadow-[0_0_5px_rgba(124,170,121,0.6)] shrink-0' />
				<span className='font-mono text-[9px] text-btn uppercase tracking-wider flex-1'>
					Phase {phaseNumber}: {phase.label}
				</span>
				{phase.isFinal && (
					<span className='font-mono text-[8px] uppercase tracking-widest text-red-400/60 border border-red-900/30 px-1.5 py-0.5 rounded-sm'>
						Final
					</span>
				)}
			</div>
			<div className='flex items-center gap-2 px-3 pt-2.5'>
				<FontAwesomeIcon icon={typeMeta.icon} className={`text-[9px] ${typeMeta.color}`} />
				<span className={`font-mono text-[9px] uppercase tracking-wider ${typeMeta.color}`}>{typeMeta.label}</span>
				<span className='text-lines/15'>—</span>
				<span className='font-mono text-[9px] text-lines/35'>{phase.province}</span>
			</div>
			<div className='px-3 pt-2 pb-1'>
				<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>Objective</span>
				<p className='font-mono text-[10px] text-fontz/75 leading-relaxed mt-0.5'>{phase.objective}</p>
			</div>
			{phase.location?.name && (
				<div className='flex items-center gap-2 px-3 py-2 border-t border-lines/10 bg-blk/30'>
					<span className='font-mono text-[8px] tracking-widest text-lines/20 uppercase'>Obj</span>
					<span className='font-mono text-[9px] text-fontz/60'>{phase.location.name}</span>
				</div>
			)}
			<div className='px-3 pb-3 pt-2'>
				<FileReportButton onClick={onFileReport} />
			</div>
		</div>
	);
}

function LegacyPendingCard({ phase, phaseNumber }) {
	return (
		<div className='flex items-center gap-3 px-3 py-2.5 border rounded-sm border-lines/15'>
			<FontAwesomeIcon icon={faLock} className='text-lines/15 text-[9px] shrink-0' />
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
				<span className='font-mono text-[9px] text-lines/30 truncate'>{phase.label}</span>
				<span className='font-mono text-[8px] text-lines/15'>
					{"█".repeat(Math.min(phase.objective?.length ?? 30, 40))}
				</span>
			</div>
			<span className='font-mono text-[8px] tracking-widest uppercase shrink-0 text-lines/25'>
				Locked
			</span>
		</div>
	);
}

// ─── PropTypes ────────────────────────────────────────────────────────────────

CampaignView.propTypes = {
	mission:      PropTypes.object.isRequired,
	onFileReport: PropTypes.func.isRequired,
	onAAR:        PropTypes.func.isRequired,
	onClose:      PropTypes.func,
};

FileReportButton.propTypes = { onClick: PropTypes.func.isRequired };
OperationCompleteBlock.propTypes = { onAAR: PropTypes.func.isRequired };

StructureATeamCard.propTypes = {
	phase:        PropTypes.object.isRequired,
	onFileReport: PropTypes.func.isRequired,
};

StructureBActCard.propTypes = {
	phase:        PropTypes.object.isRequired,
	actLabel:     PropTypes.string.isRequired,
	onFileReport: PropTypes.func.isRequired,
};

CompletePhaseCard.propTypes = {
	phase:      PropTypes.object.isRequired,
	phaseLabel: PropTypes.string.isRequired,
};

LegacyActiveCard.propTypes = {
	phase:        PropTypes.object.isRequired,
	phaseNumber:  PropTypes.number.isRequired,
	onFileReport: PropTypes.func.isRequired,
};

LegacyPendingCard.propTypes = {
	phase:       PropTypes.object.isRequired,
	phaseNumber: PropTypes.number.isRequired,
};
