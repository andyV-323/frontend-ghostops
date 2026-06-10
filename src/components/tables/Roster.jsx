// Roster.jsx — compact card grid
import { useEffect } from "react";

// Plain-object view of a Mongoose Map or plain operatorRoles field
const rolesObj = (roles) => {
	if (!roles) return {};
	if (roles instanceof Map) {
		const out = {};
		roles.forEach((v, k) => { if (v) out[String(k)] = v; });
		return out;
	}
	return roles;
};
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { useOperatorsStore, useTeamsStore, useKitsStore } from "@/zustand";
import { getOperatorDisplayImage } from "@/utils/operatorImage";
import { PropTypes } from "prop-types";
import { NewOperatorForm } from "@/components/forms";
import { OperatorImageView } from "@/components";

// ─── Status config ────────────────────────────────────────────
const STATUS_MAP = {
	active: {
		label: "ACTIVE",
		dot: "bg-green-500",
		glow: "shadow-[0_0_5px_rgba(74,222,128,0.7)]",
		text: "text-green-500",
	},
	injured: {
		label: "WIA",
		dot: "bg-amber-400",
		glow: "shadow-[0_0_5px_rgba(251,191,36,0.7)]",
		text: "text-amber-400",
	},
	wounded: {
		label: "WIA",
		dot: "bg-amber-400",
		glow: "shadow-[0_0_5px_rgba(251,191,36,0.7)]",
		text: "text-amber-400",
	},
	kia: {
		label: "KIA",
		dot: "bg-red-500",
		glow: "shadow-[0_0_5px_rgba(239,68,68,0.7)]",
		text: "text-red-500",
	},
};
const getStatus = (s = "") => STATUS_MAP[s.toLowerCase()] ?? STATUS_MAP.kia;
// ─── Inline team + class selector ────────────────────────────
function OperatorTeamSelect({ operator }) {
	const { teams, addOperatorToTeam, unassignOperatorFromTeam, setOperatorSlotClass } =
		useTeamsStore();

	const currentTeam = teams.find((t) =>
		t.operators.some((op) => (op._id ?? op) === operator._id),
	);

	const currentSlotClass = currentTeam ?
		(rolesObj(currentTeam.operatorRoles)[operator._id] || "")
	:	"";

	const unavailable = ["kia", "injured", "wounded"].includes(
		(operator.status || "").toLowerCase(),
	);

	// operator.class is [String] in the schema; secondaryClass not in schema (may be undefined)
	const availableClasses = [
		...(Array.isArray(operator.class) ? operator.class : operator.class ? [operator.class] : []),
		...(operator.secondaryClass ? [operator.secondaryClass] : []),
	].filter(Boolean).filter((c, i, arr) => arr.indexOf(c) === i);

	const handleTeamChange = async (e) => {
		const val = e.target.value;
		if (!val) {
			if (currentTeam) await unassignOperatorFromTeam(operator._id, currentTeam._id);
		} else {
			await addOperatorToTeam(operator._id, val);
		}
	};

	const handleClassChange = async (e) => {
		if (!currentTeam) return;
		await setOperatorSlotClass(operator._id, currentTeam._id, e.target.value);
	};

	const selectCls =
		"w-full bg-neutral-950 border border-lines/15 rounded px-1.5 py-0.5 font-mono text-[8px] text-lines outline-none focus:border-btn/40 transition-colors disabled:opacity-40 cursor-pointer hover:border-lines/40";

	return (
		<div
			className='w-full flex flex-col gap-0.5'
			onClick={(e) => e.stopPropagation()}>
			<select
				value={currentTeam?._id || ""}
				onChange={handleTeamChange}
				disabled={unavailable}
				className={selectCls}>
				<option value=''>— Unassigned —</option>
				{teams.map((t) => (
					<option
						key={t._id}
						value={t._id}>
						{t.name}
					</option>
				))}
			</select>
			{currentTeam && availableClasses.length > 0 && (
				<select
					value={currentSlotClass}
					onChange={handleClassChange}
					className={selectCls}>
					<option value=''>— Class —</option>
					{availableClasses.map((c) => (
						<option
							key={c}
							value={c}>
							{c}
						</option>
					))}
				</select>
			)}
		</div>
	);
}

