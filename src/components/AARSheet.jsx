// ─────────────────────────────────────────────────────────────────────────────
// AARSheet.jsx
// After Action Report — phase selector + Groq generation + copy/share.
//
// Props:
//   mission   — active operation object
//   onSave    — (aarText) => void
//   onClose   — () => void
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faFileLines,
	faCheck,
	faCopy,
	faCheckDouble,
	faSkull,
	faBandage,
	faCircleExclamation,
	faCheckCircle,
	faXmarkCircle,
	faCircleQuestion,
	faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { generateAAR } from "@/api/GhostOpsApi";

// ─── Label maps ───────────────────────────────────────────────────────────────

const OUTCOME_META = {
	clean: { label: "Clean", color: "text-green-400", icon: faCheckCircle },
	compromised: {
		label: "Compromised",
		color: "text-yellow-400",
		icon: faCircleExclamation,
	},
	heavy_contact: {
		label: "Hvy Contact",
		color: "text-orange-400",
		icon: faCircleExclamation,
	},
	aborted: { label: "Aborted", color: "text-red-400", icon: faXmarkCircle },
	target_not_present: {
		label: "TGT Absent",
		color: "text-blue-400",
		icon: faCircleQuestion,
	},
};

// ─── Phase selector row ───────────────────────────────────────────────────────

function PhaseSelectRow({ phase, selected, onToggle }) {
	const outcome = OUTCOME_META[phase.outcome] ?? OUTCOME_META.aborted;
	const hasKIA = phase.casualties === "kia";
	const hasWIA = phase.casualties === "injured";

	return (
		<button
			onClick={() => onToggle(phase._id ?? phase.phaseNumber)}
			className={[
				"w-full flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all text-left",
				selected ?
					"border-btn/40 bg-btn/8"
				:	"border-lines/10 hover:border-lines/20 bg-transparent hover:bg-white/[0.02]",
			].join(" ")}>
			{/* Checkbox */}
			<div
				className={[
					"w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center transition-all",
					selected ? "border-btn bg-btn/20" : "border-lines/20",
				].join(" ")}>
				{selected && (
					<FontAwesomeIcon
						icon={faCheck}
						className='text-btn text-[7px]'
					/>
				)}
			</div>

			{/* Phase number */}
			<span
				className={[
					"font-mono text-[10px] font-bold shrink-0 w-6 tabular-nums",
					selected ? "text-btn" : "text-lines/30",
				].join(" ")}>
				{String(phase.phaseNumber).padStart(2, "0")}
			</span>

			{/* Outcome */}
			<div className='flex items-center gap-1.5 flex-1 min-w-0'>
				<FontAwesomeIcon
					icon={outcome.icon}
					className={`text-[9px] shrink-0 ${outcome.color}`}
				/>
				<span
					className={`font-mono text-[9px] uppercase tracking-wider truncate ${outcome.color}`}>
					{outcome.label}
				</span>
				{phase.province && (
					<>
						<span className='text-lines/15 shrink-0'>//</span>
						<span className='font-mono text-[9px] text-lines/30 truncate'>
							{phase.province}
						</span>
					</>
				)}
			</div>

			{/* Casualty badges */}
			<div className='flex items-center gap-1 shrink-0'>
				{hasKIA && (
					<span className='flex items-center gap-0.5 font-mono text-[7px] uppercase tracking-wider text-red-400/70 border border-red-900/30 bg-red-900/8 px-1 py-0.5 rounded-sm'>
						<FontAwesomeIcon
							icon={faSkull}
							className='text-[6px]'
						/>
						KIA
					</span>
				)}
				{hasWIA && (
					<span className='flex items-center gap-0.5 font-mono text-[7px] uppercase tracking-wider text-yellow-400/70 border border-yellow-900/30 bg-yellow-900/8 px-1 py-0.5 rounded-sm'>
						<FontAwesomeIcon
							icon={faBandage}
							className='text-[6px]'
						/>
						WIA
					</span>
				)}
			</div>
		</button>
	);
}

// ─── AAR text renderer ────────────────────────────────────────────────────────

