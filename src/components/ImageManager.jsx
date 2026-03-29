import { useState } from "react";
import { useOperatorsStore } from "@/zustand";
import { OperatorsApi } from "@/api";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faImages, faSpinner } from "@fortawesome/free-solid-svg-icons";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageManager() {
	const { operators, fetchOperators } = useOperatorsStore();
	const [deleting, setDeleting] = useState(null); // operatorId being deleted

	const uploadedOperators = operators.filter(
		(op) => op.imageKey && op.imageKey.includes("amazonaws.com"),
	);

	const handleRemove = async (operator) => {
		setDeleting(operator._id);
		try {
			await OperatorsApi.deleteOperatorImage(operator.imageKey);
			await OperatorsApi.updateOperator(operator._id, { imageKey: null });
			await fetchOperators();
			toast.success(`Image removed for ${operator.callSign}.`);
		} catch {
			toast.error("Failed to remove image.");
		} finally {
			setDeleting(null);
		}
	};

	return (
		<div
			className='w-full font-mono text-xs bg-[#0a0c0e]'
			style={{ fontFamily: "'Courier New', 'Lucida Console', monospace" }}>
			{/* ── Header ── */}
			<div className='flex items-center gap-2 px-3 py-2 border-b border-zinc-800/60'>
				<FontAwesomeIcon icon={faImages} className='text-zinc-600 text-[10px]' />
				<span className='text-zinc-500 uppercase tracking-widest text-[10px]'>
					Uploaded Images
				</span>
				<span className='ml-auto text-[9px] text-zinc-700 uppercase tracking-widest'>
					{uploadedOperators.length} asset{uploadedOperators.length !== 1 ? "s" : ""}
				</span>
			</div>

			{/* ── Empty state ── */}
			{uploadedOperators.length === 0 && (
				<div className='px-3 py-6 text-center text-zinc-700 uppercase tracking-widest text-[10px]'>
					No uploaded images on file
				</div>
			)}

			{/* ── Image grid ── */}
			<div className='divide-y divide-zinc-800/60'>
				{uploadedOperators.map((op) => (
					<div
						key={op._id}
						className='flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.02] transition-colors'>
						{/* Thumbnail */}
						<div className='w-10 h-10 shrink-0 rounded-sm overflow-hidden border border-zinc-800'>
							<img
								src={op.imageKey}
								alt={op.callSign}
								className='w-full h-full object-cover object-top'
								onError={(e) => {
									e.currentTarget.src = "/ghost/Default.png";
								}}
							/>
						</div>

						{/* Info */}
						<div className='flex-1 min-w-0'>
							<div className='text-zinc-300 uppercase tracking-wider text-[11px] truncate'>
								{op.callSign}
							</div>
							<div className='text-zinc-700 text-[9px] uppercase tracking-widest truncate'>
								{op.imageKey.split("/").pop()}
							</div>
						</div>

						{/* Delete */}
						<button
							onClick={() => handleRemove(op)}
							disabled={deleting === op._id}
							title='Remove image'
							className='shrink-0 flex items-center justify-center w-6 h-6 rounded-sm border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-900/50 hover:bg-red-900/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed'>
							<FontAwesomeIcon
								icon={deleting === op._id ? faSpinner : faTrash}
								className={`text-[10px] ${deleting === op._id ? "animate-spin" : ""}`}
							/>
						</button>
					</div>
				))}
			</div>

			{/* ── Footer ── */}
			{uploadedOperators.length > 0 && (
				<div className='px-3 py-1.5 border-t border-zinc-800/60 flex items-center justify-between'>
					<span className='text-[9px] text-zinc-700 uppercase tracking-widest'>
						S3 — Operator storage
					</span>
					<span className='text-[9px] text-zinc-700 uppercase tracking-widest'>
						Removal is permanent
					</span>
				</div>
			)}
		</div>
	);
}
