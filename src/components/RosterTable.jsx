// RosterTable.jsx — sortable operator table for the Personnel page's centre
// column (§5.4). Columns: portrait, name, class, team, slot, status.
import { useMemo, useState } from "react";
import { PropTypes } from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";
import { useTeamsStore, useKitsStore } from "@/zustand";
import { getOperatorDisplayImage } from "@/utils/operatorImage";
import SlotControl from "./SlotControl";
import { findOperatorTeam } from "@/utils/teamMembers";

const STATUS_ORDER = { Active: 0, Injured: 1, KIA: 2 };
const STATUS_DOT = {
	Active: "bg-green-500",
	Injured: "bg-amber-400",
	KIA: "bg-red-500",
};

const COLUMNS = [
	{ key: "portrait", label: "", sortable: false },
	{ key: "name", label: "Name", sortable: true },
	{ key: "class", label: "Class", sortable: true },
	{ key: "team", label: "Team", sortable: true },
	{ key: "slot", label: "Slot", sortable: true },
	{ key: "status", label: "Status", sortable: true },
];

function sortValue(op, teams, key) {
	switch (key) {
		case "name":
			return (op.callSign || "").toLowerCase();
		case "class":
			return (Array.isArray(op.class) ? op.class[0] : op.class || "").toLowerCase();
		case "team": {
			const found = findOperatorTeam(teams, op._id);
			return found ? found.team.name.toLowerCase() : "￿"; // unassigned sorts last
		}
		case "slot": {
			const found = findOperatorTeam(teams, op._id);
			return found?.slot ?? 99;
		}
		case "status":
			return STATUS_ORDER[op.status] ?? 9;
		default:
			return "";
	}
}

export default function RosterTable({ operators, onSelectOperator }) {
	const { teams, assignSlot } = useTeamsStore();
	const { kits } = useKitsStore();
	const [sortKey, setSortKey] = useState("name");
	const [sortDir, setSortDir] = useState("asc");

	const handleSort = (key) => {
		if (sortKey === key) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir("asc");
		}
	};

	const sorted = useMemo(() => {
		const copy = [...operators];
		copy.sort((a, b) => {
			const va = sortValue(a, teams, sortKey);
			const vb = sortValue(b, teams, sortKey);
			if (va < vb) return sortDir === "asc" ? -1 : 1;
			if (va > vb) return sortDir === "asc" ? 1 : -1;
			return 0;
		});
		return copy;
	}, [operators, teams, sortKey, sortDir]);

	return (
		<div className='w-full overflow-x-auto'>
			<table className='w-full text-left border-collapse'>
				<thead className='sticky top-0 bg-neutral-900 z-10'>
					<tr className='border-b border-neutral-700/40'>
						{COLUMNS.map((col) => (
							<th
								key={col.key}
								onClick={() => col.sortable && handleSort(col.key)}
								className={[
									"px-2 py-2 font-mono text-[9px] tracking-widest uppercase text-neutral-500 whitespace-nowrap",
									col.sortable ? "cursor-pointer hover:text-btn select-none" : "",
								].join(" ")}>
								<span className='inline-flex items-center gap-1'>
									{col.label}
									{col.sortable && (
										<FontAwesomeIcon
											icon={sortKey !== col.key ? faSort : sortDir === "asc" ? faSortUp : faSortDown}
											className='text-[8px] text-neutral-700'
										/>
									)}
								</span>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{sorted.map((op) => {
						const found = findOperatorTeam(teams, op._id);
						const avatarSrc = getOperatorDisplayImage(op, kits);
						const cls = Array.isArray(op.class) ? op.class.filter(Boolean).join(" / ") : op.class || "—";
						return (
							<tr
								key={op._id}
								onClick={() => onSelectOperator(op)}
								className='border-b border-neutral-800/40 hover:bg-neutral-800/40 cursor-pointer transition-colors'>
								<td className='px-2 py-1.5'>
									<img
										src={avatarSrc}
										alt={op.callSign}
										className={[
											"w-8 h-8 rounded-full border border-lines/30 object-cover object-top bg-neutral-900",
											op.status === "KIA" ? "grayscale opacity-50" : "",
										].join(" ")}
										onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
									/>
								</td>
								<td className='px-2 py-1.5 font-mono text-xs text-fontz whitespace-nowrap'>{op.callSign}</td>
								<td className='px-2 py-1.5 font-mono text-[10px] text-lines/60 whitespace-nowrap'>{cls}</td>
								<td className='px-2 py-1.5' onClick={(e) => e.stopPropagation()}>
									<select
										value={found?.team._id || ""}
										onChange={(e) => {
											if (e.target.value) assignSlot(e.target.value, op._id, null);
										}}
										disabled={op.status === "KIA"}
										className='bg-neutral-950 border border-lines/30 rounded-sm px-1.5 py-0.5 font-mono text-[9px] text-lines outline-none focus:border-btn/50 disabled:opacity-40'>
										<option value=''>— Unassigned —</option>
										{teams.map((t) => (
											<option key={t._id} value={t._id}>{t.name}</option>
										))}
									</select>
								</td>
								<td className='px-2 py-1.5' onClick={(e) => e.stopPropagation()}>
									{found ?
										<SlotControl
											currentSlot={found.slot}
											onSelect={(slot) => assignSlot(found.team._id, op._id, slot)}
										/>
									:	<span className='font-mono text-[9px] text-lines/25 uppercase'>—</span>
									}
								</td>
								<td className='px-2 py-1.5'>
									<span className='inline-flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-lines/70'>
										<span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[op.status] || "bg-lines/40"}`} />
										{op.status}
									</span>
								</td>
							</tr>
						);
					})}
					{sorted.length === 0 && (
						<tr>
							<td colSpan={COLUMNS.length} className='px-2 py-8 text-center font-mono text-[10px] text-lines/30 uppercase tracking-widest'>
								No operators match the current filters
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}

RosterTable.propTypes = {
	operators: PropTypes.array.isRequired,
	onSelectOperator: PropTypes.func.isRequired,
};
