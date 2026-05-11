import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faForwardStep,
	faBed,
	faHelicopter,
	faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import {
	CONDITION_META,
	MISSION_FATIGUE,
	BIOME_FATIGUE,
	WEATHER_FATIGUE,
} from "@/config/fatigue";
import { getTerrainData } from "@/utils/Restrictions";
import useTeamsStore from "@/zustand/useTeamStore";

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
		const meta = CONDITION_META;
		const levels = Object.keys(meta);
		const curIdx = levels.indexOf(op.conditionLevel ?? "Fresh");
		const wIdx = levels.indexOf(worst);
		return curIdx > wIdx ? (op.conditionLevel ?? "Fresh") : worst;
	}, "Fresh");

	const worstMeta = CONDITION_META[worstLevel] ?? CONDITION_META.Fresh;

	return (
		<div
			className='border border-neutral-800/60 mb-3'
			style={{ fontFamily: "'Courier New','Lucida Console',monospace" }}>
			{/* Team header */}
			<div
				className='flex items-center justify-between px-3 py-1.5 border-b border-neutral-800/60'
				style={{ background: "rgba(74,222,128,0.04)" }}>
				<div className='flex items-center gap-2'>
					<span
						className='w-1.5 h-1.5 rounded-full'
						style={{ background: worstMeta.hex }}
					/>
					<span className='text-[9px] font-bold uppercase tracking-widest text-fontz'>
						{team.name}
					</span>
				</div>
				<div className='flex items-center gap-2'>
					<span className='text-[8px] tracking-widest uppercase text-neutral-500'>
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
			<div className='px-3 py-2 flex flex-col gap-1.5'>
				{activeOps.length === 0 && (
					<span className='text-[9px] text-neutral-600 uppercase tracking-widest'>
						No active operators
					</span>
				)}
				{activeOps.map((op) => (
					<div
						key={op._id}
						className='flex items-center justify-between gap-2'>
						<span className='text-[9px] text-fontz/80 tracking-wide truncate'>
							{op.callSign}
							{op.status === "Injured" && (
								<span className='ml-1.5 text-[8px] text-amber-400 uppercase tracking-widest'>
									[WIA]
								</span>
							)}
						</span>
						<ConditionBadge level={op.conditionLevel ?? "Fresh"} />
					</div>
				))}
			</div>

			{/* Mission selector + controls — hidden for attached teams */}
			{!isAttached && (
				<div className='px-3 pb-2.5 pt-1 border-t border-neutral-800/40 flex flex-col gap-2 mt-1'>
					<div className='flex items-center gap-2'>
						<span className='text-[8px] uppercase tracking-[0.3em] text-neutral-500 shrink-0'>
							Mission
						</span>
						<div className='relative flex items-center flex-1'>
							<select
								value={missionCat}
								onChange={(e) => setMissionCat(e.target.value)}
								disabled={busy}
								className='appearance-none w-full font-mono text-[9px] tracking-widest uppercase bg-neutral-900 border border-btn/25 text-fontz pr-6 pl-2 py-1 focus:outline-none focus:border-btn/50 transition-colors cursor-pointer'>
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
								className='absolute right-2 text-[7px] text-btn/40 pointer-events-none'
							/>
						</div>
					</div>

					<div className='flex items-center gap-2'>
						<button
							onClick={handleAdvance}
							disabled={busy}
							className='flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 border border-btn/30 bg-btn/5 text-btn text-[9px] font-bold uppercase tracking-widest hover:bg-btn/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'>
							<FontAwesomeIcon
								icon={faForwardStep}
								className='text-[9px]'
							/>
							Advance Day
						</button>
						<button
							onClick={() => onRest(team._id)}
							disabled={busy}
							className='flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 border border-neutral-700/60 text-neutral-400 text-[9px] font-bold uppercase tracking-widest hover:bg-neutral-800/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'>
							<FontAwesomeIcon
								icon={faBed}
								className='text-[9px]'
							/>
							Rest Day
						</button>
						<button
							onClick={() => onRTB(team._id)}
							disabled={busy}
							title='Return to Base — resets all operators to Fresh and removes from AO'
							className='flex items-center justify-center gap-1 px-2 py-1.5 border border-red-900/40 text-red-400/70 text-[8px] font-bold uppercase tracking-widest hover:bg-red-950/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'>
							<FontAwesomeIcon
								icon={faHelicopter}
								className='text-[9px]'
							/>
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
	isAttached: PropTypes.bool,
	busy: PropTypes.bool,
};

export default function FatigueSimulator({
	teams,
	biome,
	provinceKey,
	atmosphere,
}) {
	const { advanceDay, restDay, returnToBase } = useTeamsStore();
	const [busy, setBusy] = useState(false);

	const handleAdvance = useCallback(
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
		<div
			className='relative w-full overflow-hidden'
			style={{ fontFamily: "'Courier New','Lucida Console',monospace" }}>
			{/* Header */}
			<div
				className='flex items-center justify-between px-3 py-1.5 border-b border-neutral-800/60'
				style={{ background: "rgba(74,222,128,0.04)" }}>
				<span className='text-[8px] uppercase tracking-[0.35em] font-bold text-btn/80'>
					◈ Operator Fatigue
				</span>
				<span className='text-[8px] uppercase tracking-widest text-btn/50'>
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
