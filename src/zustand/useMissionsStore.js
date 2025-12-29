// zustand/useMissionsStore.js
import { create } from "zustand";
import { MissionsApi } from "@/api";
import { toast } from "react-toastify";

const useMissionsStore = create((set, get) => ({
	missions: [],
	selectedMission: null,
	loading: false,

	// Fetch missions from the API
	fetchMissions: async () => {
		try {
			const data = await MissionsApi.getMissions();
			set({ missions: data });
		} catch (error) {
			console.error("ERROR fetching missions:", error);
			set({ missions: [] });
		}
	},

	// Set selected mission - accepts mission object or ID string
	setSelectedMission: (missionOrId) => {
		// If it's a string, treat it as an ID and find the mission
		if (typeof missionOrId === "string") {
			const mission = get().missions.find((m) => m._id === missionOrId);
			set({ selectedMission: mission || null });
		} else {
			// Otherwise, it's a mission object
			set({ selectedMission: missionOrId });
		}
	},

	// Create new mission
	createMission: async (missionData) => {
		try {
			await MissionsApi.createMission(missionData);
			toast.success("Mission created successfully!");
			await get().fetchMissions();
		} catch (error) {
			console.error("ERROR creating mission:", error);
			console.error("Error response:", error.response?.data);
			console.error("Error status:", error.response?.status);
			toast.error(error.response?.data?.message || "Failed to create mission.");
		}
	},

	// Fetch a single mission by ID
	fetchMissionById: async (missionId) => {
		if (!missionId) return;
		set({ loading: true });
		try {
			const response = await MissionsApi.getMissionById(missionId);
			set({ selectedMission: response.data, loading: false });
		} catch (error) {
			console.error("Error fetching mission:", error);
			set({ selectedMission: null, loading: false });
		}
	},

	// Update a mission
	updateMission: async (missionId, updatedData) => {
		if (!missionId) return;
		try {
			await MissionsApi.updateMission(missionId, updatedData);
			toast.success("Mission updated successfully!");
			await get().fetchMissions();
		} catch (error) {
			console.error("ERROR updating mission:", error);
			toast.error("Failed to update mission.");
		}
	},

	// Delete a mission
	deleteMission: async (missionId) => {
		if (!missionId) return;
		try {
			await MissionsApi.deleteMission(missionId);
			toast.success("Mission deleted successfully!");
			await get().fetchMissions();
		} catch (error) {
			console.error("ERROR deleting mission:", error);
			toast.error("Failed to delete mission.");
		}
	},

	// Update mission status
	updateMissionStatus: async (missionId, status) => {
		if (!missionId) return;
		try {
			await MissionsApi.updateMissionStatus(missionId, status);
			toast.success("Mission status updated!");
			await get().fetchMissions();
		} catch (error) {
			console.error("ERROR updating mission status:", error);
			toast.error("Failed to update mission status.");
		}
	},

	// Update mission notes
	updateMissionNotes: async (missionId, notes) => {
		if (!missionId) return;
		try {
			await MissionsApi.updateMissionNotes(missionId, notes);
			toast.success("Mission notes updated!");
			await get().fetchMissions();
		} catch (error) {
			console.error("ERROR updating mission notes:", error);
			toast.error("Failed to update mission notes.");
		}
	},

	// Add team to mission
	addTeamToMission: async (missionId, teamId) => {
		try {
			const mission = get().missions.find((m) => m._id === missionId);
			if (!mission) return null;

			const updatedTeams = [
				...(mission.teams || []).map((t) => t._id || t),
				teamId,
			];
			await get().updateMission(missionId, {
				...mission,
				teams: updatedTeams,
			});
		} catch (error) {
			console.error("Error adding team to mission:", error);
			toast.error("Failed to add team to mission.");
		}
	},

	// Remove team from mission
	removeTeamFromMission: async (missionId, teamId) => {
		try {
			const mission = get().missions.find((m) => m._id === missionId);
			if (!mission) return null;

			const updatedTeams = (mission.teams || [])
				.map((t) => t._id || t)
				.filter((id) => id !== teamId);

			await get().updateMission(missionId, {
				...mission,
				teams: updatedTeams,
			});
		} catch (error) {
			console.error("Error removing team from mission:", error);
			toast.error("Failed to remove team from mission.");
		}
	},

	// Reset store
	resetMissionsStore: () =>
		set({ missions: [], selectedMission: null, loading: false }),
}));

export default useMissionsStore;
