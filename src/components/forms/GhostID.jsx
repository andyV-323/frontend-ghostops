import { useOperatorsStore } from "@/zustand";
import { ghostID, CLASS } from "@/config";
import { ImageUpload } from "@/components";

const GhostID = () => {
	const { selectedOperator, setSelectedOperator } = useOperatorsStore();

	const handleImageUpload = (imageUrl) => {
		setSelectedOperator({ ...selectedOperator, imageKey: imageUrl });
	};

	const selectedClasses = Array.isArray(selectedOperator?.class)
		? selectedOperator.class
		: [];

	const toggleClass = (cls) => {
		const active = selectedClasses.includes(cls);
		const next = active
			? selectedClasses.filter((c) => c !== cls)
			: [...selectedClasses, cls];
		setSelectedOperator({ ...selectedOperator, class: next });
	};

	return (
		<div>
			<h2 className='mb-4 text-xl font-bold text-fontz'>I.D</h2>
			<div>
				{/** THUMBNAIL IMAGE **/}
				<div className='w-full mb-6'>
					<label className='block mb-2 font-medium'>
						Thumbnail Image (for Roster)
					</label>
					<select
						className='form'
						value={selectedOperator?.image || ""}
						name='image'
						onChange={(e) =>
							setSelectedOperator({ ...selectedOperator, image: e.target.value })
						}>
						<option value=''>Select Ghost Image</option>
						{Object.keys(ghostID).map((key) => (
							<option key={key} value={ghostID[key].image}>
								{key}
							</option>
						))}
					</select>
					<p className='mt-1 text-xs text-gray-400'>
						This image will appear in rosters and tables (small thumbnail)
					</p>
				</div>

				{/** OPERATOR IMAGE **/}
				<div className='mb-6 flex flex-col gap-4'>
					<h3 className='text-lg font-semibold text-fontz'>Operator Image</h3>
					<div className='p-4 border border-gray-700 rounded-lg bg-gray-900/30'>
						<ImageUpload
							currentImage={selectedOperator?.imageKey}
							onImageUpload={handleImageUpload}
						/>
						{selectedOperator?.imageKey && (
							<p className='mt-2 text-xs text-green-400'>✓ Image uploaded</p>
						)}
					</div>
				</div>

				{/** CALL SIGN **/}
				<div className='w-full'>
					<label className='block mb-2 font-medium'>
						Call Sign<span className='text-red-500'>*</span>
					</label>
					<input
						type='text'
						name='callSign'
						className='form'
						placeholder='Call Sign (e.g., Nomad, Fury)'
						value={selectedOperator?.callSign || ""}
						onChange={(e) =>
							setSelectedOperator({ ...selectedOperator, callSign: e.target.value })
						}
						required
					/>
				</div>
				<br />

				{/** CLASS — multi-select, max 3 **/}
				<div>
					<label className='block mb-2 font-medium'>
						Class{" "}
						<span className='text-xs text-gray-400 font-normal'>
							{selectedClasses.length}/3
						</span>
					</label>
					<div className='grid grid-cols-3 gap-1.5 sm:grid-cols-4'>
						{CLASS.map((cls) => {
							const active = selectedClasses.includes(cls);
							const atMax = selectedClasses.length >= 3 && !active;
							return (
								<button
									key={cls}
									type='button'
									disabled={atMax}
									onClick={() => toggleClass(cls)}
									className={[
										"py-2 px-1 border rounded-sm font-mono text-[10px] tracking-widest uppercase transition-all",
										active
											? "border-btn/50 bg-btn/10 text-btn"
											: atMax
											? "border-lines/10 text-lines/20 cursor-not-allowed"
											: "border-lines/15 text-lines/40 hover:border-lines/30 hover:text-fontz/60",
									].join(" ")}>
									{cls}
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

export default GhostID;
