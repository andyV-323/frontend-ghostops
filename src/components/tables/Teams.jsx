// Teams.jsx — team cards grid: 4 active slots + unbounded reserve list.
import { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPeopleGroup,
	faUsersGear,
	faXmark,
	faBolt,
	faCheck,
	faTrash,
	faChevronDown,
	faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { useTeamsStore, useKitsStore, useOperatorsStore } from "@/zustand";
import { useAuth } from "react-oidc-context";
import { TeamsApi } from "@/api";
import { toast } from "react-toastify";
import { PROVINCES } from "@/config";
import { TEAMS as MISSION_TEMPLATES } from "@/config/teams";
import { PropTypes } from "prop-types";
import { useConfirmDialog } from "@/hooks";
import { ConfirmDialog, TeamView, SlotControl } from "@/components";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getOperatorDisplayImage } from "@/utils/operatorImage";
import {
	reserveMembers,
	casualtyMembers,
	activeCount,
	reserveCount,
	memberOperatorId,
} from "@/utils/teamMembers";

// ─── NATO alphabet ────────────────────────────────────────────
const NATO = [
	"Alpha","Bravo","Charlie","Delta","Echo","Foxtrot","Golf","Hotel",
	"India","Juliet","Kilo","Lima","Mike","November","Oscar","Papa",
	"Quebec","Romeo","Sierra","Tango","Uniform","Victor","Whiskey",
	"X-Ray","Yankee","Zulu",
];

function nextTeamName(existingTeams) {
	const taken = new Set(existingTeams.map((t) => t.name));
	return NATO.find((n) => !taken.has(n)) ?? `Team ${existingTeams.length + 1}`;
}

// ─── Status dot ───────────────────────────────────────────────
const STATUS_DOT = {
	active: "bg-green-500 shadow-[0_0_4px_rgba(74,222,128,0.7)]",
	injured: "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.7)]",
	wounded: "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.7)]",
	kia: "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.7)]",
};
const getDot = (s = "") => STATUS_DOT[s.toLowerCase()] ?? STATUS_DOT.active;

// Resolve the freshest operator record for a membership entry (an
// activeSlots/reserves entry populated with an ObjectId or Operator object).
function useResolveOperator(member) {
	const { operators } = useOperatorsStore();
	if (!member) return null;
	const id = memberOperatorId(member);
	const fresh = operators.find((o) => o._id === id);
	if (fresh) return fresh;
	return typeof member.operatorId === "object" ? member.operatorId : null;
}

// ─── One active slot (filled or empty) ─────────────────────────
function ActiveSlot({ team, slotNum, member, isControlOpen, onToggleControl, onOperatorClick }) {
	const { kits } = useKitsStore();
	const operator = useResolveOperator(member);

	if (!member || !operator) {
		return (
			<div className='w-20 h-20 shrink-0 flex items-center justify-center border border-dashed border-lines/30 rounded-sm'>
				<span className='font-mono text-sm text-lines/25'>{slotNum}</span>
			</div>
		);
	}

	const avatarSrc = getOperatorDisplayImage(operator, kits);
	const isLead = !!team.leadId && String(operator._id) === String(team.leadId);

	return (
		<div
			role='button'
			tabIndex={0}
			onClick={(e) => {
				e.stopPropagation();
				onOperatorClick(operator, e);
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") onOperatorClick(operator, e);
			}}
			className={[
				"group relative flex flex-col items-center justify-center gap-0.5 w-20 shrink-0 py-1.5 border rounded-sm transition-colors cursor-pointer",
				isControlOpen ? "border-btn/50" : "border-lines/30 hover:border-btn/40",
			].join(" ")}>
			<span className='absolute top-1 left-1 font-mono text-[8px] text-lines/50'>{slotNum}</span>
			<div className='relative w-10 h-10 mt-2'>
				<img
					className={[
						"w-10 h-10 rounded-full border object-cover object-top",
						isLead ? "border-btn shadow-[0_0_6px_rgba(124,170,121,0.45)]" : "border-lines/60",
					].join(" ")}
					src={avatarSrc}
					onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
					alt={operator.callSign}
				/>
				<span className={["absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-blk", getDot(operator.status)].join(" ")} />
			</div>
			<span className='font-mono text-[8px] text-lines truncate max-w-[90%] leading-none'>{operator.callSign}</span>
			{member.class && (
				<span className='font-mono text-[6px] tracking-widest uppercase text-lines/40 truncate max-w-[90%] leading-none'>
					{member.class}
				</span>
			)}
			<button
				type='button'
				onClick={(e) => { e.stopPropagation(); onToggleControl(operator._id); }}
				title={isControlOpen ? "Close" : "Switch Slot"}
				className={[
					"mt-1 w-full py-1 font-mono text-[6px] tracking-widest uppercase border-t transition-colors",
					isControlOpen ?
						"text-btn border-btn/40 bg-btn/10"
					:	"text-lines/50 border-lines/20 hover:text-btn hover:border-btn/30",
				].join(" ")}>
				Switch Slot
			</button>
		</div>
	);
}

