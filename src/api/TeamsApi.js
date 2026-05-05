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
