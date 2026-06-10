// Teams.jsx — team cards grid, always-visible operators + assets
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
} from "@fortawesome/free-solid-svg-icons";
import { useTeamsStore, useKitsStore, useOperatorsStore } from "@/zustand";
import { TeamsApi } from "@/api";
import { toast } from "react-toastify";
import { PROVINCES } from "@/config";
import { TEAMS as MISSION_TEMPLATES } from "@/config/teams";
import { PropTypes } from "prop-types";
import { useConfirmDialog } from "@/hooks";
import { ConfirmDialog, TeamView } from "@/components";
import { EditTeamForm, NewTeamForm } from "@/components/forms";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getOperatorDisplayImage } from "@/utils/operatorImage";

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

// ─── Team card ────────────────────────────────────────────────
function TeamCard({
	team,
	allTeams,
	isMobile,
	dragOverTeam,
	onDragOver,
	onDragEnter,
	onDragLeave,
	onDrop,
	onDragStart,
	onDragEnd,
	onOperatorClick,
	openSheet,
	onViewTeam,
	allVehicles,
	fullVehicleList,
	addVehicleToTeam,
	removeVehicleFromTeam,
	onAOChange,
	onAttachTeam,
	onDetachTeam,
	onUnassignOperator,
	onClearTeam,
	onClearTeamAssets,
	onDetachAllTeams,
	onAutoAssign,
}) {
	const [missionType, setMissionType] = useState("");
	const isOver = dragOverTeam === team._id;

	const attachedIds = new Set(
		(team.attachedTeams || []).map((t) => (typeof t === "object" ? t._id : t)),
	);
	const attachableTeams = allTeams.filter(
		(t) => t._id !== team._id && !attachedIds.has(t._id),
	);

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
					onClick={() =>
						openSheet(
							"bottom",
							<EditTeamForm teamId={team._id} />,
							"Edit Team",
							"Modify team details or optimize with A.I.",
						)
					}
					title='Edit Team'
					className='text-lines hover:text-btn transition-colors'>
					<FontAwesomeIcon
						icon={faUsersGear}
						className='text-[10px]'
					/>
				</button>
			</div>

			{/* ── Operators ───────────────────────────────── */}
			<div className='px-3 py-2.5 flex-1'>
				<p className='font-mono text-[10px] tracking-[0.25em] text-lines uppercase mb-2'>
					Operators
				</p>
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

			{/* ── Auto-Assign ─────────────────────────────── */}
			<div className='px-3 pb-2 flex gap-1.5 items-center border-t border-lines/60 pt-2'>
				<FontAwesomeIcon
					icon={faBolt}
					className='text-lines/40 text-[9px] shrink-0'
				/>
				<select
					value={missionType}
					onChange={(e) => setMissionType(e.target.value)}
					className='flex-1 bg-neutral-950 border border-lines/60 rounded-sm px-2 py-1 font-mono text-[9px] text-lines outline-none focus:border-btn/50 transition-colors'>
					<option value=''>— Mission Type —</option>
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

			{/* ── Assets ──────────────────────────────────── */}
			<div className='px-3 pt-2 pb-2 flex flex-col gap-1 border-t border-lines/60'>
				<p className='font-mono text-[10px] tracking-[0.25em] text-lines uppercase'>
					Assets
				</p>
				{(team.assets || []).length > 0 && (
					<div className='flex flex-wrap gap-1.5'>
						{(team.assets || []).map((asset) => {
							const assetId = asset && typeof asset === "object" ? asset._id : asset;
							const assetObj =
								asset && typeof asset === "object" ? asset : (
									fullVehicleList.find((v) => v._id === assetId)
								);
							const label =
								assetObj?.nickName && assetObj.nickName !== "None" ?
									assetObj.nickName
								:	assetObj?.vehicle || "Unknown";
							return (
								<span
									key={assetId}
									className='inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-btn/70 bg-btn/5 border border-btn/30 px-1.5 py-0.5 uppercase'>
									{label}
									<button
										onClick={(e) => {
											e.stopPropagation();
											removeVehicleFromTeam(assetId, team._id);
										}}
										className='text-lines hover:text-red-400 transition-colors ml-0.5'>
										<FontAwesomeIcon
											icon={faXmark}
											className='text-[8px]'
										/>
									</button>
								</span>
							);
						})}
					</div>
				)}
				<select
					value=''
					onChange={(e) => {
						const val = e.target.value;
						if (val === "__clear__") {
							onClearTeamAssets(team._id);
						} else if (val) {
							addVehicleToTeam(val, team._id);
						}
					}}
					className='w-full bg-neutral-950 border border-lines/60 rounded-sm px-2 py-1 font-mono text-[9px] text-lines outline-none focus:border-btn/50 transition-colors'>
					<option value=''>— Add Asset —</option>
					{(team.assets || []).length > 0 && (
						<option value='__clear__'>— Clear All Assets —</option>
					)}
					{allVehicles.map((v) => (
						<option
							key={v._id}
							value={v._id}>
							{v.nickName && v.nickName !== "None" ? `${v.nickName} — ` : ""}
							{v.vehicle} · {v.condition} · {v.remainingFuel}%
							{v.isRepairing ? " · Repairing" : ""}
						</option>
					))}
				</select>
			</div>

			{/* ── Attached Teams ──────────────────────────── */}
			<div className='px-3 pt-2 pb-3 flex flex-col gap-1 border-t border-lines/60'>
				<p className='font-mono text-[10px] tracking-[0.25em] text-lines uppercase'>
					Attached
				</p>
				{(team.attachedTeams || []).length > 0 && (
					<div className='flex flex-wrap gap-1.5'>
						{(team.attachedTeams || []).map((attached) => {
							const id = attached && typeof attached === "object" ? attached._id : attached;
							const name = attached && typeof attached === "object" ? attached.name : id;
							return (
								<span
									key={id}
									className='inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-btn/70 bg-btn/5 border border-btn/30 px-1.5 py-0.5 uppercase'>
									{name}
									<button
										onClick={(e) => {
											e.stopPropagation();
											onDetachTeam(team._id, id);
										}}
										className='text-lines hover:text-red-400 transition-colors ml-0.5'>
										<FontAwesomeIcon
											icon={faXmark}
											className='text-[8px]'
										/>
									</button>
								</span>
							);
						})}
					</div>
				)}
				<select
					value=''
					onChange={(e) => {
						const val = e.target.value;
						if (val === "__clear__") {
							onDetachAllTeams(team._id);
						} else if (val) {
							onAttachTeam(team._id, val);
						}
					}}
					className='w-full bg-neutral-950 border border-lines/60 rounded-sm px-2 py-1 font-mono text-[9px] text-lines outline-none focus:border-btn/50 transition-colors'>
					<option value=''>— Attach Team —</option>
					{(team.attachedTeams || []).length > 0 && (
						<option value='__clear__'>— Detach All —</option>
					)}
					{attachableTeams.map((t) => (
						<option
							key={t._id}
							value={t._id}>
							{t.name}
						</option>
					))}
				</select>
			</div>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────
const Teams = ({ dataUpdated, openSheet }) => {
	const {
		teams,
		fetchTeams,
		fetchOperators,
		fetchVehiclesForTeams,
		assignRandomInjury,
		assignRandomKIAInjury,
		assignUnknownFate,
		transferOperator,
		removeAllOperatorsFromTeams,
		addVehicleToTeam,
		removeVehicleFromTeam,
		attachTeamTo,
		detachTeamFrom,
		unassignOperatorFromTeam,
		clearTeam,
		clearTeamAssets,
		detachAllTeams,
		autoAssignTeam,
	} = useTeamsStore();

	const [selectedOperator, setSelectedOperator] = useState(null);
	const [draggedOperator, setDraggedOperator] = useState(null);
	const [dragOverTeam, setDragOverTeam] = useState(null);
	const [teamViewId, setTeamViewId] = useState(null);

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
		const template = MISSION_TEMPLATES.find((t) => t.name === missionTypeName);
		if (!template) {
			toast.error(`No template found for "${missionTypeName}"`);
			return;
		}
		autoAssignTeam(teamId, template);
	};

	const allVehicles = useTeamsStore((s) => s.allVehicles);
	const fullVehicleList = useTeamsStore((s) => s.fullVehicleList);
	const userId = localStorage.getItem("userId");

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
		fetchVehiclesForTeams();
		fetchKits();
	}, [
		fetchTeams,
		dataUpdated,
		fetchOperators,
		fetchVehiclesForTeams,
		fetchKits,
	]);

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

	return (
		<div className='flex flex-col h-full min-h-0'>
			{/* ── Team card grid ───────────────────────────── */}
			<div className='flex-1 min-h-0 overflow-y-auto p-3'>
				{/* ── Compact action row ───────────────────── */}
				<div className='flex items-center gap-2 mb-3'>
					<button
						onClick={() =>
							openSheet(
								"top",
								<NewTeamForm />,
								"New Team",
								"Create a team or let A.I generate one.",
							)
						}
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
								allTeams={teams}
								isMobile={isMobile}
								dragOverTeam={dragOverTeam}
								onDragOver={handleDragOver}
								onDragEnter={handleDragEnter}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								onDragStart={handleDragStart}
								onDragEnd={handleDragEnd}
								onOperatorClick={handleOperatorClick}
								openSheet={openSheet}
								onViewTeam={(id) => setTeamViewId(id)}
								allVehicles={allVehicles}
								fullVehicleList={fullVehicleList}
								addVehicleToTeam={addVehicleToTeam}
								removeVehicleFromTeam={removeVehicleFromTeam}
								onAOChange={handleAOChange}
								onAttachTeam={attachTeamTo}
								onDetachTeam={detachTeamFrom}
								onUnassignOperator={unassignOperatorFromTeam}
								onClearTeam={clearTeam}
								onClearTeamAssets={clearTeamAssets}
								onDetachAllTeams={detachAllTeams}
								onAutoAssign={handleAutoAssign}
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
TeamCard.propTypes = {
	team: PropTypes.object.isRequired,
	allTeams: PropTypes.array,
	isMobile: PropTypes.bool,
	dragOverTeam: PropTypes.string,
	onDragOver: PropTypes.func.isRequired,
	onDragEnter: PropTypes.func.isRequired,
	onDragLeave: PropTypes.func.isRequired,
	onDrop: PropTypes.func.isRequired,
	onDragStart: PropTypes.func.isRequired,
	onDragEnd: PropTypes.func.isRequired,
	onOperatorClick: PropTypes.func.isRequired,
	openSheet: PropTypes.func.isRequired,
	onViewTeam: PropTypes.func.isRequired,
	allVehicles: PropTypes.array,
	fullVehicleList: PropTypes.array,
	addVehicleToTeam: PropTypes.func.isRequired,
	removeVehicleFromTeam: PropTypes.func.isRequired,
	onAOChange: PropTypes.func.isRequired,
	onAttachTeam: PropTypes.func.isRequired,
	onDetachTeam: PropTypes.func.isRequired,
	onUnassignOperator: PropTypes.func.isRequired,
	onClearTeam: PropTypes.func.isRequired,
	onClearTeamAssets: PropTypes.func.isRequired,
	onDetachAllTeams: PropTypes.func.isRequired,
	onAutoAssign: PropTypes.func.isRequired,
};
Teams.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default Teams;