// ─── Operator card ────────────────────────────────────────────
function OperatorCard({ operatorId, openSheet }) {
	const { operators, setClickedOperator, setSelectedOperator, activeClasses } =
		useOperatorsStore();
	const operator = operators.find((o) => o._id === operatorId);
	const { kits } = useKitsStore();
	if (!operator) return null;
	const status = getStatus(operator?.status);
	const avatarSrc = getOperatorDisplayImage(operator, kits);

	return (
		<div
			className='group relative flex flex-col items-center gap-1.5 p-3 rounded border border-lines/15 bg-blk/40 hover:bg-highlight/15 hover:border-lines/35 cursor-pointer transition-all duration-150'
			onClick={() => {
				setClickedOperator(operator);
				setSelectedOperator(operator._id);
				openSheet(
					"left",
					<OperatorImageView
						operator={operator}
						openSheet={openSheet}
					/>,
				);
			}}>
			{/* Avatar */}
			<div className='relative shrink-0'>
				<div className='w-12 h-12 rounded-full border border-lines/30 overflow-hidden bg-highlight'>
					<img
						className={[
							"w-full h-full object-cover object-top",
							operator.status === "KIA" ? "grayscale opacity-50" : "",
						].join(" ")}
						onError={(e) => {
							e.currentTarget.src = "/ghost/Default.png";
						}}
						src={avatarSrc}
						alt={operator.callSign || "Operator"}
					/>
				</div>
				<span
					className={[
						"absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border border-blk",
						status.dot,
						status.glow,
					].join(" ")}
				/>
			</div>

			{/* Callsign */}
			<span className='font-mono text-[10px] text-fontz group-hover:text-white truncate max-w-full text-center leading-none transition-colors'>
				{operator.callSign || "Unknown"}
			</span>

			{/* Status */}
			<span
				className={`font-mono text-[8px] tracking-widest uppercase ${status.text} leading-none`}>
				{status.label}
			</span>
			{/* Class */}
			<span className='font-mono text-[8px] text-lines/40 truncate max-w-full text-center leading-none'>
				{activeClasses[operator._id] || (Array.isArray(operator.class) ? operator.class[0] : operator.class) || "—"}
			</span>

			{/* Inline team selector */}
			<div
				className='w-full mt-0.5'
				onClick={(e) => e.stopPropagation()}>
				<OperatorTeamSelect operator={operator} />
			</div>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────
const TabbedRoster = ({ dataUpdated, openSheet }) => {
	const { operators, fetchOperators } = useOperatorsStore();
	const { fetchTeams } = useTeamsStore();
	const { fetchKits } = useKitsStore();

	useEffect(() => {
		fetchOperators();
		fetchTeams();
		fetchKits();
	}, [fetchOperators, fetchTeams, fetchKits, dataUpdated]);

	return (
		<div className='flex flex-col h-full'>
			{/* ── Header ──────────────────────────────────────── */}
			<div className='shrink-0 flex items-center border-b border-lines/20 bg-blk/40 px-3 py-2'>
				<span className='font-mono text-[10px] tracking-widest uppercase text-btn'>
					Operators
					<span className='ml-1 text-lines/30'>({operators.length})</span>
				</span>
				<div className='flex-1' />
				<button
					onClick={() =>
						openSheet(
							"left",
							<NewOperatorForm />,
							"New Operator",
							"Customize an elite operator with background, class, loadout, and perks.",
						)
					}
					className='w-6 h-6 flex items-center justify-center bg-btn hover:bg-highlight text-blk rounded transition-colors'
					title='New Operator'>
					<FontAwesomeIcon
						icon={faUserPlus}
						className='text-[9px]'
					/>
				</button>
			</div>

			{/* ── Card grid ─────────────────────────────────── */}
			<div className='flex-1 min-h-0 overflow-y-auto p-3'>
				{operators.length > 0 ?
					<div className='grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2'>
						{operators.map((operator) => (
							<OperatorCard
								key={operator._id}
								operatorId={operator._id}
								openSheet={openSheet}
							/>
						))}
					</div>
				:	<div className='flex items-center justify-center h-32'>
						<p className='font-mono text-[10px] tracking-widest text-lines/25 uppercase text-center'>
							Click + to add your first operator.
						</p>
					</div>
				}
			</div>
		</div>
	);
};

// ─── PropTypes ────────────────────────────────────────────────
OperatorTeamSelect.propTypes = { operator: PropTypes.object.isRequired };
OperatorCard.propTypes = {
	operatorId: PropTypes.string.isRequired,
	openSheet: PropTypes.func.isRequired,
};
TabbedRoster.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default TabbedRoster;
