// components/forms/NewMissionForm.jsx
import { useState, useEffect } from "react";
import { PropTypes } from "prop-types";
import { useMissionsStore, useTeamsStore, useSheetStore } from "@/zustand";
import { Button } from "@material-tailwind/react";

const NewMissionForm = ({ onComplete }) => {
	const { createMission } = useMissionsStore();
	const { teams, fetchTeams } = useTeamsStore();

	const [formData, setFormData] = useState({
		name: "",
		teams: [],
		teamRoles: [], // Store roles for each team
		status: "Recon",
		location: "",
		notes: "",
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
	const { closeSheet } = useSheetStore();
	const handleSubmit = async (e) => {
		e.preventDefault();
		await createMission(formData);
		closeSheet();
		if (onComplete) {
			onComplete();
		}
	};
	return (
		<form
			onSubmit={handleSubmit}
			className='p-4 space-y-4'>
			<h2 className='text-xl font-bold text-fontz mb-4'>New Mission</h2>

			{/* Mission Name */}
			<div>
				<label className='block text-sm font-medium text-gray-400 mb-2'>
					Mission Name <span className='text-red-500'>*</span>
				</label>
				<input
					type='text'
					name='name'
					value={formData.name}
					onChange={handleChange}
					required
					placeholder='Enter mission name'
					className='form'
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
					className='form'>
					<option value='Recon'>Recon</option>
					<option value='Infil'>Infil</option>
					<option value='Assault'>Assault</option>
					<option value='Extracted'>Extracted</option>
					<option value='Failed'>Failed</option>
					<option value='Aborted'>Aborted</option>
				</select>
			</div>

			{/* Teams */}
			<div>
				<label className='block text-sm font-medium text-gray-400 mb-2'>
					Assign Teams & Roles
				</label>
				<div className='form'>
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

			{/* Submit Button */}
			<div className='flex flex-col items-center'>
				<Button
					type='submit'
					className='btn '>
					Create Mission
				</Button>
			</div>
		</form>
	);
};

NewMissionForm.propTypes = {
	onComplete: PropTypes.func,
};

export default NewMissionForm;
