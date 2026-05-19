import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Roster, Infirmary, Memorial, Teams } from "@/components/tables";
import { OperatorImageView } from "@/components";
import { NewOperatorForm, AssignTeamSheet } from "@/components/forms";
import {
	useOperatorsStore,
	useSheetStore,
	useTeamsStore,
	useKitsStore,
} from "@/zustand";
import { Panel, usePageSheet } from "./dashboardHelpers";
import { ITEMS, PERKS_MAP } from "@/config";
import { KIT_TYPES } from "@/utils/operatorImage";
import { OperatorsApi } from "@/api";
import { toast } from "react-toastify";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

// ─── Kit assignment sheet content ─────────────────────────────────────────────

function KitAssignContent({ operator, kits, onToggle }) {
	if (!operator) return null;
	const assigned = new Set(operator.assignedKitIds || []);
	return (
		<div className='flex flex-col h-full'>
			<div className='shrink-0 px-4 py-3 border-b border-lines/60 bg-neutral-950/40'>
				<h3 className='font-mono text-md font-bold text-white tracking-wide truncate'>
					{operator.callSign}
				</h3>
				<div className='flex items-center justify-between mt-1'>
					<p className='font-mono text-[10px] text-lines uppercase tracking-widest'>
						Loadout Assignment
					</p>
					{assigned.size > 0 && (
						<span className='font-mono text-[8px] text-btn border border-btn/25 bg-btn/5 px-1.5 py-0.5'>
							{assigned.size} loadout{assigned.size !== 1 ? "s" : ""}
						</span>
					)}
				</div>
			</div>
			<div className='shrink-0 px-4 py-2 border-b border-neutral-800/60 bg-neutral-950/20'>
				<p className='font-mono text-[7px] tracking-[0.35em] text-neutral-500 uppercase'>
					Tap to add / remove
				</p>
			</div>
			<div className='flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2'>
				{kits.length === 0 ?
					<p className='font-mono text-[8px] text-neutral-700 italic py-4 text-center'>
						No loadouts in armory. Create loadouts in the Armory section.
					</p>
				:	kits.map((kit) => {
						const isAssigned = assigned.has(kit._id);
						const weapons = [
							kit.primary?.weapon,
							kit.secondary?.weapon,
							kit.handgun?.weapon,
						].filter(Boolean);
						return (
							<button
								key={kit._id}
								type='button'
								onClick={() => onToggle(kit._id)}
								className={[
									"flex flex-col gap-1.5 px-3 py-2.5 border transition-colors text-left",
									isAssigned ?
										"border-btn/50 bg-btn/5"
									:	"border-neutral-800/60 hover:border-neutral-700/60",
								].join(" ")}>
								<div className='flex items-center gap-2'>
									<div
										className={[
											"w-3.5 h-3.5 border shrink-0 flex items-center justify-center transition-colors",
											isAssigned ?
												"border-btn bg-btn/20"
											:	"border-neutral-700",
										].join(" ")}>
										{isAssigned && <div className='w-1.5 h-1.5 bg-btn' />}
									</div>
									<span
										className={`font-mono text-[10px] font-semibold tracking-wide uppercase flex-1 truncate ${isAssigned ? "text-btn" : "text-neutral-300"}`}>
										{kit.name}
									</span>
									{isAssigned && (
										<span className='font-mono text-[7px] text-btn shrink-0'>
											ASSIGNED
										</span>
									)}
								</div>
								{weapons.length > 0 && (
									<p className='font-mono text-[7px] text-neutral-600 truncate pl-5'>
										{weapons.join(" · ")}
									</p>
								)}
							</button>
						);
					})
				}
			</div>
		</div>
	);
}

// ─── Kit detail sheet content ──────────────────────────────────────────────────

