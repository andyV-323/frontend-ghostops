import { create } from "zustand";
import { VehicleAPI } from "@/api";
import { toast } from "react-toastify";

const defaultVehicle = {
	createdBy: "",
	nickname: "",
	vehicle: "",
	condition: "",
	repairTime: "",
	remainingFuel: "",
};

const useVehicleStore = create((set, get) => ({
	vehicles: [],
	selectedVehicle: { ...defaultVehicle },
	conditions: {},
	loading: false,

	// Fetch vehicles from the API
	fetchVehicles: async () => {
		try {
			const data = await VehicleAPI.getVehicles();
			set({ vehicles: data });
		} catch (error) {
			console.error("ERROR fetching vehicles:", error);
			set({ vehicles: [] });
		}
	},

	// Create new vehicle
	createVehicle: async (vehicleData) => {
		set({ loading: true });
		try {
			await VehicleAPI.createVehicle(vehicleData);
			toast.success("Vehicle was created successfully!");
			get().fetchVehicles();
			// Reset form after successful creation
			set({ selectedVehicle: { ...defaultVehicle } });
		} catch (error) {
			console.error("ERROR creating vehicle:", error);
			toast.error("Failed to create vehicle.");
			toast.warn("Please fill in all required fields");
		} finally {
			set({ loading: false });
		}
	},

	//Set selected vehicle
	setSelectedVehicle: (vehicleData) => set({ selectedVehicle: vehicleData }),
	initializeNewVehicle: () => {
		set({ selectedVehicle: { ...defaultVehicle } });
	},

	// Update an vehicle
	updateVehicle: async (vehicleId, updatedData) => {
		if (!vehicleId) return;
		try {
			await VehicleAPI.updateVehicle(vehicleId, updatedData);
			toast.success("Vehicle updated successfully!");
			get().fetchVehicles(); // Refresh vehicles list
		} catch (error) {
			console.error("ERROR updating vehicle:", error);
			toast.error("Failed to update vehicle.");
		}
	},

	// Repair a vehicle
	repairVehicle: async (vehicleId) => {
		if (!vehicleId) return;
		try {
			const result = await VehicleAPI.repairVehicle(vehicleId);
			toast.success(
				`Vehicle repair initiated! Estimated time: ${
					result.estimatedRepairTime || 2
				} hours`
			);
			get().fetchVehicles(); // Refresh vehicles list
			return result;
		} catch (error) {
			console.error("ERROR repairing vehicle:", error);
			toast.error("Failed to start vehicle repair.");
			throw error;
		}
	},

	// Delete an vehicle
	deleteVehicle: async (vehicleId) => {
		if (!vehicleId) return;

		try {
			await VehicleAPI.deleteVehicle(vehicleId);
			toast.success("vehicle deleted successfully!");
			get().fetchVehicles(); // Refresh vehicle list
		} catch (error) {
			console.error("ERROR deleting vehicle:", error);
		}
	},

	// Reset store
	resetVehicleStore: () =>
		set({ vehicles: [], selectedVehicle: { ...defaultVehicle } }),
}));

export default useVehicleStore;
