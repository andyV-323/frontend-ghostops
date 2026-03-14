// ─────────────────────────────────────────────────────────────────────────────
// PhaseReportSheet.jsx
// Post-mission phase debrief questionnaire — 4 screens, all taps.
// Saves a Phase record to the operation. Replaces ReconTool.
//
// Props:
//   mission       — active mission/operation object
//   phaseNumber   — current phase number (auto-incremented by parent)
//   onSave        — (phaseData) => void — called when player submits
//   onClose       — () => void
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faChevronRight,
	faChevronLeft,
	faCheck,
} from "@fortawesome/free-solid-svg-icons";

// ─── Screen definitions ───────────────────────────────────────────────────────

const SCREENS = ["OUTCOME", "COMPLICATIONS", "CASUALTIES", "INTEL"];

// ─── Option data ──────────────────────────────────────────────────────────────

const OUTCOME_OPTIONS = [
	{
		id: "clean",
		label: "Objective complete",
		sub: "Clean execution — no compromise",
		color: "text-green-400",
		border: "border-green-500/40",
		activeBg: "bg-green-500/10",
		dot: "bg-green-400",
	},
	{
		id: "compromised",
		label: "Objective complete",
		sub: "Element compromised during operation",
		color: "text-yellow-400",
		border: "border-yellow-500/40",
		activeBg: "bg-yellow-500/10",
		dot: "bg-yellow-400",
	},
	{
		id: "heavy_contact",
		label: "Objective complete",
		sub: "Heavy contact sustained",
		color: "text-orange-400",
		border: "border-orange-500/40",
		activeBg: "bg-orange-500/10",
		dot: "bg-orange-400",
	},
	{
		id: "aborted",
		label: "Objective not achieved",
		sub: "Mission aborted",
		color: "text-red-400",
		border: "border-red-500/40",
		activeBg: "bg-red-500/10",
		dot: "bg-red-400",
	},
	{
		id: "target_not_present",
		label: "Objective not achieved",
		sub: "Target not present — new lead required",
		color: "text-blue-400",
		border: "border-blue-500/40",
		activeBg: "bg-blue-500/10",
		dot: "bg-blue-400",
	},
];

const COMPLICATION_OPTIONS = [
	{ id: "none", label: "No complications", exclusive: true },
	{ id: "qrf_responded", label: "QRF responded", exclusive: false },
	{ id: "isr_offline", label: "ISR went offline", exclusive: false },
	{ id: "crosscom_lost", label: "Cross-Com lost", exclusive: false },
	{ id: "exfil_compromised", label: "Exfil compromised", exclusive: false },
	{
		id: "civilian_contact",
		label: "Unexpected civilian contact",
		exclusive: false,
	},
	{ id: "intel_recovered", label: "Intel recovered", exclusive: false },
	{
		id: "target_not_found",
		label: "Target not at location — new lead",
		exclusive: false,
	},
	{ id: "asset_lost", label: "Asset destroyed or lost", exclusive: false },
];

const CASUALTY_OPTIONS = [
	{
		id: "none",
		label: "No casualties",
		color: "text-green-400",
		border: "border-green-500/30",
		activeBg: "bg-green-500/8",
	},
	{
		id: "injured",
		label: "Operator injured",
		color: "text-yellow-400",
		border: "border-yellow-500/30",
		activeBg: "bg-yellow-500/8",
	},
	{
		id: "kia",
		label: "Operator KIA",
		color: "text-red-400",
		border: "border-red-500/30",
		activeBg: "bg-red-500/8",
	},
];

