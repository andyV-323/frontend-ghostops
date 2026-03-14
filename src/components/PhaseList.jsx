// ─────────────────────────────────────────────────────────────────────────────
// PhaseList.jsx
// Displays all filed phase reports under the active operation.
// Includes PhaseCard as a co-located sub-component.
//
// Props:
//   phases      — array of phase objects from the operation
//   onNewPhase  — () => void — opens PhaseReportSheet
//   onAAR       — () => void — opens AARSheet (shown when phases.length > 0)
// ─────────────────────────────────────────────────────────────────────────────

import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPlus,
	faFileLines,
	faSkull,
	faBandage,
	faCircleExclamation,
	faCheckCircle,
	faXmarkCircle,
	faCircleQuestion,
	faChevronDown,
	faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

// ─── Label maps ───────────────────────────────────────────────────────────────

const OUTCOME_META = {
	clean: {
		label: "Objective Complete",
		sub: "Clean execution",
		color: "text-green-400",
		border: "border-green-500/30",
		bg: "bg-green-500/8",
		dot: "bg-green-400",
		icon: faCheckCircle,
	},
	compromised: {
		label: "Objective Complete",
		sub: "Element compromised",
		color: "text-yellow-400",
		border: "border-yellow-500/30",
		bg: "bg-yellow-500/8",
		dot: "bg-yellow-400",
		icon: faCircleExclamation,
	},
	heavy_contact: {
		label: "Objective Complete",
		sub: "Heavy contact sustained",
		color: "text-orange-400",
		border: "border-orange-500/30",
		bg: "bg-orange-500/8",
		dot: "bg-orange-400",
		icon: faCircleExclamation,
	},
	aborted: {
		label: "Aborted",
		sub: "Objective not achieved",
		color: "text-red-400",
		border: "border-red-500/30",
		bg: "bg-red-500/8",
		dot: "bg-red-400",
		icon: faXmarkCircle,
	},
	target_not_present: {
		label: "Target Not Present",
		sub: "New lead required",
		color: "text-blue-400",
		border: "border-blue-500/30",
		bg: "bg-blue-500/8",
		dot: "bg-blue-400",
		icon: faCircleQuestion,
	},
};

const CASUALTY_META = {
	none: { label: "No Casualties", color: "text-green-400", icon: null },
	injured: {
		label: "Operator Injured",
		color: "text-yellow-400",
		icon: faBandage,
	},
	kia: { label: "Operator KIA", color: "text-red-400", icon: faSkull },
};

const COMPLICATION_LABELS = {
	none: "No complications",
	qrf_responded: "QRF responded",
	isr_offline: "ISR offline",
	crosscom_lost: "Cross-Com lost",
	exfil_compromised: "Exfil compromised",
	civilian_contact: "Civilian contact",
	intel_recovered: "Intel recovered",
	target_not_found: "Target not found",
	asset_lost: "Asset lost",
};

const INTEL_LABELS = {
	nothing_new: "No new intel",
	patrol_timing: "Patrol timing confirmed",
	enemy_strength: "Force strength assessed",
	facility_layout: "Layout mapped",
	hvt_location: "HVT location updated",
	supply_route: "Supply route identified",
	contact_activated: "Contact activated",
};

// ─── DTG formatter ────────────────────────────────────────────────────────────

function formatDTG(isoString) {
	if (!isoString) return "—";
	try {
		const d = new Date(isoString);
		const p = (v) => String(v).padStart(2, "0");
		const mon = d.toLocaleString("en", { month: "short" }).toUpperCase();
		return `${p(d.getUTCDate())}${mon}${d.getUTCFullYear()} ${p(d.getUTCHours())}${p(d.getUTCMinutes())}Z`;
	} catch {
		return "—";
	}
}

// ─── PhaseCard ────────────────────────────────────────────────────────────────

