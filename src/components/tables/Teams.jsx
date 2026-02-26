// Teams.jsx — redesigned to match UnifiedDashboard HUD aesthetic

import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPeopleGroup,
	faCaretDown,
	faCaretUp,
	faUsersGear,
	faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useTeamsStore } from "@/zustand";
import { PropTypes } from "prop-types";
import { useToggleExpand, useConfirmDialog } from "@/hooks";
import { ConfirmDialog, TeamView } from "@/components";
import { EditTeamForm, NewTeamForm } from "@/components/forms";
import { PROVINCES } from "@/config";

// ─── Section label ────────────────────────────────────────────
function SectionLabel({ children }) {
	return (
		<p className='font-mono text-[9px] tracking-[0.2em] text-lines/30 uppercase mb-2'>
			{children}
		</p>
	);
}

const Teams = ({ dataUpdated, openSheet }) => {
	const {
		teams,
		fetchTeams,
		fetchOperators,
		fetchVehiclesForTeams,
		assignRandomInjury,
		assignRandomKIAInjury,
		transferOperator,
		updateTeam,
		removeAllOperatorsFromTeams,
		addVehicleToTeam,
		removeVehicleFromTeam,
	} = useTeamsStore();

	const [expandedTeam, toggleExpand] = useToggleExpand();
	const [selectedOperator, setSelectedOperator] = useState(null);
	const [draggedOperator, setDraggedOperator] = useState(null);
	const [dragOverTeam, setDragOverTeam] = useState(null);
	const [injuryType, setInjuryType] = useState("choice");

	const userId = localStorage.getItem("userId");

	const { isOpen, openDialog, closeDialog } = useConfirmDialog();
	const {
		isOpen: isRemoveAllOpen,
		openDialog: openRemoveAllDialog,
		closeDialog: closeRemoveAllDialog,
		confirmAction: confirmRemoveAll,
	} = useConfirmDialog();

	const allVehicles = useTeamsStore((s) => s.allVehicles);
	const fullVehicleList = useTeamsStore((s) => s.fullVehicleList);

	const isMobile =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		);

	const handleOperatorClick = (operator, e) => {
		e.stopPropagation();
		if (!operator) return;
		setSelectedOperator(operator);
		setInjuryType("choice");
		openDialog();
	};

	const handleAOChange = async (teamId, newAO) => {
		const team = teams.find((t) => t._id === teamId);
		if (!team) return;
		await updateTeam({
			_id: teamId,
			createdBy: team.createdBy,
			name: team.name,
			AO: newAO,
			operators: team.operators.map((op) => op._id),
		});
		await fetchTeams();
	};

	// ── Drag handlers (desktop only) ──
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

	useEffect(() => {
		fetchTeams();
		fetchOperators();
		fetchVehiclesForTeams();
	}, [fetchTeams, dataUpdated, fetchOperators, fetchVehiclesForTeams]);

	return (
		<div className='flex flex-col'>
			{/* ── Table ── */}
			<table className='w-full text-left'>
				<thead className='sticky top-0 z-10 bg-blk/90 border-b border-lines/20'>
					<tr>
						<th className='px-4 py-3 font-mono text-[10px] tracking-widest text-lines/50 uppercase'>
							<div className='flex items-center gap-2'>
								<button
									onClick={() =>
										openSheet(
											"top",
											<NewTeamForm />,
											"New Team",
											"Create a team or let A.I generate one.",
										)
									}
									className='w-6 h-6 flex items-center justify-center bg-btn hover:bg-highlight text-blk rounded transition-colors'
									title='New Team'>
									<FontAwesomeIcon
										icon={faPeopleGroup}
										className='text-[10px]'
									/>
								</button>
								Team
							</div>
						</th>
						<th className='px-4 py-3 font-mono text-[10px] tracking-widest text-lines/50 uppercase'>
							Operators
						</th>
					</tr>
				</thead>

				<tbody>
					{teams.length > 0 ?
						teams.map((team, index) => (
							<React.Fragment key={team._id || team.name || index}>
								{/* ── Team row ── */}
								<tr
									className={[
										"border-b border-lines/10 cursor-pointer transition-all duration-150",
										dragOverTeam === team._id ?
											"bg-btn/15 border-btn/40"
										:	"hover:bg-highlight/20",
									].join(" ")}
									onClick={() => toggleExpand(index)}
									onDragOver={!isMobile ? handleDragOver : undefined}
									onDragEnter={
										!isMobile ? (e) => handleDragEnter(e, team._id) : undefined
									}
									onDragLeave={!isMobile ? handleDragLeave : undefined}
									onDrop={
										!isMobile ? (e) => handleDrop(e, team._id) : undefined
									}>
									{/* Team name */}
									<td className='px-4 py-3'>
										<div className='flex items-center gap-2'>
											<span
												className={[
													"w-1 h-1 rounded-full",
													dragOverTeam === team._id ? "bg-btn" : "bg-lines/30",
												].join(" ")}
											/>
											<span className='font-mono text-xs text-fontz'>
												{team.name}
											</span>
											{team.AO && (
												<span className='font-mono text-[9px] tracking-widest text-lines/35 uppercase border border-lines/20 px-1.5 py-0.5 rounded-sm'>
													{team.AO}
												</span>
											)}
										</div>
									</td>

									{/* Operator avatars */}
									<td className='px-4 py-3'>
										<div className='flex items-center justify-between'>
											<div className='flex -space-x-2'>
												{team.operators.slice(0, 5).map((op) => (
													<img
														key={op._id}
														className={[
															"w-8 h-8 rounded-full border-2 border-blk object-cover bg-highlight shrink-0 transition-all",
															!isMobile ?
																"cursor-grab active:cursor-grabbing hover:scale-110 hover:z-10 hover:border-btn"
															:	"cursor-pointer",
														].join(" ")}
														src={op.image}
														alt={op.callSign}
														title={op.callSign}
														draggable={!isMobile}
														onDragStart={
															!isMobile ?
																(e) => handleDragStart(e, op, team._id)
															:	undefined
														}
														onDragEnd={!isMobile ? handleDragEnd : undefined}
														onClick={(e) => {
															e.stopPropagation();
															if (isMobile) handleOperatorClick(op, e);
														}}
													/>
												))}
												{team.operators.length > 5 && (
													<div className='w-8 h-8 rounded-full bg-blk border-2 border-lines/30 flex items-center justify-center'>
														<span className='font-mono text-[9px] text-lines/50'>
															+{team.operators.length - 5}
														</span>
													</div>
												)}
											</div>
											<FontAwesomeIcon
												icon={expandedTeam === index ? faCaretUp : faCaretDown}
												className='text-lines/30 text-sm ml-3 shrink-0'
											/>
										</div>
									</td>
								</tr>

								{/* ── Expanded: operators ── */}
								{expandedTeam === index && (
									<tr>
										<td
											colSpan={2}
											className={[
												"px-4 pt-3 pb-1 bg-blk/40 border-b border-lines/10 transition-colors",
												dragOverTeam === team._id ? "bg-btn/10" : "",
											].join(" ")}
											onDragOver={!isMobile ? handleDragOver : undefined}
											onDragEnter={
												!isMobile ?
													(e) => handleDragEnter(e, team._id)
												:	undefined
											}
											onDragLeave={!isMobile ? handleDragLeave : undefined}
											onDrop={
												!isMobile ? (e) => handleDrop(e, team._id) : undefined
											}>
											{/* TeamView button */}
											<div className='mb-3'>
												<button
													className='font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border border-lines/30 text-lines/50 hover:text-btn hover:border-btn/50 rounded transition-colors'
													onClick={() =>
														openSheet("bottom", <TeamView teamId={team._id} />)
													}>
													Team View
												</button>
											</div>

											{/* Operator grid */}
											<div className='flex flex-wrap gap-3 mb-4'>
												{team.operators.map((op) => (
													<div
														key={op._id}
														className={[
															"flex flex-col items-center gap-1 group",
															!isMobile ?
																"cursor-grab active:cursor-grabbing"
															:	"cursor-pointer",
														].join(" ")}
														draggable={!isMobile}
														onDragStart={
															!isMobile ?
																(e) => handleDragStart(e, op, team._id)
															:	undefined
														}
														onDragEnd={!isMobile ? handleDragEnd : undefined}
														onClick={(e) => handleOperatorClick(op, e)}>
														<img
															className='w-14 h-14 rounded-full border-2 border-lines/30 group-hover:border-btn/60 bg-highlight object-cover transition-all'
															src={op.image}
															alt={op.callSign}
														/>
														<span className='font-mono text-[9px] tracking-wide text-lines/50 group-hover:text-fontz transition-colors text-center max-w-[56px] truncate'>
															{op.callSign}
														</span>
													</div>
												))}
											</div>
										</td>
									</tr>
								)}

								{/* ── Expanded: assets + AO ── */}
								{expandedTeam === index && (
									<tr>
										<td
											colSpan={2}
											className='px-4 py-4 bg-blk/60 border-b border-lines/10'>
											{/* Assets */}
											<SectionLabel>Assets (Vehicles)</SectionLabel>
											<div className='flex flex-wrap gap-2 mb-3'>
												{(team.assets || []).length === 0 ?
													<p className='font-mono text-[10px] text-lines/25 tracking-widest'>
														No assets assigned.
													</p>
												:	(team.assets || []).map((asset) => {
														const assetId =
															typeof asset === "object" ? asset._id : asset;
														const assetObj =
															typeof asset === "object" ? asset : (
																fullVehicleList.find((v) => v._id === assetId)
															);
														return (
															<div
																key={assetId}
																className='flex items-center gap-2 bg-blk/50 border border-lines/20 rounded px-2 py-1'>
																<span className='font-mono text-[10px] text-fontz'>
																	{(
																		assetObj?.nickName &&
																		assetObj.nickName !== "None"
																	) ?
																		assetObj.nickName
																	:	assetObj?.vehicle || "Unknown"}
																	{assetObj?.condition ?
																		` · ${assetObj.condition}`
																	:	""}
																	{typeof assetObj?.remainingFuel === "number" ?
																		` · ${assetObj.remainingFuel}%`
																	:	""}
																</span>
																<button
																	className='text-red-500/60 hover:text-red-400 transition-colors'
																	onClick={(e) => {
																		e.stopPropagation();
																		removeVehicleFromTeam(assetId, team._id);
																	}}>
																	<FontAwesomeIcon
																		icon={faXmark}
																		className='text-[10px]'
																	/>
																</button>
															</div>
														);
													})
												}
											</div>

											{/* Add asset */}
											<select
												className='w-full bg-blk/50 border border-lines/25 rounded px-3 py-2 font-mono text-[10px] text-fontz outline-none focus:border-btn/50 mb-1 transition-colors'
												onChange={(e) => {
													if (e.target.value) {
														addVehicleToTeam(e.target.value, team._id);
														e.target.value = "";
													}
												}}>
												<option value=''>— Add Asset —</option>
												{allVehicles.map((v) => (
													<option
														key={v._id}
														value={v._id}>
														{v.nickName && v.nickName !== "None" ?
															`${v.nickName} — `
														:	""}
														{v.vehicle} · {v.condition} · Fuel {v.remainingFuel}
														%{v.isRepairing ? " · Repairing" : ""}
													</option>
												))}
											</select>
											<p className='font-mono text-[9px] text-lines/25 tracking-widest mb-5'>
												Assigning removes vehicle from the available pool.
											</p>

											{/* AO */}
											<SectionLabel>Area of Operations</SectionLabel>
											{team.AO && PROVINCES[team.AO] && (
												<div className='bg-blk/30 border border-lines/15 rounded px-3 py-2 mb-2'>
													<p className='font-mono text-[10px] text-fontz'>
														Current: <span className='text-btn'>{team.AO}</span>
														{" — "}
														{PROVINCES[team.AO].biome}
													</p>
												</div>
											)}
											<select
												className='w-full bg-blk/50 border border-lines/25 rounded px-3 py-2 font-mono text-[10px] text-fontz outline-none focus:border-btn/50 mb-4 transition-colors'
												value={team.AO || ""}
												onChange={(e) =>
													handleAOChange(team._id, e.target.value)
												}>
												<option value=''>— Select AO —</option>
												{Object.entries(PROVINCES).map(([key, province]) => (
													<option
														key={key}
														value={key}>
														{key} — {province.biome}
													</option>
												))}
											</select>

											{/* Edit team */}
											<button
												className='flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-btn hover:text-white transition-colors'
												onClick={() =>
													openSheet(
														"bottom",
														<EditTeamForm teamId={team._id} />,
														"Edit or Optimize Team",
														"Modify team details, choose operators, or generate a team using A.I.",
													)
												}>
												<FontAwesomeIcon
													icon={faUsersGear}
													className='text-sm'
												/>
												Edit Team
											</button>
										</td>
									</tr>
								)}
							</React.Fragment>
						))
					:	<tr>
							<td
								colSpan={2}
								className='py-12 text-center'>
								<p className='font-mono text-[10px] tracking-widest text-lines/25 uppercase'>
									Click + to add your first team.
								</p>
							</td>
						</tr>
					}
				</tbody>
			</table>

			{/* ── Clear all ── */}
			<div className='px-4 py-3 border-t border-lines/15 flex justify-end'>
				<button
					className='font-mono text-[10px] tracking-widest uppercase text-red-500/50 hover:text-red-400 border border-red-900/30 hover:border-red-500/40 px-3 py-1.5 rounded transition-all'
					onClick={() =>
						openRemoveAllDialog(async () => {
							await removeAllOperatorsFromTeams();
						})
					}>
					Clear All Teams
				</button>
			</div>

			{/* Drag indicator */}
			{!isMobile && draggedOperator && (
				<div className='fixed top-4 left-4 z-50 bg-blk border border-btn/50 px-3 py-1.5 rounded shadow-lg'>
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
					injuryType={injuryType}
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

Teams.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default Teams;
