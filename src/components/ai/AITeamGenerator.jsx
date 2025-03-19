import { useTeamsStore } from "@/zustand";
import { Button } from "@material-tailwind/react";
import { TEAMS } from "@/config";

const AITeamGenerator = () => {
	const {
		aiTeam,
		loading,
		selectedTeamType,
		missionDescription,
		setSelectedTeamType,
		setMissionDescription,
		generateAITeam,
	} = useTeamsStore();

	return (
		<div className=' p-5 border border-lines text-fontz grid gap-4 sm:grid-cols-2 sm:gap-6'>
			{/* Team Type Selection */}
			<h2 className=' flex flex-col items-center text-lg font-bold'>
				Team Type :
			</h2>
			<select
				className='bg-blk/50 border border-lines text-fontz text-lg rounded-lg outline-lines focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5'
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
			<br />
			<h1 className='flex flex-col items-center'>or</h1>

			{/* Mission Description Input */}
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
			{/* Button to Generate AI Team */}
			<Button
				type='button'
				className='bg-transparent flex flex-col items-center '
				onClick={generateAITeam}>
				<img
					src='/icons/ai.svg'
					alt='AI Icon'
					className='bg-blk/50 hover:bg-highlight rounded'
				/>
			</Button>
			{loading && (
				<div className='w-10 h-10 border-4 border-gray-300 border-t-highlight rounded-full animate-spin'></div>
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
	);
};

export default AITeamGenerator;
