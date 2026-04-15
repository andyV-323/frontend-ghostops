// @/components/TripCalculator.jsx
// All vehicles now use a unified time-based system.
// Players input how many minutes they want to use the vehicle.
// Fuel consumed = (minutesUsed / maxTime) * 100%
// Wear added    = minutesUsed * wearRate
import { useState } from "react";
import { Button } from "@material-tailwind/react";
import { toast } from "react-toastify";
import { GARAGE } from "@/config";
import { PropTypes } from "prop-types";

const AIRCRAFT_TYPES = new Set(["Aircraft", "UAV"]);

class TripCalculator {
	static getVehicleSpecs(vehicleName) {
		return GARAGE.find((v) => v.name === vehicleName);
	}

	static calculateTrip(userVehicle, minutesUsed) {
		const specs = this.getVehicleSpecs(userVehicle.vehicle);
		if (!specs) return { error: "Vehicle specifications not found" };

		const currentPct      = userVehicle.remainingFuel ?? 100;
		const currentMinutes  = (currentPct / 100) * specs.maxTime;

		if (minutesUsed > currentMinutes) {
			return {
				success:      false,
				maxTime:      Math.floor(currentMinutes),
				message:      `Not enough fuel — only ${Math.floor(currentMinutes)} min available`,
			};
		}

		const remainingMinutes  = currentMinutes - minutesUsed;
		const remainingPct      = (remainingMinutes / specs.maxTime) * 100;
		const wearAdded         = minutesUsed * specs.wearRate;

		return {
			success:          true,
			minutesUsed,
			remainingMinutes: Math.floor(remainingMinutes),
			remainingPct:     remainingPct.toFixed(1),
			wearAdded:        parseFloat(wearAdded.toFixed(1)),
			message:          `Used ${minutesUsed} min — ${Math.floor(remainingMinutes)} min remaining`,
		};
	}

	static getMaxAvailableTime(userVehicle) {
		const specs = this.getVehicleSpecs(userVehicle.vehicle);
		if (!specs) return 0;
		const currentPct = userVehicle.remainingFuel ?? 0;
		return Math.floor((currentPct / 100) * specs.maxTime);
	}
}

const TripCalculatorComponent = ({ vehicle, onTripComplete }) => {
	const [minutes, setMinutes]   = useState("");
	const [result, setResult]     = useState(null);
	const [loading, setLoading]   = useState(false);

	const specs        = TripCalculator.getVehicleSpecs(vehicle.vehicle);
	const maxAvailable = TripCalculator.getMaxAvailableTime(vehicle);
	const isAircraft   = AIRCRAFT_TYPES.has(specs?.type);

	const handleCalculate = () => {
		const mins = parseFloat(minutes);
		if (!mins || mins <= 0) {
			toast.error("Enter a valid duration in minutes");
			return;
		}
		if (mins > maxAvailable) {
			toast.error(`Exceeds available time (${maxAvailable} min)`);
			return;
		}
		setLoading(true);
		setTimeout(() => {
			setResult(TripCalculator.calculateTrip(vehicle, mins));
			setLoading(false);
		}, 400);
	};

	const handleConfirm = () => {
		if (!result?.success) return;
		onTripComplete({
			vehicleId:      vehicle._id,
			newEnergyLevel: Math.max(0, parseFloat(result.remainingPct)),
			minutesUsed:    result.minutesUsed,
			wearAdded:      result.wearAdded,
		});
		toast.success("Deployment logged.");
		setResult(null);
		setMinutes("");
	};

	return (
		<div className='p-4 bg-blk/50 rounded-lg'>
			<h3 className='text-lg font-semibold mb-4 text-fontz'>
				{isAircraft ? "Sortie Planner" : "Trip Calculator"} — {vehicle.nickname || vehicle.nickName}
			</h3>

			<div className='mb-4'>
				<p className='text-sm text-gray-400 mb-2'>
					Fuel: {vehicle.remainingFuel ?? 100}% &nbsp;|&nbsp; Available: {maxAvailable} / {specs?.maxTime ?? "?"} min
				</p>

				<div className='text-xs text-gray-500 mb-2 p-2 bg-blk rounded'>
					<strong>{vehicle.vehicle}</strong> &nbsp;·&nbsp; {specs?.type}
					<br />
					Max op. time: {specs?.maxTime} min &nbsp;|&nbsp; Wear rate: {specs?.wearRate}%/min
				</div>

				<div className='flex gap-2'>
					<input
						type='number'
						placeholder={`Duration (min, max ${maxAvailable})`}
						value={minutes}
						onChange={(e) => setMinutes(e.target.value)}
						className='flex-1 p-2 rounded bg-blk/50 text-white border border-lines'
						min='1'
						max={maxAvailable}
					/>
					<Button onClick={handleCalculate} disabled={loading || !minutes} className='btn'>
						{loading ? "Calculating…" : "Calculate"}
					</Button>
				</div>
			</div>

			{result && (
				<div className={`p-3 rounded-lg mb-3 ${result.success ? "bg-highlight/50" : "bg-red-900"}`}>
					<p className='font-semibold mb-2 text-white'>{result.message}</p>

					{result.success ? (
						<div className='text-sm space-y-1 text-white'>
							<p>Time used: <span className='font-mono'>{result.minutesUsed} min</span></p>
							<p>Fuel remaining: <span className='font-mono'>{result.remainingPct}%</span> ({result.remainingMinutes} min left)</p>
							<p>Wear added: <span className='font-mono'>+{result.wearAdded}%</span></p>
						</div>
					) : (
						<div className='text-sm text-white'>
							<p>Max available: <span className='font-mono'>{result.maxTime} min</span></p>
						</div>
					)}

					{result.success && (
						<div className='mt-3 flex gap-2'>
							<Button onClick={handleConfirm} className='btn' size='sm'>
								Confirm
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
		_id:          PropTypes.string.isRequired,
		nickname:     PropTypes.string,
		nickName:     PropTypes.string,
		vehicle:      PropTypes.string.isRequired,
		remainingFuel: PropTypes.number,
	}).isRequired,
	onTripComplete: PropTypes.func.isRequired,
};

export { TripCalculator, TripCalculatorComponent };
