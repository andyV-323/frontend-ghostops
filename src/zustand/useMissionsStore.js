// zustand/useMissionsStore.js
import { create } from "zustand";
import { MissionsApi } from "@/api";
import { toast } from "react-toastify";

const useMissionsStore = create((set, get) => ({
	missions: [],
	activeMission: null, // the currently loaded/playing mission
	intelAssessment: null, // computed from activeMission.reconReports
	loading: false,

	// ─── Mission CRUD ──────────────────────────────────────────

	fetchMissions: async () => {
		try {
			const data = await MissionsApi.getMissions();
			set({ missions: data });
		} catch (error) {
			console.error("ERROR fetching missions:", error);
			set({ missions: [] });
		}
	},

	// Load a mission as the active mission — fetches full data including intelAssessment
	loadMission: async (missionId) => {
		if (!missionId) return;
		set({ loading: true });
		try {
			const { mission, intelAssessment } =
				await MissionsApi.getMissionById(missionId);
			set({ activeMission: mission, intelAssessment, loading: false });
		} catch (error) {
			console.error("ERROR loading mission:", error);
			set({ activeMission: null, intelAssessment: null, loading: false });
			toast.error("Failed to load mission.");
		}
	},

	// Set active mission directly from the list (lightweight — no refetch)
	setActiveMission: (mission) => {
		set({ activeMission: mission, intelAssessment: null });
	},

	clearActiveMission: () => {
		set({ activeMission: null, intelAssessment: null });
	},

	createMission: async (name) => {
		try {
			const { mission } = await MissionsApi.createMission(name);
			// Optimistically add to list and set as active
			set((state) => ({
				missions: [mission, ...state.missions],
				activeMission: mission,
				intelAssessment: null,
			}));
			toast.success(`${mission.name} created`);
			return mission;
		} catch (error) {
			console.error("ERROR creating mission:", error);
			toast.error(error.response?.data?.message || "Failed to create mission.");
			return null;
		}
	},

	// Generic field patch — used by all the convenience helpers below
	updateMission: async (missionId, patch) => {
		if (!missionId) return;
		try {
			const { mission } = await MissionsApi.updateMission(missionId, patch);
			// Update in list
			set((state) => ({
				missions: state.missions.map((m) =>
					m._id === missionId ? mission : m,
				),
				// If this is the active mission, keep it in sync
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
				intelAssessment:
					state.activeMission?._id === missionId ? null : state.intelAssessment,
			}));
			toast.success("Mission deleted.");
		} catch (error) {
			console.error("ERROR deleting mission:", error);
			toast.error("Failed to delete mission.");
		}
	},

	// ─── Convenience update helpers ───────────────────────────

	updateMissionStatus: async (missionId, status) => {
		await get().updateMission(missionId, { status });
	},

	updateMissionNotes: async (missionId, notes) => {
		await get().updateMission(missionId, { notes });
	},

	// Called when MissionGenerator produces output
	saveMissionGenerator: async (missionId, generator, province, biome) => {
		await get().updateMission(missionId, { generator, province, biome });
	},

	// Called when AI briefing is generated
	saveMissionBriefing: async (missionId, briefingText) => {
		await get().updateMission(missionId, { briefingText });
	},

	// ─── Recon reports ─────────────────────────────────────────

	// Append a completed recon debrief — called from ReconTool onComplete()
	// payload: { reconType, answers, modifiers }
	addReconReport: async (missionId, payload) => {
		if (!missionId) return;
		try {
			const { report, intelAssessment, totalReports } =
				await MissionsApi.addReconReport(missionId, payload);

			// Append report to active mission and update intel assessment
			set((state) => {
				const updatedMission =
					state.activeMission?._id === missionId ?
						{
							...state.activeMission,
							reconReports: [
								...(state.activeMission.reconReports || []),
								report,
							],
						}
					:	state.activeMission;

				// Also bump the report count on the list entry
				const updatedMissions = state.missions.map((m) =>
					m._id === missionId ?
						{ ...m, reconReports: Array(totalReports).fill(null) } // list only needs count
					:	m,
				);

				return {
					activeMission: updatedMission,
					intelAssessment: intelAssessment,
					missions: updatedMissions,
				};
			});

			toast.success("Recon report saved.");
			return report;
		} catch (error) {
			console.error("ERROR saving recon report:", error);
			toast.error("Failed to save recon report.");
			return null;
		}
	},

	deleteReconReport: async (missionId, reportId) => {
		if (!missionId || !reportId) return;
		try {
			const { intelAssessment, totalReports } =
				await MissionsApi.deleteReconReport(missionId, reportId);

			set((state) => {
				const updatedMission =
					state.activeMission?._id === missionId ?
						{
							...state.activeMission,
							reconReports: state.activeMission.reconReports.filter(
								(r) => r._id !== reportId,
							),
						}
					:	state.activeMission;

				const updatedMissions = state.missions.map((m) =>
					m._id === missionId ?
						{ ...m, reconReports: Array(totalReports).fill(null) }
					:	m,
				);

				return {
					activeMission: updatedMission,
					intelAssessment: intelAssessment ?? null,
					missions: updatedMissions,
				};
			});

			toast.success("Recon report deleted.");
		} catch (error) {
			console.error("ERROR deleting recon report:", error);
			toast.error("Failed to delete recon report.");
		}
	},

	// ─── Intel assessment ──────────────────────────────────────

	// Fetch fresh intel assessment — called before generating AI briefing
	refreshIntelAssessment: async (missionId) => {
		if (!missionId) return null;
		try {
			const { intelAssessment } =
				await MissionsApi.getIntelAssessment(missionId);
			set({ intelAssessment });
			return intelAssessment;
		} catch (error) {
			console.error("ERROR fetching intel assessment:", error);
			return null;
		}
	},

	// ─── Reset ────────────────────────────────────────────────

	resetMissionsStore: () =>
		set({
			missions: [],
			activeMission: null,
			intelAssessment: null,
			loading: false,
		}),
}));

export default useMissionsStore;
