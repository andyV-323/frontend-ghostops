// components/forms/AssignTeamSheet.jsx
import { useTeamsStore } from "@/zustand";
import { PropTypes } from "prop-types";

const AssignTeamSheet = ({ operator, onComplete }) => {
	const { teams, addOperatorToTeam, fetchTeams } = useTeamsStore();

	// Find operator's current team
	const currentTeam = teams.find((team) =>
		team.operators.some((op) => op._id === operator._id)
	);

	// Check if operator can be assigned
	const isOperatorUnavailable =
		operator.status === "KIA" || operator.status === "Injured";

	const handleAssign = async (teamId) => {
		if (isOperatorUnavailable) return;
		await addOperatorToTeam(operator._id, teamId);
		if (onComplete) onComplete();
	};

	const handleUnassign = async () => {
		if (!currentTeam) return;

		try {
			const { updateTeam } = useTeamsStore.getState();

			// Remove operator from current team
			const updatedOperators = currentTeam.operators
				.filter((op) => op._id !== operator._id)
				.map((op) => op._id);

			await updateTeam({
				...currentTeam,
				operators: updatedOperators,
			});

			await fetchTeams();
			if (onComplete) onComplete();
		} catch (error) {
			console.error("Error unassigning operator:", error);
		}
	};

	return (
		<div className='p-4'>
			<div className='flex items-center gap-3 mb-6 pb-4 border-b border-lines'>
				<img
					src={operator.image || "/ghost/Default.png"}
					alt={operator.callSign}
					className='w-12 h-12 rounded-full border border-lines bg-highlight'
				/>
				<div>
					<h3 className='text-lg font-bold text-fontz'>{operator.callSign}</h3>
					<p className='text-sm text-gray-400'>{operator.class}</p>
				</div>
			</div>

			{isOperatorUnavailable && (
				<div className='mb-4 p-3 rounded-lg bg-red-600/20 border border-red-600/50 text-red-400'>
					<p className='text-sm font-medium'>
						{operator.status === "KIA"
							? "KIA operators cannot be assigned to teams"
							: "Injured operators cannot be assigned to teams"}
					</p>
				</div>
			)}

			<ul className='space-y-2'>
				{teams.map((team) => {
					const isCurrentTeam = currentTeam?._id === team._id;
					const operatorCount = team.operators.length;
					const isDisabled = isOperatorUnavailable && !isCurrentTeam;

					return (
						<li
							key={team._id}
							onClick={() =>
								!isCurrentTeam && !isDisabled && handleAssign(team._id)
							}
							className={`p-3 rounded-lg border transition-all ${
								isCurrentTeam
									? "border-btn bg-btn/20 text-fontz cursor-default"
									: isDisabled
									? "border-lines bg-highlight/20 text-gray-600 cursor-not-allowed opacity-50"
									: "border-lines hover:border-btn hover:bg-highlight/50 text-gray-400 hover:text-fontz cursor-pointer"
							}`}>
							<div className='flex justify-between items-center gap-4'>
								<span className='font-medium'>{team.name}</span>
								<span className='text-sm'>
									{operatorCount} operator{operatorCount !== 1 && "s"}
								</span>
								<span className='text-sm'>{team.AO}</span>
							</div>
							{isCurrentTeam && (
								<span className='text-xs text-btn'>Current Team</span>
							)}
						</li>
					);
				})}

				{/* Unassign Option */}
				{currentTeam && (
					<li
						onClick={handleUnassign}
						className='p-3 rounded-lg border border-red-600/50 hover:border-red-600 hover:bg-red-600/20 text-gray-400 hover:text-red-400 cursor-pointer transition-all mt-4'>
						<span className='font-medium'>
							Unassign from {currentTeam.name}
						</span>
					</li>
				)}

				{/* No teams message */}
				{teams.length === 0 && (
					<li className='p-3 text-center text-gray-400'>
						No teams available. Create a team first.
					</li>
				)}
			</ul>
		</div>
	);
};

AssignTeamSheet.propTypes = {
	operator: PropTypes.object.isRequired,
	onComplete: PropTypes.func,
};

export default AssignTeamSheet;
