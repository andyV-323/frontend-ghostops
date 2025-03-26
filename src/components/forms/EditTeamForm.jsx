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

const EditTeamForm = ({ teamId }) => {
	const auth = useAuth();
	const { isOpen, openDialog, closeDialog, confirmAction } = useConfirmDialog();
	const {
		teamName,
		operators,
		fetchOperators,
		fetchTeamById,
		setTeamName,
		updateTeam,
		deleteTeam,
		resetStore,
		fetchTeams,
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
		const teamData = {
			_id: teamId,
			createdBy: useTeamsStore.getState().createdBy,
			name: teamName.trim(),
			operators: operators.length > 0 ? operators : [],
		};

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
								value={teamName}
								onChange={(e) => setTeamName(e.target.value)}
								required
							/>
						</div>

						{/* Operators Dropdown */}
						<h2 className='mb-4 text-lg font-bold text-fontz'>Operators</h2>
						<select
							className='bg-blk/50 border border-lines rounded-lg block w-full p-2.5 text-fontz outline-lines'
							onChange={(e) => {
								const selectedOperator = e.target.value;
								if (selectedOperator) {
									useTeamsStore.getState().addOperator(selectedOperator);
								}
							}}>
							<option value=''>-- Select an Operator --</option>
							{useTeamsStore.getState().allOperators.map((operator) => (
								<option
									key={operator._id}
									value={operator._id}>
									{operator.callSign} - {operator.class}-
									{operator.secondaryClass}
								</option>
							))}
						</select>

						{/* Display Selected Operators */}
						{useTeamsStore.getState().operators.length > 0 && (
							<div className='sm:col-span-2'>
								<h3 className='mb-2 text-lg font-semibold text-fontz'>
									Selected Operators:
								</h3>

								<ul className='list-disc pl-4 text-fontz'>
									{useTeamsStore.getState().operators.map((opId) => {
										const operator = useTeamsStore
											.getState()
											.fullOperatorList.find((op) => op._id === opId);
										return (
											<li
												key={opId}
												className='flex justify-between items-center bg-blk/50 text-lg'>
												{operator ? operator.callSign : "Unknown Operator"}
												<FontAwesomeIcon
													icon={faXmark}
													className='text-2xl text-btn hover:text-white'
													type='button'
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
