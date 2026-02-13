// Desc: This component displays operators in a tabbed interface.
// Users can switch between viewing regular operators, support operators, and aviators.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { useOperatorsStore, useTeamsStore, useSheetStore } from "@/zustand"; // Fixed import
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import { NewOperatorForm, AssignTeamSheet } from "@/components/forms";
import { OperatorImageView } from "@/components";
import { Button } from "@material-tailwind/react";

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
		const team = teams.find((team) =>
			team.operators.some((op) => op._id === operatorId),
		);
		return team ? team.name : "Unassigned";
	};

	// Filter operators: aviators, specialists, and regular operators
	const aviatorOperators = operators.filter((op) => op.aviator === true);

	const supportOperators = operators.filter((op) => op.support === true);

	const regularOperators = operators.filter(
		(op) => op.support !== true && op.aviator !== true,
	);

	const currentOperators =
		activeTab === "roster" ? regularOperators
		: activeTab === "support" ? supportOperators
		: aviatorOperators;
	const isSupportTab = activeTab === "support";
	const isAviatorTab = activeTab === "aviator";

	const renderOperatorRow = (operator) => {
		const activeClass = activeClasses[operator._id] || operator.class;
		const teamName = getOperatorTeam(operator._id);

		return (
			<tr
				key={operator._id}
				className='bg-transparent border-b hover:bg-highlight'
				onClick={() => {
					setClickedOperator(operator);
					setSelectedOperator(operator._id);
					// Open image view sheet when operator row is clicked
					openSheet(
						"left",
						<OperatorImageView
							operator={operator}
							openSheet={openSheet}
						/>,
					);
				}}>
				<th
					scope='row'
					className='flex items-center px-4 md:px-6 py-4 text-gray-400 hover:text-fontz whitespace-nowrap'>
					<img
						className='w-8 h-8 rounded-full border border-lines bg-highlight md:w-10 md:h-10'
						src={operator.image || "/ghost/Default.png"}
						alt={operator.name || "Operator"}
						onError={(e) => (e.target.src = "/ghost/Default.png")}
					/>
					<div className='pl-3'>
						<div className='text-sm md:text-base font-semibold'>
							{operator.callSign || "Unknown Operator"}
						</div>
					</div>
				</th>
				<td className='px-4 md:px-6 py-4'>{activeClass || "Unknown"}</td>
				{/*<td className='px-4 md:px-6 py-4'>{operator.role || "No Role"}</td>*/}

				{/* Team Cell */}
				<td
					className='px-4 md:px-6 py-4 cursor-pointer hover:text-btn'
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
					<Button
						className={
							teamName === "Unassigned" ?
								"text-gray-400 bg-blk/40 hover:text-black hover:bg-btn"
							:	"text-gray-400 bg-highlight/40 hover:text-black hover:bg-btn"
						}>
						{teamName}
					</Button>
				</td>
				{/*<td className='px-4 md:px-6 py-4'>
					<div className='flex items-center'>
						<div
							className={`h-2.5 w-2.5 rounded-full ${
								operator.status === "Active" ? "bg-green-500"
								: operator.status === "Injured" ? "bg-yellow-500"
								: "bg-red-500"
							} me-2`}></div>
						{operator.status || "KIA"}
					</div>
				</td>*/}
			</tr>
		);
	};

	return (
		<div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
			{/** Tab Navigation **/}
			<div className='flex items-center justify-center w-full'>
				<button
					className={`px-4 py-2 font-medium text-sm bg-blk/80 border-4 border-highlight/80 rounded-l-lg ${
						activeTab === "roster" ? "text-black bg-btn" : (
							"font-medium text-white hover:bg-highlight/40 hover:text-white"
						)
					}`}
					onClick={() => setActiveTab("roster")}>
					Operators ({regularOperators.length})
				</button>
				<button
					className={`px-4 py-2 font-medium text-sm bg-blk/80 border-4 border-highlight/80 ${
						activeTab === "support" ? "text-black bg-btn" : (
							"font-medium text-white hover:bg-highlight/40 hover:text-white"
						)
					}`}
					onClick={() => setActiveTab("support")}>
					Support ({supportOperators.length})
				</button>

				<button
					className={`px-4 py-2 font-medium text-sm bg-blk/80 border-4 border-highlight/80 rounded-r-lg ${
						activeTab === "aviator" ? "text-black bg-btn" : (
							"font-medium text-white hover:bg-highlight/40 hover:text-white"
						)
					}`}
					onClick={() => setActiveTab("aviator")}>
					Aviators ({aviatorOperators.length})
				</button>
			</div>

			{/** Table Header **/}
			<h1 className='flex flex-col items-center text-lg text-fontz font-bold py-2'>
				{isSupportTab ?
					"Support Roster"
				: isAviatorTab ?
					"Aviator Roster"
				:	"Operator Roster"}
			</h1>

			<table className='w-full text-left text-gray-400'>
				<thead className='text-fontz uppercase bg-linear-to-r/oklch from-blk to-neutral-800'>
					<tr>
						<th className='px-4 md:px-6 py-3 flex flex-row'>
							<FontAwesomeIcon
								icon={faUserPlus}
								className='bg-btn rounded p-1 text-sm text-black hover:bg-highlight hover:text-white'
								onClick={() => {
									openSheet(
										"left",
										<NewOperatorForm />,
										isSupportTab ? "New Support"
										: isAviatorTab ? "New Aviator"
										: "New Operator",
										isSupportTab ?
											"Create a new support operator with advanced capabilities and specialized training."
										: isAviatorTab ?
											"Create a new aviator with flight training and aircraft assignments."
										:	"Customize an elite operator by selecting their background, class, loadout, and perks for optimal mission performance.",
									);
								}}
							/>
							&nbsp;CallSign
						</th>
						<th className='px-4 md:px-6 py-3'>Class</th>
						{/*<th className='px-4 md:px-6 py-3'>Role</th>*/}
						<th className='px-4 md:px-6 py-3'>Team</th>
						{/*<th className='px-4 md:px-6 py-3'>Status</th>*/}
					</tr>
				</thead>

				<tbody>
					{currentOperators.length > 0 ?
						currentOperators.map(renderOperatorRow)
					:	<tr>
							<td
								colSpan={isSupportTab || isAviatorTab ? "6" : "5"}
								className='text-center py-4 text-gray-400'>
								{isSupportTab ?
									"No support operators found. Promote operators to support status or add new specialists."
								: isAviatorTab ?
									"No aviators found. Add operators with aviator designation to see them here."
								:	"Click the UserPlus icon to add your first Operator"}
							</td>
						</tr>
					}
				</tbody>
			</table>
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
