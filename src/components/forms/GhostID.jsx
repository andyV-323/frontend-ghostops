import { useHandleChange } from "@/hooks";
import { useOperatorsStore } from "@/zustand";
import { ghostID, CLASS } from "@/config";

const GhostID = () => {
	const handleChange = useHandleChange();
	const { selectedOperator, setSelectedOperator } = useOperatorsStore();

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
				{/*Role*/}
				<div className='w-full'>
					<label className='block mb-2 font-medium text-fontz'>Role</label>
					<input
						type='text'
						name='role'
						className='form'
						placeholder='Enter role (e.g., Sniper, Medic, Demolitions Expert, Cyber Warfare)'
						value={selectedOperator?.role || ""}
						onChange={handleChange}
					/>
					<p className='mt-1 text-xs text-gray-400'>
						Define this operator&apos;s unique role and advanced training. Be
						creative!
					</p>
				</div>
				<br />
				{/** SUPPORT SECTION **/}
				<div className='flex flex-col w-full'>
					{/** SUPPORT CHECKBOX **/}
					<div className='flex items-center gap-3 mb-4'>
						<input
							type='checkbox'
							id='support'
							name='support'
							className='w-4 h-4 accent-btn bg-gray-700 focus:ring-btn focus:ring-2'
							checked={selectedOperator?.support || false}
							onChange={handleChange}
						/>
						<label
							htmlFor='support'
							className='text-sm font-medium text-gray-300 cursor-pointer'>
							<h3
								className='text-lg
														font-semibold
														text-fontz
														'>
								Support
							</h3>
						</label>
					</div>

					{/** AVIATOR SECTION **/}
					<div className='flex items-center gap-3 mb-4'>
						<input
							type='checkbox'
							id='aviator'
							name='aviator'
							className='w-4 h-4 accent-btn bg-gray-700 focus:ring-btn focus:ring-2'
							checked={selectedOperator?.aviator || false}
							onChange={handleChange}
						/>
						<label
							htmlFor='aviator'
							className='text-sm font-medium text-gray-300 cursor-pointer'>
							<h3
								className='text-lg
														font-semibold
														text-fontz
														'>
								Aviator
							</h3>
						</label>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GhostID;
