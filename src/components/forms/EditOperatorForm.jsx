import { Button } from "@material-tailwind/react";
import { useEffect } from "react";
import { ghostID, CLASS, WEAPONS, ITEMS } from "@/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useOperatorsStore, useSheetStore } from "@/zustand";
import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import { useHandleChange, useFormActions, useConfirmDialog } from "@/hooks";
import { ConfirmDialog, ImageUpload } from "@/components";

const EditOperatorForm = ({ operator }) => {
	const handleChange = useHandleChange();
	const { handleUpdateOperator, handleDeleteOperator } = useFormActions();
	const { closeSheet } = useSheetStore();

	const operatorId = operator._id;

	const {
		selectedOperator,
		fetchOperatorById,
		setSelectedOperator,
		fetchOperators,
		loading,
	} = useOperatorsStore();
	const { isOpen, openDialog, closeDialog, confirmAction } = useConfirmDialog();

	useEffect(() => {
		if (operator) {
			fetchOperatorById(operatorId);
		}
	}, [operatorId]);

	if (loading || !selectedOperator) {
		return (
			<div className='text-center text-gray-400 p-4'>
				Loading operator data...
			</div>
		);
	}

	const deleteOperator = (operatorId) => {
		openDialog(async () => {
			await handleDeleteOperator(operatorId);
			await fetchOperators();
			await closeSheet();
		});
	};

	const handleFullBodyUpload = (imageUrl) => {
		setSelectedOperator({
			...selectedOperator,
			imageKey: imageUrl,
		});
	};

	// Simplified URL handler for S3
	const getImageUrl = (imagePath) => {
		if (!imagePath) return null;

		// S3 URLs are complete - use directly
		if (imagePath.startsWith("https://")) {
			return imagePath;
		}

		// Preset Ghost images
		return imagePath;
	};

	return (
		<section className='bg-transparent text-md text-fontz'>
			<div className='flex flex-col items-end'>
				<FontAwesomeIcon
					icon={faTrash}
					className=' text-red-600 text-2xl cursor-pointer hover:text-red-800'
					onClick={() => deleteOperator(operatorId)}
				/>
				<br />
				<form>
					<h2 className='mb-4 text-xl font-bold '>I.D</h2>
					<div className='flex flex-col items-center'>
						{/** THUMBNAIL IMAGE - PRESET ONLY **/}
						<div className='w-full mb-6'>
							<label className='block mb-2 font-medium'>
								Current Thumbnail
							</label>
							<div className='flex justify-center mb-3'>
								<img
									src={selectedOperator.image || "/ghost/Default.png"}
									alt={selectedOperator.callSign}
									className='w-24 h-24 object-cover rounded-lg border-2 border-gray-600'
									onError={(e) => (e.target.src = "/ghost/Default.png")}
								/>
							</div>

							<label className='block mb-2 font-medium'>
								Select Thumbnail (for Roster)
							</label>
							<select
								className='form'
								value={selectedOperator.image || ""}
								name='image'
								onChange={(e) =>
									setSelectedOperator({
										...selectedOperator,
										image: e.target.value,
									})
								}>
								<option value=''>Select Ghost</option>
								{Object.keys(ghostID).map((key) => (
									<option
										key={key}
										value={ghostID[key].image}>
										{key}
									</option>
								))}
							</select>
							<p className='mt-1 text-xs text-gray-400'>
								This image appears in rosters and tables (small thumbnail)
							</p>
						</div>

						{/** FULL BODY IMAGE - UPLOAD ONLY **/}
						<div className='mb-6 w-full p-4 border border-gray-700 rounded-lg bg-gray-900/30'>
							<h3 className='text-lg font-semibold text-fontz mb-2'>
								Full Body Image (Optional)
							</h3>

							{/** CURRENT FULL BODY PREVIEW **/}
							{selectedOperator.imageKey && (
								<div className='mb-4 w-full'>
									<label className='block mb-2 font-medium text-sm'>
										Current Full Body Image
									</label>
									<div className='flex justify-center'>
										<img
											src={getImageUrl(selectedOperator.imageKey)}
											alt={`${selectedOperator.callSign} Full Body`}
											className='max-w-full max-h-64 object-contain rounded-lg border-2 border-gray-600 bg-gray-800'
											onError={(e) => {
												console.error(
													"Full body image failed to load:",
													selectedOperator.imageKey,
												);
												e.target.style.display = "none";
											}}
										/>
									</div>
								</div>
							)}

							<p className='text-xs text-gray-400 mb-4'>
								Upload a full body image to display in the operator profile view
							</p>

							{/** FULL BODY UPLOAD **/}
							<ImageUpload
								currentImage={selectedOperator?.imageKey}
								onImageUpload={handleFullBodyUpload}
							/>

							{selectedOperator?.imageKey && (
								<div className='mt-3'>
									<p className='text-xs text-green-400'>
										✓ Full body image uploaded to S3
									</p>
								</div>
							)}
						</div>

						{/*CALL SIGN*/}
						<div className='w-full'>
							<label className='block mb-2 font-medium'>
								Call Sign <span className='text-red-500'>*</span>
							</label>
							<input
								type='text'
								name='callSign'
								className='form'
								placeholder='Call Sign (e.g., Nomad, Fury)'
								value={selectedOperator.callSign || ""}
								onChange={handleChange}
								required></input>
						</div>
						<br />

						{/** CLASS **/}
						<div className='w-full'>
							<label className='block mb-2 font-medium'>Class</label>
							<select
								className='form '
								value={selectedOperator.class || ""}
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
								Define this operator&apos;s unique role and advanced training.
								Be creative!
							</p>
						</div>

						<br />
						{/** WEAPON TYPE **/}
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
							<label className='block mb-2 font-medium text-fontz'>
								Side Arm
							</label>
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
						<div className='w-full'>
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

							<Button
								type='submit'
								className='btn'
								onClick={(e) => handleUpdateOperator(e, operatorId)}>
								Update
							</Button>
						</div>
					</div>
				</form>
			</div>
			<ConfirmDialog
				isOpen={isOpen}
				closeDialog={closeDialog}
				confirmAction={confirmAction}
				title='Confirm Operator Deletion'
				description='This will permanently remove the operator and all associated data. This action cannot be undone.'
				message={`Are you sure you want to delete ${selectedOperator.callSign}? Once deleted, all records of this operator will be lost forever.`}
			/>
		</section>
	);
};

EditOperatorForm.propTypes = {
	operator: OperatorPropTypes,
};

export default EditOperatorForm;
