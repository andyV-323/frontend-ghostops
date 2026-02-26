// TabbedRoster.jsx — redesigned to match UnifiedDashboard HUD aesthetic

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useOperatorsStore, useTeamsStore, useSheetStore } from "@/zustand";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import { NewOperatorForm, AssignTeamSheet } from "@/components/forms";
import { OperatorImageView } from "@/components";

// ─── Status config ────────────────────────────────────────────
const STATUS_MAP = {
	active: {
		label: "ACTIVE",
		dot: "bg-green-500",
		glow: "shadow-[0_0_6px_rgba(74,222,128,0.7)]",
	},
	injured: {
		label: "WIA",
		dot: "bg-amber-400",
		glow: "shadow-[0_0_6px_rgba(251,191,36,0.7)]",
	},
	wounded: {
		label: "WIA",
		dot: "bg-amber-400",
		glow: "shadow-[0_0_6px_rgba(251,191,36,0.7)]",
	},
	kia: {
		label: "KIA",
		dot: "bg-red-500",
		glow: "shadow-[0_0_6px_rgba(239,68,68,0.7)]",
	},
};

const getStatus = (s = "") => STATUS_MAP[s.toLowerCase()] ?? STATUS_MAP.kia;

// ─── Tab button ───────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
	return (
		<button
			onClick={onClick}
			className={[
				"font-mono text-[10px] tracking-widest uppercase px-4 py-2 border-b-2 transition-all duration-150",
				active ?
					"border-btn text-btn bg-btn/10"
				:	"border-transparent text-lines/40 hover:text-fontz hover:border-lines/30",
			].join(" ")}>
			{children}
		</button>
	);
}

