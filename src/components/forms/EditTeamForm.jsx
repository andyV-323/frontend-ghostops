import { useEffect } from "react";
import { useTeamsStore, useSheetStore } from "@/zustand";
import { useAuth } from "react-oidc-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@material-tailwind/react";
import { AITeamGenerator } from "@/components/ai";
import { useConfirmDialog } from "@/hooks";
import { ConfirmDialog } from "@/components";
import { PropTypes } from "prop-types";
import { toast } from "react-toastify";
import { PROVINCES } from "@/config";

const EditTeamForm = ({ teamId }) => {
	const auth = useAuth();
	const { isOpen, openDialog, closeDialog, confirmAction } = useConfirmDialog();

	// Get reactive store values - these will update when store changes
	const teamName = useTeamsStore((state) => state.teamName);
	const AO = useTeamsStore((state) => state.AO);
	const operators = useTeamsStore((state) => state.operators);
	const allOperators = useTeamsStore((state) => state.allOperators);
	const fullOperatorList = useTeamsStore((state) => state.fullOperatorList);

	// Get functions from store
	const {
		teams,
		fetchOperators,
		fetchTeamById,
		setTeamName,
		updateTeam,
		deleteTeam,
		resetStore,
		fetchTeams,
		addOperator,
		removeOperator,
	} = useTeamsStore();

	const { closeSheet } = useSheetStore();

	useEffect(() => {
		resetStore();
		if (teamId) {
			fetchTeamById(teamId);
			fetchOperators();
		}
	}, [teamId, fetchTeamById, fetchOperators, resetStore]);

	// Set `createdBy` from authentication
	useEffect(() => {
		if (auth.isAuthenticated && auth.user) {
			useTeamsStore.setState({ createdBy: auth.user.profile.sub });
		}
	}, [auth.isAuthenticated, auth.user]);

	//handle Update form
	const handleUpdateTeam = async (e) => {
		e.preventDefault();
		const storeState = useTeamsStore.getState();

		const teamData = {
			_id: teamId,
			createdBy: storeState.createdBy,
			name: teamName.trim(),
			AO: AO || "", // Use reactive AO value
			operators: operators.length > 0 ? operators : [],
		};

		console.log("Update team data:", teamData); // Debug log

		try {
			await updateTeam(teamData);
			await fetchTeams();
		} catch (error) {
			toast.error("Error updating team:", error);
		} finally {
			closeSheet();
		}
	};

	const handleDeleteTeam = () => {
		openDialog(async () => {
			await deleteTeam(teamId);
			await fetchTeams();
			await closeSheet();
		});
	};
	const getOperatorTeam = (operatorId) => {
		const team = teams.find((team) =>
			team.operators.some((op) => op._id === operatorId)
		);
		return team ? team.name : "Unassigned";
	};

	return (
		<section className='bg-transparent p-4'>
			<div className='flex flex-col items-end'>
				<FontAwesomeIcon
					icon={faTrash}
					className=' text-red-600 text-2xl cursor-pointer hover:text-red-800'
					onClick={handleDeleteTeam}
					title='Delete Team'
				/>

				<form onSubmit={handleUpdateTeam}>
					<div className='grid  gap-4 sm:grid-cols-2 sm:gap-6'>
						{/* Team Name Input */}
						<div className='sm:col-span-2'>
							<label className='block mb-2 text-lg font-bold text-fontz '>
								Team Name
							</label>
							<input
								type='text'
								name='name'
								className='bg-blk/50 border border-lines text-fontz text-lg rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 flex outline-lines'
								value={teamName || ""} // Use reactive value with fallback
								onChange={(e) => setTeamName(e.target.value)}
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
								value={AO || ""} // Use reactive value with fallback
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

						{/* Display Selected AO Info */}
						{AO && PROVINCES[AO] && (
							<div className='sm:col-span-2'>
								<div className='bg-blk/50 border border-lines rounded-lg p-3'>
									<h3 className='text-lg font-semibold text-fontz mb-2'>
										Selected AO: {AO}
									</h3>
									<p className='text-fontz mb-2'>
										Biome: {PROVINCES[AO].biome}
									</p>
								</div>
							</div>
						)}

						{/* Operators Dropdown */}
						<h2 className='mb-4 text-lg font-bold text-fontz'>Operators</h2>
						<select
							className='bg-blk/50 border border-lines rounded-lg block w-full p-2.5 text-fontz outline-lines'
							onChange={(e) => {
								const selectedOperator = e.target.value;
								if (selectedOperator) {
									addOperator(selectedOperator);
									e.target.value = ""; // Reset select
								}
							}}>
							<option value=''>-- Select an Operator --</option>
							{allOperators.map((operator) => (
								<option
									key={operator._id}
									value={operator._id}>
									{operator.callSign} - {operator.class} -{" "}
									{operator.specialization} {operator.secondaryClass} - Team:{" "}
									{getOperatorTeam(operator._id)}
								</option>
							))}
						</select>

						{/* Display Selected Operators */}
						{operators.length > 0 && (
							<div className='sm:col-span-2'>
								<h3 className='mb-2 text-lg font-semibold text-fontz'>
									Selected Operators:
								</h3>

								<ul className='list-disc pl-4 text-fontz bg-blk/50 border border-lines rounded-lg p-3'>
									{operators.map((opId) => {
										const operator = fullOperatorList.find(
											(op) => op._id === opId
										);
										return (
											<li
												key={opId}
												className='flex justify-between items-center text-lg py-1'>
												{operator ? operator.callSign : "Unknown Operator"}
												<FontAwesomeIcon
													icon={faXmark}
													className='text-2xl text-btn hover:text-white cursor-pointer'
													onClick={() => removeOperator(opId)}
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
						className='btn '>
						Update Team
					</Button>{" "}
				</form>
			</div>

			<ConfirmDialog
				className='text-fontz'
				title='Confirm Team Deletion'
				description='This will permanently remove the team and unassign all its operators. This action cannot be undone.'
				message={`Are you sure you want to delete ${teamName}? Once deleted, the team and its assignments will be lost forever.`}
				isOpen={isOpen}
				closeDialog={closeDialog}
				confirmAction={confirmAction}
			/>
		</section>
	);
};

EditTeamForm.propTypes = {
	teamId: PropTypes.string,
};
export default EditTeamForm;
