// @/components/TripCalculator.jsx
import { useState } from "react";
import { Button } from "@material-tailwind/react";
import { toast } from "react-toastify";
import { GARAGE } from "@/config";
import { PropTypes } from "prop-types";

// Trip Calculator Logic
class TripCalculator {
	static getVehicleSpecs(vehicleName) {
		return GARAGE.find((v) => v.name === vehicleName);
	}

	static calculateTrip(userVehicle, distance) {
		const vehicleSpecs = this.getVehicleSpecs(userVehicle.vehicle);
		if (!vehicleSpecs) {
			return { error: "Vehicle specifications not found" };
		}

		if (vehicleSpecs.fuelCapacity && vehicleSpecs.efficiency) {
			return this.calculateFuelTrip(userVehicle, vehicleSpecs, distance);
		} else if (vehicleSpecs.battery && vehicleSpecs.batteryCharge) {
			return this.calculateBatteryTrip(userVehicle, vehicleSpecs, distance);
		} else if (vehicleSpecs.timer) {
			return this.calculateFlightTrip(userVehicle, vehicleSpecs, distance);
		} else {
			return { error: "Unknown vehicle energy type" };
		}
	}

	static calculateFuelTrip(userVehicle, specs, distance) {
		const currentFuelPercent = userVehicle.remainingFuel || 0;
		const currentFuel = (currentFuelPercent / 100) * specs.fuelCapacity;

		//  Use efficiency as fuel consumption per km (more realistic for gameplay)
		const fuelPerKm = specs.efficiency; // Direct consumption per km
		const fuelNeeded = distance * fuelPerKm;
		const travelTime = distance; // 1km = 1 minute
		const maxRange = Math.floor(currentFuel / specs.efficiency); // How many km with current fuel

		if (currentFuel < fuelNeeded) {
			const possibleDistance = Math.floor(maxRange);
			return {
				success: false,
				type: "fuel",
				message: `Insufficient fuel! Can only travel ${possibleDistance}km with ${currentFuel.toFixed(
					1
				)}L fuel`,
				maxDistance: possibleDistance,
				maxTime: possibleDistance,
				fuelNeeded: fuelNeeded.toFixed(2),
				currentFuel: currentFuel.toFixed(2),
			};
		}

		const remainingFuel = currentFuel - fuelNeeded;
		const remainingFuelPercent = (remainingFuel / specs.fuelCapacity) * 100;
		const remainingRange = Math.floor(remainingFuel / specs.efficiency);

		return {
			success: true,
			type: "fuel",
			distance: distance,
			travelTime: travelTime,
			fuelUsed: fuelNeeded.toFixed(2),
			fuelRemaining: remainingFuel.toFixed(2),
			fuelRemainingPercent: remainingFuelPercent.toFixed(1),
			rangeRemaining: remainingRange,
			message: `Trip successful! Used ${fuelNeeded.toFixed(1)}L fuel (${(
				(100 * fuelNeeded) /
				specs.fuelCapacity
			).toFixed(1)}% of tank), ${remainingRange}km range left`,
		};
	}

	static calculateBatteryTrip(userVehicle, specs, distance) {
		const currentBatteryPercent = userVehicle.remainingFuel || 0;
		const currentBattery = (currentBatteryPercent / 100) * specs.battery;

		// Use batteryCharge as consumption per km (like fuel efficiency)
		const batteryPerKm = specs.batteryCharge; // Direct kWh consumption per km
		const batteryNeeded = distance * batteryPerKm;
		const travelTime = distance;
		const maxRange = Math.floor(currentBattery / specs.batteryCharge); // How many km with current battery

		if (currentBattery < batteryNeeded) {
			const possibleDistance = Math.floor(maxRange);
			return {
				success: false,
				type: "battery",
				message: `Insufficient battery! Can only travel ${possibleDistance}km with ${currentBattery.toFixed(
					1
				)} kWh`,
				maxDistance: possibleDistance,
				maxTime: possibleDistance,
				batteryNeeded: batteryNeeded.toFixed(2),
				currentBattery: currentBattery.toFixed(2),
				currentBatteryPercent: currentBatteryPercent,
			};
		}

		const remainingBattery = currentBattery - batteryNeeded;
		const remainingBatteryPercent = (remainingBattery / specs.battery) * 100;
		const remainingRange = Math.floor(remainingBattery / specs.batteryCharge);

		return {
			success: true,
			type: "battery",
			distance: distance,
			travelTime: travelTime,
			batteryUsed: batteryNeeded.toFixed(2),
			batteryRemaining: remainingBattery.toFixed(2),
			batteryRemainingPercent: remainingBatteryPercent.toFixed(1),
			rangeRemaining: remainingRange,
			message: `Trip successful! Used ${batteryNeeded.toFixed(1)} kWh (${(
				(100 * batteryNeeded) /
				specs.battery
			).toFixed(1)}% of battery), ${remainingRange}km range left`,
		};
	}

