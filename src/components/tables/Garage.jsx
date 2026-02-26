// Garage.jsx — redesigned to match UnifiedDashboard HUD aesthetic

import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCaretDown,
	faCaretUp,
	faGear,
	faParking,
	faTrash,
	faWrench,
	faGasPump,
	faRoute,
} from "@fortawesome/free-solid-svg-icons";
import { useVehicleStore } from "@/zustand";
import { PropTypes } from "prop-types";
import { useToggleExpand, useConfirmDialog } from "@/hooks";
import { ConfirmDialog } from "@/components";
import { NewVehicleForm } from "@/components/forms";
import EditVehicleForm from "../forms/EditVehicleForm";
import { GARAGE } from "@/config";
import { TripCalculatorComponent } from "@/components/TripCalculator";
import { toast } from "react-toastify";

// ─── Condition config ─────────────────────────────────────────
const CONDITION_MAP = {
	Optimal: {
		color: "text-green-400",
		bar: "bg-green-500",
		border: "border-green-900/40",
		glow: "shadow-[0_0_5px_rgba(74,222,128,0.4)]",
	},
	Operational: {
		color: "text-btn",
		bar: "bg-btn",
		border: "border-btn/30",
		glow: "shadow-[0_0_5px_rgba(124,170,121,0.4)]",
	},
	Compromised: {
		color: "text-amber-400",
		bar: "bg-amber-400",
		border: "border-amber-900/40",
		glow: "shadow-[0_0_5px_rgba(251,191,36,0.4)]",
	},
	Critical: {
		color: "text-red-400",
		bar: "bg-red-500",
		border: "border-red-900/40",
		glow: "shadow-[0_0_5px_rgba(239,68,68,0.4)]",
	},
};

const CONDITION_LEVELS = [
	{ name: "Optimal", level: 4, canRefuel: true, repairTime: 0 },
	{ name: "Operational", level: 3, canRefuel: true, repairTime: 0.5 },
	{ name: "Compromised", level: 2, canRefuel: true, repairTime: 1 },
	{ name: "Critical", level: 1, canRefuel: false, repairTime: 2 },
];

const getConditionData = (name) =>
	CONDITION_LEVELS.find((c) => c.name === name) || CONDITION_LEVELS[3];
const getConditionStyle = (name) =>
	CONDITION_MAP[name] || CONDITION_MAP.Critical;

const getNextWorseCondition = (current) => {
	const level = getConditionData(current).level - 1;
	return CONDITION_LEVELS.find((c) => c.level === level)?.name || current;
};

// ─── Action button ────────────────────────────────────────────
function ActionBtn({
	onClick,
	disabled,
	icon,
	label,
	variant = "default",
	title,
}) {
	const base =
		"inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded border transition-all duration-150";
	const variants = {
		default:
			"text-btn border-btn/30 bg-btn/10 hover:bg-btn/20 hover:border-btn/60",
		destructive:
			"text-red-400 border-red-900/40 bg-red-900/10 hover:bg-red-900/20 hover:border-red-500/40",
		blue: "text-blue-400 border-blue-900/40 bg-blue-900/10 hover:bg-blue-900/20 hover:border-blue-500/40",
		muted: "text-lines/30 border-lines/15 bg-transparent cursor-not-allowed",
	};

	return (
		<button
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={[base, disabled ? variants.muted : variants[variant]].join(
				" ",
			)}>
			{icon && (
				<FontAwesomeIcon
					icon={icon}
					className='text-[9px]'
				/>
			)}
			{label}
		</button>
	);
}

// ─── Stat cell ────────────────────────────────────────────────
function StatCell({ label, value, valueClass = "text-fontz" }) {
	return (
		<div className='flex flex-col gap-0.5 bg-blk/40 border border-lines/15 rounded px-3 py-2'>
			<span className='font-mono text-[9px] tracking-[0.2em] text-lines/30 uppercase'>
				{label}
			</span>
			<span className={["font-mono text-xs", valueClass].join(" ")}>
				{value}
			</span>
		</div>
	);
}

