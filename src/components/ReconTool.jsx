// ReconTool.jsx — Military HUD aesthetic
// CHANGED: added onSave prop — called after debrief completes with { reconType, answers, modifiers }

import { useState } from "react";
import PropTypes from "prop-types";
import {
	ReconDebrief,
	ReconBriefingCard,
	ReconDebriefAdvanced,
} from "@/components";
import { getMissionModifiers } from "@/utils/ReconModifiers";
import { getAdvancedMissionModifiers } from "@/utils/ReconModifiersAdvance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faRotateLeft,
	faListCheck,
	faCrosshairs,
	faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

/* ─── Mode card ──────────────────────────────────────────────── */
function ModeCard({ icon, title, description, accent = false, onClick }) {
	return (
		<button
			onClick={onClick}
			className={[
				"w-full text-left flex items-start gap-3 px-3 py-3 border rounded-sm transition-all group",
				accent ?
					"border-btn/30 bg-btn/5 hover:bg-btn/12 hover:border-btn/55"
				:	"border-lines/20 bg-blk/30 hover:bg-white/[0.03] hover:border-lines/40",
			].join(" ")}>
			<div
				className={[
					"w-7 h-7 border rounded-sm flex items-center justify-center shrink-0 mt-0.5 transition-colors",
					accent ?
						"border-btn/35 bg-btn/10 group-hover:bg-btn/20"
					:	"border-lines/20 bg-lines/5 group-hover:border-lines/35",
				].join(" ")}>
				<FontAwesomeIcon
					icon={icon}
					className={[
						"text-[11px]",
						accent ? "text-btn" : "text-lines/45 group-hover:text-lines/70",
					].join(" ")}
				/>
			</div>
			<div className='flex flex-col gap-1 flex-1 min-w-0'>
				<div className='flex items-center justify-between gap-2'>
					<span
						className={[
							"font-mono text-[10px] tracking-widest uppercase",
							accent ? "text-btn" : "text-fontz/70",
						].join(" ")}>
						{title}
					</span>
					<FontAwesomeIcon
						icon={faChevronRight}
						className='text-lines/20 text-[8px] shrink-0 group-hover:text-lines/50 transition-colors'
					/>
				</div>
				<p className='font-mono text-[9px] text-lines/35 leading-relaxed'>
					{description}
				</p>
			</div>
		</button>
	);
}

/* ─── Section label ──────────────────────────────────────────── */
function SectionLabel({ text }) {
	return (
		<div className='flex items-center gap-3 shrink-0'>
			<div className='w-1 h-3 bg-btn shrink-0' />
			<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
				{text}
			</span>
			<div className='flex-1 h-px bg-lines/10' />
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════
   RECON TOOL
═══════════════════════════════════════════════════════════════ */
const ReconTool = ({ mission, onCasualtyUpdate = null, onSave = null }) => {
	const [phase, setPhase] = useState("mode");
	const [mode, setMode] = useState(null);
	const [modifiers, setModifiers] = useState(null);

	const handleModeSelect = (m) => {
		setMode(m);
		setPhase("debrief");
	};

	const handleDebriefComplete = (debriefAnswers) => {
		const computed =
			mode === "advanced" ?
				getAdvancedMissionModifiers(debriefAnswers)
			:	getMissionModifiers(debriefAnswers);

		setModifiers(computed);
		setPhase("results");

		// ── Persist to DB ─────────────────────────────────────────
		if (onSave) {
			onSave({
				reconType: debriefAnswers.reconType || "standard",
				answers: debriefAnswers,
				modifiers: computed,
			});
		}

		// Legacy casualty callback — unchanged
		if (
			onCasualtyUpdate &&
			debriefAnswers.casualties &&
			debriefAnswers.casualties !== "none"
		) {
			onCasualtyUpdate(debriefAnswers.casualties, mission);
		}
	};

	const handleReset = () => {
		setModifiers(null);
		setMode(null);
		setPhase("mode");
	};

	return (
		<div className='flex flex-col gap-4 h-full'>
			{/* ── Mode selection ── */}
			{phase === "mode" && (
				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-1'>
						<SectionLabel
							text={`Recon Debrief — ${mission?.name || "Operation"}`}
						/>
						<p className='font-mono text-[9px] text-lines/30 leading-relaxed mt-1 pl-4'>
							Select debrief protocol. Standard uses a 3–4 question flow.
							Advanced applies full recon doctrine with type-based questions and
							asset mismatch detection.
						</p>
					</div>
					<div className='flex flex-col gap-2'>
						<ModeCard
							icon={faListCheck}
							title='Standard Debrief'
							description='Survey completeness, compromise level, casualties, and team size. Quick flow — no recon type specialization.'
							onClick={() => handleModeSelect("standard")}
						/>
						<ModeCard
							icon={faCrosshairs}
							title='Advanced Debrief'
							description='Full doctrine-based flow. Select recon type (Route, Area, Zone, RIF, Special), type-specific questions, and asset logging.'
							accent
							onClick={() => handleModeSelect("advanced")}
						/>
					</div>
				</div>
			)}

			{/* ── Debrief flow ── */}
			{phase === "debrief" && mode === "standard" && (
				<div className='flex flex-col gap-3 h-full'>
					<SectionLabel text='Standard Debrief' />
					<div className='flex-1 min-h-0 overflow-y-auto'>
						<ReconDebrief
							mission={mission}
							onComplete={handleDebriefComplete}
						/>
					</div>
				</div>
			)}

			{phase === "debrief" && mode === "advanced" && (
				<div className='flex flex-col gap-3 h-full'>
					<SectionLabel text='Advanced Debrief' />
					<div className='flex-1 min-h-0 overflow-y-auto'>
						<ReconDebriefAdvanced
							mission={mission}
							onComplete={handleDebriefComplete}
						/>
					</div>
				</div>
			)}

			{/* ── Results ── */}
			{phase === "results" && modifiers && (
				<div className='flex flex-col gap-3 h-full'>
					<SectionLabel text='Debrief Results' />
					<div className='flex-1 min-h-0 overflow-y-auto'>
						<ReconBriefingCard
							mission={mission}
							modifiers={modifiers}
						/>
					</div>
					<button
						onClick={handleReset}
						className='shrink-0 flex items-center justify-center gap-2 w-full py-2 border border-lines/20 hover:border-lines/40 text-lines/35 hover:text-fontz font-mono text-[9px] tracking-widest uppercase rounded-sm transition-all'>
						<FontAwesomeIcon
							icon={faRotateLeft}
							className='text-[9px]'
						/>
						Re-run Debrief
					</button>
				</div>
			)}
		</div>
	);
};

ModeCard.propTypes = {
	icon: PropTypes.string,
	title: PropTypes.string,
	description: PropTypes.string,
	accent: PropTypes.bool,
	onClick: PropTypes.func,
};
SectionLabel.propTypes = {
	text: PropTypes.string,
};

ReconTool.propTypes = {
	mission: PropTypes.shape({
		_id: PropTypes.string,
		name: PropTypes.string,
		teams: PropTypes.array,
		status: PropTypes.string,
	}),
	onCasualtyUpdate: PropTypes.func,
	onSave: PropTypes.func,
};

export default ReconTool;
