import { useHandleChange } from "@/hooks";
import { useOperatorsStore } from "@/zustand";
import { ghostID, CLASS, ITEMS, PERKS } from "@/config";
import { ImageUpload } from "@/components";
import { IMAGE_TYPE_LIST } from "@/utils/operatorImage";

const GhostID = () => {
	const handleChange = useHandleChange();
	const { selectedOperator, setSelectedOperator } = useOperatorsStore();

	const handleImageUpload = (fieldKey) => (imageUrl) => {
		setSelectedOperator({ ...selectedOperator, [fieldKey]: imageUrl });
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

				{/** OPERATOR IMAGES — 4 TYPES **/}
				<div className='mb-6 flex flex-col gap-4'>
					<h3 className='text-lg font-semibold text-fontz'>
						Operator Images
					</h3>
					<p className='text-xs text-gray-400 -mt-2'>
						Upload a full-body image for each mission type. Specialty is the
						default. The image shown will match the operator&apos;s active kit type.
					</p>
					{IMAGE_TYPE_LIST.map(({ key, label }) => (
						<div
							key={key}
							className='p-4 border border-gray-700 rounded-lg bg-gray-900/30'>
							<p className='font-mono text-[9px] tracking-[0.3em] uppercase text-neutral-500 mb-3'>
								{label}{label === "Specialty" ? " — Default" : ""}
							</p>
							<ImageUpload
								currentImage={selectedOperator?.[key]}
								onImageUpload={handleImageUpload(key)}
							/>
							{selectedOperator?.[key] && (
								<p className='mt-2 text-xs text-green-400'>✓ {label} image uploaded</p>
							)}
						</div>
					))}
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
				{/** ITEMS **/}
				<div>
					<label className='block mb-2 font-medium'>Items</label>

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
				{/* PERKS */}
				<div>
					<label className='block mb-2 font-medium'>Perks</label>

					<div className='flex flex-wrap gap-2 mb-2'>
						{(selectedOperator?.perks || []).map((perk) => (
							<div
								key={perk}
								className='flex items-center gap-2 bg-highlight px-3 py-1 rounded-full'>
								<img
									src={PERKS[perk]}
									alt={perk}
									className='w-4 h-4'
								/>
								<span className='text-sm'>{perk}</span>
								<button
									type='button'
									onClick={() => {
										const newPerks = selectedOperator.perks.filter(
											(i) => i !== perk,
										);
										handleChange({
											target: { name: "perks", value: newPerks },
										});
									}}
									className='text-red-500 hover:text-red-700'>
									×
								</button>
							</div>
						))}
					</div>

					<select
						className='form'
						value=''
						onChange={(e) => {
							if (
								e.target.value &&
								!selectedOperator?.perks?.includes(e.target.value)
							) {
								const newPerks = [
									...(selectedOperator?.perks || []),
									e.target.value,
								];
								handleChange({
									target: { name: "perks", value: newPerks },
								});
							}
						}}>
						<option value=''>Add a perk...</option>
						{Object.keys(PERKS)
							.filter((perk) => !selectedOperator?.perks?.includes(perk))
							.map((perk) => (
								<option
									key={perk}
									value={perk}>
									{perk}
								</option>
							))}
					</select>
				</div>
			</div>
		</div>
	);
};

export default GhostID;
