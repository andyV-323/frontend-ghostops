import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faChevronRight,
	faShieldHalved,
	faEye,
	faPersonFalling,
	faSkull,
	faRoute,
	faMap,
	faBuilding,
	faCrosshairs,
	faUserSecret,
	faListCheck,
	faCheck,
} from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";
import { ASSETS, RECON_TYPE_META } from "@/utils/ReconModifiersAdvance";

// ── Recon type selector step ─────────────────────────────────────────────────
const STEP_RECON_TYPE = {
	id: "reconType",
	question: "What type of recon was conducted?",
	subtext:
		"Select the recon doctrine used. This determines which questions follow and how intel is weighted.",
	options: [
		{
			value: "standard",
			label: "Standard Recon",
			description: "General purpose debrief. No specialization required.",
			asset: "Any configuration",
			icon: faListCheck,
			color: "text-gray-400",
			border: "border-gray-400/40 hover:border-gray-400",
			bg: "hover:bg-gray-400/10",
			selectedBg: "bg-gray-400/10 border-gray-400",
		},
		{
			value: "route",
			label: "Route Recon",
			description:
				"Systematic examination of a specific path or axis of advance. Confirms insertion and exfil routes are clear before committing the main element.",
			asset: "Scout drone, solo, 2-man element, or light vehicle",
			icon: faRoute,
			color: "text-cyan-400",
			border: "border-cyan-400/40 hover:border-cyan-400",
			bg: "hover:bg-cyan-400/10",
			selectedBg: "bg-cyan-400/10 border-cyan-400",
		},
		{
			value: "area",
			label: "Area Recon",
			description:
				"Broad survey of a defined sector to establish enemy presence and activity patterns. Wide but shallow intel — useful when the objective isn't precisely confirmed.",
			asset: "Armaros drone, helicopter flyover, or 2–4 man patrol",
			icon: faMap,
			color: "text-amber-400",
			border: "border-amber-400/40 hover:border-amber-400",
			bg: "hover:bg-amber-400/10",
			selectedBg: "bg-amber-400/10 border-amber-400",
		},
		{
			value: "zone",
			label: "Zone Recon",
			description:
				"Detailed close-target survey of a compound or facility. Produces entry points, guard rotations, patrol timing, and HVT location. Highest intel accuracy ceiling.",
			asset: "2–4 man element on foot, scout drone, or embedded OP",
			icon: faBuilding,
			color: "text-emerald-400",
			border: "border-emerald-400/40 hover:border-emerald-400",
			bg: "hover:bg-emerald-400/10",
			selectedBg: "bg-emerald-400/10 border-emerald-400",
		},
		{
			value: "rif",
			label: "Recon-in-Force",
			description:
				"Deliberate armed probe to draw enemy reaction and assess defensive posture. Contact is intentional. Maps reinforcement patterns and response speed. Always results in at least WARM compromise.",
			asset:
				"Full squad (3–4), armed vehicles, or helicopter gunship overwatch",
			icon: faCrosshairs,
			color: "text-orange-400",
			border: "border-orange-400/40 hover:border-orange-400",
			bg: "hover:bg-orange-400/10",
			selectedBg: "bg-orange-400/10 border-orange-400",
		},
		{
			value: "special",
			label: "Special Recon",
			description:
				"Covert long-duration observation by a small embedded element. Operators establish a hide site and observe over time. Intel scales with duration. Catastrophic if burned.",
			asset: "Solo operator or 2-man element — no vehicles, minimal signature",
			icon: faUserSecret,
			color: "text-indigo-400",
			border: "border-indigo-400/40 hover:border-indigo-400",
			bg: "hover:bg-indigo-400/10",
			selectedBg: "bg-indigo-400/10 border-indigo-400",
		},
	],
};

// ── Shared steps ─────────────────────────────────────────────────────────────

