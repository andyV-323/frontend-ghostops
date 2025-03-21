import { Button } from "@material-tailwind/react";
import { useEffect } from "react";
import { ghostID } from "@/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useOperatorsStore, useSheetStore } from "@/zustand";
import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import { useHandleChange, useFormActions, useConfirmDialog } from "@/hooks";
import { ConfirmDialog } from "@/components";

const EditOperatorForm = ({ operator }) => {
	const handleChange = useHandleChange();
	const { handleUpdateOperator, handleDeleteOperator } = useFormActions();
	const { closeSheet } = useSheetStore();

	// Ensure we have an operator ID
	const operatorId = operator._id;

	const {
		selectedOperator,
		fetchOperatorById,
		setSelectedOperator,
		fetchOperators,
		loading,
	} = useOperatorsStore();
	const { isOpen, openDialog, closeDialog, confirmAction } = useConfirmDialog();
	// Load operator data when component mounts
	useEffect(() => {
		if (operator) {
			fetchOperatorById(operatorId);
		}
	}, [operatorId]);

	// Show loading state if data is still being fetched
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
					{/*FULLNAME*/}
					<div className='flex flex-col items-center'>
						<div className='w-full'>
							<label className=' block mb-2  font-medium '>Fullname</label>
							<input
								type='text'
								name='name'
								className='form'
								placeholder='Last name, First name'
								value={selectedOperator.name || ""}
								onChange={handleChange}></input>
						</div>
						<br />
						<div className='w-full'>
							<label className='block mb-2 font-medium'>I.D Image</label>
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
						</div>

						{/*CALL SIGN*/}
						<div className='w-full'>
							<label className='block mb-2 font-medium'>Call Sign</label>
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
						<div className='w-full'>
							<label className='block mb-2 font-medium'>Elite Unit Name</label>
							<input
								type='text'
								name='sf'
								className='form'
								placeholder='sf (e.g., Ghost Recon, Navy Seal, SAS)'
								value={selectedOperator.sf || ""}
								onChange={handleChange}></input>
						</div>
						<br />
						{/*NATIONALITY*/}
						<div className='w-full'>
							<label className='block mb-2 font-medium'>Nationality</label>
							<input
								type='text'
								name='nationality'
								className='form'
								placeholder='Nationality (e.g., USA, Canada)'
								value={selectedOperator.nationality || ""}
								onChange={handleChange}></input>
						</div>
						<br />
						{/*RANK*/}
						<div className='w-full'>
							<label className='block mb-2 font-medium '>Rank</label>
							<input
								type='text'
								className='form'
								placeholder='Rank'
								name='rank'
								value={selectedOperator.rank || ""}
								onChange={handleChange}></input>
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
