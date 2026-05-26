import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faForwardStep,
	faBed,
	faHelicopter,
	faChevronDown,
	faSun,
} from "@fortawesome/free-solid-svg-icons";
import {
	CONDITION_META,
	MISSION_FATIGUE,
	BIOME_FATIGUE,
	WEATHER_FATIGUE,
} from "@/config/fatigue";
import { getTerrainData } from "@/utils/Restrictions";
import useTeamsStore from "@/zustand/useTeamStore";
import { useKitsStore, useOperatorsStore } from "@/zustand";
import { getOperatorDisplayImage } from "@/utils/operatorImage";

const STATUS_DOT = {
	active: "bg-green-500 shadow-[0_0_4px_rgba(74,222,128,0.7)]",
	injured: "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.7)]",
	wounded: "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.7)]",
	kia: "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.7)]",
};
const CONDITION = {
	fresh: "bg-green-600 shadow-[0_0_6px_rgba(74,222,128,0.6)]",
	steady: "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]",
	worn: "bg-yellow-600 shadow-[0_0_6px_rgba(74,222,128,0.6)]",
	degraded: "bg-amber-500 shadow-[0_0_6px_rgba(74,222,128,0.6)]",
	spent: "bg-red-700 shadow-[0_0_6px_rgba(74,222,128,0.6)]",
};
const getDot = (s = "") => STATUS_DOT[s.toLowerCase()] ?? STATUS_DOT.active;
const getCon = (c = "") => CONDITION[c.toLowerCase()] ?? CONDITION.fresh;

function SimOperator({ op }) {
	const { kits } = useKitsStore();
	const { operators } = useOperatorsStore();
	const freshOp = operators.find((o) => o._id === op._id) || op;
	const avatarSrc = getOperatorDisplayImage(freshOp, kits);

	return (
		<div className='group flex flex-col items-center gap-1'>
			<div className='relative'>
				<img
					className='w-12 h-12 rounded-full border border-neutral-700/40 group-hover:border-btn/50 bg-neutral-900 object-cover object-top transition-all'
					src={avatarSrc}
					onError={(e) => {
						e.currentTarget.src = "/ghost/Default.png";
					}}
					alt={op.callSign}
					title={op.callSign}
				/>
				<span
					className={[
						"absolute -bottom-0.5 -left-0.5 w-2 h-2 rounded-full border border-neutral-950",
						getDot(op.status),
					].join(" ")}
				/>
				<span
					className={[
						"absolute -bottom-0.5 -right-0.5 w-2 h-2 border border-neutral-950",
						getCon(op.conditionLevel),
					].join(" ")}
				/>
			</div>
			<span className='font-mono text-[10px] tracking-wide text-neutral-600 group-hover:text-neutral-300 transition-colors text-center max-w-[48px] truncate leading-none'>
				{op.callSign}
			</span>
		</div>
	);
}

SimOperator.propTypes = { op: PropTypes.object.isRequired };

const MISSION_CATEGORIES = Object.keys(MISSION_FATIGUE);

function ConditionBadge({ level }) {
	const meta = CONDITION_META[level] ?? CONDITION_META.Fresh;
	return (
		<span
			style={{
				color: meta.hex,
				border: `1px solid ${meta.border}`,
				background: meta.bg,
				fontFamily: "'Courier New','Lucida Console',monospace",
			}}
			className='text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 shrink-0'>
			{meta.label}
		</span>
	);
}

ConditionBadge.propTypes = { level: PropTypes.string };

