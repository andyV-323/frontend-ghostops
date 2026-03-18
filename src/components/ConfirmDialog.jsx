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
	onUnknownFate,
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
							Casualty Report —{" "}
							<span className='text-btn'>{selectedOperator?.callSign}</span>
						</DialogTitle>
						<DialogDescription className='font-mono text-[10px] tracking-widest text-lines/40 uppercase'>
							Select the circumstances of this operator&apos;s casualty.
						</DialogDescription>
					</DialogHeader>

					<div className='flex flex-col gap-2 pt-2'>
						{/* Random Injury */}
						<button
							onClick={onRandomInjury}
							className='w-full text-left px-4 py-3 rounded border border-yellow-700/40 bg-yellow-900/20 hover:bg-yellow-900/40 transition-colors'>
							<p className='font-mono text-[11px] tracking-widest uppercase text-yellow-400'>
								Random Injury
							</p>
							<p className='font-mono text-[10px] text-lines/40 mt-0.5'>
								Operator went down. Injury guaranteed — KIA possible.
							</p>
						</button>

						{/* Unknown Fate */}
						<button
							onClick={onUnknownFate}
							className='w-full text-left px-4 py-3 rounded border border-orange-700/40 bg-orange-900/20 hover:bg-orange-900/40 transition-colors'>
							<p className='font-mono text-[11px] tracking-widest uppercase text-orange-400'>
								Unknown Fate
							</p>
							<p className='font-mono text-[10px] text-lines/40 mt-0.5'>
								Operator may have survived, wounded, or KIA.
							</p>
						</button>

						{/* KIA */}
						<button
							onClick={onKIAInjury}
							className='w-full text-left px-4 py-3 rounded border border-red-700/40 bg-red-900/20 hover:bg-red-900/40 transition-colors'>
							<p className='font-mono text-[11px] tracking-widest uppercase text-red-400'>
								KIA
							</p>
							<p className='font-mono text-[10px] text-lines/40 mt-0.5'>
								Confirmed kill. Operator is dead. No roll — straight to
								memorial.
							</p>
						</button>
					</div>

					<DialogFooter className='pt-2'>
						<Button
							variant='outline'
							onClick={closeDialog}
							className='w-full btn font-mono text-[10px] tracking-widest uppercase'>
							Cancel
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
	onUnknownFate: PropTypes.func,
	injuryType: PropTypes.string,
};

export default ConfirmDialog;
