// SquadSelectorSheet.jsx
// Opens from the button next to TabbedRoster tabs.
// Create squads, rename, delete, select active squad filter.
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPlus,
	faCheck,
	faXmark,
	faPen,
	faTrash,
	faSpinner,
	faUsers,
	faBullseye,
} from "@fortawesome/free-solid-svg-icons";
import { useSquadStore } from "@/zustand";
import PropTypes from "prop-types";

// ── Single squad row ──────────────────────────────────────────
function SquadRow({ squad, isActive, onSelect, onRename, onDelete }) {
	const [renaming, setRenaming] = useState(false);
	const [nameVal, setNameVal] = useState(squad.name);
	const [confirmDel, setConfirmDel] = useState(false);
	const [busy, setBusy] = useState(false);
	const inputRef = useRef(null);

	useEffect(() => {
		if (renaming) inputRef.current?.focus();
	}, [renaming]);

	const handleRename = async () => {
		const trimmed = nameVal.trim();
		if (!trimmed || trimmed === squad.name) {
			setRenaming(false);
			setNameVal(squad.name);
			return;
		}
		setBusy(true);
		await onRename(squad._id, trimmed);
		setRenaming(false);
		setBusy(false);
	};

	const handleDelete = async () => {
		setBusy(true);
		await onDelete(squad._id);
	};

	return (
		<div
			className={[
				"flex items-center gap-2 px-3 py-2.5 rounded-sm border transition-all",
				isActive ?
					"border-btn/50 bg-btn/8"
				:	"border-lines/15 bg-blk/40 hover:border-lines/25",
			].join(" ")}>
			{/* Active dot */}
			<span
				className={[
					"w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
					isActive ?
						"bg-btn shadow-[0_0_5px_rgba(124,170,121,0.6)]"
					:	"bg-lines/15",
				].join(" ")}
			/>

			{/* Name / rename input */}
			{renaming ?
				<input
					ref={inputRef}
					value={nameVal}
					onChange={(e) => setNameVal(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleRename();
						if (e.key === "Escape") {
							setRenaming(false);
							setNameVal(squad.name);
						}
					}}
					className='flex-1 bg-blk/60 border border-btn/40 rounded-sm px-2 py-0.5 font-mono text-[11px] text-fontz focus:outline-none focus:border-btn min-w-0'
				/>
			:	<button
					onClick={() => onSelect(isActive ? null : squad._id)}
					className='flex-1 text-left font-mono text-[11px] text-fontz/85 hover:text-fontz truncate transition-colors'>
					{squad.name}
				</button>
			}

			{/* Actions */}
			<div className='flex items-center gap-0.5 shrink-0'>
				{renaming ?
					<>
						<button
							onClick={handleRename}
							disabled={busy}
							className='w-6 h-6 flex items-center justify-center text-btn hover:text-white transition-colors'>
							{busy ?
								<FontAwesomeIcon
									icon={faSpinner}
									className='animate-spin text-[9px]'
								/>
							:	<FontAwesomeIcon
									icon={faCheck}
									className='text-[9px]'
								/>
							}
						</button>
						<button
							onClick={() => {
								setRenaming(false);
								setNameVal(squad.name);
							}}
							className='w-6 h-6 flex items-center justify-center text-lines/30 hover:text-fontz transition-colors'>
							<FontAwesomeIcon
								icon={faXmark}
								className='text-[9px]'
							/>
						</button>
					</>
				: confirmDel ?
					<>
						<button
							onClick={handleDelete}
							disabled={busy}
							className='font-mono text-[8px] tracking-widest text-red-400 border border-red-900/40 bg-red-900/10 px-1.5 py-0.5 rounded-sm hover:bg-red-900/20 transition-colors'>
							{busy ?
								<FontAwesomeIcon
									icon={faSpinner}
									className='animate-spin'
								/>
							:	"DELETE"}
						</button>
						<button
							onClick={() => setConfirmDel(false)}
							className='font-mono text-[8px] tracking-widest text-lines/35 border border-lines/15 px-1.5 py-0.5 rounded-sm hover:text-fontz transition-colors ml-1'>
							CANCEL
						</button>
					</>
				:	<>
						<button
							onClick={() => setRenaming(true)}
							className='w-6 h-6 flex items-center justify-center text-lines/25 hover:text-fontz transition-colors'
							title='Rename'>
							<FontAwesomeIcon
								icon={faPen}
								className='text-[9px]'
							/>
						</button>
						<button
							onClick={() => setConfirmDel(true)}
							className='w-6 h-6 flex items-center justify-center text-lines/20 hover:text-red-400 transition-colors'
							title='Delete'>
							<FontAwesomeIcon
								icon={faTrash}
								className='text-[9px]'
							/>
						</button>
					</>
				}
			</div>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// SQUAD SELECTOR SHEET
// ═══════════════════════════════════════════════════════════════
const SquadSelectorSheet = ({ onClose }) => {
	const {
		squads,
		activeSquadId,
		loading,
		fetchSquads,
		createSquad,
		renameSquad,
		deleteSquad,
		setActiveSquadId,
	} = useSquadStore();

	const [showInput, setShowInput] = useState(false);
	const [newName, setNewName] = useState("");
	const [creating, setCreating] = useState(false);
	const inputRef = useRef(null);

	useEffect(() => {
		fetchSquads();
	}, [fetchSquads]);
	useEffect(() => {
		if (showInput) inputRef.current?.focus();
	}, [showInput]);

	const handleCreate = async () => {
		if (!newName.trim()) return;
		setCreating(true);
		await createSquad(newName.trim());
		setNewName("");
		setShowInput(false);
		setCreating(false);
	};

	const handleSelect = (squadId) => {
		setActiveSquadId(squadId);
		if (onClose) onClose();
	};

	return (
		<div className='flex flex-col gap-4 p-1'>
			{/* ── All Operators (default) ── */}
			<button
				onClick={() => handleSelect(null)}
				className={[
					"flex items-center gap-3 px-3 py-3 rounded-sm border transition-all text-left",
					activeSquadId === null ?
						"border-btn/50 bg-btn/8"
					:	"border-lines/15 bg-blk/40 hover:border-lines/25",
				].join(" ")}>
				<FontAwesomeIcon
					icon={faUsers}
					className={
						activeSquadId === null ? "text-btn text-sm" : (
							"text-lines/25 text-sm"
						)
					}
				/>
				<div className='flex flex-col gap-0.5'>
					<span className='font-mono text-[11px] text-fontz/85'>
						All Operators
					</span>
					<span className='font-mono text-[8px] text-lines/30 uppercase tracking-widest'>
						Default roster view
					</span>
				</div>
				{activeSquadId === null && (
					<span className='ml-auto font-mono text-[8px] text-btn tracking-widest'>
						ACTIVE
					</span>
				)}
			</button>

			{/* ── Divider ── */}
			<div className='flex items-center gap-2'>
				<div className='flex-1 h-px bg-lines/10' />
				<span className='font-mono text-[8px] tracking-[0.3em] text-lines/20 uppercase'>
					Squads
				</span>
				<div className='flex-1 h-px bg-lines/10' />
				<button
					onClick={() => setShowInput((p) => !p)}
					className='w-5 h-5 flex items-center justify-center bg-btn hover:bg-highlight text-blk rounded transition-colors'
					title='New Squad'>
					<FontAwesomeIcon
						icon={faPlus}
						className='text-[8px]'
					/>
				</button>
			</div>

			{/* ── Create input ── */}
			{showInput && (
				<div className='flex items-center gap-2'>
					<input
						ref={inputRef}
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleCreate();
							if (e.key === "Escape") {
								setShowInput(false);
								setNewName("");
							}
						}}
						placeholder='Squad name...'
						className='flex-1 bg-blk/60 border border-lines/25 focus:border-btn/50 rounded-sm px-3 py-1.5 font-mono text-[11px] text-fontz placeholder:text-lines/20 focus:outline-none transition-colors'
					/>
					<button
						onClick={handleCreate}
						disabled={creating || !newName.trim()}
						className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-btn border border-btn/35 bg-btn/8 hover:bg-btn/18 px-2.5 py-1.5 rounded-sm transition-all disabled:opacity-40'>
						{creating ?
							<FontAwesomeIcon
								icon={faSpinner}
								className='animate-spin text-[9px]'
							/>
						:	<FontAwesomeIcon
								icon={faCheck}
								className='text-[9px]'
							/>
						}
						Create
					</button>
				</div>
			)}

			{/* ── Squad list ── */}
			{loading && !squads.length ?
				<div className='flex items-center justify-center py-8 gap-2'>
					<FontAwesomeIcon
						icon={faSpinner}
						className='animate-spin text-lines/30'
					/>
					<span className='font-mono text-[9px] text-lines/25'>Loading...</span>
				</div>
			: squads.length === 0 ?
				<div className='flex flex-col items-center gap-2 py-8'>
					<FontAwesomeIcon
						icon={faBullseye}
						className='text-lines/15 text-2xl'
					/>
					<p className='font-mono text-[9px] text-lines/25 uppercase tracking-widest text-center'>
						No squads yet — hit + to create one
					</p>
				</div>
			:	<div className='flex flex-col gap-1.5'>
					{squads.map((squad) => (
						<SquadRow
							key={squad._id}
							squad={squad}
							isActive={activeSquadId === squad._id}
							onSelect={handleSelect}
							onRename={renameSquad}
							onDelete={deleteSquad}
						/>
					))}
				</div>
			}

			{/* ── Note ── */}
			<p className='font-mono text-[8px] text-lines/20 text-center leading-relaxed mt-2'>
				Enablers and Aviation are shared across all squads.
				<br />
				Assign operators to squads via the operator edit form.
			</p>
		</div>
	);
};

SquadRow.propTypes = {
	squad: PropTypes.object.isRequired,
	isActive: PropTypes.bool.isRequired,
	onSelect: PropTypes.func.isRequired,
	onRename: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};
SquadSelectorSheet.propTypes = {
	onClose: PropTypes.func,
};

export default SquadSelectorSheet;
