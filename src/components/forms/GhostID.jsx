import { useHandleChange } from "@/hooks";
import { useOperatorsStore } from "@/zustand";
import { ghostID, CLASS, WEAPONS, ITEMS } from "@/config";
import { ImageUpload } from "@/components";

const GhostID = () => {
	const handleChange = useHandleChange();
	const { selectedOperator, setSelectedOperator } = useOperatorsStore();

	// Handle full body image upload (imageKey)
	const handleFullBodyUpload = (imageUrl) => {
		setSelectedOperator({
			...selectedOperator,
			imageKey: imageUrl,
		});
	};

	return (
		<div>
			<h2 className='mb-4 text-xl font-bold text-fontz'>I.D</h2>
			<div>
				{/** THUMBNAIL IMAGE - PRESET ONLY **/}
				<div className='w-full mb-6'>
					<label className='block mb-2 font-medium'>
						Thumbnail Image (for Roster)
					</label>
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
					<p className='mt-1 text-xs text-gray-400'>
						This image will appear in rosters and tables (small thumbnail)
					</p>
				</div>

				{/** FULL BODY IMAGE - UPLOAD ONLY **/}
				<div className='mb-6 p-4 border border-gray-700 rounded-lg bg-gray-900/30'>
					<h3 className='text-lg font-semibold text-fontz mb-2'>
						Full Body Image (Optional)
					</h3>
					<p className='text-xs text-gray-400 mb-4'>
						Upload a full body image to display in the operator profile view
					</p>

					<ImageUpload
						currentImage={selectedOperator?.imageKey}
						onImageUpload={handleFullBodyUpload}
					/>

					{selectedOperator?.imageKey && (
						<div className='mt-3'>
							<p className='text-xs text-green-400'>
								✓ Full body image uploaded
							</p>
						</div>
					)}
				</div>

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
				{/** WEAPON **/}
				<div>
					<label className='block mb-2 font-medium'>Weapon Type</label>
					<select
						className='form'
						value={selectedOperator?.weaponType || ""}
						onChange={handleChange}
						name='weaponType'
						required>
						<option value=''>Select Weapon</option>
						{Object.entries(WEAPONS).map(([key, weapon]) => (
							<option
								key={key}
								value={key}>
								{weapon.name}
							</option>
						))}
					</select>
				</div>
				<br />
				{/*Weapon Name*/}
				<div className='w-full'>
					<label className='block mb-2 font-medium text-fontz'>
						Weapon Name
					</label>
					<input
						type='text'
						name='weapon'
						className='form'
						placeholder='Enter Primary Weapon'
						value={selectedOperator?.weapon || ""}
						onChange={handleChange}
					/>
					<p className='mt-1 text-xs text-gray-400'>
						Define this operator&apos;s primary weapon.
					</p>
				</div>
				<br />
				{/*SideArm*/}
				<div className='w-full'>
					<label className='block mb-2 font-medium text-fontz'>Side Arm</label>
					<input
						type='text'
						name='sideArm'
						className='form'
						placeholder='Enter side arm name'
						value={selectedOperator?.sideArm || ""}
						onChange={handleChange}
					/>
					<p className='mt-1 text-xs text-gray-400'>
						Define this operator&apos;s side arm.
					</p>
				</div>
				<br />
				{/** ITEMS **/}
				<div>
					<label className='block mb-2 font-medium'>Items</label>

					{/* Selected items display */}
					<div className='flex flex-wrap gap-2 mb-2'>
						{(selectedOperator?.items || []).map((item) => (
							<div
								key={item}
								className='flex items-center gap-2 bg-highlight px-3 py-1 rounded-full'>
								<img
									src={ITEMS[item]}
									alt={item}
									className='w-4 h-4'
								/>
								<span className='text-sm'>{item}</span>
								<button
									type='button'
									onClick={() => {
										const newItems = selectedOperator.items.filter(
											(i) => i !== item,
										);
										handleChange({
											target: { name: "items", value: newItems },
										});
									}}
									className='text-red-500 hover:text-red-700'>
									×
								</button>
							</div>
						))}
					</div>

					{/* Dropdown to add items */}
					<select
						className='form'
						value=''
						onChange={(e) => {
							if (
								e.target.value &&
								!selectedOperator?.items?.includes(e.target.value)
							) {
								const newItems = [
									...(selectedOperator?.items || []),
									e.target.value,
								];
								handleChange({
									target: { name: "items", value: newItems },
								});
							}
						}}>
						<option value=''>Add an item...</option>
						{Object.keys(ITEMS)
							.filter((item) => !selectedOperator?.items?.includes(item))
							.map((item) => (
								<option
									key={item}
									value={item}>
									{item}
								</option>
							))}
					</select>
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
							<h3 className='text-lg font-semibold text-fontz'>Support</h3>
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
							<h3 className='text-lg font-semibold text-fontz'>Aviator</h3>
						</label>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GhostID;
