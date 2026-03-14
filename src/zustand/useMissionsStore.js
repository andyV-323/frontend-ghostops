// ─────────────────────────────────────────────────────────────────────────────
// zustand/useMissionsStore.js
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import { MissionsApi } from "@/api";
import { toast } from "react-toastify";

const useMissionsStore = create((set, get) => ({
	missions: [],
	activeMission: null,
	loading: false,

	// ─── Mission CRUD ──────────────────────────────────────────────────────────

	fetchMissions: async () => {
		try {
			const data = await MissionsApi.getMissions();
			set({ missions: data });
		} catch (error) {
			console.error("ERROR fetching missions:", error);
			set({ missions: [] });
		}
	},

	loadMission: async (missionId) => {
		if (!missionId) return;
		set({ loading: true });
		try {
			const { mission } = await MissionsApi.getMissionById(missionId);
			set({ activeMission: mission, loading: false });
		} catch (error) {
			console.error("ERROR loading mission:", error);
			set({ activeMission: null, loading: false });
			toast.error("Failed to load mission.");
		}
	},

	setActiveMission: (mission) => {
		set({ activeMission: mission });
	},

	clearActiveMission: () => {
		set({ activeMission: null });
	},

	createMission: async (name) => {
		try {
			const { mission } = await MissionsApi.createMission(name);
			set((state) => ({
				missions: [mission, ...state.missions],
				activeMission: mission,
			}));
			toast.success(`${mission.name} created`);
			return mission;
		} catch (error) {
			console.error("ERROR creating mission:", error);
			toast.error(error.response?.data?.message || "Failed to create mission.");
			return null;
		}
	},

	// Generic field patch — used by all convenience helpers below
	updateMission: async (missionId, patch) => {
		if (!missionId) return;
		try {
			const { mission } = await MissionsApi.updateMission(missionId, patch);
			set((state) => ({
				missions: state.missions.map((m) =>
					m._id === missionId ? mission : m,
				),
				activeMission:
					state.activeMission?._id === missionId ?
						{ ...state.activeMission, ...mission }
					:	state.activeMission,
			}));
			return mission;
		} catch (error) {
			console.error("ERROR updating mission:", error);
			toast.error("Failed to update mission.");
		}
	},

	deleteMission: async (missionId) => {
		if (!missionId) return;
		try {
			await MissionsApi.deleteMission(missionId);
			set((state) => ({
				missions: state.missions.filter((m) => m._id !== missionId),
				activeMission:
					state.activeMission?._id === missionId ? null : state.activeMission,
			}));
			toast.success("Mission deleted.");
		} catch (error) {
			console.error("ERROR deleting mission:", error);
			toast.error("Failed to delete mission.");
		}
	},

	// ─── Convenience update helpers ───────────────────────────────────────────

	updateMissionStatus: async (missionId, status) => {
		await get().updateMission(missionId, { status });
	},

	updateMissionNotes: async (missionId, notes) => {
		await get().updateMission(missionId, { notes });
	},

	// Called when MissionGenerator produces output — saves generator data,
	// province, biome, missionType, all points, and briefing in one write.
	saveMissionGenerator: async (missionId, generator, province, biome) => {
		await get().updateMission(missionId, { generator, province, biome });
	},

	// Called separately when briefing text needs updating
	saveMissionBriefing: async (missionId, briefingText) => {
		await get().updateMission(missionId, { briefingText });
	},

	// ─── Phase reports ─────────────────────────────────────────────────────────

	// Append a completed phase debrief — called from PhaseReportSheet onSave()
	// payload: phase object from PhaseReportSheet
	addPhase: async (missionId, payload) => {
		if (!missionId) return;
		try {
			const { phase } = await MissionsApi.addPhase(missionId, payload);

			set((state) => {
				const updatedMission =
					state.activeMission?._id === missionId ?
						{
							...state.activeMission,
							phases: [...(state.activeMission.phases ?? []), phase],
						}
					:	state.activeMission;

				const updatedMissions = state.missions.map((m) =>
					m._id === missionId ?
						{ ...m, phases: [...(m.phases ?? []), phase] }
					:	m,
				);

				return {
					activeMission: updatedMission,
					missions: updatedMissions,
				};
			});

			toast.success(`Phase ${phase.phaseNumber} filed.`);
			return phase;
		} catch (error) {
			console.error("ERROR saving phase:", error);
			toast.error("Failed to save phase report.");
			return null;
		}
	},

	deletePhase: async (missionId, phaseId) => {
		if (!missionId || !phaseId) return;
		try {
			await MissionsApi.deletePhase(missionId, phaseId);

			set((state) => {
				const filter = (phases) =>
					(phases ?? []).filter((p) => p._id !== phaseId);

				return {
					activeMission:
						state.activeMission?._id === missionId ?
							{
								...state.activeMission,
								phases: filter(state.activeMission.phases),
							}
						:	state.activeMission,
					missions: state.missions.map((m) =>
						m._id === missionId ? { ...m, phases: filter(m.phases) } : m,
					),
				};
			});

			toast.success("Phase deleted.");
		} catch (error) {
			console.error("ERROR deleting phase:", error);
			toast.error("Failed to delete phase.");
		}
	},

	// ─── AAR ───────────────────────────────────────────────────────────────────

	// Save generated AAR text to the operation
	saveAAR: async (missionId, aarText) => {
		if (!missionId) return;
		try {
			await get().updateMission(missionId, { aar: aarText });
			toast.success("AAR saved.");
		} catch (error) {
			console.error("ERROR saving AAR:", error);
			toast.error("Failed to save AAR.");
		}
	},

	// ─── Reset ─────────────────────────────────────────────────────────────────

	resetMissionsStore: () =>
		set({
			missions: [],
			activeMission: null,
			loading: false,
		}),
}));

export default useMissionsStore;
