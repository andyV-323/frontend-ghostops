// components/mission/ReconHistoryPanel.jsx
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faTrash,
	faChevronDown,
	faChevronRight,
	faCheck,
	faXmark,
	faSkull,
	faUserSlash,
	faShieldHalved,
	faTriangleExclamation,
	faSatellite,
	faMicrochip,
	faHelicopter,
	faPeopleGroup,
	faCrosshairs,
	faBullseye,
	faVolumeXmark,
} from "@fortawesome/free-solid-svg-icons";
import useMissionsStore from "@/zustand/useMissionsStore";
import { COMPROMISE_META } from "@/utils/ReconModifiers";

// ── Mirrors ConditionRow from ReconBriefingCard — no animation ─
function ConditionRow({ icon, label, available }) {
	const statusColor = available ? "text-emerald-400" : "text-red-400";
	const statusText = available ? "ACTIVE" : "UNAVAILABLE";
	const statusIcon = available ? faCheck : faXmark;
	return (
		<div className='flex items-center justify-between py-2 border-b border-lines/15 last:border-0'>
			<div className='flex items-center gap-2.5'>
				<FontAwesomeIcon
					icon={icon}
					className='text-[11px] w-3.5 text-lines/30'
				/>
				<span
					className={`font-mono text-[10px] ${available ? "text-fontz/55" : "text-fontz/30 line-through"}`}>
					{label}
				</span>
			</div>
			<div
				className={`flex items-center gap-1 font-mono text-[8px] font-bold ${statusColor}`}>
				<FontAwesomeIcon
					icon={statusIcon}
					className='text-[8px]'
				/>
				{statusText}
			</div>
		</div>
	);
}

