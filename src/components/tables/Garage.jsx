// Garage.jsx — vehicle card grid with wear & tear simulation
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faGear,
	faParking,
	faTrash,
	faWrench,
	faGasPump,
	faRoute,
	faPlus,
	faHelicopter,
} from "@fortawesome/free-solid-svg-icons";
import { useVehicleStore } from "@/zustand";
import { PropTypes } from "prop-types";
import { useConfirmDialog } from "@/hooks";
import { ConfirmDialog } from "@/components";
import { NewVehicleForm } from "@/components/forms";
import EditVehicleForm from "../forms/EditVehicleForm";
import { GARAGE } from "@/config";
import { TripCalculatorComponent } from "@/components/TripCalculator";
import { toast } from "react-toastify";

// ─── Wear → condition label (mirrors backend deriveCondition) ──
function deriveCondition(wear) {
	if (wear < 25) return "Optimal";
	if (wear < 50) return "Operational";
	if (wear < 75) return "Compromised";
	return "Critical";
}

// Repair time formula matches backend calcRepairTime
function calcRepairTime(wear) {
	return Math.max(0.5, Math.round((wear / 100) * 4 * 2) / 2);
}

// ─── Condition display config ──────────────────────────────────
const CONDITION_STYLE = {
	Optimal:     { color: "text-green-400", badge: "text-green-400 border-green-900/50 bg-green-900/10", dot: "bg-green-500 shadow-[0_0_5px_rgba(74,222,128,0.6)]",   wear: "bg-green-500"  },
	Operational: { color: "text-btn",       badge: "text-btn border-btn/40 bg-btn/8",                    dot: "bg-btn shadow-[0_0_5px_rgba(124,170,121,0.5)]",         wear: "bg-btn"        },
	Compromised: { color: "text-amber-400", badge: "text-amber-400 border-amber-900/50 bg-amber-900/10", dot: "bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.6)]",   wear: "bg-amber-400"  },
	Critical:    { color: "text-red-400",   badge: "text-red-400 border-red-900/50 bg-red-900/10",       dot: "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]",      wear: "bg-red-500"    },
};

const getStyle = (wear) => CONDITION_STYLE[deriveCondition(wear)] ?? CONDITION_STYLE.Critical;

// Backwards-compat: old vehicles may have no wearPercent but have a condition string
function resolveWear(vehicle) {
	if (typeof vehicle.wearPercent === "number") return vehicle.wearPercent;
	return { Optimal: 0, Operational: 30, Compromised: 60, Critical: 85 }[vehicle.condition] ?? 0;
}

// ─── Fuel bar ──────────────────────────────────────────────────
function FuelBar({ pct, isRepairing }) {
	const color =
		isRepairing ? "bg-btn animate-pulse"
		: pct > 60  ? "bg-green-500"
		: pct > 25  ? "bg-amber-400"
		:              "bg-red-500";
	return (
		<div className='flex items-center gap-2'>
			<div className='flex-1 h-1 bg-blk/60 rounded-full overflow-hidden border border-lines/10'>
				<div className={["h-full rounded-full transition-all duration-500", color].join(" ")} style={{ width: `${pct}%` }} />
			</div>
			<span className='font-mono text-[9px] tabular-nums text-lines/40 w-7 text-right shrink-0'>{pct}%</span>
		</div>
	);
}

// ─── Wear bar ──────────────────────────────────────────────────
function WearBar({ wear, style }) {
	return (
		<div className='flex items-center gap-2'>
			<div className='flex-1 h-1.5 bg-blk/60 rounded-full overflow-hidden border border-lines/10'>
				<div
					className={["h-full rounded-full transition-all duration-700", style.wear].join(" ")}
					style={{ width: `${wear}%` }}
				/>
			</div>
			<span className={["font-mono text-[9px] tabular-nums w-7 text-right shrink-0", style.color].join(" ")}>
				{Math.round(wear)}%
			</span>
		</div>
	);
}

// ─── Icon button ───────────────────────────────────────────────
function IconBtn({ icon, label, onClick, variant = "default", disabled, title }) {
	const base = "flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-2 py-1 rounded-sm border transition-all duration-150";
	const variants = {
		default: "text-lines/50 border-lines/15 hover:border-lines/35 hover:text-fontz",
		green:   "text-btn border-btn/30 bg-btn/8 hover:bg-btn/20 hover:border-btn/60",
		blue:    "text-blue-400 border-blue-900/40 bg-blue-900/8 hover:bg-blue-900/20 hover:border-blue-500/50",
		red:     "text-red-400/60 border-red-900/30 hover:bg-red-900/15 hover:border-red-500/40 hover:text-red-400",
		muted:   "text-lines/20 border-lines/10 cursor-not-allowed",
	};
	return (
		<button onClick={onClick} disabled={disabled} title={title}
			className={[base, disabled ? variants.muted : variants[variant]].join(" ")}>
			<FontAwesomeIcon icon={icon} className='text-[8px]' />
			{label}
		</button>
	);
}