function KitDetailContent({ kit, onClose }) {
	const weapons = [
		kit.primary?.weapon && {
			label: "Primary",
			weapon: kit.primary.weapon,
			att: kit.primary.attachments,
		},
		kit.secondary?.weapon && {
			label: "Secondary",
			weapon: kit.secondary.weapon,
			att: kit.secondary.attachments,
		},
		kit.handgun?.weapon && {
			label: "Handgun",
			weapon: kit.handgun.weapon,
			att: kit.handgun.attachments,
		},
	].filter(Boolean);

	const activeItems = (kit.items || []).filter((i) => ITEMS[i]);
	const activePerks = (kit.perks || [])
		.map((n) => PERKS_MAP[n])
		.filter(Boolean);

	return (
		<div className='flex flex-col h-full'>
			{/* Header */}
			<div className='shrink-0 px-5 py-4 border-b border-neutral-800/60 bg-neutral-950/60'>
				<div className='flex items-start gap-3'>
					<div className='flex-1 min-w-0'>
						<div className='flex items-center gap-2 mb-1'>
							<div className='w-1 h-4 bg-btn shrink-0' />
							<h2 className='font-mono text-md font-bold text-white uppercase tracking-widest truncate'>
								{kit.name}
							</h2>
						</div>
						<span className='font-mono text-[8px] tracking-[0.3em] uppercase text-lines border border-lines/60 px-2 py-0.5'>
							{KIT_TYPES[kit.type] ?? "Specialty"}
						</span>
					</div>
					<button
						type='button'
						onClick={onClose}
						className='w-7 h-7 flex items-center justify-center text-lines hover:text-white border border-lines/60 hover:border-neutral-500/40 bg-neutral-950/40 transition-colors shrink-0'>
						<FontAwesomeIcon
							icon={faXmark}
							className='text-[10px]'
						/>
					</button>
				</div>
			</div>

			{/* Body */}
			<div className='flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6'>
				{/* Weapons */}
				{weapons.length > 0 && (
					<div className='flex flex-col gap-3'>
						<div className='flex items-center gap-2 pb-1.5 border-b border-lines/60'>
							<div className='w-0.5 h-3 bg-btn' />
							<span className='font-mono text-[10px] tracking-[0.3em] uppercase text-lines font-semibold'>
								Weapons
							</span>
						</div>
						{weapons.map(({ label, weapon, att }) => {
							const activeAtts = Object.entries(att || {}).filter(([, v]) => v);
							return (
								<div
									key={label}
									className='flex flex-col gap-1.5 p-3 border border-lines/60 bg-neutral-950/30'>
									<span className='font-mono text-[10px] tracking-[0.25em] uppercase text-lines'>
										{label}
									</span>
									<span className='font-mono text-[10px] font-semibold text-lines tracking-wide'>
										{weapon}
									</span>
									{activeAtts.length > 0 && (
										<div className='grid grid-cols-2 gap-x-4 gap-y-0.5 pt-1.5 border-t border-lines/60 mt-0.5'>
											{activeAtts.map(([k, v]) => (
												<div
													key={k}
													className='flex items-baseline gap-1.5'>
													<span className='font-mono text-[7px] tracking-widest uppercase text-lines/60 shrink-0 w-14'>
														{k}
													</span>
													<span className='font-mono text-[8px] text-lines truncate'>
														{v}
													</span>
												</div>
											))}
										</div>
									)}
									{activeAtts.length === 0 && (
										<span className='font-mono text-[7px] text-lines italic'>
											No attachments
										</span>
									)}
								</div>
							);
						})}
					</div>
				)}

				{/* Equipment */}
				{activeItems.length > 0 && (
					<div className='flex flex-col gap-3'>
						<div className='flex items-center gap-2 pb-1.5 border-b border-neutral-700/40'>
							<div className='w-0.5 h-3 bg-btn' />
							<span className='font-mono text-[10px] tracking-[0.3em] uppercase text-lines font-semibold'>
								Equipment
							</span>
						</div>
						<div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
							{activeItems.map((item) => (
								<div
									key={item}
									className='flex items-center gap-2 p-2 border border-lines/60 bg-neutral-950/30'>
									<img
										src={ITEMS[item]}
										alt={item}
										className='w-6 h-6 object-contain shrink-0'
										style={{ filter: "invert(1) opacity(0.6)" }}
									/>
									<span className='font-mono text-[8px] text-lines leading-tight'>
										{item}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Perks */}
				{activePerks.length > 0 && (
					<div className='flex flex-col gap-3'>
						<div className='flex items-center gap-2 pb-1.5 border-b border-neutral-700/40'>
							<div className='w-0.5 h-3 bg-btn' />
							<span className='font-mono text-[10px] tracking-[0.3em] uppercase text-lines font-semibold'>
								Perks
							</span>
						</div>
						<div className='flex flex-col gap-2'>
							{activePerks.map((perk) => (
								<div
									key={perk.name}
									className='flex items-center gap-3 p-3 border border-lines/60 bg-neutral-950/30'>
									<img
										src={perk.icon}
										alt={perk.name}
										className='w-8 h-8 object-contain shrink-0'
									/>
									<div className='flex flex-col gap-0.5 min-w-0'>
										<div className='flex items-center gap-2 flex-wrap'>
											<span className='font-mono text-[10px] font-semibold text-lines leading-none'>
												{perk.name}
											</span>
											<span className='font-mono text-[6px] tracking-widest uppercase text-btn/80 border border-btn/25 px-1'>
												{perk.type}
											</span>
										</div>
										<span className='font-mono text-[8px] text-lines/60 leading-tight'>
											{perk.description}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{weapons.length === 0 &&
					activeItems.length === 0 &&
					activePerks.length === 0 && (
						<div className='flex items-center justify-center py-12'>
							<span className='font-mono text-[9px] text-neutral-500 italic'>
								Loadout is empty
							</span>
						</div>
					)}
			</div>
		</div>
	);
}

// ─── Kit panel (desktop right column) ─────────────────────────────────────────

function KitPanel({ operator, kits, onManageKits }) {
	const [viewingKit, setViewingKit] = useState(null);

	useEffect(() => {
		setViewingKit(null);
	}, [operator?._id]);

	if (!operator) {
		return (
			<div className='flex items-center justify-center h-16'>
				<span className='font-mono text-[9px] tracking-widest text-neutral-500 uppercase'>
					Select an operator
				</span>
			</div>
		);
	}

	const assignedKits = (operator.assignedKitIds || [])
		.map((id) => kits.find((k) => k._id === id))
		.filter(Boolean);

	return (
		<>
			<div className='p-4 flex flex-col gap-3'>
				<div className='flex items-center justify-between'>
					<span className='font-mono text-[9px] tracking-[0.25em] text-lines uppercase'>
						Assigned Loadouts
					</span>
					<button
						onClick={onManageKits}
						className='font-mono text-[9px] tracking-widest uppercase text-btn hover:text-btn border border-neutral-700/40 hover:border-btn/40 px-1.5 py-0.5 transition-all flex items-center gap-1'>
						<FontAwesomeIcon
							icon={faPlus}
							className='text-[9px]'
						/>
						Manage
					</button>
				</div>

				{assignedKits.length === 0 ?
					<button
						onClick={onManageKits}
						className='flex items-center justify-center py-4 border border-dashed border-neutral-700/40 hover:border-btn/30 transition-colors w-full'>
						<span className='font-mono text-[8px] text-lines italic'>
							No loadouts — click to assign
						</span>
					</button>
				:	assignedKits.map((kit) => {
						const weapons = [
							kit.primary?.weapon,
							kit.secondary?.weapon,
							kit.handgun?.weapon,
						].filter(Boolean);

						return (
							<button
								key={kit._id}
								type='button'
								onClick={() => setViewingKit(kit)}
								className='flex flex-col gap-1 px-3 py-2.5 border border-neutral-800/60 hover:border-btn/40 bg-neutral-950/40 text-left transition-colors w-full group'>
								<div className='flex items-center gap-2'>
									<div className='w-1.5 h-1.5 bg-btn shrink-0' />
									<span className='font-mono text-[10px] font-semibold text-lines truncate tracking-wide uppercase flex-1 group-hover:text-btn transition-colors'>
										{kit.name}
									</span>
									<span className='font-mono text-[18px] text-lines shrink-0'>
										›
									</span>
								</div>
								{weapons.length > 0 && (
									<p className='font-mono text-[8px] text-lines/60 truncate pl-3.5'>
										{weapons.join(" · ")}
									</p>
								)}
							</button>
						);
					})
				}
			</div>

			{/* Kit detail side sheet */}
			<Sheet
				open={!!viewingKit}
				onOpenChange={(open) => {
					if (!open) setViewingKit(null);
				}}>
				<SheetContent
					side='right'
					className='p-0 sm:max-w-md overflow-hidden flex flex-col bg-blk border-l border-neutral-800/60'
					aria-describedby={undefined}>
					<SheetTitle className='sr-only'>Loadout Details</SheetTitle>
					{viewingKit && (
						<KitDetailContent
							kit={viewingKit}
							onClose={() => setViewingKit(null)}
						/>
					)}
				</SheetContent>
			</Sheet>
		</>
	);
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPERATORS PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function OperatorsPage() {
	const { setSelectedOperator, operators, fetchOperators } =
		useOperatorsStore();
	const { teams, fetchTeams } = useTeamsStore();
	const { kits, fetchKits } = useKitsStore();
	const { open, SheetEl } = usePageSheet();
	const [dataUpdated, setDataUpdated] = useState(false);
	const [selectedOp, setSelectedOp] = useState(null);
	const [kitSelectorOpen, setKitSelectorOpen] = useState(false);
	const refreshData = () => setDataUpdated((p) => !p);

	useEffect(() => {
		fetchOperators();
		fetchTeams();
		fetchKits();
	}, [fetchOperators, fetchTeams, fetchKits, dataUpdated]);

	// Auto-select first active operator
	useEffect(() => {
		if (!selectedOp && operators.length > 0) {
			const first = operators.find((o) => o.status?.toLowerCase() !== "kia");
			if (first) {
				setSelectedOp(first);
				setSelectedOperator(first._id);
			}
		}
	}, [operators, selectedOp, setSelectedOperator]);

	const selectOp = (op) => {
		setSelectedOp(op);
		setSelectedOperator(op._id);
	};

	const handleToggleKit = async (kitId) => {
		if (!selectedOp) return;
		const current = new Set(selectedOp.assignedKitIds || []);
		if (current.has(kitId)) current.delete(kitId);
		else current.add(kitId);
		const newIds = [...current];
		const updated = { ...selectedOp, assignedKitIds: newIds };
		try {
			await OperatorsApi.updateOperator(selectedOp._id, updated);
			setSelectedOp(updated);
			await fetchOperators();
			setSelectedOperator(selectedOp._id);
		} catch {
			toast.error("Failed to update kit");
		}
	};

	const active = operators.filter((o) => {
		const s = o.status?.toLowerCase();
		return s !== "kia" && s !== "injured" && s !== "wounded";
	});
	const wia = operators.filter((o) => {
		const s = o.status?.toLowerCase();
		return s === "injured" || s === "wounded";
	});
	const kia = operators.filter((o) => o.status?.toLowerCase() === "kia");

	const statusDot = (op) => {
		const s = op.status?.toLowerCase();
		if (s === "kia") return "bg-red-500";
		if (s === "injured" || s === "wounded") return "bg-amber-400";
		return "bg-green-500";
	};

	const RowSection = ({ label, color, ops }) =>
		ops.length === 0 ?
			null
		:	<>
				<div
					className={`px-3 py-1 font-mono text-[10px] tracking-[0.3em] uppercase border-b border-neutral-800/80 ${color}`}>
					{label}
				</div>
				{ops.map((op) => {
					const assignedTeam = teams.find((t) =>
						t.operators?.some((m) => m._id === op._id),
					);
					return (
						<div
							key={op._id}
							onClick={() => selectOp(op)}
							className={[
								"w-full flex items-center gap-2 px-3 py-1.5 border-b border-neutral-800/40 transition-colors cursor-pointer",
								selectedOp?._id === op._id ?
									"bg-neutral-700/60 border-l-2 border-l-btn"
								:	"hover:bg-neutral-800/60 border-l-2 border-l-transparent",
							].join(" ")}>
							<div className='flex items-center gap-2 flex-1 min-w-0'>
								<span
									className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(op)}`}
								/>

								<span className='font-mono text-[12px] text-neutral-200 truncate flex-1 leading-none'>
									{op.callSign || "—"}
								</span>
							</div>
							<button
								onClick={(e) => {
									e.stopPropagation();
									open(
										"bottom",
										<AssignTeamSheet
											operator={op}
											onComplete={() => {
												fetchTeams();
												useSheetStore.getState().closeSheet();
											}}
										/>,
										"Assign to Team",
										`Assign ${op.callSign} to a team.`,
									);
								}}
								className='font-mono text-[7px] tracking-widest uppercase shrink-0 px-1.5 py-0.5 rounded border border-neutral-800 hover:border-btn/40 transition-colors'>
								<span
									className={`font-mono text-[10px] ${assignedTeam ? "text-btn" : "text-neutral-700"}`}>
									{assignedTeam ? assignedTeam.name : "—"}
								</span>
							</button>
						</div>
					);
				})}
			</>;

	return (
		<>
			{/* ── MOBILE ─────────────────────────────────────────── */}
			<div className='lg:hidden flex-1 overflow-y-auto'>
				<div className='p-3 flex flex-col gap-3'>
					<Panel className='min-h-[420px]'>
						<Roster
							dataUpdated={dataUpdated}
							refreshData={refreshData}
							openSheet={open}
							setClickedOperator={(op) => {
								setSelectedOp(op);
								setSelectedOperator(op._id);
							}}
						/>
					</Panel>
					<Panel className='min-h-64'>
						<Teams
							dataUpdated={dataUpdated}
							refreshData={refreshData}
							openSheet={open}
						/>
					</Panel>
					<div className='grid grid-cols-2 gap-2'>
						<Panel
							title='Infirmary'
							badge='WIA'
							className='min-h-40'>
							<Infirmary
								dataUpdated={dataUpdated}
								refreshData={refreshData}
								openSheet={open}
							/>
						</Panel>
						<Panel
							title='Fallen Ghost'
							badge='KIA'
							className='min-h-40'>
							<Memorial
								dataUpdated={dataUpdated}
								refreshData={refreshData}
								openSheet={open}
							/>
						</Panel>
					</div>
				</div>
			</div>

			{/* ── DESKTOP ─────────────────────────────────────────── */}
			<div className='hidden lg:flex flex-1 min-h-0 overflow-hidden'>
				{/* LEFT — Operator list */}
				<div className='w-80 shrink-0 flex flex-col border-r border-neutral-700/40 bg-neutral-900/60'>
					<div className='flex items-center border-b border-neutral-700/40 bg-neutral-900 shrink-0'>
						<span className='font-mono text-[10px] tracking-widest uppercase px-3 py-2 border-b-2 border-btn text-btn shrink-0'>
							Operators
						</span>
						<div className='ml-auto flex items-center gap-0.5 pr-2'>
							<button
								onClick={() =>
									open(
										"left",
										<NewOperatorForm />,
										"New Operator",
										"Add an elite operator.",
									)
								}
								className='w-5 h-5 flex items-center justify-center bg-btn/80 hover:bg-btn text-neutral-900 rounded-sm transition-colors ml-1'
								title='Add operator'>
								<FontAwesomeIcon
									icon={faPlus}
									className='text-[8px]'
								/>
							</button>
						</div>
					</div>

					<div className='flex-1 overflow-y-auto'>
						<RowSection
							label='Active'
							color='text-neutral-600'
							ops={active}
						/>
						<RowSection
							label='WIA'
							color='text-amber-600/70'
							ops={wia}
						/>
						<RowSection
							label='KIA'
							color='text-red-700/60'
							ops={kia}
						/>
						{operators.length === 0 && (
							<div className='flex flex-col items-center justify-center gap-2 py-10'>
								<div className='w-5 h-5 border border-neutral-700 rotate-45' />
								<span className='font-mono text-[8px] tracking-widest text-neutral-700 uppercase'>
									No operators
								</span>
							</div>
						)}
					</div>
				</div>

				{/* CENTER — Operator profile */}
				<div className='w-80 shrink-0 min-h-0 overflow-y-auto border-r border-neutral-700/40 bg-neutral-950/30'>
					{selectedOp ?
						<OperatorImageView
							operator={selectedOp}
							openSheet={open}
						/>
					:	<div className='flex flex-col items-center justify-center h-full gap-3'>
							<div className='w-10 h-10 border border-neutral-700/50 rotate-45' />
							<span className='font-mono text-[11px] tracking-[0.3em] text-neutral-700 uppercase'>
								Select Operator
							</span>
						</div>
					}
				</div>

				{/* RIGHT — Teams + Kits & Perks */}
				<div className='flex-1 min-h-0 flex flex-col border-l border-neutral-800/40'>
					<div className='flex-1 min-h-0 flex flex-col bg-neutral-900/40'>
						<div className='flex-1 min-h-0 overflow-y-auto'>
							<Teams
								dataUpdated={dataUpdated}
								refreshData={refreshData}
								openSheet={open}
							/>
						</div>
					</div>
					<div className='shrink-0 border-t border-neutral-800/40 bg-neutral-900/40'>
						<div className='overflow-y-auto max-h-96'>
							<KitPanel
								operator={selectedOp}
								kits={kits}
								onManageKits={() => setKitSelectorOpen(true)}
							/>
						</div>
					</div>
				</div>
			</div>

			{SheetEl}

			{/* Kit selector sheet */}
			<Sheet
				open={kitSelectorOpen}
				onOpenChange={(open) => {
					if (!open) setKitSelectorOpen(false);
				}}>
				<SheetContent
					side='right'
					className='p-0 sm:max-w-md overflow-hidden flex flex-col bg-blk border-l border-neutral-800/60'
					aria-describedby={undefined}>
					<SheetTitle className='sr-only'>Loadout Assignment</SheetTitle>
					<KitAssignContent
						operator={selectedOp}
						kits={kits}
						onToggle={handleToggleKit}
					/>
				</SheetContent>
			</Sheet>
		</>
	);
}
