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
} from "@fortawesome/free-solid-svg-icons";

/**
 * ReconTool
 *
 * Orchestrates mode selection → debrief → results.
 * Standard mode uses the simple 3-4 question flow.
 * Advanced mode uses the full type-based flow with asset mismatch detection.
 *
 * Usage:
 * <ReconTool mission={mission} onCasualtyUpdate={(type, mission) => {}} />
 */
const ReconTool = ({ mission, onCasualtyUpdate = null }) => {
	const [phase, setPhase] = useState("mode"); // "mode" | "debrief" | "results"
	const [mode, setMode] = useState(null); // "standard" | "advanced"
	const [modifiers, setModifiers] = useState(null);

	const handleModeSelect = (selectedMode) => {
		setMode(selectedMode);
		setPhase("debrief");
	};

	const handleDebriefComplete = (answers) => {
		const computed =
			mode === "advanced" ?
				getAdvancedMissionModifiers(answers)
			:	getMissionModifiers(answers);

		setModifiers(computed);
		setPhase("results");

		if (
			onCasualtyUpdate &&
			answers.casualties &&
			answers.casualties !== "none"
		) {
			onCasualtyUpdate(answers.casualties, mission);
		}
	};

	const handleReset = () => {
		setModifiers(null);
		setMode(null);
		setPhase("mode");
	};

	return (
		<div className='flex flex-col gap-4'>
			{/* ── Mode selection ── */}
			{phase === "mode" && (
				<div className='flex flex-col gap-6 p-4 md:p-6'>
					<div className='flex flex-col gap-1'>
						<span className='text-xs font-mono text-gray-500 uppercase tracking-widest'>
							Recon Debrief — {mission?.name || "Operation"}
						</span>
						<h2 className='text-fontz text-lg font-bold'>
							Select Debrief Type
						</h2>
						<p className='text-gray-500 text-xs'>
							Standard is a quick 3–4 question flow. Advanced uses full recon
							doctrine with type-based questions and asset mismatch detection.
						</p>
					</div>

					<div className='flex flex-col gap-3'>
						{/* Standard */}
						<button
							onClick={() => handleModeSelect("standard")}
							className='w-full text-left flex items-start gap-4 p-4 rounded border border-lines/30 hover:border-gray-400 hover:bg-gray-400/10 transition-all duration-200 cursor-pointer'>
							<FontAwesomeIcon
								icon={faListCheck}
								className='mt-0.5 text-gray-400 text-base shrink-0'
							/>
							<div className='flex flex-col gap-0.5'>
								<span className='text-sm font-semibold text-fontz'>
									Standard Debrief
								</span>
								<span className='text-xs text-gray-500 leading-relaxed'>
									Survey completeness, compromise level, casualties, and team
									size. Quick and straightforward — no recon type
									specialization.
								</span>
							</div>
						</button>

						{/* Advanced */}
						<button
							onClick={() => handleModeSelect("advanced")}
							className='w-full text-left flex items-start gap-4 p-4 rounded border border-lines/30 hover:border-btn hover:bg-btn/10 transition-all duration-200 cursor-pointer'>
							<FontAwesomeIcon
								icon={faCrosshairs}
								className='mt-0.5 text-btn text-base shrink-0'
							/>
							<div className='flex flex-col gap-0.5'>
								<span className='text-sm font-semibold text-fontz'>
									Advanced Debrief
								</span>
								<span className='text-xs text-gray-500 leading-relaxed'>
									Full doctrine-based debrief. Select recon type (Route, Area,
									Zone, RIF, Special), answer type-specific questions, and log
									which assets were used. Asset mismatches affect modifiers.
								</span>
							</div>
						</button>
					</div>
				</div>
			)}

			{/* ── Debrief flow ── */}
			{phase === "debrief" && mode === "standard" && (
				<ReconDebrief
					mission={mission}
					onComplete={handleDebriefComplete}
				/>
			)}

			{phase === "debrief" && mode === "advanced" && (
				<ReconDebriefAdvanced
					mission={mission}
					onComplete={handleDebriefComplete}
				/>
			)}

			{/* ── Results ── */}
			{phase === "results" && modifiers && (
				<div className='flex flex-col gap-4 p-4 md:p-6'>
					<ReconBriefingCard
						mission={mission}
						modifiers={modifiers}
					/>

					<button
						onClick={handleReset}
						className='flex items-center justify-center gap-2 w-full py-2.5 rounded border border-lines/30 text-gray-500 text-xs font-mono uppercase tracking-widest hover:text-fontz hover:border-lines transition-all cursor-pointer'>
						<FontAwesomeIcon
							icon={faRotateLeft}
							className='text-xs'
						/>
						Re-run Debrief
					</button>
				</div>
			)}
		</div>
	);
};

ReconTool.propTypes = {
	mission: PropTypes.shape({
		_id: PropTypes.string,
		name: PropTypes.string,
		teams: PropTypes.array,
		status: PropTypes.string,
	}),
	onCasualtyUpdate: PropTypes.func,
};

export default ReconTool;