function PhaseCard({ phase }) {
	const [expanded, setExpanded] = useState(false);

	const outcome = OUTCOME_META[phase.outcome] ?? OUTCOME_META.aborted;
	const casualty = CASUALTY_META[phase.casualties] ?? CASUALTY_META.none;
	const hasCasualty = phase.casualties && phase.casualties !== "none";
	const hasNotes = !!phase.notes;

	const complications = (phase.complications ?? []).filter((c) => c !== "none");
	const intel = (phase.intelDeveloped ?? []).filter((i) => i !== "nothing_new");
	const intelEmpty = phase.intelDeveloped?.includes("nothing_new");

	return (
		<div
			className={[
				"rounded-sm border transition-all duration-200",
				outcome.border,
				outcome.bg,
			].join(" ")}>
			{/* ── Card header ── */}
			<button
				onClick={() => setExpanded((v) => !v)}
				className='w-full flex items-start gap-3 px-3 py-3 text-left'>
				{/* Phase number */}
				<div className='flex flex-col items-center gap-1 shrink-0 pt-0.5'>
					<span className='font-mono text-[8px] tracking-widest text-lines/30 uppercase'>
						Ph
					</span>
					<span
						className={`font-mono text-base font-bold leading-none ${outcome.color}`}>
						{String(phase.phaseNumber).padStart(2, "0")}
					</span>
				</div>

				{/* Content */}
				<div className='flex flex-col gap-1.5 flex-1 min-w-0'>
					{/* Outcome row */}
					<div className='flex items-center gap-2 flex-wrap'>
						<FontAwesomeIcon
							icon={outcome.icon}
							className={`text-[10px] shrink-0 ${outcome.color}`}
						/>
						<span
							className={`font-mono text-[10px] tracking-wider uppercase ${outcome.color}`}>
							{outcome.label}
						</span>
						<span className='font-mono text-[9px] text-lines/25'>
							{outcome.sub}
						</span>
					</div>

					{/* Province + mission type */}
					<div className='flex items-center gap-2 flex-wrap'>
						{phase.province && (
							<span className='font-mono text-[9px] text-lines/35 uppercase tracking-wider'>
								{phase.province}
							</span>
						)}
						{phase.missionType && (
							<>
								<span className='text-lines/15'>//</span>
								<span className='font-mono text-[9px] text-lines/30 uppercase tracking-wider'>
									{phase.missionType}
								</span>
							</>
						)}
					</div>

					{/* Casualty badge + DTG */}
					<div className='flex items-center gap-2 flex-wrap'>
						{hasCasualty && (
							<span
								className={[
									"flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm border",
									phase.casualties === "kia" ?
										"text-red-400 border-red-900/50 bg-red-900/10"
									:	"text-yellow-400 border-yellow-900/50 bg-yellow-900/10",
								].join(" ")}>
								{casualty.icon && (
									<FontAwesomeIcon
										icon={casualty.icon}
										className='text-[7px]'
									/>
								)}
								{casualty.label}
							</span>
						)}
						<span className='font-mono text-[8px] text-lines/20 ml-auto'>
							{formatDTG(phase.createdAt)}
						</span>
					</div>
				</div>

				{/* Expand toggle */}
				<FontAwesomeIcon
					icon={expanded ? faChevronUp : faChevronDown}
					className='text-[8px] text-lines/20 shrink-0 mt-1'
				/>
			</button>

			{/* ── Expanded detail ── */}
			{expanded && (
				<div className='px-3 pb-3 flex flex-col gap-3 border-t border-lines/10 pt-3'>
					{/* Objectives */}
					{phase.objectives?.length > 0 && (
						<div className='flex flex-col gap-1'>
							<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
								Objectives
							</span>
							{phase.objectives.map((obj, i) => (
								<span
									key={i}
									className='font-mono text-[9px] text-lines/40 pl-2 border-l border-lines/10'>
									{obj}
								</span>
							))}
						</div>
					)}

					{/* Complications */}
					<div className='flex flex-col gap-1'>
						<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
							Complications
						</span>
						{complications.length === 0 ?
							<span className='font-mono text-[9px] text-green-400/60 pl-2 border-l border-lines/10'>
								None
							</span>
						:	<div className='flex flex-wrap gap-1 pl-2'>
								{complications.map((c) => (
									<span
										key={c}
										className='font-mono text-[8px] uppercase tracking-wider text-orange-400/70 border border-orange-900/30 bg-orange-900/5 px-1.5 py-0.5 rounded-sm'>
										{COMPLICATION_LABELS[c] ?? c}
									</span>
								))}
							</div>
						}
					</div>

					{/* Intel developed */}
					<div className='flex flex-col gap-1'>
						<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
							Intel Developed
						</span>
						{intelEmpty || intel.length === 0 ?
							<span className='font-mono text-[9px] text-lines/25 pl-2 border-l border-lines/10'>
								No actionable intel
							</span>
						:	<div className='flex flex-wrap gap-1 pl-2'>
								{intel.map((i) => (
									<span
										key={i}
										className='font-mono text-[8px] uppercase tracking-wider text-indigo-400/70 border border-indigo-900/30 bg-indigo-900/5 px-1.5 py-0.5 rounded-sm'>
										{INTEL_LABELS[i] ?? i}
									</span>
								))}
							</div>
						}
					</div>

					{/* Casualty note */}
					{hasCasualty && phase.casualtyNote && (
						<div className='flex flex-col gap-1'>
							<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
								Casualty Report
							</span>
							<p className='font-mono text-[9px] text-red-400/70 pl-2 border-l border-red-900/30 leading-relaxed'>
								{phase.casualtyNote}
							</p>
						</div>
					)}

					{/* Field notes */}
					{hasNotes && (
						<div className='flex flex-col gap-1'>
							<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
								Field Notes
							</span>
							<p className='font-mono text-[9px] text-lines/45 pl-2 border-l border-lines/10 leading-relaxed'>
								{phase.notes}
							</p>
						</div>
					)}

					{/* Generator snapshot coords */}
					{phase.generatorSnapshot && (
						<div className='flex flex-col gap-1'>
							<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
								Insertion Points
							</span>
							<div className='grid grid-cols-3 gap-2 pl-2'>
								{[
									{
										label: "INFIL",
										val: phase.generatorSnapshot.infilPoint,
										color: "text-green-400/60",
									},
									{
										label: "EXFIL",
										val: phase.generatorSnapshot.exfilPoint,
										color: "text-blue-400/60",
									},
									{
										label: "RALLY",
										val: phase.generatorSnapshot.rallyPoint,
										color: "text-amber-400/60",
									},
								].map(({ label, val, color }) => (
									<div
										key={label}
										className='flex flex-col gap-0.5'>
										<span
											className={`font-mono text-[8px] tracking-widest ${color} uppercase`}>
											{label}
										</span>
										<span className='font-mono text-[8px] text-lines/25'>
											{val ?
												`[${Math.round(val[0])}, ${Math.round(val[1])}]`
											:	"—"}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─── PhaseList ────────────────────────────────────────────────────────────────

export default function PhaseList({ phases = [], onNewPhase, onAAR }) {
	const hasPhases = phases.length > 0;

	const kiaCount = phases.filter((p) => p.casualties === "kia").length;
	const wiaCount = phases.filter((p) => p.casualties === "injured").length;
	const cleanCount = phases.filter((p) => p.outcome === "clean").length;

	return (
		<div className='flex flex-col h-full min-h-0'>
			{/* ── Header bar ── */}
			<div className='shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-lines/15 bg-blk/40'>
				<div className='flex items-center gap-2'>
					<span className='w-1.5 h-1.5 rounded-full bg-btn shadow-[0_0_4px_rgba(124,170,121,0.45)] shrink-0' />
					<span className='font-mono text-[10px] tracking-[0.18em] text-lines uppercase'>
						Phase Log
					</span>
					{hasPhases && (
						<span className='font-mono text-[9px] text-btn border border-btn/30 px-1.5 py-0.5 rounded-sm'>
							{phases.length}
						</span>
					)}
				</div>

				<div className='flex items-center gap-2'>
					{/* AAR button — only when phases exist */}
					{hasPhases && (
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

					{/* New phase button */}
					<button
						onClick={onNewPhase}
						className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-btn hover:text-white border border-btn/30 hover:border-btn/60 bg-btn/5 hover:bg-btn/15 px-2 py-1 rounded-sm transition-all'>
						<FontAwesomeIcon
							icon={faPlus}
							className='text-[8px]'
						/>
						New Phase
					</button>
				</div>
			</div>

			{/* ── Summary chips — only when phases exist ── */}
			{hasPhases && (
				<div className='shrink-0 flex items-center gap-2 px-4 py-2 border-b border-lines/10 bg-blk/20 flex-wrap'>
					<div className='flex items-center gap-1.5 bg-blk/40 border border-lines/10 px-2 py-1 rounded-sm'>
						<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
							Phases
						</span>
						<span className='font-mono text-[9px] text-btn'>
							{phases.length}
						</span>
					</div>
					<div className='flex items-center gap-1.5 bg-blk/40 border border-lines/10 px-2 py-1 rounded-sm'>
						<span className='font-mono text-[8px] tracking-widest text-lines/25 uppercase'>
							Clean
						</span>
						<span className='font-mono text-[9px] text-green-400'>
							{cleanCount}
						</span>
					</div>
					{kiaCount > 0 && (
						<div className='flex items-center gap-1.5 bg-red-900/10 border border-red-900/30 px-2 py-1 rounded-sm'>
							<FontAwesomeIcon
								icon={faSkull}
								className='text-red-400/60 text-[7px]'
							/>
							<span className='font-mono text-[8px] tracking-widest text-red-400/60 uppercase'>
								KIA
							</span>
							<span className='font-mono text-[9px] text-red-400'>
								{kiaCount}
							</span>
						</div>
					)}
					{wiaCount > 0 && (
						<div className='flex items-center gap-1.5 bg-yellow-900/10 border border-yellow-900/30 px-2 py-1 rounded-sm'>
							<FontAwesomeIcon
								icon={faBandage}
								className='text-yellow-400/60 text-[7px]'
							/>
							<span className='font-mono text-[8px] tracking-widest text-yellow-400/60 uppercase'>
								WIA
							</span>
							<span className='font-mono text-[9px] text-yellow-400'>
								{wiaCount}
							</span>
						</div>
					)}
				</div>
			)}

			{/* ── Phase cards or empty state ── */}
			<div className='flex-1 min-h-0 overflow-y-auto'>
				{!hasPhases ?
					<div className='flex flex-col items-center justify-center h-full gap-4 p-6 text-center'>
						<div className='grid grid-cols-3 gap-1 opacity-10'>
							{[...Array(9)].map((_, i) => (
								<div
									key={i}
									className='w-2 h-2 border border-lines/50'
								/>
							))}
						</div>
						<p className='font-mono text-[9px] tracking-[0.25em] text-lines/25 uppercase'>
							// No phases filed //
						</p>
						<p className='font-mono text-[8px] text-lines/15 leading-relaxed'>
							Play the mission then return here
							<br />
							to file a phase report
						</p>
						<button
							onClick={onNewPhase}
							className='flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase text-btn border border-btn/30 hover:border-btn/60 bg-btn/5 hover:bg-btn/15 px-3 py-2 rounded-sm transition-all mt-1'>
							<FontAwesomeIcon
								icon={faPlus}
								className='text-[8px]'
							/>
							File Phase Report
						</button>
					</div>
				:	<div className='flex flex-col gap-2 p-4'>
						{phases
							.slice()
							.sort((a, b) => a.phaseNumber - b.phaseNumber)
							.map((phase) => (
								<PhaseCard
									key={phase._id ?? phase.phaseNumber}
									phase={phase}
								/>
							))}
					</div>
				}
			</div>
		</div>
	);
}

// ─── PropTypes ────────────────────────────────────────────────────────────────

PhaseList.propTypes = {
	phases: PropTypes.array,
	onNewPhase: PropTypes.func.isRequired,
	onAAR: PropTypes.func.isRequired,
};

PhaseCard.propTypes = {
	phase: PropTypes.shape({
		_id: PropTypes.string,
		phaseNumber: PropTypes.number,
		province: PropTypes.string,
		missionType: PropTypes.string,
		objectives: PropTypes.array,
		outcome: PropTypes.string,
		complications: PropTypes.array,
		casualties: PropTypes.string,
		casualtyNote: PropTypes.string,
		intelDeveloped: PropTypes.array,
		notes: PropTypes.string,
		generatorSnapshot: PropTypes.object,
		createdAt: PropTypes.string,
	}).isRequired,
};
