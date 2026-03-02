// components/mission/ReconReportPicker.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faXmark } from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";
import { COMPROMISE_META } from "@/utils/ReconModifiers";

// ── Small status pill ─────────────────────────────────────────────────────────
function Pill({ label, value, color }) {
	return (
		<div className='flex flex-col gap-0.5'>
			<span className='font-mono text-[7px] text-lines/25 uppercase tracking-widest'>
				{label}
			</span>
			<span className={`font-mono text-[9px] font-bold ${color}`}>{value}</span>
		</div>
	);
}

export default function ReconReportPicker({
	reports = [],
	selectedId,
	onSelect,
}) {
	const hasReports = reports.length > 0;

	return (
		<div className='flex flex-col gap-2'>
			<div className='flex items-center gap-2'>
				<div className='w-2 h-px bg-lines/25' />
				<span className='font-mono text-[8px] tracking-[0.28em] text-lines/30 uppercase'>
					Recon Intel — Apply to Package
				</span>
				<div className='flex-1 h-px bg-lines/10' />
			</div>

			{!hasReports && (
				<div className='flex items-center gap-3 px-3 py-2.5 border border-lines/10 rounded-sm bg-blk/30'>
					<FontAwesomeIcon
						icon={faShieldHalved}
						className='text-lines/20 text-[10px] shrink-0'
					/>
					<div className='flex flex-col gap-0.5'>
						<span className='font-mono text-[9px] text-lines/30 uppercase tracking-widest'>
							No Recon Reports
						</span>
						<span className='font-mono text-[8px] text-lines/20'>
							Package will run on cold assumptions. Complete a debrief via ISR
							to unlock recon-informed planning.
						</span>
					</div>
				</div>
			)}

			{hasReports && (
				<div className='flex flex-col gap-1.5'>
					{/* Run cold option */}
					<button
						onClick={() => onSelect(null)}
						className={[
							"flex items-center gap-2.5 px-3 py-2 border rounded-sm text-left transition-all",
							selectedId === null ?
								"border-lines/30 bg-lines/5"
							:	"border-lines/10 bg-transparent hover:border-lines/20",
						].join(" ")}>
						<span
							className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedId === null ? "bg-lines/50" : "bg-lines/15"}`}
						/>
						<div className='flex flex-col gap-0.5 flex-1'>
							<span
								className={`font-mono text-[9px] uppercase tracking-widest ${selectedId === null ? "text-lines/70" : "text-lines/30"}`}>
								Run Cold — No Recon
							</span>
							<span className='font-mono text-[8px] text-lines/20'>
								Cold assumptions, all assets available
							</span>
						</div>
						{selectedId === null && (
							<span className='font-mono text-[7px] tracking-widest text-lines/40 border border-lines/20 px-1.5 py-0.5 rounded-sm'>
								ACTIVE
							</span>
						)}
					</button>

					{/* Report cards — newest first */}
					{[...reports].reverse().map((report, i) => {
						const m = report.modifiers || {};
						const meta =
							COMPROMISE_META?.[m.compromiseBadge] ?? COMPROMISE_META?.["cold"];
						const isSelected = selectedId === (report._id || i);
						const date =
							report.completedAt ?
								new Date(report.completedAt).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								})
							:	"—";

						const intelColor =
							m.intelAccuracy >= 80 ? "text-emerald-400"
							: m.intelAccuracy >= 40 ? "text-amber-400"
							: "text-red-400";

						return (
							<button
								key={report._id || i}
								onClick={() => onSelect(report._id || i)}
								className={[
									"flex items-center gap-3 px-3 py-2.5 border rounded-sm text-left transition-all",
									isSelected ?
										`${meta.border} ${meta.bg}`
									:	"border-lines/10 bg-transparent hover:border-lines/20",
								].join(" ")}>
								{/* Compromise dot */}
								<span
									className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? meta.dot : "bg-lines/15"}`}
								/>

								{/* Label block */}
								<div className='flex flex-col gap-0.5 flex-1 min-w-0'>
									<span
										className={`font-mono text-[9px] uppercase tracking-widest truncate ${isSelected ? meta.color : "text-fontz/50"}`}>
										Report {reports.length - i}
										{m.reconType && m.reconType !== "standard" ?
											` — ${m.reconTypeLabel || m.reconType.toUpperCase()}`
										:	""}
									</span>
									<span className='font-mono text-[7px] text-lines/25'>
										{date}
									</span>
								</div>

								{/* Stats */}
								<div className='flex items-center gap-3 shrink-0'>
									<Pill
										label='Intel'
										value={`${m.intelAccuracy ?? "—"}%`}
										color={intelColor}
									/>
									<Pill
										label='Status'
										value={meta.label}
										color={meta.color}
									/>
								</div>

								{isSelected && (
									<span
										className={`font-mono text-[7px] tracking-widest border px-1.5 py-0.5 rounded-sm shrink-0 ${meta.color} ${meta.border}`}>
										APPLIED
									</span>
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

ReconReportPicker.propTypes = {
	reports: PropTypes.array,
	selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	onSelect: PropTypes.func.isRequired,
};