	static calculateFlightTrip(userVehicle, specs, distance) {
		const currentTimePercent = userVehicle.remainingFuel || 0;
		const currentFlightTime = (currentTimePercent / 100) * (specs.timer / 60);
		const timeNeeded = distance;
		const maxDistance = Math.floor(currentFlightTime);

		if (currentFlightTime < timeNeeded) {
			return {
				success: false,
				type: "flight",
				message: `Insufficient flight time! Can only fly ${maxDistance}km`,
				maxDistance: maxDistance,
				maxTime: Math.floor(currentFlightTime),
				timeNeeded: timeNeeded,
				currentFlightTime: Math.floor(currentFlightTime),
			};
		}

		const remainingFlightTime = currentFlightTime - timeNeeded;
		const remainingTimePercent =
			(remainingFlightTime / (specs.timer / 60)) * 100;

		return {
			success: true,
			type: "flight",
			distance: distance,
			travelTime: timeNeeded,
			flightTimeUsed: timeNeeded,
			flightTimeRemaining: Math.floor(remainingFlightTime),
			flightTimeRemainingPercent: remainingTimePercent.toFixed(1),
			rangeRemaining: Math.floor(remainingFlightTime),
			message: `Flight successful! Used ${timeNeeded} minutes, ${Math.floor(
				remainingFlightTime
			)} minutes remaining`,
		};
	}

	static getMaxRange(userVehicle) {
		const vehicleSpecs = this.getVehicleSpecs(userVehicle.vehicle);
		if (!vehicleSpecs) return 0;

		const currentEnergyPercent = userVehicle.remainingFuel || 0;

		if (vehicleSpecs.fuelCapacity && vehicleSpecs.efficiency) {
			const currentFuel =
				(currentEnergyPercent / 100) * vehicleSpecs.fuelCapacity;
			return Math.floor(currentFuel / vehicleSpecs.efficiency); // fuel divided by consumption per km
		} else if (vehicleSpecs.battery && vehicleSpecs.batteryCharge) {
			const currentBattery =
				(currentEnergyPercent / 100) * vehicleSpecs.battery;
			return Math.floor(currentBattery / vehicleSpecs.batteryCharge); // battery divided by consumption per km
		} else if (vehicleSpecs.timer) {
			const currentFlightTime =
				(currentEnergyPercent / 100) * (vehicleSpecs.timer / 60);
			return Math.floor(currentFlightTime); // 1 minute = 1 km
		}

		return 0;
	}

	static formatTime(minutes) {
		if (minutes < 60) {
			return `${minutes} min`;
		} else {
			const hours = Math.floor(minutes / 60);
			const mins = minutes % 60;
			return `${hours}h ${mins}m`;
		}
	}
}