// ─── Reserve row ────────────────────────────────────────────────
const RESERVE_VISIBLE = 4;

function ReserveRow({ team, controlOperatorId, onToggleControl, onAssignSlot, onUnassign, onOperatorClick }) {
	const reserves = reserveMembers(team);
	const visible = reserves.slice(0, RESERVE_VISIBLE);
	const overflow = reserves.length - visible.length;

	if (reserves.length === 0) {
		return <p className='font-mono text-[9px] text-lines/30 italic'>No reserves</p>;
	}

	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex items-center gap-2 flex-wrap'>
				{visible.map((m) => (
					<ReserveAvatar
						key={memberOperatorId(m)}
						member={m}
						isControlOpen={controlOperatorId === memberOperatorId(m)}
						onToggleControl={onToggleControl}
						onOperatorClick={onOperatorClick}
					/>
				))}
				{overflow > 0 && (
					<span className='font-mono text-[10px] text-lines/50 border border-lines/30 rounded-full w-6 h-6 flex items-center justify-center shrink-0'>
						+{overflow}
					</span>
				)}
			</div>
			{visible.map((m) => {
				const id = memberOperatorId(m);
				if (controlOperatorId !== id) return null;
				return (
					<SlotControl
						key={id}
						currentSlot={null}
						onSelect={(slot) => onAssignSlot(id, slot)}
						onUnassign={() => onUnassign(id)}
					/>
				);
			})}
		</div>
	);
}

function ReserveAvatar({ member, isControlOpen, onToggleControl, onOperatorClick }) {
	const { kits } = useKitsStore();
	const operator = useResolveOperator(member);
	if (!operator) return null;
	const avatarSrc = getOperatorDisplayImage(operator, kits);

	return (
		<button
			type='button'
			onClick={(e) => {
				e.stopPropagation();
				if (e.shiftKey) return onOperatorClick(operator, e);
				onToggleControl(operator._id);
			}}
			title={`${operator.callSign} — reserve`}
			className={[
				"relative w-7 h-7 rounded-full border overflow-hidden shrink-0 transition-all",
				isControlOpen ? "border-btn" : "border-lines/40 opacity-70 hover:opacity-100",
			].join(" ")}>
			<img
				className='w-full h-full object-cover object-top grayscale-[60%]'
				src={avatarSrc}
				onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
				alt={operator.callSign}
			/>
		</button>
	);
}

// ─── Casualty row — same visual + interaction pattern as Reserve. Only
// reassignable once status has recovered back to Active — a still-Injured/
// KIA operator stays display-only, since "assign to slot 2" doesn't make
// sense while they're actually wounded/dead. ───────────────────────────
const CASUALTY_VISIBLE = 4;

