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
	} = useVehicleStore();
	const [expandedVehicle, toggleExpand] = useToggleExpand();

	const [selectedVehicle, setSelectedVehicle] = useState(null);
	// Track vehicles that have had repair initiated
	const [vehiclesUnderRepair, setVehiclesUnderRepair] = useState(new Set());

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
		return vehicle.condition !== "Optimal";
	};

	// Check if vehicle can be refueled (based on condition only)
	const canRefuel = (vehicle) => {
		const conditionData = getConditionData(vehicle.condition);
		return conditionData.canRefuel;
	};

	// Check if vehicle is currently being repaired (repair button was pressed and condition is not optimal)
	const isVehicleBeingRepaired = (vehicle) => {
		return (
			vehiclesUnderRepair.has(vehicle._id) && vehicle.condition !== "Optimal"
		);
	};

	// Handle refuel with condition degradation and repair time update
	const handleRefuel = async (vehicle) => {
		if (!canRefuel(vehicle)) {
			toast.error(
				`Cannot refuel! Vehicle is in Critical condition and needs repair first.`
			);
			return;
		}

		try {
			const newCondition = getNextWorseCondition(vehicle.condition);
			const newRepairTime = getRepairTimeForCondition(newCondition);

			// Update both condition and repairTime
			await updateVehicle(vehicle._id, {
				remainingFuel: 100,
				condition: newCondition,
				repairTime: newRepairTime,
			});

			fetchVehicles();

			if (newCondition !== vehicle.condition) {
				toast.warning(
					`Vehicle refueled but condition degraded to ${newCondition}. Repair time: ${newRepairTime}h`
				);
			} else {
				toast.success("Vehicle refueled successfully!");
			}
		} catch (error) {
			console.error("Error refueling vehicle:", error);
			toast.error("Failed to refuel vehicle");
		}
	};

	// Handle vehicle repair
	const handleRepair = async (vehicle) => {
		try {
			console.log("Starting repair for vehicle:", vehicle._id);

			// Add vehicle to repair tracking set
			setVehiclesUnderRepair((prev) => new Set(prev).add(vehicle._id));

			toast.info(
				`Starting repair for ${
					vehicle.nickname || vehicle.nickName
				}. This may take a few moments...`
			);

			// Trigger the AWS EventBridge repair workflow
			await repairVehicle(vehicle._id);

			toast.success(
				`Repair initiated for ${
					vehicle.nickname || vehicle.nickName
				}. The vehicle will be updated once the repair completes.`
			);
		} catch (error) {
			console.error("Error starting repair:", error);

			// Remove from repair tracking if the repair failed to start
			setVehiclesUnderRepair((prev) => {
				const newSet = new Set(prev);
				newSet.delete(vehicle._id);
				return newSet;
			});

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

	// Clean up repair tracking when vehicles become optimal
	useEffect(() => {
		vehicles.forEach((vehicle) => {
			if (
				vehicle.condition === "Optimal" &&
				vehiclesUnderRepair.has(vehicle._id)
			) {
				setVehiclesUnderRepair((prev) => {
					const newSet = new Set(prev);
					newSet.delete(vehicle._id);
					return newSet;
				});
				toast.success(
					`${
						vehicle.nickname || vehicle.nickName
					} repair completed! Vehicle is now in optimal condition.`
				);
			}
		});
	}, [vehicles, vehiclesUnderRepair]);

	return (
		<div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
			<h1 className='flex flex-col items-center text-lg text-fontz font-bold'>
				Garage
			</h1>
			<table className='w-full text-md text-left text-fontz'>
				<thead className='text-md text-fontz uppercase bg-linear-to-r/oklch from-blk to-neutral-800'>
					<tr>
						<th
							scope='col'
							className='px-6 py-3'>
							<FontAwesomeIcon
								className='text-xl text-black rounded hover:text-white bg-btn hover:bg-highlight transition-all p-0.5'
								icon={faParking}
								onClick={() => {
									openSheet(
										"top",
										<NewVehicleForm />,
										"New Vehicle",
										"Add a new vehicle to your garage."
									);
								}}
							/>
							&nbsp; Nickname
						</th>
						<th
							scope='col'
							className='px-6 py-3'>
							Fuel
						</th>
					</tr>
				</thead>
				<tbody>
					{vehicles.length > 0 ? (
						vehicles.map((vehicle, index) => (
							<React.Fragment key={vehicle._id || vehicle.nickname || index}>
								{/* Main Vehicle Row */}
								<tr
									className='cursor-pointer bg-transparent border-b hover:bg-highlight transition-all duration-300'
									onClick={() => toggleExpand(index)}>
									<td className='px-6 py-4 font-medium text-gray-400 hover:text-white whitespace-nowrap'>
										{vehicle.nickname || vehicle.nickName || "Unnamed Vehicle"}
										{isVehicleBeingRepaired(vehicle) && (
											<span className='ml-2 text-xs bg-orange-600 text-white px-2 py-1 rounded'>
												Repair In Progress
											</span>
										)}
										<div className='text-xs text-gray-500 mt-1'>
											{vehicle.vehicle || "Unknown"}
										</div>
									</td>

									<td className='px-6 py-4'>
										<div className='flex items-center gap-2'>
											<div className='w-full bg-blk/50 rounded-full h-2.5 dark:bg-gray-700'>
												<div
													className='bg-highlight h-2.5 rounded-full transition-all duration-500'
													style={{
														width: `${getFuelPercentage(vehicle)}%`,
													}}></div>
											</div>
											<p className='text-xs text-gray-500 min-w-[40px]'>
												{getFuelDisplay(vehicle)}
											</p>
											<FontAwesomeIcon
												icon={
													expandedVehicle === index ? faCaretUp : faCaretDown
												}
												className='text-gray-400 text-lg hover:text-white transition-all'
											/>
										</div>
									</td>
								</tr>

								{/* Expanded Section - Vehicle Image */}
								{expandedVehicle === index && (
									<tr key={`expanded-${index}`}>
										<td
											colSpan='3'
											className='px-6 py-4'>
											<div className='flex flex-wrap gap-4 p-2'>
												{/* Vehicle Image */}
												<div className='flex justify-center w-full'>
													<img
														src={getVehicleImage(vehicle)}
														alt={vehicle.nickname || "Vehicle"}
														className='w-100 h-24 object-cover rounded-lg '
														onError={(e) => {
															e.target.src = "/img/default-vehicle.png";
														}}
													/>
												</div>

												{/* Vehicle Details */}
												<div className='w-full text-sm text-gray-400 mt-2'>
													<div className='grid grid-cols-2 gap-2'>
														<div>
															<span className='font-semibold'>
																Vehicle Type:
															</span>{" "}
															{getVehicleType(vehicle)}
														</div>
														<div>
															<span className='font-semibold'>Condition:</span>{" "}
															<span
																className={`
																${vehicle.condition === "Optimal" ? "text-green-400" : ""}
																${vehicle.condition === "Operational" ? "text-yellow-400" : ""}
																${vehicle.condition === "Compromised" ? "text-orange-400" : ""}
																${vehicle.condition === "Critical" ? "text-red-400" : ""}
															`}>
																{vehicle.condition || "Unknown"}
																{!canRefuel(vehicle) &&
																	vehicle.condition !== "Optimal"}
																{isVehicleBeingRepaired(vehicle)}
															</span>
														</div>
														<div>
															<span className='font-semibold'>Fuel Level:</span>{" "}
															{getFuelDisplay(vehicle)}
														</div>
														<div>
															<span className='font-semibold'>
																Repair Time:
															</span>{" "}
															{vehicle.repairTime || 0}h
														</div>
													</div>
												</div>
											</div>
										</td>
									</tr>
								)}

								{/* Expanded Section - Controls */}
								{expandedVehicle === index && (
									<tr>
										<td
											colSpan='3'
											className='text-center bg-blk/50 py-4'>
											<div className='mb-3'>
												<h4 className='text-sm font-semibold text-gray-300 mb-2'>
													Vehicle Simulator
												</h4>
												<p className='text-xs text-gray-500'>
													{isVehicleBeingRepaired(vehicle)
														? "Vehicle repair in progress - some functions are disabled"
														: "Manage your vehicle's fuel and condition"}
												</p>
											</div>
											<div className='flex justify-center gap-3 mb-3'>
												{/* Only show Calculate Trip and Refuel buttons if vehicle is NOT being repaired */}
												{!isVehicleBeingRepaired(vehicle) ? (
													<>
														<Button
															className='btn text-sm px-4 py-2'
															onClick={() => {
																openSheet(
																	"top",
																	<TripCalculatorComponent
																		vehicle={vehicle}
																		onTripComplete={handleTripComplete}
																	/>,
																	"Trip Calculator",
																	`Plan your trip with ${
																		vehicle.nickname || vehicle.nickName
																	}`
																);
															}}>
															Calculate Trip
														</Button>

														<Button
															className={`text-sm px-4 py-2 ${
																canRefuel(vehicle)
																	? "btn"
																	: "bg-gray-600 text-gray-400 cursor-not-allowed"
															}`}
															onClick={() => handleRefuel(vehicle)}
															disabled={!canRefuel(vehicle)}
															title={
																canRefuel(vehicle)
																	? "Refuel vehicle (condition will degrade)"
																	: `Cannot refuel - vehicle needs repair (${vehicle.condition})`
															}>
															{canRefuel(vehicle) ? "Refuel" : "Needs Repair"}
														</Button>
													</>
												) : (
													<div className='text-sm text-orange-400 px-4 py-2 bg-orange-900/20 rounded'>
														Not Avaiable
													</div>
												)}

												{/* Show repair button only if vehicle needs repair and not currently being repaired */}
												{canRepair(vehicle) &&
													!isVehicleBeingRepaired(vehicle) && (
														<Button
															className='btn bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2'
															onClick={() => handleRepair(vehicle)}
															title={`Repair vehicle to Optimal condition (${
																vehicle.repairTime || 2
															}h)`}>
															{vehicle.condition === "Critical"
																? "Emergency Repair"
																: "Repair Vehicle"}
														</Button>
													)}

												{/* Show repair status if vehicle is being repaired */}
												{isVehicleBeingRepaired(vehicle) && (
													<Button
														className='bg-orange-600 text-white text-sm px-4 py-2 cursor-not-allowed opacity-75'
														disabled>
														Repair In Progress...
													</Button>
												)}
											</div>
											{/* Edit Vehicle Button - always visible */}
											<FontAwesomeIcon
												className='cursor-pointer text-xl text-btn hover:text-white transition-all'
												icon={faGear}
												onClick={() =>
													openSheet(
														"bottom",
														<EditVehicleForm vehicleId={vehicle._id} />,
														"Edit Vehicle",
														"Modify vehicle details, condition, and fuel level."
													)
												}
											/>{" "}
											<FontAwesomeIcon
												icon={faTrash}
												className='text-btn text-xl cursor-pointer hover:text-white'
												onClick={(e) => handleDeleteClick(vehicle, e)}
												title={`Delete ${vehicle.nickname || vehicle.nickName}`}
											/>
										</td>
									</tr>
								)}
							</React.Fragment>
						))
					) : (
						<tr>
							<td
								colSpan='3'
								className='text-center py-8 text-gray-400'>
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
					)}
				</tbody>
			</table>

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
