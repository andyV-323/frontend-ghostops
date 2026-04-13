import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSyringe } from "@fortawesome/free-solid-svg-icons";
import { PropTypes } from "prop-types";
import { useInfirmaryStore } from "@/zustand";

function RecoveryBar({ progress }) {
	const color =
		progress >= 75 ? "bg-green-500"
		: progress >= 40 ? "bg-amber-400"
		: "bg-red-500/70";
	return (
		<div className='w-full h-0.5 bg-blk/60 rounded-full overflow-hidden border border-lines/10'>
			<div
				className={["h-full rounded-full transition-all duration-500", color].join(" ")}
				style={{ width: `${progress}%` }}
			/>
		</div>
	);
}

RecoveryBar.propTypes = { progress: PropTypes.number };

const Infirmary = () => {
	const { injuredOperators, fetchInjuredOperators, recoverOperator } = useInfirmaryStore();

	useEffect(() => {
		fetchInjuredOperators();
	}, [injuredOperators.length]);

	if (injuredOperators.length === 0) {
		return (
			<div className='flex items-center justify-center py-6'>
				<span className='font-mono text-[9px] tracking-widest text-lines/20 uppercase'>No Wounded</span>
			</div>
		);
	}

	return (
		<div className='p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2'>
			{injuredOperators.map((entry, index) => {
				const recoverySeconds = entry.recoveryHours * 3600;
				const elapsed = Math.floor((Date.now() - new Date(entry.injuredAt)) / 1000);
				const progress = Math.min(100, Math.floor((elapsed / recoverySeconds) * 100));
				const hoursLeft = Math.max(0, (recoverySeconds - elapsed) / 3600).toFixed(1);

				return (
					<div
						key={entry.operator?._id || entry.injuredAt || index}
						className='group flex flex-col items-center gap-1.5 p-2.5 rounded border border-amber-900/25 bg-blk/40 hover:bg-amber-900/10 hover:border-amber-900/50 transition-all duration-150'>

						{/* Avatar */}
						<div className='relative shrink-0'>
							<div className='w-10 h-10 rounded-full border border-amber-900/40 overflow-hidden bg-highlight'>
								<img
									className='w-full h-full object-cover object-top'
									src={entry.operator?.imageKey || entry.operator?.image || "/ghost/Default.png"}
									alt={entry.operator?.callSign || "Operator"}
									onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
								/>
							</div>
							<span className='absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-blk bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.7)]' />
						</div>

						{/* Callsign */}
						<span className='font-mono text-[9px] text-fontz group-hover:text-white truncate max-w-full text-center leading-none transition-colors'>
							{entry.operator?.callSign || "Unknown"}
						</span>

						{/* Status */}
						<span className='font-mono text-[8px] tracking-widest uppercase text-amber-400 leading-none'>
							WIA
						</span>

						{/* Injury type */}
						<span className='font-mono text-[7px] text-lines/35 truncate max-w-full text-center leading-none'>
							{entry.injuryType || "Injury on file"}
						</span>

						{/* Recovery bar + time */}
						<div className='w-full flex flex-col gap-1'>
							<RecoveryBar progress={progress} />
							<span className='font-mono text-[7px] text-lines/30 text-center tabular-nums'>
								{progress < 100 ? `${hoursLeft}h left` : "Ready"}
							</span>
						</div>

						{/* Discharge */}
						<button
							onClick={() => recoverOperator(entry._id)}
							className='w-full flex items-center justify-center gap-1 font-mono text-[7px] tracking-widest uppercase px-1.5 py-1 rounded border border-btn/25 bg-btn/10 hover:bg-btn text-btn hover:text-blk hover:border-btn transition-all'>
							<FontAwesomeIcon icon={faSyringe} className='text-[7px]' />
							Discharge
						</button>
					</div>
				);
			})}
		</div>
	);
};

Infirmary.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
};

export default Infirmary;
