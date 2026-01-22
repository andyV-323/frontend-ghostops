import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCaretDown,
	faCaretUp,
	faGear,
	faParking,
	faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useVehicleStore } from "@/zustand";
import { PropTypes } from "prop-types";
import { useToggleExpand, useConfirmDialog } from "@/hooks";
import { ConfirmDialog } from "@/components";
import { NewVehicleForm } from "@/components/forms";
import { Button } from "@material-tailwind/react";
import EditVehicleForm from "../forms/EditVehicleForm";
import { GARAGE } from "@/config";
import { TripCalculatorComponent } from "@/components/TripCalculator";
import { toast } from "react-toastify";

const Garage = ({ dataUpdated, openSheet }) => {
	const {
		vehicles,
		fetchVehicles,
		updateVehicle,
		deleteVehicle,
		repairVehicle,
		refuelVehicle, // Add this if it exists in your store
	} = useVehicleStore();
	const [expandedVehicle, toggleExpand] = useToggleExpand();
	const [selectedVehicle, setSelectedVehicle] = useState(null);

	const { isOpen, openDialog, closeDialog, confirmAction } = useConfirmDialog();

	// Calculate fuel percentage for display
	const getFuelPercentage = (vehicle) => {
		if (!vehicle) return 0;
		if (vehicle.remainingFuel !== undefined) {
			return Math.max(0, Math.min(100, vehicle.remainingFuel));
		}
		return 100;
	};

	// Get fuel display text
	const getFuelDisplay = (vehicle) => {
		const percentage = getFuelPercentage(vehicle);
		return `${percentage}%`;
	};

	// Get vehicle data from GARAGE config
	const getVehicleData = (vehicleName) => {
		return GARAGE.find((v) => v.name === vehicleName);
	};

	// Get vehicle image URL
	const getVehicleImage = (vehicle) => {
		const vehicleData = getVehicleData(vehicle.vehicle);
		return vehicleData?.imgUrl || "/img/default-vehicle.png";
	};

	// Get vehicle type for display
	const getVehicleType = (vehicle) => {
		const vehicleData = getVehicleData(vehicle.vehicle);
		return vehicleData?.type || "Unknown";
	};

	// Vehicle condition management
	const CONDITION_LEVELS = [
		{ name: "Optimal", level: 4, canRefuel: true, repairTime: 0 },
		{ name: "Operational", level: 3, canRefuel: true, repairTime: 0.5 },
		{ name: "Compromised", level: 2, canRefuel: true, repairTime: 1 },
		{ name: "Critical", level: 1, canRefuel: false, repairTime: 2 },
	];

	// Get condition data
	const getConditionData = (conditionName) => {
		return (
			CONDITION_LEVELS.find((c) => c.name === conditionName) ||
			CONDITION_LEVELS[3]
		);
	};

	// Get next worse condition
	const getNextWorseCondition = (currentCondition) => {
		const current = getConditionData(currentCondition);
		const nextLevel = current.level - 1;
		const nextCondition = CONDITION_LEVELS.find((c) => c.level === nextLevel);
		return nextCondition ? nextCondition.name : currentCondition;
	};

	// Get repair time for condition
	const getRepairTimeForCondition = (conditionName) => {
		const conditionData = getConditionData(conditionName);
		return conditionData.repairTime;
	};

	const canRepair = (vehicle) => {
		return vehicle.condition !== "Optimal" && !vehicle.isRepairing;
	};

	// Check if vehicle can be refueled (based on condition and repair status)
	const canRefuel = (vehicle) => {
		const conditionData = getConditionData(vehicle.condition);
		return conditionData.canRefuel && !vehicle.isRepairing;
	};

	// Check if vehicle is available for use (not repairing)
	const isVehicleAvailable = (vehicle) => {
		return !vehicle.isRepairing;
	};

	// Handle refuel with new backend endpoint
	const handleRefuel = async (vehicle) => {
		if (!canRefuel(vehicle)) {
			if (vehicle.isRepairing) {
				toast.error("Cannot refuel vehicle while it's being repaired!");
				return;
			}
			toast.error(
				`Cannot refuel! Vehicle is in Critical condition and needs repair first.`,
			);
			return;
		}

		try {
			// Use the new refuel endpoint if available in your store
			if (refuelVehicle) {
				await refuelVehicle(vehicle._id, 25); // Refuel with 25 fuel
			} else {
				// Fallback to old method with condition degradation
				const newCondition = getNextWorseCondition(vehicle.condition);
				const newRepairTime = getRepairTimeForCondition(newCondition);

				await updateVehicle(vehicle._id, {
					remainingFuel: 100,
					condition: newCondition,
					repairTime: newRepairTime,
				});

				if (newCondition !== vehicle.condition) {
					toast.warning(
						`Vehicle refueled but condition degraded to ${newCondition}. Repair time: ${newRepairTime}h`,
					);
				} else {
					toast.success("Vehicle refueled successfully!");
				}
			}

			fetchVehicles();
		} catch (error) {
			console.error("Error refueling vehicle:", error);
			toast.error("Failed to refuel vehicle");
		}
	};

	// Handle vehicle repair
	const handleRepair = async (vehicle) => {
		if (vehicle.isRepairing) {
			toast.warning("Vehicle is already being repaired!");
			return;
		}

		try {
			console.log("Starting repair for vehicle:", vehicle._id);

			toast.info(
				`Starting repair for ${
					vehicle.nickname || vehicle.nickName
				}. This may take a few moments...`,
			);

			// Trigger the AWS EventBridge repair workflow
			await repairVehicle(vehicle._id);

			// Refresh vehicles to get updated isRepairing status
			fetchVehicles();

			toast.success(
				`Repair initiated for ${
					vehicle.nickname || vehicle.nickName
				}. The vehicle will be updated once the repair completes.`,
			);
		} catch (error) {
			console.error("Error starting repair:", error);
			toast.error("Failed to start repair process");
		}
	};

	// Handle trip completion
	const handleTripComplete = async (tripData) => {
		try {
			await updateVehicle(tripData.vehicleId, {
				remainingFuel: tripData.newEnergyLevel,
			});
			fetchVehicles();
		} catch (error) {
			console.error("Error updating vehicle fuel:", error);
		}
	};

	// Handle delete vehicle
	const handleDeleteClick = (vehicle, event) => {
		event.stopPropagation(); // Prevent row expansion
		setSelectedVehicle(vehicle);
		openDialog(async () => {
			try {
				await deleteVehicle(vehicle._id);
				fetchVehicles();
				setSelectedVehicle(null);
			} catch (error) {
				console.error("Error deleting vehicle:", error);
			}
		});
	};

	useEffect(() => {
		fetchVehicles();
	}, [fetchVehicles, dataUpdated]);

	// Show success message when repair completes
	useEffect(() => {
		vehicles.forEach((vehicle) => {
			if (vehicle.condition === "Optimal" && !vehicle.isRepairing) {
				// You might want to track which vehicles just completed repair
				// to avoid showing this message repeatedly
			}
		});
	}, [vehicles]);

	return (
		// PANEL SHELL: fills dashboard cell, clips overflow, header fixed, body scrolls
		<div className='h-full min-h-0 rounded-3xl shadow-lg shadow-black flex flex-col overflow-hidden bg-transparent'>
			{/* HEADER (non-scrolling) */}
			<div className='shrink-0 px-4 py-3 bg-linear-to-r/oklch from-blk to-neutral-800'>
				<div className='flex items-center justify-between'>
					<h1 className='text-lg text-fontz font-bold'>Assets</h1>

					<FontAwesomeIcon
						className='text-xl text-black rounded hover:text-white bg-btn hover:bg-highlight transition-all p-0.5 cursor-pointer'
						icon={faParking}
						onClick={() => {
							openSheet(
								"top",
								<NewVehicleForm />,
								"New Vehicle",
								"Add a new vehicle to your garage.",
							);
						}}
						title='Add Vehicle'
					/>
				</div>
			</div>

			{/* SCROLL AREA (only this scrolls) */}
			<div className='flex-1 min-h-0 overflow-auto'>
				{/* Optional: keeps table from feeling stretched on very wide screens */}
				<div className='max-w-5xl mx-auto px-2 sm:px-4 py-2'>
					<table className='w-full table-fixed text-md text-left text-fontz'>
						<thead className='sticky top-0 z-10 text-md text-fontz uppercase bg-linear-to-r/oklch from-blk to-neutral-800'>
							<tr>
								<th
									scope='col'
									className='w-[65%] px-4 sm:px-6 py-3'>
									Nickname
								</th>
								<th
									scope='col'
									className='w-[35%] px-4 sm:px-6 py-3'>
									Fuel
								</th>
							</tr>
						</thead>

						<tbody>
							{vehicles.length > 0 ?
								vehicles.map((vehicle, index) => (
									<React.Fragment
										key={
											vehicle._id ||
											vehicle.nickname ||
											vehicle.nickName ||
											index
										}>
										{/* Main Vehicle Row */}
										<tr
											className='cursor-pointer bg-transparent border-b border-white/10 hover:bg-highlight/20 transition-all duration-300'
											onClick={() => toggleExpand(index)}>
											<td className='px-4 sm:px-6 py-4 font-medium text-gray-400 hover:text-white whitespace-nowrap overflow-hidden text-ellipsis'>
												<div className='flex items-center gap-2'>
													<span className='truncate'>
														{vehicle.nickname ||
															vehicle.nickName ||
															"Unnamed Vehicle"}
													</span>

													{vehicle.isRepairing && (
														<span className='text-xs bg-btn text-white px-2 py-1 rounded animate-pulse shrink-0'>
															Repairing
														</span>
													)}
												</div>

												<div className='text-xs text-gray-500 mt-1 truncate'>
													{vehicle.vehicle || "Unknown"}
												</div>
											</td>

											<td className='px-4 sm:px-6 py-4'>
												<div className='flex items-center gap-2'>
													<div className='flex-1 bg-blk/50 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden'>
														<div
															className={`h-2.5 rounded-full transition-all duration-500 ${
																vehicle.isRepairing ?
																	"bg-btn animate-pulse"
																:	"bg-highlight"
															}`}
															style={{
																width: `${getFuelPercentage(vehicle)}%`,
															}}
														/>
													</div>

													<p className='text-xs text-gray-500 w-[52px] text-right shrink-0'>
														{getFuelDisplay(vehicle)}
													</p>

													<FontAwesomeIcon
														icon={
															expandedVehicle === index ? faCaretUp : (
																faCaretDown
															)
														}
														className='text-gray-400 text-lg hover:text-white transition-all shrink-0'
													/>
												</div>
											</td>
										</tr>

										{/* Expanded Section - Details */}
										{expandedVehicle === index && (
											<tr key={`expanded-${index}`}>
												<td
													colSpan='2'
													className='px-4 sm:px-6 py-4 bg-blk/20 border-b border-white/10'>
													<div className='grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 items-start'>
														{/* Vehicle Image */}
														<div className='flex justify-center md:justify-start'>
															<img
																src={getVehicleImage(vehicle)}
																alt={
																	vehicle.nickname ||
																	vehicle.nickName ||
																	"Vehicle"
																}
																className={`w-full max-w-[420px] md:max-w-[320px] h-32 md:h-40 object-cover rounded-xl transition-all ${
																	vehicle.isRepairing ?
																		"opacity-75 grayscale"
																	:	""
																}`}
																onError={(e) => {
																	e.target.src = "/img/default-vehicle.png";
																}}
															/>
														</div>

														{/* Vehicle Details */}
														<div className='text-sm text-gray-300'>
															<div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
																<div className='bg-blk/40 rounded-lg p-3'>
																	<span className='font-semibold text-gray-200'>
																		Vehicle Type:
																	</span>{" "}
																	<span className='text-gray-400'>
																		{getVehicleType(vehicle)}
																	</span>
																</div>

																<div className='bg-blk/40 rounded-lg p-3'>
																	<span className='font-semibold text-gray-200'>
																		Condition:
																	</span>{" "}
																	<span
																		className={`
																			${vehicle.condition === "Optimal" ? "text-green-400" : ""}
																			${vehicle.condition === "Operational" ? "text-yellow-400" : ""}
																			${vehicle.condition === "Compromised" ? "text-orange-400" : ""}
																			${vehicle.condition === "Critical" ? "text-red-400" : ""}
																			${vehicle.isRepairing ? "animate-pulse" : ""}
																		`}>
																		{vehicle.condition}
																		{vehicle.isRepairing && " (Repairing)"}
																	</span>
																</div>

																<div className='bg-blk/40 rounded-lg p-3'>
																	<span className='font-semibold text-gray-200'>
																		Fuel Level:
																	</span>{" "}
																	<span className='text-gray-400'>
																		{getFuelDisplay(vehicle)}
																	</span>
																</div>

																<div className='bg-blk/40 rounded-lg p-3'>
																	<span className='font-semibold text-gray-200'>
																		Repair Time:
																	</span>{" "}
																	<span className='text-gray-400'>
																		{vehicle.repairTime || 0}h
																	</span>
																</div>
															</div>

															{/* Controls */}
															<div className='mt-4 rounded-xl bg-blk/40 p-4'>
																<div className='mb-3'>
																	<h4 className='text-sm font-semibold text-gray-200'>
																		Vehicle Simulator
																	</h4>
																	<p className='text-xs text-gray-500 mt-1'>
																		{vehicle.isRepairing ?
																			"Vehicle repair in progress — functions are disabled."
																		:	"Manage fuel, trips, and repairs."}
																	</p>
																</div>

																<div className='flex flex-wrap justify-start gap-3'>
																	{/* Calculate Trip + Refuel only if available */}
																	{isVehicleAvailable(vehicle) ?
																		<>
																			<Button
																				className='btn text-sm px-4 py-2'
																				onClick={() => {
																					openSheet(
																						"top",
																						<TripCalculatorComponent
																							vehicle={vehicle}
																							onTripComplete={
																								handleTripComplete
																							}
																						/>,
																						"Trip Calculator",
																						`Plan your trip with ${
																							vehicle.nickname ||
																							vehicle.nickName
																						}`,
																					);
																				}}>
																				Calculate Trip
																			</Button>

																			<Button
																				className={`text-sm px-4 py-2 ${
																					canRefuel(vehicle) ? "btn" : (
																						"bg-gray-600 text-gray-400 cursor-not-allowed"
																					)
																				}`}
																				onClick={() => handleRefuel(vehicle)}
																				disabled={!canRefuel(vehicle)}
																				title={
																					canRefuel(vehicle) ? "Refuel vehicle"
																					:	`Cannot refuel — vehicle needs repair (${vehicle.condition})`
																				}>
																				{canRefuel(vehicle) ?
																					"Refuel"
																				:	"Needs Repair"}
																			</Button>
																		</>
																	:	<div className='text-sm px-4 py-2 bg-blk rounded flex items-center'>
																			Not Available
																		</div>
																	}

																	{/* Repair button if needed */}
																	{canRepair(vehicle) && (
																		<Button
																			className='text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white'
																			onClick={() => handleRepair(vehicle)}
																			disabled={vehicle.isRepairing}
																			title={
																				vehicle.isRepairing ?
																					"Repair already in progress"
																				:	`Repair vehicle to Optimal (${
																						vehicle.repairTime || 2
																					}h)`
																			}>
																			{vehicle.condition === "Critical" ?
																				"Emergency Repair"
																			:	"Repair Vehicle"}
																		</Button>
																	)}

																	{/* Repair status */}
																	{vehicle.isRepairing && (
																		<Button
																			className='bg-blk text-white text-sm px-4 py-2 cursor-not-allowed flex items-center'
																			disabled>
																			Repair In Progress
																		</Button>
																	)}
																</div>

																{/* Actions */}
																<div className='mt-4 flex items-center gap-4'>
																	<FontAwesomeIcon
																		className={`text-xl transition-all ${
																			vehicle.isRepairing ?
																				"text-gray-600 cursor-not-allowed"
																			:	"text-btn hover:text-white cursor-pointer"
																		}`}
																		icon={faGear}
																		onClick={() => {
																			if (!vehicle.isRepairing) {
																				openSheet(
																					"bottom",
																					<EditVehicleForm
																						vehicleId={vehicle._id}
																					/>,
																					"Edit Vehicle",
																					"Modify vehicle details, condition, and fuel level.",
																				);
																			} else {
																				toast.warning(
																					"Cannot edit vehicle while it's being repaired",
																				);
																			}
																		}}
																		title={
																			vehicle.isRepairing ?
																				"Cannot edit while repairing"
																			:	"Edit vehicle"
																		}
																	/>

																	<FontAwesomeIcon
																		icon={faTrash}
																		className={`text-xl transition-all ${
																			vehicle.isRepairing ?
																				"text-gray-600 cursor-not-allowed"
																			:	"text-btn hover:text-white cursor-pointer"
																		}`}
																		onClick={(e) => {
																			if (!vehicle.isRepairing) {
																				handleDeleteClick(vehicle, e);
																			} else {
																				e.stopPropagation();
																				toast.warning(
																					"Cannot delete vehicle while it's being repaired",
																				);
																			}
																		}}
																		title={
																			vehicle.isRepairing ?
																				"Cannot delete while repairing"
																			:	`Delete ${
																					vehicle.nickname || vehicle.nickName
																				}`
																		}
																	/>
																</div>
															</div>
														</div>
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								))
							:	<tr>
									<td
										colSpan='2'
										className='text-center py-10 text-gray-400'>
										<div className='flex flex-col items-center'>
											<FontAwesomeIcon
												icon={faParking}
												className='text-4xl mb-2 text-gray-600'
											/>
											<p className='text-lg mb-1'>No vehicles in garage</p>
											<p className='text-sm'>
												Click the parking icon to add your first vehicle
											</p>
										</div>
									</td>
								</tr>
							}
						</tbody>
					</table>
				</div>
			</div>

			{/* Confirm Dialog for Delete */}
			{isOpen && selectedVehicle && (
				<ConfirmDialog
					isOpen={isOpen}
					closeDialog={closeDialog}
					confirmAction={confirmAction}
					title='Delete Vehicle'
					description='Are you sure you want to delete this vehicle?'
					message={`This will permanently remove "${
						selectedVehicle.nickname || selectedVehicle.nickName
					}" from your garage. This action cannot be undone.`}
				/>
			)}
		</div>
	);
};

Garage.propTypes = {
	dataUpdated: PropTypes.bool,
	openSheet: PropTypes.func,
};

export default Garage;