function ReportCard({ report, missionId, reportNumber }) {
	const [expanded, setExpanded] = useState(false);
	const { deleteReconReport } = useMissionsStore();

	const m = report.modifiers || {};
	const meta = COMPROMISE_META?.[m.compromiseBadge] ??
		COMPROMISE_META?.["cold"] ?? {
			label: "UNKNOWN",
			color: "text-lines/50",
			dot: "bg-lines/30",
			border: "border-lines/20",
			bg: "bg-transparent",
		};

	const date =
		report.completedAt ?
			new Date(report.completedAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		:	"—";

	const intelColor =
		m.intelAccuracy >= 80 ? "text-emerald-400"
		: m.intelAccuracy >= 40 ? "text-amber-400"
		: "text-red-400";

	const diffColor =
		m.difficulty === "Regular" ? "text-emerald-400"
		: m.difficulty === "Advanced" ? "text-amber-400"
		: "text-red-400";

	return (
		<div className={`border rounded-sm overflow-hidden ${meta.border}`}>
			{/* ── Header ── */}
			<button
				onClick={() => setExpanded((p) => !p)}
				className='w-full flex items-center gap-3 px-3 py-2.5 bg-blk/40 hover:bg-blk/60 transition-colors text-left'>
				<span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
				<div className='flex flex-col min-w-0 flex-1'>
					<span className='font-mono text-[10px] tracking-widest text-fontz/70 uppercase'>
						Report #{reportNumber}
						{m.reconType && m.reconType !== "standard" ?
							` — ${m.reconTypeLabel || m.reconType.toUpperCase()}`
						:	""}
					</span>
					<span className='font-mono text-[8px] text-lines/25'>{date}</span>
				</div>
				{m.intelAccuracy != null && (
					<span
						className={`font-mono text-[12px] font-bold shrink-0 ${intelColor}`}>
						{m.intelAccuracy}%
					</span>
				)}
				<FontAwesomeIcon
					icon={expanded ? faChevronDown : faChevronRight}
					className='text-lines/25 text-[9px] shrink-0'
				/>
			</button>

			{/* ── Expanded — exact same sections as ReconBriefingCard ── */}
			{expanded && (
				<div className='border-t border-lines/15'>
					{/* Classification bar */}
					<div className={`px-3 py-1.5 ${meta.bg} border-b ${meta.border}`}>
						<span
							className={`font-mono text-[9px] font-bold tracking-widest ${meta.color}`}>
							TOP SECRET // NOFORN // GHOST PROTOCOL
						</span>
					</div>

					{/* Recon type */}
					{m.reconType && m.reconType !== "standard" && (
						<div className='px-3 py-2 bg-blk/40 border-b border-lines/15 flex items-center gap-2'>
							<span className='font-mono text-[8px] text-lines/30 uppercase tracking-widest'>
								Recon Type:
							</span>
							<span className='font-mono text-[9px] font-bold text-fontz/70 uppercase tracking-widest'>
								{m.reconTypeLabel}
							</span>
						</div>
					)}

					{/* Intel + Difficulty */}
					<div className='grid grid-cols-2 border-b border-lines/15'>
						<div className='px-3 py-3 border-r border-lines/15'>
							<span className='font-mono text-[8px] text-lines/30 uppercase tracking-widest block mb-1'>
								{m.intelLabel || "Intel Accuracy"}
							</span>
							<span className={`font-mono text-xl font-bold ${intelColor}`}>
								{m.intelAccuracy}%
							</span>
							<span className='font-mono text-[8px] text-lines/20 block mt-0.5'>
								{m.intelAccuracy === 100 ?
									"All intel confirmed"
								: m.intelAccuracy >= 60 ?
									"Partial — verify on insertion"
								: m.intelAccuracy > 0 ?
									"Degraded — treat as unverified"
								:	"No intel available"}
							</span>
						</div>
						<div className='px-3 py-3'>
							<span className='font-mono text-[8px] text-lines/30 uppercase tracking-widest block mb-1'>
								Difficulty
							</span>
							<span className={`font-mono text-xl font-bold ${diffColor}`}>
								{m.difficulty?.toUpperCase()}
							</span>
							<span className='font-mono text-[8px] text-lines/20 block mt-0.5'>
								Adjust in-game settings
							</span>
						</div>
					</div>

					{/* Compromise badge */}
					<div
						className={`px-3 py-2.5 border-b border-lines/15 ${meta.bg} flex items-center justify-between`}>
						<span className='font-mono text-[8px] text-lines/30 uppercase'>
							Compromise Level
						</span>
						<div
							className={`flex items-center gap-2 px-2.5 py-1 border rounded-sm ${meta.border} ${meta.bg}`}>
							<span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
							<span
								className={`font-mono text-[9px] font-bold tracking-widest ${meta.color}`}>
								{meta.label}
							</span>
						</div>
					</div>

					{/* Air Support */}
					<div className='px-3 py-2.5 border-b border-lines/15'>
						<span className='font-mono text-[8px] text-lines/30 uppercase tracking-widest block mb-1.5'>
							Air Support
						</span>
						<ConditionRow
							icon={faCrosshairs}
							label='Armaros Drone'
							available={!!m.armarosDrone}
						/>
						<ConditionRow
							icon={faBullseye}
							label='Strike Designator'
							available={!!m.strikeDesignator}
						/>
					</div>

					{/* Support & Insertion */}
					<div className='px-3 py-2.5 border-b border-lines/15'>
						<span className='font-mono text-[8px] text-lines/30 uppercase tracking-widest block mb-1.5'>
							Support & Insertion
						</span>
						<ConditionRow
							icon={faSatellite}
							label='UAS / TacMap'
							available={!!m.UAS}
						/>
						<ConditionRow
							icon={faMicrochip}
							label='Cross-Com HUD'
							available={!!m.crossCom}
						/>
						<ConditionRow
							icon={faHelicopter}
							label='Vehicle Insertion'
							available={!!m.vehicleInsertion}
						/>
						<ConditionRow
							icon={faPeopleGroup}
							label='Teammate Abilities'
							available={!!m.teammateAbilities}
						/>
					</div>

					{/* Launch Windows */}
					{m.launchWindows && Object.keys(m.launchWindows).length > 0 && (
						<div className='px-3 py-2.5 border-b border-lines/15'>
							<span className='font-mono text-[8px] text-lines/30 uppercase tracking-widest block mb-2'>
								Authorized Launch Windows
							</span>
							<div className='grid grid-cols-2 gap-1.5'>
								{Object.entries(m.launchWindows).map(([key, w]) => (
									<div
										key={key}
										className={`px-2.5 py-2 border rounded-sm ${
											w.authorized ?
												"border-emerald-400/30 bg-emerald-400/5"
											:	"border-lines/15 opacity-40"
										}`}>
										<div className='flex items-center justify-between'>
											<span
												className={`font-mono text-[9px] font-bold ${w.authorized ? "text-emerald-400" : "text-lines/25"}`}>
												{w.label?.toUpperCase()}
											</span>
											<span
												className={
													w.authorized ? "text-emerald-400" : "text-lines/20"
												}>
												{w.authorized ? "✓" : "✗"}
											</span>
										</div>
										<span className='font-mono text-[8px] text-lines/25'>
											{w.hours}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Loadout */}
					<div className='px-3 py-2.5 border-b border-lines/15'>
						<span className='font-mono text-[8px] text-lines/30 uppercase tracking-widest block mb-1.5'>
							Loadout
						</span>
						<ConditionRow
							icon={faVolumeXmark}
							label='Suppressors Available'
							available={!!m.suppressorsAvailable}
						/>
					</div>

					{/* Enemy state */}
					{m.enemyState && (
						<div className='px-3 py-2.5 border-b border-lines/15'>
							<div className='flex items-center gap-2 mb-1.5'>
								<FontAwesomeIcon
									icon={faTriangleExclamation}
									className={`text-[9px] ${meta.color}`}
								/>
								<span className='font-mono text-[8px] text-lines/30 uppercase tracking-widest'>
									Enemy State —{" "}
									<span className={meta.color}>{m.enemyState}</span>
								</span>
							</div>
							{m.enemyStateDetail && (
								<p className='font-mono text-[9px] text-lines/30 leading-relaxed'>
									{m.enemyStateDetail}
								</p>
							)}
						</div>
					)}

					{/* Casualties */}
					{m.casualties && m.casualties !== "none" && (
						<div
							className={`px-3 py-2.5 border-b border-lines/15 flex items-center gap-2 ${m.casualties === "kia" ? "bg-red-400/5" : "bg-amber-400/5"}`}>
							<FontAwesomeIcon
								icon={m.casualties === "kia" ? faSkull : faUserSlash}
								className={`text-[10px] ${m.casualties === "kia" ? "text-red-400" : "text-amber-400"}`}
							/>
							<span
								className={`font-mono text-[9px] font-bold uppercase tracking-widest ${m.casualties === "kia" ? "text-red-400" : "text-amber-400"}`}>
								{m.casualties === "kia" ?
									"KIA — Update operator roster"
								:	"WIA — Operators flagged for medical hold"}
							</span>
						</div>
					)}

					{/* Ghost protocol */}
					{m.compromiseBadge === "cold" && (
						<div className='px-3 py-2.5 border-b border-lines/15 bg-emerald-400/5 flex items-center gap-2'>
							<FontAwesomeIcon
								icon={faShieldHalved}
								className='text-emerald-400 text-[10px]'
							/>
							<span className='font-mono text-[9px] font-bold text-emerald-400 uppercase tracking-widest'>
								Ghost Protocol Maintained — All assets available
							</span>
						</div>
					)}

					{/* Asset mismatch */}
					{m.hasMismatch && (
						<div className='px-3 py-2.5 border-b border-lines/15 bg-red-400/5'>
							<div className='flex items-center gap-2 mb-1'>
								<FontAwesomeIcon
									icon={faTriangleExclamation}
									className='text-red-400 text-[10px]'
								/>
								<span className='font-mono text-[9px] font-bold text-red-400 uppercase tracking-widest'>
									Asset Mismatch Detected
								</span>
							</div>
							{m.mismatchDescription && (
								<p className='font-mono text-[8px] text-red-400/60 leading-relaxed mb-1.5'>
									{m.mismatchDescription}
								</p>
							)}
							{m.mismatchedAssets?.length > 0 && (
								<div className='flex flex-wrap gap-1'>
									{m.mismatchedAssets.map((a) => (
										<span
											key={a}
											className='font-mono text-[8px] text-red-400 border border-red-400/30 px-1.5 py-0.5 rounded-sm'>
											{a}
										</span>
									))}
								</div>
							)}
						</div>
					)}

					{/* Delete */}
					<div className='px-3 py-2 flex justify-end'>
						<button
							onClick={() => deleteReconReport(missionId, report._id)}
							className='flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase text-lines/25 hover:text-red-400 border border-transparent hover:border-red-900/40 px-2 py-1 rounded-sm transition-all'>
							<FontAwesomeIcon
								icon={faTrash}
								className='text-[8px]'
							/>
							Delete Report
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default function ReconHistoryPanel({ mission }) {
	const reports = mission?.reconReports || [];

	if (reports.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center flex-1 gap-3 p-6 h-full'>
				<div className='grid grid-cols-3 gap-1 opacity-15'>
					{[...Array(9)].map((_, i) => (
						<div
							key={i}
							className='w-2 h-2 border border-lines/50'
						/>
					))}
				</div>
				<p className='font-mono text-[9px] tracking-[0.25em] text-lines/20 uppercase'>
					No Recon Reports Filed
				</p>
				<p className='font-mono text-[8px] text-lines/15 text-center leading-relaxed'>
					Run a debrief via the ISR button to file a report
				</p>
			</div>
		);
	}

	// Newest first, preserve original index for report number
	const sorted = reports.map((r, i) => ({ ...r, _origIndex: i })).reverse();

	return (
		<div className='flex flex-col gap-3 p-4 overflow-y-auto h-full'>
			<div className='flex items-center justify-between shrink-0'>
				<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
					{reports.length} Report{reports.length !== 1 ? "s" : ""} Filed
				</span>
				<span className='font-mono text-[8px] text-lines/20 truncate max-w-[150px]'>
					{mission?.name}
				</span>
			</div>
			<div className='flex flex-col gap-2'>
				{sorted.map((report) => (
					<ReportCard
						key={report._id || report._origIndex}
						report={report}
						missionId={mission._id}
						reportNumber={report._origIndex + 1}
					/>
				))}
			</div>
		</div>
	);
}
