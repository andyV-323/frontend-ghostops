import { useState } from "react";
import { useOperatorsStore } from "@/zustand";
import { ghostID, CLASS } from "@/config";
import { ImageUpload } from "@/components";

const GhostID = () => {
	const { selectedOperator, setSelectedOperator } = useOperatorsStore();
	const [customClassInput, setCustomClassInput] = useState("");

	const handleImageUpload = (imageUrl) => {
		setSelectedOperator({ ...selectedOperator, imageKey: imageUrl });
	};

	const selectedClasses = Array.isArray(selectedOperator?.class)
		? selectedOperator.class
		: [];
	const customClasses = selectedClasses.filter((c) => !CLASS.includes(c));

	const toggleClass = (cls) => {
		const active = selectedClasses.includes(cls);
		const next = active
			? selectedClasses.filter((c) => c !== cls)
			: [...selectedClasses, cls];
		setSelectedOperator({ ...selectedOperator, class: next });
	};

	const addCustomClass = () => {
		const trimmed = customClassInput.trim();
		if (!trimmed || selectedClasses.length >= 3 || selectedClasses.includes(trimmed)) return;
		toggleClass(trimmed);
		setCustomClassInput("");
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

					{customClasses.length > 0 && (
						<div className='flex flex-wrap gap-1.5 mt-2'>
							{customClasses.map((cls) => (
								<button
									key={cls}
									type='button'
									onClick={() => toggleClass(cls)}
									className='flex items-center gap-1.5 py-2 px-2 border rounded-sm font-mono text-[10px] tracking-widest uppercase border-btn/50 bg-btn/10 text-btn transition-all'>
									{cls}
									<span className='text-btn/60'>×</span>
								</button>
							))}
						</div>
					)}

					<div className='flex gap-1.5 mt-2'>
						<input
							type='text'
							value={customClassInput}
							onChange={(e) => setCustomClassInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									addCustomClass();
								}
							}}
							placeholder='Custom class...'
							disabled={selectedClasses.length >= 3}
							maxLength={24}
							className='form flex-1 text-xs disabled:opacity-40'
						/>
						<button
							type='button'
							onClick={addCustomClass}
							disabled={!customClassInput.trim() || selectedClasses.length >= 3}
							className='font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border rounded-sm border-btn/50 text-btn hover:bg-btn/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all'>
							Add
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GhostID;