// ─── Main component ───────────────────────────────────────────
const TabbedRoster = ({ dataUpdated, openSheet }) => {
	const [activeTab, setActiveTab] = useState("roster");

	const {
		operators,
		activeClasses,
		setSelectedOperator,
		fetchOperators,
		setClickedOperator,
	} = useOperatorsStore();

	const { teams, fetchTeams } = useTeamsStore();

	useEffect(() => {
		fetchOperators();
		fetchTeams();
	}, [fetchOperators, fetchTeams, dataUpdated]);

	const getOperatorTeam = (operatorId) => {
		const team = teams.find((t) =>
			t.operators.some((op) => op._id === operatorId),
		);
		return team ? team.name : "Unassigned";
	};

	const aviatorOperators = operators.filter((op) => op.aviator === true);
	const supportOperators = operators.filter((op) => op.support === true);
	const regularOperators = operators.filter((op) => !op.support && !op.aviator);

	const currentOperators =
		activeTab === "roster" ? regularOperators
		: activeTab === "support" ? supportOperators
		: aviatorOperators;

	const isSupportTab = activeTab === "support";
	const isAviatorTab = activeTab === "aviator";

	const tableTitle =
		isSupportTab ? "Support Roster"
		: isAviatorTab ? "Aviator Roster"
		: "Operator Roster";

	const newFormTitle =
		isSupportTab ? "New Support"
		: isAviatorTab ? "New Aviator"
		: "New Operator";

	const newFormDesc =
		isSupportTab ?
			"Create a new support operator with advanced capabilities and specialized training."
		: isAviatorTab ?
			"Create a new aviator with flight training and aircraft assignments."
		:	"Customize an elite operator by selecting their background, class, loadout, and perks.";

	const emptyMsg =
		isSupportTab ? "No support operators found."
		: isAviatorTab ? "No aviators found."
		: "Click the + icon to add your first operator.";

	return (
		<div className='flex flex-col h-full'>
			{/* ── Tab bar ── */}
			<div className='flex border-b border-lines/20 bg-blk/40 shrink-0'>
				<TabBtn
					active={activeTab === "roster"}
					onClick={() => setActiveTab("roster")}>
					Operators&nbsp;
					<span className='text-lines/40'>({regularOperators.length})</span>
				</TabBtn>
				<TabBtn
					active={activeTab === "support"}
					onClick={() => setActiveTab("support")}>
					Support&nbsp;
					<span className='text-lines/40'>({supportOperators.length})</span>
				</TabBtn>
				<TabBtn
					active={activeTab === "aviator"}
					onClick={() => setActiveTab("aviator")}>
					Aviators&nbsp;
					<span className='text-lines/40'>({aviatorOperators.length})</span>
				</TabBtn>
			</div>

			{/* ── Table ── */}
			<div className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden'>
				<table className='w-full text-left'>
					<thead className='sticky top-0 z-10 bg-blk/90 border-b border-lines/20'>
						<tr>
							<th className='px-4 py-3 font-mono text-[10px] tracking-widest text-lines/50 uppercase'>
								<div className='flex items-center gap-2'>
									<button
										onClick={() =>
											openSheet(
												"left",
												<NewOperatorForm />,
												newFormTitle,
												newFormDesc,
											)
										}
										className='w-6 h-6 flex items-center justify-center bg-btn hover:bg-highlight text-blk rounded transition-colors'
										title={newFormTitle}>
										<FontAwesomeIcon
											icon={faUserPlus}
											className='text-[10px]'
										/>
									</button>
									{tableTitle}
								</div>
							</th>
							<th className='px-4 py-3 font-mono text-[10px] tracking-widest text-lines/50 uppercase'>
								Class
							</th>
							<th className='px-4 py-3 font-mono text-[10px] tracking-widest text-lines/50 uppercase'>
								Team
							</th>
						</tr>
					</thead>

					<tbody>
						{currentOperators.length > 0 ?
							currentOperators.map((operator) => {
								const activeClass =
									activeClasses[operator._id] || operator.class;
								const teamName = getOperatorTeam(operator._id);
								const status = getStatus(operator?.status);

								return (
									<tr
										key={operator._id}
										className='group border-b border-lines/10 hover:bg-highlight/20 cursor-pointer transition-colors duration-150'
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
										{/* Callsign + avatar */}
										<td className='px-4 py-3'>
											<div className='flex items-center gap-3'>
												<div className='relative shrink-0'>
													<img
														className='w-9 h-9 rounded-full border border-lines/40 bg-highlight object-cover'
														src={operator.image || "/ghost/Default.png"}
														alt={operator.name || "Operator"}
														onError={(e) =>
															(e.target.src = "/ghost/Default.png")
														}
													/>
													{/* Status dot on avatar */}
													<span
														className={[
															"absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-blk",
															status.dot,
															status.glow,
														].join(" ")}
													/>
												</div>
												<div className='flex flex-col leading-none gap-1'>
													<span className='font-mono text-xs text-fontz group-hover:text-white transition-colors'>
														{operator.callSign || "Unknown"}
													</span>
													<span
														className={[
															"font-mono text-[8px] tracking-widest uppercase",
															status.dot === "bg-green-500" ? "text-green-500"
															: status.dot === "bg-amber-400" ? "text-amber-400"
															: "text-red-500",
														].join(" ")}>
														{status.label}
													</span>
												</div>
											</div>
										</td>

										{/* Class */}
										<td className='px-4 py-3 font-mono text-[11px] text-lines/60'>
											{activeClass || "—"}
										</td>

										{/* Team assign button */}
										<td
											className='px-4 py-3'
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
											<span
												className={[
													"inline-flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase",
													"px-2 py-1 rounded border transition-colors cursor-pointer",
													teamName === "Unassigned" ?
														"text-lines/40 border-lines/20 hover:border-btn hover:text-btn"
													:	"text-btn border-btn/30 bg-btn/10 hover:bg-btn/20",
												].join(" ")}>
												{teamName}
												<FontAwesomeIcon
													icon={faChevronRight}
													className='text-[8px] opacity-50'
												/>
											</span>
										</td>
									</tr>
								);
							})
						:	<tr>
								<td
									colSpan={3}
									className='py-12 text-center'>
									<p className='font-mono text-[10px] tracking-widest text-lines/30 uppercase'>
										{emptyMsg}
									</p>
								</td>
							</tr>
						}
					</tbody>
				</table>
			</div>
		</div>
	);
};

TabbedRoster.propTypes = {
	operators: PropTypes.array,
	setSelectedClass: PropTypes.func,
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default TabbedRoster;
