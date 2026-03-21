// Teams.jsx — team cards grid, always-visible operators + assets
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPeopleGroup,
	faUsersGear,
	faXmark,
	faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { useTeamsStore } from "@/zustand";
import { PropTypes } from "prop-types";
import { useConfirmDialog } from "@/hooks";
import { ConfirmDialog, TeamView } from "@/components";
import { EditTeamForm, NewTeamForm } from "@/components/forms";

// ─── Status dot ───────────────────────────────────────────────
const STATUS_DOT = {
	active: "bg-green-500 shadow-[0_0_4px_rgba(74,222,128,0.7)]",
	injured: "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.7)]",
	wounded: "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.7)]",
	kia: "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.7)]",
};
const getDot = (s = "") =>
	STATUS_DOT[s.toLowerCase()] ?? STATUS_DOT.active;

// ─── Single operator avatar in team ──────────────────────────
function TeamOperator({ op, teamId, isMobile, onDragStart, onDragEnd, onOperatorClick }) {
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
					className='w-10 h-10 rounded-full border border-lines/30 group-hover:border-btn/60 bg-highlight object-cover object-top transition-all'
					src={op.imageKey || op.image || "/ghost/Default.png"}
					onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
					alt={op.callSign}
					title={op.callSign}
				/>
				<span
					className={[
						"absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-blk",
						getDot(op.status),
					].join(" ")}
				/>
			</div>
			<span className='font-mono text-[7px] tracking-wide text-lines/40 group-hover:text-fontz transition-colors text-center max-w-[40px] truncate leading-none'>
				{op.callSign}
			</span>
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
	openSheet,
	allVehicles,
	fullVehicleList,
	addVehicleToTeam,
	removeVehicleFromTeam,
}) {
	const [showAddAsset, setShowAddAsset] = useState(false);
	const isOver = dragOverTeam === team._id;

	return (
		<div
			className={[
				"flex flex-col rounded border transition-all duration-150 overflow-hidden",
				isOver ?
					"border-btn/50 bg-btn/8 shadow-[0_0_12px_rgba(124,170,121,0.15)]"
				:	"border-lines/20 bg-blk/50",
			].join(" ")}
			onDragOver={!isMobile ? onDragOver : undefined}
			onDragEnter={!isMobile ? (e) => onDragEnter(e, team._id) : undefined}
			onDragLeave={!isMobile ? onDragLeave : undefined}
			onDrop={!isMobile ? (e) => onDrop(e, team._id) : undefined}>

			{/* ── Card header ─────────────────────────────── */}
			<div className={[
				"flex items-center gap-2 px-3 py-2 border-b transition-colors",
				isOver ? "border-btn/30 bg-btn/10" : "border-lines/15 bg-blk/40",
			].join(" ")}>
				<span className={[
					"w-1.5 h-1.5 rounded-full shrink-0",
					isOver ? "bg-btn animate-pulse" : "bg-lines/30",
				].join(" ")} />
				<span className='font-mono text-[10px] tracking-[0.18em] text-fontz uppercase flex-1 truncate'>
					{team.name}
				</span>
				<span className='font-mono text-[8px] text-lines/30 tabular-nums shrink-0'>
					{team.operators.length} op{team.operators.length !== 1 ? "s" : ""}
				</span>
				<button
					onClick={() => openSheet("bottom", <TeamView teamId={team._id} />)}
					title='Team View'
					className='font-mono text-[8px] tracking-widest uppercase text-lines/30 hover:text-btn border border-lines/15 hover:border-btn/40 px-1.5 py-0.5 rounded-sm transition-all'>
					View
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
					className='text-lines/30 hover:text-btn transition-colors'>
					<FontAwesomeIcon icon={faUsersGear} className='text-[10px]' />
				</button>
			</div>

			{/* ── Operators ───────────────────────────────── */}
			<div className='px-3 py-3 flex-1'>
				{team.operators.length > 0 ? (
					<div className='flex flex-wrap gap-3'>
						{team.operators.map((op) => (
							<TeamOperator
								key={op._id}
								op={op}
								teamId={team._id}
								isMobile={isMobile}
								onDragStart={onDragStart}
								onDragEnd={onDragEnd}
								onOperatorClick={onOperatorClick}
							/>
						))}
					</div>
				) : (
					<p className={[
						"font-mono text-[9px] text-lines/25 italic",
						isOver ? "text-btn/60" : "",
					].join(" ")}>
						{isOver ? "Drop operator here" : "No operators assigned"}
					</p>
				)}
			</div>

			{/* ── Assets ──────────────────────────────────── */}
			<div className='px-3 pb-3 flex flex-col gap-1.5'>
				<div className='h-px bg-lines/10 mb-1' />
				{/* Assigned vehicles */}
				<div className='flex flex-wrap gap-1.5 min-h-[18px]'>
					{(team.assets || []).length === 0 ? (
						<span className='font-mono text-[8px] text-lines/20 italic'>No assets</span>
					) : (
						(team.assets || []).map((asset) => {
							const assetId = typeof asset === "object" ? asset._id : asset;
							const assetObj =
								typeof asset === "object" ? asset
								: fullVehicleList.find((v) => v._id === assetId);
							const label =
								assetObj?.nickName && assetObj.nickName !== "None" ?
									assetObj.nickName
								:	assetObj?.vehicle || "Unknown";
							return (
								<span
									key={assetId}
									className='inline-flex items-center gap-1 font-mono text-[8px] tracking-widest text-lines/50 bg-blk/60 border border-lines/15 px-1.5 py-0.5 rounded-sm'>
									{label}
									<button
										onClick={(e) => {
											e.stopPropagation();
											removeVehicleFromTeam(assetId, team._id);
										}}
										className='text-lines/30 hover:text-red-400 transition-colors ml-0.5'>
										<FontAwesomeIcon icon={faXmark} className='text-[7px]' />
									</button>
								</span>
							);
						})
					)}
					<button
						onClick={() => setShowAddAsset((v) => !v)}
						className='inline-flex items-center gap-1 font-mono text-[8px] tracking-widest text-lines/30 hover:text-btn border border-lines/15 hover:border-btn/40 px-1.5 py-0.5 rounded-sm transition-all'>
						<FontAwesomeIcon icon={faPlus} className='text-[7px]' />
						Asset
					</button>
				</div>
				{/* Add asset dropdown */}
				{showAddAsset && (
					<select
						className='w-full bg-blk/60 border border-lines/25 rounded-sm px-2 py-1 font-mono text-[9px] text-fontz outline-none focus:border-btn/50 transition-colors'
						defaultValue=''
						onChange={(e) => {
							if (e.target.value) {
								addVehicleToTeam(e.target.value, team._id);
								setShowAddAsset(false);
							}
						}}>
						<option value=''>— Select Asset —</option>
						{allVehicles.map((v) => (
							<option key={v._id} value={v._id}>
								{v.nickName && v.nickName !== "None" ? `${v.nickName} — ` : ""}
								{v.vehicle} · {v.condition} · {v.remainingFuel}%
								{v.isRepairing ? " · Repairing" : ""}
							</option>
						))}
					</select>
				)}
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
	} = useTeamsStore();

	const [selectedOperator, setSelectedOperator] = useState(null);
	const [draggedOperator, setDraggedOperator] = useState(null);
	const [dragOverTeam, setDragOverTeam] = useState(null);

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

	useEffect(() => {
		fetchTeams();
		fetchOperators();
		fetchVehiclesForTeams();
	}, [fetchTeams, dataUpdated, fetchOperators, fetchVehiclesForTeams]);

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
			{/* ── Header bar ──────────────────────────────── */}
			<div className='shrink-0 flex items-center gap-2 px-3 py-2 border-b border-lines/20 bg-blk/40'>
				<button
					onClick={() =>
						openSheet("top", <NewTeamForm />, "New Team", "Create a team or let A.I generate one.")
					}
					className='w-6 h-6 flex items-center justify-center bg-btn hover:bg-highlight text-blk rounded transition-colors'
					title='New Team'>
					<FontAwesomeIcon icon={faPeopleGroup} className='text-[9px]' />
				</button>
				<span className='font-mono text-[9px] tracking-[0.2em] text-lines/35 uppercase flex-1'>
					{teams.length} team{teams.length !== 1 ? "s" : ""}
				</span>
				<button
					className='font-mono text-[9px] tracking-widest uppercase text-red-500/40 hover:text-red-400 border border-red-900/20 hover:border-red-500/40 px-2 py-0.5 rounded-sm transition-all'
					onClick={() =>
						openRemoveAllDialog(async () => {
							await removeAllOperatorsFromTeams();
						})
					}>
					Clear All
				</button>
			</div>

			{/* ── Team card grid ───────────────────────────── */}
			<div className='flex-1 min-h-0 overflow-y-auto p-3'>
				{teams.length > 0 ? (
					<div className='grid grid-cols-1 xl:grid-cols-2 gap-3'>
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
								openSheet={openSheet}
								allVehicles={allVehicles}
								fullVehicleList={fullVehicleList}
								addVehicleToTeam={addVehicleToTeam}
								removeVehicleFromTeam={removeVehicleFromTeam}
							/>
						))}
					</div>
				) : (
					<div className='flex flex-col items-center justify-center h-32 gap-2'>
						<p className='font-mono text-[10px] tracking-widest text-lines/25 uppercase'>
							No teams yet
						</p>
						<p className='font-mono text-[9px] text-lines/15'>
							Click + to create your first team
						</p>
					</div>
				)}
			</div>

			{/* Drag indicator */}
			{!isMobile && draggedOperator && (
				<div className='fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blk border border-btn/50 px-3 py-1.5 rounded shadow-lg pointer-events-none'>
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
				title='Remove All Operators'
				description='This will remove all operators from every team.'
				message="All team assignments will be cleared. Operators won't be deleted, just unassigned."
			/>
		</div>
	);
};

// ─── PropTypes ────────────────────────────────────────────────
TeamOperator.propTypes = {
	op: PropTypes.object.isRequired,
	teamId: PropTypes.string.isRequired,
	isMobile: PropTypes.bool,
	onDragStart: PropTypes.func.isRequired,
	onDragEnd: PropTypes.func.isRequired,
	onOperatorClick: PropTypes.func.isRequired,
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
	openSheet: PropTypes.func.isRequired,
	allVehicles: PropTypes.array,
	fullVehicleList: PropTypes.array,
	addVehicleToTeam: PropTypes.func.isRequired,
	removeVehicleFromTeam: PropTypes.func.isRequired,
};
Teams.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default Teams;
