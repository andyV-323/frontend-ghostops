import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCaretDown,
	faCaretUp,
	faCheck,
	faXmark,
	faPenSquare,
	faPersonRifle,
} from "@fortawesome/free-solid-svg-icons";
import { PropTypes } from "prop-types";
import { useToggleExpand } from "@/hooks";
import { useMissionsStore } from "@/zustand";
import { NewMissionForm, EditMissionForm } from "../forms";

const OperationsBoard = ({ dataUpdated, openSheet }) => {
	const { missions, fetchMissions, updateMission, deleteMission } =
		useMissionsStore();
	const [expandedMission, toggleExpand] = useToggleExpand();

	// Fetch missions
	useEffect(() => {
		fetchMissions();
	}, [dataUpdated]);

	const getStatusColor = (status) => {
		switch (status) {
			case "In Progress":
				return "text-yellow-400";
			case "Completed":
				return "text-green-400";
			case "Failed":
				return "text-red-400";
			default:
				return "text-gray-400";
		}
	};

	return (
		<div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
			<h1 className='flex flex-col items-center text-lg text-fontz font-bold'>
				Operations Board
			</h1>
			<table className='w-full text-sm text-left text-gray-400'>
				<thead className='text-md text-fontz uppercase bg-linear-to-r/oklch from-blk to-neutral-800'>
					<tr>
						<th className='px-4 md:px-6 py-3'>
							<FontAwesomeIcon
								className='text-xl text-black rounded hover:text-white bg-btn hover:bg-highlight transition-all cursor-pointer'
								icon={faPersonRifle}
								onClick={() => {
									openSheet(
										"top",
										<NewMissionForm
											onComplete={() => {
												fetchMissions();
											}}
										/>,
										"New Mission",
										"Create a new mission and assign teams with roles."
									);
								}}
							/>
							&nbsp; Name
						</th>
						<th className='px-4 md:px-6 py-3'>Status</th>
						<th className='px-4 md:px-6 py-3'>Location</th>
						<th className='px-4 md:px-6 py-3'>Teams</th>
						<th className='px-4 md:px-6 py-3'>Action</th>
					</tr>
				</thead>
				<tbody>
					{missions.length > 0 ? (
						missions.map((mission, index) => {
							return (
								<React.Fragment key={mission._id || index}>
									{/** Main Row **/}
									<tr
										onClick={() => toggleExpand(index)}
										className='cursor-pointer bg-transparent border-b hover:bg-highlight transition-all duration-300'>
										<th
											scope='row'
											className='px-4 md:px-6 py-4 text-gray-400 hover:text-fontz whitespace-nowrap'>
											<div className='text-sm md:text-base font-semibold'>
												{mission.name}
											</div>
										</th>
										<td
											className={`px-4 md:px-6 py-4 font-medium ${getStatusColor(
												mission.status
											)}`}>
											{mission.status}
										</td>
										<td className='px-4 md:px-6 py-4'>
											{mission.location || "N/A"}
										</td>
										<td className='px-4 md:px-6 py-4'>
											{mission.teams?.length || 0} Team
											{mission.teams?.length !== 1 && "s"}
										</td>
										<td className='px-4 md:px-6 py-4 flex justify-between items-center gap-2'>
											<button
												onClick={(e) => {
													e.stopPropagation();
													openSheet(
														"right",
														<EditMissionForm
															mission={mission}
															onComplete={() => {
																fetchMissions();
															}}
														/>,
														"Edit Mission",
														"Update mission details, teams, and roles."
													);
												}}
												className='text-lg text-blue-400 hover:text-blue-300'>
												<FontAwesomeIcon icon={faPenSquare} />
											</button>
											<button
												onClick={(e) => {
													e.stopPropagation();
													updateMission(mission._id, {
														...mission,
														teams: mission.teams.map((t) => t._id || t),
														teamRoles: mission.teamRoles || [],
														status: "Completed",
													});
												}}
												className='text-lg text-green-400 hover:text-green-300'>
												<FontAwesomeIcon icon={faCheck} />
											</button>
											<button
												onClick={(e) => {
													e.stopPropagation();
													deleteMission(mission._id);
												}}
												className='text-lg text-red-400 hover:text-red-300'>
												<FontAwesomeIcon icon={faXmark} />
											</button>
											<FontAwesomeIcon
												icon={
													expandedMission === index ? faCaretUp : faCaretDown
												}
												className='text-gray-400 text-lg hover:text-white transition-all'
											/>
										</td>
									</tr>
									{/** Expanded Row (Mission Details) **/}
									{expandedMission === index && (
										<tr key={`expanded-${mission._id || index}`}>
											<td
												colSpan={5}
												className='p-6 bg-blk/50 text-gray-400'>
												<div className='flex flex-col gap-4'>
													{/* Mission Status and Location */}
													<div className='flex gap-6 text-sm'>
														<div>
															<span className='text-gray-500'>Status: </span>
															<span
																className={`font-semibold ${getStatusColor(
																	mission.status
																)}`}>
																{mission.status}
															</span>
														</div>
														<div>
															<span className='text-gray-500'>Location: </span>
															<span className='text-fontz'>
																{mission.location || "N/A"}
															</span>
														</div>
													</div>

													{/* Assigned Teams */}
													<div>
														<h3 className='text-sm font-bold text-fontz mb-3 uppercase tracking-wider'>
															Assigned Teams
														</h3>
														<div className='border-t border-lines pt-3'>
															{mission.teams && mission.teams.length > 0 ? (
																<div className='space-y-4'>
																	{mission.teams.map((team) => {
																		// Find team role if it exists
																		const teamRole = mission.teamRoles?.find(
																			(tr) =>
																				(tr.teamId?._id || tr.teamId) ===
																				(team._id || team)
																		);

																		return (
																			<div
																				key={team._id || team}
																				className='border-b border-lines/30 pb-3 last:border-0'>
																				<div className='flex items-center gap-2 mb-2'>
																					<h4 className='text-fontz font-bold uppercase'>
																						{team.name || "Unknown Team"}
																					</h4>
																					<span className='text-xs text-gray-500'>
																						({team.operators?.length || 0}{" "}
																						operators)
																					</span>
																				</div>
																				{teamRole?.role && (
																					<div className='text-xs text-gray-500 mb-1'>
																						<span className='text-gray-500'>
																							Role:{" "}
																						</span>
																						<span className='text-gray-400'>
																							{teamRole.role}
																						</span>
																					</div>
																				)}
																				<div className='text-xs text-gray-500 mb-1'>
																					<span className='text-gray-500'>
																						Location:{" "}
																					</span>
																					<span className='text-gray-400'>
																						{team.AO || "N/A"}
																					</span>
																				</div>
																				<div className='text-xs'>
																					<span className='text-gray-500'>
																						Operators:{" "}
																					</span>
																					<span className='text-gray-400'>
																						{team.operators &&
																						team.operators.length > 0
																							? team.operators
																									.map(
																										(op) => op.callSign || op
																									)
																									.join(", ")
																							: "None assigned"}
																					</span>
																				</div>
																			</div>
																		);
																	})}
																</div>
															) : (
																<p className='text-xs text-gray-500'>
																	No teams assigned
																</p>
															)}
														</div>
													</div>

													{/* Notes */}
													{mission.notes && (
														<div>
															<h3 className='text-sm font-semibold text-fontz mb-2'>
																Notes
															</h3>
															<p className='text-xs md:text-sm text-gray-400'>
																{mission.notes}
															</p>
														</div>
													)}
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							);
						})
					) : (
						<tr>
							<td
								colSpan={5}
								className='text-center py-4 text-gray-400'>
								No active missions...
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};

OperationsBoard.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func.isRequired,
};

export default OperationsBoard;