const STEP_SURVEY = {
	id: "survey",
	question: "What was the extent of the objective survey?",
	subtext:
		"How much of the target area did the recon team successfully observe?",
	options: [
		{
			value: "full",
			label: "Full Survey",
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
			label: "Partial Survey",
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

{
	/*const STEP_TEAM_SIZE = {
    id: "teamSize",
    question: "What was the recon team size?",
    subtext:
        "Larger elements cover more ground but are harder to keep concealed.",
    options: [
        {
            value: "solo",
            label: "Solo Operator",
            description:
                "Maximum stealth, minimum coverage. Intel accuracy reduced — one set of eyes can only see so much.",
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
            label: "Full Squad (3–4)",
            description:
                "Maximum coverage. Intel accuracy improved — multiple operators confirm entry points and patrol routes.",
            icon: faEye,
            color: "text-amber-400",
            border: "border-amber-400/40 hover:border-amber-400",
            bg: "hover:bg-amber-400/10",
            selectedBg: "bg-amber-400/10 border-amber-400",
        },
    ],
};
*/
}
// ── Type-specific steps ──────────────────────────────────────────────────────

const STEP_ROUTE_STATUS = {
	id: "routeStatus",
	question: "Was the route cleared?",
	subtext: "Report the status of the insertion and exfil routes after recon.",
	options: [
		{
			value: "cleared",
			label: "Fully Cleared",
			description:
				"Route is clear of enemy presence, obstacles, and ambush positions. Insertion confirmed.",
			icon: faShieldHalved,
			color: "text-emerald-400",
			border: "border-emerald-400/40 hover:border-emerald-400",
			bg: "hover:bg-emerald-400/10",
			selectedBg: "bg-emerald-400/10 border-emerald-400",
		},
		{
			value: "partial",
			label: "Partially Cleared",
			description:
				"Some sections of the route remain unconfirmed or have light enemy presence.",
			icon: faEye,
			color: "text-amber-400",
			border: "border-amber-400/40 hover:border-amber-400",
			bg: "hover:bg-amber-400/10",
			selectedBg: "bg-amber-400/10 border-amber-400",
		},
		{
			value: "compromised",
			label: "Route Compromised",
			description:
				"Enemy presence confirmed on the route. Vehicle insertion is no longer viable.",
			icon: faSkull,
			color: "text-red-400",
			border: "border-red-400/40 hover:border-red-400",
			bg: "hover:bg-red-400/10",
			selectedBg: "bg-red-400/10 border-red-400",
		},
	],
};

const STEP_OBSERVATION = {
	id: "observation",
	question: "How long was the observation period?",
	subtext:
		"Duration of the SR element's hide site observation directly determines intel confidence.",
	options: [
		{
			value: "short",
			label: "Short (1 Session)",
			description:
				"Quick observation window. Intel confidence is limited — patterns not fully established.",
			icon: faEye,
			color: "text-red-400",
			border: "border-red-400/40 hover:border-red-400",
			bg: "hover:bg-red-400/10",
			selectedBg: "bg-red-400/10 border-red-400",
		},
		{
			value: "extended",
			label: "Extended (2–3 Sessions)",
			description:
				"Sufficient time to establish patrol patterns and confirm HVT movement schedule.",
			icon: faEye,
			color: "text-amber-400",
			border: "border-amber-400/40 hover:border-amber-400",
			bg: "hover:bg-amber-400/10",
			selectedBg: "bg-amber-400/10 border-amber-400",
		},
		{
			value: "long",
			label: "Long-Duration (4+ Sessions)",
			description:
				"Full pattern of life established. HVT routine confirmed. Maximum intel confidence.",
			icon: faEye,
			color: "text-emerald-400",
			border: "border-emerald-400/40 hover:border-emerald-400",
			bg: "hover:bg-emerald-400/10",
			selectedBg: "bg-emerald-400/10 border-emerald-400",
		},
	],
};

const STEP_RIF_INTEL = {
	id: "rifIntel",
	question: "What did the enemy response reveal?",
	subtext:
		"Report what was learned from the enemy's reaction to your armed probe.",
	options: [
		{
			value: "patterns",
			label: "Patrol Patterns Confirmed",
			description:
				"Enemy patrol routes and timing observed during the response.",
			icon: faRoute,
			color: "text-emerald-400",
			border: "border-emerald-400/40 hover:border-emerald-400",
			bg: "hover:bg-emerald-400/10",
			selectedBg: "bg-emerald-400/10 border-emerald-400",
		},
		{
			value: "reinforcements",
			label: "Reinforcement Speed Assessed",
			description:
				"Enemy QRF response time and route confirmed. Assault window calculated.",
			icon: faPersonFalling,
			color: "text-amber-400",
			border: "border-amber-400/40 hover:border-amber-400",
			bg: "hover:bg-amber-400/10",
			selectedBg: "bg-amber-400/10 border-amber-400",
		},
		{
			value: "defensive",
			label: "Defensive Positions Mapped",
			description:
				"Enemy hardpoints, crew-served weapons, and defensive posture confirmed.",
			icon: faBuilding,
			color: "text-cyan-400",
			border: "border-cyan-400/40 hover:border-cyan-400",
			bg: "hover:bg-cyan-400/10",
			selectedBg: "bg-cyan-400/10 border-cyan-400",
		},
		{
			value: "limited",
			label: "Limited Intel Gathered",
			description:
				"Enemy response was minimal or unexpected. Little actionable intel obtained.",
			icon: faSkull,
			color: "text-red-400",
			border: "border-red-400/40 hover:border-red-400",
			bg: "hover:bg-red-400/10",
			selectedBg: "bg-red-400/10 border-red-400",
		},
	],
};

const STEP_OUTCOME = {
	id: "compromise",
	question: "How did the operation end?",
	subtext: "Report the final status of the recon element upon completion.",
	options: [
		{
			value: "cold",
			label: "Clean Exfil",
			description: "Recon completed and team extracted without enemy contact.",
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
			value: "engaged_exfil",
			label: "Engaged During Exfil",
			description: "Team was compromised while extracting from the AO.",
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
const buildAssetStep = (reconType) => ({
	id: "assets",
	question: "What assets did you use during recon?",
	subtext: `Select all assets used. Mismatched assets for ${RECON_TYPE_META[reconType]?.label || "this"} recon type will affect modifiers.`,
	isMultiSelect: true,
	recommendedAssets: RECON_TYPE_META[reconType]?.recommendedAssets,
	badAssets: RECON_TYPE_META[reconType]?.badAssets || [],
	options: Object.values(ASSETS).map((asset) => ({
		value: asset.id,
		label: asset.label,
		description: asset.description,
		icon: faListCheck,
		color: "text-gray-400",
		border: "border-gray-400/30 hover:border-gray-400",
		bg: "hover:bg-gray-400/10",
		selectedBg: "bg-gray-400/10 border-gray-400",
	})),
});

// ── Step sequences per recon type ────────────────────────────────────────────
const CASUALTIES_IMPLIED = ["engaged", "burned"];

const buildSteps = (answers) => {
	const type = answers.reconType;
	const compromise = answers.compromise;

	if (!type) return [STEP_RECON_TYPE];

	const assetStep = buildAssetStep(type);

	switch (type) {
		case "route":
			return [STEP_RECON_TYPE, STEP_ROUTE_STATUS, STEP_OUTCOME, assetStep];

		case "area":
			return [STEP_RECON_TYPE, STEP_SURVEY, STEP_OUTCOME, assetStep];

		case "zone": {
			const skipCasualties =
				compromise && CASUALTIES_IMPLIED.includes(compromise);
			return skipCasualties ?
					[STEP_RECON_TYPE, STEP_SURVEY, STEP_COMPROMISE, assetStep]
				:	[
						STEP_RECON_TYPE,
						STEP_SURVEY,
						STEP_COMPROMISE,
						STEP_CASUALTIES,
						assetStep,
					];
		}

		case "rif":
			return [STEP_RECON_TYPE, STEP_RIF_INTEL, assetStep];

		case "special":
			return [STEP_RECON_TYPE, STEP_OBSERVATION, STEP_COMPROMISE, assetStep];

		default:
			// Standard — survey, compromise, casualties, then assets
			return [
				STEP_RECON_TYPE,
				STEP_SURVEY,
				STEP_COMPROMISE,
				STEP_CASUALTIES,
				assetStep,
			];
	}
};

// ── Multi-select step renderer ───────────────────────────────────────────────
const MultiSelectStep = ({ step, selectedAssets, onToggle }) => (
	<div className='flex flex-col gap-3'>
		{step.recommendedAssets && (
			<div className='px-3 py-2 rounded border border-lines/20 bg-gray-800/30'>
				<span className='text-xs text-gray-500'>
					<span className='text-gray-400 font-semibold'>Recommended: </span>
					{step.recommendedAssets}
				</span>
			</div>
		)}
		{step.options.map((opt) => {
			const isSelected = selectedAssets.includes(opt.value);
			const isMismatch = step.badAssets.includes(opt.value);
			return (
				<button
					key={opt.value}
					onClick={() => onToggle(opt.value)}
					className={`w-full text-left flex items-start gap-4 p-4 rounded border transition-all duration-200 cursor-pointer
                        ${
													isSelected ?
														isMismatch ? "bg-red-400/10 border-red-400"
														:	"bg-emerald-400/10 border-emerald-400"
													:	`border-lines/30 bg-transparent ${opt.bg} ${opt.border}`
												}`}>
					<div
						className={`mt-1 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-all
                        ${
													isSelected ?
														isMismatch ? "border-red-400 bg-red-400"
														:	"border-emerald-400 bg-emerald-400"
													:	"border-gray-600"
												}`}>
						{isSelected && (
							<FontAwesomeIcon
								icon={faCheck}
								className='text-blk text-xs'
							/>
						)}
					</div>
					<div className='flex flex-col gap-0.5 flex-1'>
						<div className='flex items-center gap-2'>
							<span
								className={`text-sm font-semibold ${
									isSelected ?
										isMismatch ? "text-red-400"
										:	"text-emerald-400"
									:	"text-fontz"
								}`}>
								{opt.label}
							</span>
							{isMismatch && (
								<span className='text-xs font-mono text-red-400/70 border border-red-400/30 px-1 rounded'>
									NOT RECOMMENDED
								</span>
							)}
						</div>
						<span className='text-xs text-gray-500 leading-relaxed'>
							{opt.description}
						</span>
					</div>
				</button>
			);
		})}
	</div>
);

MultiSelectStep.propTypes = {
	step: PropTypes.shape({
		recommendedAssets: PropTypes.string,
		badAssets: PropTypes.arrayOf(PropTypes.string).isRequired,
		options: PropTypes.arrayOf(
			PropTypes.shape({
				value: PropTypes.string.isRequired,
				label: PropTypes.string.isRequired,
				description: PropTypes.string.isRequired,
				bg: PropTypes.string.isRequired,
				border: PropTypes.string.isRequired,
			}),
		).isRequired,
	}).isRequired,
	selectedAssets: PropTypes.arrayOf(PropTypes.string).isRequired,
	onToggle: PropTypes.func.isRequired,
};

// ── Main component ───────────────────────────────────────────────────────────
const ReconDebriefAdvanced = ({ mission, onComplete }) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [answers, setAnswers] = useState({});
	const [selected, setSelected] = useState(null);
	const [selectedAssets, setSelectedAssets] = useState([]);
	const [animating, setAnimating] = useState(false);

	const steps = useMemo(() => buildSteps(answers), [answers]);
	const step = steps[currentStep];
	const totalSteps = steps.length;
	const progress = (currentStep / totalSteps) * 100;
	const isLastStep = currentStep === totalSteps - 1;
	const isAssetStep = step?.isMultiSelect;

	const handleSelect = (value) => setSelected(value);

	const handleAssetToggle = (value) => {
		setSelectedAssets((prev) =>
			prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value],
		);
	};

	const handleNext = () => {
		if (!isAssetStep && !selected) return;

		const newAnswers = { ...answers };

		if (isAssetStep) {
			newAnswers.assets = selectedAssets;
		} else {
			newAnswers[step.id] = selected;

			// When any step that writes to "compromise" resolves to an implied casualty level,
			// auto-set casualties so the briefing card always has a defined value
			if (step.id === "compromise" && CASUALTIES_IMPLIED.includes(selected)) {
				newAnswers.casualties = "kia";
			}

			// RIF: auto-set compromise and casualties since neither is asked
			if (step.id === "reconType" && selected === "rif") {
				newAnswers.compromise = "warm";
				newAnswers.casualties = "none";
			}
		}

		// Always guarantee casualties is defined before submitting
		if (!newAnswers.casualties) {
			newAnswers.casualties = "none";
		}

		// Compute the NEXT step sequence from newAnswers, not stale state.
		// Critical when reconType is selected — steps rebuilds immediately on that answer.
		const nextSteps = buildSteps(newAnswers);
		const nextIsLast = currentStep >= nextSteps.length - 1;

		setAnswers(newAnswers);
		setAnimating(true);

		setTimeout(() => {
			if (!nextIsLast) {
				setCurrentStep((s) => s + 1);
				setSelected(null);
			} else {
				onComplete(newAnswers);
			}
			setAnimating(false);
		}, 250);
	};

	const canAdvance = isAssetStep ? selectedAssets.length > 0 : !!selected;

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6'>
			{/* Header */}
			<div className='flex flex-col gap-1'>
				<div className='flex items-center justify-between'>
					<span className='text-xs font-mono text-gray-500 uppercase tracking-widest'>
						Advanced Debrief — {mission?.name || "Operation"}
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
				className={`flex flex-col gap-1 transition-opacity duration-250 ${animating ? "opacity-0" : "opacity-100"}`}>
				<h2 className='text-fontz text-lg font-bold'>{step.question}</h2>
				<p className='text-gray-500 text-xs'>{step.subtext}</p>
			</div>

			{/* Options */}
			<div
				className={`flex flex-col gap-3 transition-opacity duration-250 ${animating ? "opacity-0" : "opacity-100"}`}>
				{isAssetStep ?
					<MultiSelectStep
						step={step}
						selectedAssets={selectedAssets}
						onToggle={handleAssetToggle}
					/>
				:	step.options.map((opt) => {
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
									{/* Asset recommendation hint on type selector */}
									{opt.asset && (
										<span className='text-xs text-gray-600 mt-1 font-mono'>
											Assets: {opt.asset}
										</span>
									)}
								</div>
								{isSelected && (
									<FontAwesomeIcon
										icon={faChevronRight}
										className={`ml-auto mt-0.5 text-xs ${opt.color} shrink-0`}
									/>
								)}
							</button>
						);
					})
				}
			</div>

			{/* Next button */}
			<button
				onClick={handleNext}
				disabled={!canAdvance}
				className={`w-full py-3 rounded text-sm font-bold uppercase tracking-widest transition-all duration-200
                    ${
											canAdvance ?
												"bg-btn text-blk cursor-pointer hover:bg-highlight hover:text-fontz"
											:	"bg-gray-800 text-gray-600 cursor-not-allowed"
										}`}>
				{isLastStep ? "Submit Debrief" : "Confirm & Continue"}
			</button>
		</div>
	);
};

ReconDebriefAdvanced.propTypes = {
	mission: PropTypes.shape({
		_id: PropTypes.string,
		name: PropTypes.string,
	}),
	onComplete: PropTypes.func.isRequired,
};

export default ReconDebriefAdvanced;
