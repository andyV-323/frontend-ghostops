import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPeopleGroup,
	faCaretDown,
	faCaretUp,
	faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
import { useTeamsStore } from "@/zustand";
import { PropTypes } from "prop-types";
import { useToggleExpand, useConfirmDialog } from "@/hooks";
import { ConfirmDialog } from "@/components";
import { EditTeamForm, NewTeamForm } from "@/components/forms";
import { PROVINCES } from "@/config";

const Teams = ({ dataUpdated, openSheet }) => {
	const { teams, fetchTeams, assignRandomInjury } = useTeamsStore();
	const [expandedTeam, toggleExpand] = useToggleExpand();
	const userId = localStorage.getItem("userId");
	const [selectedOperator, setSelectedOperator] = useState(null);
	const { isOpen, openDialog, closeDialog, confirmAction } = useConfirmDialog();

	const handleAssignRandomInjury = (operator) => {
		if (!operator) return; // Prevents errors if `operator` is undefined
		setSelectedOperator(operator);
		openDialog(() => {
			assignRandomInjury(operator._id, userId);
		});
	};

	useEffect(() => {
		fetchTeams();
	}, [fetchTeams, dataUpdated]);

	return (
		<div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
			<h1 className='flex flex-col items-center text-lg text-fontz font-bold'>
				Teams
			</h1>
			<table className='w-full text-md text-left text-fontz'>
				<thead className='text-md text-fontz uppercase bg-linear-to-r/oklch from-blk to-neutral-800'>
					<tr>
						<th
							scope='col'
							className='px-6 py-3'>
							<FontAwesomeIcon
								className='text-xl text-black rounded hover:text-white bg-btn hover:bg-highlight transition-all'
								icon={faPeopleGroup}
								onClick={() => {
									openSheet(
										"top",
										<NewTeamForm />,
										"New Team",
										"Create a team or allow A.I to generate one for you."
									);
								}}
							/>
							&nbsp; Team
						</th>
						<th
							scope='col'
							className='px-6 py-3'>
							Operators
						</th>
					</tr>
				</thead>
				<tbody>
					{teams.length > 0 ? (
						teams.map((team, index) => (
							<React.Fragment key={team._id || team.name || index}>
								{/* Main Team Row */}
								<tr
									onClick={() => toggleExpand(index)}
									className='cursor-pointer bg-transparent border-b hover:bg-highlight transition-all duration-300'>
									<td className='px-6 py-4 font-medium text-gray-400 hover:text-white whitespace-nowrap'>
										{team.name}
										{/* Show AO in the team name row for quick reference */}
										{team.AO && (
											<div className='text-xs text-gray-500 mt-1'>
												AO: {team.AO}
											</div>
										)}
									</td>

									<td className='px-6 py-4 flex flex-row'>
										<div className='flex -space-x-4 rtl:space-x-reverse'>
											{team.operators.slice(0, 4).map((operator) => (
												<img
													key={operator._id}
													className='w-10 h-10 min-w-[2.5rem] border-2 border-lines rounded-full bg-highlight flex-shrink-0 cursor-pointer'
													src={operator.image}
													alt={operator.callSign}
													title={operator.callSign}
												/>
											))}
											{team.operators.length > 4 && (
												<a
													className='flex items-center justify-center w-10 h-10 text-xs font-medium text-fontz bg-blk border-2 border-lines rounded-full hover:bg-gray-600'
													href='#'>
													+{team.operators.length - 4}
												</a>
											)}
										</div>

										<div className='flex justify-end items-end w-full'>
											<FontAwesomeIcon
												icon={expandedTeam === index ? faCaretUp : faCaretDown}
												className='text-gray-400 text-lg hover:text-white transition-all'
											/>
										</div>
									</td>
								</tr>

								{/* Expanded Section */}
								{expandedTeam === index && (
									<tr key={`expanded-${team._id || team.name || index}`}>
										<td
											colSpan='3'
											className='p-4 bg-blk/50 text-gray-400 '>
											<div className='flex flex-wrap gap-4 p-2'>
												{team.operators.map((operator) => (
													<div
														key={operator._id}
														className='flex flex-col items-center cursor-pointer'
														onClick={(e) => {
															e.stopPropagation();
															handleAssignRandomInjury(operator);
														}}>
														<img
															className={
																"w-16 h-16 border-2 border-lines hover:border-highlight/50 bg-highlight rounded-full hover:bg-highlight/50"
															}
															src={operator.image}
															alt={operator.callSign}
															title={operator.callSign}
														/>
														<span className='text-sm mt-2'>
															{operator.callSign}
														</span>
													</div>
												))}
											</div>
										</td>
									</tr>
								)}

								{expandedTeam === index && (
									<tr>
										<td
											colSpan='3'
											className='text-center bg-blk/50 py-2'>
											{/* Show THIS team's AO, not the global store AO */}
											{team.AO && PROVINCES[team.AO] && (
												<div className='mb-4'>
													<div className='bg-blk/50 rounded-lg p-3'>
														<h3 className='text-lg font-semibold text-fontz mb-2'>
															Area Of Operation: {team.AO}
														</h3>
														<p className='text-fontz mb-2'>
															Biome: {PROVINCES[team.AO].biome}
														</p>
													</div>
												</div>
											)}
											<FontAwesomeIcon
												className='cursor-pointer text-xl text-btn hover:text-white transition-all'
												icon={faUsersGear}
												onClick={() =>
													openSheet(
														"bottom",
														<EditTeamForm teamId={team._id} />,
														"Edit or Optimize Team",
														"Modify team details, choose or remove operators, or Generate a team using A.I."
													)
												}
											/>
										</td>
									</tr>
								)}
							</React.Fragment>
						))
					) : (
						<tr>
							<td
								colSpan='3'
								className='text-center py-4 text-gray-400'>
								Loading teams...
							</td>
						</tr>
					)}
				</tbody>
			</table>
			{isOpen && selectedOperator && (
				<ConfirmDialog
					isOpen={isOpen}
					closeDialog={closeDialog}
					confirmAction={confirmAction}
					title='Confirm Operator Casualty'
					description='Assign a random injury to the selected operator. The severity of the injury will determine whether they are wounded or KIA.'
					message={`Are you sure you want to proceed? ${selectedOperator.callSign} may suffer injuries requiring recovery time or may be declared KIA.`}
				/>
			)}
		</div>
	);
};

Teams.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};
export default Teams;
