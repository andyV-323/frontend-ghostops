/** @format */

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPeopleGroup,
	faCaretDown,
	faCaretUp,
	faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
import {
	getTeams,
	updateOperatorStatus,
	addInfirmaryEntry,
	addToMemorial,
} from "../../services/api"; // Import API functions
import { useNavigate } from "react-router-dom";
import { INJURIES } from "../../config/injuries";
import { removeOperatorFromTeams } from "../../services/api";

const Teams = ({ dataUpdated, refreshData }) => {
	const [teams, setTeams] = useState([]); // Stores fetched teams
	const [expandedTeam, setExpandedTeam] = useState(null);
	const navigate = useNavigate();
	const userId = localStorage.getItem("userId");

	// Toggle expand/collapse
	const toggleExpand = (index) => {
		setExpandedTeam(expandedTeam === index ? null : index);
	};

	// Fetch teams
	const fetchTeams = async () => {
		try {
			const teamsData = await getTeams();

			// ✅ Filter out injured/KIA operators from UI
			const updatedTeams = teamsData.map((team) => ({
				...team,
				operators: team.operators.filter(
					(op) => op.status !== "Injured" && op.status !== "KIA"
				),
			}));

			console.log("🟢 DEBUG: Updated teams ->", updatedTeams);
			setTeams(updatedTeams);
		} catch (error) {
			console.error("❌ ERROR fetching teams:", error);
		}
	};

	// ✅ Fetch teams when the component loads
	useEffect(() => {
		fetchTeams();
	}, [dataUpdated]);
	console.log(
		"🟢 DEBUG: userId from localStorage ->",
		localStorage.getItem("userId")
	);

	// ✅ Function to Assign a Random Injury
	const handleOperatorClick = async (operatorId) => {
		console.log(`🟢 DEBUG: Clicking operator ${operatorId}`);

		// Select a random injury
		const injury = INJURIES[Math.floor(Math.random() * INJURIES.length)];
		console.log(`🟢 DEBUG: Assigned Injury to ${operatorId}:`, injury);

		// Determine status (Injured or KIA)
		const status = injury.recoveryDays === "KIA" ? "KIA" : "Injured";
		console.log(`🟢 DEBUG: Status assigned -> ${status}`);

		let recoveryTime = 0;
		if (injury.recoveryDays === "KIA") {
			recoveryTime = 0; // ✅ For KIA, set recovery time to 0 or skip
		} else if (
			typeof injury.recoveryDays === "string" &&
			injury.recoveryDays.includes(" ")
		) {
			recoveryTime = parseInt(injury.recoveryDays.split(" ")[0]);
		} else if (Array.isArray(injury.recoveryHours)) {
			recoveryTime = Math.round(injury.recoveryHours[0] / 2.5);
		} else {
			console.warn("⚠️ WARNING: Invalid recovery time format:", injury);
		}

		// Prepare infirmary entry
		const infirmaryEntry = {
			createdBy: userId,
			operator: operatorId,
			injuryType: injury.injury,
			recoveryDays: status === "KIA" ? 0 : recoveryTime,
			injuredAt: new Date(),
		};
		const memorialEntry = {
			createdBy: userId,
			operator: operatorId,
			name: injury.injury,
			dateOfDeath: new Date(),
		};
		try {
			console.log(`🟢 DEBUG: Updating status for ${operatorId} to ${status}`);
			await updateOperatorStatus(operatorId, status);

			console.log(`🟢 DEBUG: Removing ${operatorId} from all teams`);
			await removeOperatorFromTeams(operatorId);
			// ✅ Trigger a refresh across the dashboard

			if (status === "Injured") {
				console.log(`🟢 DEBUG: Sending ${operatorId} to infirmary`);
				await addInfirmaryEntry(infirmaryEntry);
			}
			if (status === "KIA") {
				await updateOperatorStatus(operatorId, "KIA");

				await addToMemorial(memorialEntry);
			}

			console.log(`🟢 DEBUG: Refreshing teams`);
			refreshData();
			fetchTeams();
		} catch (error) {
			console.error("❌ ERROR processing injury:", error);
		}
	};

	return (
		<div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
			<table className='w-full text-md text-left text-fontz'>
				<thead className='text-md text-fontz uppercase bg-linear-to-r/oklch from-blk to-neutral-800'>
					<tr>
						<th
							scope='col'
							className='px-6 py-3'>
							&nbsp;
							<FontAwesomeIcon
								className='text-xl text-black rounded hover:text-white bg-btn hover:bg-highlight transition-all'
								icon={faPeopleGroup}
								onClick={(e) => {
									e.stopPropagation();
									navigate("/dashboard/newTeam", {});
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
							<>
								{/* Main Team Row */}
								<tr
									key={team.id}
									onClick={() => toggleExpand(index)}
									className='cursor-pointer bg-transparent border-b hover:bg-highlight transition-all duration-300'>
									<td className='px-6 py-4 font-medium text-gray-400 hover:text-white whitespace-nowrap'>
										{team.name}
									</td>
									<td className='px-6 py-4 flex flex-row'>
										<div className='flex -space-x-4 rtl:space-x-reverse'>
											{team.operators.slice(0, 4).map((operator, idx) => (
												<img
													key={operator._id}
													className='w-10 h-10 min-w-[2.5rem] border-2 border-lines rounded-full bg-highlight flex-shrink-0 cursor-pointer'
													src={operator.image}
													alt={operator.callSign}
													title={operator.callSign}
													onClick={(e) => {
														e.stopPropagation(); // Prevent expanding team when clicking operator
														handleOperatorClick(operator._id);
													}}
												/>
											))}
											{team.operators.length > 4 && (
												<a
													className='flex items-center justify-center w-10 h-10 text-xs font-medium text-white bg-gray-700 border-2 border-white rounded-full hover:bg-gray-600'
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
									<tr>
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
															handleOperatorClick(operator._id);
														}}>
														<img
															className={`w-16 h-16 border-2  
																${
																	operator.status === "Injured"
																		? "border-yellow-500 bg-yellow-500"
																		: operator.status === "KIA"
																		? "border-red-500 bg-red-500"
																		: "border-lines hover:border-highlight/50 \
																		bg-highlight rounded-full hover:bg-highlight/50"
																}`}
															src={operator.image}
															alt={operator.callSign}
															title={operator.callSign}
														/>
														<span className='text-sm mt-2'>
															{operator.callSign}
														</span>
													</div>
												))}
												<td>
													<FontAwesomeIcon
														className='flex flex-col cursor-pointer text-xl text-btn hover:text-white transition-all'
														icon={faUsersGear}
														onClick={(e) => {
															e.stopPropagation();
															navigate("/dashboard/editTeam", {
																state: { team },
															});
														}}
													/>
												</td>
											</div>
										</td>
									</tr>
								)}
							</>
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
		</div>
	);
};

export default Teams;
