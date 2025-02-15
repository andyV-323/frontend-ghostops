/** @format */

import { useState, useEffect } from "react";
import { createTeam, getOperators } from "../../services/api"; // Import API functions
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context"; // Import Cognito auth
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@material-tailwind/react";
import { chatGPTApi } from "../../services/chatGPTApi";
import { TEAMS } from "../../config/teams";

const NewTeamForm = () => {
	const navigate = useNavigate();
	const auth = useAuth(); // Get auth context

	// State for team data
	const [team, setTeam] = useState({
		createdBy: "", // Set from authentication
		name: "",
		operators: [], // ✅ Changed to an array to store multiple operator IDs
	});

	// State for available operators
	const [operators, setOperators] = useState([]);

	const [aiTeam, setAITeam] = useState([]);
	const [selectedTeamType, setSelectedTeamType] = useState(""); // Track team type
	const [missionDescription, setMissionDescription] = useState(""); // Track mission description
	const [Loading, setLoading] = useState(false);

	// Fetch available operators
	// Fetch all operators but filter only "Active" ones for the dropdown
	useEffect(() => {
		const fetchOperators = async () => {
			try {
				const data = await getOperators();
				console.log("DEBUG: All Operators fetched from API:", data);

				// ✅ Only show active operators in dropdown
				const activeOperators = data.filter((op) => op.status === "Active");
				console.log("DEBUG: Filtered Active Operators:", activeOperators);

				setOperators(activeOperators); // Store only active operators for the dropdown
			} catch (error) {
				console.error("ERROR fetching operators:", error);
				setOperators([]); // Prevent dropdown from breaking
			}
		};

		fetchOperators();
	}, []);

	// Set `createdBy` from authentication
	useEffect(() => {
		if (auth.isAuthenticated && auth.user) {
			setTeam((prevTeam) => ({
				...prevTeam,
				createdBy: auth.user.profile.sub, // ✅ Use Cognito user ID
			}));
		}
	}, [auth.isAuthenticated, auth.user]);

	// Handle input changes
	const handleChange = (e) => {
		setTeam({ ...team, [e.target.name]: e.target.value });
	};

	// Handle operator selection
	const handleOperatorChange = (e) => {
		const selectedOperator = e.target.value;

		// ✅ Prevent adding duplicate operators
		if (!team.operators.includes(selectedOperator) && selectedOperator !== "") {
			setTeam((prevTeam) => ({
				...prevTeam,
				operators: [...prevTeam.operators, selectedOperator], // ✅ Add operator ID
			}));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			const teamData = {
				createdBy: team.createdBy,
				name: team.name.trim(), // Ensure name isn't empty
				operators: team.operators.length > 0 ? team.operators : [], // Ensure it's an array
			};

			console.log(
				"DEBUG: Team data being sent to API:",
				JSON.stringify(teamData, null, 2)
			);

			// Make sure required fields are present
			if (
				!teamData.createdBy ||
				!teamData.name ||
				teamData.operators.length === 0
			) {
				console.error("❌ ERROR: Missing required fields!", teamData);
				alert("Please fill in all required fields before submitting.");
				return;
			}

			// Send request
			await createTeam(teamData);
			alert("✅ Team created successfully!");
			navigate("/dashboard");
		} catch (error) {
			console.error(
				"❌ ERROR creating team:",
				error.response ? error.response.data : error.message
			);
			alert("❌ Failed to create team. Check the console for details.");
		}
	};
	const backBtn = () => navigate("/dashboard");

	// Handle AI Team Generation
	const handleGenerateTeam = async () => {
		setLoading(true);
		try {
			if (!selectedTeamType && !missionDescription.trim()) {
				alert("Please select a team type or provide a mission description.");
				return;
			}

			const response = await chatGPTApi("team", {
				teamType: selectedTeamType || null,
				missionDescription: missionDescription || null,
				availableOperators: operators.map((op) => ({
					id: op._id,
					name: op.callSign,
					role: op.className,
					secondaryRole: op.secondaryClass,
				})), // Sending available operators to AI
			});

			if (response && response.Response) {
				const generatedTeam = response.Response;

				// Extract only valid operator IDs from AI response
				const suggestedOperators = operators.filter((op) =>
					generatedTeam.includes(op.callSign)
				);

				setAITeam(suggestedOperators);
				setTeam((prevTeam) => ({
					...prevTeam,
					operators: suggestedOperators.map((op) => op._id), // Store operator IDs in the team
				}));
			} else {
				throw new Error("Invalid AI response format");
			}
		} catch (error) {
			console.error("❌ ERROR generating team:", error);
			alert("Failed to generate team. Check console for details.");
		} finally {
			setLoading(false); // Hide spinner after response
		}
	};
	return (
		<section className=' min-h-screen bg-linear-45 from-blk via-bckground to-neutral-800'>
			<div className='py-8 px-4 mx-auto max-w-2xl lg:py-16'>
				<br />
				<h2 className='mb-4 text-xl font-bold text-fontz'>
					<FontAwesomeIcon
						icon={faArrowLeftLong}
						className='text-2xl text-btn hover:text-white '
						onClick={backBtn}
						alt='Back'
					/>
					&nbsp;Add a new Team
				</h2>

				<form onSubmit={handleSubmit}>
					<div className='grid gap-4 sm:grid-cols-2 sm:gap-6'>
						{/* Team Name Input */}
						<div className='sm:col-span-2'>
							<label className='block mb-2 text-xl font-bold text-fontz'>
								Team Name
							</label>
							<input
								type='text'
								name='name'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5'
								placeholder='Enter team name'
								value={team.name}
								onChange={handleChange}
								required
							/>
						</div>

						{/* Operators Dropdown */}
						<h2 className='mb-4 text-xl font-bold text-fontz'>Operators</h2>

						<select
							className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5'
							onChange={handleOperatorChange}
							value=''>
							<option value=''>-- Select an Operator --</option>
							{operators.map((operator) => (
								<option
									key={operator._id}
									value={operator._id}>
									{operator.callSign} - {operator.className}{" "}
									{operator.secondaryClass
										? `(${operator.secondaryClass})`
										: ""}
								</option>
							))}
						</select>

						{/* Display Selected Operators */}
						{team.operators.length > 0 && (
							<div className='sm:col-span-2'>
								<h3 className='mb-2 text-lg font-semibold text-fontz'>
									Selected Operators:
								</h3>
								<ul className='list-disc pl-4 text-fontz'>
									{team.operators.map((opId) => {
										const op = operators.find((o) => o._id === opId);
										return (
											<li
												key={opId}
												className='flex justify-between items-center'>
												{op ? op.callSign : "Unknown Operator"}
												<FontAwesomeIcon
													icon={faXmark}
													className='text-2xl text-btn hover:text-white'
													type='button'
													onClick={() =>
														setTeam((prevTeam) => ({
															...prevTeam,
															operators: prevTeam.operators.filter(
																(id) => id !== opId
															),
														}))
													}>
													Remove
												</FontAwesomeIcon>
											</li>
										);
									})}
								</ul>
							</div>
						)}
					</div>
					<br />
					<div className=' p-5 border border-lines text-fontz grid gap-4 sm:grid-cols-2 sm:gap-6'>
						{/* Team Type Selection */}
						<h2 className=' text-md  font-bold'>Team Type</h2>
						<select
							className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5'
							value={selectedTeamType}
							onChange={(e) => setSelectedTeamType(e.target.value)}>
							<option value=''>-- Select Team Type (Optional)--</option>
							{TEAMS.map((type) => (
								<option
									key={type}
									value={type}>
									{type}
								</option>
							))}
						</select>
						<h1 className='flex flex-col items-center'>or</h1>
						<div></div>

						{/* Mission Description Input */}
						<label className='text-md font-bold'>Mission Description</label>
						<textarea
							className='flex flex-col items-center text-md text-blk border border-lines bg-white h-25'
							value={missionDescription}
							onChange={(e) => setMissionDescription(e.target.value)}
							placeholder='Provide details about the mission to get AI recommendations...'
						/>
						<br />
						{/* Button to Generate AI Team */}
						<Button
							type='button'
							className='bg-transparent flex flex-col items-center '
							onClick={handleGenerateTeam}>
							<img
								src='/icons/ai.svg'
								alt='AI Icon'
								className='bg-blk/50 hover:bg-highlight rounded'
							/>
						</Button>
						{Loading && (
							<div role='status'>
								<svg
									aria-hidden='true'
									className='inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300'
									viewBox='0 0 100 101'
									fill='none'
									xmlns='http://www.w3.org/2000/svg'>
									<path
										d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
										fill='currentColor'
									/>
									<path
										d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
										fill='currentFill'
									/>
								</svg>
								<span className='sr-only'>Loading...</span>
							</div>
						)}

						{/* Display AI Suggested Team */}
						{aiTeam.length > 0 && (
							<div className='text-fontz'>
								<h3>AI Suggested Team:</h3>
								<ul>
									{aiTeam.map((op) => (
										<li key={op._id}>
											{op.callSign} - {op.className} ({op.secondaryClass})
										</li>
									))}
								</ul>
							</div>
						)}
					</div>

					<br />

					{/* Submit Button */}
					<Button
						type='submit'
						className='btn'>
						Create Team
					</Button>
				</form>
			</div>
		</section>
	);
};

export default NewTeamForm;
