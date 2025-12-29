// Desc: This component displays operators in a tabbed interface.
// Users can switch between viewing regular operators, specialist operators, and aviators.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faUserPen } from "@fortawesome/free-solid-svg-icons";
import { useOperatorsStore, useTeamsStore, useSheetStore } from "@/zustand"; // Fixed import
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import {
	NewOperatorForm,
	EditOperatorForm,
	AssignTeamSheet,
} from "@/components/forms";
import { Button } from "@material-tailwind/react";

const TabbedRoster = ({
	operators = [],
	setClickedOperator,
	dataUpdated,
	openSheet,
}) => {
	const [activeTab, setActiveTab] = useState("roster");
	const { activeClasses, setSelectedOperator, fetchOperators } =
		useOperatorsStore();
	const { teams, fetchTeams } = useTeamsStore();

	useEffect(() => {
		fetchOperators();
		fetchTeams();
	}, [fetchOperators, fetchTeams, dataUpdated]);

	const getOperatorTeam = (operatorId) => {
		const team = teams.find((team) =>
			team.operators.some((op) => op._id === operatorId)
		);
		return team ? team.name : "Unassigned";
	};

	// Filter operators: aviators, specialists, and regular operators
	const aviatorOperators = operators.filter(
		(operator) => operator.aviator === true
	);

	const specialistOperators = operators.filter(
		(operator) => operator.specialist === true && operator.aviator !== true
	);

	const regularOperators = operators.filter(
		(operator) => operator.specialist !== true && operator.aviator !== true
	);

	const currentOperators =
		activeTab === "roster"
			? regularOperators
			: activeTab === "specialist"
			? specialistOperators
			: aviatorOperators;
	const isSpecialistTab = activeTab === "specialist";
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
				{isSpecialistTab && (
					<td className='px-4 md:px-6 py-4'>
						<span className='text-gray-400 text-md font-medium px-2.5 py-0.5 rounded'>
							{operator.specialization || "No Specialization"}
						</span>
					</td>
				)}
				{isAviatorTab && (
					<td className='px-4 md:px-6 py-4'>
						<span className='text-gray-400 text-md font-medium px-2.5 py-0.5 rounded'>
							{operator.specialization}
						</span>
					</td>
				)}
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
							`Assign ${operator.callSign} to a team or remove from current team.`
						);
					}}>
					<Button
						className={
							teamName === "Unassigned"
								? "text-gray-400 bg-blk/40 hover:text-black hover:bg-btn"
								: "text-gray-400 bg-highlight/40 hover:text-black hover:bg-btn"
						}>
						{teamName}
					</Button>
				</td>
				<td className='px-4 md:px-6 py-4'>
					<div className='flex items-center'>
						<div
							className={`h-2.5 w-2.5 rounded-full ${
								operator.status === "Active"
									? "bg-green-500"
									: operator.status === "Injured"
									? "bg-yellow-500"
									: "bg-red-500"
							} me-2`}></div>
						{operator.status || "KIA"}
					</div>
				</td>
				<td>
					<FontAwesomeIcon
						className='text-btn text-lg cursor-pointer hover:text-blk/50'
						icon={faUserPen}
						onClick={(e) => {
							e.stopPropagation();
							openSheet(
								"right",
								<EditOperatorForm operator={operator} />,
								isSpecialistTab
									? "Edit Specialist"
									: isAviatorTab
									? "Edit Aviator"
									: "Edit Operator",
								isSpecialistTab
									? "Edit the specialist operator's info and specialization."
									: isAviatorTab
									? "Edit the aviator's info and aircraft assignment."
									: "Edit the operator's info."
							);
						}}
					/>
				</td>
			</tr>
		);
	};

	return (
		<div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
			{/** Tab Navigation **/}
			<div className='flex'>
				<button
					className={`px-4 py-2 font-medium text-sm bg-blk/80 border-4 border-highlight/80 rounded-l-lg ${
						activeTab === "roster"
							? "text-black bg-btn"
							: "font-medium text-white hover:bg-highlight/40 hover:text-white"
					}`}
					onClick={() => setActiveTab("roster")}>
					Operators ({regularOperators.length})
				</button>
				<button
					className={`px-4 py-2 font-medium text-sm bg-blk/80 border-4 border-highlight/80 ${
						activeTab === "specialist"
							? "text-black bg-btn"
							: "font-medium text-white hover:bg-highlight/40 hover:text-white"
					}`}
					onClick={() => setActiveTab("specialist")}>
					Specialists ({specialistOperators.length})
				</button>
				<button
					className={`px-4 py-2 font-medium text-sm bg-blk/80 border-4 border-highlight/80 rounded-r-lg ${
						activeTab === "aviator"
							? "text-black bg-btn"
							: "font-medium text-white hover:bg-highlight/40 hover:text-white"
					}`}
					onClick={() => setActiveTab("aviator")}>
					Aviators ({aviatorOperators.length})
				</button>
			</div>

			{/** Table Header **/}
			<h1 className='flex flex-col items-center text-lg text-fontz font-bold py-2'>
				{isSpecialistTab
					? "Specialist Roster"
					: isAviatorTab
					? "Aviator Roster"
					: "Operator Roster"}
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
										isSpecialistTab
											? "New Specialist"
											: isAviatorTab
											? "New Aviator"
											: "New Operator",
										isSpecialistTab
											? "Create a new specialist operator with advanced capabilities and specialized training."
											: isAviatorTab
											? "Create a new aviator with flight training and aircraft assignments."
											: "Customize an elite operator by selecting their background, class, loadout, and perks for optimal mission performance."
									);
								}}
							/>
							&nbsp;CallSign
						</th>
						<th className='px-4 md:px-6 py-3'>Class</th>
						{isSpecialistTab && (
							<th className='px-4 md:px-6 py-3'>Specialization</th>
						)}
						{isAviatorTab && (
							<th className='px-4 md:px-6 py-3'>Specialization</th>
						)}
						<th className='px-4 md:px-6 py-3'>Team</th>
						<th className='px-4 md:px-6 py-3'>Status</th>
						<th>Edit</th>
					</tr>
				</thead>

				<tbody>
					{currentOperators.length > 0 ? (
						currentOperators.map(renderOperatorRow)
					) : (
						<tr>
							<td
								colSpan={isSpecialistTab || isAviatorTab ? "6" : "5"}
								className='text-center py-4 text-gray-400'>
								{isSpecialistTab
									? "No specialist operators found. Promote operators to specialist status or add new specialists."
									: isAviatorTab
									? "No aviators found. Add operators with aviator designation to see them here."
									: "Click the UserPlus icon to add your first Operator"}
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};

TabbedRoster.propTypes = {
	operators: PropTypes.array,
	setClickedOperator: PropTypes.func,
	setSelectedClass: PropTypes.func,
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default TabbedRoster;
