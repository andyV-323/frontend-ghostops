import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSyringe, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { PropTypes } from "prop-types";
import { useInfirmaryStore } from "@/zustand";

// ─── Recovery bar ─────────────────────────────────────────────
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

// ─── Injury detail sheet ──────────────────────────────────────
function InjuryDetail({ entry, onDischarge }) {
	const recoverySeconds = entry.recoveryHours * 3600;
	const elapsed = Math.floor((Date.now() - new Date(entry.injuredAt)) / 1000);
	const progress = Math.min(100, Math.floor((elapsed / recoverySeconds) * 100));
	const hoursLeft = Math.max(0, (recoverySeconds - elapsed) / 3600).toFixed(1);

	return (
		<div className='flex flex-col gap-5 p-5'>
			{/* Operator header */}
			<div className='flex items-center gap-4'>
				<div className='relative shrink-0'>
					<div className='w-16 h-16 rounded-full border border-amber-900/50 overflow-hidden bg-highlight'>
						<img
							className='w-full h-full object-cover object-top'
							src={entry.operator?.imageKey || entry.operator?.image || "/ghost/Default.png"}
							alt={entry.operator?.callSign || "Operator"}
							onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
						/>
					</div>
					<span className='absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-blk bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]' />
				</div>
				<div className='flex flex-col gap-1'>
					<span className='font-mono text-[13px] tracking-wide text-fontz'>
						{entry.operator?.callSign || "Unknown"}
					</span>
					<span className='font-mono text-[9px] tracking-widest uppercase text-amber-400'>
						WIA — Wounded In Action
					</span>
					<span className='font-mono text-[9px] text-lines/40'>
						{entry.operator?.class || ""}
					</span>
				</div>
			</div>

			{/* Injury details */}
			<div className='flex flex-col gap-3 border border-lines/10 rounded p-3 bg-blk/30'>
				<Row label='Injury' value={entry.injuryType || "Injury on file"} />
				<Row label='Injured' value={new Date(entry.injuredAt).toLocaleDateString()} />
				<Row label='Recovery' value={`${entry.recoveryHours}h total`} />
			</div>

			{/* Recovery progress */}
			<div className='flex flex-col gap-2'>
				<div className='flex items-center justify-between'>
					<span className='font-mono text-[9px] tracking-widest uppercase text-lines/35'>
						Recovery Progress
					</span>
					<span className='font-mono text-[9px] tabular-nums text-lines/40'>
						{progress < 100 ? `${hoursLeft}h remaining` : "Ready for discharge"}
					</span>
				</div>
				<div className='w-full h-1.5 bg-blk/60 rounded-full overflow-hidden border border-lines/10'>
					<div
						className={[
							"h-full rounded-full transition-all duration-500",
							progress >= 75 ? "bg-green-500"
							: progress >= 40 ? "bg-amber-400"
							: "bg-red-500/70",
						].join(" ")}
						style={{ width: `${progress}%` }}
					/>
				</div>
				<span className='font-mono text-[9px] text-lines/30 text-right'>{progress}%</span>
			</div>

			{/* Discharge */}
			<button
				onClick={onDischarge}
				className='w-full flex items-center justify-center gap-2 font-mono text-[9px] tracking-widest uppercase px-3 py-2.5 rounded border border-btn/30 bg-btn/10 hover:bg-btn text-btn hover:text-blk hover:border-btn transition-all'>
				<FontAwesomeIcon icon={faSyringe} className='text-[9px]' />
				Discharge Operator
			</button>
		</div>
	);
}
InjuryDetail.propTypes = {
	entry: PropTypes.object.isRequired,
	onDischarge: PropTypes.func.isRequired,
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
const Infirmary = ({ openSheet }) => {
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
		<div className='flex flex-col divide-y divide-lines/8'>
			{injuredOperators.map((entry, index) => {
				const recoverySeconds = entry.recoveryHours * 3600;
				const elapsed = Math.floor((Date.now() - new Date(entry.injuredAt)) / 1000);
				const progress = Math.min(100, Math.floor((elapsed / recoverySeconds) * 100));
				const hoursLeft = Math.max(0, (recoverySeconds - elapsed) / 3600).toFixed(1);

				const handleOpen = () => {
					if (!openSheet) return;
					openSheet(
						"left",
						<InjuryDetail
							entry={entry}
							onDischarge={() => recoverOperator(entry._id)}
						/>,
						entry.operator?.callSign || "Operator",
						"Injury report",
					);
				};

				return (
					<div
						key={entry.operator?._id || entry.injuredAt || index}
						onClick={handleOpen}
						className={[
							"flex items-center gap-2.5 px-3 py-2 transition-colors",
							openSheet ? "cursor-pointer hover:bg-amber-900/10" : "",
						].join(" ")}>
						{/* Avatar */}
						<div className='relative shrink-0'>
							<div className='w-8 h-8 rounded-full border border-amber-900/40 overflow-hidden bg-highlight'>
								<img
									className='w-full h-full object-cover object-top'
									src={entry.operator?.imageKey || entry.operator?.image || "/ghost/Default.png"}
									alt={entry.operator?.callSign || "Operator"}
									onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
								/>
							</div>
							<span className='absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-blk bg-amber-400' />
						</div>

						{/* Info */}
						<div className='flex-1 min-w-0 flex flex-col gap-1'>
							<div className='flex items-center justify-between gap-2'>
								<span className='font-mono text-[10px] text-fontz truncate'>
									{entry.operator?.callSign || "Unknown"}
								</span>
								<span className='font-mono text-[8px] tracking-widest uppercase text-amber-400 shrink-0'>
									WIA
								</span>
							</div>
							<div className='flex items-center gap-2'>
								<RecoveryBar progress={progress} />
								<span className='font-mono text-[7px] text-lines/30 tabular-nums shrink-0'>
									{progress < 100 ? `${hoursLeft}h` : "Ready"}
								</span>
							</div>
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

Infirmary.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default Infirmary;
