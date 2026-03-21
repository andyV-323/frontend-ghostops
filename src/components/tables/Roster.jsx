// Roster.jsx — compact card grid + inline squad filter pills
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import {
	useOperatorsStore,
	useTeamsStore,
	useSheetStore,
	useSquadStore,
} from "@/zustand";
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

// ─── Team badge (reads teams from store) ──────────────────────
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
function OperatorCard({ operator, col2Value, openSheet, fetchTeams }) {
	const { setClickedOperator, setSelectedOperator } = useOperatorsStore();
	const status = getStatus(operator?.status);

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
						src={operator.imageKey || operator.image || "/ghost/Default.png"}
						alt={operator.callSign || "Operator"}
					/>
				</div>
				<span
					className={[
						"absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-blk",
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
			<span className={`font-mono text-[8px] tracking-widest uppercase ${status.text} leading-none`}>
				{status.label}
			</span>

			{/* Class / Role */}
			<span className='font-mono text-[8px] text-lines/40 truncate max-w-full text-center leading-none'>
				{col2Value(operator)}
			</span>

			{/* Team badge — click to reassign */}
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
	const [activeTab, setActiveTab] = useState("roster");
	const [activeSquadId, setActiveSquadId] = useState(null);

	const { operators, activeClasses, fetchOperators } = useOperatorsStore();
	const { teams, fetchTeams } = useTeamsStore();
	const { squads, fetchSquads } = useSquadStore();

	useEffect(() => {
		fetchOperators();
		fetchTeams();
		fetchSquads();
	}, [fetchOperators, fetchTeams, fetchSquads, dataUpdated]);

	const aviatorOperators = operators.filter((op) => op.aviator === true);
	const supportOperators = operators.filter((op) => op.support === true);
	const allRegular = operators.filter((op) => !op.support && !op.aviator);

	const regularOperators =
		activeSquadId ?
			allRegular.filter(
				(op) => op.squad === activeSquadId || op.squad?._id === activeSquadId,
			)
		:	allRegular;

	const currentOperators =
		activeTab === "roster" ? regularOperators
		: activeTab === "support" ? supportOperators
		: aviatorOperators;

	const isSpecialist = activeTab === "support" || activeTab === "aviator";
	const col2Value = (op) =>
		isSpecialist ? op.role || "—" : activeClasses[op._id] || op.class || "—";

	const newFormTitle =
		activeTab === "support" ? "New Enabler"
		: activeTab === "aviator" ? "New Aviator"
		: "New Operator";
	const newFormDesc =
		activeTab === "support" ?
			"Create a new enabler with advanced capabilities."
		: activeTab === "aviator" ?
			"Create a new aviator with flight training."
		:	"Customize an elite operator with background, class, loadout, and perks.";

	const emptyMsg =
		activeTab === "support" ? "No enablers found."
		: activeTab === "aviator" ? "No aviators found."
		: activeSquadId ? "No operators assigned to this squad."
		: "Click + to add your first operator.";

	const TABS = [
		{ id: "roster", label: "Operators", count: allRegular.length },
		{ id: "support", label: "Enablers", count: supportOperators.length },
		{ id: "aviator", label: "Aviation", count: aviatorOperators.length },
	];

	return (
		<div className='flex flex-col h-full'>
			{/* ── Type tabs + add button ─────────────────────────── */}
			<div className='shrink-0 flex items-center border-b border-lines/20 bg-blk/40 px-2 pt-1'>
				{TABS.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={[
							"font-mono text-[10px] tracking-widest uppercase px-3 py-2 border-b-2 transition-all duration-150",
							activeTab === tab.id ?
								"border-btn text-btn bg-btn/5"
							:	"border-transparent text-lines/40 hover:text-fontz hover:border-lines/30",
						].join(" ")}>
						{tab.label}
						<span className='ml-1 text-lines/30'>({tab.count})</span>
					</button>
				))}
				<div className='flex-1' />
				<button
					onClick={() =>
						openSheet("left", <NewOperatorForm />, newFormTitle, newFormDesc)
					}
					className='w-6 h-6 flex items-center justify-center bg-btn hover:bg-highlight text-blk rounded transition-colors mr-2 mb-1'
					title={newFormTitle}>
					<FontAwesomeIcon
						icon={faUserPlus}
						className='text-[9px]'
					/>
				</button>
			</div>

			{/* ── Squad filter pills — operators tab only ────────── */}
			{activeTab === "roster" && squads.length > 0 && (
				<div className='shrink-0 flex items-center gap-1.5 px-3 py-2 border-b border-lines/10 bg-blk/20 overflow-x-auto scrollbar-none'>
					<span className='font-mono text-[8px] tracking-[0.2em] text-lines/25 uppercase shrink-0'>
						Squad
					</span>
					<div className='w-px h-3 bg-lines/15 shrink-0' />
					<button
						onClick={() => setActiveSquadId(null)}
						className={[
							"shrink-0 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border transition-all",
							activeSquadId === null ?
								"text-btn border-btn/40 bg-btn/10"
							:	"text-lines/35 border-lines/15 hover:border-lines/30 hover:text-fontz",
						].join(" ")}>
						All
					</button>
					{squads.map((sq) => (
						<button
							key={sq._id}
							onClick={() =>
								setActiveSquadId(activeSquadId === sq._id ? null : sq._id)
							}
							className={[
								"shrink-0 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border transition-all",
								activeSquadId === sq._id ?
									"text-btn border-btn/40 bg-btn/10"
								:	"text-lines/35 border-lines/15 hover:border-lines/30 hover:text-fontz",
							].join(" ")}>
							{sq.name}
						</button>
					))}
				</div>
			)}

			{/* ── Card grid ─────────────────────────────────────── */}
			<div className='flex-1 min-h-0 overflow-y-auto p-3'>
				{currentOperators.length > 0 ? (
					<div className='grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2'>
						{currentOperators.map((operator) => (
							<OperatorCard
								key={operator._id}
								operator={operator}
								col2Value={col2Value}
								openSheet={openSheet}
								fetchTeams={fetchTeams}
							/>
						))}
					</div>
				) : (
					<div className='flex items-center justify-center h-32'>
						<p className='font-mono text-[10px] tracking-widest text-lines/25 uppercase text-center'>
							{emptyMsg}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

// ─── PropTypes ────────────────────────────────────────────────
TeamBadge.propTypes = {
	operator: PropTypes.object.isRequired,
};
OperatorCard.propTypes = {
	operator: PropTypes.object.isRequired,
	col2Value: PropTypes.func.isRequired,
	openSheet: PropTypes.func.isRequired,
	fetchTeams: PropTypes.func.isRequired,
};
TabbedRoster.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default TabbedRoster;
