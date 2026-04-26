import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoltLightning, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { PropTypes } from "prop-types";
import { useMemorialStore } from "@/zustand";

// ─── KIA detail sheet ─────────────────────────────────────────
function KIADetail({ entry, onRevive }) {
	return (
		<div className='flex flex-col gap-5 p-5'>
			{/* Operator header */}
			<div className='flex items-center gap-4'>
				<div className='relative shrink-0'>
					<div className='w-16 h-16 rounded-full border border-red-900/50 overflow-hidden bg-highlight'>
						<img
							className='w-full h-full object-cover object-top grayscale opacity-60'
							src={entry.operator?.imageKey || entry.operator?.image || "/ghost/Default.png"}
							alt={entry.operator?.callSign || "Operator"}
							onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
						/>
					</div>
					<span className='absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-blk bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.65)]' />
				</div>
				<div className='flex flex-col gap-1'>
					<span className='font-mono text-[13px] tracking-wide text-fontz/70'>
						{entry.operator?.callSign || "Unknown"}
					</span>
					<span className='font-mono text-[9px] tracking-widest uppercase text-red-500/80'>
						KIA — Killed In Action
					</span>
					<span className='font-mono text-[9px] text-lines/40'>
						{entry.operator?.class || ""}
					</span>
				</div>
			</div>

			{/* KIA details */}
			<div className='flex flex-col gap-3 border border-lines/10 rounded p-3 bg-blk/30'>
				<Row label='Date' value={new Date(entry.dateOfDeath).toLocaleDateString()} />
				{entry.name && <Row label='Cause' value={entry.name} />}
				{entry.operator?.role && <Row label='Role' value={entry.operator.role} />}
			</div>

			{/* Revive */}
			<button
				onClick={onRevive}
				className='w-full flex items-center justify-center gap-2 font-mono text-[9px] tracking-widest uppercase px-3 py-2.5 rounded border border-amber-800/30 bg-amber-500/10 hover:bg-amber-400 text-amber-500 hover:text-blk hover:border-amber-400 transition-all'>
				<FontAwesomeIcon icon={faBoltLightning} className='text-[9px]' />
				Revive Operator
			</button>
		</div>
	);
}
KIADetail.propTypes = {
	entry: PropTypes.object.isRequired,
	onRevive: PropTypes.func.isRequired,
};

function Row({ label, value }) {
	return (
		<div className='flex items-center justify-between'>
			<span className='font-mono text-[9px] tracking-widest uppercase text-lines/30'>{label}</span>
			<span className='font-mono text-[10px] text-fontz/70'>{value}</span>
		</div>
	);
}
Row.propTypes = { label: PropTypes.string, value: PropTypes.string };

// ─── Main component ───────────────────────────────────────────
const Memorial = ({ openSheet }) => {
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
		<div className='flex flex-col divide-y divide-lines/8'>
			{KIAOperators.map((entry, index) => {
				const handleOpen = () => {
					if (!openSheet) return;
					openSheet(
						"left",
						<KIADetail
							entry={entry}
							onRevive={() => reviveOperator(entry._id)}
						/>,
						entry.operator?.callSign || "Operator",
						"Fallen Ghost",
					);
				};

				return (
					<div
						key={entry._id || index}
						onClick={handleOpen}
						className={[
							"flex items-center gap-2.5 px-3 py-2 transition-colors",
							openSheet ? "cursor-pointer hover:bg-red-900/10" : "",
						].join(" ")}>
						{/* Avatar */}
						<div className='relative shrink-0'>
							<div className='w-8 h-8 rounded-full border border-red-900/40 overflow-hidden bg-highlight'>
								<img
									className='w-full h-full object-cover object-top grayscale opacity-60'
									src={entry.operator?.imageKey || entry.operator?.image || "/ghost/Default.png"}
									alt={entry.operator?.callSign || "Operator"}
									onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
								/>
							</div>
							<span className='absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-blk bg-red-500' />
						</div>

						{/* Info */}
						<div className='flex-1 min-w-0 flex flex-col gap-0.5'>
							<div className='flex items-center justify-between gap-2'>
								<span className='font-mono text-[10px] text-fontz/60 truncate'>
									{entry.operator?.callSign || "Unknown"}
								</span>
								<span className='font-mono text-[8px] tracking-widest uppercase text-red-500/70 shrink-0'>
									KIA
								</span>
							</div>
							<span className='font-mono text-[8px] text-lines/25 truncate'>
								{entry.name || new Date(entry.dateOfDeath).toLocaleDateString()}
							</span>
						</div>

						{openSheet && (
							<FontAwesomeIcon icon={faChevronRight} className='text-[8px] text-lines/20 shrink-0' />
						)}
					</div>
				);
			})}
		</div>
	);
};

Memorial.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default Memorial;
