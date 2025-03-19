import { useState } from "react";

const useConfirmDialog = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [confirmAction, setConfirmAction] = useState(() => () => {});

	const openDialog = (action) => {
		setIsOpen(true);
		setConfirmAction(() => action);
	};

	const closeDialog = () => {
		setIsOpen(false);
	};

	return { isOpen, openDialog, closeDialog, confirmAction };
};

export default useConfirmDialog;
