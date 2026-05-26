import { useCallback, useEffect, useMemo, useState } from "react";
import useTeamsStore from "@/zustand/useTeamStore";
import useOperatorsStore from "@/zustand/useOperatorStore";
import { OperatorsApi } from "@/api";
import {
	MISSION_FATIGUE,
	BIOME_FATIGUE,
	WEATHER_FATIGUE,
	REST_RECOVERY,
	calcConditionLevel,
} from "@/config/fatigue";
import { getTerrainData } from "@/utils/Restrictions";
import { PROVINCE_BIOMES, PROVINCES } from "@/config";
import { getReadinessLevel, getRestTarget, READINESS_META } from "@/utils/readiness";
import FatigueBadge from "@/components/FatigueBadge";
import { toast } from "react-toastify";

const PROVINCE_DISPLAY_NAMES = {
	CapeNorth: "Cape North",
	DriftwoodIslets: "Driftwood Islets",
	Golem1: "Golem Island — Sector 1",
	Golem2: "Golem Island — Sector 2",
	Golem3: "Golem Island — Sector 3",
	WildCoast: "Wild Coast",
	SmugglersCoves: "Smugglers Coves",
	WhalersBay: "Whalers Bay",
	FenBog: "Fen Bog",
	SinkingCountry: "Sinking Country",
	GoodHopeMountain: "Good Hope Mountain",
	SilentMountain: "Silent Mountain",
	MountHodgson: "Mount Hodgson",
	Channels: "The Channels",
	SealIslands: "Seal Islands",
	NewArgyll: "New Argyll",
	NewStirling: "New Stirling",
	WindyIslands: "Windy Islands",
	Infinity: "Infinity",
	Liberty: "Liberty",
	RestrictedArea01: "Restricted Area 01",
	LakeCountry: "Lake Country",
};

const ATM_OPTS = [
	{ key: "cloudless", code: "CLR", color: "#38bdf8" },
	{ key: "sunshine",  code: "SUN", color: "#fbbf24" },
	{ key: "overcast",  code: "OVC", color: "#94a3b8" },
	{ key: "precipitation", code: "PCPN", color: "#60a5fa" },
	{ key: "storm",     code: "STRM", color: "#f87171" },
];

const MISSION_CATS = Object.keys(MISSION_FATIGUE);

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
						The following operators are{" "}
						<span className='text-red-400 font-bold'>Combat Ineffective</span>.
						Assigning them to this mission may result in increased injury risk.
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
					<p className='font-mono text-[10px] text-neutral-500 mb-4'>Proceed anyway?</p>
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

// ─── CI Warning Banner ────────────────────────────────────────────────────────

function CIBanner({ operators }) {
	if (!operators.length) return null;
	return (
		<div className='shrink-0 mx-4 mt-4 border border-red-800/40 bg-red-950/15'>
			<div className='flex items-center gap-2 px-3 py-2 border-b border-red-800/30 bg-red-950/20'>
				<span className='w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0' />
				<span className='text-[10px] font-bold uppercase tracking-[0.35em] text-red-400'>
					Combat Ineffective — {operators.length} operator{operators.length !== 1 ? "s" : ""}
				</span>
			</div>
			<div className='px-3 py-2 flex flex-wrap gap-1.5'>
				{operators.map((op) => (
					<span
						key={op._id}
						className='font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-red-800/40 bg-red-950/20 text-red-300/80'>
						{op.callSign}
					</span>
				))}
			</div>
		</div>
	);
}

// ─── Operator Row ─────────────────────────────────────────────────────────────

