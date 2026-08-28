import { useMemo, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { Roster, Infirmary, Memorial, Teams } from "@/components/tables";
import { OperatorImageView, RosterTable } from "@/components";
import { NewOperatorForm, AssignTeamSheet } from "@/components/forms";
import {
	useOperatorsStore,
	useSheetStore,
	useTeamsStore,
} from "@/zustand";
import { CLASS } from "@/config";
import { findOperatorTeam } from "@/utils/teamMembers";
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
	const { open, SheetEl } = usePageSheet();
	const [dataUpdated, setDataUpdated] = useState(false);
	const [selectedOp, setSelectedOp] = useState(null);
	const [centerView, setCenterView] = useState("OPERATOR"); // "OPERATOR" | "ROSTER"
	const refreshData = () => setDataUpdated((p) => !p);

	// ── Filters (left list) ────────────────────────────────────────────
	const [search, setSearch] = useState("");
	const [unassignedOnly, setUnassignedOnly] = useState(false);
	const [teamFilter, setTeamFilter] = useState(() => new Set());
	const [classFilter, setClassFilter] = useState(() => new Set());
	const [statusFilter, setStatusFilter] = useState(() => new Set());

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
		setCenterView("OPERATOR");
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

			const found = findOperatorTeam(teams, op._id);
			const teamActive = teamFilter.size > 0 || unassignedOnly;
			if (teamActive) {
				const passesUnassigned = unassignedOnly && !found;
				const passesTeam = found && teamFilter.has(found.team._id);
				if (!passesUnassigned && !passesTeam) return false;
			}

			if (classFilter.size > 0) {
				const classes = Array.isArray(op.class) ? op.class : op.class ? [op.class] : [];
				if (!classes.some((c) => classFilter.has(c))) return false;
			}

			if (statusFilter.size > 0) {
				const labels = operatorStatusLabels(op);
				if (![...statusFilter].some((s) => labels.has(s))) return false;
			}

			return true;
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [operators, teams, search, unassignedOnly, teamFilter, classFilter, statusFilter]);

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
						<div className='ml-auto flex items-center gap-0.5 pr-2'>
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
							<button
								onClick={() => setUnassignedOnly((v) => !v)}
								className={chipCls(unassignedOnly)}>
								Unassigned
							</button>
							{teams.map((t) => (
								<button
									key={t._id}
									onClick={() => setTeamFilter((cur) => toggleInSet(cur, t._id))}
									className={chipCls(teamFilter.has(t._id))}>
									{t.name}
								</button>
							))}
						</div>
						<div className='flex flex-wrap gap-1'>
							{CLASS.map((c) => (
								<button
									key={c}
									onClick={() => setClassFilter((cur) => toggleInSet(cur, c))}
									className={chipCls(classFilter.has(c))}>
									{c}
								</button>
							))}
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

				{/* CENTER — Operator profile / Roster table */}
				<div className='w-[26rem] shrink-0 min-h-0 flex flex-col border-r border-neutral-700/40 bg-neutral-950/30'>
					<div className='shrink-0 flex items-center justify-center gap-1 border-b border-neutral-700/40 bg-neutral-900 p-1.5'>
						{["OPERATOR", "ROSTER"].map((v) => (
							<button
								key={v}
								onClick={() => setCenterView(v)}
								className={[
									"flex-1 font-mono text-[10px] tracking-widest uppercase py-1 rounded-sm transition-all",
									centerView === v ?
										"bg-btn/15 text-btn border border-btn/40"
									:	"text-neutral-500 border border-transparent hover:text-neutral-300",
								].join(" ")}>
								{v}
							</button>
						))}
					</div>
					<div className='flex-1 min-h-0 overflow-y-auto'>
						{centerView === "OPERATOR" ?
							selectedOp ?
								<OperatorImageView operator={selectedOp} openSheet={open} />
							:	<div className='flex flex-col items-center justify-center h-full gap-3'>
									<div className='w-10 h-10 border border-neutral-700/50 rotate-45' />
									<span className='font-mono text-[11px] tracking-[0.3em] text-neutral-700 uppercase'>
										Select Operator
									</span>
								</div>
						:	<RosterTable operators={filteredOperators} onSelectOperator={selectOp} />
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

			{SheetEl}
		</>
	);
}
