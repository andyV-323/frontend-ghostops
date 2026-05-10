import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import { useOperatorsStore, useTeamsStore } from "@/zustand";
import { useKitsStore } from "@/zustand";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Infirmary, Memorial } from "@/components/tables";
import {
	faUserPen,
	faShieldHalved,
	faStar,
} from "@fortawesome/free-solid-svg-icons";
import { PropTypes } from "prop-types";
import { EditOperatorForm } from "./forms";
import ConfirmDialog from "./ConfirmDialog";
import { PERKS } from "@/config";

/* ─── Status config ──────────────────────────────────────────── */
const STATUS = {
	Active: {
		dot: "bg-green-500 shadow-[0_0_6px_rgba(74,222,128,0.6)]",
		badge: "text-green-400 border-green-900/50 bg-green-900/20",
		label: "ACTIVE",
	},
	Injured: {
		dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
		badge: "text-amber-400 border-amber-900/50 bg-amber-900/20",
		label: "WIA",
	},
	KIA: {
		dot: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]",
		badge: "text-red-400 border-red-900/50 bg-red-900/20",
		label: "KIA",
	},
};

/* ═══════════════════════════════════════════════════════════════ */
const OperatorImageView = ({ operator, openSheet }) => {
	const { selectedOperator, fetchOperatorById, fetchOperators } =
		useOperatorsStore();
	const {
		teams,
		fetchTeams,
		assignRandomInjury,
		assignRandomKIAInjury,
		assignUnknownFate,
	} = useTeamsStore();
	const { kits } = useKitsStore();
	const [injuryDialogOpen, setInjuryDialogOpen] = useState(false);

	useEffect(() => {
		fetchTeams();
	}, [fetchTeams]);
	useEffect(() => {
		if (operator?._id) fetchOperatorById(operator._id);
	}, [operator?._id, fetchOperatorById]);

	const teamName = useMemo(() => {
		const team = teams.find((t) =>
			t.operators?.some((op) => op?._id === operator?._id),
		);
		return team ? team.name : null;
	}, [teams, operator?._id]);
	const perks = (selectedOperator.perks || []).filter((p) => PERKS[p]);
	const squadName =
		selectedOperator?.squad?.name ||
		(typeof selectedOperator?.squad === "string" && selectedOperator.squad) ||
		null;

	if (!selectedOperator) {
		return (
			<div className='flex flex-col items-center justify-center p-12 gap-3'>
				<div className='w-8 h-8 border border-lines/20 rotate-45' />
				<p className='font-mono text-[10px] tracking-[0.2em] text-lines/25 uppercase'>
					Loading Operator Profile
				</p>
			</div>
		);
	}

	const displayImage =
		selectedOperator.imageKey || selectedOperator.image || "/ghost/Default.png";
	const status = STATUS[selectedOperator.status] ?? STATUS.Active;
	const isKIA = selectedOperator.status === "KIA";
	const isWIA =
		selectedOperator.status === "Injured" ||
		selectedOperator.status === "Wounded";

	const assignedKits = (selectedOperator.assignedKitIds || [])
		.map((id) => kits.find((k) => k._id === id))
		.filter(Boolean);

	const refreshAll = () => {
		fetchOperators();
		fetchTeams();
	};

	return (
		<div
			className='relative overflow-hidden bg-blk'
			style={{ minHeight: "100%" }}>
			{/* Corner brackets */}
			{[
				"top-3 left-3 border-t border-l",
				"top-3 right-3 border-t border-r",
				"bottom-3 left-3 border-b border-l",
				"bottom-3 right-3 border-b border-r",
			].map((cls, i) => (
				<div
					key={i}
					className={`absolute w-5 h-5 border-lines/25 z-20 pointer-events-none ${cls}`}
				/>
			))}

			{/* Operator image */}
			<img
				src={displayImage}
				alt={selectedOperator.callSign}
				className={[
					"w-full object-cover object-top",
					isKIA ? "grayscale opacity-40" : "",
				].join(" ")}
				style={{ minHeight: 420, maxHeight: "100vh" }}
				onError={(e) => {
					e.currentTarget.src = "/ghost/Default.png";
				}}
			/>

			{/* Overlay */}
			<div
				className='absolute bottom-0 left-0 right-0 z-10'
				style={{
					background:
						"linear-gradient(to top, rgba(5,10,8,1) 0%, rgba(5,10,8,0.92) 30%, rgba(5,10,8,0.6) 55%, rgba(5,10,8,0.15) 75%, transparent 100%)",
				}}>
				<div className='px-4 pb-4 pt-28 flex flex-col gap-3'>
					{/* IDENTITY */}
					<div>
						<h2 className='font-mono text-2xl font-bold text-white tracking-wide truncate leading-none'>
							{selectedOperator.callSign || "Unknown"}
						</h2>
						<p className='font-mono text-[9px] tracking-[0.22em] text-lines/50 uppercase mt-1'>
							{selectedOperator.class || "No Class"}
							{selectedOperator.role ? ` · ${selectedOperator.role}` : ""}
						</p>
						<div className='flex flex-wrap items-center gap-1.5 mt-2'>
							<span
								className={`inline-flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border ${status.badge}`}>
								<span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
								{status.label}
							</span>
							{teamName && (
								<span className='font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border text-lines/60 border-lines/20 bg-blk/40'>
									{teamName}
								</span>
							)}
							{squadName && (
								<span className='font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border text-lines/60 border-lines/20 bg-blk/40'>
									{squadName}
								</span>
							)}
							{perks.length > 0 && (
								<div className='flex flex-col gap-2 pt-3 border-t border-neutral-800/60'>
									<span className='font-mono text-[9px] tracking-[0.25em] text-neutral-600 uppercase'>
										Perks
									</span>
									<div className='grid grid-cols-4 gap-2'>
										{perks.map((name) => (
											<div
												key={name}
												title={name}
												className='flex flex-col items-center gap-1 bg-neutral-950/60 border border-neutral-800/60 p-2 hover:border-neutral-700/60 transition-colors'>
												<img
													src={PERKS[name]}
													alt={name}
													className='w-8 h-8 object-contain'
													style={{ opacity: 0.75 }}
												/>
												<span className='font-mono text-[8px] text-center leading-tight text-neutral-500 truncate w-full'>
													{name}
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							{selectedOperator.support && (
								<span className='inline-flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border text-blue-400/80 border-blue-800/40 bg-blue-900/20'>
									<FontAwesomeIcon
										icon={faShieldHalved}
										className='text-[7px]'
									/>
									Enabler
								</span>
							)}
							{selectedOperator.aviator && (
								<span className='inline-flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border text-sky-400/80 border-sky-800/40 bg-sky-900/20'>
									<FontAwesomeIcon
										icon={faStar}
										className='text-[7px]'
									/>
									Aviator
								</span>
							)}
						</div>

						{/* Infirmary / Memorial shortcut */}
						{(isWIA || isKIA) && (
							<button
								onClick={() =>
									openSheet(
										"left",
										isKIA ?
											<Memorial
												dataUpdated={false}
												refreshData={refreshAll}
												openSheet={openSheet}
											/>
										:	<Infirmary
												dataUpdated={false}
												refreshData={refreshAll}
												openSheet={openSheet}
											/>,
										isKIA ? "Fallen Ghost" : "Infirmary",
									)
								}
								className={[
									"mt-2.5 font-mono text-[9px] tracking-widest uppercase px-2.5 py-1.5 rounded-sm border transition-all",
									isKIA ?
										"text-red-400/70 border-red-900/40 hover:border-red-500/60 hover:text-red-400 bg-blk/60 hover:bg-red-950/20"
									:	"text-amber-400/70 border-amber-900/40 hover:border-amber-500/60 hover:text-amber-400 bg-blk/60 hover:bg-amber-950/20",
								].join(" ")}>
								{isKIA ? "View Memorial" : "View Infirmary"}
							</button>
						)}
					</div>

					{/* Kits — mobile only */}
					{assignedKits.length > 0 && (
						<div className='lg:hidden flex flex-col gap-1.5 pb-2.5 border-b border-lines/10'>
							<span className='font-mono text-[7px] tracking-widest text-lines/30 uppercase'>
								Kits
							</span>
							{assignedKits.map((kit) => (
								<div
									key={kit._id}
									className='flex flex-col gap-0.5'>
									<span className='font-mono text-[9px] text-fontz/80 truncate tracking-wide uppercase'>
										{kit.name}
									</span>
									{[
										kit.primary?.weapon,
										kit.secondary?.weapon,
										kit.handgun?.weapon,
									]
										.filter(Boolean)
										.map((w, i) => (
											<span
												key={i}
												className='font-mono text-[7px] text-lines/40 truncate pl-2'>
												{w}
											</span>
										))}
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Edit button */}
			<button
				onClick={(e) => {
					e.stopPropagation();
					openSheet("right", <EditOperatorForm operator={operator} />);
				}}
				className='absolute top-3 right-10 z-30 flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-btn border border-btn/30 hover:border-btn/60 bg-blk/70 hover:bg-btn/15 px-2.5 py-1.5 rounded-sm transition-all'>
				<FontAwesomeIcon
					icon={faUserPen}
					className='text-[9px]'
				/>
				Edit
			</button>

			{/* Casualty button */}
			{!isKIA && (
				<button
					onClick={() => setInjuryDialogOpen(true)}
					className='absolute top-3 left-10 z-30 flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-red-400/50 border border-red-900/30 hover:border-red-500/50 hover:text-red-400 bg-blk/70 hover:bg-red-950/30 px-2.5 py-1.5 rounded-sm transition-all'>
					Casualty
				</button>
			)}

			<ConfirmDialog
				isOpen={injuryDialogOpen}
				closeDialog={() => setInjuryDialogOpen(false)}
				injuryType='choice'
				selectedOperator={selectedOperator}
				onRandomInjury={() => {
					assignRandomInjury(selectedOperator._id, selectedOperator.user);
					setInjuryDialogOpen(false);
				}}
				onUnknownFate={() => {
					assignUnknownFate(selectedOperator._id, selectedOperator.user);
					setInjuryDialogOpen(false);
				}}
				onKIAInjury={() => {
					assignRandomKIAInjury(selectedOperator._id, selectedOperator.user);
					setInjuryDialogOpen(false);
				}}
			/>
		</div>
	);
};

OperatorImageView.propTypes = {
	operator: OperatorPropTypes,
	openSheet: PropTypes.func,
};

export default OperatorImageView;
