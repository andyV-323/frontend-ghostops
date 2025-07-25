import { useEffect } from "react";
import { Button } from "@material-tailwind/react";
import { toast } from "react-toastify";
import { useSheetStore, useVehicleStore } from "@/zustand";
import { GARAGE, CONDITION } from "@/config";

const NewVehicleForm = () => {
	const {
		createVehicle,
		initializeNewVehicle,
		loading,
		selectedVehicle,
		setSelectedVehicle,
	} = useVehicleStore();
	const { closeSheet } = useSheetStore();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setSelectedVehicle({
			...selectedVehicle,
			[name]: value,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault(); // Prevent default form submission

		if (
			!selectedVehicle.vehicle ||
			!selectedVehicle.nickname ||
			!selectedVehicle.condition
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		// Create the vehicle
		await createVehicle(selectedVehicle);

		closeSheet();
	};

	useEffect(() => {
		initializeNewVehicle();
	}, [initializeNewVehicle]);

	if (loading) {
		return (
			<div className='text-center text-gray-400 p-4'>Creating vehicle...</div>
		);
	}
	return (
		<section className='bg-transparent'>
			<div className='py-8 px-4 mx-auto max-w-2xl lg:py-16'>
				<form onSubmit={handleSubmit}>
					{" "}
					{/* Add onSubmit handler */}
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
						<Button
							type='submit'
							className='btn mt-4 ml-2'
							disabled={loading}>
							{loading ? "Creating..." : "Submit"}
						</Button>
					</div>
				</form>
			</div>
		</section>
	);
};

export default NewVehicleForm;
