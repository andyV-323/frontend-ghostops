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
	description,
	selectedOperator,
	onRandomInjury,
	onKIAInjury,
	injuryType,
}) => {
	if (injuryType === "choice") {
		return (
			<Dialog
				open={isOpen}
				onOpenChange={closeDialog}>
				<DialogContent className='max-w-[90%] sm:max-w-md text-fontz z-[1110]'>
					<DialogHeader>
						<DialogTitle>
							Assign Injury to {selectedOperator?.callSign}
						</DialogTitle>
						<DialogDescription>
							Choose the type of injury to assign to this operator.
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-3'>
						<p className='text-sm text-gray-400'>
							Random injuries vary in severity and recovery time, may lead to
							KIA status. KIA injuries are always fatal.
						</p>
					</div>

					<DialogFooter className='flex flex-col sm:flex-row gap-2'>
						<Button
							variant='outline'
							onClick={closeDialog}
							className='w-full sm:w-auto btn font-bold'>
							Cancel
						</Button>
						<Button
							variant='default'
							onClick={onRandomInjury}
							className='btn font-bold'>
							Random Injury
						</Button>
						<Button
							variant='destructive'
							onClick={onKIAInjury}
							className='btn font-bold'>
							KIA
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={closeDialog}>
			<DialogContent className='max-w-[90%] sm:max-w-md text-fontz z-[1110]'>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && ( // Render description only if provided
						<p className='text-sm text-gray-400'>{description}</p>
					)}
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
	description: PropTypes.string,
	selectedOperator: PropTypes.string,
	onRandomInjury: PropTypes.func.isRequired,
	onKIAInjury: PropTypes.func.isRequired,
	injuryType: PropTypes.string,
};

export default ConfirmDialog;
