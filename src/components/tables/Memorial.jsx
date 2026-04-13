import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoltLightning } from "@fortawesome/free-solid-svg-icons";
import { PropTypes } from "prop-types";
import { useMemorialStore } from "@/zustand";

const Memorial = () => {
	const { KIAOperators, fetchKIAOperators, reviveOperator } = useMemorialStore();

	useEffect(() => {
		fetchKIAOperators();
	}, [KIAOperators.length]);

	if (KIAOperators.length === 0) {
		return (
			<div className='flex items-center justify-center py-6'>
				<span className='font-mono text-[9px] tracking-widest text-lines/20 uppercase'>No Casualties</span>
			</div>
		);
	}

	return (
		<div className='p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2'>
			{KIAOperators.map((entry, index) => (
				<div
					key={entry._id || index}
					className='group flex flex-col items-center gap-1.5 p-2.5 rounded border border-red-900/25 bg-blk/40 hover:bg-red-900/10 hover:border-red-900/50 transition-all duration-150'>

					{/* Avatar */}
					<div className='relative shrink-0'>
						<div className='w-10 h-10 rounded-full border border-red-900/40 overflow-hidden bg-highlight'>
							<img
								className='w-full h-full object-cover object-top grayscale opacity-60 group-hover:opacity-80 transition-all'
								src={entry.operator?.imageKey || entry.operator?.image || "/ghost/Default.png"}
								alt={entry.operator?.callSign || "Operator"}
								onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
							/>
						</div>
						<span className='absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-blk bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.65)]' />
					</div>

					{/* Callsign */}
					<span className='font-mono text-[9px] text-fontz/60 group-hover:text-fontz truncate max-w-full text-center leading-none transition-colors'>
						{entry.operator?.callSign || "Unknown"}
					</span>

					{/* Status */}
					<span className='font-mono text-[8px] tracking-widest uppercase text-red-500/70 leading-none'>
						KIA
					</span>

					{/* Date */}
					<span className='font-mono text-[7px] text-lines/30 text-center leading-none'>
						{new Date(entry.dateOfDeath).toISOString().split("T")[0]}
					</span>

					{/* Cause of death */}
					{entry.name && (
						<span className='font-mono text-[7px] text-red-500/30 truncate max-w-full text-center leading-none'>
							{entry.name}
						</span>
					)}

					{/* Revive */}
					<button
						onClick={() => reviveOperator(entry._id)}
						className='w-full flex items-center justify-center gap-1 font-mono text-[7px] tracking-widest uppercase px-1.5 py-1 rounded border border-amber-800/30 bg-amber-500/10 hover:bg-amber-400 text-amber-500 hover:text-blk hover:border-amber-400 transition-all mt-auto'>
						<FontAwesomeIcon icon={faBoltLightning} className='text-[7px]' />
						Revive
					</button>
				</div>
			))}
		</div>
	);
};

Memorial.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
};

export default Memorial;
