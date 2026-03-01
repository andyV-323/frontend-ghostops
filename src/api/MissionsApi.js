// api/missions.api.js
// All API calls related to missions

import api from "./ApiClient";

// ─── Mission CRUD ─────────────────────────────────────────────

// Get all missions (lightweight list — no briefingText or recon details)
export const getMissions = async () => {
	try {
		const response = await api.get("/missions");
		return response.data;
	} catch (error) {
		console.error("ERROR fetching missions:", error);
		return [];
	}
};

// Get single mission with full data + intelAssessment
export const getMissionById = async (id) => {
	try {
		const response = await api.get(`/missions/${id}`);
		return response.data; // { mission, intelAssessment }
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

// Update mission fields — generator, briefingText, status, province, biome, notes
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

// ─── Convenience update helpers ───────────────────────────────
// These all call updateMission under the hood — no separate backend routes needed
// since the controller whitelists individual fields via $set

export const updateMissionStatus = async (id, status) =>
	updateMission(id, { status });

export const updateMissionNotes = async (id, notes) =>
	updateMission(id, { notes });

export const updateMissionGenerator = async (id, generator, province, biome) =>
	updateMission(id, { generator, province, biome });

export const updateMissionBriefing = async (id, briefingText) =>
	updateMission(id, { briefingText });

// ─── Recon reports ────────────────────────────────────────────

// Append a completed recon debrief to a mission
// payload: { reconType, answers, modifiers }
export const addReconReport = async (missionId, payload) => {
	try {
		const response = await api.post(`/missions/${missionId}/recon`, payload);
		return response.data; // { message, report, intelAssessment, totalReports }
	} catch (error) {
		console.error("ERROR saving recon report:", error);
		throw error;
	}
};

// Delete a specific recon report from a mission
export const deleteReconReport = async (missionId, reportId) => {
	try {
		const response = await api.delete(
			`/missions/${missionId}/recon/${reportId}`,
		);
		return response.data; // { message, intelAssessment, totalReports }
	} catch (error) {
		console.error("ERROR deleting recon report:", error);
		throw error;
	}
};

// ─── Intel assessment ─────────────────────────────────────────

// Get computed intel assessment from all recon reports on a mission
// Used before generating the AI briefing to build prompt context
export const getIntelAssessment = async (missionId) => {
	try {
		const response = await api.get(`/missions/${missionId}/intel`);
		return response.data; // { mission, intelAssessment }
	} catch (error) {
		console.error("ERROR fetching intel assessment:", error);
		throw error;
	}
};
