// components/forms/AssignTeamSheet.jsx
import { useState } from "react";
import { useTeamsStore } from "@/zustand";
import { PropTypes } from "prop-types";

const AssignTeamSheet = ({ operator, onComplete }) => {
	const { teams, addOperatorToTeam, fetchTeams } = useTeamsStore();

	const operatorClasses = Array.isArray(operator.class)
		? operator.class.filter(Boolean)
		: operator.class ? [operator.class] : [];

	const [selectedClass, setSelectedClass] = useState(operatorClasses[0] || "");

	const currentTeam = teams.find((team) =>
		team.operators.some((op) => op._id === operator._id),
	);

	const isOperatorUnavailable =
		operator.status === "KIA" || operator.status === "Injured";

	const handleAssign = async (teamId) => {
		if (isOperatorUnavailable) return;
		await addOperatorToTeam(operator._id, teamId, selectedClass);
		if (onComplete) onComplete();
	};

	const handleUnassign = async () => {
		if (!currentTeam) return;
		try {
			const { updateTeam } = useTeamsStore.getState();
			const updatedOperators = currentTeam.operators
				.filter((op) => op._id !== operator._id)
				.map((op) => op._id);
			await updateTeam({ ...currentTeam, operators: updatedOperators });
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
					<p className='text-sm text-gray-400'>
						{operatorClasses.join(" / ")}
					</p>
				</div>
			</div>

			{/* Class selector — only shown when operator has more than one class */}
			{operatorClasses.length > 1 && (
				<div className='mb-4'>
					<p className='font-mono text-[10px] tracking-[0.25em] text-lines uppercase mb-1.5'>
						Assign as class
					</p>
					<div className='flex flex-wrap gap-1.5'>
						{operatorClasses.map((cls) => (
							<button
								key={cls}
								onClick={() => setSelectedClass(cls)}
								className={[
									"font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 border transition-all",
									selectedClass === cls
										? "border-btn bg-btn/10 text-btn"
										: "border-lines/60 text-lines hover:border-btn/50 hover:text-neutral-300",
								].join(" ")}>
								{cls}
							</button>
						))}
					</div>
				</div>
			)}

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

				{currentTeam && (
					<li
						onClick={handleUnassign}
						className='p-3 rounded-lg border border-red-600/50 hover:border-red-600 hover:bg-red-600/20 text-gray-400 hover:text-red-400 cursor-pointer transition-all mt-4'>
						<span className='font-medium'>Unassign from {currentTeam.name}</span>
					</li>
				)}

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
