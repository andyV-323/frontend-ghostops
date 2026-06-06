// ─────────────────────────────────────────────────────────────────────────────
// AdvisoryView.jsx
// Sheet content for the AI Advisory — shows aoSummary, weatherImpact,
// and two contrasting COA cards. Opened from BriefingPage header.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCheckCircle,
	faChevronDown,
	faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

// ── Posture style map ─────────────────────────────────────────────────────────

const POSTURE_STYLES = {
	stealth:    { border: "border-indigo-500/35", bg: "bg-indigo-950/10", badge: "text-indigo-400 border-indigo-500/40 bg-indigo-950/15" },
	balanced:   { border: "border-amber-500/35",  bg: "bg-amber-950/10",  badge: "text-amber-400 border-amber-500/40 bg-amber-950/15"   },
	aggressive: { border: "border-red-500/35",    bg: "bg-red-950/10",    badge: "text-red-400 border-red-500/40 bg-red-950/15"         },
};

// ── Shared layout helpers ─────────────────────────────────────────────────────

function Section({ label, children }) {
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center gap-2">
				<span className="font-mono text-[8px] tracking-[0.22em] text-lines/35 uppercase">
					{label}
				</span>
				<div className="flex-1 h-px bg-lines/8" />
			</div>
			{children}
		</div>
	);
}

function Row({ label, value }) {
	return (
		<div className="flex gap-2 min-w-0">
			<span className="font-mono text-[9px] text-lines/35 shrink-0 w-24">{label}</span>
			<span className="font-mono text-[10px] text-fontz/70 leading-relaxed">{value}</span>
		</div>
	);
}

// ── COA Card ──────────────────────────────────────────────────────────────────