function TeamFatigueCard({
	team,
	biome,
	provinceKey,
	atmosphere,
	onAdvance,
	onRest,
	onRTB,
	onFullRest,
	isAttached,
	busy,
}) {
	const [missionCat, setMissionCat] = useState("Direct Action");

	const biomeDeg = BIOME_FATIGUE[biome] ?? 0;
	const missionDeg = MISSION_FATIGUE[missionCat] ?? 1;
	const terrainDeg =
		(getTerrainData(provinceKey)?.degraded?.length ?? 0) > 0 ? 1 : 0;

	const handleAdvance = useCallback(() => {
		const weatherDeg = WEATHER_FATIGUE[atmosphere] ?? 0;
		onAdvance(team._id, { missionDeg, biomeDeg, weatherDeg, terrainDeg });
	}, [team._id, missionDeg, biomeDeg, terrainDeg, atmosphere, onAdvance]);

	const activeOps = (team.operators || []).filter((op) => op.status !== "KIA");
	const worstLevel = activeOps.reduce((worst, op) => {
		const levels = Object.keys(CONDITION_META);
		const curIdx = levels.indexOf(op.conditionLevel ?? "Fresh");
		const wIdx = levels.indexOf(worst);
		return curIdx > wIdx ? (op.conditionLevel ?? "Fresh") : worst;
	}, "Fresh");

	const worstMeta = CONDITION_META[worstLevel] ?? CONDITION_META.Fresh;

	return (
		<div className='font-mono border border-neutral-800/60 mb-3'>
			{/* Team header */}
			<div className='flex items-center justify-between px-3 py-1.5 border-b border-neutral-800/60 bg-neutral-950/40'>
				<div className='flex items-center gap-2'>
					<div className='w-0.5 h-3.5 bg-btn/60 shrink-0' />
					<span
						className='w-1.5 h-1.5 rounded-full shrink-0'
						style={{ background: worstMeta.hex }}
					/>
					<span className='text-[9px] font-bold uppercase tracking-widest text-fontz'>
						{team.name}
					</span>
				</div>
				<div className='flex items-center gap-2'>
					<span className='text-[7px] tracking-[0.3em] uppercase text-neutral-600'>
						Day
					</span>
					<span
						className='text-[10px] font-bold tabular-nums'
						style={{ color: worstMeta.hex }}>
						{team.aoDeployedDays ?? 0}
					</span>
				</div>
			</div>

			{/* Operators */}
			<div className='px-3 py-2.5'>
				<p className='font-mono text-[10px] tracking-[0.25em] text-neutral-700 uppercase mb-2'>
					Operators
				</p>
				{activeOps.length === 0 ?
					<span className='font-mono text-[10px] text-neutral-700'>
						No active operators
					</span>
				:	<div className='flex flex-wrap gap-3'>
						{activeOps.map((op) => (
							<SimOperator key={op._id} op={op} />
						))}
					</div>
				}
			</div>

			{/* Mission selector + controls — hidden for attached teams */}
			{!isAttached && (
				<div className='px-3 pb-2.5 pt-1.5 border-t border-neutral-800/40 flex flex-col gap-2'>
					<div className='flex items-center gap-2'>
						<span className='text-[7px] uppercase tracking-[0.3em] text-neutral-600 shrink-0'>
							Mission
						</span>
						<div className='relative flex items-center flex-1'>
							<select
								value={missionCat}
								onChange={(e) => setMissionCat(e.target.value)}
								disabled={busy}
								className='appearance-none w-full font-mono text-[8px] tracking-widest uppercase bg-neutral-900 border border-neutral-700/60 text-fontz pr-6 pl-2 py-1 focus:outline-none focus:border-btn/50 transition-colors cursor-pointer'>
								{MISSION_CATEGORIES.map((cat) => (
									<option
										key={cat}
										value={cat}>
										{cat}
									</option>
								))}
							</select>
							<FontAwesomeIcon
								icon={faChevronDown}
								className='absolute right-2 text-[7px] text-neutral-600 pointer-events-none'
							/>
						</div>
					</div>

					<div className='flex items-center gap-1.5'>
						<button
							onClick={handleAdvance}
							disabled={busy}
							className='flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border border-btn/30 bg-btn/5 text-btn font-mono text-[8px] font-bold uppercase tracking-widest hover:bg-btn/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'>
							<FontAwesomeIcon icon={faForwardStep} className='text-[8px]' />
							Advance
						</button>
						<button
							onClick={() => onRest(team._id)}
							disabled={busy}
							className='flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border border-neutral-700/60 text-neutral-400 font-mono text-[8px] font-bold uppercase tracking-widest hover:bg-neutral-800/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'>
							<FontAwesomeIcon icon={faBed} className='text-[8px]' />
							Rest
						</button>
						<button
							onClick={() => onFullRest(team._id)}
							disabled={busy}
							title='Full Rest — restore all operators to Fresh'
							className='flex items-center justify-center gap-1 px-2 py-1.5 border border-green-900/40 text-green-400/70 font-mono text-[8px] font-bold uppercase tracking-widest hover:bg-green-950/20 hover:text-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'>
							<FontAwesomeIcon icon={faSun} className='text-[8px]' />
							Fresh
						</button>
						<button
							onClick={() => onRTB(team._id)}
							disabled={busy}
							title='Return to Base — resets all operators to Fresh and removes from AO'
							className='flex items-center justify-center gap-1 px-2 py-1.5 border border-red-900/40 text-red-400/70 font-mono text-[8px] font-bold uppercase tracking-widest hover:bg-red-950/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'>
							<FontAwesomeIcon icon={faHelicopter} className='text-[8px]' />
							RTB
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

TeamFatigueCard.propTypes = {
	team: PropTypes.object.isRequired,
	biome: PropTypes.string.isRequired,
	provinceKey: PropTypes.string.isRequired,
	atmosphere: PropTypes.string,
	onAdvance: PropTypes.func.isRequired,
	onRest: PropTypes.func.isRequired,
	onRTB: PropTypes.func.isRequired,
	onFullRest: PropTypes.func.isRequired,
	isAttached: PropTypes.bool,
	busy: PropTypes.bool,
};

// ─── CI Confirmation Modal ────────────────────────────────────────────────────

function CIConfirmModal({ ciNames, onConfirm, onCancel }) {
	return (
		<div
			className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/70'
			style={{ fontFamily: "'Courier New','Lucida Console',monospace" }}>
			<div className='w-full max-w-sm mx-4 border border-red-800/50 bg-neutral-950 shadow-2xl'>
				<div className='flex items-center gap-2 px-4 py-3 border-b border-red-800/30 bg-red-950/20'>
					<span className='w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0' />
					<span className='font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-red-400'>
						Combat Ineffective Warning
					</span>
				</div>
				<div className='px-4 py-4'>
					<p className='font-mono text-[11px] text-neutral-300 leading-relaxed mb-3'>
						The following operators are <span className='text-red-400 font-bold'>Combat Ineffective</span>. Assigning them to this mission may result in increased injury risk.
					</p>
					<div className='flex flex-wrap gap-1 mb-4'>
						{ciNames.map((name) => (
							<span
								key={name}
								className='font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-red-800/40 bg-red-950/20 text-red-300/80'>
								{name}
							</span>
						))}
					</div>
					<p className='font-mono text-[10px] text-neutral-500 mb-4'>
						Proceed anyway?
					</p>
					<div className='flex gap-2'>
						<button
							onClick={onCancel}
							className='flex-1 font-mono text-[9px] uppercase tracking-widest py-2 border border-lines/20 text-lines/50 hover:text-lines hover:border-lines/40 transition-colors'>
							Cancel
						</button>
						<button
							onClick={onConfirm}
							className='flex-1 font-mono text-[9px] uppercase tracking-widest py-2 border border-red-700/40 text-red-400/70 hover:text-red-400 hover:border-red-500/60 hover:bg-red-950/20 transition-colors'>
							Proceed
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

CIConfirmModal.propTypes = {
	ciNames: PropTypes.arrayOf(PropTypes.string).isRequired,
	onConfirm: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
};

export default function FatigueSimulator({
	teams,
	biome,
	provinceKey,
	atmosphere,
}) {
	const { advanceDay, restDay, returnToBase, fullRest } = useTeamsStore();
	const [busy, setBusy] = useState(false);
	const [ciPending, setCiPending] = useState(null); // { teamId, degs, ciNames }

	const executeAdvance = useCallback(
		async (teamId, degs) => {
			setBusy(true);
			try {
				await advanceDay(teamId, degs);
			} finally {
				setBusy(false);
			}
		},
		[advanceDay],
	);

	const handleAdvance = useCallback(
		(teamId, degs) => {
			// Find the team (top-level or attached) to check for CI operators
			let team = teams.find((t) => t._id === teamId);
			if (!team) {
				for (const t of teams) {
					const at = (t.attachedTeams || []).find(
						(a) => typeof a === "object" && a._id === teamId,
					);
					if (at) { team = at; break; }
				}
			}
			const ciOps = (team?.operators || []).filter(
				(op) => op.status !== "KIA" && op.status !== "Injured" && (op.fatiguePoints ?? 0) >= 11,
			);
			if (ciOps.length > 0) {
				setCiPending({ teamId, degs, ciNames: ciOps.map((op) => op.callSign) });
				return;
			}
			executeAdvance(teamId, degs);
		},
		[teams, executeAdvance],
	);

	const handleRest = useCallback(
		async (teamId) => {
			setBusy(true);
			try {
				await restDay(teamId);
			} finally {
				setBusy(false);
			}
		},
		[restDay],
	);

	const handleRTB = useCallback(
		async (teamId) => {
			setBusy(true);
			try {
				await returnToBase(teamId);
			} finally {
				setBusy(false);
			}
		},
		[returnToBase],
	);

	const handleFullRest = useCallback(
		async (teamId) => {
			setBusy(true);
			try {
				await fullRest(teamId);
			} finally {
				setBusy(false);
			}
		},
		[fullRest],
	);

	if (!teams?.length) return null;

	const totalCount = teams.reduce(
		(sum, t) =>
			sum +
			1 +
			(t.attachedTeams || []).filter((at) => typeof at === "object" && at._id)
				.length,
		0,
	);

	return (
		<div className='relative w-full overflow-hidden font-mono'>
			{/* CI confirmation modal */}
			{ciPending && (
				<CIConfirmModal
					ciNames={ciPending.ciNames}
					onConfirm={() => {
						const { teamId, degs } = ciPending;
						setCiPending(null);
						executeAdvance(teamId, degs);
					}}
					onCancel={() => setCiPending(null)}
				/>
			)}

			{/* Header */}
			<div className='flex items-center gap-2 px-3 py-1.5 border-b border-neutral-800/60 bg-neutral-950/40'>
				<div className='w-0.5 h-3.5 bg-btn/60 shrink-0' />
				<span className='text-[8px] uppercase tracking-[0.35em] font-bold text-btn/80 flex-1'>
					Operator Fatigue
				</span>
				<span className='text-[7px] uppercase tracking-widest text-neutral-600'>
					{totalCount} {totalCount === 1 ? "Team" : "Teams"} in AO
				</span>
			</div>

			<div className='px-3 py-3'>
				{teams.map((team) => (
					<div key={team._id}>
						<TeamFatigueCard
							team={team}
							biome={biome}
							provinceKey={provinceKey}
							atmosphere={atmosphere}
							onAdvance={handleAdvance}
							onRest={handleRest}
							onRTB={handleRTB}
							onFullRest={handleFullRest}
							busy={busy}
						/>
						{(team.attachedTeams || [])
							.filter((at) => typeof at === "object" && at._id)
							.map((at) => (
								<div
									key={at._id}
									className='ml-3 border-l border-neutral-800/50 pl-2'>
									<TeamFatigueCard
										team={at}
										biome={biome}
										provinceKey={provinceKey}
										atmosphere={atmosphere}
										onAdvance={handleAdvance}
										onRest={handleRest}
										onRTB={handleRTB}
										onFullRest={handleFullRest}
										isAttached
										busy={busy}
									/>
								</div>
							))}
					</div>
				))}
			</div>
		</div>
	);
}

FatigueSimulator.propTypes = {
	teams: PropTypes.array,
	biome: PropTypes.string,
	provinceKey: PropTypes.string,
	atmosphere: PropTypes.string,
};
