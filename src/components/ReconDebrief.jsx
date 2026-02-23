import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faChevronRight,
	faShieldHalved,
	faEye,
	faPersonFalling,
	faSkull,
} from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";

// ── Static step definitions ─────────────────────────────────────────────────

const STEP_SURVEY = {
	id: "survey",
	question: "What was the extent of the objective survey?",
	subtext:
		"How much of the target area did the recon team successfully observe?",
	options: [
		{
			value: "full",
			label: "Full Recon",
			description:
				"Complete survey of the objective. All entry points, patrol routes, and HVT location confirmed.",
			icon: faEye,
			color: "text-emerald-400",
			border: "border-emerald-400/40 hover:border-emerald-400",
			bg: "hover:bg-emerald-400/10",
			selectedBg: "bg-emerald-400/10 border-emerald-400",
		},
		{
			value: "partial",
			label: "Partial Recon",
			description:
				"Incomplete survey. Some entry points or patrol routes remain unknown.",
			icon: faEye,
			color: "text-amber-400",
			border: "border-amber-400/40 hover:border-amber-400",
			bg: "hover:bg-amber-400/10",
			selectedBg: "bg-amber-400/10 border-amber-400",
		},
		{
			value: "none",
			label: "No Intel Gathered",
			description: "Team was unable to survey the objective before compromise.",
			icon: faEye,
			color: "text-red-400",
			border: "border-red-400/40 hover:border-red-400",
			bg: "hover:bg-red-400/10",
			selectedBg: "bg-red-400/10 border-red-400",
		},
	],
};

const STEP_COMPROMISE = {
	id: "compromise",
	question: "Was the recon team compromised?",
	subtext:
		"Report the highest level of enemy contact during the recon operation.",
	options: [
		{
			value: "cold",
			label: "Never Detected",
			description:
				"Team completed recon and exfiltrated without enemy contact. Ghost Protocol maintained.",
			icon: faShieldHalved,
			color: "text-emerald-400",
			border: "border-emerald-400/40 hover:border-emerald-400",
			bg: "hover:bg-emerald-400/10",
			selectedBg: "bg-emerald-400/10 border-emerald-400",
		},
		{
			value: "warm",
			label: "Detected, Evaded",
			description:
				"Enemy became aware of team presence but team broke contact without engagement.",
			icon: faShieldHalved,
			color: "text-amber-400",
			border: "border-amber-400/40 hover:border-amber-400",
			bg: "hover:bg-amber-400/10",
			selectedBg: "bg-amber-400/10 border-amber-400",
		},
		{
			value: "engaged",
			label: "Engaged During Recon",
			description:
				"Team took fire while surveying the objective. Contact broken, team extracted.",
			icon: faPersonFalling,
			color: "text-orange-400",
			border: "border-orange-400/40 hover:border-orange-400",
			bg: "hover:bg-orange-400/10",
			selectedBg: "bg-orange-400/10 border-orange-400",
		},
		{
			value: "engaged_exfil",
			label: "Engaged During Exfil",
			description:
				"Recon completed but team was compromised while extracting from the AO.",
			icon: faPersonFalling,
			color: "text-orange-400",
			border: "border-orange-400/40 hover:border-orange-400",
			bg: "hover:bg-orange-400/10",
			selectedBg: "bg-orange-400/10 border-orange-400",
		},
		{
			value: "burned",
			label: "Team Captured / KIA",
			description:
				"Recon element was neutralized. Enemy has full awareness of incoming operation.",
			icon: faSkull,
			color: "text-red-400",
			border: "border-red-400/40 hover:border-red-400",
			bg: "hover:bg-red-400/10",
			selectedBg: "bg-red-400/10 border-red-400",
		},
	],
};

const STEP_CASUALTIES = {
	id: "casualties",
	question: "Did the recon team sustain any casualties?",
	subtext: "Operator status following the recon operation.",
	options: [
		{
			value: "none",
			label: "No Casualties",
			description: "All recon operators returned at full strength.",
			icon: faShieldHalved,
			color: "text-emerald-400",
			border: "border-emerald-400/40 hover:border-emerald-400",
			bg: "hover:bg-emerald-400/10",
			selectedBg: "bg-emerald-400/10 border-emerald-400",
		},
		{
			value: "wia",
			label: "Wounded in Action",
			description:
				"One or more operators sustained injuries. Will be flagged in operator status.",
			icon: faPersonFalling,
			color: "text-amber-400",
			border: "border-amber-400/40 hover:border-amber-400",
			bg: "hover:bg-amber-400/10",
			selectedBg: "bg-amber-400/10 border-amber-400",
		},
		{
			value: "kia",
			label: "Killed in Action",
			description:
				"Operator loss confirmed. Roster will be updated accordingly.",
			icon: faSkull,
			color: "text-red-400",
			border: "border-red-400/40 hover:border-red-400",
			bg: "hover:bg-red-400/10",
			selectedBg: "bg-red-400/10 border-red-400",
		},
	],
};