function CasualtyRow({ team, controlOperatorId, onToggleControl, onAssignSlot, onUnassign }) {
	const casualties = casualtyMembers(team);
	const visible = casualties.slice(0, CASUALTY_VISIBLE);
	const overflow = casualties.length - visible.length;

	if (casualties.length === 0) {
		return <p className='font-mono text-[9px] text-lines/30 italic'>No casualties</p>;
	}

	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex items-center gap-2 flex-wrap'>
				{visible.map((m) => (
					<CasualtyAvatar
						key={memberOperatorId(m)}
						member={m}
						isControlOpen={controlOperatorId === memberOperatorId(m)}
						onToggleControl={onToggleControl}
					/>
				))}
				{overflow > 0 && (
					<span className='font-mono text-[10px] text-lines/50 border border-lines/30 rounded-full w-6 h-6 flex items-center justify-center shrink-0'>
						+{overflow}
					</span>
				)}
			</div>
			{visible.map((m) => {
				const id = memberOperatorId(m);
				if (controlOperatorId !== id) return null;
				return (
					<SlotControl
						key={id}
						currentSlot={null}
						onSelect={(slot) => onAssignSlot(id, slot)}
						onUnassign={() => onUnassign(id)}
					/>
				);
			})}
		</div>
	);
}

function CasualtyAvatar({ member, isControlOpen, onToggleControl }) {
	const { kits } = useKitsStore();
	const operator = useResolveOperator(member);
	if (!operator) return null;
	const avatarSrc = getOperatorDisplayImage(operator, kits);
	const reassignable = operator.status === "Active";

	return (
		<button
			type='button'
			disabled={!reassignable}
			onClick={(e) => {
				e.stopPropagation();
				onToggleControl(operator._id);
			}}
			title={
				reassignable ?
					`${operator.callSign} — recovered, tap to reassign`
				:	`${operator.callSign} — casualty`
			}
			className={[
				"relative w-7 h-7 rounded-full border overflow-hidden shrink-0 transition-all",
				!reassignable ?
					"border-red-900/30 opacity-70 cursor-default"
				: isControlOpen ?
					"border-btn opacity-100 cursor-pointer"
				:	"border-red-900/30 opacity-70 hover:opacity-100 hover:border-lines/40 cursor-pointer",
			].join(" ")}>
			<img
				className='w-full h-full object-cover object-top grayscale'
				src={avatarSrc}
				onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
				alt={operator.callSign}
			/>
		</button>
	);
}

// ─── Inline team rename/delete editor ────────────────────────
function EditTeamInline({ team, onSave, onDelete, onCancel }) {
	const [name, setName] = useState(team.name);

	return (
		<div className='flex items-center gap-1.5 p-2 border-t border-lines/60 bg-neutral-950/80'>
			<input
				autoFocus
				value={name}
				onChange={(e) => setName(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") onSave(name.trim());
					if (e.key === "Escape") onCancel();
				}}
				className='flex-1 bg-neutral-900 border border-lines/60 focus:border-btn/60 outline-none px-2 py-1 font-mono text-xs text-fontz'
			/>
			<button
				onClick={() => onSave(name.trim())}
				disabled={!name.trim()}
				className='w-6 h-6 flex items-center justify-center text-btn hover:text-btn/70 disabled:opacity-30 transition-colors'>
				<FontAwesomeIcon icon={faCheck} className='text-[10px]' />
			</button>
			<button
				onClick={onDelete}
				className='w-6 h-6 flex items-center justify-center text-red-500/60 hover:text-red-400 transition-colors'>
				<FontAwesomeIcon icon={faTrash} className='text-[10px]' />
			</button>
			<button
				onClick={onCancel}
				className='w-6 h-6 flex items-center justify-center text-lines/50 hover:text-lines transition-colors'>
				<FontAwesomeIcon icon={faXmark} className='text-[10px]' />
			</button>
		</div>
	);
}