// ─── Vehicle card ──────────────────────────────────────────────
function VehicleCard({ vehicle, openSheet, onDelete, onRefuel, onRepair, onTripComplete }) {
	const wear       = resolveWear(vehicle);
	const condition  = deriveCondition(wear);
	const style      = getStyle(wear);
	const fuelPct    = Math.max(0, Math.min(100, vehicle?.remainingFuel ?? 100));
	const nickname   = vehicle.nickName || vehicle.nickname || "Unnamed";
	const garageData = GARAGE.find((v) => v.name === vehicle.vehicle);
	const imgUrl     = garageData?.imgUrl || "/img/default-vehicle.png";
	const vType      = garageData?.type || "Unknown";
	const isAircraft = garageData?.type === "Aircraft" || garageData?.type === "UAV";
	const isCritical = wear >= 75;
	const isRepairing = vehicle.isRepairing;

	const canDeploy = !isRepairing && !isCritical;
	const canRepair = wear > 0 && !isRepairing;
	const canRefuel = !isRepairing && !isCritical;
	const repairHrs = calcRepairTime(wear);

	return (
		<div className='flex flex-col rounded border border-lines/20 bg-blk/50 overflow-hidden group hover:border-lines/35 transition-colors duration-150'>
			{/* ── Image banner ─────────────────────────────── */}
			<div className='relative h-28 overflow-hidden bg-blk/80 shrink-0'>
				<img
					src={imgUrl}
					alt={nickname}
					className={["w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-[1.02]",
						(isRepairing || isCritical) ? "grayscale opacity-50" : ""].join(" ")}
					onError={(e) => { e.currentTarget.src = "/img/default-vehicle.png"; }}
				/>
				<div className='absolute inset-0 bg-gradient-to-t from-blk/90 via-blk/20 to-transparent' />

				{/* Condition badge */}
				<div className={["absolute top-2 left-2 font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm border bg-blk/80", style.badge].join(" ")}>
					{condition}
				</div>

				{/* Status badge top-right */}
				{isRepairing ? (
					<div className='absolute top-2 right-2 font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm border text-btn border-btn/40 bg-blk/80 animate-pulse'>
						REPAIR
					</div>
				) : isCritical ? (
					<div className='absolute top-2 right-2 font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm border text-red-400 border-red-900/50 bg-blk/80 animate-pulse'>
						GROUNDED
					</div>
				) : isAircraft ? (
					<div className='absolute top-2 right-2 font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm border text-sky-400/70 border-sky-800/40 bg-blk/80'>
						<FontAwesomeIcon icon={faHelicopter} className='mr-1 text-[7px]' />AIR
					</div>
				) : null}

				{/* Name + type */}
				<div className='absolute bottom-0 left-0 right-0 px-3 pb-2'>
					<div className='flex items-end justify-between'>
						<div className='flex flex-col leading-none gap-0.5'>
							<span className='font-mono text-[11px] text-white tracking-wide truncate'>{nickname}</span>
							<span className='font-mono text-[8px] text-lines/50 tracking-widest'>{vehicle.vehicle} · {vType}</span>
						</div>
						<span className={["w-2 h-2 rounded-full shrink-0 mb-0.5", style.dot].join(" ")} />
					</div>
				</div>
			</div>

			{/* ── Stats ────────────────────────────────────── */}
			<div className='px-3 pt-2.5 pb-2 flex flex-col gap-2'>
				{/* Fuel / Flight time */}
				<div className='flex flex-col gap-1'>
					<div className='flex items-center justify-between'>
						<span className='font-mono text-[8px] tracking-[0.2em] text-lines/30 uppercase'>
							Op. Time
						</span>
						{isRepairing && (
							<span className='font-mono text-[8px] text-btn/60'>~{repairHrs}h repair</span>
						)}
					</div>
					<FuelBar pct={fuelPct} isRepairing={isRepairing} />
				</div>

				{/* Wear */}
				<div className='flex flex-col gap-1'>
					<div className='flex items-center justify-between'>
						<span className='font-mono text-[8px] tracking-[0.2em] text-lines/30 uppercase'>Wear</span>
						<span className='font-mono text-[8px] text-lines/25'>
							{`${Math.round(vehicle.totalMinutes ?? vehicle.totalMileage ?? 0)} min total`}
						</span>
					</div>
					<WearBar wear={wear} style={style} />
					{isCritical && !isRepairing && (
						<p className='font-mono text-[7px] text-red-400/70 tracking-widest uppercase'>
							Grounded — repair required ({repairHrs}h)
						</p>
					)}
				</div>

				{/* Actions */}
				<div className='flex flex-wrap gap-1 pt-1 border-t border-lines/10'>
					<IconBtn
						icon={isAircraft ? faHelicopter : faRoute}
						label={isAircraft ? "Sortie" : "Trip"}
						variant={canDeploy ? "default" : "muted"}
						disabled={!canDeploy}
						title={isCritical ? "Grounded — repair first" : isRepairing ? "Repairing" : undefined}
						onClick={() =>
							openSheet(
								"top",
								<TripCalculatorComponent vehicle={vehicle} onTripComplete={onTripComplete} />,
								isAircraft ? "Sortie Planner" : "Trip Calculator",
								`Plan your ${isAircraft ? "sortie" : "trip"} with ${nickname}`,
							)
						}
					/>
					<IconBtn
						icon={faGasPump}
						label='Refuel'
						variant={canRefuel ? "green" : "muted"}
						disabled={!canRefuel}
						title={
							isCritical   ? "Grounded — repair first"
							: isRepairing ? "Cannot refuel while repairing"
							:              "Refuel +25%"
						}
						onClick={() => onRefuel(vehicle)}
					/>
					{canRepair && (
						<IconBtn
							icon={faWrench}
							label={isCritical ? "Emerg. Repair" : "Repair"}
							variant='blue'
							title={`~${repairHrs}h to repair`}
							onClick={() => onRepair(vehicle)}
						/>
					)}
					{isRepairing && (
						<IconBtn icon={faWrench} label='Repairing…' disabled variant='muted' />
					)}
					<div className='flex-1' />
					<IconBtn
						icon={faGear}
						label='Edit'
						variant={isRepairing ? "muted" : "default"}
						disabled={isRepairing}
						onClick={() => {
							if (isRepairing) { toast.warning("Cannot edit while repairing."); return; }
							openSheet("bottom", <EditVehicleForm vehicleId={vehicle._id} />, "Edit Vehicle", "Modify vehicle details and fuel.");
						}}
					/>
					<IconBtn
						icon={faTrash}
						label='Del'
						variant={isRepairing ? "muted" : "red"}
						disabled={isRepairing}
						onClick={(e) => {
							if (isRepairing) { toast.warning("Cannot delete while repairing."); return; }
							onDelete(vehicle, e);
						}}
					/>
				</div>
			</div>
		</div>
	);
}