const STEP_TEAM_SIZE = {
	id: "teamSize",
	question: "What was the recon team size?",
	subtext:
		"Larger elements cover more ground but are harder to keep concealed. Team size affects intel coverage and stealth ceiling.",
	options: [
		{
			value: "solo",
			label: "Solo Operator",
			description:
				"Maximum stealth, minimum coverage. Intel accuracy is reduced — one set of eyes can only see so much.",
			icon: faPersonFalling,
			color: "text-indigo-400",
			border: "border-indigo-400/40 hover:border-indigo-400",
			bg: "hover:bg-indigo-400/10",
			selectedBg: "bg-indigo-400/10 border-indigo-400",
		},
		{
			value: "two",
			label: "2-Man Element",
			description:
				"Standard recon pair. Balanced stealth and coverage. No intel modifier.",
			icon: faShieldHalved,
			color: "text-emerald-400",
			border: "border-emerald-400/40 hover:border-emerald-400",
			bg: "hover:bg-emerald-400/10",
			selectedBg: "bg-emerald-400/10 border-emerald-400",
		},
		{
			value: "squad",
			label: "Full Squad (3-4)",
			description:
				"Maximum coverage. Intel accuracy is improved — multiple operators confirm entry points, patrol routes, and HVT position.",
			icon: faEye,
			color: "text-amber-400",
			border: "border-amber-400/40 hover:border-amber-400",
			bg: "hover:bg-amber-400/10",
			selectedBg: "bg-amber-400/10 border-amber-400",
		},
	],
};

// Compromise levels where casualties are already implied — skip that question
const CASUALTIES_IMPLIED = ["engaged", "burned"];

// ── Component ───────────────────────────────────────────────────────────────

const ReconDebrief = ({ mission, onComplete }) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [answers, setAnswers] = useState({});
	const [selected, setSelected] = useState(null);
	const [animating, setAnimating] = useState(false);

	// Rebuild step list whenever compromise answer changes
	const steps = useMemo(() => {
		const skipCasualties =
			answers.compromise && CASUALTIES_IMPLIED.includes(answers.compromise);
		return skipCasualties ?
				[STEP_SURVEY, STEP_COMPROMISE, STEP_TEAM_SIZE]
			:	[STEP_SURVEY, STEP_COMPROMISE, STEP_CASUALTIES, STEP_TEAM_SIZE];
	}, [answers.compromise]);

	const step = steps[currentStep];
	const totalSteps = steps.length;
	const progress = (currentStep / totalSteps) * 100;
	const isLastStep = currentStep === totalSteps - 1;

	const handleSelect = (value) => setSelected(value);

	const handleNext = () => {
		if (!selected) return;

		const newAnswers = { ...answers, [step.id]: selected };

		// Auto-set casualties to "kia" when compromise implies it
		// so getMissionModifiers always receives the casualties field
		if (step.id === "compromise" && CASUALTIES_IMPLIED.includes(selected)) {
			newAnswers.casualties = "kia";
		}

		setAnswers(newAnswers);
		setAnimating(true);

		setTimeout(() => {
			if (!isLastStep) {
				setCurrentStep((s) => s + 1);
				setSelected(null);
			} else {
				onComplete(newAnswers);
			}
			setAnimating(false);
		}, 250);
	};

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6'>
			{/* Header */}
			<div className='flex flex-col gap-1'>
				<div className='flex items-center justify-between'>
					<span className='text-xs font-mono text-gray-500 uppercase tracking-widest'>
						Recon Debrief — {mission?.name || "Operation"}
					</span>
					<span className='text-xs font-mono text-gray-500'>
						{currentStep + 1} / {totalSteps}
					</span>
				</div>
				<div className='w-full h-0.5 bg-gray-800 rounded-full overflow-hidden'>
					<div
						className='h-full bg-btn transition-all duration-500'
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>

			{/* Question */}
			<div
				className={`flex flex-col gap-1 transition-opacity duration-250 ${
					animating ? "opacity-0" : "opacity-100"
				}`}>
				<h2 className='text-fontz text-lg font-bold'>{step.question}</h2>
				<p className='text-gray-500 text-xs'>{step.subtext}</p>
			</div>

			{/* Options */}
			<div
				className={`flex flex-col gap-3 transition-opacity duration-250 ${
					animating ? "opacity-0" : "opacity-100"
				}`}>
				{step.options.map((opt) => {
					const isSelected = selected === opt.value;
					return (
						<button
							key={opt.value}
							onClick={() => handleSelect(opt.value)}
							className={`w-full text-left flex items-start gap-4 p-4 rounded border transition-all duration-200 cursor-pointer
                                ${isSelected ? opt.selectedBg : `border-lines/30 bg-transparent ${opt.bg} ${opt.border}`}
                            `}>
							<FontAwesomeIcon
								icon={opt.icon}
								className={`mt-0.5 text-base ${opt.color} shrink-0`}
							/>
							<div className='flex flex-col gap-0.5'>
								<span
									className={`text-sm font-semibold ${isSelected ? opt.color : "text-fontz"}`}>
									{opt.label}
								</span>
								<span className='text-xs text-gray-500 leading-relaxed'>
									{opt.description}
								</span>
							</div>
							{isSelected && (
								<FontAwesomeIcon
									icon={faChevronRight}
									className={`ml-auto mt-0.5 text-xs ${opt.color} shrink-0`}
								/>
							)}
						</button>
					);
				})}
			</div>

			{/* Next button */}
			<button
				onClick={handleNext}
				disabled={!selected}
				className={`w-full py-3 rounded text-sm font-bold uppercase tracking-widest transition-all duration-200
                    ${
											selected ?
												"bg-btn text-blk cursor-pointer hover:bg-highlight hover:text-fontz"
											:	"bg-gray-800 text-gray-600 cursor-not-allowed"
										}`}>
				{isLastStep ? "Submit Debrief" : "Confirm & Continue"}
			</button>
		</div>
	);
};

ReconDebrief.propTypes = {
	mission: PropTypes.shape({
		_id: PropTypes.string,
		name: PropTypes.string,
	}),
	onComplete: PropTypes.func.isRequired,
};

export default ReconDebrief;
