import { useHandleChange } from "@/hooks";
import { useOperatorsStore } from "@/zustand";
import { ghostID, CLASS } from "@/config";

const GhostID = () => {
	const handleChange = useHandleChange();
	const { selectedOperator, setSelectedOperator } = useOperatorsStore();

	// Handle specialist toggle
	const handleSpecialistChange = (e) => {
		const isSpecialist = e.target.checked;
		setSelectedOperator({
			...selectedOperator,
			specialist: isSpecialist,
			// Clear specialization if no longer a specialist
			specialization: isSpecialist ? selectedOperator?.specialization : "",
		});
	};
	const handleAviatorChange = (e) => {
		const isAviator = e.target.checked;
		setSelectedOperator({
			...selectedOperator,
			aviator: isAviator,
			specialization: isAviator ? selectedOperator?.specialization : "",
		});
	};
	return (
		<div>
			<h2 className='mb-4 text-xl font-bold text-fontz'>I.D</h2>
			<div>
				{/** I.D IMAGE **/}
				<div className='w-full'>
					<label className='block mb-2 font-medium '>I.D Image</label>
					<select
						className='form'
						value={selectedOperator?.image || ""}
						name='image'
						onChange={(e) =>
							setSelectedOperator({
								...selectedOperator,
								image: e.target.value,
							})
						}>
						<option value=''>Select Ghost Image</option>
						{Object.keys(ghostID).map((key) => (
							<option
								key={key}
								value={ghostID[key].image}>
								{key}
							</option>
						))}
					</select>
				</div>
				<br />

				{/** CALL SIGN **/}
				<div className='w-full'>
					<label className='block mb-2 font-medium '>
						Call Sign<span className='text-red-500'>*</span>
					</label>
					<input
						type='text'
						name='callSign'
						className='form'
						placeholder='Call Sign (e.g., Nomad, Fury)'
						value={selectedOperator?.callSign || ""}
						onChange={handleChange}
						required
					/>
				</div>
				<br />

				{/** CLASS **/}
				<div>
					<label className='block mb-2 font-medium '>Class</label>
					<select
						className='form'
						value={selectedOperator?.class || ""}
						onChange={handleChange}
						name='class'
						required>
						<option value=''>Select Class</option>
						{CLASS.map((type) => (
							<option
								key={type}
								value={type}>
								{type}
							</option>
						))}
					</select>
				</div>
				<br />

				{/** SPECIALIST SECTION **/}
				<div className=' p-4 rounded-lg '>
					<h3 className='text-lg font-semibold text-fontz mb-3'>Specialist</h3>

					{/** SPECIALIST CHECKBOX **/}
					<div className='flex items-center mb-4'>
						<input
							type='checkbox'
							id='specialist'
							name='specialist'
							className='w-4 h-4 accent-btn bg-gray-700 focus:ring-btn focus:ring-2'
							checked={selectedOperator?.specialist || false}
							onChange={handleSpecialistChange}
						/>
						<label
							htmlFor='specialist'
							className='ml-2 text-sm font-medium text-gray-300'>
							This operator is a specialist
						</label>
					</div>

					{/** SPECIALIZATION INPUT - Only show if specialist is checked **/}
					{selectedOperator?.specialist && (
						<div className='w-full'>
							<label className='block mb-2 font-medium text-fontz'>
								Specialization<span className='text-red-500'>*</span>
							</label>
							<input
								type='text'
								name='specialization'
								className='form'
								placeholder='Enter specialization (e.g., Sniper, Medic, Demolitions Expert, Cyber Warfare)'
								value={selectedOperator?.specialization || ""}
								onChange={handleChange}
								required={selectedOperator?.specialist}
							/>
							<p className='mt-1 text-xs text-gray-400'>
								Define this operator`&apos;`s unique specialty and advanced
								training. Be creative!
							</p>
						</div>
					)}
				</div>
				{/** AVIATOR SECTION **/}
				<div className=' p-4 rounded-lg '>
					<h3 className='text-lg font-semibold text-fontz mb-3'>Aviator</h3>

					{/** AVIATOR CHECKBOX **/}
					<div className='flex items-center mb-4'>
						<input
							type='checkbox'
							id='aviator'
							name='aviator'
							className='w-4 h-4 accent-btn bg-gray-700 focus:ring-btn focus:ring-2'
							checked={selectedOperator?.aviator || false}
							onChange={handleAviatorChange}
						/>
						<label
							htmlFor='aviator'
							className='ml-2 text-sm font-medium text-gray-300'>
							This operator is an Aviator
						</label>
					</div>

					{/** SPECIALIZATION INPUT - Only show if specialist is checked **/}
					{selectedOperator?.aviator && (
						<div className='w-full'>
							<label className='block mb-2 font-medium text-fontz'>
								Specialization<span className='text-red-500'>*</span>
							</label>
							<input
								type='text'
								name='specialization'
								className='form'
								placeholder='Enter specialization (e.g., Sniper, Medic, Demolitions Expert, Cyber Warfare)'
								value={selectedOperator?.specialization || ""}
								onChange={handleChange}
								required={selectedOperator?.aviator}
							/>
							<p className='mt-1 text-xs text-gray-400'>
								Define this operator`&apos;`s unique specialty and advanced
								training. Be creative!
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default GhostID;
