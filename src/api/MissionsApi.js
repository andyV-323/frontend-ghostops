// api/missions.api.js
// This file contains all the API calls related to missions

import api from "./ApiClient";

// Get all missions
export const getMissions = async () => {
	try {
		const response = await api.get("/missions");
		return response.data;
	} catch (error) {
		console.error("ERROR fetching missions from API:", error);
		return [];
	}
};

// Get mission by ID
export const getMissionById = async (id) => api.get(`/missions/${id}`);

// Create a new mission
export const createMission = async (missionData) =>
	api.post("/missions", missionData);

// Update an existing mission
export const updateMission = async (id, missionData) =>
	api.put(`/missions/${id}`, missionData);

// Delete a mission
export const deleteMission = async (id) => api.delete(`/missions/${id}`);

// Update mission status
export const updateMissionStatus = async (missionId, status) => {
	return api.put(`/missions/${missionId}/status`, { status });
};

// Update mission notes
export const updateMissionNotes = async (missionId, notes) => {
	try {
		const response = await api.put(`/missions/${missionId}/notes`, { notes });
		return response.data;
	} catch (error) {
		console.error("ERROR updating mission notes:", error);
		throw error;
	}
};
