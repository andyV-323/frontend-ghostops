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

// Repair a vehicle - NEW FUNCTION
export const repairVehicle = async (vehicleId) => {
	try {
		const response = await api.post(`/vehicles/${vehicleId}/repair`);
		return response.data;
	} catch (error) {
		console.error("ERROR repairing vehicle from API:", error);
		throw error;
	}
};