function OperatorRow({ operator, onRefresh }) {
	const [busy, setBusy] = useState(false);
	const isInactive = operator.status === "KIA" || operator.status === "Injured";
	const pts = operator.fatiguePoints ?? 0;
	const level = getReadinessLevel(pts);
	const meta = READINESS_META[level];

	const handleRest = async () => {
		if (isInactive || busy) return;
		setBusy(true);
		try {
			const newPoints = getRestTarget(pts);
			if (newPoints === pts) return;
			await OperatorsApi.updateCondition(operator._id, calcConditionLevel(newPoints), newPoints);
			await onRefresh();
		} catch {
			toast.error("Failed to rest operator");
		} finally {
			setBusy(false);
		}
	};

	const handleFullRest = async () => {
		if (isInactive || busy || pts === 0) return;
		setBusy(true);
		try {
			await OperatorsApi.updateCondition(operator._id, "Fresh", 0);
			await onRefresh();
		} catch {
			toast.error("Failed to rest operator");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div
			className={[
				"flex items-center gap-3 px-4 py-2.5 border-b border-lines/10 transition-colors",
				isInactive ? "opacity-40" : "hover:bg-lines/5",
			].join(" ")}>
			<FatigueBadge fatiguePoints={pts} size='dot' />

			<div className='flex-1 min-w-0'>
				<div className='flex items-center gap-2 flex-wrap'>
					<span className='font-mono text-[11px] font-bold uppercase tracking-wide text-fontz truncate'>
						{operator.callSign}
					</span>
					{isInactive && (
						<span
							className={`font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 border ${operator.status === "KIA" ? "text-red-400/70 border-red-900/40" : "text-amber-400/70 border-amber-900/40"}`}>
							{operator.status === "KIA" ? "KIA" : "WIA"}
						</span>
					)}
				</div>
				<div className='font-mono text-[9px] text-lines tracking-widest'>
					{operator.class || "—"}{operator.role ? ` · ${operator.role}` : ""}
				</div>
			</div>

			{/* Readiness badge */}
			<span
				className='font-mono text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 shrink-0 hidden sm:inline'
				style={{ color: meta.hex, background: meta.bg, border: `1px solid ${meta.border}` }}>
				{level === "CombatIneffective" ? "CI" : meta.label}
			</span>

			{/* Fatigue points */}
			<span className='font-mono text-[8px] text-lines/40 shrink-0 hidden md:inline tabular-nums'>
				{pts}pt
			</span>

			{/* Individual rest controls */}
			{!isInactive && (
				<div className='flex items-center gap-1 shrink-0'>
					<button
						onClick={handleRest}
						disabled={busy || level === "Ready"}
						title='Lower one readiness band'
						className='font-mono text-[8px] uppercase tracking-widest px-2 py-1 border border-lines/20 text-lines/50 hover:text-lines hover:border-lines/40 disabled:opacity-25 disabled:cursor-not-allowed transition-colors'>
						Rest
					</button>
					<button
						onClick={handleFullRest}
						disabled={busy || pts === 0}
						title='Reset to Ready'
						className='font-mono text-[8px] uppercase tracking-widest px-2 py-1 border border-btn/25 text-btn/50 hover:text-btn hover:border-btn/50 disabled:opacity-25 disabled:cursor-not-allowed transition-colors'>
						Full
					</button>
				</div>
			)}
		</div>
	);
}

// ─── Team Section ─────────────────────────────────────────────────────────────

function TeamSection({ team, atmosphere, biome, provinceKey, onRefresh }) {
	const { advanceDay, restDay, returnToBase, fullRest } = useTeamsStore();
	const [missionCat, setMissionCat] = useState("Direct Action");
	const [busy, setBusy] = useState(false);
	const [ciPending, setCiPending] = useState(null); // { degs, ciNames }

	const operators = team.operators || [];
	const activeOps = operators.filter((op) => op.status !== "KIA" && op.status !== "Injured");

	const worstLevel = useMemo(() => {
		const rank = { Ready: 0, Degraded: 1, CombatIneffective: 2 };
		let worst = "Ready";
		activeOps.forEach((op) => {
			const l = getReadinessLevel(op.fatiguePoints ?? 0);
			if (rank[l] > rank[worst]) worst = l;
		});
		return worst;
	}, [activeOps]);
	const worstMeta = READINESS_META[worstLevel];

	// Fatigue cost preview for selected mission
	const missionDeg = MISSION_FATIGUE[missionCat] ?? 1;
	const biomeDeg = BIOME_FATIGUE[biome] ?? 0;
	const weatherDeg = WEATHER_FATIGUE[atmosphere] ?? 0;
	const terrainDeg = (getTerrainData(provinceKey)?.degraded?.length ?? 0) > 0 ? 1 : 0;
	const totalDeg = missionDeg + biomeDeg + weatherDeg + terrainDeg;

	const executeAdvance = useCallback(async (degs) => {
		setBusy(true);
		try {
			await advanceDay(team._id, degs);
			await onRefresh();
		} catch {
			toast.error("Advance failed");
		} finally {
			setBusy(false);
		}
	}, [advanceDay, team._id, onRefresh]);

	const handleAdvance = () => {
		const degs = { missionDeg, biomeDeg, weatherDeg, terrainDeg };
		const ciOps = activeOps.filter((op) => (op.fatiguePoints ?? 0) >= 11);
		if (ciOps.length > 0) {
			setCiPending({ degs, ciNames: ciOps.map((op) => op.callSign) });
			return;
		}
		executeAdvance(degs);
	};

	const handleRestDay = async () => {
		setBusy(true);
		try {
			await restDay(team._id);
			await onRefresh();
		} catch {
			toast.error("Rest day failed");
		} finally {
			setBusy(false);
		}
	};

	const handleFullRest = async () => {
		setBusy(true);
		try {
			await fullRest(team._id);
			await onRefresh();
		} catch {
			toast.error("Full rest failed");
		} finally {
			setBusy(false);
		}
	};

	const handleRTB = async () => {
		setBusy(true);
		try {
			await returnToBase(team._id);
			await onRefresh();
		} catch {
			toast.error("RTB failed");
		} finally {
			setBusy(false);
		}
	};

	return (
		<>
			{ciPending && (
				<CIConfirmModal
					ciNames={ciPending.ciNames}
					onConfirm={() => {
						const { degs } = ciPending;
						setCiPending(null);
						executeAdvance(degs);
					}}
					onCancel={() => setCiPending(null)}
				/>
			)}

			<div
				className='border border-lines/20 mb-3'
				style={{ borderLeft: `3px solid ${worstMeta.hex}` }}>
				{/* Team header */}
				<div
					className='flex items-center justify-between px-3 py-2 border-b border-lines/15'
					style={{ background: "rgba(0,0,0,0.3)" }}>
					<div className='flex items-center gap-2 min-w-0'>
						<span
							className='w-1.5 h-1.5 rounded-full shrink-0'
							style={{ background: worstMeta.hex, boxShadow: `0 0 4px ${worstMeta.hex}88` }}
						/>
						<span className='font-mono text-[11px] font-bold uppercase tracking-widest text-fontz truncate'>
							{team.name}
						</span>
						<span className='font-mono text-[9px] text-lines tracking-widest shrink-0'>
							{activeOps.length}P
						</span>
						{team.aoDeployedDays > 0 && (
							<span className='font-mono text-[8px] text-lines/40 tracking-widest shrink-0'>
								Day {team.aoDeployedDays}
							</span>
						)}
					</div>
				</div>

				{/* Mission selector + team controls */}
				<div
					className='border-b border-lines/15 px-3 py-2 flex flex-wrap items-center gap-2'
					style={{ background: "rgba(0,0,0,0.15)" }}>
					{/* Mission type dropdown */}
					<div className='relative flex items-center flex-1 min-w-[160px]'>
						<select
							value={missionCat}
							onChange={(e) => setMissionCat(e.target.value)}
							disabled={busy}
							className='appearance-none w-full font-mono text-[9px] tracking-widest uppercase bg-neutral-900 border border-lines/20 text-fontz pr-5 pl-2 py-1 focus:outline-none focus:border-btn/40 cursor-pointer disabled:opacity-40'>
							{MISSION_CATS.map((cat) => (
								<option key={cat} value={cat}>{cat}</option>
							))}
						</select>
						<span className='absolute right-1.5 text-lines/30 pointer-events-none text-[8px]'>▾</span>
					</div>

					{/* Fatigue cost preview */}
					<span
						className='font-mono text-[8px] tracking-widest shrink-0'
						style={{ color: totalDeg >= 4 ? "#f97316" : totalDeg >= 2 ? "#fbbf24" : "#7caa79" }}>
						+{totalDeg}pt
					</span>

					{/* Action buttons */}
					<div className='flex items-center gap-1 shrink-0'>
						<button
							onClick={handleAdvance}
							disabled={busy}
							title={`Advance day — ${missionCat} (+${totalDeg} fatigue pts)`}
							className='font-mono text-[8px] uppercase tracking-widest px-2.5 py-1 border border-btn/30 text-btn/60 hover:text-btn hover:border-btn/60 hover:bg-btn/5 disabled:opacity-25 disabled:cursor-not-allowed transition-colors'>
							Advance
						</button>
						<button
							onClick={handleRestDay}
							disabled={busy}
							title={`Rest day (−${REST_RECOVERY} fatigue pts)`}
							className='font-mono text-[8px] uppercase tracking-widest px-2.5 py-1 border border-lines/20 text-lines/50 hover:text-lines hover:border-lines/40 disabled:opacity-25 disabled:cursor-not-allowed transition-colors'>
							Rest Day
						</button>
						<button
							onClick={handleFullRest}
							disabled={busy}
							title='Full rest — reset all to Ready'
							className='font-mono text-[8px] uppercase tracking-widest px-2.5 py-1 border border-lines/20 text-lines/50 hover:text-lines hover:border-lines/40 disabled:opacity-25 disabled:cursor-not-allowed transition-colors'>
							Full Rest
						</button>
						<button
							onClick={handleRTB}
							disabled={busy}
							title='Return to base — full rest + clear AO'
							className='font-mono text-[8px] uppercase tracking-widest px-2.5 py-1 border border-lines/20 text-lines/40 hover:text-red-400/80 hover:border-red-900/40 hover:bg-red-950/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors'>
							RTB
						</button>
					</div>
				</div>

				{/* Operator rows */}
				{operators.length === 0 ?
					<div className='px-4 py-3 font-mono text-[9px] text-lines tracking-widest'>
						No operators assigned
					</div>
				:	operators.map((op) => (
						<OperatorRow key={op._id} operator={op} onRefresh={onRefresh} />
					))
				}
			</div>
		</>
	);
}

// ─── AO Group ─────────────────────────────────────────────────────────────────

function AOGroup({ aoKey, teams, onRefresh }) {
	const [atmosphere, setAtmosphere] = useState("overcast");
	const displayName = PROVINCE_DISPLAY_NAMES[aoKey] || aoKey;
	const biome =
		PROVINCES[aoKey]?.biome ?? PROVINCE_BIOMES[aoKey] ?? "";
	const totalOps = teams.reduce(
		(acc, t) => acc + (t.operators || []).filter((op) => op.status !== "KIA" && op.status !== "Injured").length,
		0,
	);

	return (
		<div className='mb-6'>
			{/* AO header */}
			<div
				className='flex flex-wrap items-center gap-3 px-4 py-2 mb-3 border-b border-btn/20'
				style={{ background: "rgba(143,184,64,0.04)" }}>
				<span className='font-mono text-[9px] uppercase tracking-[0.4em] text-btn/60'>AO</span>
				<span className='font-mono text-[13px] font-bold uppercase tracking-widest text-btn/80'>
					{displayName}
				</span>
				{biome && (
					<span className='font-mono text-[8px] text-lines/40 uppercase tracking-widest'>
						{biome}
					</span>
				)}

				{/* Weather selector */}
				<div className='flex items-center gap-0.5 ml-auto'>
					{ATM_OPTS.map((a) => (
						<button
							key={a.key}
							onClick={() => setAtmosphere(a.key)}
							className='font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 transition-colors'
							style={{
								color: atmosphere === a.key ? a.color : "rgba(120,120,100,0.4)",
								borderBottom: atmosphere === a.key ? `2px solid ${a.color}` : "2px solid transparent",
								background: atmosphere === a.key ? `${a.color}12` : "transparent",
							}}>
							{a.code}
						</button>
					))}
				</div>

				<span className='font-mono text-[9px] text-lines tracking-widest'>
					{teams.length} team{teams.length !== 1 ? "s" : ""} · {totalOps} operators
				</span>
			</div>

			<div className='px-4'>
				{teams.map((team) => (
					<TeamSection
						key={team._id}
						team={team}
						atmosphere={atmosphere}
						biome={biome}
						provinceKey={aoKey}
						onRefresh={onRefresh}
					/>
				))}
			</div>
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ForceReadiness() {
	const { teams, fetchTeams } = useTeamsStore();
	const { fetchOperators } = useOperatorsStore();

	useEffect(() => {
		fetchTeams();
	}, [fetchTeams]);

	const refresh = async () => {
		await fetchTeams();
		await fetchOperators();
	};

	const { deployedGroups, standbyTeams } = useMemo(() => {
		const groups = {};
		const standby = [];
		(teams || []).forEach((team) => {
			if (team.AO) {
				if (!groups[team.AO]) groups[team.AO] = [];
				groups[team.AO].push(team);
			} else {
				standby.push(team);
			}
		});
		return { deployedGroups: groups, standbyTeams: standby };
	}, [teams]);

	const ciOperators = useMemo(() => {
		const result = [];
		(teams || []).forEach((team) => {
			(team.operators || []).forEach((op) => {
				if (op.status !== "KIA" && op.status !== "Injured") {
					if (getReadinessLevel(op.fatiguePoints ?? 0) === "CombatIneffective") {
						result.push(op);
					}
				}
			});
		});
		return result;
	}, [teams]);

	const hasDeployed = Object.keys(deployedGroups).length > 0;

	return (
		<div
			className='flex flex-col flex-1 min-h-0 overflow-hidden'
			style={{ fontFamily: "'Courier New','Lucida Console',monospace" }}>
			{/* Page header */}
			<div className='shrink-0 flex items-center gap-3 px-4 py-2 border-b border-lines/60 bg-neutral-950/80'>
				<span className='font-mono text-[10px] uppercase tracking-[0.4em] text-btn/60'>◈</span>
				<span className='font-mono text-[12px] font-bold uppercase tracking-widest text-fontz'>
					Force Readiness
				</span>
				<span className='font-mono text-[9px] text-lines tracking-widest ml-auto flex items-center gap-3'>
					{ciOperators.length > 0 && (
						<span className='text-red-400/70'>{ciOperators.length} CI</span>
					)}
					{(teams || []).length} teams
				</span>
			</div>

			{/* Body */}
			<div className='flex-1 min-h-0 overflow-y-auto'>
				<CIBanner operators={ciOperators} />

				{/* Legend + key */}
				<div className='flex flex-wrap items-center gap-4 px-4 py-2 mt-4 mb-1'>
					{Object.entries(READINESS_META).map(([key, meta]) => (
						<div key={key} className='flex items-center gap-1.5'>
							<span className='w-2 h-2 rounded-full' style={{ background: meta.hex }} />
							<span className='font-mono text-[9px] uppercase tracking-widest text-lines'>
								{key === "CombatIneffective" ? "Combat Ineff." : meta.label}
							</span>
						</div>
					))}
					<span className='font-mono text-[8px] text-lines/30 ml-auto hidden sm:block'>
						Advance = execute mission · Rest Day = −{REST_RECOVERY}pt · Full Rest = reset · RTB = reset + clear AO
					</span>
				</div>

				{/* Deployed AO groups */}
				{hasDeployed ?
					Object.entries(deployedGroups).map(([aoKey, aoTeams]) => (
						<AOGroup key={aoKey} aoKey={aoKey} teams={aoTeams} onRefresh={refresh} />
					))
				:	<div className='flex flex-col items-center gap-3 py-16 text-center'>
						<div className='w-8 h-8 border border-lines/20 rotate-45' />
						<span className='font-mono text-[10px] uppercase tracking-[0.35em] text-lines'>
							No teams currently deployed
						</span>
					</div>
				}

				{/* Standby / FOB */}
				{standbyTeams.length > 0 && (
					<div className='mb-6'>
						<div
							className='flex items-center gap-3 px-4 py-2 mb-3 border-b border-lines/20'
							style={{ background: "rgba(0,0,0,0.2)" }}>
							<span className='font-mono text-[9px] uppercase tracking-[0.4em] text-lines/40'>FOB</span>
							<span className='font-mono text-[13px] font-bold uppercase tracking-widest text-lines/50'>
								Standby
							</span>
							<span className='font-mono text-[9px] text-lines/40 tracking-widest ml-auto'>
								{standbyTeams.length} team{standbyTeams.length !== 1 ? "s" : ""}
							</span>
						</div>
						<div className='px-4'>
							{standbyTeams.map((team) => (
								<TeamSection
									key={team._id}
									team={team}
									atmosphere='overcast'
									biome=''
									provinceKey=''
									onRefresh={refresh}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