function AARBody({ text }) {
	const paragraphs = text
		.split(/\n{2,}/)
		.map((p) => p.trim())
		.filter(Boolean);

	return (
		<div className='flex flex-col gap-3 px-4 py-4'>
			{/* Classification bar */}
			<div className='flex items-center justify-between pb-2 border-b border-lines/10'>
				<span className='font-mono text-[8px] tracking-[0.3em] text-red-500/35 uppercase'>
					// TOP SECRET //
				</span>
				<span className='font-mono text-[8px] tracking-widest text-lines/20'>
					AFTER ACTION REPORT
				</span>
			</div>

			{/* Body paragraphs */}
			{paragraphs.map((para, i) => (
				<p
					key={i}
					className='font-mono text-[10px] text-fontz/68 leading-relaxed'>
					{para}
				</p>
			))}
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AARSheet({ mission, onSave, onClose }) {
	const phases = mission?.phases ?? [];

	// All phases selected by default
	const allIds = phases.map((p) => p._id ?? p.phaseNumber);
	const [selected, setSelected] = useState(new Set(allIds));
	const [aarText, setAarText] = useState(mission?.aar ?? "");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);
	const [saved, setSaved] = useState(!!mission?.aar);

	const hasAAR = !!aarText;
	const selectedArr = phases.filter((p) =>
		selected.has(p._id ?? p.phaseNumber),
	);

	// ── Toggle phase selection ─────────────────────────────────────────────────
	const togglePhase = (id) => {
		setSelected((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const selectAll = () => setSelected(new Set(allIds));
	const clearAll = () => setSelected(new Set());

	// ── Generate ───────────────────────────────────────────────────────────────
	const handleGenerate = async () => {
		if (!selectedArr.length) return;
		setLoading(true);
		setError("");
		setSaved(false);

		try {
			const text = await generateAAR({
				mission,
				selectedPhases: selectedArr,
			});
			setAarText(text);
		} catch (err) {
			setError(err.message ?? "Generation failed. Try again.");
		} finally {
			setLoading(false);
		}
	};

	// ── Save ───────────────────────────────────────────────────────────────────
	const handleSave = async () => {
		if (!aarText || !onSave) return;
		await onSave(aarText);
		setSaved(true);
	};

	// ── Copy ───────────────────────────────────────────────────────────────────
	const handleCopy = async () => {
		if (!aarText) return;
		const shareText =
			`OPERATION: ${mission?.name ?? "UNKNOWN"}\n` +
			`AO: ${mission?.province ?? "Unknown"}\n` +
			`─────────────────────────────\n\n` +
			aarText +
			`\n\n— GhostOpsAI / ghostopsai.com`;

		try {
			await navigator.clipboard.writeText(shareText);
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		} catch {
			/* clipboard not available */
		}
	};

	// ── View state ─────────────────────────────────────────────────────────────
	// "select" = phase picker, "report" = AAR display
	const [view, setView] = useState(hasAAR ? "report" : "select");

	return (
		<div className='flex flex-col h-full bg-blk/95 overflow-hidden'>
			{/* ── Header ── */}
			<div className='shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-lines/15 bg-blk/60'>
				<div className='flex items-center gap-2'>
					<span className='w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)] shrink-0' />
					<span className='font-mono text-[10px] tracking-[0.18em] text-lines uppercase'>
						After Action Report
					</span>
					{saved && (
						<span className='font-mono text-[8px] text-green-400 border border-green-900/40 px-1.5 py-0.5 rounded-sm'>
							SAVED
						</span>
					)}
				</div>

				{/* View toggle — only when AAR exists */}
				{hasAAR && (
					<div className='flex items-center border border-lines/15 rounded-sm overflow-hidden'>
						<button
							onClick={() => setView("select")}
							className={[
								"px-2 py-1 font-mono text-[8px] uppercase tracking-widest transition-all",
								view === "select" ?
									"bg-lines/10 text-lines/60"
								:	"text-lines/25 hover:text-lines/45",
							].join(" ")}>
							Phases
						</button>
						<button
							onClick={() => setView("report")}
							className={[
								"px-2 py-1 font-mono text-[8px] uppercase tracking-widest transition-all",
								view === "report" ?
									"bg-lines/10 text-lines/60"
								:	"text-lines/25 hover:text-lines/45",
							].join(" ")}>
							Report
						</button>
					</div>
				)}
			</div>

			{/* ── Phase selector view ── */}
			{view === "select" && (
				<>
					<div className='shrink-0 flex items-center justify-between px-4 py-2 border-b border-lines/10 bg-blk/30'>
						<span className='font-mono text-[9px] text-lines/30 uppercase tracking-wider'>
							{selectedArr.length} of {phases.length} phases selected
						</span>
						<div className='flex items-center gap-2'>
							<button
								onClick={selectAll}
								className='font-mono text-[8px] tracking-widest uppercase text-lines/30 hover:text-btn transition-colors'>
								All
							</button>
							<span className='text-lines/15'>|</span>
							<button
								onClick={clearAll}
								className='font-mono text-[8px] tracking-widest uppercase text-lines/30 hover:text-btn transition-colors'>
								Clear
							</button>
						</div>
					</div>

					<div className='flex-1 min-h-0 overflow-y-auto'>
						{phases.length === 0 ?
							<div className='flex flex-col items-center justify-center h-full gap-3 p-6 text-center'>
								<p className='font-mono text-[9px] tracking-[0.25em] text-lines/25 uppercase'>
									// No phases filed //
								</p>
								<p className='font-mono text-[8px] text-lines/15'>
									File at least one phase report before generating an AAR
								</p>
							</div>
						:	<div className='flex flex-col gap-1.5 p-4'>
								{phases
									.slice()
									.sort((a, b) => a.phaseNumber - b.phaseNumber)
									.map((phase) => (
										<PhaseSelectRow
											key={phase._id ?? phase.phaseNumber}
											phase={phase}
											selected={selected.has(phase._id ?? phase.phaseNumber)}
											onToggle={togglePhase}
										/>
									))}
							</div>
						}
					</div>

					{/* Error */}
					{error && (
						<div className='shrink-0 px-4 py-2 border-t border-red-900/30 bg-red-900/10'>
							<p className='font-mono text-[9px] text-red-400/70'>{error}</p>
						</div>
					)}

					{/* Generate footer */}
					<div className='shrink-0 flex items-center justify-between px-4 py-3 border-t border-lines/15 bg-blk/40'>
						<div className='flex flex-col gap-0.5'>
							<span className='font-mono text-[8px] text-lines/25 uppercase tracking-widest'>
								Groq — llama-3.3-70b
							</span>
							<span className='font-mono text-[8px] text-lines/15'>
								~600 tokens per generation
							</span>
						</div>
						<button
							onClick={handleGenerate}
							disabled={loading || !selectedArr.length}
							className='flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase text-blk bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-sm transition-all'>
							{loading ?
								<>
									<FontAwesomeIcon
										icon={faRotateRight}
										className='text-[9px] animate-spin'
									/>
									Generating...
								</>
							:	<>
									<FontAwesomeIcon
										icon={faFileLines}
										className='text-[9px]'
									/>
									{hasAAR ? "Regenerate AAR" : "Generate AAR"}
								</>
							}
						</button>
					</div>
				</>
			)}

			{/* ── Report view ── */}
			{view === "report" && hasAAR && (
				<>
					<div className='flex-1 min-h-0 overflow-y-auto'>
						<AARBody text={aarText} />
					</div>

					{/* Action footer */}
					<div className='shrink-0 flex items-center justify-between px-4 py-3 border-t border-lines/15 bg-blk/40'>
						<div className='flex items-center gap-2'>
							{/* Copy / share */}
							<button
								onClick={handleCopy}
								className={[
									"flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-sm border transition-all",
									copied ?
										"text-green-400 border-green-900/40 bg-green-900/10"
									:	"text-lines/40 border-lines/15 hover:border-lines/30 hover:text-fontz",
								].join(" ")}>
								<FontAwesomeIcon
									icon={copied ? faCheckDouble : faCopy}
									className='text-[9px]'
								/>
								{copied ? "Copied" : "Copy"}
							</button>

							{/* Save to operation */}
							{!saved && (
								<button
									onClick={handleSave}
									className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-btn border border-btn/30 hover:border-btn/60 bg-btn/5 hover:bg-btn/15 px-3 py-1.5 rounded-sm transition-all'>
									<FontAwesomeIcon
										icon={faCheck}
										className='text-[9px]'
									/>
									Save to Op
								</button>
							)}
							{saved && (
								<span className='font-mono text-[9px] text-green-400/60 uppercase tracking-widest'>
									Saved
								</span>
							)}
						</div>

						{/* Regenerate */}
						<button
							onClick={() => setView("select")}
							className='font-mono text-[8px] tracking-widest uppercase text-lines/25 hover:text-btn transition-colors'>
							Regenerate
						</button>
					</div>
				</>
			)}

			{/* Auto-switch to report view when AAR arrives */}
			{loading === false &&
				aarText &&
				view === "select" &&
				(() => {
					setView("report");
					return null;
				})()}
		</div>
	);
}

// ─── PropTypes ────────────────────────────────────────────────────────────────

AARSheet.propTypes = {
	mission: PropTypes.shape({
		_id: PropTypes.string,
		name: PropTypes.string,
		province: PropTypes.string,
		biome: PropTypes.string,
		missionType: PropTypes.string,
		phases: PropTypes.array,
		aar: PropTypes.string,
	}).isRequired,
	onSave: PropTypes.func.isRequired,
	onClose: PropTypes.func,
};

PhaseSelectRow.propTypes = {
	phase: PropTypes.object.isRequired,
	selected: PropTypes.bool.isRequired,
	onToggle: PropTypes.func.isRequired,
};

AARBody.propTypes = {
	text: PropTypes.string.isRequired,
};
