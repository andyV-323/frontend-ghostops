import { useMemo, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPlus,
	faMagnifyingGlass,
	faUpRightAndDownLeftFromCenter,
	faFilter,
	faSort,
	faSortUp,
	faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import { Roster, Infirmary, Memorial, Teams } from "@/components/tables";
import { OperatorImageView } from "@/components";
import { NewOperatorForm, AssignTeamSheet } from "@/components/forms";
import {
	useOperatorsStore,
	useSheetStore,
	useTeamsStore,
	useKitsStore,
} from "@/zustand";
import { CLASS } from "@/config";
import { findOperatorTeam } from "@/utils/teamMembers";
import { getOperatorDisplayImage } from "@/utils/operatorImage";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Panel, usePageSheet } from "./dashboardHelpers";


// ═══════════════════════════════════════════════════════════════════════════════
// OPERATORS PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_FILTERS = ["ACTIVE", "RESERVE", "CASUALTY"];

const chipCls = (active) =>
	[
		"font-mono text-[9px] tracking-widest uppercase px-2 py-1 border rounded-sm transition-all whitespace-nowrap",
		active ?
			"border-btn/60 bg-btn/10 text-btn"
		:	"border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300",
	].join(" ");

function toggleInSet(set, value) {
	const next = new Set(set);
	if (next.has(value)) next.delete(value);
	else next.add(value);
	return next;
}

