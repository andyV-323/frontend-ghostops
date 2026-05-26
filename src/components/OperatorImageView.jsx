import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import { useOperatorsStore, useTeamsStore, useKitsStore } from "@/zustand";
import { getOperatorDisplayImage } from "@/utils/operatorImage";
import { OperatorsApi } from "@/api";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Infirmary, Memorial } from "@/components/tables";
import {
	faUserPen,
	faShieldHalved,
	faStar,
	faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { PropTypes } from "prop-types";
import { EditOperatorForm } from "./forms";
import ConfirmDialog from "./ConfirmDialog";
import { Bio } from "./ai";
import FatigueBadge from "./FatigueBadge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import KitDetailView from "./KitDetailView";
import { toast } from "react-toastify";

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
	const { kits, fetchKits } = useKitsStore();
	const [injuryDialogOpen, setInjuryDialogOpen] = useState(false);
	const [assignOpen, setAssignOpen] = useState(false);
	const [viewingKit, setViewingKit] = useState(null);

	useEffect(() => {
		fetchTeams();
	}, [fetchTeams]);
	useEffect(() => {
		fetchKits();
	}, [fetchKits]);

	const assignedKits = useMemo(() => {
		if (!selectedOperator) return [];
		const ids = selectedOperator.assignedKitIds || [];
		return ids.map((id) => kits.find((k) => k._id === id)).filter(Boolean);
	}, [selectedOperator, kits]);

	const handleToggleKit = async (kitId) => {
		const current = new Set(selectedOperator.assignedKitIds || []);
		const isAdding = !current.has(kitId);
		if (isAdding) current.add(kitId);
		else current.delete(kitId);
		const newIds = [...current];
		let newActiveKitId = selectedOperator.activeKitId ?? null;
		if (isAdding) newActiveKitId = kitId;
		else if (selectedOperator.activeKitId === kitId)
			newActiveKitId = newIds[0] ?? null;
		try {
			await OperatorsApi.updateOperator(selectedOperator._id, {
				...selectedOperator,
				assignedKitIds: newIds,
				activeKitId: newActiveKitId,
			});
			await fetchOperatorById(selectedOperator._id);
		} catch {
			toast.error("Failed to update loadout");
		}
	};
	useEffect(() => {
		if (operator?._id) fetchOperatorById(operator._id);
	}, [operator?._id, fetchOperatorById]);

	const handleFullRest = async () => {
		if (!selectedOperator || (selectedOperator.fatiguePoints ?? 0) === 0)
			return;
		await OperatorsApi.updateCondition(selectedOperator._id, "Fresh", 0);
		await fetchOperatorById(selectedOperator._id);
		await fetchOperators();
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

	const displayImage = getOperatorDisplayImage(selectedOperator);
	const status = STATUS[selectedOperator.status] ?? STATUS.Active;
	const isKIA = selectedOperator.status === "KIA";
	const isWIA =
		selectedOperator.status === "Injured" ||
		selectedOperator.status === "Wounded";

	const refreshAll = () => {
		fetchOperators();
		fetchTeams();
	};

	return (
		<div
			className='flex flex-col bg-blk'
			style={{ minHeight: "100%" }}>
			{/* Image section */}
			<div className='relative overflow-hidden'>
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
						"w-full object-contain",
						isKIA ? "grayscale opacity-40" : "",
					].join(" ")}
					style={{ minHeight: 300, maxHeight: "70vh" }}
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
								<FatigueBadge fatiguePoints={selectedOperator.fatiguePoints ?? 0} size='badge' />
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
						{(selectedOperator.fatiguePoints ?? 0) > 0 && (
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

			{/* ── Assigned Loadouts ── */}
			<div className='border-t border-lines/20'>
				<div className='flex items-center justify-between px-4 py-2.5 border-b border-lines/15'>
					<span className='font-mono text-[8px] tracking-[0.35em] text-lines/50 uppercase'>
						Assigned Loadouts
					</span>
					<button
						onClick={() => setAssignOpen(true)}
						className='flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-2 py-1 border border-lines/20 text-lines/50 hover:text-lines hover:border-lines/40 transition-colors'>
						<FontAwesomeIcon
							icon={faPlus}
							className='text-[7px]'
						/>
						Manage
					</button>
				</div>
				<div className='flex flex-col'>
					{assignedKits.length === 0 ?
						<p className='font-mono text-[8px] text-lines/25 italic px-4 py-3 tracking-widest'>
							No loadouts assigned
						</p>
					:	assignedKits.map((kit) => (
							<button
								key={kit._id}
								type='button'
								onClick={() => setViewingKit(kit)}
								className='flex items-center justify-between px-4 py-2.5 border-b border-lines/10 hover:bg-lines/5 transition-colors group'>
								<span className='font-mono text-[10px] uppercase tracking-widest text-lines/70 group-hover:text-lines truncate'>
									{kit.name}
								</span>
								<span className='font-mono text-[12px] text-lines/40 group-hover:text-lines/70 ml-2 shrink-0'>
									›
								</span>
							</button>
						))
					}
				</div>
			</div>

			{/* ── Assign/Manage Sheet ── */}
			<Sheet
				open={assignOpen}
				onOpenChange={setAssignOpen}>
				<SheetContent
					side='right'
					className='p-0 overflow-hidden flex flex-col bg-blk border-l border-lines/20'
					aria-describedby={undefined}>
					<SheetTitle className='sr-only'>Manage Loadouts</SheetTitle>
					<div className='shrink-0 px-5 py-4 border-b border-lines/40 bg-neutral-950/60'>
						<h3 className='font-mono text-sm font-bold text-white uppercase tracking-widest'>
							Manage Loadouts
						</h3>
						<p className='font-mono text-[8px] text-lines/50 mt-1 tracking-widest uppercase'>
							{selectedOperator.callSign}
						</p>
					</div>
					<div className='flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2'>
						{kits.length === 0 ?
							<p className='font-mono text-[8px] text-lines/40 italic py-4 text-center'>
								No loadouts in armory.
							</p>
						:	kits.map((kit) => {
								const isAssigned = (
									selectedOperator.assignedKitIds || []
								).includes(kit._id);
								return (
									<div
										key={kit._id}
										className={[
											"flex items-center gap-3 px-3 py-2.5 border transition-colors",
											isAssigned ?
												"border-btn/50 bg-btn/5"
											:	"border-lines/20 hover:border-lines/40",
										].join(" ")}>
										<span
											className={`font-mono text-[10px] uppercase tracking-wide flex-1 truncate ${isAssigned ? "text-btn" : "text-lines/50"}`}>
											{kit.name}
										</span>
										<button
											type='button'
											onClick={() => handleToggleKit(kit._id)}
											className={[
												"font-mono text-[8px] tracking-widest uppercase px-2 py-1 border transition-colors",
												isAssigned ?
													"text-red-400/60 border-red-900/30 hover:text-red-400 hover:border-red-500/50"
												:	"text-btn/60 border-btn/30 hover:text-btn hover:border-btn/60",
											].join(" ")}>
											{isAssigned ? "Remove" : "Add"}
										</button>
									</div>
								);
							})
						}
					</div>
				</SheetContent>
			</Sheet>

			{/* ── Kit Detail Sheet ── */}
			<Sheet
				open={!!viewingKit}
				onOpenChange={(open) => {
					if (!open) setViewingKit(null);
				}}>
				<SheetContent
					side='right'
					className='p-0 overflow-hidden flex flex-col bg-blk border-l border-lines/20'
					aria-describedby={undefined}>
					<SheetTitle className='sr-only'>
						{viewingKit?.name || "Loadout"}
					</SheetTitle>
					{viewingKit && (
						<KitDetailView
							kit={viewingKit}
							onClose={() => setViewingKit(null)}
						/>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
};

OperatorImageView.propTypes = {
	operator: OperatorPropTypes,
	openSheet: PropTypes.func,
};

export default OperatorImageView;
