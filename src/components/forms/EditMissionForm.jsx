// components/forms/EditMissionForm.jsx
import { useState, useEffect } from "react";
import { PropTypes } from "prop-types";
import { useMissionsStore, useTeamsStore } from "@/zustand";

const EditMissionForm = ({ mission, onComplete }) => {
	const { updateMission } = useMissionsStore();
	const { teams, fetchTeams } = useTeamsStore();

	const [formData, setFormData] = useState({
		name: mission.name || "",
		teams: mission.teams?.map((team) => team._id || team) || [],
		teamRoles:
			mission.teamRoles?.map((tr) => ({
				teamId: tr.teamId?._id || tr.teamId,
				role: tr.role || "",
			})) || [],
		status: mission.status || "In Progress",
		location: mission.location || "",
		notes: mission.notes || "",
	});

	useEffect(() => {
		fetchTeams();
	}, []);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleTeamToggle = (teamId) => {
		setFormData((prev) => {
			const isSelected = prev.teams.includes(teamId);

			if (isSelected) {
				// Remove team and its role
				return {
					...prev,
					teams: prev.teams.filter((id) => id !== teamId),
					teamRoles: prev.teamRoles.filter((tr) => tr.teamId !== teamId),
				};
			} else {
				// Add team with empty role
				return {
					...prev,
					teams: [...prev.teams, teamId],
					teamRoles: [...prev.teamRoles, { teamId, role: "" }],
				};
			}
		});
	};

	const handleTeamRoleChange = (teamId, role) => {
		setFormData((prev) => ({
			...prev,
			teamRoles: prev.teamRoles.map((tr) =>
				tr.teamId === teamId ? { ...tr, role } : tr
			),
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const result = await updateMission(mission._id, formData);
		if (result && onComplete) {
			onComplete();
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className='p-4 space-y-4'>
			<h2 className='text-xl font-bold text-fontz mb-4'>Edit Mission</h2>

			{/* Mission Name */}
			<div>
				<label className='block text-sm font-medium text-gray-400 mb-2'>
					Mission Name *
				</label>
				<input
					type='text'
					name='name'
					value={formData.name}
					onChange={handleChange}
					required
					placeholder='Enter mission name'
					className='w-full px-3 py-2 bg-highlight border border-lines rounded-lg text-fontz focus:outline-none focus:border-btn'
				/>
			</div>

			{/* Status */}
			<div>
				<label className='block text-sm font-medium text-gray-400 mb-2'>
					Status
				</label>
				<select
					name='status'
					value={formData.status}
					onChange={handleChange}
					className='w-full px-3 py-2 bg-highlight border border-lines rounded-lg text-fontz focus:outline-none focus:border-btn'>
					<option value='In Progress'>In Progress</option>
					<option value='Planning'>Planning</option>
					<option value='Completed'>Completed</option>
					<option value='Failed'>Failed</option>
					<option value='Aborted'>Aborted</option>
				</select>
			</div>

			{/* Location */}
			<div>
				<label className='block text-sm font-medium text-gray-400 mb-2'>
					Location
				</label>
				<input
					type='text'
					name='location'
					value={formData.location}
					onChange={handleChange}
					placeholder='Enter mission location'
					className='w-full px-3 py-2 bg-highlight border border-lines rounded-lg text-fontz focus:outline-none focus:border-btn'
				/>
			</div>

			{/* Teams */}
			<div>
				<label className='block text-sm font-medium text-gray-400 mb-2'>
					Assign Teams & Roles
				</label>
				<div className='space-y-2 max-h-96 overflow-y-auto p-2 bg-highlight/50 rounded-lg border border-lines'>
					{teams.length > 0 ? (
						teams.map((team) => {
							const isSelected = formData.teams.includes(team._id);
							const teamRole = formData.teamRoles.find(
								(tr) => tr.teamId === team._id
							);

							return (
								<div
									key={team._id}
									className={`p-3 rounded-lg border transition-all ${
										isSelected
											? "border-btn bg-btn/20"
											: "border-lines hover:border-btn hover:bg-highlight"
									}`}>
									<div
										onClick={() => handleTeamToggle(team._id)}
										className='cursor-pointer'>
										<div className='flex justify-between items-center'>
											<span className='font-medium text-fontz'>
												{team.name}
											</span>
											<span className='text-sm text-gray-400'>
												{team.operators?.length || 0} operator
												{team.operators?.length !== 1 && "s"}
											</span>
										</div>
										{team.AO && (
											<p className='text-xs text-gray-500 mt-1'>{team.AO}</p>
										)}
									</div>

									{/* Role input - only show when team is selected */}
									{isSelected && (
										<div className='mt-2'>
											<input
												type='text'
												placeholder='Team role (e.g., Primary Assault Element)'
												value={teamRole?.role || ""}
												onChange={(e) =>
													handleTeamRoleChange(team._id, e.target.value)
												}
												onClick={(e) => e.stopPropagation()}
												className='w-full px-2 py-1 text-sm bg-blk/50 border border-lines rounded text-fontz focus:outline-none focus:border-btn'
											/>
										</div>
									)}
								</div>
							);
						})
					) : (
						<p className='text-center text-gray-500 text-sm'>
							No teams available
						</p>
					)}
				</div>
			</div>

			{/* Notes */}
			<div>
				<label className='block text-sm font-medium text-gray-400 mb-2'>
					Notes
				</label>
				<textarea
					name='notes'
					value={formData.notes}
					onChange={handleChange}
					placeholder='Additional mission details...'
					rows={4}
					className='w-full px-3 py-2 bg-highlight border border-lines rounded-lg text-fontz focus:outline-none focus:border-btn resize-none'
				/>
			</div>

			{/* Submit Button */}
			<div className='flex gap-2 pt-4'>
				<button
					type='submit'
					className='flex-1 px-4 py-2 bg-btn hover:bg-btn/80 text-white font-medium rounded-lg transition-all'>
					Update Mission
				</button>
				{onComplete && (
					<button
						type='button'
						onClick={onComplete}
						className='px-4 py-2 bg-highlight hover:bg-highlight/80 text-gray-400 hover:text-fontz font-medium rounded-lg border border-lines transition-all'>
						Cancel
					</button>
				)}
			</div>
		</form>
	);
};

EditMissionForm.propTypes = {
	mission: PropTypes.object.isRequired,
	onComplete: PropTypes.func,
};

export default EditMissionForm;
