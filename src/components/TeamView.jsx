import { useTeamsStore, useOperatorsStore } from "@/zustand";
import { useEffect, useMemo, useState } from "react";
import { WEAPONS, ITEMS, PERKS, GARAGE } from "@/config";
import { PropTypes } from "prop-types";
import AuroraMap from "./AuroaMap";
import ConfirmDialog from "./ConfirmDialog";

const TeamView = ({ teamId }) => {
	const { teams, fetchTeams, assignRandomInjury, assignRandomKIAInjury } =
		useTeamsStore();
	const { operators, fetchOperators } = useOperatorsStore();
	const userId = localStorage.getItem("userId");

	const [isInjuryDialogOpen, setIsInjuryDialogOpen] = useState(false);
	const [selectedOperator, setSelectedOperator] = useState(null);
	const [injuryType, setInjuryType] = useState("choice");

	useEffect(() => {
		fetchOperators();
		fetchTeams();
	}, [fetchOperators, fetchTeams]);

	const handleOpenInjuryDialog = (operator) => {
		setSelectedOperator(operator);
		setInjuryType("choice");
		setIsInjuryDialogOpen(true);
	};

	const handleCloseInjuryDialog = () => {
		setIsInjuryDialogOpen(false);
		setSelectedOperator(null);
		setInjuryType("choice");
	};

	const handleAssignRandomInjury = async (operatorId) => {
		await assignRandomInjury(operatorId, userId);
		handleCloseInjuryDialog();
		await fetchTeams();
		await fetchOperators();
	};

	const handleAssignRandomKIAInjury = async (operatorId) => {
		await assignRandomKIAInjury(operatorId, userId);
		handleCloseInjuryDialog();
		await fetchTeams();
		await fetchOperators();
	};

	const selectedTeam = useMemo(
		() => teams.find((t) => t._id === teamId),
		[teams, teamId],
	);

	const teamOperatorsWithFullData = useMemo(() => {
		if (!selectedTeam?.operators || operators.length === 0) return [];
		return selectedTeam.operators
			.map((teamOp) => {
				const id = typeof teamOp === "object" ? teamOp._id : teamOp;
				return operators.find((op) => op._id === id) || teamOp;
			})
			.filter(Boolean);
	}, [selectedTeam, operators]);

	const combinedPerks = useMemo(() => {
		const all = teamOperatorsWithFullData.flatMap((op) => op.perks || []);
		return [...new Set(all)].filter((p) =>
			Object.prototype.hasOwnProperty.call(PERKS, p),
		);
	}, [teamOperatorsWithFullData]);

	const combinedEquipment = useMemo(() => {
		const all = teamOperatorsWithFullData.flatMap((op) => op.items || []);
		return [...new Set(all)].filter((e) =>
			Object.prototype.hasOwnProperty.call(ITEMS, e),
		);
	}, [teamOperatorsWithFullData]);

	const allTeamAOs = useMemo(
		() => [...new Set(teams.filter((t) => t.AO).map((t) => t.AO))],
		[teams],
	);

	if (!selectedTeam) {
		return (
			<div className='flex items-center justify-center h-40 text-gray-400 text-sm'>
				<p>Team not found.</p>
			</div>
		);
	}

	return (
		<div className='w-full min-w-0 text-fontz'>
			<div className='px-3 py-3 space-y-4 w-full min-w-0 overflow-hidden'>
				{/* ── Team Header ── */}
				<div className='text-center'>
					<h2 className='text-xl lg:text-3xl font-bold truncate'>
						{selectedTeam.name}
					</h2>
					{selectedTeam.AO && (
						<p className='text-xs lg:text-sm text-gray-400 mt-0.5'>
							AO: {selectedTeam.AO}
						</p>
					)}
					<p className='text-xs text-gray-500 mt-0.5'>
						{teamOperatorsWithFullData.length} Operators
						{selectedTeam.assets?.length > 0 &&
							` · ${selectedTeam.assets.length} Assets`}
					</p>
				</div>

				{/* ── Combined Perks ── */}
				{combinedPerks.length > 0 && (
					<div className='bg-line rounded-lg p-3 lg:p-6 border border-line w-full min-w-0'>
						<p className='text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide lg:hidden'>
							Team Perks ({combinedPerks.length})
						</p>
						<h3 className='hidden lg:block font-semibold mb-4 text-xl text-center'>
							Team Perks ({combinedPerks.length})
						</h3>
						<div className='grid grid-cols-4 gap-2 lg:hidden'>
							{combinedPerks.map((perk) => (
								<div
									key={perk}
									className='flex flex-col items-center gap-1 bg-highlight/30 rounded p-2 border border-line min-w-0'>
									{PERKS[perk] ?
										<img
											src={PERKS[perk]}
											alt={perk}
											className='w-8 h-8 flex-shrink-0'
										/>
									:	<div className='w-8 h-8 rounded bg-black/20 flex-shrink-0' />
									}
									<span className='text-[9px] text-center leading-tight w-full truncate'>
										{perk}
									</span>
								</div>
							))}
						</div>
						<div className='hidden lg:grid grid-cols-4 xl:grid-cols-6 gap-3'>
							{combinedPerks.map((perk) => (
								<div
									key={perk}
									className='flex flex-col items-center gap-1 bg-highlight/30 rounded-lg p-3 border border-line'>
									{PERKS[perk] ?
										<img
											src={PERKS[perk]}
											alt={perk}
											className='w-12 h-12'
										/>
									:	<div className='w-12 h-12 rounded bg-black/20' />}
									<span className='text-xs text-center font-medium'>
										{perk}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* ── Combined Equipment ── */}
				{combinedEquipment.length > 0 && (
					<div className='bg-line rounded-lg p-3 lg:p-6 border border-line w-full min-w-0'>
						<p className='text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide lg:hidden'>
							Team Equipment ({combinedEquipment.length})
						</p>
						<h3 className='hidden lg:block font-semibold mb-4 text-xl text-center'>
							Team Equipment ({combinedEquipment.length})
						</h3>
						<div className='grid grid-cols-4 gap-2 lg:hidden'>
							{combinedEquipment.map((item) => (
								<div
									key={item}
									className='flex flex-col items-center gap-1 bg-highlight/30 rounded p-2 border border-line min-w-0'>
									{ITEMS[item] ?
										<img
											src={ITEMS[item]}
											alt={item}
											className='w-8 h-8 flex-shrink-0'
										/>
									:	<div className='w-8 h-8 rounded bg-black/20 flex-shrink-0' />
									}
									<span className='text-[9px] text-center leading-tight w-full truncate'>
										{item}
									</span>
								</div>
							))}
						</div>
						<div className='hidden lg:grid grid-cols-4 xl:grid-cols-6 gap-3'>
							{combinedEquipment.map((item) => (
								<div
									key={item}
									className='flex flex-col items-center gap-1 bg-highlight/30 rounded-lg p-3 border border-line'>
									{ITEMS[item] ?
										<img
											src={ITEMS[item]}
											alt={item}
											className='w-12 h-12'
										/>
									:	<div className='w-12 h-12 rounded bg-black/20' />}
									<span className='text-xs text-center font-medium'>
										{item}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* ── Team Assets ── */}
				{selectedTeam.assets?.length > 0 && (
					<div className='bg-line rounded-lg p-3 lg:p-6 border border-line w-full min-w-0'>
						<p className='text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide lg:hidden'>
							Assets ({selectedTeam.assets.length})
						</p>
						<h3 className='hidden lg:block font-semibold mb-4 text-xl text-center'>
							Team Assets ({selectedTeam.assets.length})
						</h3>
						<div className='space-y-2 lg:hidden'>
							{selectedTeam.assets.map((asset) => {
								const a = typeof asset === "object" ? asset : null;
								const id = typeof asset === "object" ? asset._id : asset;
								const garageEntry = GARAGE.find((g) => g.name === a?.vehicle);
								const assetImg =
									garageEntry?.imgUrl || a?.imgUrl || a?.image || null;
								return (
									<div
										key={id}
										className='bg-highlight/30 rounded p-2.5 border border-line flex items-center gap-3 min-w-0'>
										{assetImg && (
											<img
												src={assetImg}
												alt={a?.vehicle || "Vehicle"}
												className='w-14 h-14 object-contain flex-shrink-0 rounded'
												onError={(e) => {
													e.currentTarget.style.display = "none";
												}}
											/>
										)}
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-semibold truncate'>
												{a?.nickName && a.nickName !== "None" ?
													a.nickName
												:	a?.vehicle || "Unknown"}
											</p>
											{a?.vehicle && a.nickName !== "None" && (
												<p className='text-xs text-gray-400 truncate'>
													{a.vehicle}
												</p>
											)}
										</div>
										<div className='flex flex-col items-end gap-0.5 flex-shrink-0 text-xs text-gray-400'>
											{a?.condition && <span>{a.condition}</span>}
											{typeof a?.remainingFuel === "number" && (
												<span>Fuel: {a.remainingFuel}%</span>
											)}
											{a?.isRepairing && <span>Repairing</span>}
										</div>
									</div>
								);
							})}
						</div>
						<div className='hidden lg:grid grid-cols-2 xl:grid-cols-3 gap-4'>
							{selectedTeam.assets.map((asset) => {
								const a = typeof asset === "object" ? asset : null;
								const id = typeof asset === "object" ? asset._id : asset;
								const garageEntry = GARAGE.find((g) => g.name === a?.vehicle);
								const assetImg =
									garageEntry?.imgUrl || a?.imgUrl || a?.image || null;
								return (
									<div
										key={id}
										className='bg-highlight/30 rounded-lg p-4 border border-line space-y-2'>
										{assetImg && (
											<img
												src={assetImg}
												alt={a?.vehicle || "Vehicle"}
												className='w-full h-32 object-contain rounded mb-2'
												onError={(e) => {
													e.currentTarget.style.display = "none";
												}}
											/>
										)}
										<h4 className='font-semibold text-lg'>
											{a?.nickName && a.nickName !== "None" ?
												a.nickName
											:	a?.vehicle || "Unknown Vehicle"}
										</h4>
										{a?.vehicle && a.nickName !== "None" && (
											<p className='text-sm text-gray-400'>Type: {a.vehicle}</p>
										)}
										{a?.condition && (
											<p className='text-sm text-gray-400'>
												Condition:{" "}
												<span className='font-medium'>{a.condition}</span>
											</p>
										)}
										{typeof a?.remainingFuel === "number" && (
											<p className='text-sm text-gray-400'>
												Fuel:{" "}
												<span className='font-medium'>{a.remainingFuel}%</span>
											</p>
										)}
										{a?.isRepairing && (
											<p className='text-sm text-gray-400'>
												Currently Repairing
											</p>
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* ── Operator Cards ── */}
				{teamOperatorsWithFullData.length > 0 ?
					<div className='grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-0 w-full min-w-0'>
						{teamOperatorsWithFullData.map((operator, index) => {
							const img =
								operator.imageKey || operator.image || "/ghost/Default.png";

							return (
								<div
									key={operator._id || index}
									className='bg-line  overflow-hidden w-full min-w-0 flex flex-col'>
									{/* Operator image */}
									<div className='w-full'>
										<img
											src={img}
											alt={operator.callSign || "Operator"}
											className='w-full aspect-[3/4] object-cover object-top'
											onError={(e) => {
												e.currentTarget.src = "/ghost/Default.png";
											}}
										/>
									</div>

									{/* Details */}
									<div className='px-3 pb-3 pt-2 space-y-2 min-w-0 flex-1 flex flex-col border border-line bg-highlight/30'>
										{/* Name */}
										<h3 className='font-bold text-sm lg:text-xl leading-tight truncate'>
											{operator.callSign || "Unknown"}
										</h3>

										{/* Class + role */}
										<div className='text-xs lg:text-sm text-gray-400 space-y-0.5'>
											<p className='text-[10px] lg:text-xs text-gray-500'>
												Class
											</p>
											<p>{operator.class || "No Class"}</p>
											<p className='text-[10px] lg:text-xs text-gray-500'>
												Role
											</p>
											<p>{operator.role || "No Role"}</p>
										</div>

										{/* Primary weapon */}
										{operator.weaponType && (
											<div className='flex items-center gap-2 min-w-0'>
												{WEAPONS[operator.weaponType]?.imgUrl && (
													<img
														src={WEAPONS[operator.weaponType].imgUrl}
														alt='weapon'
														className='w-10 h-10 lg:w-20 lg:h-20 object-contain flex-shrink-0'
													/>
												)}
												<div className='min-w-0'>
													<p className='text-[10px] lg:text-xs text-gray-500'>
														Primary
													</p>
													<p className='text-xs lg:text-sm truncate'>
														{operator.weapon ||
															WEAPONS[operator.weaponType]?.name ||
															"Unknown"}
													</p>
												</div>
											</div>
										)}

										{/* Sidearm */}
										{operator.sideArm && (
											<div className='flex items-center gap-2 min-w-0'>
												{WEAPONS.Sidearm?.imgUrl && (
													<img
														src={WEAPONS.Sidearm.imgUrl}
														alt='Sidearm'
														className='w-10 h-10 lg:w-20 lg:h-20 object-contain flex-shrink-0'
													/>
												)}
												<div className='min-w-0'>
													<p className='text-[10px] lg:text-xs text-gray-500'>
														Sidearm
													</p>
													<p className='text-xs lg:text-sm truncate'>
														{operator.sideArm}
													</p>
												</div>
											</div>
										)}

										{/* Tags */}
										{(operator.support || operator.aviator) && (
											<div className='flex flex-wrap gap-1'>
												{operator.support && (
													<span className='text-[9px] lg:text-xs font-semibold bg-highlight/30 border border-line rounded px-1.5 py-0.5'>
														SUPPORT
													</span>
												)}
												{operator.aviator && (
													<span className='text-[9px] lg:text-xs font-semibold bg-highlight/30 border border-line rounded px-1.5 py-0.5'>
														AVIATOR
													</span>
												)}
											</div>
										)}

										{/* Spacer */}
										<div className='flex-1' />

										{/* Assign Injury — pinned to bottom */}
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleOpenInjuryDialog(operator);
											}}
											className='w-full btn'>
											Assign Injury
										</button>
									</div>
								</div>
							);
						})}
					</div>
				:	<div className='text-center text-gray-400 py-8 text-sm'>
						No operators assigned to this team.
					</div>
				}

				{/* Injury Dialog */}
				{isInjuryDialogOpen && selectedOperator && (
					<ConfirmDialog
						isOpen={isInjuryDialogOpen}
						closeDialog={handleCloseInjuryDialog}
						selectedOperator={selectedOperator}
						onRandomInjury={() =>
							handleAssignRandomInjury(selectedOperator._id)
						}
						onKIAInjury={() =>
							handleAssignRandomKIAInjury(selectedOperator._id)
						}
						injuryType={injuryType}
					/>
				)}
			</div>
			{/* ── Map ── */}
			{allTeamAOs.length > 0 && (
				<div className='w-full rounded-lg overflow-hidden border border-line'>
					<AuroraMap
						selectedAOs={allTeamAOs}
						currentTeamAO={selectedTeam.AO}
						currentTeamId={selectedTeam._id} // ← add this
					/>
				</div>
			)}
		</div>
	);
};

TeamView.propTypes = {
	openSheet: PropTypes.func,
	teamId: PropTypes.string.isRequired,
};

export default TeamView;
