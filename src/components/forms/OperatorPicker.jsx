import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faXmark,
	faMagnifyingGlass,
	faUserPlus,
	faShieldHalved,
	faStar,
} from "@fortawesome/free-solid-svg-icons";
import { PropTypes } from "prop-types";

const STATUS_DOT = {
	Active:  "bg-green-500 shadow-[0_0_5px_rgba(74,222,128,0.6)]",
	Injured: "bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.6)]",
	KIA:     "bg-red-500  shadow-[0_0_5px_rgba(239,68,68,0.6)]",
};

const getSquadId = (op) =>
	(typeof op.squad === "object" ? op.squad?._id : op.squad) ?? null;

const getImage = (op) => op.imageKey || op.image || "/ghost/Default.png";

/* ─── Roster-style avatar with status dot ────────────── */
const Avatar = ({ op, size = "sm" }) => {
	const dim = size === "lg" ? "w-10 h-10" : "w-8 h-8";
	return (
		<div className={`relative shrink-0 ${dim}`}>
			<div className={`${dim} rounded-full border border-lines/30 overflow-hidden bg-highlight`}>
				<img
					src={getImage(op)}
					alt={op.callSign}
					className="w-full h-full object-cover object-top"
					onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
				/>
			</div>
			<span
				className={[
					"absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-blk",
					STATUS_DOT[op.status] ?? STATUS_DOT.Active,
				].join(" ")}
			/>
		</div>
	);
};

Avatar.propTypes = {
	op:   PropTypes.object.isRequired,
	size: PropTypes.string,
};

/* ─── Filter tab pill ─────────────────────────────────── */
// propTypes declared after definition below
const Tab = ({ label, active, onClick }) => (
	<button
		type="button"
		onClick={onClick}
		className={[
			"font-mono text-[8px] tracking-widest uppercase px-2.5 py-1 rounded-sm border transition-colors shrink-0",
			active
				? "bg-btn/20 border-btn/50 text-btn"
				: "border-lines/20 text-lines/40 hover:border-lines/40 hover:text-lines/60",
		].join(" ")}>
		{label}
	</button>
);

Tab.propTypes = {
	label:   PropTypes.string.isRequired,
	active:  PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
};