// ─── Main component ────────────────────────────────────────────
const Garage = ({ dataUpdated, openSheet }) => {
	const { vehicles, fetchVehicles, updateVehicle, deleteVehicle, repairVehicle, logTrip, logSortie } = useVehicleStore();
	const [selectedVehicle, setSelectedVehicle] = useState(null);
	const { isOpen, openDialog, closeDialog, confirmAction } = useConfirmDialog();

	useEffect(() => { fetchVehicles(); }, [fetchVehicles, dataUpdated]);

	const handleRefuel = async (vehicle) => {
		if (!vehicle) return;
		const wear = resolveWear(vehicle);
		if (vehicle.isRepairing || wear >= 75) {
			toast.error(vehicle.isRepairing ? "Cannot refuel while repairing." : "Grounded — repair before refueling.");
			return;
		}
		try {
			await updateVehicle(vehicle._id, { remainingFuel: Math.min(100, (vehicle.remainingFuel ?? 0) + 25) });
			toast.success("Refueled +25%.");
			fetchVehicles();
		} catch { toast.error("Refuel failed."); }
	};

	const handleRepair = async (vehicle) => {
		if (vehicle.isRepairing) { toast.warning("Already repairing."); return; }
		if (resolveWear(vehicle) === 0)  { toast.info("No wear — repair not needed."); return; }
		try {
			const result = await repairVehicle(vehicle._id);
			toast.success(`Repair started. Est. ${result?.estimatedRepairTime ?? "?"}h.`);
			fetchVehicles();
		} catch { toast.error("Repair failed."); }
	};

	// Called by TripCalculator on confirm — routes to logTrip or logSortie
	const handleTripComplete = async (tripData) => {
		const v = vehicles.find((x) => x._id === tripData.vehicleId);
		if (!v) return;

		const garageData = GARAGE.find((g) => g.name === v.vehicle);
		const isAircraft = garageData?.type === "Aircraft" || garageData?.type === "UAV";
		const fuelBurned = Math.max(0, (v.remainingFuel ?? 100) - tripData.newEnergyLevel);
		const minutes    = tripData.minutesUsed ?? 0;
		const wearAdded  = tripData.wearAdded ?? 0;

		try {
			if (isAircraft) {
				await logSortie(tripData.vehicleId, minutes, wearAdded, fuelBurned);
			} else {
				await logTrip(tripData.vehicleId, minutes, wearAdded, fuelBurned);
			}
		} catch { console.error("Usage log failed."); }
	};

	const handleDeleteClick = (vehicle, e) => {
		e.stopPropagation();
		setSelectedVehicle(vehicle);
		openDialog(async () => {
			try {
				await deleteVehicle(vehicle._id);
				fetchVehicles();
				setSelectedVehicle(null);
			} catch { console.error("Delete failed."); }
		});
	};

	const repairing = vehicles.filter((v) => v.isRepairing).length;
	const critical  = vehicles.filter((v) => resolveWear(v) >= 75 && !v.isRepairing).length;

	return (
		<div className='flex flex-col h-full min-h-0'>
			{/* Header */}
			<div className='shrink-0 flex items-center gap-2 px-3 py-2 border-b border-lines/20 bg-blk/40'>
				<button
					onClick={() => openSheet("top", <NewVehicleForm />, "New Vehicle", "Add a new vehicle to your garage.")}
					className='w-6 h-6 flex items-center justify-center bg-btn hover:bg-highlight text-blk rounded transition-colors'
					title='Add Vehicle'>
					<FontAwesomeIcon icon={faPlus} className='text-[9px]' />
				</button>
				<span className='font-mono text-[9px] tracking-[0.2em] text-lines/35 uppercase'>
					{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
				</span>
				{repairing > 0 && (
					<span className='font-mono text-[8px] tracking-widest text-btn border border-btn/30 px-1.5 py-0.5 rounded-sm animate-pulse'>
						{repairing} repairing
					</span>
				)}
				{critical > 0 && (
					<span className='font-mono text-[8px] tracking-widest text-red-400 border border-red-900/40 px-1.5 py-0.5 rounded-sm'>
						{critical} grounded
					</span>
				)}
			</div>

			{/* Card grid */}
			<div className='flex-1 min-h-0 overflow-y-auto p-3'>
				{vehicles.length > 0 ? (
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3'>
						{vehicles.map((vehicle) => (
							<VehicleCard
								key={vehicle._id}
								vehicle={vehicle}
								openSheet={openSheet}
								onDelete={handleDeleteClick}
								onRefuel={handleRefuel}
								onRepair={handleRepair}
								onTripComplete={handleTripComplete}
							/>
						))}
					</div>
				) : (
					<div className='flex flex-col items-center justify-center h-48 gap-3'>
						<div className='w-10 h-10 border border-lines/15 rotate-45 flex items-center justify-center opacity-30'>
							<FontAwesomeIcon icon={faParking} className='text-lines/40 text-sm -rotate-45' />
						</div>
						<p className='font-mono text-[10px] tracking-[0.2em] text-lines/25 uppercase'>No vehicles in garage</p>
						<button
							onClick={() => openSheet("top", <NewVehicleForm />, "New Vehicle", "Add a new vehicle to your garage.")}
							className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-btn border border-btn/30 hover:border-btn/60 bg-btn/5 hover:bg-btn/15 px-3 py-1.5 rounded-sm transition-all'>
							<FontAwesomeIcon icon={faPlus} className='text-[8px]' />
							Add Vehicle
						</button>
					</div>
				)}
			</div>

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

// ─── PropTypes ─────────────────────────────────────────────────
FuelBar.propTypes  = { pct: PropTypes.number, isRepairing: PropTypes.bool };
WearBar.propTypes  = { wear: PropTypes.number, style: PropTypes.object };
IconBtn.propTypes  = { icon: PropTypes.object.isRequired, label: PropTypes.string, onClick: PropTypes.func, variant: PropTypes.string, disabled: PropTypes.bool, title: PropTypes.string };
VehicleCard.propTypes = { vehicle: PropTypes.object.isRequired, openSheet: PropTypes.func.isRequired, onDelete: PropTypes.func.isRequired, onRefuel: PropTypes.func.isRequired, onRepair: PropTypes.func.isRequired, onTripComplete: PropTypes.func.isRequired };
Garage.propTypes   = { dataUpdated: PropTypes.bool, openSheet: PropTypes.func };

export default Garage;
