// Roster.jsx — compact card grid
import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useOperatorsStore, useTeamsStore, useSheetStore, useKitsStore } from "@/zustand";
import { getOperatorDisplayImage } from "@/utils/operatorImage";
import { PropTypes } from "prop-types";
import { NewOperatorForm, AssignTeamSheet } from "@/components/forms";
import { OperatorImageView } from "@/components";

// ─── Status config ────────────────────────────────────────────
const STATUS_MAP = {
	active: {
		label: "ACTIVE",
		dot: "bg-green-500",
		glow: "shadow-[0_0_5px_rgba(74,222,128,0.7)]",
		text: "text-green-500",
	},
	injured: {
		label: "WIA",
		dot: "bg-amber-400",
		glow: "shadow-[0_0_5px_rgba(251,191,36,0.7)]",
		text: "text-amber-400",
	},
	wounded: {
		label: "WIA",
		dot: "bg-amber-400",
		glow: "shadow-[0_0_5px_rgba(251,191,36,0.7)]",
		text: "text-amber-400",
	},
	kia: {
		label: "KIA",
		dot: "bg-red-500",
		glow: "shadow-[0_0_5px_rgba(239,68,68,0.7)]",
		text: "text-red-500",
	},
};
const getStatus = (s = "") => STATUS_MAP[s.toLowerCase()] ?? STATUS_MAP.kia;
// ─── Team badge ───────────────────────────────────────────────
function TeamBadge({ operator }) {
	const { teams } = useTeamsStore();
	const team = teams.find((t) =>
		t.operators.some((op) => op._id === operator._id),
	);
	return (
		<span className={team ? "text-btn" : "text-lines/35"}>
			{team ? team.name : "Unassigned"}
		</span>
	);
}

// ─── Operator card ────────────────────────────────────────────
function OperatorCard({ operatorId, openSheet, fetchTeams }) {
	const { operators, setClickedOperator, setSelectedOperator, activeClasses } =
		useOperatorsStore();
	const operator = operators.find((o) => o._id === operatorId);
	const { kits } = useKitsStore();
	if (!operator) return null;
	const status = getStatus(operator?.status);
	const avatarSrc = getOperatorDisplayImage(operator, kits);

	return (
		<div
			className='group relative flex flex-col items-center gap-1.5 p-3 rounded border border-lines/15 bg-blk/40 hover:bg-highlight/15 hover:border-lines/35 cursor-pointer transition-all duration-150'
			onClick={() => {
				setClickedOperator(operator);
				setSelectedOperator(operator._id);
				openSheet(
					"left",
					<OperatorImageView
						operator={operator}
						openSheet={openSheet}
					/>,
				);
			}}>
			{/* Avatar */}
			<div className='relative shrink-0'>
				<div className='w-12 h-12 rounded-full border border-lines/30 overflow-hidden bg-highlight'>
					<img
						className={[
							"w-full h-full object-cover object-top",
							operator.status === "KIA" ? "grayscale opacity-50" : "",
						].join(" ")}
						onError={(e) => {
							e.currentTarget.src = "/ghost/Default.png";
						}}
						src={avatarSrc}
						alt={operator.callSign || "Operator"}
					/>
				</div>
				<span
					className={[
						"absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border border-blk",
						status.dot,
						status.glow,
					].join(" ")}
				/>
			</div>

			{/* Callsign */}
			<span className='font-mono text-[10px] text-fontz group-hover:text-white truncate max-w-full text-center leading-none transition-colors'>
				{operator.callSign || "Unknown"}
			</span>

			{/* Status */}
			<span
				className={`font-mono text-[8px] tracking-widest uppercase ${status.text} leading-none`}>
				{status.label}
			</span>
			{/* Class */}
			<span className='font-mono text-[8px] text-lines/40 truncate max-w-full text-center leading-none'>
				{activeClasses[operator._id] || operator.class || "—"}
			</span>

			{/* Team badge */}
			<div
				className='w-full mt-0.5'
				onClick={(e) => {
					e.stopPropagation();
					openSheet(
						"bottom",
						<AssignTeamSheet
							operator={operator}
							onComplete={() => {
								fetchTeams();
								useSheetStore.getState().closeSheet();
							}}
						/>,
						"Assign to Team",
						`Assign ${operator.callSign} to a team or remove from current team.`,
					);
				}}>
				<span className='flex items-center justify-center gap-1 w-full font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded border border-lines/15 hover:border-btn hover:text-btn transition-colors cursor-pointer'>
					<TeamBadge operator={operator} />
					<FontAwesomeIcon
						icon={faChevronRight}
						className='text-[6px] opacity-40'
					/>
				</span>
			</div>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────
const TabbedRoster = ({ dataUpdated, openSheet }) => {
	const { operators, fetchOperators } = useOperatorsStore();
	const { fetchTeams } = useTeamsStore();
	const { fetchKits } = useKitsStore();

	useEffect(() => {
		fetchOperators();
		fetchTeams();
		fetchKits();
	}, [fetchOperators, fetchTeams, fetchKits, dataUpdated]);

	return (
		<div className='flex flex-col h-full'>
			{/* ── Header ──────────────────────────────────────── */}
			<div className='shrink-0 flex items-center border-b border-lines/20 bg-blk/40 px-3 py-2'>
				<span className='font-mono text-[10px] tracking-widest uppercase text-btn'>
					Operators
					<span className='ml-1 text-lines/30'>({operators.length})</span>
				</span>
				<div className='flex-1' />
				<button
					onClick={() =>
						openSheet(
							"left",
							<NewOperatorForm />,
							"New Operator",
							"Customize an elite operator with background, class, loadout, and perks.",
						)
					}
					className='w-6 h-6 flex items-center justify-center bg-btn hover:bg-highlight text-blk rounded transition-colors'
					title='New Operator'>
					<FontAwesomeIcon
						icon={faUserPlus}
						className='text-[9px]'
					/>
				</button>
			</div>

			{/* ── Card grid ─────────────────────────────────── */}
			<div className='flex-1 min-h-0 overflow-y-auto p-3'>
				{operators.length > 0 ?
					<div className='grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2'>
						{operators.map((operator) => (
							<OperatorCard
								key={operator._id}
								operatorId={operator._id}
								openSheet={openSheet}
								fetchTeams={fetchTeams}
							/>
						))}
					</div>
				:	<div className='flex items-center justify-center h-32'>
						<p className='font-mono text-[10px] tracking-widest text-lines/25 uppercase text-center'>
							Click + to add your first operator.
						</p>
					</div>
				}
			</div>
		</div>
	);
};

// ─── PropTypes ────────────────────────────────────────────────
TeamBadge.propTypes = { operator: PropTypes.object.isRequired };
OperatorCard.propTypes = {
	operatorId: PropTypes.string.isRequired,
	openSheet: PropTypes.func.isRequired,
	fetchTeams: PropTypes.func.isRequired,
};
TabbedRoster.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default TabbedRoster;