export default function OperatorsPage() {
	const { setSelectedOperator, operators, fetchOperators } = useOperatorsStore();
	const { teams, fetchTeams } = useTeamsStore();
	const { kits } = useKitsStore();
	const { open, SheetEl } = usePageSheet();
	const [dataUpdated, setDataUpdated] = useState(false);
	const [selectedOp, setSelectedOp] = useState(null);
	const refreshData = () => setDataUpdated((p) => !p);

	// ── Filters (left list) ────────────────────────────────────────────
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState(() => new Set());

	// ── Roster sheet — the full Class/Slot/Status table, opened as a wide
	// left-side sheet instead of crammed into the 320px sidebar. Header
	// sort/filter only exist here. Closing the sheet clears header filters.
	const [rosterSheetOpen, setRosterSheetOpen] = useState(false);
	const [sortKey, setSortKey] = useState(null);
	const [sortDir, setSortDir] = useState("asc");
	const [headerTeamFilter, setHeaderTeamFilter] = useState(() => new Set());
	const [headerClassFilter, setHeaderClassFilter] = useState(() => new Set());
	const [openFilterMenu, setOpenFilterMenu] = useState(null); // "team" | "class" | null

	const closeRosterSheet = () => {
		setRosterSheetOpen(false);
		setHeaderTeamFilter(new Set());
		setHeaderClassFilter(new Set());
		setOpenFilterMenu(null);
	};

	const handleSort = (key) => {
		if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else {
			setSortKey(key);
			setSortDir("asc");
		}
	};

	useEffect(() => {
		fetchOperators();
		fetchTeams();
	}, [fetchOperators, fetchTeams, dataUpdated]);

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

	const operatorStatusLabels = (op) => {
		const labels = new Set();
		if (op.status === "Injured" || op.status === "KIA") labels.add("CASUALTY");
		const found = findOperatorTeam(teams, op._id);
		if (found) labels.add(found.slot ? "ACTIVE" : "RESERVE");
		return labels;
	};

	const filteredOperators = useMemo(() => {
		return operators.filter((op) => {
			if (search && !(op.callSign || "").toLowerCase().includes(search.toLowerCase())) return false;

			if (statusFilter.size > 0) {
				const labels = operatorStatusLabels(op);
				if (![...statusFilter].some((s) => labels.has(s))) return false;
			}

			// Header-based team/class filtering only applies in the roster sheet —
			// both Sets are cleared on close, but the `rosterSheetOpen` guard keeps
			// that invariant explicit rather than relying on the clear timing.
			if (rosterSheetOpen && headerTeamFilter.size > 0) {
				const found = findOperatorTeam(teams, op._id);
				if (!found || !headerTeamFilter.has(found.team._id)) return false;
			}
			if (rosterSheetOpen && headerClassFilter.size > 0) {
				const classes = Array.isArray(op.class) ? op.class : op.class ? [op.class] : [];
				if (!classes.some((c) => headerClassFilter.has(c))) return false;
			}

			return true;
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [operators, teams, search, statusFilter, rosterSheetOpen, headerTeamFilter, headerClassFilter]);

	// ── Extended table sort — slot sorts 1-4, then reserve (R), then unassigned ──
	const extendedSortValue = (op, key) => {
		switch (key) {
			case "name":
				return (op.callSign || "").toLowerCase();
			case "team": {
				const found = findOperatorTeam(teams, op._id);
				return found ? found.team.name.toLowerCase() : "￿";
			}
			case "class":
				return (Array.isArray(op.class) ? op.class[0] : op.class || "").toLowerCase();
			case "slot": {
				const found = findOperatorTeam(teams, op._id);
				if (!found) return 99;
				return found.slot ?? 5;
			}
			default:
				return "";
		}
	};

	const extendedRows = useMemo(() => {
		if (!rosterSheetOpen || !sortKey) return filteredOperators;
		const copy = [...filteredOperators];
		copy.sort((a, b) => {
			const va = extendedSortValue(a, sortKey);
			const vb = extendedSortValue(b, sortKey);
			if (va < vb) return sortDir === "asc" ? -1 : 1;
			if (va > vb) return sortDir === "asc" ? 1 : -1;
			return 0;
		});
		return copy;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filteredOperators, rosterSheetOpen, sortKey, sortDir, teams]);

	const active = filteredOperators.filter((o) => {
		const s = o.status?.toLowerCase();
		return s !== "kia" && s !== "injured" && s !== "wounded";
	});
	const wia = filteredOperators.filter((o) => {
		const s = o.status?.toLowerCase();
		return s === "injured" || s === "wounded";
	});
	const kia = filteredOperators.filter((o) => o.status?.toLowerCase() === "kia");

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
				<div className={`px-3 py-1 font-mono text-[10px] tracking-[0.3em] uppercase border-b border-neutral-800/80 ${color}`}>
					{label}
				</div>
				{ops.map((op) => {
					const assignedTeam = findOperatorTeam(teams, op._id)?.team ?? null;
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
								<span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(op)}`} />
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
								<span className={`font-mono text-[10px] ${assignedTeam ? "text-btn" : "text-neutral-700"}`}>
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
						<Teams dataUpdated={dataUpdated} refreshData={refreshData} openSheet={open} />
					</Panel>
					<div className='grid grid-cols-2 gap-2'>
						<Panel title='Infirmary' badge='WIA' className='min-h-40'>
							<Infirmary dataUpdated={dataUpdated} refreshData={refreshData} openSheet={open} />
						</Panel>
						<Panel title='Fallen Ghost' badge='KIA' className='min-h-40'>
							<Memorial dataUpdated={dataUpdated} refreshData={refreshData} openSheet={open} />
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
						<div className='ml-auto flex items-center gap-1 pr-2'>
							<button
								onClick={() => setRosterSheetOpen(true)}
								title='Expand roster'
								className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase px-2 py-1 text-neutral-400 hover:text-btn border border-neutral-700 hover:border-btn/40 rounded-sm transition-colors'>
								<FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} className='text-[9px]' />
								Expand
							</button>
							<button
								onClick={() => open("left", <NewOperatorForm />, "New Operator", "Add an elite operator.")}
								className='w-5 h-5 flex items-center justify-center bg-btn/80 hover:bg-btn text-neutral-900 rounded-sm transition-colors ml-1'
								title='Add operator'>
								<FontAwesomeIcon icon={faPlus} className='text-[8px]' />
							</button>
						</div>
					</div>

					{/* Search + filter chips */}
					<div className='shrink-0 border-b border-neutral-700/40 bg-neutral-900/80 p-2 flex flex-col gap-2'>
						<div className='flex items-center gap-1.5 px-2 py-1 border border-neutral-800 rounded-sm bg-neutral-950/60'>
							<FontAwesomeIcon icon={faMagnifyingGlass} className='text-neutral-600 text-[9px]' />
							<input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder='Search callsign...'
								className='flex-1 bg-transparent font-mono text-[10px] text-neutral-200 outline-none placeholder:text-neutral-700'
							/>
						</div>
						<div className='flex flex-wrap gap-1'>
							{STATUS_FILTERS.map((s) => (
								<button
									key={s}
									onClick={() => setStatusFilter((cur) => toggleInSet(cur, s))}
									className={chipCls(statusFilter.has(s))}>
									{s}
								</button>
							))}
						</div>
					</div>

					<div className='flex-1 overflow-y-auto'>
						<RowSection label='Active' color='text-neutral-600' ops={active} />
						<RowSection label='WIA' color='text-amber-600/70' ops={wia} />
						<RowSection label='KIA' color='text-red-700/60' ops={kia} />
						{filteredOperators.length === 0 && (
							<div className='flex flex-col items-center justify-center gap-2 py-10'>
								<div className='w-5 h-5 border border-neutral-700 rotate-45' />
								<span className='font-mono text-[8px] tracking-widest text-neutral-700 uppercase'>
									No operators match
								</span>
							</div>
						)}
					</div>
				</div>

				{/* CENTER — Operator profile */}
				<div className='w-[26rem] shrink-0 min-h-0 flex flex-col border-r border-neutral-700/40 bg-neutral-950/30'>
					<div className='shrink-0 flex items-center justify-center border-b border-neutral-700/40 bg-neutral-900 p-1.5'>
						<span className='font-mono text-[10px] tracking-widest uppercase py-1 text-btn'>
							Operator
						</span>
					</div>
					<div className='flex-1 min-h-0 overflow-y-auto'>
						{selectedOp ?
							<OperatorImageView operator={selectedOp} openSheet={open} />
						:	<div className='flex flex-col items-center justify-center h-full gap-3'>
								<div className='w-10 h-10 border border-neutral-700/50 rotate-45' />
								<span className='font-mono text-[11px] tracking-[0.3em] text-neutral-700 uppercase'>
									Select Operator
								</span>
							</div>
						}
					</div>
				</div>

				{/* RIGHT — Teams */}
				<div className='flex-1 min-h-0 flex flex-col border-l border-neutral-800/40 bg-neutral-900/40'>
					<div className='flex-1 min-h-0 overflow-y-auto'>
						<Teams dataUpdated={dataUpdated} refreshData={refreshData} openSheet={open} />
					</div>
				</div>
			</div>

			{/* ── Expanded roster sheet — full-size table, readable at last ── */}
			<Sheet
				open={rosterSheetOpen}
				onOpenChange={(open) => {
					if (!open) closeRosterSheet();
				}}>
				<SheetContent
					side='left'
					className='p-0 bg-blk border-r border-lines/40 overflow-hidden flex flex-col w-full sm:max-w-4xl'
					aria-describedby={undefined}>
					<SheetTitle className='sr-only'>Operators Roster</SheetTitle>
					<div className='shrink-0 px-5 py-4 border-b border-lines/40 bg-neutral-950/60'>
						<h2 className='font-mono text-sm font-bold text-white uppercase tracking-widest'>
							Operators Roster
						</h2>
						<p className='font-mono text-[10px] text-lines/50 mt-1 tracking-widest uppercase'>
							{extendedRows.length} operator{extendedRows.length !== 1 ? "s" : ""}
						</p>
					</div>
					<div className='flex-1 min-h-0 overflow-y-auto'>
						<table className='w-full text-left border-collapse'>
							<thead className='sticky top-0 bg-blk z-10'>
								<tr className='border-b border-lines/40'>
									<th className='w-12 px-3 py-3' />
									{[
										{ key: "name", label: "Name" },
										{ key: "team", label: "Team", filter: "team" },
										{ key: "class", label: "Class", filter: "class" },
										{ key: "slot", label: "Slot" },
									].map((col) => (
										<th
											key={col.key}
											className='px-3 py-3 font-mono text-xs tracking-widest uppercase text-lines/70 whitespace-nowrap relative'>
											<span className='inline-flex items-center gap-2'>
												<button
													type='button'
													onClick={() => handleSort(col.key)}
													className='inline-flex items-center gap-1.5 hover:text-btn transition-colors'>
													{col.label}
													<FontAwesomeIcon
														icon={sortKey !== col.key ? faSort : sortDir === "asc" ? faSortUp : faSortDown}
														className='text-[10px] text-lines/30'
													/>
												</button>
												{col.filter && (
													<button
														type='button'
														onClick={() =>
															setOpenFilterMenu((m) => (m === col.filter ? null : col.filter))
														}
														className={[
															"text-[11px] transition-colors",
															(col.filter === "team" ? headerTeamFilter.size : headerClassFilter.size) > 0 ?
																"text-btn"
															:	"text-lines/40 hover:text-lines/70",
														].join(" ")}>
														<FontAwesomeIcon icon={faFilter} />
													</button>
												)}
											</span>
											{col.filter === "team" && openFilterMenu === "team" && (
												<div className='absolute left-0 top-full mt-1 z-20 w-48 max-h-60 overflow-y-auto bg-neutral-950 border border-lines/40 rounded-sm shadow-lg p-2 flex flex-col gap-1'>
													{teams.map((t) => (
														<label
															key={t._id}
															className='flex items-center gap-2 px-1.5 py-1 font-mono text-xs text-lines normal-case tracking-normal cursor-pointer hover:bg-highlight/20 rounded-sm'>
															<input
																type='checkbox'
																checked={headerTeamFilter.has(t._id)}
																onChange={() =>
																	setHeaderTeamFilter((cur) => toggleInSet(cur, t._id))
																}
																className='accent-btn w-3.5 h-3.5'
															/>
															{t.name}
														</label>
													))}
												</div>
											)}
											{col.filter === "class" && openFilterMenu === "class" && (
												<div className='absolute left-0 top-full mt-1 z-20 w-48 max-h-60 overflow-y-auto bg-neutral-950 border border-lines/40 rounded-sm shadow-lg p-2 flex flex-col gap-1'>
													{CLASS.map((c) => (
														<label
															key={c}
															className='flex items-center gap-2 px-1.5 py-1 font-mono text-xs text-lines normal-case tracking-normal cursor-pointer hover:bg-highlight/20 rounded-sm'>
															<input
																type='checkbox'
																checked={headerClassFilter.has(c)}
																onChange={() =>
																	setHeaderClassFilter((cur) => toggleInSet(cur, c))
																}
																className='accent-btn w-3.5 h-3.5'
															/>
															{c}
														</label>
													))}
												</div>
											)}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{extendedRows.map((op) => {
									const found = findOperatorTeam(teams, op._id);
									const cls =
										Array.isArray(op.class) ?
											op.class.filter(Boolean).join(" / ")
										:	op.class || "—";
									const slotLabel = found ? (found.slot ? String(found.slot) : "R") : "—";
									const avatarSrc = getOperatorDisplayImage(op, kits);
									return (
										<tr
											key={op._id}
											onClick={() => {
												selectOp(op);
												closeRosterSheet();
											}}
											className={[
												"border-b border-lines/15 cursor-pointer transition-colors",
												selectedOp?._id === op._id ?
													"bg-btn/10"
												:	"hover:bg-highlight/15",
											].join(" ")}>
											<td className='px-3 py-2.5'>
												<div className='relative w-9 h-9'>
													<img
														src={avatarSrc}
														alt={op.callSign}
														className={[
															"w-9 h-9 rounded-full border border-lines/40 object-cover object-top bg-blk",
															op.status === "KIA" ? "grayscale opacity-50" : "",
														].join(" ")}
														onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
													/>
													<span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-blk ${statusDot(op)}`} />
												</div>
											</td>
											<td className='px-3 py-2.5 font-mono text-sm text-fontz'>
												{op.callSign || "—"}
											</td>
											<td className='px-3 py-2.5 font-mono text-xs text-lines/70'>
												{found ? found.team.name : "—"}
											</td>
											<td className='px-3 py-2.5 font-mono text-xs text-lines/70'>
												{cls}
											</td>
											<td className='px-3 py-2.5 font-mono text-xs text-lines/70'>
												{slotLabel}
											</td>
										</tr>
									);
								})}
								{extendedRows.length === 0 && (
									<tr>
										<td colSpan={5} className='px-3 py-10 text-center font-mono text-xs text-lines/30 uppercase tracking-widest'>
											No operators match
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</SheetContent>
			</Sheet>

			{SheetEl}
		</>
	);
}