/* ═══════════════════════════════════════════════════════ */
const OperatorPicker = ({ allOperators, selected, squads = [], teams = [], onAdd, onRemove }) => {
	const [search, setSearch]       = useState("");
	const [activeFilter, setFilter] = useState("all");

	const getTeamName = (opId) => {
		const team = teams.find((t) => t.operators?.some((op) => op._id === opId));
		return team ? team.name : null;
	};

	const available = allOperators.filter((op) => {
		if (selected.includes(op._id)) return false;
		if (op.status === "Injured" || op.status === "KIA") return false;
		if (activeFilter === "enablers" && !op.support) return false;
		if (activeFilter === "aviators" && !op.aviator) return false;
		if (activeFilter !== "all" && activeFilter !== "enablers" && activeFilter !== "aviators") {
			if (getSquadId(op) !== activeFilter) return false;
		}
		if (search && !op.callSign?.toLowerCase().includes(search.toLowerCase())) return false;
		return true;
	});

	const selectedOps = selected
		.map((id) => allOperators.find((op) => op._id === id))
		.filter(Boolean);

	return (
		<div className="flex flex-col gap-3">
			{/* ── Selected roster ───────────────────────────────── */}
			{selectedOps.length > 0 && (
				<div className="flex flex-col gap-1.5">
					<span className="font-mono text-[8px] tracking-[0.25em] text-lines/40 uppercase">
						Selected — {selectedOps.length} operator{selectedOps.length !== 1 ? "s" : ""}
					</span>
					{selectedOps.map((op) => (
						<div
							key={op._id}
							className="flex items-center gap-2.5 px-3 py-2 bg-btn/10 border border-btn/30 rounded-sm">
							<Avatar op={op} size="lg" />
							<span className="font-mono text-[11px] text-fontz font-semibold flex-1 truncate">
								{op.callSign}
							</span>
							<span className="font-mono text-[8px] text-lines/40 truncate hidden sm:block">
								{op.class}{op.role ? ` · ${op.role}` : ""}
							</span>
							{op.support && <FontAwesomeIcon icon={faShieldHalved} className="text-blue-400/70 text-[9px]" />}
							{op.aviator && <FontAwesomeIcon icon={faStar}         className="text-sky-400/70 text-[9px]" />}
							<button
								type="button"
								onClick={() => onRemove(op._id)}
								className="ml-1 text-lines/40 hover:text-red-400 transition-colors">
								<FontAwesomeIcon icon={faXmark} className="text-[11px]" />
							</button>
						</div>
					))}
				</div>
			)}

			{/* ── Search bar ────────────────────────────────────── */}
			<div className="relative">
				<FontAwesomeIcon
					icon={faMagnifyingGlass}
					className="absolute left-2.5 top-1/2 -translate-y-1/2 text-lines/30 text-[10px] pointer-events-none"
				/>
				<input
					type="text"
					placeholder="Search operators..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full bg-blk/50 border border-lines/40 rounded-sm pl-7 pr-3 py-1.5 font-mono text-[11px] text-fontz placeholder:text-lines/25 outline-none focus:border-lines/60"
				/>
			</div>

			{/* ── Filter tabs ───────────────────────────────────── */}
			<div className="flex flex-wrap gap-1.5">
				<Tab label="All"      active={activeFilter === "all"}      onClick={() => setFilter("all")} />
				{squads.map((sq) => (
					<Tab key={sq._id} label={sq.name} active={activeFilter === sq._id} onClick={() => setFilter(sq._id)} />
				))}
				<Tab label="Enablers" active={activeFilter === "enablers"} onClick={() => setFilter("enablers")} />
				<Tab label="Aviators" active={activeFilter === "aviators"} onClick={() => setFilter("aviators")} />
			</div>

			{/* ── Available operators ───────────────────────────── */}
			<div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-0.5">
				{available.length === 0 ? (
					<div className="flex items-center justify-center py-6">
						<span className="font-mono text-[9px] tracking-widest text-lines/25 uppercase">
							No operators available
						</span>
					</div>
				) : (
					available.map((op) => {
						const teamName = getTeamName(op._id);
						return (
							<button
								key={op._id}
								type="button"
								onClick={() => onAdd(op._id)}
								className="flex items-center gap-2.5 px-3 py-2 border border-lines/20 hover:border-lines/50 hover:bg-lines/5 rounded-sm transition-colors text-left group">
								<Avatar op={op} />
								<span className="font-mono text-[11px] text-fontz/80 group-hover:text-fontz flex-1 truncate font-medium">
									{op.callSign}
								</span>
								<span className="font-mono text-[8px] text-lines/35 truncate hidden sm:block">
									{op.class}{op.role ? ` · ${op.role}` : ""}
								</span>
								{teamName && (
									<span className="font-mono text-[7px] tracking-widest uppercase px-1.5 py-0.5 border border-lines/20 text-lines/35 rounded-sm shrink-0 hidden sm:block">
										{teamName}
									</span>
								)}
								{op.support && <FontAwesomeIcon icon={faShieldHalved} className="text-blue-400/50 text-[9px]" />}
								{op.aviator && <FontAwesomeIcon icon={faStar}         className="text-sky-400/50 text-[9px]" />}
								<FontAwesomeIcon
									icon={faUserPlus}
									className="text-lines/20 group-hover:text-btn text-[9px] shrink-0 transition-colors"
								/>
							</button>
						);
					})
				)}
			</div>
		</div>
	);
};

OperatorPicker.propTypes = {
	allOperators: PropTypes.array.isRequired,
	selected:     PropTypes.array.isRequired,
	squads:       PropTypes.array,
	teams:        PropTypes.array,
	onAdd:        PropTypes.func.isRequired,
	onRemove:     PropTypes.func.isRequired,
};

export default OperatorPicker;
