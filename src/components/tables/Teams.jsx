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
	const { teams, fetchTeams, assignRandomInjury, transferOperator } =
		useTeamsStore();
	const [expandedTeam, toggleExpand] = useToggleExpand();
	const userId = localStorage.getItem("userId");
	const [selectedOperator, setSelectedOperator] = useState(null);
	const [draggedOperator, setDraggedOperator] = useState(null);
	const [dragOverTeam, setDragOverTeam] = useState(null);
	const [touchStart, setTouchStart] = useState(null);
	const [isDragging, setIsDragging] = useState(false);
	const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });
	const { isOpen, openDialog, closeDialog, confirmAction } = useConfirmDialog();

	const handleAssignRandomInjury = (operator) => {
		if (!operator) return;
		setSelectedOperator(operator);
		openDialog(() => {
			assignRandomInjury(operator._id, userId);
		});
	};

	// Desktop Drag and Drop Handlers
	const handleDragStart = (e, operator, sourceTeamId) => {
		e.stopPropagation();
		setDraggedOperator({ operator, sourceTeamId });
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", "");
		e.target.style.opacity = "0.5";
	};

	const handleDragEnd = (e) => {
		e.target.style.opacity = "1";
		setDraggedOperator(null);
		setDragOverTeam(null);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDragEnter = (e, teamId) => {
		e.preventDefault();
		if (draggedOperator && draggedOperator.sourceTeamId !== teamId) {
			setDragOverTeam(teamId);
		}
	};

	const handleDragLeave = (e) => {
		if (!e.currentTarget.contains(e.relatedTarget)) {
			setDragOverTeam(null);
		}
	};

	const handleDrop = async (e, targetTeamId) => {
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

	// Mobile Touch Handlers
	const handleTouchStart = (e, operator, sourceTeamId) => {
		const touch = e.touches[0];
		setTouchStart({
			x: touch.clientX,
			y: touch.clientY,
			operator,
			sourceTeamId,
			timestamp: Date.now(),
		});
	};

	const handleTouchMove = (e) => {
		if (!touchStart) return;

		const touch = e.touches[0];
		const deltaX = Math.abs(touch.clientX - touchStart.x);
		const deltaY = Math.abs(touch.clientY - touchStart.y);
		const deltaTime = Date.now() - touchStart.timestamp;

		// Start dragging if moved enough distance and held long enough
		if ((deltaX > 10 || deltaY > 10) && deltaTime > 200) {
			if (!isDragging) {
				setIsDragging(true);
				setDraggedOperator({
					operator: touchStart.operator,
					sourceTeamId: touchStart.sourceTeamId,
				});
			}

			setTouchPosition({ x: touch.clientX, y: touch.clientY });

			// Find element under touch point
			const elementBelow = document.elementFromPoint(
				touch.clientX,
				touch.clientY
			);
			const teamRow = elementBelow?.closest("[data-team-id]");

			if (teamRow) {
				const teamId = teamRow.getAttribute("data-team-id");
				if (teamId !== touchStart.sourceTeamId) {
					setDragOverTeam(teamId);
				}
			} else {
				setDragOverTeam(null);
			}
		}
	};

	const handleTouchEnd = async (e) => {
		if (!touchStart) return;

		if (isDragging && dragOverTeam && draggedOperator) {
			// Perform the drop operation
			try {
				await transferOperator(
					draggedOperator.operator._id,
					draggedOperator.sourceTeamId,
					dragOverTeam
				);
			} catch (error) {
				console.error("Error transferring operator:", error);
			}
		} else if (!isDragging) {
			// If not dragging, treat as a tap for injury assignment
			const deltaTime = Date.now() - touchStart.timestamp;
			if (deltaTime < 200) {
				handleAssignRandomInjury(touchStart.operator);
			}
		}

		// Reset all touch states
		setTouchStart(null);
		setIsDragging(false);
		setDraggedOperator(null);
		setDragOverTeam(null);
		setTouchPosition({ x: 0, y: 0 });
	};

	useEffect(() => {
		fetchTeams();
	}, [fetchTeams, dataUpdated]);

	// Handle passive event listeners for touch events
	useEffect(() => {
		const handleTouchMovePassive = (e) => {
			if (isDragging) {
				e.preventDefault();
			}
		};

		// Add non-passive event listener to prevent scrolling during drag
		document.addEventListener("touchmove", handleTouchMovePassive, {
			passive: false,
		});

		return () => {
			document.removeEventListener("touchmove", handleTouchMovePassive);
		};
	}, [isDragging]);

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
									className={`cursor-pointer bg-transparent border-b hover:bg-highlight transition-all duration-300 ${
										dragOverTeam === team._id ? "!bg-btn/35 border-btn " : ""
									}`}
									data-team-id={team._id}
									onClick={() => !isDragging && toggleExpand(index)}
									onDragOver={handleDragOver}
									onDragEnter={(e) => handleDragEnter(e, team._id)}
									onDragLeave={handleDragLeave}
									onDrop={(e) => handleDrop(e, team._id)}>
									<td className='px-6 py-4 font-medium text-gray-400 hover:text-white whitespace-nowrap'>
										{team.name}
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
													className='w-10 h-10 min-w-[2.5rem] border-2 border-lines rounded-full bg-highlight flex-shrink-0 cursor-grab active:cursor-grabbing'
													src={operator.image}
													alt={operator.callSign}
													title={`${operator.callSign} - Drag to move to another team`}
													draggable='true'
													onDragStart={(e) =>
														handleDragStart(e, operator, team._id)
													}
													onDragEnd={handleDragEnd}
													onTouchStart={(e) =>
														handleTouchStart(e, operator, team._id)
													}
													onTouchMove={handleTouchMove}
													onTouchEnd={handleTouchEnd}
													style={{ touchAction: isDragging ? "none" : "auto" }}
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
											onDragOver={handleDragOver}
											onDragEnter={(e) => handleDragEnter(e, team._id)}
											onDragLeave={handleDragLeave}
											onDrop={(e) => handleDrop(e, team._id)}>
											<div className='flex flex-wrap gap-4 p-2'>
												{team.operators.map((operator) => (
													<div
														key={operator._id}
														className='flex flex-col items-center cursor-grab active:cursor-grabbing'
														draggable='true'
														onDragStart={(e) =>
															handleDragStart(e, operator, team._id)
														}
														onDragEnd={handleDragEnd}
														onTouchStart={(e) =>
															handleTouchStart(e, operator, team._id)
														}
														onTouchMove={handleTouchMove}
														onTouchEnd={handleTouchEnd}
														onClick={(e) => {
															if (!isDragging) {
																e.stopPropagation();
																handleAssignRandomInjury(operator);
															}
														}}
														style={{
															touchAction: isDragging ? "none" : "auto",
														}}>
														<img
															className='w-16 h-16 border-2 border-lines hover:border-highlight/50 bg-highlight rounded-full hover:bg-highlight/50 transition-all'
															src={operator.image}
															alt={operator.callSign}
															title={`${operator.callSign} - Hold and drag to move or tap to assign injury`}
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

			{/* Enhanced Drop Zone Indicator for Mobile */}
			{draggedOperator && (
				<div className='fixed top-4 left-4 bg-black text-white px-3 py-1 rounded-lg shadow-lg z-50'>
					Moving {draggedOperator.operator.callSign} -{" "}
					{isDragging ? "Drop on target team" : "Drag to move to another team"}
				</div>
			)}

			{/* Mobile Drag Indicator */}
			{isDragging && (
				<div
					className='fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2'
					style={{
						left: touchPosition.x,
						top: touchPosition.y,
					}}>
					<div className='bg-black text-white px-2 py-1 rounded-full text-xs shadow-lg'>
						{draggedOperator?.operator.callSign}
					</div>
				</div>
			)}

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
