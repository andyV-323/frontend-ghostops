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

				{/* ── Map ── */}
				{allTeamAOs.length > 0 && (
					<div className='w-full rounded-lg overflow-hidden border border-line'>
						<AuroraMap
							selectedAOs={allTeamAOs}
							currentTeamAO={selectedTeam.AO}
						/>
					</div>
				)}

				{/* ── Combined Perks ── */}
				{combinedPerks.length > 0 && (
					<div className='bg-line rounded-lg p-3 lg:p-6 border border-line w-full min-w-0'>
						<p className='text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide lg:hidden'>
							Team Perks ({combinedPerks.length})
						</p>
						<h3 className='hidden lg:block font-semibold mb-4 text-xl text-center'>
							Team Perks ({combinedPerks.length})
						</h3>
						{/* Mobile: 4-col compact */}
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
						{/* Desktop: 6-col larger */}
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
						{/* Mobile: 4-col compact */}
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
						{/* Desktop: 6-col larger */}
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
						{/* Mobile: stacked compact rows */}
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
						{/* Desktop: card grid */}
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
					<div className='space-y-3 lg:space-y-6 w-full min-w-0'>
						{teamOperatorsWithFullData.map((operator, index) => {
							const img =
								operator.imageKey || operator.image || "/ghost/Default.png";

							return (
								<div
									key={operator._id || index}
									className='bg-line rounded-lg border border-line overflow-hidden w-full min-w-0'>
									{/* ── MOBILE layout (hidden on lg+) ── */}
									<div className='lg:hidden'>
										{/* Full image */}
										<div className='w-full'>
											<img
												src={img}
												alt={operator.callSign || "Operator"}
												className='w-full max-h-80 object-contain'
												onError={(e) => {
													e.currentTarget.src = "/ghost/Default.png";
												}}
											/>
										</div>

										{/* Details */}
										<div className='px-3 pb-3 pt-2 space-y-2.5 min-w-0'>
											{/* Name + status + button */}
											<div className='flex items-start justify-between gap-2 min-w-0'>
												<div className='min-w-0'>
													<h3 className='text-base font-bold leading-tight truncate'>
														{operator.callSign || "Unknown"}
													</h3>
													<div className='flex items-center gap-1.5 mt-0.5'>
														<div
															className={`h-2 w-2 rounded-full flex-shrink-0 ${
																operator.status === "Active" ? "bg-green-500"
																: operator.status === "Injured" ?
																	"bg-yellow-500"
																:	"bg-red-500"
															}`}
														/>
														<span className='text-xs text-gray-400'>
															{operator.status || "Unknown"}
														</span>
													</div>
												</div>
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleOpenInjuryDialog(operator);
													}}
													className='flex-shrink-0 px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-all'>
													Assign Injury
												</button>
											</div>

											<div className='text-xs text-gray-400 space-y-0.5'>
												<p>{operator.class || "No Class"}</p>
												<p>{operator.role || "No Role"}</p>
											</div>

											{operator.weaponType && (
												<div className='flex items-center gap-2 min-w-0'>
													{WEAPONS[operator.weaponType]?.imgUrl && (
														<img
															src={WEAPONS[operator.weaponType].imgUrl}
															alt='weapon'
															className='w-8 h-8 object-contain flex-shrink-0'
														/>
													)}
													<div className='min-w-0'>
														<p className='text-[10px] text-gray-500'>Primary</p>
														<p className='text-xs truncate'>
															{operator.weapon ||
																WEAPONS[operator.weaponType]?.name ||
																"Unknown"}
														</p>
													</div>
												</div>
											)}

											{operator.sideArm && (
												<div className='flex items-center gap-2 min-w-0'>
													{WEAPONS.Sidearm?.imgUrl && (
														<img
															src={WEAPONS.Sidearm.imgUrl}
															alt='Sidearm'
															className='w-8 h-8 object-contain flex-shrink-0'
														/>
													)}
													<div className='min-w-0'>
														<p className='text-[10px] text-gray-500'>Sidearm</p>
														<p className='text-xs truncate'>
															{operator.sideArm}
														</p>
													</div>
												</div>
											)}

											{Array.isArray(operator.items) &&
												operator.items.length > 0 && (
													<div className='min-w-0'>
														<p className='text-[10px] text-gray-500 mb-1'>
															Equipment
														</p>
														<div className='grid grid-cols-4 gap-1.5'>
															{operator.items.map((item) => (
																<div
																	key={item}
																	className='flex flex-col items-center gap-0.5 bg-highlight/30 rounded p-1 border border-line min-w-0'>
																	{ITEMS[item] ?
																		<img
																			src={ITEMS[item]}
																			alt={item}
																			className='w-6 h-6 flex-shrink-0'
																		/>
																	:	<div className='w-6 h-6 rounded bg-black/20 flex-shrink-0' />
																	}
																	<span className='text-[8px] text-center leading-tight w-full truncate'>
																		{item}
																	</span>
																</div>
															))}
														</div>
													</div>
												)}

											{Array.isArray(operator.perks) &&
												operator.perks.length > 0 && (
													<div className='min-w-0'>
														<p className='text-[10px] text-gray-500 mb-1'>
															Perks
														</p>
														<div className='grid grid-cols-4 gap-1.5'>
															{operator.perks.map((perk) => (
																<div
																	key={perk}
																	className='flex flex-col items-center gap-0.5 bg-highlight/30 rounded p-1 border border-line min-w-0'>
																	{PERKS[perk] ?
																		<img
																			src={PERKS[perk]}
																			alt={perk}
																			className='w-6 h-6 flex-shrink-0'
																		/>
																	:	<div className='w-6 h-6 rounded bg-black/20 flex-shrink-0' />
																	}
																	<span className='text-[8px] text-center leading-tight w-full truncate'>
																		{perk}
																	</span>
																</div>
															))}
														</div>
													</div>
												)}

											{(operator.support || operator.aviator) && (
												<div className='flex flex-wrap gap-1.5'>
													{operator.support && (
														<span className='text-[10px] font-semibold bg-highlight/30 border border-line rounded px-2 py-0.5'>
															SUPPORT SPECIALIST
														</span>
													)}
													{operator.aviator && (
														<span className='text-[10px] font-semibold bg-highlight/30 border border-line rounded px-2 py-0.5'>
															AVIATOR
														</span>
													)}
												</div>
											)}

											{operator.bio && (
												<div className='bg-blk/30 rounded p-2 border border-line min-w-0'>
													<p className='text-[10px] text-gray-500 mb-0.5'>
														Bio
													</p>
													<p className='text-xs text-gray-400 whitespace-pre-wrap break-words'>
														{operator.bio}
													</p>
												</div>
											)}
										</div>
									</div>

									{/* ── DESKTOP layout (hidden below lg) ── */}
									<div className='hidden lg:block p-6'>
										<div className='flex flex-row gap-6'>
											{/* Left: full image */}
											<div className='flex-shrink-0'>
												<img
													src={img}
													alt={operator.callSign || "Operator"}
													className='max-h-[600px] object-contain rounded-xl border-2 border-line shadow-lg'
													onError={(e) => {
														e.currentTarget.src = "/ghost/Default.png";
													}}
												/>
											</div>

											{/* Right: details */}
											<div className='flex-1 space-y-4'>
												{/* Name + button */}
												<div className='flex items-center justify-between gap-4'>
													<h3 className='text-2xl font-bold'>
														{operator.callSign || "Unknown Operator"}
													</h3>
													<button
														onClick={(e) => {
															e.stopPropagation();
															handleOpenInjuryDialog(operator);
														}}
														className='px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-all flex-shrink-0'>
														Assign Injury
													</button>
												</div>

												{/* Status + class + role */}
												<div className='space-y-1 text-gray-400'>
													<p>Class: {operator.class || "No Class"}</p>
													<p>Team Role: {operator.role || "None"}</p>
													<div className='flex items-center gap-2 mt-1'>
														<div
															className={`h-3 w-3 rounded-full ${
																operator.status === "Active" ? "bg-green-500"
																: operator.status === "Injured" ?
																	"bg-yellow-500"
																:	"bg-red-500"
															}`}
														/>
														<span className='text-sm'>
															{operator.status || "Unknown Status"}
														</span>
													</div>
												</div>

												{/* Loadout */}
												<div className='bg-blk/30 rounded-lg p-4 border border-line'>
													<h4 className='font-semibold mb-3 text-lg'>
														Loadout
													</h4>

													{operator.weaponType && (
														<div className='mb-3 flex items-center gap-3'>
															{WEAPONS[operator.weaponType]?.imgUrl && (
																<img
																	src={WEAPONS[operator.weaponType].imgUrl}
																	alt='Weapon'
																	className='w-24 h-24'
																/>
															)}
															<div>
																<p className='text-xs text-gray-500'>
																	Primary Weapon
																</p>
																<p className='font-medium'>
																	{operator.weapon ||
																		WEAPONS[operator.weaponType]?.name ||
																		"Unknown Weapon"}
																</p>
															</div>
														</div>
													)}

													{operator.sideArm && (
														<div className='mb-3 flex items-center gap-3'>
															{WEAPONS.Sidearm?.imgUrl && (
																<img
																	src={WEAPONS.Sidearm.imgUrl}
																	alt='Sidearm'
																	className='w-24 h-24'
																/>
															)}
															<div>
																<p className='text-xs text-gray-500'>Sidearm</p>
																<p className='font-medium'>
																	{operator.sideArm}
																</p>
															</div>
														</div>
													)}

													{Array.isArray(operator.items) &&
														operator.items.length > 0 && (
															<div className='mt-4'>
																<p className='text-xs text-gray-500 mb-2'>
																	Equipment
																</p>
																<div className='grid grid-cols-3 gap-2'>
																	{operator.items.map((item) => (
																		<div
																			key={item}
																			className='flex flex-col items-center gap-1 bg-highlight/30 rounded-lg p-2 border border-line'>
																			{ITEMS[item] ?
																				<img
																					src={ITEMS[item]}
																					alt={item}
																					className='w-8 h-8'
																				/>
																			:	<div className='w-8 h-8 rounded bg-black/20' />
																			}
																			<span className='text-xs text-center'>
																				{item}
																			</span>
																		</div>
																	))}
																</div>
															</div>
														)}
												</div>

												{/* Perks */}
												{Array.isArray(operator.perks) &&
													operator.perks.length > 0 && (
														<div className='mt-4'>
															<p className='text-xs text-gray-500 mb-2'>
																Perks
															</p>
															<div className='grid grid-cols-3 gap-2'>
																{operator.perks.map((perk) => (
																	<div
																		key={perk}
																		className='flex flex-col items-center gap-1 bg-highlight/30 rounded-lg p-2 border border-line'>
																		{PERKS[perk] ?
																			<img
																				src={PERKS[perk]}
																				alt={perk}
																				className='w-8 h-8'
																			/>
																		:	<div className='w-8 h-8 rounded bg-black/20' />
																		}
																		<span className='text-xs text-center'>
																			{perk}
																		</span>
																	</div>
																))}
															</div>
														</div>
													)}
												{/* Tags */}
												{(operator.support || operator.aviator) && (
													<div className='space-y-2'>
														{operator.support && (
															<div className='text-center bg-blue-900/20 border border-blue-700 rounded-lg py-2'>
																<span className='text-blue-400 font-semibold text-sm'>
																	SUPPORT SPECIALIST
																</span>
															</div>
														)}
														{operator.aviator && (
															<div className='text-center bg-sky-900/20 border border-sky-700 rounded-lg py-2'>
																<span className='text-sky-400 font-semibold text-sm'>
																	AVIATOR
																</span>
															</div>
														)}
													</div>
												)}

												{/* Bio */}
												{operator.bio && (
													<div className='bg-gray-800/40 rounded-lg p-4 border border-gray-700'>
														<h4 className='font-semibold mb-2'>Bio</h4>
														<p className='text-gray-400 whitespace-pre-wrap text-sm'>
															{operator.bio}
														</p>
													</div>
												)}
											</div>
										</div>
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
		</div>
	);
};

TeamView.propTypes = {
	openSheet: PropTypes.func,
	teamId: PropTypes.string.isRequired,
};

export default TeamView;
