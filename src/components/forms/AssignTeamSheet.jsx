// components/forms/AssignTeamSheet.jsx
import { useTeamsStore } from "@/zustand";
import { PropTypes } from "prop-types";

const AssignTeamSheet = ({ operator, onComplete }) => {
	const { teams, addOperatorToTeam, fetchTeams } = useTeamsStore();

	// Find operator's current team
	const currentTeam = teams.find((team) =>
		team.operators.some((op) => op._id === operator._id)
	);

	const handleAssign = async (teamId) => {
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

			<ul className='space-y-2'>
				{teams.map((team) => {
					const isCurrentTeam = currentTeam?._id === team._id;
					const operatorCount = team.operators.length;

					return (
						<li
							key={team._id}
							onClick={() => !isCurrentTeam && handleAssign(team._id)}
							className={`p-3 rounded-lg border cursor-pointer transition-all ${
								isCurrentTeam
									? "border-btn bg-btn/20 text-fontz cursor-default"
									: "border-lines hover:border-btn hover:bg-highlight/50 text-gray-400 hover:text-fontz"
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