// ─── Fuel bar ────────────────────────────────────────────────
function FuelBar({ pct, isRepairing }) {
	const color =
		isRepairing ? "bg-btn animate-pulse"
		: pct > 60 ? "bg-green-500"
		: pct > 25 ? "bg-amber-400"
		: "bg-red-500";

	return (
		<div className='flex items-center gap-2 w-full'>
			<div className='flex-1 h-1.5 bg-blk/60 rounded-full overflow-hidden border border-lines/10'>
				<div
					className={[
						"h-full rounded-full transition-all duration-500",
						color,
					].join(" ")}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span className='font-mono text-[10px] tabular-nums text-lines/50 w-8 text-right shrink-0'>
				{pct}%
			</span>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
const Garage = ({ dataUpdated, openSheet }) => {
	const {
		vehicles,
		fetchVehicles,
		updateVehicle,
		deleteVehicle,
		repairVehicle,
		refuelVehicle,
	} = useVehicleStore();
	const [expandedVehicle, toggleExpand] = useToggleExpand();
	const [selectedVehicle, setSelectedVehicle] = useState(null);
	const { isOpen, openDialog, closeDialog, confirmAction } = useConfirmDialog();

	const getFuelPct = (v) => Math.max(0, Math.min(100, v?.remainingFuel ?? 100));

	const getVehicleData = (name) => GARAGE.find((v) => v.name === name);
	const getVehicleImage = (v) =>
		getVehicleData(v.vehicle)?.imgUrl || "/img/default-vehicle.png";
	const getVehicleType = (v) => getVehicleData(v.vehicle)?.type || "Unknown";

	const canRepair = (v) => v.condition !== "Optimal" && !v.isRepairing;
	const canRefuel = (v) =>
		getConditionData(v.condition).canRefuel && !v.isRepairing;
	const isAvailable = (v) => !v.isRepairing;

	const handleRefuel = async (vehicle) => {
		if (!canRefuel(vehicle)) {
			toast.error(
				vehicle.isRepairing ?
					"Cannot refuel while repairing."
				:	"Critical condition — repair first.",
			);
			return;
		}
		try {
			if (refuelVehicle) {
				await refuelVehicle(vehicle._id, 25);
			} else {
				const newCondition = getNextWorseCondition(vehicle.condition);
				await updateVehicle(vehicle._id, {
					remainingFuel: 100,
					condition: newCondition,
					repairTime: getConditionData(newCondition).repairTime,
				});
				if (newCondition !== vehicle.condition)
					toast.warning(`Condition degraded to ${newCondition}.`);
				else toast.success("Refueled.");
			}
			fetchVehicles();
		} catch {
			toast.error("Refuel failed.");
		}
	};

	const handleRepair = async (vehicle) => {
		if (vehicle.isRepairing) {
			toast.warning("Already repairing.");
			return;
		}
		try {
			toast.info(
				`Repair initiated for ${vehicle.nickName || vehicle.nickname}.`,
			);
			await repairVehicle(vehicle._id);
			fetchVehicles();
			toast.success("Repair workflow started.");
		} catch {
			toast.error("Repair failed.");
		}
	};

	const handleTripComplete = async (tripData) => {
		try {
			await updateVehicle(tripData.vehicleId, {
				remainingFuel: tripData.newEnergyLevel,
			});
			fetchVehicles();
		} catch {
			console.error("Trip update failed.");
		}
	};

	const handleDeleteClick = (vehicle, e) => {
		e.stopPropagation();
		setSelectedVehicle(vehicle);
		openDialog(async () => {
			try {
				await deleteVehicle(vehicle._id);
				fetchVehicles();
				setSelectedVehicle(null);
			} catch {
				console.error("Delete failed.");
			}
		});
	};

	useEffect(() => {
		fetchVehicles();
	}, [fetchVehicles, dataUpdated]);

	return (
		<div className='flex flex-col h-full min-h-0'>
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
											<NewVehicleForm />,
											"New Vehicle",
											"Add a new vehicle to your garage.",
										)
									}
									className='w-6 h-6 flex items-center justify-center bg-btn hover:bg-highlight text-blk rounded transition-colors'
									title='Add Vehicle'>
									<FontAwesomeIcon
										icon={faParking}
										className='text-[10px]'
									/>
								</button>
								Vehicle
							</div>
						</th>
						<th className='px-4 py-3 font-mono text-[10px] tracking-widest text-lines/50 uppercase'>
							Fuel
						</th>
						<th className='px-4 py-3 font-mono text-[10px] tracking-widest text-lines/50 uppercase w-8' />
					</tr>
				</thead>

				<tbody>
					{vehicles.length > 0 ?
						vehicles.map((vehicle, index) => {
							const fuelPct = getFuelPct(vehicle);
							const condStyle = getConditionStyle(vehicle.condition);
							const nickname =
								vehicle.nickName || vehicle.nickname || "Unnamed";
							const expanded = expandedVehicle === index;

							return (
								<React.Fragment key={vehicle._id || index}>
									{/* ── Main row ── */}
									<tr
										className='border-b border-lines/10 hover:bg-highlight/15 cursor-pointer transition-colors duration-150 group'
										onClick={() => toggleExpand(index)}>
										{/* Name + status */}
										<td className='px-4 py-3'>
											<div className='flex items-center gap-2.5'>
												{/* Condition indicator dot */}
												<span
													className={[
														"w-1.5 h-1.5 rounded-full shrink-0",
														condStyle.bar,
														condStyle.glow.replace("shadow-", "shadow-"),
													].join(" ")}
												/>
												<div className='flex flex-col leading-none gap-1 min-w-0'>
													<div className='flex items-center gap-2'>
														<span className='font-mono text-xs text-fontz group-hover:text-white transition-colors truncate'>
															{nickname}
														</span>
														{vehicle.isRepairing && (
															<span className='font-mono text-[8px] tracking-widest text-btn border border-btn/40 bg-btn/10 px-1.5 py-0.5 rounded-sm animate-pulse shrink-0'>
																REPAIR
															</span>
														)}
													</div>
													<span className='font-mono text-[9px] text-lines/35 truncate'>
														{vehicle.vehicle || "Unknown"} ·{" "}
														{getVehicleType(vehicle)}
													</span>
												</div>
											</div>
										</td>

										{/* Fuel bar */}
										<td className='px-4 py-3'>
											<FuelBar
												pct={fuelPct}
												isRepairing={vehicle.isRepairing}
											/>
										</td>

										{/* Caret */}
										<td className='px-4 py-3 text-right'>
											<FontAwesomeIcon
												icon={expanded ? faCaretUp : faCaretDown}
												className='text-lines/30 text-sm'
											/>
										</td>
									</tr>

									{/* ── Expanded section ── */}
									{expanded && (
										<tr>
											<td
												colSpan={3}
												className='px-4 py-4 bg-blk/50 border-b border-lines/10'>
												<div className='flex flex-col gap-4'>
													{/* Image + stats */}
													<div className='flex flex-col sm:flex-row gap-4'>
														{/* Vehicle image */}
														<div className='shrink-0 relative'>
															<img
																src={getVehicleImage(vehicle)}
																alt={nickname}
																className={[
																	"w-full sm:w-56 h-32 object-cover rounded-lg border border-lines/20",
																	vehicle.isRepairing ?
																		"opacity-60 grayscale"
																	:	"",
																].join(" ")}
																onError={(e) => {
																	e.target.src = "/img/default-vehicle.png";
																}}
															/>
															{/* Condition badge over image */}
															<div
																className={[
																	"absolute top-2 left-2 font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm border bg-blk/80",
																	condStyle.color,
																	condStyle.border,
																].join(" ")}>
																{vehicle.condition}
																{vehicle.isRepairing && " · Repairing"}
															</div>
														</div>

														{/* Stat grid */}
														<div className='grid grid-cols-2 gap-2 flex-1'>
															<StatCell
																label='Type'
																value={getVehicleType(vehicle)}
															/>
															<StatCell
																label='Condition'
																value={
																	vehicle.condition +
																	(vehicle.isRepairing ? " ↻" : "")
																}
																valueClass={condStyle.color}
															/>
															<StatCell
																label='Fuel'
																value={`${fuelPct}%`}
															/>
															<StatCell
																label='Repair Time'
																value={`${vehicle.repairTime || 0}h`}
															/>
														</div>
													</div>

													{/* Divider */}
													<div className='flex items-center gap-3'>
														<span className='font-mono text-[9px] tracking-[0.2em] text-lines/25 uppercase'>
															Operations
														</span>
														<div className='flex-1 h-px bg-lines/10' />
													</div>

													{/* Action row */}
													<div className='flex flex-wrap gap-2'>
														{isAvailable(vehicle) ?
															<>
																<ActionBtn
																	icon={faRoute}
																	label='Trip'
																	onClick={() =>
																		openSheet(
																			"top",
																			<TripCalculatorComponent
																				vehicle={vehicle}
																				onTripComplete={handleTripComplete}
																			/>,
																			"Trip Calculator",
																			`Plan your trip with ${nickname}`,
																		)
																	}
																/>
																<ActionBtn
																	icon={faGasPump}
																	label={
																		canRefuel(vehicle) ? "Refuel" : (
																			"Needs Repair"
																		)
																	}
																	onClick={() => handleRefuel(vehicle)}
																	disabled={!canRefuel(vehicle)}
																	title={
																		canRefuel(vehicle) ? "Refuel +25%" : (
																			`Critical — repair first`
																		)
																	}
																/>
															</>
														:	<ActionBtn
																icon={faWrench}
																label='Unavailable'
																disabled
																variant='muted'
															/>
														}

														{canRepair(vehicle) && (
															<ActionBtn
																icon={faWrench}
																label={
																	vehicle.condition === "Critical" ?
																		"Emergency Repair"
																	:	"Repair"
																}
																variant='blue'
																onClick={() => handleRepair(vehicle)}
															/>
														)}

														{vehicle.isRepairing && (
															<ActionBtn
																icon={faWrench}
																label='Repair In Progress'
																disabled
																variant='muted'
															/>
														)}
													</div>

													{/* Edit + Delete */}
													<div className='flex items-center gap-3 pt-1 border-t border-lines/10'>
														<button
															onClick={() => {
																if (vehicle.isRepairing) {
																	toast.warning("Cannot edit while repairing.");
																	return;
																}
																openSheet(
																	"bottom",
																	<EditVehicleForm vehicleId={vehicle._id} />,
																	"Edit Vehicle",
																	"Modify vehicle details, condition, and fuel level.",
																);
															}}
															className={[
																"flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors",
																vehicle.isRepairing ?
																	"text-lines/20 cursor-not-allowed"
																:	"text-btn hover:text-white",
															].join(" ")}
															title={
																vehicle.isRepairing ?
																	"Cannot edit while repairing"
																:	"Edit vehicle"
															}>
															<FontAwesomeIcon
																icon={faGear}
																className='text-sm'
															/>
															Edit
														</button>

														<button
															onClick={(e) => {
																if (vehicle.isRepairing) {
																	e.stopPropagation();
																	toast.warning(
																		"Cannot delete while repairing.",
																	);
																	return;
																}
																handleDeleteClick(vehicle, e);
															}}
															className={[
																"flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors",
																vehicle.isRepairing ?
																	"text-lines/20 cursor-not-allowed"
																:	"text-red-500/50 hover:text-red-400",
															].join(" ")}
															title={
																vehicle.isRepairing ?
																	"Cannot delete while repairing"
																:	`Delete ${nickname}`
															}>
															<FontAwesomeIcon
																icon={faTrash}
																className='text-sm'
															/>
															Delete
														</button>
													</div>
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							);
						})
					:	<tr>
							<td
								colSpan={3}
								className='py-16 text-center'>
								<div className='flex flex-col items-center gap-3'>
									<div className='w-10 h-10 border border-lines/20 rotate-45 flex items-center justify-center'>
										<FontAwesomeIcon
											icon={faParking}
											className='text-lines/20 text-sm -rotate-45'
										/>
									</div>
									<p className='font-mono text-[10px] tracking-[0.2em] text-lines/25 uppercase'>
										No vehicles in garage
									</p>
									<p className='font-mono text-[9px] tracking-widest text-lines/15'>
										Click + to add your first vehicle
									</p>
								</div>
							</td>
						</tr>
					}
				</tbody>
			</table>

			{/* Delete confirm */}
			{isOpen && selectedVehicle && (
				<ConfirmDialog
					isOpen={isOpen}
					closeDialog={closeDialog}
					confirmAction={confirmAction}
					title='Delete Vehicle'
					description='This action cannot be undone.'
					message={`Permanently remove "${selectedVehicle.nickName || selectedVehicle.nickname}" from the garage?`}
					onRandomInjury={() => {}}
					onKIAInjury={() => {}}
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
