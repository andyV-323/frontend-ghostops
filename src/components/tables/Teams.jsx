import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@material-tailwind/react";
import {
	faPeopleGroup,
	faCaretDown,
	faCaretUp,
	faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
import { useTeamsStore } from "@/zustand";
import { PropTypes } from "prop-types";
import { useToggleExpand, useConfirmDialog } from "@/hooks";
import { ConfirmDialog, TeamView } from "@/components";
import { EditTeamForm, NewTeamForm } from "@/components/forms";
import { PROVINCES } from "@/config";

const Teams = ({ dataUpdated, openSheet }) => {
	const {
		teams,
		fetchTeams,
		fetchOperators,
		fetchVehiclesForTeams,
		assignRandomInjury,
		assignRandomKIAInjury,
		transferOperator,
		updateTeam,
		removeAllOperatorsFromTeams,
		addVehicleToTeam,
		removeVehicleFromTeam,
	} = useTeamsStore();
	const [expandedTeam, toggleExpand] = useToggleExpand();
	const userId = localStorage.getItem("userId");
	const [selectedOperator, setSelectedOperator] = useState(null);
	const [draggedOperator, setDraggedOperator] = useState(null);
	const [dragOverTeam, setDragOverTeam] = useState(null);
	const { isOpen, openDialog, closeDialog } = useConfirmDialog();
	const {
		isOpen: isRemoveAllOpen,
		openDialog: openRemoveAllDialog,
		closeDialog: closeRemoveAllDialog,
		confirmAction: confirmRemoveAll,
	} = useConfirmDialog();
	const allVehicles = useTeamsStore((s) => s.allVehicles);
	const fullVehicleList = useTeamsStore((s) => s.fullVehicleList);
	const [injuryType, setInjuryType] = useState("choice");
	// Check if device is mobile
	const isMobile =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		);
	const handleOperatorClick = (operator, e) => {
		e.stopPropagation();
		if (!operator) return;
		setSelectedOperator(operator);
		setInjuryType("choice");
		openDialog();
	};
	const handleAssignRandomInjury = (operatorId) => {
		assignRandomInjury(operatorId, userId);
	};

	const handleAssignRandomKIAInjury = (operatorId) => {
		assignRandomKIAInjury(operatorId, userId);
	};

	// Handle AO change for specific team
	const handleAOChange = async (teamId, newAO) => {
		try {
			const team = teams.find((t) => t._id === teamId);
			if (!team) return;

			// Update team's AO
			const updatedTeamData = {
				_id: teamId,
				createdBy: team.createdBy,
				name: team.name,
				AO: newAO,
				operators: team.operators.map((op) => op._id),
			};

			await updateTeam(updatedTeamData);
			await fetchTeams();
		} catch (error) {
			console.error("Error updating team AO:", error);
		}
	};

	// Desktop-only Drag and Drop Handlers
	const handleDragStart = (e, operator, sourceTeamId) => {
		if (isMobile) return;
		e.stopPropagation();
		setDraggedOperator({ operator, sourceTeamId });
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", "");
		e.target.style.opacity = "0.5";
	};

	const handleDragEnd = (e) => {
		if (isMobile) return;
		e.target.style.opacity = "1";
		setDraggedOperator(null);
		setDragOverTeam(null);
	};

	const handleDragOver = (e) => {
		if (isMobile) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDragEnter = (e, teamId) => {
		if (isMobile) return;
		e.preventDefault();
		if (draggedOperator && draggedOperator.sourceTeamId !== teamId) {
			setDragOverTeam(teamId);
		}
	};

	const handleDragLeave = (e) => {
		if (isMobile) return; // Disable on mobile
		if (!e.currentTarget.contains(e.relatedTarget)) {
			setDragOverTeam(null);
		}
	};

	const handleDrop = async (e, targetTeamId) => {
		if (isMobile) return; // Disable on mobile
		e.preventDefault();
		e.stopPropagation();

		if (!draggedOperator || draggedOperator.sourceTeamId === targetTeamId) {
			setDragOverTeam(null);
			setDraggedOperator(null);
			return;
		}

		const { operator, sourceTeamId } = draggedOperator;

		try {
			await transferOperator(operator._id, sourceTeamId, targetTeamId);
		} catch (error) {
			console.error("Error transferring operator:", error);
		}

		setDragOverTeam(null);
		setDraggedOperator(null);
	};

	useEffect(() => {
		fetchTeams();
		fetchOperators();
		fetchVehiclesForTeams();
	}, [fetchTeams, dataUpdated, fetchOperators, fetchVehiclesForTeams]);

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
										"Create a team or allow A.I to generate one for you.",
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
					{teams.length > 0 ?
						teams.map((team, index) => (
							<React.Fragment key={team._id || team.name || index}>
								{/* Main Team Row */}
								<tr
									className={`cursor-pointer bg-transparent border-b hover:bg-highlight transition-all duration-300 ${
										dragOverTeam === team._id ? "!bg-btn/50 border-btn " : ""
									}`}
									data-team-id={team._id}
									onClick={() => toggleExpand(index)}
									onDragOver={!isMobile ? handleDragOver : undefined}
									onDragEnter={
										!isMobile ? (e) => handleDragEnter(e, team._id) : undefined
									}
									onDragLeave={!isMobile ? handleDragLeave : undefined}
									onDrop={
										!isMobile ? (e) => handleDrop(e, team._id) : undefined
									}>
									<td className='px-6 py-4 font-medium text-gray-400 hover:text-white whitespace-nowrap'>
										{team.name}
									</td>

									<td className='px-6 py-4 flex flex-row'>
										<div className='flex -space-x-4 rtl:space-x-reverse'>
											{team.operators.slice(0, 4).map((operator) => (
												<img
													key={operator._id}
													className={`w-10 h-10 min-w-[2.5rem] border-2 border-lines rounded-full bg-highlight flex-shrink-0 ${
														!isMobile ?
															"cursor-grab active:cursor-grabbing"
														:	"cursor-pointer"
													}`}
													src={operator.image}
													alt={operator.callSign}
													title={
														isMobile ?
															`${operator.callSign} - Tap to assign injury`
														:	`${operator.callSign} - Drag to move to another team`
													}
													draggable={!isMobile}
													onDragStart={
														!isMobile ?
															(e) => handleDragStart(e, operator, team._id)
														:	undefined
													}
													onDragEnd={!isMobile ? handleDragEnd : undefined}
													onClick={(e) => {
														e.stopPropagation();
														if (isMobile) {
															handleOperatorClick(operator, e);
														}
													}}
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
											className={`p-4 bg-blk/50 text-gray-400 ${
												dragOverTeam === team._id ? "bg-white" : ""
											}`}
											data-team-id={team._id}
											onDragOver={!isMobile ? handleDragOver : undefined}
											onDragEnter={
												!isMobile ?
													(e) => handleDragEnter(e, team._id)
												:	undefined
											}
											onDragLeave={!isMobile ? handleDragLeave : undefined}
											onDrop={
												!isMobile ? (e) => handleDrop(e, team._id) : undefined
											}>
											<Button
												className='btn'
												onClick={() => {
													openSheet("bottom", <TeamView teamId={team._id} />);
												}}>
												TeamView
											</Button>

											<div className='flex flex-wrap gap-4 p-2'>
												{team.operators.map((operator) => (
													<div
														key={operator._id}
														className={`flex flex-col items-center ${
															!isMobile ?
																"cursor-grab active:cursor-grabbing"
															:	"cursor-pointer"
														}`}
														draggable={!isMobile}
														onDragStart={
															!isMobile ?
																(e) => handleDragStart(e, operator, team._id)
															:	undefined
														}
														onDragEnd={!isMobile ? handleDragEnd : undefined}
														onClick={(e) => handleOperatorClick(operator, e)}>
														<img
															className='w-16 h-16 border-2 border-lines hover:border-highlight/50 bg-highlight rounded-full hover:bg-highlight/50 transition-all'
															src={operator.image}
															alt={operator.callSign}
															title={
																isMobile ?
																	`${operator.callSign} - Tap to assign injury`
																:	`${operator.callSign} - Hold and drag to move or tap to assign injury`
															}
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
											{/* ASSETS SECTION */}
											<div className='mt-6'>
												<h2 className='mb-3 text-xs font-bold text-fontz'>
													Assets (Vehicles)
												</h2>

												{/* Assigned assets list */}
												<div className='flex flex-wrap gap-2 mb-3'>
													{(team.assets || []).length === 0 ?
														<p className='text-xs text-gray-400'>
															No assets assigned.
														</p>
													:	(team.assets || []).map((asset) => {
															const assetId =
																typeof asset === "object" ? asset._id : asset;
															const assetObj =
																typeof asset === "object" ? asset : (
																	fullVehicleList.find((v) => v._id === assetId)
																);

															return (
																<div
																	key={assetId}
																	className='flex items-center gap-2 bg-blk/40 border border-lines rounded-lg px-2 py-1'>
																	<span className='text-xs text-fontz'>
																		{(
																			assetObj?.nickName &&
																			assetObj.nickName !== "None"
																		) ?
																			assetObj.nickName
																		:	assetObj?.vehicle || "Unknown Vehicle"}
																		{assetObj?.condition ?
																			` • ${assetObj.condition}`
																		:	""}
																		{(
																			typeof assetObj?.remainingFuel ===
																			"number"
																		) ?
																			` • Fuel ${assetObj.remainingFuel}%`
																		:	""}
																	</span>

																	<button
																		type='button'
																		className='text-xs text-red-400 hover:text-red-200 transition-all'
																		onClick={(e) => {
																			e.stopPropagation();
																			removeVehicleFromTeam(assetId, team._id);
																		}}
																		title='Remove asset'>
																		✕
																	</button>
																</div>
															);
														})
													}
												</div>

												{/* Add asset dropdown (available vehicles only) */}
												<select
													className='bg-blk/50 border border-lines rounded-lg block w-full p-2.5 text-fontz outline-lines text-xs'
													onChange={(e) => {
														const selectedVehicleId = e.target.value;
														if (selectedVehicleId) {
															addVehicleToTeam(selectedVehicleId, team._id);
															e.target.value = "";
														}
													}}>
													<option value=''>
														-- Add an Asset (Available Vehicles) --
													</option>
													{allVehicles.map((v) => (
														<option
															key={v._id}
															value={v._id}>
															{v.nickName && v.nickName !== "None" ?
																`${v.nickName} - `
															:	""}
															{v.vehicle} • {v.condition} • Fuel{" "}
															{v.remainingFuel}%
															{v.isRepairing ? " • Repairing" : ""}
														</option>
													))}
												</select>

												<p className='text-[10px] text-gray-400 mt-2'>
													Vehicles are exclusive: assigning to a team removes
													them from the available pool.
												</p>
											</div>

											{/* AO Change Section */}
											<div className='mb-4 text-xs'>
												{/* Display Current AO Info */}
												{team.AO && PROVINCES[team.AO] && (
													<div className='bg-blk/30 rounded-lg p-2 mt-2'>
														<p className='text-fontz text-xs'>
															<strong>Current AO:</strong> {team.AO} -{" "}
															{PROVINCES[team.AO].biome}
														</p>
													</div>
												)}
												<h4 className='font-semibold text-fontz mb-2'>
													Change Area Of Operation
												</h4>
												<select
													className='bg-blk/50 border border-lines outline-lines rounded-lg block w-full p-2.5 text-fontz text-xs'
													value={team.AO || ""}
													onChange={(e) => {
														handleAOChange(team._id, e.target.value);
													}}>
													<option value=''>
														-- Select Area of Operations --
													</option>
													{Object.entries(PROVINCES).map(([key, province]) => (
														<option
															key={key}
															value={key}>
															{key} - {province.biome}
														</option>
													))}
												</select>
											</div>

											{/* Edit Team Button */}
											<FontAwesomeIcon
												className='cursor-pointer text-xl text-btn hover:text-white transition-all'
												icon={faUsersGear}
												onClick={() =>
													openSheet(
														"bottom",
														<EditTeamForm teamId={team._id} />,
														"Edit or Optimize Team",
														"Modify team details, choose or remove operators, or Generate a team using A.I.",
													)
												}
											/>
										</td>
									</tr>
								)}
							</React.Fragment>
						))
					:	<tr>
							<td
								colSpan='3'
								className='text-center py-4 text-gray-400'>
								Click the PeopleGroup icon to add your first team.
							</td>
						</tr>
					}
				</tbody>
			</table>

			{/* Desktop-only Drop Zone Indicator */}
			{!isMobile && draggedOperator && (
				<div className='fixed top-4 left-4 bg-black text-white px-3 py-1 rounded-lg shadow-lg z-50'>
					Moving {draggedOperator.operator.callSign} - Drop on target team
				</div>
			)}

			{isOpen && selectedOperator && (
				<ConfirmDialog
					isOpen={isOpen}
					closeDialog={closeDialog}
					selectedOperator={selectedOperator}
					onRandomInjury={() => {
						handleAssignRandomInjury(selectedOperator._id);
						closeDialog();
					}}
					onKIAInjury={() => {
						handleAssignRandomKIAInjury(selectedOperator._id);
						closeDialog();
					}}
					injuryType={injuryType}
				/>
			)}
			{/* Remove All Operators Confirmation */}
			<ConfirmDialog
				isOpen={isRemoveAllOpen}
				closeDialog={closeRemoveAllDialog}
				confirmAction={confirmRemoveAll}
				title='Remove All Operators'
				description='This will remove all operators from every team.'
				message="Are you sure? All team assignments will be cleared. Operators won't be deleted, just unassigned."
			/>
			<div className='flex justify-center'>
				<Button
					type='button'
					className='btn hover:bg-red-800 text-xs'
					onClick={() =>
						openRemoveAllDialog(async () => {
							await removeAllOperatorsFromTeams();
						})
					}>
					Clear All Teams
				</Button>
			</div>
		</div>
	);
};
// In ConfirmDialog.jsx
ConfirmDialog.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	closeDialog: PropTypes.func.isRequired,
	confirmAction: PropTypes.func,
	title: PropTypes.string,
	description: PropTypes.string,
	message: PropTypes.string,
	selectedOperator: PropTypes.object,
	onRandomInjury: PropTypes.func, // Remove .isRequired
	onKIAInjury: PropTypes.func, // Remove .isRequired
	injuryType: PropTypes.string,
};
Teams.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default Teams;
