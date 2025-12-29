import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@material-tailwind/react";
import { useTeamsStore, useSheetStore } from "@/zustand";
import { AITeamGenerator } from "@/components/ai";
import { PROVINCES } from "@/config";

const NewTeamForm = () => {
	const auth = useAuth();
	const { fetchOperators, resetStore, createTeam, fetchTeams } =
		useTeamsStore();
	const { closeSheet } = useSheetStore();

	useEffect(() => {
		resetStore();
		fetchOperators();
	}, [fetchOperators, resetStore]);

	useEffect(() => {
		if (auth.isAuthenticated && auth.user) {
			useTeamsStore.setState({ createdBy: auth.user.profile.sub });
		}
	}, [auth.isAuthenticated, auth.user]);

	// Handle form submission
	const handleCreateTeam = async (e) => {
		e.preventDefault();
		const storeState = useTeamsStore.getState();

		const teamData = {
			createdBy: storeState.createdBy,
			name: storeState.teamName.trim(), // Use teamName instead of name
			AO: storeState.AO || "", // Include AO from store
			operators: storeState.operators.length > 0 ? storeState.operators : [],
		};

		await createTeam(teamData);
		await fetchTeams();
		await closeSheet();
	};

	return (
		<section className=' bg-transparent'>
			<div className='py-8 px-4 mx-auto max-w-2xl lg:py-16'>
				<form onSubmit={handleCreateTeam}>
					<div className='grid gap-4 sm:grid-cols-2 sm:gap-6'>
						{/* Team Name Input */}
						<div className='sm:col-span-2'>
							<label className='block mb-2 text-xl font-bold text-fontz'>
								Team Name
							</label>
							<input
								type='text'
								name='name'
								className='bg-blk/50 border border-lines text-fontz text-lg rounded-lg outline-lines focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5'
								placeholder='Enter team name'
								value={useTeamsStore.getState().teamName}
								onChange={(e) =>
									useTeamsStore.setState({ teamName: e.target.value })
								}
								required
							/>
						</div>

						{/* Area of Operations (AO) Dropdown */}
						<div className='sm:col-span-2'>
							<label className='block mb-2 text-xl font-bold text-fontz'>
								Area of Operations (AO)
							</label>
							<select
								className='bg-blk/50 border border-lines outline-lines rounded-lg block w-full p-2.5 text-fontz'
								value={useTeamsStore.getState().AO}
								onChange={(e) => {
									useTeamsStore.setState({ AO: e.target.value });
								}}>
								<option value=''>-- Select Area of Operations --</option>
								{Object.entries(PROVINCES).map(([key, province]) => (
									<option
										key={key}
										value={key}>
										{key} - {province.biome}
									</option>
								))}
							</select>
						</div>

						{/* Operators Section */}
						<div className='sm:col-span-2'>
							<h2 className='mb-4 text-xl font-bold text-fontz'>Operators</h2>
							<select
								className='bg-blk/50 border border-lines outline-lines rounded-lg block w-full p-2.5 text-fontz'
								onChange={(e) => {
									const selectedOperator = e.target.value;
									if (selectedOperator) {
										useTeamsStore.getState().addOperator(selectedOperator);
										// Reset the select to default after adding
										e.target.value = "";
									}
								}}>
								<option value=''>-- Select an Operator --</option>
								{useTeamsStore.getState().allOperators.map((operator) => (
									<option
										key={operator._id}
										value={operator._id}>
										{operator.callSign} - {operator.class} -{" "}
										{operator.secondaryClass}
									</option>
								))}
							</select>
						</div>

						{/* Display Selected Operators */}
						{useTeamsStore.getState().operators.length > 0 && (
							<div className='sm:col-span-2'>
								<h3 className='mb-2 text-lg font-semibold text-fontz'>
									Selected Operators:
								</h3>
								<ul className='list-disc pl-4 text-fontz text-lg bg-blk/50 border border-lines rounded-lg p-3'>
									{useTeamsStore.getState().operators.map((opId) => {
										const operator = useTeamsStore
											.getState()
											.allOperators.find((op) => op._id === opId);
										return (
											<li
												key={opId}
												className='flex justify-between items-center py-1'>
												{operator ? operator.callSign : "Unknown Operator"}
												<FontAwesomeIcon
													icon={faXmark}
													className='text-2xl text-btn hover:text-white cursor-pointer'
													onClick={() =>
														useTeamsStore.getState().removeOperator(opId)
													}
												/>
											</li>
										);
									})}
								</ul>
							</div>
						)}
					</div>
					<br />
					{/* AI Team Generator */}
					<h1 className='text-lg font-bold flex flex-col items-center'>
						A.I Team Generator
					</h1>
					<AITeamGenerator />
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
