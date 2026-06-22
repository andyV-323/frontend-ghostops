// Teams.jsx — team cards grid, inline edit, + operator button
import { useEffect, useState } from "react";

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
import {
	faPeopleGroup,
	faUsersGear,
	faXmark,
	faBolt,
	faPlus,
	faCheck,
	faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useTeamsStore, useKitsStore, useOperatorsStore } from "@/zustand";
import { useAuth } from "react-oidc-context";
import { TeamsApi } from "@/api";
import { toast } from "react-toastify";
import { PROVINCES } from "@/config";
import { TEAMS as MISSION_TEMPLATES } from "@/config/teams";
import { PropTypes } from "prop-types";
import { useConfirmDialog } from "@/hooks";
import { ConfirmDialog, TeamView } from "@/components";
import { AssignTeamSheet } from "@/components/forms";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getOperatorDisplayImage } from "@/utils/operatorImage";

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

// ─── Single operator avatar in team ──────────────────────────
function TeamOperator({
	op,
	teamId,
	isMobile,
	isLead,
	slotClass,
	onDragStart,
	onDragEnd,
	onOperatorClick,
	onUnassign,
}) {
	const { kits } = useKitsStore();
	const { operators } = useOperatorsStore();
	const freshOp = operators.find((o) => o._id === op._id) || op;
	const avatarSrc = getOperatorDisplayImage(freshOp, kits);

	return (
		<div
			className={[
				"group flex flex-col items-center gap-1",
				!isMobile ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
			].join(" ")}
			draggable={!isMobile}
			onDragStart={!isMobile ? (e) => onDragStart(e, op, teamId) : undefined}
			onDragEnd={!isMobile ? onDragEnd : undefined}
			onClick={(e) => onOperatorClick(op, e)}>
			<div className='relative'>
				<img
					className={[
						"w-12 h-12 rounded-full border bg-neutral-900 object-cover object-top transition-all",
						isLead ?
							"border-btn shadow-[0_0_6px_rgba(124,170,121,0.45)]"
						:	"border-lines/60 group-hover:border-btn/50",
					].join(" ")}
					src={avatarSrc}
					onError={(e) => {
						e.currentTarget.src = "/ghost/Default.png";
					}}
					alt={op.callSign}
					title={op.callSign}
				/>
				{isLead && (
					<span className='absolute -top-2.5 left-1/2 -translate-x-1/2 font-mono text-[6px] tracking-widest uppercase text-btn whitespace-nowrap'>
						LEAD
					</span>
				)}
				<span
					className={[
						"absolute -bottom-0.5 -left-0.5 w-2 h-2 rounded-full border border-lines/60",
						getDot(op.status),
					].join(" ")}
				/>
				{/* × unassign button */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						onUnassign(op._id, teamId);
					}}
					title={`Unassign ${op.callSign}`}
					className={[
						"absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neutral-900 border border-lines/60",
						"flex items-center justify-center text-lines hover:text-red-400 hover:border-red-500/50",
						"transition-all",
						isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100",
					].join(" ")}>
					<FontAwesomeIcon
						icon={faXmark}
						className='text-[8px]'
					/>
				</button>
			</div>
			<span
				className={[
					"font-mono text-[10px] tracking-wide transition-colors text-center max-w-[52px] truncate leading-none",
					isLead ? "text-btn" : "text-lines group-hover:text-neutral-300",
				].join(" ")}>
				{op.callSign}
			</span>
			{slotClass && (
				<span className='font-mono text-[7px] tracking-widest uppercase text-lines/50 text-center max-w-[52px] truncate leading-none'>
					{slotClass}
				</span>
			)}
		</div>
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
	isMobile,
	dragOverTeam,
	onDragOver,
	onDragEnter,
	onDragLeave,
	onDrop,
	onDragStart,
	onDragEnd,
	onOperatorClick,
	onViewTeam,
	onAOChange,
	onUnassignOperator,
	onClearTeam,
	onAutoAssign,
	onAddOperator,
	onRenameTeam,
	onDeleteTeam,
}) {
	const [missionType, setMissionType] = useState("");
	const [editing, setEditing] = useState(false);
	const isOver = dragOverTeam === team._id;

	const handleSave = async (newName) => {
		if (newName && newName !== team.name) await onRenameTeam(team, newName);
		setEditing(false);
	};
	const handleDelete = async () => {
		await onDeleteTeam(team._id);
		setEditing(false);
	};

	return (
		<div
			className={[
				"flex flex-col border transition-all duration-150 overflow-hidden",
				isOver ?
					"border-btn/40 bg-btn/5 shadow-[0_0_10px_rgba(124,170,121,0.08)]"
				:	"border-lines/60 bg-neutral-950/40",
			].join(" ")}
			onDragOver={!isMobile ? onDragOver : undefined}
			onDragEnter={!isMobile ? (e) => onDragEnter(e, team._id) : undefined}
			onDragLeave={!isMobile ? onDragLeave : undefined}
			onDrop={!isMobile ? (e) => onDrop(e, team._id) : undefined}>
			{/* ── Card header ─────────────────────────────── */}
			<div
				className={[
					"flex items-center gap-2 px-3 py-2 border-b transition-colors bg-neutral-950/60",
					isOver ? "border-btn/30" : "border-lines/60",
				].join(" ")}>
				<span
					className={[
						"w-1.5 h-1.5 rounded-full shrink-0",
						isOver ? "bg-btn animate-pulse" : "bg-neutral-700/60",
					].join(" ")}
				/>
				<span className='font-mono text-sm tracking-[0.15em] text-lines uppercase flex-1 truncate'>
					{team.name}
				</span>
				{team.AO && (
					<span className='font-mono text-[9px] tracking-widest uppercase text-btn/70 border border-btn/30 bg-btn/5 px-1.5 py-0.5 shrink-0'>
						{team.AO}
					</span>
				)}
				<span className='font-mono text-[10px] tracking-[0.3em] text-lines tabular-nums shrink-0 uppercase'>
					{team.operators.length} op{team.operators.length !== 1 ? "s" : ""}
				</span>
				<button
					onClick={() => onViewTeam(team._id)}
					title='Team View'
					className='font-mono text-[10px] tracking-widest uppercase text-lines hover:text-btn border border-lines/60 hover:border-btn/40 px-1.5 py-0.5 rounded-sm transition-all'>
					View
				</button>
				<button
					onClick={() => onClearTeam(team._id)}
					title='Clear team'
					className='font-mono text-[10px] tracking-widest uppercase text-red-500/40 hover:text-red-400 border border-red-900/20 hover:border-red-500/40 px-1.5 py-0.5 rounded-sm transition-all'>
					Clear
				</button>
				<button
					onClick={() => setEditing((v) => !v)}
					title='Edit Team'
					className={[
						"transition-colors",
						editing ? "text-btn" : "text-lines hover:text-btn",
					].join(" ")}>
					<FontAwesomeIcon
						icon={faUsersGear}
						className='text-[10px]'
					/>
				</button>
			</div>

			{/* ── Inline edit row ─────────────────────────── */}
			{editing && (
				<EditTeamInline
					team={team}
					onSave={handleSave}
					onDelete={handleDelete}
					onCancel={() => setEditing(false)}
				/>
			)}

			{/* ── Operators ───────────────────────────────── */}
			<div className='px-3 py-2.5 flex-1'>
				<div className='flex items-center justify-between mb-2'>
					<p className='font-mono text-[10px] tracking-[0.25em] text-lines uppercase'>
						Operators
					</p>
					<button
						onClick={() => onAddOperator(team._id)}
						title='Add operator'
						className='flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase text-lines/60 hover:text-btn border border-lines/40 hover:border-btn/40 px-1.5 py-0.5 transition-all'>
						<FontAwesomeIcon icon={faPlus} className='text-[7px]' />
						Add
					</button>
				</div>
				{team.operators.length > 0 ?
					<div className='flex flex-wrap gap-3'>
						{(() => {
							const roles = rolesObj(team.operatorRoles);
							return team.operators.map((op) => (
								<TeamOperator
									key={op._id}
									op={op}
									teamId={team._id}
									isMobile={isMobile}
									isLead={
										!!team.leadId &&
										String(op._id) === String(team.leadId)
									}
									slotClass={roles[op._id] || ""}
									onDragStart={onDragStart}
									onDragEnd={onDragEnd}
									onOperatorClick={onOperatorClick}
									onUnassign={onUnassignOperator}
								/>
							));
						})()}
					</div>
				:	<p
						className={[
							"font-mono text-[10px] text-lines",
							isOver ? "text-btn/60" : "",
						].join(" ")}>
						{isOver ? "Drop operator here" : "No operators assigned"}
					</p>
				}
			</div>

			{/* ── AO ──────────────────────────────────────── */}
			<div className='px-3 pt-2 pb-2 flex flex-col gap-1 border-t border-lines/60'>
				<p className='font-mono text-[10px] tracking-[0.25em] text-lines uppercase'>
					AO
				</p>
				<select
					value={team.AO || ""}
					onChange={(e) => onAOChange(team, e.target.value)}
					className='w-full bg-neutral-950 border border-lines/60 rounded-sm px-2 py-1 font-mono text-[9px] text-lines outline-none focus:border-btn/50 transition-colors'>
					<option value=''>— No AO —</option>
					{Object.keys(PROVINCES).map((key) => (
						<option
							key={key}
							value={key}>
							{key}
						</option>
					))}
				</select>
			</div>

			{/* ── Auto-Fill ───────────────────────────────── */}
			<div className='px-3 pb-2 flex gap-1.5 items-center border-t border-lines/60 pt-2'>
				<FontAwesomeIcon
					icon={faBolt}
					className='text-lines/40 text-[9px] shrink-0'
				/>
				<select
					value={missionType}
					onChange={(e) => setMissionType(e.target.value)}
					className='flex-1 bg-neutral-950 border border-lines/60 rounded-sm px-2 py-1 font-mono text-[9px] text-lines outline-none focus:border-btn/50 transition-colors'>
					<option value=''>— Auto Fill Team —</option>
					<option value='__random__'>Random Team</option>
					{MISSION_TEMPLATES.map((t) => (
						<option
							key={t.name}
							value={t.name}>
							{t.name}
						</option>
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
		transferOperator,
		removeAllOperatorsFromTeams,
		unassignOperatorFromTeam,
		clearTeam,
		autoAssignTeam,
		autoAssignRandom,
		createTeam,
		deleteTeam,
	} = useTeamsStore();

	const [selectedOperator, setSelectedOperator] = useState(null);
	const [draggedOperator, setDraggedOperator] = useState(null);
	const [dragOverTeam, setDragOverTeam] = useState(null);
	const [teamViewId, setTeamViewId] = useState(null);
	const [addOpTeamId, setAddOpTeamId] = useState(null);

	// Fake operator object for AssignTeamSheet when opened from a team card
	// We pass the selected op from the OperatorClick handler instead
	const [addOpOperator, setAddOpOperator] = useState(null);

	const handleAOChange = async (team, ao) => {
		try {
			await TeamsApi.updateTeam(team._id, {
				createdBy: team.createdBy,
				name: team.name,
				AO: ao || null,
				operators: (team.operators || []).map((op) =>
					typeof op === "object" ? op._id : op,
				),
				assets: (team.assets || []).map((a) =>
					typeof a === "object" ? a._id : a,
				),
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
				operators: (team.operators || []).map((op) =>
					typeof op === "object" ? op._id : op,
				),
				assets: (team.assets || []).map((a) =>
					typeof a === "object" ? a._id : a,
				),
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

	const isMobile =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		);

	const { isOpen, openDialog, closeDialog } = useConfirmDialog();
	const {
		isOpen: isRemoveAllOpen,
		openDialog: openRemoveAllDialog,
		closeDialog: closeRemoveAllDialog,
		confirmAction: confirmRemoveAll,
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

	const handleDragStart = (e, operator, sourceTeamId) => {
		if (isMobile) return;
		e.stopPropagation();
		setDraggedOperator({ operator, sourceTeamId });
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", "");
		e.target.style.opacity = "0.4";
	};
	const handleDragEnd = (e) => {
		if (isMobile) return;
		e.target.style.opacity = "1";
		setDraggedOperator(null);
		setDragOverTeam(null);
	};
	const handleDragOver = (e) => {
		if (isMobile) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};
	const handleDragEnter = (e, teamId) => {
		if (isMobile) return;
		e.preventDefault();
		if (draggedOperator?.sourceTeamId !== teamId) setDragOverTeam(teamId);
	};
	const handleDragLeave = (e) => {
		if (isMobile) return;
		if (!e.currentTarget.contains(e.relatedTarget)) setDragOverTeam(null);
	};
	const handleDrop = async (e, targetTeamId) => {
		if (isMobile) return;
		e.preventDefault();
		e.stopPropagation();
		if (!draggedOperator || draggedOperator.sourceTeamId === targetTeamId) {
			setDragOverTeam(null);
			setDraggedOperator(null);
			return;
		}
		await transferOperator(
			draggedOperator.operator._id,
			draggedOperator.sourceTeamId,
			targetTeamId,
		).catch(console.error);
		setDragOverTeam(null);
		setDraggedOperator(null);
	};

	// Find operator for AssignTeamSheet — we need a full operator object
	// addOpTeamId drives the sheet; addOpOperator is set to null to show all teams
	const assignSheetTarget = addOpTeamId
		? teams.find((t) => t._id === addOpTeamId)
		: null;

	return (
		<div className='flex flex-col h-full min-h-0'>
			{/* ── Team card grid ───────────────────────────── */}
			<div className='flex-1 min-h-0 overflow-y-auto p-3'>
				{/* ── Compact action row ───────────────────── */}
				<div className='flex items-center gap-2 mb-3'>
					<button
						onClick={handleNewTeam}
						className='flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase text-lines hover:text-btn border border-lines/60 hover:border-btn/40 px-2 py-0.5 rounded-sm transition-all'
						title='New Team'>
						<FontAwesomeIcon
							icon={faPeopleGroup}
							className='text-[9px]'
						/>
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
								isMobile={isMobile}
								dragOverTeam={dragOverTeam}
								onDragOver={handleDragOver}
								onDragEnter={handleDragEnter}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								onDragStart={handleDragStart}
								onDragEnd={handleDragEnd}
								onOperatorClick={handleOperatorClick}
								onViewTeam={(id) => setTeamViewId(id)}
								onAOChange={handleAOChange}
								onUnassignOperator={unassignOperatorFromTeam}
								onClearTeam={clearTeam}
								onAutoAssign={handleAutoAssign}
								onAddOperator={(teamId) => setAddOpTeamId(teamId)}
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

			{/* Drag indicator */}
			{!isMobile && draggedOperator && (
				<div className='fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-950 border border-btn/50 px-3 py-1.5 shadow-lg pointer-events-none'>
					<p className='font-mono text-[10px] tracking-widest text-btn uppercase'>
						Moving: {draggedOperator.operator.callSign}
					</p>
				</div>
			)}

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

			{/* Add operator sheet */}
			<Sheet
				open={!!addOpTeamId}
				onOpenChange={(open) => {
					if (!open) { setAddOpTeamId(null); setAddOpOperator(null); }
				}}>
				<SheetContent
					side='right'
					className='p-0 bg-neutral-900 border-l border-lines/40 overflow-hidden flex flex-col sm:max-w-sm'
					aria-describedby={undefined}>
					<SheetTitle className='px-4 pt-4 pb-0 font-mono text-[10px] tracking-[0.3em] text-lines uppercase'>
						{assignSheetTarget ? `Add to ${assignSheetTarget.name}` : "Add Operator"}
					</SheetTitle>
					{/* AssignTeamSheet expects an operator; iterate from Roster view */}
					{addOpTeamId && !addOpOperator && (
						<AddOperatorPicker
							targetTeamId={addOpTeamId}
							onClose={() => { setAddOpTeamId(null); setAddOpOperator(null); }}
						/>
					)}
					{addOpTeamId && addOpOperator && (
						<AssignTeamSheet
							operator={addOpOperator}
							onComplete={() => { setAddOpTeamId(null); setAddOpOperator(null); fetchTeams(); }}
						/>
					)}
				</SheetContent>
			</Sheet>

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

// ─── Operator picker for "Add to team" ───────────────────────
// Shows all unassigned / available operators; clicking one opens AssignTeamSheet
function AddOperatorPicker({ targetTeamId, onClose }) {
	const { operators, fetchOperators } = useOperatorsStore();
	const { teams, fetchTeams, addOperatorToTeam } = useTeamsStore();
	const [selectedOp, setSelectedOp] = useState(null);
	const [selectedClass, setSelectedClass] = useState("");

	useEffect(() => {
		fetchOperators();
	}, [fetchOperators]);

	const assignedIds = new Set(
		teams.flatMap((t) => t.operators.map((op) => (typeof op === "object" ? op._id : op))),
	);

	const available = operators.filter(
		(op) => op.status !== "KIA" && !assignedIds.has(op._id),
	);
	const assigned = operators.filter(
		(op) => op.status !== "KIA" && assignedIds.has(op._id),
	);

	const handlePick = async (op, cls) => {
		await addOperatorToTeam(op._id, targetTeamId, cls);
		await fetchTeams();
		onClose();
	};

	if (selectedOp) {
		const classes = Array.isArray(selectedOp.class)
			? selectedOp.class.filter(Boolean)
			: selectedOp.class ? [selectedOp.class] : [];

		return (
			<div className='flex flex-col flex-1 overflow-hidden'>
				<div className='px-4 py-3 border-b border-lines/60 bg-neutral-950/60 flex items-center gap-3'>
					<button
						onClick={() => setSelectedOp(null)}
						className='text-lines/50 hover:text-lines transition-colors font-mono text-[10px]'>
						← Back
					</button>
					<span className='font-mono text-xs text-fontz font-bold'>{selectedOp.callSign}</span>
				</div>
				{classes.length > 1 && (
					<div className='px-4 py-3 border-b border-lines/60'>
						<p className='font-mono text-[10px] tracking-[0.25em] text-lines uppercase mb-2'>
							Assign as class
						</p>
						<div className='flex flex-wrap gap-1.5'>
							{classes.map((cls) => (
								<button
									key={cls}
									onClick={() => setSelectedClass(cls)}
									className={[
										"font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 border transition-all",
										selectedClass === cls
											? "border-btn bg-btn/10 text-btn"
											: "border-lines/60 text-lines hover:border-btn/50 hover:text-neutral-300",
									].join(" ")}>
									{cls}
								</button>
							))}
						</div>
					</div>
				)}
				<div className='flex-1 flex flex-col items-center justify-center gap-3 px-4'>
					<button
						onClick={() => handlePick(selectedOp, selectedClass || classes[0])}
						className='w-full font-mono text-[10px] tracking-widest uppercase text-btn border border-btn/40 bg-btn/5 hover:bg-btn/10 py-2.5 transition-all'>
						Confirm Add to Team
					</button>
					<button onClick={() => setSelectedOp(null)} className='font-mono text-[9px] text-lines/40 hover:text-lines'>
						Cancel
					</button>
				</div>
			</div>
		);
	}

	const OpRow = ({ op }) => {
		const classes = Array.isArray(op.class)
			? op.class.filter(Boolean).join(" / ")
			: op.class || "—";
		return (
			<button
				onClick={() => {
					const cls = Array.isArray(op.class) ? op.class.filter(Boolean) : [op.class].filter(Boolean);
					if (cls.length <= 1) {
						handlePick(op, cls[0] || "");
					} else {
						setSelectedClass(cls[0]);
						setSelectedOp(op);
					}
				}}
				className='w-full flex items-center gap-3 px-4 py-2.5 border-b border-lines/20 hover:bg-neutral-800/40 transition-colors text-left'>
				<img
					src={op.image || "/ghost/Default.png"}
					alt={op.callSign}
					className='w-8 h-8 rounded-full border border-lines/50 object-cover object-top bg-neutral-900 shrink-0'
					onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
				/>
				<div className='min-w-0'>
					<p className='font-mono text-xs text-fontz truncate'>{op.callSign}</p>
					<p className='font-mono text-[9px] text-lines/60 truncate'>{classes}</p>
				</div>
			</button>
		);
	};

	return (
		<div className='flex flex-col flex-1 overflow-y-auto'>
			{available.length > 0 && (
				<>
					<div className='px-4 py-1.5 bg-neutral-950/60 border-b border-lines/20'>
						<span className='font-mono text-[9px] tracking-widest text-lines/50 uppercase'>Available</span>
					</div>
					{available.map((op) => <OpRow key={op._id} op={op} />)}
				</>
			)}
			{assigned.length > 0 && (
				<>
					<div className='px-4 py-1.5 bg-neutral-950/60 border-b border-lines/20 border-t border-lines/20'>
						<span className='font-mono text-[9px] tracking-widest text-lines/50 uppercase'>Already Assigned</span>
					</div>
					{assigned.map((op) => <OpRow key={op._id} op={op} />)}
				</>
			)}
			{operators.filter((o) => o.status !== "KIA").length === 0 && (
				<p className='font-mono text-[9px] text-lines/40 italic px-4 py-6 text-center'>No operators available</p>
			)}
		</div>
	);
}

// ─── PropTypes ────────────────────────────────────────────────
TeamOperator.propTypes = {
	op: PropTypes.object.isRequired,
	teamId: PropTypes.string.isRequired,
	isMobile: PropTypes.bool,
	isLead: PropTypes.bool,
	slotClass: PropTypes.string,
	onDragStart: PropTypes.func.isRequired,
	onDragEnd: PropTypes.func.isRequired,
	onOperatorClick: PropTypes.func.isRequired,
	onUnassign: PropTypes.func.isRequired,
};
EditTeamInline.propTypes = {
	team: PropTypes.object.isRequired,
	onSave: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
};
TeamCard.propTypes = {
	team: PropTypes.object.isRequired,
	isMobile: PropTypes.bool,
	dragOverTeam: PropTypes.string,
	onDragOver: PropTypes.func.isRequired,
	onDragEnter: PropTypes.func.isRequired,
	onDragLeave: PropTypes.func.isRequired,
	onDrop: PropTypes.func.isRequired,
	onDragStart: PropTypes.func.isRequired,
	onDragEnd: PropTypes.func.isRequired,
	onOperatorClick: PropTypes.func.isRequired,
	onViewTeam: PropTypes.func.isRequired,
	onAOChange: PropTypes.func.isRequired,
	onUnassignOperator: PropTypes.func.isRequired,
	onClearTeam: PropTypes.func.isRequired,
	onAutoAssign: PropTypes.func.isRequired,
	onAddOperator: PropTypes.func.isRequired,
	onRenameTeam: PropTypes.func.isRequired,
	onDeleteTeam: PropTypes.func.isRequired,
};
AddOperatorPicker.propTypes = {
	targetTeamId: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired,
};
Teams.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default Teams;
