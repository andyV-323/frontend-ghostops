//this file contains all the API calls related to teams

import api from "./ApiClient";

// Get all teams
export const getTeams = async () => {
	try {
		const response = await api.get("/teams");
		return response.data;
	} catch (error) {
		console.error("ERROR fetching operators from API:", error);
		return [];
	}
};

// Get a single team by ID
export const getTeamById = async (id) => api.get(`/teams/${id}`);

// Create a new team
export const createTeam = async (teamData) => api.post("/teams", teamData);

// Update an existing team
export const updateTeam = async (id, teamData) =>
	api.put(`/teams/${id}`, teamData);

// Delete a team
export const deleteTeam = async (id) => api.delete(`/teams/${id}`);

// Attach a team to a main team
export const attachTeam = async (mainTeamId, teamId) =>
	api.post(`/teams/${mainTeamId}/attach`, { teamId });

// Detach a team from a main team
export const detachTeam = async (mainTeamId, attachedTeamId) =>
	api.delete(`/teams/${mainTeamId}/attach/${attachedTeamId}`);

// Move an operator to a specific active slot (1-4) or reserves (slot=null).
// Swaps with the slot's current occupant if it's filled.
export const assignSlot = async (teamId, operatorId, slot) =>
	api.patch(`/teams/${teamId}/assign-slot`, { operatorId, slot });

// Move one position up/down within the reserve order.
export const reorderReserve = async (teamId, operatorId, direction) =>
	api.patch(`/teams/${teamId}/reorder-reserve`, { operatorId, direction });

// Reserve -> active slot. Bumps any current occupant to the front of reserves.
export const promoteReserve = async (teamId, operatorId, slot) =>
	api.patch(`/teams/${teamId}/promote-reserve`, { operatorId, slot });

// Fills the lowest-numbered empty active slot, or reserves if the team is full.
export const addToTeam = async (teamId, operatorId, classUsed) =>
	api.patch(`/teams/${teamId}/add`, { operatorId, classUsed });

//Remove injured or KIA Operator
export const removeOperatorFromTeams = async (operatorId) => {
	try {
		const response = await api.delete(`/teams/removeOperator/${operatorId}`);
		return response.data;
	} catch (error) {
		console.error(
			"ERROR removing operator from teams:",
			error.response?.data || error
		);
		throw error;
	}
};
