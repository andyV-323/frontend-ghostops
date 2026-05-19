import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import { useOperatorsStore, useTeamsStore } from "@/zustand";
import { useKitsStore } from "@/zustand";
import { getOperatorDisplayImage, KIT_TYPES } from "@/utils/operatorImage";
import { OperatorsApi } from "@/api";
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
import { Bio } from "./ai";

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

const CONDITION = {
	Fresh: {
		square: "bg-green-600 shadow-[0_0_6px_rgba(74,222,128,0.6)]",
		badge: "text-green-400 border-green-900/50 bg-green-900/20",
		label: "FRESH",
	},
	Steady: {
		square: "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]",
		badge: "text-green-400 border-green-900/50 bg-green-900/20",
		label: "STEADY",
	},
	Worn: {
		square: "bg-yellow-600 shadow-[0_0_6px_rgba(74,222,128,0.6)]",
		badge: "text-yellow-600 border-yellow-900/50 bg-yellow-900/20",
		label: "WORN",
	},
	Degraded: {
		square: "bg-amber-500 shadow-[0_0_6px_rgba(74,222,128,0.6)]",
		badge: "text-amber-500 border-amber-900/50 bg-amber-900/20",
		label: "DEGRADED",
	},
	Spent: {
		square: "bg-red-700 shadow-[0_0_6px_rgba(74,222,128,0.6)]",
		badge: "text-red-700 border-red-900/50 bg-red-900/20",
		label: "SPENT",
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
	const [savingKit, setSavingKit] = useState(false);

	useEffect(() => {
		fetchTeams();
	}, [fetchTeams]);
	useEffect(() => {
		if (operator?._id) fetchOperatorById(operator._id);
	}, [operator?._id, fetchOperatorById]);

	const handleFullRest = async () => {
		if (!selectedOperator || selectedOperator.conditionLevel === "Fresh")
			return;
		await OperatorsApi.updateCondition(selectedOperator._id, "Fresh", 0);
		await fetchOperatorById(selectedOperator._id);
		await fetchOperators();
	};

	const handleActivateKit = async (kitId) => {
		if (
			!selectedOperator ||
			selectedOperator.activeKitId === kitId ||
			savingKit
		)
			return;
		setSavingKit(true);
		try {
			await OperatorsApi.updateOperator(selectedOperator._id, {
				...selectedOperator,
				activeKitId: kitId,
			});
			await fetchOperatorById(selectedOperator._id);
			await fetchOperators();
		} finally {
			setSavingKit(false);
		}
	};

	const teamName = useMemo(() => {
		const team = teams.find((t) =>
			t.operators?.some((op) => op?._id === operator?._id),
		);
		return team ? team.name : null;
	}, [teams, operator?._id]);

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

	const displayImage = getOperatorDisplayImage(selectedOperator, kits);
	const status = STATUS[selectedOperator.status] ?? STATUS.Active;
	const isKIA = selectedOperator.status === "KIA";
	const isWIA =
		selectedOperator.status === "Injured" ||
		selectedOperator.status === "Wounded";

	const condition =
		CONDITION[selectedOperator.conditionLevel] ?? CONDITION.Fresh;

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
						<p className='font-mono text-[9px] tracking-[0.22em] text-lines uppercase mt-1'>
							{selectedOperator.class || "No Class"}
							{selectedOperator.role ? ` · ${selectedOperator.role}` : ""}
						</p>
						<div className='flex flex-wrap items-center gap-1.5 mt-2'>
							<span
								className={`inline-flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border ${status.badge}`}>
								<span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
								{status.label}
							</span>
							<span
								className={`inline-flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border ${condition.badge}`}>
								<span className={`w-1.5 h-1.5  ${condition.square}`} />
								{condition.label}
							</span>
							<button
								onClick={() =>
									openSheet(
										"left",
										<Bio
											operator={selectedOperator}
											refreshData={refreshAll}
										/>,
										"Operator Bio",
									)
								}
								className='mt-2.5 font-mono text-[9px] tracking-widest uppercase px-2.5 py-1.5 rounded-sm border transition-all text-lines/60 border-lines/20 hover:border-lines/40 hover:text-lines bg-blk/60'>
								Bio
							</button>
							
							{teamName && (
								<span className='font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border text-lines border-lines/20 bg-blk/40'>
									{teamName}
								</span>
							)}
							{squadName && (
								<span className='font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border text-lines border-lines/20 bg-blk/40'>
									{squadName}
								</span>
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

					{/* Kit selector */}
					{assignedKits.length > 0 && (
						<div className='flex flex-col gap-1.5 pb-2.5 border-b border-lines/10'>
							{assignedKits.map((kit) => {
								const isActive = kit._id === selectedOperator.activeKitId;
								return (
									<button
										key={kit._id}
										type='button'
										disabled={savingKit}
										onClick={() => handleActivateKit(kit._id)}
										className={[
											"flex flex-col gap-0.5 px-2 py-1.5 border transition-colors text-left w-full",
											isActive ?
												"border-green-600/40 bg-green-950/20"
											:	"border-lines/10 hover:border-lines/25 bg-blk/20",
										].join(" ")}>
										<div className='flex items-center gap-1.5 min-w-0'>
											<span
												className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-green-400" : "bg-neutral-700"}`}
											/>
											<span
												className={`font-mono text-[9px] font-semibold uppercase tracking-wide flex-1 truncate ${isActive ? "text-lines" : "text-lines/50"}`}>
												{kit.name}
											</span>
											<span
												className={`font-mono text-[9px] tracking-widest uppercase ${isActive ? "text-lines" : "text-lines/50"}`}>
												{KIT_TYPES[kit.type] ?? "Specialty"}
											</span>
											{isActive && (
												<span className='font-mono text-[7px] text-green-400 shrink-0'>
													● ACTIVE
												</span>
											)}
										</div>
									</button>
								);
							})}
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

			{/* Casualty + Full Rest buttons */}
			{!isKIA && (
				<div className='absolute top-3 left-10 z-30 flex flex-col gap-1'>
					<button
						onClick={() => setInjuryDialogOpen(true)}
						className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-red-400/50 border border-red-900/30 hover:border-red-500/50 hover:text-red-400 bg-blk/70 hover:bg-red-950/30 px-2.5 py-1.5 rounded-sm transition-all'>
						Casualty
					</button>
					{selectedOperator.conditionLevel !== "Fresh" && (
						<button
							onClick={handleFullRest}
							className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-green-400/50 border border-green-900/30 hover:border-green-500/50 hover:text-green-400 bg-blk/70 hover:bg-green-950/30 px-2.5 py-1.5 rounded-sm transition-all'>
							Full Rest
						</button>
					)}
				</div>
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