function COACard({ coa, isRecommended }) {
	const [open, setOpen] = useState(true);
	const style = POSTURE_STYLES[coa.posture] ?? POSTURE_STYLES.balanced;

	return (
		<div className={`flex flex-col border rounded-sm overflow-hidden ${style.border} ${style.bg}`}>
			{/* Header */}
			<div
				className={`flex items-center gap-2 px-3 py-2.5 border-b cursor-pointer select-none ${style.border}`}
				onClick={() => setOpen((v) => !v)}>
				<div className="flex items-center gap-2 flex-1 min-w-0">
					{isRecommended && (
						<FontAwesomeIcon icon={faCheckCircle} className="text-btn/70 text-[10px] shrink-0" />
					)}
					<div className="flex flex-col min-w-0">
						<span className="font-mono text-[8px] tracking-[0.22em] text-lines/35 uppercase">
							{coa.id.toUpperCase()}
						</span>
						<span className="font-mono text-[12px] tracking-wide text-fontz/90 truncate">
							{coa.name}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<span className={`font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 border rounded-sm ${style.badge}`}>
						{coa.posture}
					</span>
					<span className="font-mono text-[9px] text-lines/35 tabular-nums">
						{coa.teamSize}P
					</span>
					{isRecommended && (
						<span className="font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 border border-btn/40 bg-btn/8 text-btn/70 rounded-sm">
							REC
						</span>
					)}
					<FontAwesomeIcon
						icon={open ? faChevronUp : faChevronDown}
						className="text-[9px] text-lines/30"
					/>
				</div>
			</div>

			{open && (
				<div className="flex flex-col gap-4 p-4">
					{/* Team Composition */}
					<Section label="Team Composition">
						<div className="flex flex-wrap gap-1">
							{coa.classes.map((cls, i) => (
								<span
									key={i}
									className="font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 border border-lines/20 bg-lines/5 text-fontz/60 rounded-sm">
									{cls}
								</span>
							))}
						</div>
					</Section>

					{/* Infiltration */}
					<Section label="Infiltration">
						<div className="flex flex-col gap-0.5">
							<Row label="Method" value={coa.infiltration.method} />
							<Row label="Timing" value={coa.infiltration.timing} />
							<p className="font-mono text-[10px] text-fontz/60 leading-relaxed mt-1">
								{coa.infiltration.rationale}
							</p>
						</div>
					</Section>

					{/* Approach */}
					<Section label="Approach">
						<div className="flex flex-col gap-0.5">
							<Row label="Vector" value={coa.approach.vector} />
							<Row label="Movement" value={coa.approach.movement} />
							<p className="font-mono text-[10px] text-lines/40 leading-relaxed mt-1 italic">
								{coa.approach.oakoc}
							</p>
						</div>
					</Section>

					{/* Loadout — no tools list */}
					<Section label="Loadout">
						<div className="flex flex-col gap-0.5">
							<Row label="Weapon" value={coa.loadout.primaryWeaponType} />
							<Row label="Camo" value={coa.loadout.camo} />
							{coa.loadout.rationale && (
								<p className="font-mono text-[10px] text-fontz/55 leading-relaxed mt-1">
									{coa.loadout.rationale}
								</p>
							)}
						</div>
					</Section>

					{/* Execution */}
					<Section label="Execution">
						<ol className="flex flex-col gap-1 list-none">
							{(coa.execution ?? []).map((step, i) => (
								<li key={i} className="flex gap-2.5">
									<span className="font-mono text-[9px] text-btn/50 shrink-0 w-4 text-right tabular-nums">
										{i + 1}.
									</span>
									<span className="font-mono text-[10px] text-fontz/65 leading-relaxed">
										{step}
									</span>
								</li>
							))}
						</ol>
					</Section>

					{/* Contingencies — no droneAlert row */}
					<Section label="Contingencies">
						<div className="flex flex-col gap-0.5">
							<Row label="Compromised" value={coa.contingencies.compromised} />
							<Row label="Casualty" value={coa.contingencies.casualty} />
						</div>
					</Section>

					{/* Exfiltration */}
					<Section label="Exfiltration">
						<div className="flex flex-col gap-0.5">
							<Row label="Method" value={coa.exfil.method} />
							<Row label="Rally Point" value={coa.exfil.rallyPoint} />
							<p className="font-mono text-[10px] text-fontz/55 leading-relaxed mt-1">
								{coa.exfil.rationale}
							</p>
						</div>
					</Section>

					{/* Tradeoffs */}
					<Section label="Tradeoffs">
						<p className="font-mono text-[10px] text-lines/50 leading-relaxed italic">
							{coa.tradeoffs}
						</p>
					</Section>
				</div>
			)}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdvisoryView({ advisory }) {
	if (!advisory) return null;

	return (
		<div className="flex flex-col h-full min-h-0">
			<div className="flex-1 min-h-0 overflow-y-auto">
				<div className="flex flex-col gap-5 p-4">
					{/* Operation header */}
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<span className="font-mono text-[10px] tracking-[0.3em] text-btn/60 uppercase">
								{advisory.operationName}
							</span>
							<div className="flex-1 h-px bg-lines/10" />
							<span className="font-mono text-[8px] tracking-widest text-lines/25 uppercase border border-lines/15 px-1.5 py-0.5 rounded-sm">
								{advisory.objectiveMode === "ao_exploration" ? "AO Sweep" : "Fixed Obj"}
							</span>
						</div>
					</div>

					{/* AO Summary */}
					<div className="flex flex-col gap-1.5">
						<span className="font-mono text-[8px] tracking-[0.22em] text-lines/35 uppercase">
							AO Summary
						</span>
						<p className="font-mono text-[10px] text-fontz/70 leading-relaxed">
							{advisory.aoSummary}
						</p>
					</div>

					{/* Weather Impact */}
					<div className="flex flex-col gap-1.5">
						<span className="font-mono text-[8px] tracking-[0.22em] text-lines/35 uppercase">
							Weather Impact
						</span>
						<p className="font-mono text-[10px] text-lines/50 leading-relaxed italic border-l-2 border-lines/15 pl-2.5">
							{advisory.weatherImpact}
						</p>
					</div>

					{/* COA divider */}
					<div className="flex items-center gap-2">
						<div className="flex-1 h-px bg-lines/10" />
						<span className="font-mono text-[8px] tracking-[0.25em] text-lines/25 uppercase">
							Courses of Action
						</span>
						<div className="flex-1 h-px bg-lines/10" />
					</div>

					{/* COA cards */}
					<div className="flex flex-col gap-3">
						{advisory.courses.map((coa) => (
							<COACard
								key={coa.id}
								coa={coa}
								isRecommended={coa.id === advisory.recommendedCOA}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── PropTypes ────────────────────────────────────────────────────────────────

AdvisoryView.propTypes = { advisory: PropTypes.object };

Section.propTypes = { label: PropTypes.string, children: PropTypes.node };
Row.propTypes = { label: PropTypes.string, value: PropTypes.string };

COACard.propTypes = {
	coa: PropTypes.object.isRequired,
	isRecommended: PropTypes.bool.isRequired,
};
