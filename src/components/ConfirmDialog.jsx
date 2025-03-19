import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PropTypes from "prop-types";

const ConfirmDialog = ({
	isOpen,
	closeDialog,
	confirmAction,
	title = "Confirm Action",
	message = "Are you sure you want to proceed?",
}) => {
	return (
		<Dialog
			open={isOpen}
			onOpenChange={closeDialog}>
			<DialogContent className='max-w-[90%] sm:max-w-md text-fontz z-[1110]'>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{message}</DialogDescription>
				</DialogHeader>

				<DialogFooter className='flex flex-col sm:flex-row gap-2'>
					<Button
						variant='outline'
						onClick={closeDialog}
						className='w-full sm:w-auto btn font-bold'>
						Cancel
					</Button>
					<Button
						variant='destructive'
						onClick={() => {
							confirmAction();
							closeDialog();
						}}
						className='w-full sm:w-auto btn font-bold'>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

ConfirmDialog.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	closeDialog: PropTypes.func.isRequired,
	confirmAction: PropTypes.func.isRequired,
	title: PropTypes.string,
	message: PropTypes.string,
};

export default ConfirmDialog;
