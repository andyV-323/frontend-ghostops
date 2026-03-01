// components/mission/MissionListSheet.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";

const STATUS_META = {
	planning: {
		label: "PLANNING",
		color: "text-lines/50",
		dot: "bg-lines/30",
	},
	active: {
		label: "ACTIVE",
		color: "text-green-400",
		dot: "bg-green-500 shadow-[0_0_5px_rgba(74,222,128,0.6)]",
	},
	complete: {
		label: "COMPLETE",
		color: "text-btn",
		dot: "bg-btn",
	},
};

const STATUS_ORDER = { active: 0, planning: 1, complete: 2 };

export default function MissionListSheet({
	missions = [],
	activeMissionId,
	onLoad,
	onDelete,
	onNew,
}) {
	const sorted = [...missions].sort(
		(a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3),
	);

	return (
		<div className='flex flex-col gap-3 p-4 h-full'>
			{/* New mission CTA */}
			<button
				onClick={onNew}
				className='w-full flex items-center justify-center gap-2 py-2.5 border border-btn/30 hover:border-btn/60 bg-btn/5 hover:bg-btn/15 text-btn font-mono text-[10px] tracking-widest uppercase rounded-sm transition-all'>
				<FontAwesomeIcon
					icon={faPlus}
					className='text-[9px]'
				/>
				New Operation
			</button>

			{/* Divider */}
			<div className='flex items-center gap-3'>
				<div className='h-px flex-1 bg-lines/10' />
				<span className='font-mono text-[8px] tracking-[0.25em] text-lines/25 uppercase'>
					Mission Log
				</span>
				<div className='h-px flex-1 bg-lines/10' />
			</div>

			{/* Empty state */}
			{sorted.length === 0 && (
				<div className='flex flex-col items-center justify-center flex-1 gap-3'>
					<div className='grid grid-cols-3 gap-1 opacity-15'>
						{[...Array(9)].map((_, i) => (
							<div
								key={i}
								className='w-2 h-2 border border-lines/50'
							/>
						))}
					</div>
					<p className='font-mono text-[9px] tracking-[0.25em] text-lines/20 uppercase'>
						No Operations on File
					</p>
				</div>
			)}

			{/* Mission cards */}
			<div className='flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto'>
				{sorted.map((m) => {
					const meta = STATUS_META[m.status] || STATUS_META.planning;
					const isActive = m._id === activeMissionId;
					const reconCount = m.reconReports?.length ?? 0;

					return (
						<div
							key={m._id}
							className={[
								"flex flex-col border rounded-sm overflow-hidden transition-all",
								isActive ?
									"border-btn/35 bg-btn/6"
								:	"border-lines/15 bg-blk/30 hover:border-lines/30",
							].join(" ")}>
							{/* Province image strip — only if imgURL exists on generator */}
							{m.generator?.imgURL && (
								<div className='h-10 relative overflow-hidden shrink-0'>
									<img
										src={m.generator.imgURL}
										alt={m.province}
										className='w-full h-full object-cover'
										style={{ filter: "brightness(0.4) saturate(0.35)" }}
									/>
									<div className='absolute inset-0 bg-gradient-to-r from-blk/80 to-transparent' />
									<span className='absolute left-2.5 bottom-1.5 font-mono text-[8px] tracking-widest text-lines/40 uppercase'>
										{m.province || "Unknown AO"}
									</span>
								</div>
							)}

							{/* Card body */}
							<div className='flex items-center gap-2.5 px-3 py-2.5'>
								{/* Status dot */}
								<span
									className={[
										"w-1.5 h-1.5 rounded-full shrink-0",
										meta.dot,
									].join(" ")}
								/>

								{/* Name + meta */}
								<div className='flex flex-col min-w-0 flex-1'>
									<span className='font-mono text-[11px] tracking-widest text-fontz/80 truncate'>
										{m.name}
									</span>
									<div className='flex items-center gap-2 mt-0.5'>
										<span
											className={[
												"font-mono text-[8px] tracking-widest uppercase",
												meta.color,
											].join(" ")}>
											{meta.label}
										</span>
										{reconCount > 0 && (
											<span className='font-mono text-[8px] text-lines/30'>
												• {reconCount} RECON
											</span>
										)}
										{m.briefingText && (
											<span className='font-mono text-[8px] text-lines/30'>
												• BRIEF
											</span>
										)}
									</div>
								</div>

								{/* Actions */}
								<div className='flex items-center gap-1 shrink-0'>
									<button
										onClick={() => onLoad(m)}
										className={[
											"font-mono text-[8px] tracking-widest uppercase px-2 py-1 border rounded-sm transition-all",
											isActive ?
												"text-btn border-btn/30 bg-btn/10"
											:	"text-lines/40 border-lines/20 hover:text-btn hover:border-btn/30 hover:bg-btn/8",
										].join(" ")}>
										{isActive ? "LOADED" : "LOAD"}
									</button>
									{!isActive && (
										<button
											onClick={() => onDelete(m._id)}
											className='p-1.5 text-lines/20 hover:text-red-400 transition-colors rounded-sm hover:bg-red-900/10'>
											<FontAwesomeIcon
												icon={faTrash}
												className='text-[9px]'
											/>
										</button>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
MissionListSheet.propTypes = {
	missions: PropTypes.array,
	activeMissionId: PropTypes.string,
	onLoad: PropTypes.func,
	onDelete: PropTypes.func,
	onNew: PropTypes.func,
};
