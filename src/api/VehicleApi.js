//This file contains all the API calls related to vehicles

import api from "./ApiClient";

// Get all vehicles
export const getVehicles = async () => {
	try {
		const response = await api.get("/vehicles");
		return response.data;
	} catch (error) {
		console.error("ERROR fetching vehicles from API:", error);
		return [];
	}
};

// Get vehicle by ID
export const getVehicleById = async (id) => api.get(`/vehicles/${id}`);

// Create a new vehicle
export const createVehicle = async (vehicleData) =>
	api.post("/vehicles", vehicleData);

// Update an existing vehicle
export const updateVehicle = async (id, vehicleData) =>
	api.put(`/vehicles/${id}`, vehicleData);

// Delete an vehicle
export const deleteVehicle = async (id) => api.delete(`/vehicles/${id}`);

// Update Condition
export const updateVehicleCondition = async (vehicleId, condition) => {
	return api.put(`/vehicles/${vehicleId}/condition`, { condition });
};

// Repair a vehicle
export const repairVehicle = async (vehicleId) => {
	try {
		const response = await api.post(`/vehicles/${vehicleId}/repair`);
		return response.data;
	} catch (error) {
		console.error("ERROR repairing vehicle from API:", error);
		throw error;
	}
};

// Refuel a vehicle - NEW FUNCTION
export const refuelVehicle = async (vehicleId, fuelAmount = 25) => {
	try {
		const response = await api.post(`/vehicles/${vehicleId}/refuel`, {
			fuelAmount,
		});
		return response.data;
	} catch (error) {
		console.error("ERROR refueling vehicle from API:", error);
		throw error;
	}
};

// Check vehicle availability - NEW FUNCTION
export const checkVehicleAvailability = async (vehicleId) => {
	try {
		const response = await api.get(`/vehicles/${vehicleId}/availability`);
		return response.data;
	} catch (error) {
		console.error("ERROR checking vehicle availability from API:", error);
		throw error;
	}
};
