// ─────────────────────────────────────────────────────────────────────────────
// api/missions.api.js
// All API calls related to missions, phases, and AAR.
// ─────────────────────────────────────────────────────────────────────────────

import api from "./ApiClient";

// ─── Mission CRUD ─────────────────────────────────────────────────────────────

// Get all missions (lightweight list)
export const getMissions = async () => {
	try {
		const response = await api.get("/missions");
		return response.data;
	} catch (error) {
		console.error("ERROR fetching missions:", error);
		return [];
	}
};

// Get single mission with full data including phases and AAR
export const getMissionById = async (id) => {
	try {
		const response = await api.get(`/missions/${id}`);
		return response.data; // { mission }
	} catch (error) {
		console.error("ERROR fetching mission:", error);
		throw error;
	}
};

// Create a new mission — only name required
export const createMission = async (name) => {
	try {
		const response = await api.post("/missions", { name });
		return response.data; // { message, mission }
	} catch (error) {
		console.error("ERROR creating mission:", error);
		throw error;
	}
};

// Update mission fields — generator, briefingText, status, province, biome,
// missionType, notes, aar. Backend whitelists via $set.
export const updateMission = async (id, patch) => {
	try {
		const response = await api.put(`/missions/${id}`, patch);
		return response.data; // { message, mission }
	} catch (error) {
		console.error("ERROR updating mission:", error);
		throw error;
	}
};

// Delete a mission
export const deleteMission = async (id) => {
	try {
		const response = await api.delete(`/missions/${id}`);
		return response.data;
	} catch (error) {
		console.error("ERROR deleting mission:", error);
		throw error;
	}
};

// ─── Convenience update helpers ───────────────────────────────────────────────

export const updateMissionStatus = async (id, status) =>
	updateMission(id, { status });

export const updateMissionNotes = async (id, notes) =>
	updateMission(id, { notes });

export const updateMissionGenerator = async (id, generator, province, biome) =>
	updateMission(id, { generator, province, biome });

export const updateMissionBriefing = async (id, briefingText) =>
	updateMission(id, { briefingText });

// ─── Phase reports ────────────────────────────────────────────────────────────

// Append a completed phase debrief to a mission.
// payload: phase object from PhaseReportSheet
// Returns: { message, phase, campaignPhases?, missionStatus }
export const addPhase = async (missionId, payload) => {
	try {
		const response = await api.post(`/missions/${missionId}/phases`, payload);
		return response.data; // { message, phase, campaignPhases (AI missions only), missionStatus }
	} catch (error) {
		console.error("ERROR saving phase:", error);
		throw error;
	}
};

// Delete a specific phase from a mission
export const deletePhase = async (missionId, phaseId) => {
	try {
		const response = await api.delete(
			`/missions/${missionId}/phases/${phaseId}`,
		);
		return response.data; // { message }
	} catch (error) {
		console.error("ERROR deleting phase:", error);
		throw error;
	}
};

// ─── AAR ─────────────────────────────────────────────────────────────────────

// Save generated AAR text to the mission document.
// Called after generateAAR() returns successfully in AARSheet.
export const saveAAR = async (missionId, aarText) => {
	try {
		const response = await api.put(`/missions/${missionId}`, { aar: aarText });
		return response.data; // { message, mission }
	} catch (error) {
		console.error("ERROR saving AAR:", error);
		throw error;
	}
};