// ─── Team card ────────────────────────────────────────────────
function TeamCard({
	team,
	collapsed,
	onToggleCollapse,
	onOperatorClick,
	onViewTeam,
	onAOChange,
	onAssignSlot,
	onUnassignOperator,
	onClearTeam,
	onAutoAssign,
	onRenameTeam,
	onDeleteTeam,
}) {
	const [missionType, setMissionType] = useState("");
	const [editing, setEditing] = useState(false);
	const [controlOperatorId, setControlOperatorId] = useState(null);

	const nActive = activeCount(team);
	const nReserve = reserveCount(team);
	const underStrength = nActive < 4;

	const handleSave = async (newName) => {
		if (newName && newName !== team.name) await onRenameTeam(team, newName);
		setEditing(false);
	};
	const handleDelete = async () => {
		await onDeleteTeam(team._id);
		setEditing(false);
	};
	const toggleControl = (operatorId) =>
		setControlOperatorId((cur) => (cur === operatorId ? null : operatorId));
	const handleAssignSlot = async (operatorId, slot) => {
		await onAssignSlot(team._id, operatorId, slot);
		setControlOperatorId(null);
	};
	const handleUnassign = async (operatorId) => {
		await onUnassignOperator(operatorId, team._id);
		setControlOperatorId(null);
	};

	return (
		<div className='flex flex-col border border-lines/60 bg-neutral-950/40 transition-all duration-150 overflow-hidden'>
			{/* ── Card header — MANAGE sits directly after the name (left side),
			    not centered. The old centering trick used two flex-1 regions
			    flanking MANAGE, which on narrow/mobile widths crushed one of
			    those regions toward zero width while its shrink-0 children
			    stayed full-size and silently overflowed on top of MANAGE.
			    Dropping the centering removes that failure mode entirely —
			    the right-side group is pushed to the end with ml-auto instead,
			    and flex-wrap still lets it drop to its own line if needed. */}
			<div className='flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2 border-b border-lines/60 bg-neutral-950/60'>
				<button
					onClick={onToggleCollapse}
					title={collapsed ? "Expand" : "Collapse"}
					className='text-lines/50 hover:text-btn transition-colors shrink-0'>
					<FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} className='text-[9px]' />
				</button>
				<span className='font-mono text-sm tracking-[0.15em] text-lines uppercase truncate max-w-[9rem] shrink'>
					{team.name}
				</span>
				<button
					onClick={() => onViewTeam(team._id)}
					title='Manage Team'
					className='font-mono text-[10px] tracking-widest uppercase text-lines hover:text-btn border border-lines/60 hover:border-btn/40 px-2.5 py-1 rounded-sm transition-all shrink-0'>
					Manage
				</button>
				<div className='flex items-center justify-end gap-2 ml-auto'>
					{team.AO && (
						<span className='font-mono text-[9px] tracking-widest uppercase text-btn/70 border border-btn/30 bg-btn/5 px-1.5 py-0.5 shrink-0'>
							{team.AO}
						</span>
					)}
					<span
						className={[
							"font-mono text-[10px] tracking-[0.2em] tabular-nums shrink-0 uppercase",
							underStrength ? "text-amber-400" : "text-lines",
						].join(" ")}>
						{nActive}/4 · {nReserve} RES
					</span>
					<button
						onClick={() => onClearTeam(team._id)}
						title='Clear team'
						className='font-mono text-[10px] tracking-widest uppercase text-red-500/40 hover:text-red-400 border border-red-900/20 hover:border-red-500/40 px-1.5 py-0.5 rounded-sm transition-all shrink-0'>
						Clear
					</button>
					<button
						onClick={() => setEditing((v) => !v)}
						title='Edit Team'
						className={["transition-colors shrink-0", editing ? "text-btn" : "text-lines hover:text-btn"].join(" ")}>
						<FontAwesomeIcon icon={faUsersGear} className='text-[10px]' />
					</button>
				</div>
			</div>

			{editing && (
				<EditTeamInline team={team} onSave={handleSave} onDelete={handleDelete} onCancel={() => setEditing(false)} />
			)}

			{!collapsed && (
				<>
					{/* ── Active slots — full size, corner number ──── */}
					<div className='px-3 py-2.5'>
						<div className='flex flex-wrap justify-center gap-0.5'>
							{[0, 1, 2, 3].map((i) => {
								const member = team.activeSlots?.[i] ?? null;
								const opId = member ? memberOperatorId(member) : null;
								return (
									<ActiveSlot
										key={i}
										team={team}
										slotNum={i + 1}
										member={member}
										isControlOpen={!!opId && controlOperatorId === opId}
										onToggleControl={toggleControl}
										onOperatorClick={onOperatorClick}
									/>
								);
							})}
						</div>
						{/* One shared control, not one per slot — a 5x44px control
						    doesn't fit inside a quarter-width grid column. */}
						{(() => {
							const openSlotNum = (team.activeSlots ?? []).findIndex(
								(m) => m && memberOperatorId(m) === controlOperatorId,
							) + 1;
							if (openSlotNum <= 0) return null;
							return (
								<div className='flex justify-center mt-2'>
									<SlotControl
										currentSlot={openSlotNum}
										onSelect={(slot) => handleAssignSlot(controlOperatorId, slot)}
										onUnassign={() => handleUnassign(controlOperatorId)}
									/>
								</div>
							);
						})()}
					</div>

					{/* ── Reserve — smaller, desaturated, no number ─── */}
					<div className='px-3 pb-2.5 flex flex-col gap-1'>
						<p className='font-mono text-[9px] tracking-[0.25em] text-lines/50 uppercase'>Reserve</p>
						<ReserveRow
							team={team}
							controlOperatorId={controlOperatorId}
							onToggleControl={toggleControl}
							onAssignSlot={handleAssignSlot}
							onUnassign={handleUnassign}
							onOperatorClick={onOperatorClick}
						/>
					</div>

					{/* ── Casualties — same pattern as Reserve ───────── */}
					<div className='px-3 pb-2.5 flex flex-col gap-1'>
						<p className='font-mono text-[9px] tracking-[0.25em] text-lines/50 uppercase'>Casualties</p>
						<CasualtyRow
							team={team}
							controlOperatorId={controlOperatorId}
							onToggleControl={toggleControl}
							onAssignSlot={handleAssignSlot}
							onUnassign={handleUnassign}
						/>
					</div>

					{/* ── AO ──────────────────────────────────────── */}
					<div className='px-3 pt-2 pb-2 flex flex-col gap-1 border-t border-lines/60'>
						<p className='font-mono text-[10px] tracking-[0.25em] text-lines uppercase'>AO</p>
						<select
							value={team.AO || ""}
							onChange={(e) => onAOChange(team, e.target.value)}
							className='w-full bg-neutral-950 border border-lines/60 rounded-sm px-2 py-1 font-mono text-[9px] text-lines outline-none focus:border-btn/50 transition-colors'>
							<option value=''>— No AO —</option>
							{Object.keys(PROVINCES).map((key) => (
								<option key={key} value={key}>{key}</option>
							))}
						</select>
					</div>

					{/* ── Auto-Fill ───────────────────────────────── */}
					<div className='px-3 pb-2 flex gap-1.5 items-center border-t border-lines/60 pt-2'>
						<FontAwesomeIcon icon={faBolt} className='text-lines/40 text-[9px] shrink-0' />
						<select
							value={missionType}
							onChange={(e) => setMissionType(e.target.value)}
							className='flex-1 bg-neutral-950 border border-lines/60 rounded-sm px-2 py-1 font-mono text-[9px] text-lines outline-none focus:border-btn/50 transition-colors'>
							<option value=''>— Auto Fill Team —</option>
							<option value='__random__'>Random Team</option>
							{MISSION_TEMPLATES.map((t) => (
								<option key={t.name} value={t.name}>{t.name}</option>
							))}
						</select>
						<button
							disabled={!missionType}
							onClick={() => {
								onAutoAssign(team._id, missionType);
								setMissionType("");
							}}
							className='font-mono text-[9px] tracking-widest uppercase text-lines hover:text-btn border border-lines/60 hover:border-btn/40 px-2 py-1 rounded-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0'>
							Fill
						</button>
					</div>
				</>
			)}
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────
const Teams = ({ dataUpdated, openSheet }) => {
	const auth = useAuth();
	const {
		teams,
		fetchTeams,
		fetchOperators,
		assignRandomInjury,
		assignRandomKIAInjury,
		assignUnknownFate,
		removeAllOperatorsFromTeams,
		clearTeam,
		autoAssignTeam,
		autoAssignRandom,
		createTeam,
		deleteTeam,
		assignSlot,
		unassignOperatorFromTeam,
	} = useTeamsStore();

	const [selectedOperator, setSelectedOperator] = useState(null);
	const [teamViewId, setTeamViewId] = useState(null);
	const [collapsedIds, setCollapsedIds] = useState(() => new Set());
	const [clearTarget, setClearTarget] = useState(null);

	const handleAOChange = async (team, ao) => {
		try {
			await TeamsApi.updateTeam(team._id, {
				createdBy: team.createdBy,
				name: team.name,
				AO: ao || null,
			});
			await fetchTeams();
			toast.success(ao ? `AO set to ${ao}` : "AO cleared");
		} catch (err) {
			toast.error("Failed to update AO");
			console.error(err);
		}
	};

	const handleAutoAssign = (teamId, missionTypeName) => {
		if (missionTypeName === "__random__") {
			autoAssignRandom(teamId);
			return;
		}
		const template = MISSION_TEMPLATES.find((t) => t.name === missionTypeName);
		if (!template) {
			toast.error(`No template found for "${missionTypeName}"`);
			return;
		}
		autoAssignTeam(teamId, template);
	};

	const handleNewTeam = async () => {
		const createdBy = auth.user?.profile?.sub;
		if (!createdBy) { toast.error("Not authenticated"); return; }
		const name = nextTeamName(teams);
		await createTeam({ createdBy, name, operators: [], assets: [] });
	};

	const handleRenameTeam = async (team, newName) => {
		try {
			await TeamsApi.updateTeam(team._id, {
				createdBy: team.createdBy,
				name: newName,
				AO: team.AO || null,
			});
			await fetchTeams();
			toast.success(`Renamed to ${newName}`);
		} catch {
			toast.error("Failed to rename team");
		}
	};

	const handleDeleteTeam = async (teamId) => {
		try {
			await deleteTeam(teamId);
			await fetchTeams();
			toast.success("Team deleted");
		} catch {
			toast.error("Failed to delete team");
		}
	};

	const userId = auth.user?.profile?.sub ?? "";

	const { isOpen, openDialog, closeDialog } = useConfirmDialog();
	const {
		isOpen: isRemoveAllOpen,
		openDialog: openRemoveAllDialog,
		closeDialog: closeRemoveAllDialog,
		confirmAction: confirmRemoveAll,
	} = useConfirmDialog();
	const {
		isOpen: isClearTeamOpen,
		openDialog: openClearTeamDialog,
		closeDialog: closeClearTeamDialog,
		confirmAction: confirmClearTeam,
	} = useConfirmDialog();

	const { fetchKits } = useKitsStore();

	useEffect(() => {
		fetchTeams();
		fetchOperators();
		fetchKits();
	}, [fetchTeams, dataUpdated, fetchOperators, fetchKits]);

	const handleOperatorClick = (operator, e) => {
		e.stopPropagation();
		if (!operator) return;
		setSelectedOperator(operator);
		openDialog();
	};

	const toggleCollapse = (teamId) =>
		setCollapsedIds((cur) => {
			const next = new Set(cur);
			if (next.has(teamId)) next.delete(teamId);
			else next.add(teamId);
			return next;
		});

	const handleClearTeamRequest = (teamId) => {
		const team = teams.find((t) => t._id === teamId);
		if (!team) return;
		setClearTarget(team);
		openClearTeamDialog(async () => {
			await clearTeam(teamId);
		});
	};

	return (
		<div className='flex flex-col h-full min-h-0'>
			<div className='flex-1 min-h-0 overflow-y-auto p-3'>
				{/* ── Compact action row ───────────────────── */}
				<div className='flex items-center gap-2 mb-3'>
					<button
						onClick={handleNewTeam}
						className='flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase text-lines hover:text-btn border border-lines/60 hover:border-btn/40 px-2 py-0.5 rounded-sm transition-all'
						title='New Team'>
						<FontAwesomeIcon icon={faPeopleGroup} className='text-[9px]' />
						New Team
					</button>
					<span className='font-mono text-[10px] tracking-[0.3em] text-lines uppercase flex-1'>
						{teams.length} team{teams.length !== 1 ? "s" : ""}
					</span>
					<button
						className='font-mono text-[10px] tracking-widest uppercase text-red-500/40 hover:text-red-400 border border-red-900/20 hover:border-red-500/40 px-2 py-0.5 rounded-sm transition-all'
						onClick={() =>
							openRemoveAllDialog(async () => {
								await removeAllOperatorsFromTeams();
							})
						}>
						Clear All
					</button>
				</div>

				{teams.length > 0 ?
					<div className='grid grid-cols-1 gap-3'>
						{teams.map((team) => (
							<TeamCard
								key={team._id}
								team={team}
								collapsed={collapsedIds.has(team._id)}
								onToggleCollapse={() => toggleCollapse(team._id)}
								onOperatorClick={handleOperatorClick}
								onViewTeam={(id) => setTeamViewId(id)}
								onAOChange={handleAOChange}
								onAssignSlot={assignSlot}
								onUnassignOperator={unassignOperatorFromTeam}
								onClearTeam={handleClearTeamRequest}
								onAutoAssign={handleAutoAssign}
								onRenameTeam={handleRenameTeam}
								onDeleteTeam={handleDeleteTeam}
							/>
						))}
					</div>
				:	<div className='flex flex-col items-center justify-center h-32 gap-2'>
						<div className='w-5 h-5 border border-lines/40 rotate-45' />
						<p className='font-mono text-[10px] tracking-widest text-lines uppercase'>
							No teams yet
						</p>
						<p className='font-mono text-[9px] text-lines'>
							Click New Team to create your first team
						</p>
					</div>
				}
			</div>

			{/* Dialogs */}
			{isOpen && selectedOperator && (
				<ConfirmDialog
					isOpen={isOpen}
					closeDialog={closeDialog}
					selectedOperator={selectedOperator}
					onRandomInjury={() => {
						assignRandomInjury(selectedOperator._id, userId);
						closeDialog();
					}}
					onKIAInjury={() => {
						assignRandomKIAInjury(selectedOperator._id, userId);
						closeDialog();
					}}
					onUnknownFate={() => {
						assignUnknownFate(selectedOperator._id, userId);
						closeDialog();
					}}
					injuryType='choice'
				/>
			)}
			<ConfirmDialog
				isOpen={isRemoveAllOpen}
				closeDialog={closeRemoveAllDialog}
				confirmAction={confirmRemoveAll}
				title='Clear All Teams'
				description='This will unassign all operators and clear all AOs from every team.'
				message="Operators won't be deleted, just unassigned. AOs will be reset."
			/>
			<ConfirmDialog
				isOpen={isClearTeamOpen}
				closeDialog={closeClearTeamDialog}
				confirmAction={confirmClearTeam}
				title='Clear Team'
				description={`Clear ${clearTarget?.name || "this team"}? This cannot be undone.`}
				message="Operators won't be deleted, just unassigned. The AO will be reset."
			/>

			<Sheet
				open={!!teamViewId}
				onOpenChange={(open) => {
					if (!open) setTeamViewId(null);
				}}>
				<SheetContent
					side='right'
					className='p-0 bg-neutral-900 border-l border-lines/40 overflow-hidden flex flex-col sm:max-w-3xl'
					aria-describedby={undefined}>
					<SheetTitle className='sr-only'>Team View</SheetTitle>
					{teamViewId && (
						<div className='flex-1 h-full overflow-y-auto'>
							<TeamView teamId={teamViewId} />
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
};

// ─── PropTypes ────────────────────────────────────────────────
EditTeamInline.propTypes = {
	team: PropTypes.object.isRequired,
	onSave: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
};
TeamCard.propTypes = {
	team: PropTypes.object.isRequired,
	collapsed: PropTypes.bool,
	onToggleCollapse: PropTypes.func.isRequired,
	onOperatorClick: PropTypes.func.isRequired,
	onViewTeam: PropTypes.func.isRequired,
	onAOChange: PropTypes.func.isRequired,
	onAssignSlot: PropTypes.func.isRequired,
	onUnassignOperator: PropTypes.func.isRequired,
	onClearTeam: PropTypes.func.isRequired,
	onAutoAssign: PropTypes.func.isRequired,
	onRenameTeam: PropTypes.func.isRequired,
	onDeleteTeam: PropTypes.func.isRequired,
};
Teams.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default Teams;
