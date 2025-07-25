import { useEffect } from "react";
import { Button } from "@material-tailwind/react";
import { toast } from "react-toastify";
import { useSheetStore, useVehicleStore } from "@/zustand";
import { GARAGE, CONDITION } from "@/config";
import { PropTypes } from "prop-types";

const EditVehicleForm = ({ vehicleId }) => {
	const {
		updateVehicle,
		loading,
		selectedVehicle,
		setSelectedVehicle,
		vehicles,
	} = useVehicleStore();
	const { closeSheet } = useSheetStore();

	// Load existing vehicle data when component mounts
	useEffect(() => {
		if (vehicleId && vehicles.length > 0) {
			const vehicleToEdit = vehicles.find((v) => v._id === vehicleId);
			if (vehicleToEdit) {
				setSelectedVehicle({
					...vehicleToEdit,
					// Ensure all fields are present
					nickname: vehicleToEdit.nickname || vehicleToEdit.nickName || "",
					vehicle: vehicleToEdit.vehicle || "",
					condition: vehicleToEdit.condition || "",
					remainingFuel: vehicleToEdit.remainingFuel || 100,
				});
			}
		}
	}, [vehicleId, vehicles, setSelectedVehicle]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setSelectedVehicle({
			...selectedVehicle,
			[name]: value,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validation
		if (
			!selectedVehicle.vehicle ||
			!selectedVehicle.nickname ||
			!selectedVehicle.condition
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		// Update the vehicle
		await updateVehicle(vehicleId, selectedVehicle);

		// Close the form/sheet after successful update
		closeSheet();
	};

	// Show Loading State
	if (loading) {
		return (
			<div className='text-center text-gray-400 p-4'>Updating vehicle...</div>
		);
	}

	return (
		<section className='bg-transparent'>
			<div className='py-8 px-4 mx-auto max-w-2xl lg:py-16'>
				<h2 className='text-xl font-semibold mb-4'>Update Vehicle</h2>
				<form onSubmit={handleSubmit}>
					<div>
						<label>Vehicle</label>
						<select
							className='form'
							value={selectedVehicle?.vehicle || ""}
							name='vehicle'
							onChange={handleChange}
							required>
							<option value=''>Select Vehicle</option>
							{GARAGE.map((vehicle) => (
								<option
									key={vehicle.name}
									value={vehicle.name}>
									{vehicle.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label>Nickname</label>
						<input
							type='text'
							name='nickname'
							className='form'
							placeholder='Nickname'
							value={selectedVehicle?.nickname || ""}
							onChange={handleChange}
							required
						/>
					</div>

					<div>
						<label>Vehicle Condition</label>
						<select
							className='form'
							value={selectedVehicle?.condition || ""}
							name='condition'
							onChange={handleChange}
							required>
							<option value=''>Select condition</option>
							{CONDITION.map((condition) => (
								<option
									key={condition.name}
									value={condition.name}>
									{condition.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label>Remaining Fuel (%)</label>
						<input
							type='number'
							name='remainingFuel'
							className='form'
							placeholder='Fuel Level'
							value={selectedVehicle?.remainingFuel || ""}
							onChange={handleChange}
							min='0'
							max='100'
							step='1'
						/>
					</div>

					<div className='flex gap-2'>
						<Button
							type='submit'
							className='btn mt-4'
							disabled={loading}>
							{loading ? "Updating..." : "Update Vehicle"}
						</Button>

						<Button
							type='button'
							variant='outlined'
							className='mt-4'
							onClick={closeSheet}>
							Cancel
						</Button>
					</div>
				</form>
			</div>
		</section>
	);
};
EditVehicleForm.propTypes = {
	vehicleId: PropTypes.string,
};
export default EditVehicleForm;
