// components/mission/NewMissionModal.jsx
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faXmark,
	faBolt,
	faPencil,
	faRotate,
} from "@fortawesome/free-solid-svg-icons";
import {
	generateMissionName,
	generateMissionNames,
} from "@/utils/generateMissionName";

export default function NewMissionModal({
	onConfirm,
	onCancel,
	loading = false,
}) {
	const [name, setName] = useState("");
	const [suggestions, setSuggestions] = useState([]);
	const [editing, setEditing] = useState(false);

	useEffect(() => {
		const names = generateMissionNames(3);
		setSuggestions(names);
		setName(names[0]);
	}, []);

	const rerollAll = () => {
		const names = generateMissionNames(3);
		setSuggestions(names);
		setName(names[0]);
		setEditing(false);
	};

	return (
		<div className='fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm'>
			<div className='w-full max-w-md flex flex-col bg-blk border border-lines/25 rounded-sm shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden'>
				{/* ── Header ── */}
				<div className='flex items-center justify-between px-4 py-3 bg-blk/80 border-b border-lines/20'>
					<div className='flex items-center gap-2'>
						<span className='w-1.5 h-1.5 rounded-full bg-btn shadow-[0_0_6px_rgba(124,170,121,0.5)]' />
						<span className='font-mono text-[10px] tracking-[0.22em] text-lines/60 uppercase'>
							New Operation
						</span>
					</div>
					<button
						onClick={onCancel}
						className='text-lines/30 hover:text-fontz transition-colors p-1'>
						<FontAwesomeIcon icon={faXmark} />
					</button>
				</div>

				<div className='flex flex-col gap-5 p-5'>
					{/* Classification stamp */}
					<div className='flex items-center justify-between px-3 py-2 bg-red-950/20 border border-red-900/25 rounded-sm'>
						<span className='font-mono text-[8px] tracking-[0.3em] text-red-500/40 uppercase'>
							// Classification: Top Secret //
						</span>
						<span className='font-mono text-[8px] tracking-widest text-lines/20'>
							NOMAD-7
						</span>
					</div>

					{/* ── Name field ── */}
					<div className='flex flex-col gap-2'>
						<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
							Operation Name
						</span>

						{editing ?
							<div className='flex gap-2'>
								<input
									autoFocus
									type='text'
									value={name}
									maxLength={48}
									placeholder='OPERATION ...'
									onChange={(e) => setName(e.target.value.toUpperCase())}
									className='flex-1 bg-blk/60 border border-lines/30 focus:border-btn/60 focus:outline-none rounded-sm px-3 py-2.5 font-mono text-xs text-fontz placeholder:text-lines/20 tracking-widest uppercase'
								/>
								<button
									onClick={() => setEditing(false)}
									className='px-3 border border-lines/20 hover:border-lines/40 text-lines/35 hover:text-fontz rounded-sm transition-colors font-mono text-[9px] uppercase tracking-widest'>
									Done
								</button>
							</div>
						:	<div className='flex items-center gap-2 px-3 py-3 border border-lines/20 bg-blk/40 rounded-sm'>
								<span className='flex-1 font-mono text-sm text-fontz tracking-widest truncate'>
									{name || "—"}
								</span>
								<button
									onClick={() => setEditing(true)}
									className='text-lines/25 hover:text-btn transition-colors p-1 shrink-0'>
									<FontAwesomeIcon
										icon={faPencil}
										className='text-[10px]'
									/>
								</button>
								<button
									onClick={() => setName(generateMissionName())}
									className='text-lines/25 hover:text-btn transition-colors p-1 shrink-0'>
									<FontAwesomeIcon
										icon={faRotate}
										className='text-[10px]'
									/>
								</button>
							</div>
						}
					</div>

					{/* ── Suggestions ── */}
					<div className='flex flex-col gap-2'>
						<div className='flex items-center justify-between'>
							<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
								Suggestions
							</span>
							<button
								onClick={rerollAll}
								className='flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase text-lines/30 hover:text-btn transition-colors'>
								<FontAwesomeIcon
									icon={faRotate}
									className='text-[8px]'
								/>
								Re-roll
							</button>
						</div>
						<div className='flex flex-col gap-1.5'>
							{suggestions.map((s) => (
								<button
									key={s}
									onClick={() => {
										setName(s);
										setEditing(false);
									}}
									className={[
										"w-full text-left px-3 py-2.5 border rounded-sm font-mono text-[11px] tracking-widest transition-all",
										name === s ?
											"border-btn/40 bg-btn/10 text-btn"
										:	"border-lines/15 bg-blk/30 text-lines/45 hover:border-lines/35 hover:text-fontz hover:bg-white/[0.03]",
									].join(" ")}>
									{s}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* ── Footer ── */}
				<div className='flex gap-2 px-5 pb-5'>
					<button
						onClick={onCancel}
						className='flex-1 py-2.5 border border-lines/20 hover:border-lines/35 text-lines/35 hover:text-fontz font-mono text-[10px] tracking-widest uppercase rounded-sm transition-all'>
						Cancel
					</button>
					<button
						disabled={!name.trim() || loading}
						onClick={() => onConfirm(name.trim() || generateMissionName())}
						className={[
							"flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase rounded-sm transition-all border",
							name.trim() && !loading ?
								"bg-btn text-blk border-btn hover:bg-highlight"
							:	"bg-transparent text-lines/20 border-lines/10 cursor-not-allowed",
						].join(" ")}>
						{loading ?
							<span className='animate-pulse'>Creating...</span>
						:	<>
								<FontAwesomeIcon
									icon={faBolt}
									className='text-[9px]'
								/>{" "}
								Create Mission
							</>
						}
					</button>
				</div>
			</div>
		</div>
	);
}
