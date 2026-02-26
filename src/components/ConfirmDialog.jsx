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
	// ── Injury assignment variant ──────────────────────────────
	if (injuryType === "choice") {
		return (
			<Dialog
				open={isOpen}
				onOpenChange={closeDialog}>
				<DialogContent className='max-w-[90%] sm:max-w-md text-fontz z-[1110]'>
					<DialogHeader>
						<DialogTitle className='font-mono text-[11px] tracking-[0.18em] text-lines uppercase'>
							Assign Injury —{" "}
							<span className='text-btn'>{selectedOperator?.callSign}</span>
						</DialogTitle>
						<DialogDescription className='font-mono text-[10px] tracking-widest text-lines/40 uppercase'>
							Select injury type to assign to this operator.
						</DialogDescription>
					</DialogHeader>

					<p className='font-mono text-xs text-lines/50 leading-relaxed border border-lines/15 bg-blk/40 rounded px-3 py-2'>
						Random injuries vary in severity and recovery time, and may escalate
						to KIA. KIA injuries are always fatal and move the operator to the
						memorial.
					</p>

					<DialogFooter className='flex flex-col sm:flex-row gap-2 pt-2'>
						<Button
							variant='outline'
							onClick={closeDialog}
							className='w-full sm:w-auto btn font-mono text-[10px] tracking-widest uppercase'>
							Cancel
						</Button>
						<Button
							variant='default'
							onClick={onRandomInjury}
							className='btn font-mono text-[10px] tracking-widest uppercase'>
							Random Injury
						</Button>
						<Button
							variant='destructive'
							onClick={onKIAInjury}
							className='btn font-mono text-[10px] tracking-widest uppercase bg-red-900/60 hover:bg-red-800 border border-red-700/40 text-red-300'>
							KIA
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	// ── Generic confirm variant ────────────────────────────────
	return (
		<Dialog
			open={isOpen}
			onOpenChange={closeDialog}>
			<DialogContent className='max-w-[90%] sm:max-w-md text-fontz z-[1110]'>
				<DialogHeader>
					<DialogTitle className='font-mono text-[11px] tracking-[0.18em] text-lines uppercase'>
						{title}
					</DialogTitle>
					{description && (
						<p className='font-mono text-xs text-lines/50 mt-1'>
							{description}
						</p>
					)}
					<DialogDescription className='font-mono text-xs text-lines/40 leading-relaxed border border-lines/15 bg-blk/40 rounded px-3 py-2 mt-2'>
						{message}
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className='flex flex-col sm:flex-row gap-2 pt-2'>
					<Button
						variant='outline'
						onClick={closeDialog}
						className='w-full sm:w-auto btn font-mono text-[10px] tracking-widest uppercase'>
						Cancel
					</Button>
					<Button
						variant='destructive'
						onClick={() => {
							confirmAction?.();
							closeDialog();
						}}
						className='w-full sm:w-auto font-mono text-[10px] tracking-widest uppercase bg-red-900/60 hover:bg-red-800 border border-red-700/40 text-red-300'>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

// All action props are optional — each variant only needs its own subset.
// confirmAction   → generic confirm dialog only
// onRandomInjury  → injury dialog only
// onKIAInjury     → injury dialog only
ConfirmDialog.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	closeDialog: PropTypes.func.isRequired,
	confirmAction: PropTypes.func, // optional — not used in injury variant
	title: PropTypes.string,
	message: PropTypes.string,
	description: PropTypes.string,
	selectedOperator: PropTypes.object, // fixed: was PropTypes.string
	onRandomInjury: PropTypes.func, // optional — not used in confirm variant
	onKIAInjury: PropTypes.func, // optional — not used in confirm variant
	injuryType: PropTypes.string,
};

export default ConfirmDialog;
