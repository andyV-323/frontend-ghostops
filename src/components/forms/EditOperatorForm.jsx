import { Button } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { ghostID, CLASS } from "@/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useOperatorsStore, useSheetStore } from "@/zustand";
import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import { useFormActions, useConfirmDialog } from "@/hooks";
import { ConfirmDialog, ImageUpload } from "@/components";
import { deleteOperatorImage } from "@/api/OperatorsApi";

const EditOperatorForm = ({ operator }) => {
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
	const [removingImage, setRemovingImage] = useState(false);

	const handleImageUpload = async (imageUrl) => {
		if (selectedOperator.imageKey) {
			await deleteOperatorImage(selectedOperator.imageKey);
		}
		setSelectedOperator({ ...selectedOperator, imageKey: imageUrl });
	};

	const handleRemoveImage = async () => {
		if (!selectedOperator.imageKey) return;
		setRemovingImage(true);
		try {
			await deleteOperatorImage(selectedOperator.imageKey);
			setSelectedOperator({ ...selectedOperator, imageKey: null });
		} finally {
			setRemovingImage(false);
		}
	};

	useEffect(() => {
		if (operator) fetchOperatorById(operatorId);
	}, [operatorId]);

	if (loading || !selectedOperator) {
		return (
			<div className='text-center text-gray-400 p-4'>
				Loading operator data...
			</div>
		);
	}

	const deleteOperator = (id) => {
		openDialog(async () => {
			await handleDeleteOperator(id);
			await fetchOperators();
			await closeSheet();
		});
	};

	const selectedClasses = Array.isArray(selectedOperator.class)
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
		<section className='bg-transparent text-md text-fontz'>
			<div className='flex flex-col items-end'>
				<FontAwesomeIcon
					icon={faTrash}
					className='text-red-600 text-2xl cursor-pointer hover:text-red-800'
					onClick={() => deleteOperator(operatorId)}
				/>
				<br />
				<form>
					<h2 className='mb-4 text-xl font-bold'>I.D</h2>
					<div className='flex flex-col items-center'>
						{/** THUMBNAIL **/}
						<div className='w-full mb-6'>
							<label className='block mb-2 font-medium'>Current Thumbnail</label>
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
									<option key={key} value={ghostID[key].image}>
										{key}
									</option>
								))}
							</select>
							<p className='mt-1 text-xs text-gray-400'>
								This image appears in rosters and tables (small thumbnail)
							</p>
						</div>

						{/** OPERATOR IMAGE **/}
						<div className='mb-6 w-full flex flex-col gap-4'>
							<h3 className='text-lg font-semibold text-fontz'>Operator Image</h3>
							<div className='p-4 border border-gray-700 rounded-lg bg-gray-900/30'>
								{selectedOperator.imageKey && (
									<div className='mb-3'>
										<img
											src={selectedOperator.imageKey}
											alt={selectedOperator.callSign}
											className='max-w-full max-h-40 object-contain rounded border border-gray-600 bg-gray-800'
											onError={(e) => { e.target.style.display = "none"; }}
										/>
										<button
											type='button'
											onClick={handleRemoveImage}
											disabled={removingImage}
											className='mt-2 w-full font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 rounded border border-red-900/50 text-red-400 hover:bg-red-900/20 disabled:opacity-40 transition-colors'>
											{removingImage ? "Removing..." : "Remove Image"}
										</button>
									</div>
								)}
								<ImageUpload
									currentImage={selectedOperator.imageKey}
									onImageUpload={handleImageUpload}
								/>
								{selectedOperator.imageKey && (
									<p className='mt-2 text-xs text-green-400'>✓ Image uploaded</p>
								)}
							</div>
						</div>

						{/** CALL SIGN **/}
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
								onChange={(e) =>
									setSelectedOperator({
										...selectedOperator,
										callSign: e.target.value,
									})
								}
								required
							/>
						</div>
						<br />

						{/** CLASS — multi-select toggle, max 3 **/}
						<div className='w-full'>
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
