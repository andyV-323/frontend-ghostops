import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Roster, Infirmary, Memorial, Teams } from "@/components/tables";
import { OperatorImageView } from "@/components";
import { NewOperatorForm, AssignTeamSheet } from "@/components/forms";
import { useOperatorsStore, useSheetStore, useTeamsStore } from "@/zustand";
import { Panel, usePageSheet } from "./dashboardHelpers";
import { WEAPONS, MISSION_PROFILES, ITEMS, PERKS } from "@/config";

// ─── Loadout panel (desktop right column) ────────────────────────────────────

const LoadoutPanel = () => {
	const { selectedOperator } = useOperatorsStore();
	const [loadoutIndex, setLoadoutIndex] = useState(0);
	const [expandedSlot, setExpandedSlot] = useState(null);

	useEffect(() => {
		setLoadoutIndex(0);
		setExpandedSlot(null);
	}, [selectedOperator?._id]);

	if (!selectedOperator) {
		return (
			<div className='flex items-center justify-center h-16'>
				<span className='font-mono text-[9px] tracking-widest text-neutral-700 uppercase'>
					Select an operator
				</span>
			</div>
		);
	}

	const loadouts = selectedOperator.loadouts || [];
	const perks = (selectedOperator.perks || []).filter((p) => PERKS[p]);
	const items = (selectedOperator.items || []).filter((i) => ITEMS[i]);

	if (loadouts.length === 0 && perks.length === 0 && items.length === 0) {
		return (
			<div className='flex items-center justify-center h-16'>
				<span className='font-mono text-[9px] tracking-widest text-neutral-700 uppercase'>
					No loadouts configured
				</span>
			</div>
		);
	}

	const safeIdx =
		loadouts.length > 0 ? Math.min(loadoutIndex, loadouts.length - 1) : 0;
	const currentLoadout = loadouts[safeIdx] || null;
	const currentProfile =
		currentLoadout ? MISSION_PROFILES[currentLoadout.missionProfile] : null;

	return (
		<div className='p-4 flex flex-col gap-4'>
			{/* Loadout section */}
			{loadouts.length > 0 && (
				<>
					{/* Header: profile name + nav */}
					<div className='flex items-center justify-between gap-2'>
						<div className='flex flex-col gap-0.5 min-w-0'>
							<span className='font-mono text-xs tracking-[0.18em] text-neutral-300 uppercase truncate'>
								{selectedOperator.callSign}
							</span>
							<span className='font-mono text-[10px] text-neutral-500 truncate'>
								{currentProfile?.name || currentLoadout?.missionProfile || "—"}
							</span>
						</div>
						{loadouts.length > 1 && (
							<div className='flex items-center gap-1 shrink-0'>
								<button
									onClick={() => {
										setLoadoutIndex((i) => Math.max(0, i - 1));
										setExpandedSlot(null);
									}}
									disabled={safeIdx === 0}
									className='w-6 h-6 flex items-center justify-center font-mono text-sm text-neutral-500 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-600 disabled:opacity-20 transition-colors'>
									‹
								</button>
								<span className='font-mono text-[9px] text-neutral-600 w-8 text-center tabular-nums'>
									{safeIdx + 1}/{loadouts.length}
								</span>
								<button
									onClick={() => {
										setLoadoutIndex((i) =>
											Math.min(loadouts.length - 1, i + 1),
										);
										setExpandedSlot(null);
									}}
									disabled={safeIdx === loadouts.length - 1}
									className='w-6 h-6 flex items-center justify-center font-mono text-sm text-neutral-500 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-600 disabled:opacity-20 transition-colors'>
									›
								</button>
							</div>
						)}
					</div>

					{/* Weapon slots */}
					<div className='grid grid-cols-3 gap-3'>
						{[
							{
								label: "Primary",
								slotKey: "primary",
								typeKey: currentLoadout?.primary?.weaponType,
							},
							{
								label: "Secondary",
								slotKey: "secondary",
								typeKey: currentLoadout?.secondary?.weaponType,
							},
							{ label: "Handgun", slotKey: "handgun", typeKey: "HDG" },
						].map(({ label, slotKey, typeKey }) => {
							const data = currentLoadout?.[slotKey];
							const isActive = expandedSlot === slotKey;
							return (
								<button
									key={slotKey}
									type='button'
									onClick={() => setExpandedSlot(isActive ? null : slotKey)}
									className='flex flex-col gap-1 min-w-0 text-left hover:opacity-80 transition-opacity group'>
									<span className='font-mono text-[9px] tracking-widest text-neutral-600 uppercase'>
										{label}
									</span>
									{WEAPONS[typeKey]?.imgUrl && (
										<img
											src={WEAPONS[typeKey].imgUrl}
											alt={label}
											className='w-16 h-8 object-contain'
											style={{ filter: "invert(1) opacity(0.45)" }}
										/>
									)}
									<span
										className={`font-mono text-[11px] truncate transition-colors ${isActive ? "text-neutral-100" : "text-neutral-400 group-hover:text-neutral-200"}`}>
										{data?.weapon || (
											<span className='text-neutral-700'>—</span>
										)}
									</span>
								</button>
							);
						})}
					</div>

					{/* Attachment detail */}
					{expandedSlot && currentLoadout?.[expandedSlot] && (
						<div className='pt-3 border-t border-neutral-800/60 flex flex-col gap-1.5'>
							{Object.entries(currentLoadout[expandedSlot].attachments || {})
								.filter(([, v]) => v)
								.map(([k, v]) => (
									<div
										key={k}
										className='flex items-baseline gap-2 min-w-0'>
										<span className='font-mono text-[9px] uppercase tracking-widest text-neutral-600 shrink-0 w-16'>
											{k}
										</span>
										<span className='font-mono text-[10px] text-neutral-400 truncate'>
											{v}
										</span>
									</div>
								))}
							{!Object.values(
								currentLoadout[expandedSlot].attachments || {},
							).some(Boolean) && (
								<p className='font-mono text-[9px] text-neutral-700 italic'>
									No attachments
								</p>
							)}
						</div>
					)}
				</>
			)}

			{/* Perks */}
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

			{/* Equipment */}
			{items.length > 0 && (
				<div className='flex flex-col gap-2 pt-3 border-t border-neutral-800/60'>
					<span className='font-mono text-[9px] tracking-[0.25em] text-neutral-600 uppercase'>
						Equipment
					</span>
					<div className='grid grid-cols-4 gap-2'>
						{items.map((name) => (
							<div
								key={name}
								title={name}
								className='flex flex-col items-center gap-1 bg-neutral-950/60 border border-neutral-800/60 p-2 hover:border-neutral-700/60 transition-colors'>
								<img
									src={ITEMS[name]}
									alt={name}
									className='w-8 h-8 object-contain'
									style={{ filter: "invert(1) opacity(0.7)" }}
								/>
								<span className='font-mono text-[8px] text-center leading-tight text-neutral-500 truncate w-full'>
									{name}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

// ═══════════════════════════════════════════════════════════════════════════════
// OPERATORS PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function OperatorsPage() {
	const { setSelectedOperator, operators, fetchOperators } =
		useOperatorsStore();
	const { teams, fetchTeams } = useTeamsStore();
	const { open, SheetEl } = usePageSheet();
	const [dataUpdated, setDataUpdated] = useState(false);
	const [selectedOp, setSelectedOp] = useState(null);
	const refreshData = () => setDataUpdated((p) => !p);

	useEffect(() => {
		fetchOperators();
		fetchTeams();
	}, [fetchOperators, fetchTeams, dataUpdated]);

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
					className={`px-3 py-1 font-mono text-[7px] tracking-[0.3em] uppercase border-b border-neutral-800/80 ${color}`}>
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
								<span className='font-mono text-[10px] text-neutral-200 truncate flex-1 leading-none'>
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
									className={assignedTeam ? "text-btn" : "text-neutral-700"}>
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
						<span className='font-mono text-[8px] tracking-widest uppercase px-3 py-2 border-b-2 border-btn text-btn shrink-0'>
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
							<span className='font-mono text-[9px] tracking-[0.3em] text-neutral-700 uppercase'>
								Select Operator
							</span>
						</div>
					}
				</div>

				{/* RIGHT — Teams + WIA/KIA */}
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
						<div className='px-3 py-1.5 border-b border-neutral-800/40'>
							<span className='font-mono text-[8px] tracking-widest uppercase text-neutral-600'>
								Loadout
							</span>
						</div>
						<div className='overflow-y-auto max-h-96'>
							<LoadoutPanel />
						</div>
					</div>
				</div>
			</div>

			{SheetEl}
		</>
	);
}
