import { useOperatorsStore, useSheetStore } from "@/zustand";

const useFormActions = () => {
	const {
		createOperator,
		updateOperator,
		selectedOperator,
		deleteOperator,
		fetchOperators,
	} = useOperatorsStore();
	const { closeSheet } = useSheetStore();

	//CREATE
	const handleCreateOperator = async (e) => {
		e.preventDefault();
		await createOperator(selectedOperator);
		await closeSheet();
	};
	//UPDATE
	const handleUpdateOperator = async (e, operatorId) => {
		e.preventDefault();
		await updateOperator(operatorId, selectedOperator);
		await fetchOperators();
		await closeSheet();
	};
	//DELETE
	const handleDeleteOperator = async (operatorId) => {
		if (!operatorId) {
			console.error("handleDeleteOperator called without an operatorId");
			return;
		}
		await deleteOperator(operatorId);
	};

	return {
		handleCreateOperator,
		handleUpdateOperator,
		handleDeleteOperator,
	};
};

export default useFormActions;
