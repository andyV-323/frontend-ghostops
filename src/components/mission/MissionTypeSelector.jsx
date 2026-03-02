// components/mission/MissionTypeSelector.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCrosshairs,
	faSkull,
	faBomb,
	faHandcuffs,
	faTruck,
	faEye,
} from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";

export const MISSION_TYPES = [
	{
		id: "Direct Action",
		label: "Direct Action",
		abbr: "DA",
		description: "Hard assault. Speed and violence of action.",
		icon: faCrosshairs,
		color: "text-red-400",
		border: "border-red-400/30",
		activeBorder: "border-red-400/70",
		activeBg: "bg-red-400/8",
		dot: "bg-red-400",
	},
	{
		id: "HVT Elimination",
		label: "HVT Elimination",
		abbr: "HVT",
		description: "Surgical strike. Confirm ID, neutralize, exfil.",
		icon: faSkull,
		color: "text-orange-400",
		border: "border-orange-400/30",
		activeBorder: "border-orange-400/70",
		activeBg: "bg-orange-400/8",
		dot: "bg-orange-400",
	},
	{
		id: "Sabotage / Demolition",
		label: "Sabotage",
		abbr: "SAB",
		description: "Infrastructure denial. Place charges, exfil clean.",
		icon: faBomb,
		color: "text-amber-400",
		border: "border-amber-400/30",
		activeBorder: "border-amber-400/70",
		activeBg: "bg-amber-400/8",
		dot: "bg-amber-400",
	},
	{
		id: "Hostage Rescue",
		label: "Hostage Rescue",
		abbr: "HR",
		description: "Time critical. Non-combatant present. Speed is life.",
		icon: faHandcuffs,
		color: "text-cyan-400",
		border: "border-cyan-400/30",
		activeBorder: "border-cyan-400/70",
		activeBg: "bg-cyan-400/8",
		dot: "bg-cyan-400",
	},
	{
		id: "Convoy Interdiction",
		label: "Convoy Interdiction",
		abbr: "CI",
		description: "Mobile target. Prepare kill zone. Controlled ambush.",
		icon: faTruck,
		color: "text-indigo-400",
		border: "border-indigo-400/30",
		activeBorder: "border-indigo-400/70",
		activeBg: "bg-indigo-400/8",
		dot: "bg-indigo-400",
	},
	{
		id: "Defensive / Overwatch",
		label: "Overwatch",
		abbr: "OW",
		description: "Establish position. Observe. Engage on order.",
		icon: faEye,
		color: "text-emerald-400",
		border: "border-emerald-400/30",
		activeBorder: "border-emerald-400/70",
		activeBg: "bg-emerald-400/8",
		dot: "bg-emerald-400",
	},
];

export default function MissionTypeSelector({ value, onChange }) {
	return (
		<div className='flex flex-col gap-2'>
			<div className='flex items-center gap-2 mb-1'>
				<div className='w-2 h-px bg-lines/25' />
				<span className='font-mono text-[8px] tracking-[0.28em] text-lines/30 uppercase'>
					Mission Type — Phase 2
				</span>
				<div className='flex-1 h-px bg-lines/10' />
			</div>

			<div className='grid grid-cols-2 sm:grid-cols-3 gap-1.5'>
				{MISSION_TYPES.map((type) => {
					const active = value === type.id;
					return (
						<button
							key={type.id}
							onClick={() => onChange(type.id)}
							className={[
								"flex flex-col gap-1.5 p-2.5 rounded-sm border text-left transition-all duration-150",
								active ?
									`${type.activeBorder} ${type.activeBg}`
								:	`${type.border} bg-transparent hover:${type.activeBg} hover:${type.activeBorder}`,
							].join(" ")}>
							<div className='flex items-center gap-2'>
								<span
									className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? type.dot : "bg-lines/20"}`}
								/>
								<span
									className={`font-mono text-[8px] tracking-widest uppercase ${active ? type.color : "text-lines/35"}`}>
									{type.abbr}
								</span>
								<FontAwesomeIcon
									icon={type.icon}
									className={`ml-auto text-[9px] ${active ? type.color : "text-lines/20"}`}
								/>
							</div>
							<span
								className={`font-mono text-[10px] font-bold leading-tight ${active ? type.color : "text-fontz/60"}`}>
								{type.label}
							</span>
							<span className='font-mono text-[8px] text-lines/25 leading-relaxed'>
								{type.description}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

MissionTypeSelector.propTypes = {
	value: PropTypes.string,
	onChange: PropTypes.func.isRequired,
};