const INTEL_OPTIONS = [
	{
		id: "nothing_new",
		label: "Nothing new — intel gap remains",
		exclusive: true,
	},
	{
		id: "patrol_timing",
		label: "Enemy patrol patterns confirmed",
		exclusive: false,
	},
	{
		id: "enemy_strength",
		label: "Enemy force strength assessed",
		exclusive: false,
	},
	{
		id: "facility_layout",
		label: "Facility or base layout mapped",
		exclusive: false,
	},
	{ id: "hvt_location", label: "HVT location updated", exclusive: false },
	{ id: "supply_route", label: "Supply route identified", exclusive: false },
	{
		id: "contact_activated",
		label: "Resistance or local contact activated",
		exclusive: false,
	},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toggleMulti(current, id, options) {
	const opt = options.find((o) => o.id === id);
	if (!opt) return current;

	// If exclusive option selected, clear everything else
	if (opt.exclusive) return [id];

	// If non-exclusive selected, remove any exclusive options
	const withoutExclusive = current.filter(
		(c) => !options.find((o) => o.id === c)?.exclusive,
	);

	if (withoutExclusive.includes(id)) {
		return withoutExclusive.filter((c) => c !== id);
	}
	return [...withoutExclusive, id];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScreenHeader({ phaseNumber, current, total, title, sub }) {
	return (
		<div className='shrink-0 px-4 pt-4 pb-3 border-b border-lines/15'>
			<div className='flex items-center justify-between mb-2.5'>
				<div className='flex items-center gap-2'>
					<span className='font-mono text-[9px] tracking-[0.25em] text-lines/30 uppercase'>
						Phase {phaseNumber}
					</span>
					<span className='text-lines/15'>//</span>
					<span className='font-mono text-[9px] tracking-[0.25em] text-btn/60 uppercase'>
						{title}
					</span>
				</div>
				<span className='font-mono text-[9px] text-lines/25'>
					{current}/{total}
				</span>
			</div>
			{/* Step indicators */}
			<div className='flex items-center gap-1.5'>
				{SCREENS.map((s, i) => (
					<div
						key={s}
						className='flex items-center gap-1.5'>
						<div
							className={[
								"h-0.5 transition-all duration-300",
								i < current - 1 ? "bg-btn w-6"
								: i === current - 1 ? "bg-btn w-10"
								: "bg-lines/15 w-4",
							].join(" ")}
						/>
						{i < SCREENS.length - 1 && (
							<div className='w-1 h-1 rounded-full bg-lines/10' />
						)}
					</div>
				))}
			</div>
			{sub && (
				<p className='font-mono text-[9px] text-lines/25 mt-2 uppercase tracking-wider'>
					{sub}
				</p>
			)}
		</div>
	);
}

function NavRow({
	onBack,
	onNext,
	onSubmit,
	canBack,
	canNext,
	isLast,
	loading,
}) {
	return (
		<div className='shrink-0 flex items-center justify-between px-4 py-3 border-t border-lines/15 bg-blk/40'>
			<button
				onClick={onBack}
				disabled={!canBack}
				className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-lines/35 hover:text-fontz disabled:opacity-20 disabled:cursor-not-allowed transition-colors'>
				<FontAwesomeIcon
					icon={faChevronLeft}
					className='text-[8px]'
				/>
				Back
			</button>
			{isLast ?
				<button
					onClick={onSubmit}
					disabled={loading}
					className='flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase text-blk bg-btn hover:bg-highlight disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 rounded-sm transition-all'>
					<FontAwesomeIcon
						icon={faCheck}
						className='text-[8px]'
					/>
					{loading ? "Saving..." : "File Report"}
				</button>
			:	<button
					onClick={onNext}
					disabled={!canNext}
					className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-btn hover:text-white disabled:opacity-20 disabled:cursor-not-allowed border border-btn/30 hover:border-btn/60 px-3 py-1.5 rounded-sm transition-all'>
					Next
					<FontAwesomeIcon
						icon={faChevronRight}
						className='text-[8px]'
					/>
				</button>
			}
		</div>
	);
}

// ─── Screen 1 — Outcome ───────────────────────────────────────────────────────

function OutcomeScreen({ value, onChange }) {
	return (
		<div className='flex flex-col gap-2 p-4'>
			{OUTCOME_OPTIONS.map((opt) => {
				const active = value === opt.id;
				return (
					<button
						key={opt.id}
						onClick={() => onChange(opt.id)}
						className={[
							"w-full flex items-center gap-3 px-3 py-3 rounded-sm border transition-all text-left",
							active ?
								`${opt.border} ${opt.activeBg}`
							:	"border-lines/10 hover:border-lines/25 bg-transparent hover:bg-white/[0.02]",
						].join(" ")}>
						<span
							className={[
								"w-2 h-2 rounded-full shrink-0 transition-all",
								active ? opt.dot : "bg-lines/15",
							].join(" ")}
						/>
						<div className='flex flex-col gap-0.5 min-w-0'>
							<span
								className={[
									"font-mono text-[10px] tracking-wider uppercase",
									active ? opt.color : "text-lines/45",
								].join(" ")}>
								{opt.label}
							</span>
							<span className='font-mono text-[9px] text-lines/25'>
								{opt.sub}
							</span>
						</div>
						{active && (
							<FontAwesomeIcon
								icon={faCheck}
								className={`ml-auto text-[9px] shrink-0 ${opt.color}`}
							/>
						)}
					</button>
				);
			})}
		</div>
	);
}

// ─── Screen 2 — Complications ─────────────────────────────────────────────────

function ComplicationsScreen({ value, onChange }) {
	return (
		<div className='flex flex-col gap-1.5 p-4'>
			{COMPLICATION_OPTIONS.map((opt) => {
				const active = value.includes(opt.id);
				return (
					<button
						key={opt.id}
						onClick={() =>
							onChange(toggleMulti(value, opt.id, COMPLICATION_OPTIONS))
						}
						className={[
							"w-full flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all text-left",
							active ?
								"border-btn/40 bg-btn/8"
							:	"border-lines/10 hover:border-lines/25 bg-transparent hover:bg-white/[0.02]",
							opt.exclusive ? "border-dashed" : "",
						].join(" ")}>
						<div
							className={[
								"w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center transition-all",
								active ?
									"border-btn bg-btn/20"
								:	"border-lines/20 bg-transparent",
							].join(" ")}>
							{active && (
								<FontAwesomeIcon
									icon={faCheck}
									className='text-btn text-[7px]'
								/>
							)}
						</div>
						<span
							className={[
								"font-mono text-[10px] tracking-wider",
								active ? "text-btn" : "text-lines/40",
								opt.exclusive ? "uppercase" : "",
							].join(" ")}>
							{opt.label}
						</span>
					</button>
				);
			})}
		</div>
	);
}

// ─── Screen 3 — Casualties ────────────────────────────────────────────────────

function CasualtiesScreen({ value, note, onSelect, onNote }) {
	return (
		<div className='flex flex-col gap-3 p-4'>
			<div className='flex flex-col gap-2'>
				{CASUALTY_OPTIONS.map((opt) => {
					const active = value === opt.id;
					return (
						<button
							key={opt.id}
							onClick={() => onSelect(opt.id)}
							className={[
								"w-full flex items-center gap-3 px-3 py-3 rounded-sm border transition-all text-left",
								active ?
									`${opt.border} ${opt.activeBg}`
								:	"border-lines/10 hover:border-lines/25 bg-transparent hover:bg-white/[0.02]",
							].join(" ")}>
							<span
								className={[
									"w-2 h-2 rounded-full shrink-0 transition-all",
									active ?
										opt.id === "none" ? "bg-green-400"
										: opt.id === "injured" ? "bg-yellow-400"
										: "bg-red-400"
									:	"bg-lines/15",
								].join(" ")}
							/>
							<span
								className={[
									"font-mono text-[10px] tracking-wider uppercase",
									active ? opt.color : "text-lines/45",
								].join(" ")}>
								{opt.label}
							</span>
							{active && (
								<FontAwesomeIcon
									icon={faCheck}
									className={`ml-auto text-[9px] shrink-0 ${opt.color}`}
								/>
							)}
						</button>
					);
				})}
			</div>

			{/* Optional casualty note */}
			{value !== "none" && (
				<div className='flex flex-col gap-1.5 mt-1'>
					<label className='font-mono text-[9px] tracking-widest text-lines/30 uppercase'>
						Operator / Circumstance (optional)
					</label>
					<textarea
						value={note}
						onChange={(e) => onNote(e.target.value)}
						maxLength={150}
						rows={2}
						placeholder='e.g. NOMAD — KIA during exfil under QRF fire'
						className='w-full bg-blk/60 border border-lines/15 focus:border-btn/40 rounded-sm px-3 py-2 font-mono text-[10px] text-fontz/70 placeholder:text-lines/20 resize-none outline-none transition-colors'
					/>
					<span className='font-mono text-[8px] text-lines/20 text-right'>
						{note.length}/150
					</span>
				</div>
			)}
		</div>
	);
}

// ─── Screen 4 — Intel developed ───────────────────────────────────────────────

function IntelScreen({ value, notes, onChange, onNotes }) {
	return (
		<div className='flex flex-col gap-3 p-4'>
			<div className='flex flex-col gap-1.5'>
				{INTEL_OPTIONS.map((opt) => {
					const active = value.includes(opt.id);
					return (
						<button
							key={opt.id}
							onClick={() =>
								onChange(toggleMulti(value, opt.id, INTEL_OPTIONS))
							}
							className={[
								"w-full flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all text-left",
								active ?
									"border-indigo-500/40 bg-indigo-500/8"
								:	"border-lines/10 hover:border-lines/25 bg-transparent hover:bg-white/[0.02]",
								opt.exclusive ? "border-dashed" : "",
							].join(" ")}>
							<div
								className={[
									"w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center transition-all",
									active ?
										"border-indigo-400 bg-indigo-400/20"
									:	"border-lines/20 bg-transparent",
								].join(" ")}>
								{active && (
									<FontAwesomeIcon
										icon={faCheck}
										className='text-indigo-400 text-[7px]'
									/>
								)}
							</div>
							<span
								className={[
									"font-mono text-[10px] tracking-wider",
									active ? "text-indigo-300" : "text-lines/40",
									opt.exclusive ? "uppercase" : "",
								].join(" ")}>
								{opt.label}
							</span>
						</button>
					);
				})}
			</div>

			{/* Optional field notes */}
			<div className='flex flex-col gap-1.5 mt-1'>
				<label className='font-mono text-[9px] tracking-widest text-lines/30 uppercase'>
					Field notes (optional)
				</label>
				<textarea
					value={notes}
					onChange={(e) => onNotes(e.target.value)}
					maxLength={150}
					rows={2}
					placeholder='Anything worth noting for the record...'
					className='w-full bg-blk/60 border border-lines/15 focus:border-btn/40 rounded-sm px-3 py-2 font-mono text-[10px] text-fontz/70 placeholder:text-lines/20 resize-none outline-none transition-colors'
				/>
				<span className='font-mono text-[8px] text-lines/20 text-right'>
					{notes.length}/150
				</span>
			</div>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PhaseReportSheet({
	mission,
	phaseNumber,
	onSave,
	onClose,
}) {
	const [screen, setScreen] = useState(1);
	const [outcome, setOutcome] = useState(null);
	const [complications, setComplications] = useState([]);
	const [casualties, setCasualties] = useState(null);
	const [casualtyNote, setCasualtyNote] = useState("");
	const [intelDeveloped, setIntelDeveloped] = useState([]);
	const [fieldNotes, setFieldNotes] = useState("");
	const [loading, setLoading] = useState(false);

	// ── Validation ─────────────────────────────────────────────────────────────
	const canProceed = {
		1: !!outcome,
		2: complications.length > 0,
		3: !!casualties,
		4: intelDeveloped.length > 0,
	};

	// ── Screen meta ────────────────────────────────────────────────────────────
	const screenMeta = {
		1: { title: "Outcome", sub: "How did the mission end?" },
		2: { title: "Complications", sub: "Select all that apply" },
		3: { title: "Casualties", sub: "Personnel status" },
		4: { title: "Intel Developed", sub: "What did command learn?" },
	};

	// ── Submit ─────────────────────────────────────────────────────────────────
	const handleSubmit = async () => {
		if (!canProceed[4]) return;
		setLoading(true);

		const phaseData = {
			phaseNumber,
			province: mission?.province ?? null,
			missionType: mission?.missionType ?? null,
			objectives: (mission?.generator?.selectedLocations ?? []).map(
				(l) => l.name ?? l,
			),
			outcome,
			complications,
			casualties,
			casualtyNote: casualtyNote.trim() || null,
			intelDeveloped,
			notes: fieldNotes.trim() || null,
			generatorSnapshot: {
				infilPoint: mission?.generator?.infilPoint ?? null,
				exfilPoint: mission?.generator?.exfilPoint ?? null,
				rallyPoint: mission?.generator?.rallyPoint ?? null,
				infilMethod: mission?.generator?.infilMethod ?? null,
				exfilMethod: mission?.generator?.exfilMethod ?? null,
			},
			createdAt: new Date().toISOString(),
		};

		try {
			await onSave(phaseData);
		} finally {
			setLoading(false);
		}
	};

	const { title, sub } = screenMeta[screen];

	return (
		<div className='flex flex-col h-full bg-blk/95 overflow-hidden'>
			{/* ── Header ── */}
			<ScreenHeader
				phaseNumber={phaseNumber}
				current={screen}
				total={SCREENS.length}
				title={title}
				sub={sub}
			/>

			{/* ── Screen content ── */}
			<div className='flex-1 min-h-0 overflow-y-auto'>
				{screen === 1 && (
					<OutcomeScreen
						value={outcome}
						onChange={setOutcome}
					/>
				)}
				{screen === 2 && (
					<ComplicationsScreen
						value={complications}
						onChange={setComplications}
					/>
				)}
				{screen === 3 && (
					<CasualtiesScreen
						value={casualties}
						note={casualtyNote}
						onSelect={setCasualties}
						onNote={setCasualtyNote}
					/>
				)}
				{screen === 4 && (
					<IntelScreen
						value={intelDeveloped}
						notes={fieldNotes}
						onChange={setIntelDeveloped}
						onNotes={setFieldNotes}
					/>
				)}
			</div>

			{/* ── Navigation ── */}
			<NavRow
				onBack={() => setScreen((s) => Math.max(1, s - 1))}
				onNext={() => setScreen((s) => Math.min(SCREENS.length, s + 1))}
				onSubmit={handleSubmit}
				canBack={screen > 1}
				canNext={canProceed[screen]}
				isLast={screen === SCREENS.length}
				loading={loading}
			/>
		</div>
	);
}

// ─── PropTypes ────────────────────────────────────────────────────────────────

PhaseReportSheet.propTypes = {
	mission: PropTypes.object.isRequired,
	phaseNumber: PropTypes.number.isRequired,
	onSave: PropTypes.func.isRequired,
	onClose: PropTypes.func,
};

ScreenHeader.propTypes = {
	phaseNumber: PropTypes.number,
	current: PropTypes.number,
	total: PropTypes.number,
	title: PropTypes.string,
	sub: PropTypes.string,
};

NavRow.propTypes = {
	onBack: PropTypes.func,
	onNext: PropTypes.func,
	onSubmit: PropTypes.func,
	canBack: PropTypes.bool,
	canNext: PropTypes.bool,
	isLast: PropTypes.bool,
	loading: PropTypes.bool,
};

OutcomeScreen.propTypes = {
	value: PropTypes.string,
	onChange: PropTypes.func,
};

ComplicationsScreen.propTypes = {
	value: PropTypes.array,
	onChange: PropTypes.func,
};

CasualtiesScreen.propTypes = {
	value: PropTypes.string,
	note: PropTypes.string,
	onSelect: PropTypes.func,
	onNote: PropTypes.func,
};

IntelScreen.propTypes = {
	value: PropTypes.array,
	notes: PropTypes.string,
	onChange: PropTypes.func,
	onNotes: PropTypes.func,
};