// React Component
const TripCalculatorComponent = ({ vehicle, onTripComplete }) => {
	const [distance, setDistance] = useState("");
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);

	const maxRange = TripCalculator.getMaxRange(vehicle);
	const vehicleSpecs = TripCalculator.getVehicleSpecs(vehicle.vehicle);

	const handleCalculate = () => {
		const distanceNum = parseFloat(distance);

		if (!distanceNum || distanceNum <= 0) {
			toast.error("Please enter a valid distance");
			return;
		}

		if (distanceNum > maxRange) {
			toast.error(`Distance exceeds maximum range of ${maxRange}km`);
			return;
		}

		setLoading(true);

		setTimeout(() => {
			const tripResult = TripCalculator.calculateTrip(vehicle, distanceNum);
			setResult(tripResult);
			setLoading(false);
		}, 500);
	};

	const handleConfirmTrip = () => {
		if (result && result.success) {
			let newEnergyPercent;

			if (result.type === "fuel") {
				newEnergyPercent = parseFloat(result.fuelRemainingPercent);
			} else if (result.type === "battery") {
				newEnergyPercent = parseFloat(result.batteryRemainingPercent);
			} else if (result.type === "flight") {
				newEnergyPercent = parseFloat(result.flightTimeRemainingPercent);
			}

			onTripComplete({
				vehicleId: vehicle._id,
				newEnergyLevel: Math.max(0, newEnergyPercent),
				distance: result.distance,
				travelTime: result.travelTime,
			});

			toast.success("Trip completed successfully!");
			setResult(null);
			setDistance("");
		}
	};

	const getEnergyType = () => {
		if (vehicleSpecs?.fuelCapacity) return "Fuel";
		if (vehicleSpecs?.battery) return "Battery";
		if (vehicleSpecs?.timer) return "Flight Time";
		return "Energy";
	};

	return (
		<div className='p-4 bg-blk/50 rounded-lg'>
			<h3 className='text-lg font-semibold mb-4 text-fontz'>
				Trip Calculator - {vehicle.nickname || vehicle.nickName}
			</h3>

			<div className='mb-4'>
				<p className='text-sm text-gray-400 mb-2'>
					{getEnergyType()}: {vehicle.remainingFuel}% | Max Range: {maxRange}km
				</p>

				{/* Debug info - shows realistic ranges */}
				<div className='text-xs text-gray-500 mb-2 p-2 bg-blk rounded'>
					<strong>Vehicle Specs:</strong> {vehicle.vehicle}
					<br />
					{vehicleSpecs?.fuelCapacity && (
						<>
							Tank: {vehicleSpecs.fuelCapacity}L | Consumption:{" "}
							{vehicleSpecs.efficiency} L/km | Full Range:{" "}
							{Math.floor(vehicleSpecs.fuelCapacity / vehicleSpecs.efficiency)}
							km
						</>
					)}
					{vehicleSpecs?.battery && (
						<>
							Battery: {vehicleSpecs.battery} kWh | Consumption:{" "}
							{vehicleSpecs.batteryCharge} kWh/km | Full Range:{" "}
							{Math.floor(vehicleSpecs.battery / vehicleSpecs.batteryCharge)}km
						</>
					)}
					{vehicleSpecs?.timer && (
						<>
							Flight Time: {Math.floor(vehicleSpecs.timer / 60)} min | Full
							Range: {Math.floor(vehicleSpecs.timer / 60)}km
						</>
					)}
				</div>

				<div className='flex gap-2'>
					<input
						type='number'
						placeholder='Distance (km)'
						value={distance}
						onChange={(e) => setDistance(e.target.value)}
						className='flex-1 p-2 rounded bg-blk/50 text-white border border-lines'
						min='1'
						max={maxRange}
					/>
					<Button
						onClick={handleCalculate}
						disabled={loading || !distance}
						className='btn'>
						{loading ? "Calculating..." : "Calculate"}
					</Button>
				</div>
			</div>

			{result && (
				<div
					className={`p-3 rounded-lg mb-3 ${
						result.success ? "bg-highlight/50" : "bg-red-900"
					}`}>
					<div className='text-white'>
						<p className='font-semibold mb-2'>{result.message}</p>

						{result.success ? (
							<div className='text-sm space-y-1'>
								<p>
									Travel Time: {TripCalculator.formatTime(result.travelTime)}
								</p>
								<p>Distance: {result.distance}km</p>
								{result.type === "fuel" && (
									<>
										<p>Fuel Used: {result.fuelUsed}L</p>
										<p>Remaining Range: {result.rangeRemaining}km</p>
									</>
								)}
								{result.type === "battery" && (
									<>
										<p>Battery Used: {result.batteryUsed} kWh</p>
										<p>Remaining Range: {result.rangeRemaining}km</p>
									</>
								)}
								{result.type === "flight" && (
									<>
										<p>
											Flight Time Used:{" "}
											{TripCalculator.formatTime(result.flightTimeUsed)}
										</p>
										<p>Remaining Flight Range: {result.rangeRemaining}km</p>
									</>
								)}
							</div>
						) : (
							<div className='text-sm space-y-1'>
								<p>Maximum Distance: {result.maxDistance}km</p>
								<p>Maximum Time: {TripCalculator.formatTime(result.maxTime)}</p>
							</div>
						)}
					</div>

					{result.success && (
						<div className='mt-3 flex gap-2'>
							<Button
								onClick={handleConfirmTrip}
								className='btn'
								size='sm'>
								Confirm Trip
							</Button>
							<Button
								onClick={() => setResult(null)}
								variant='outlined'
								className='border-gray-500 text-gray-300 hover:bg-red-700'
								size='sm'>
								Cancel
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
TripCalculatorComponent.propTypes = {
	vehicle: PropTypes.shape({
		_id: PropTypes.string.isRequired,
		nickname: PropTypes.string,
		nickName: PropTypes.string,
		vehicle: PropTypes.string.isRequired,
		remainingFuel: PropTypes.number,
		condition: PropTypes.string,
	}).isRequired,
	onTripComplete: PropTypes.func.isRequired,
};

export { TripCalculator, TripCalculatorComponent };
