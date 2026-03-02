// components/ai/AITeamGenerator.jsx
// Same UI as before — upgraded internals only.
// Justification shown per operator. Apply Team button adds all to form.

import { useTeamsStore } from "@/zustand";
import { Button } from "@material-tailwind/react";
import { TEAMS } from "@/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";

const AITeamGenerator = () => {
	const aiTeam = useTeamsStore((s) => s.aiTeam);
	const loading = useTeamsStore((s) => s.loading);
	const selectedTeamType = useTeamsStore((s) => s.selectedTeamType);
	const missionDescription = useTeamsStore((s) => s.missionDescription);
	const generateAITeam = useTeamsStore((s) => s.generateAITeam);
	const addOperator = useTeamsStore((s) => s.addOperator);

	const setSelectedTeamType = (val) =>
		useTeamsStore.setState({ selectedTeamType: val });
	const setMissionDescription = (val) =>
		useTeamsStore.setState({ missionDescription: val });

	const handleApplyAll = () => {
		aiTeam.forEach((op) => addOperator(op._id));
	};

	return (
		<div className='p-5 border border-lines text-fontz grid gap-4 sm:grid-cols-2 sm:gap-6'>
			{/* Team Type Selection */}
			<h2 className='flex flex-col items-center text-lg font-bold'>
				Team Type :
			</h2>
			<select
				className='bg-blk/50 border border-lines text-fontz text-lg rounded-lg outline-lines focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5'
				value={selectedTeamType}
				onChange={(e) => setSelectedTeamType(e.target.value)}>
				<option value=''>-- Select Team Type (Optional) --</option>
				{TEAMS.map((type) => (
					<option
						key={type}
						value={type}>
						{type}
					</option>
				))}
			</select>

			<br />
			<h1 className='flex flex-col items-center'>or</h1>

			{/* Mission Description */}
			<label className='text-lg font-bold flex flex-col items-center'>
				Mission Description :
			</label>
			<textarea
				className='flex flex-col items-center text-md text-fontz border border-lines bg-blk/50 outline-lines h-25'
				value={missionDescription}
				onChange={(e) => setMissionDescription(e.target.value)}
				placeholder='Provide details about the mission to get AI recommendations...'
			/>

			<br />

			{/* Generate button */}
			<Button
				type='button'
				className='bg-transparent flex flex-col items-center'
				onClick={generateAITeam}>
				<img
					src='/icons/ai.svg'
					alt='AI Icon'
					className='bg-blk/50 hover:bg-highlight rounded'
				/>
			</Button>

			{/* Spinner */}
			{loading && (
				<div className='w-10 h-10 border-4 border-gray-300 border-t-highlight rounded-full animate-spin' />
			)}

			{/* AI Suggested Team — with justifications */}
			{aiTeam.length > 0 && (
				<div className='sm:col-span-2 flex flex-col gap-3'>
					<h3 className='text-lg font-bold text-fontz'>AI Suggested Team:</h3>

					<ul className='flex flex-col gap-2'>
						{aiTeam.map((op) => (
							<li
								key={op._id}
								className='bg-blk/50 border border-lines rounded-lg px-4 py-3 flex flex-col gap-1'>
								{/* Operator header */}
								<div className='flex items-center gap-2'>
									<FontAwesomeIcon
										icon={faCheck}
										className='text-btn text-sm shrink-0'
									/>
									<span className='font-bold text-fontz'>{op.callSign}</span>
									<span className='font-mono text-xs text-lines/60 ml-1'>
										{[op.class, op.role, op.weaponType]
											.filter(Boolean)
											.join(" · ")}
									</span>
								</div>

								{/* Justification */}
								{op.justification && (
									<p className='font-mono text-xs text-fontz/60 leading-relaxed pl-5'>
										{op.justification}
									</p>
								)}
							</li>
						))}
					</ul>

					{/* Apply all button */}
					<Button
						type='button'
						className='btn flex items-center gap-2 w-fit'
						onClick={handleApplyAll}>
						<FontAwesomeIcon
							icon={faPlus}
							className='text-sm'
						/>
						Apply Team to Form
					</Button>
				</div>
			)}
		</div>
	);
};

export default AITeamGenerator;
