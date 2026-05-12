import { Button } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { ghostID, CLASS, ITEMS, PERKS } from "@/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useOperatorsStore, useSheetStore } from "@/zustand";
import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import { useHandleChange, useFormActions, useConfirmDialog } from "@/hooks";
import { ConfirmDialog, ImageUpload } from "@/components";
import { deleteOperatorImage } from "@/api/OperatorsApi";
import { IMAGE_TYPE_LIST } from "@/utils/operatorImage";

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
	const [removingKey, setRemovingKey] = useState(null);

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

	const handleImageUpload = (fieldKey) => async (imageUrl) => {
		if (selectedOperator[fieldKey]) {
			await deleteOperatorImage(selectedOperator[fieldKey]);
		}
		setSelectedOperator({ ...selectedOperator, [fieldKey]: imageUrl });
	};

	const handleRemoveImage = (fieldKey) => async () => {
		if (!selectedOperator[fieldKey]) return;
		setRemovingKey(fieldKey);
		try {
			await deleteOperatorImage(selectedOperator[fieldKey]);
			setSelectedOperator({ ...selectedOperator, [fieldKey]: null });
		} finally {
			setRemovingKey(null);
		}
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

						{/** OPERATOR IMAGES — 4 TYPES **/}
						<div className='mb-6 w-full flex flex-col gap-4'>
							<h3 className='text-lg font-semibold text-fontz'>
								Operator Images
							</h3>
							<p className='text-xs text-gray-400 -mt-2'>
								Upload a full-body image per mission type. The displayed image
								matches the operator&apos;s active kit type.
							</p>
							{IMAGE_TYPE_LIST.map(({ key, label }) => (
								<div
									key={key}
									className='p-4 border border-gray-700 rounded-lg bg-gray-900/30'>
									<p className='font-mono text-[9px] tracking-[0.3em] uppercase text-neutral-500 mb-3'>
										{label}{label === "Specialty" ? " — Default" : ""}
									</p>
									{selectedOperator[key] && (
										<div className='mb-3'>
											<img
												src={selectedOperator[key]}
												alt={`${selectedOperator.callSign} ${label}`}
												className='max-w-full max-h-40 object-contain rounded border border-gray-600 bg-gray-800'
												onError={(e) => { e.target.style.display = "none"; }}
											/>
											<button
												type='button'
												onClick={handleRemoveImage(key)}
												disabled={removingKey === key}
												className='mt-2 w-full font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 rounded border border-red-900/50 text-red-400 hover:bg-red-900/20 disabled:opacity-40 transition-colors'>
												{removingKey === key ? "Removing..." : "Remove Image"}
											</button>
										</div>
									)}
									<ImageUpload
										currentImage={selectedOperator[key]}
										onImageUpload={handleImageUpload(key)}
									/>
									{selectedOperator[key] && (
										<p className='mt-2 text-xs text-green-400'>✓ {label} image uploaded</p>
									)}
								</div>
							))}
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
						{/* PERKS */}
						<div>
							<label className='block mb-2 font-medium'>Perks</label>

							{/* Selected items display */}
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

							{/* Dropdown to add perks */}
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
						<br />

						<Button
						type='submit'
						className='btn'
						onClick={(e) => handleUpdateOperator(e, operatorId)}>
						Update
					</Button>
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
