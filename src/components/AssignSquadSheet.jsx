// AssignSquadSheet.jsx
// Opens from operator row — add/remove this operator from any squad
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPlus,
	faMinus,
	faSpinner,
	faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { useSquadStore } from "@/zustand";
import { PropTypes } from "prop-types";

const AssignSquadSheet = ({ operator, onComplete }) => {
	const { squads, fetchSquads, updateSquadOperator, loading } = useSquadStore();
	const [busy, setBusy] = useState(null); // squadId currently being toggled

	useEffect(() => {
		fetchSquads();
	}, [fetchSquads]);

	// Which squads already contain this operator
	const memberOf = (squad) =>
		squad.operators?.some((op) => (op._id ?? op) === operator._id);

	const handleToggle = async (squad) => {
		const action = memberOf(squad) ? "remove" : "add";
		setBusy(squad._id);
		await updateSquadOperator(squad._id, operator._id, action);
		setBusy(null);
		if (onComplete) onComplete();
	};

	return (
		<div className='flex flex-col gap-4 p-1'>
			{/* Header */}
			<div className='flex items-center gap-3 pb-2 border-b border-lines/15'>
				<div className='w-10 h-10 rounded-full border border-lines/25 overflow-hidden shrink-0 bg-highlight'>
					<img
						src={operator.imageKey || operator.image || "/ghost/Default.png"}
						alt={operator.callSign}
						className='w-full h-full object-cover object-top'
						onError={(e) => {
							e.currentTarget.src = "/ghost/Default.png";
						}}
					/>
				</div>
				<div>
					<p className='font-mono text-sm text-fontz'>{operator.callSign}</p>
					<p className='font-mono text-[9px] tracking-widest text-lines/35 uppercase'>
						{operator.class} · {operator.role || "No Role"}
					</p>
				</div>
			</div>

			{/* Instruction */}
			<p className='font-mono text-[9px] tracking-widest text-lines/30 uppercase'>
				Toggle squad assignment
			</p>

			{/* Squad list */}
			{loading && !squads.length ?
				<div className='flex items-center justify-center py-8 gap-2'>
					<FontAwesomeIcon
						icon={faSpinner}
						className='animate-spin text-lines/30'
					/>
					<span className='font-mono text-[9px] text-lines/30'>
						Loading squads...
					</span>
				</div>
			: squads.length === 0 ?
				<div className='flex flex-col items-center justify-center py-10 gap-3'>
					<FontAwesomeIcon
						icon={faUsers}
						className='text-lines/15 text-2xl'
					/>
					<p className='font-mono text-[9px] tracking-widest text-lines/25 uppercase text-center'>
						No squads created yet
					</p>
				</div>
			:	<div className='flex flex-col gap-2'>
					{squads.map((squad) => {
						const assigned = memberOf(squad);
						const isBusy = busy === squad._id;
						return (
							<div
								key={squad._id}
								className={[
									"flex items-center justify-between px-3 py-3 rounded-sm border transition-all",
									assigned ?
										"border-btn/40 bg-btn/8"
									:	"border-lines/15 bg-blk/40 hover:border-lines/30",
								].join(" ")}>
								{/* Squad info */}
								<div className='flex flex-col gap-0.5'>
									<span className='font-mono text-[11px] text-fontz/85'>
										{squad.name}
									</span>
									<span className='font-mono text-[8px] tracking-widest text-lines/30 uppercase'>
										{squad.operators?.length || 0} operator
										{squad.operators?.length !== 1 ? "s" : ""}
										{assigned && (
											<span className='text-btn ml-2'>· ASSIGNED</span>
										)}
									</span>
								</div>

								{/* Toggle button */}
								<button
									onClick={() => handleToggle(squad)}
									disabled={isBusy}
									className={[
										"flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase px-2.5 py-1.5 rounded-sm border transition-all",
										assigned ?
											"text-red-400 border-red-900/40 bg-red-900/10 hover:bg-red-900/20"
										:	"text-btn border-btn/30 bg-btn/5 hover:bg-btn/15",
										isBusy ? "opacity-50 cursor-not-allowed" : "",
									].join(" ")}>
									{isBusy ?
										<FontAwesomeIcon
											icon={faSpinner}
											className='animate-spin text-[9px]'
										/>
									: assigned ?
										<FontAwesomeIcon
											icon={faMinus}
											className='text-[9px]'
										/>
									:	<FontAwesomeIcon
											icon={faPlus}
											className='text-[9px]'
										/>
									}
									{assigned ? "Remove" : "Assign"}
								</button>
							</div>
						);
					})}
				</div>
			}
		</div>
	);
};

AssignSquadSheet.propTypes = {
	operator: PropTypes.object.isRequired,
	onComplete: PropTypes.func,
};

export default AssignSquadSheet;
