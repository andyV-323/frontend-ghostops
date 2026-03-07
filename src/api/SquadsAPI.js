// squadsApi.js — all API calls related to squads

import api from "./ApiClient";

// Get all squads + shared enablers/aviation pool
export const getSquads = async () => {
	try {
		const response = await api.get("/squads");
		return response.data; // { squads, enablers, aviation }
	} catch (error) {
		console.error("ERROR fetching squads from API:", error);
		return { squads: [], enablers: [], aviation: [] };
	}
};

// Get a single squad by ID
export const getSquadById = async (id) => api.get(`/squads/${id}`);

// Create a new squad
export const createSquad = async (name) => api.post("/squads", { name });

// Rename / update a squad
export const updateSquad = async (id, data) => api.put(`/squads/${id}`, data);

// Delete a squad
export const deleteSquad = async (id) => api.delete(`/squads/${id}`);
