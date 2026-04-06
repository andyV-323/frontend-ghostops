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

	setActiveMission: (mission) => set({ activeMission: mission }),
	clearActiveMission: () => set({ activeMission: null }),

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

	// Generic field patch — used by all helpers below
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

	// Standard random/ops mission generator save
	saveMissionGenerator: async (missionId, generator, province, biome) => {
		await get().updateMission(missionId, { generator, province, biome });
	},

	saveMissionBriefing: async (missionId, briefingText) => {
		await get().updateMission(missionId, { briefingText });
	},

	// ── AI mission generator save ─────────────────────────────────────────────
	// Called when AIMissionGenerator produces output.
	// Saves everything in one write: standard generator fields + AI campaign fields.
	//
	// payload shape from AIMissionGenerator.onGenerateAI():
	//   operationName, narrative, opType, aiGenerated, campaignPhases,
	//   operationStructure, friendlyConcerns, exfilPlan,
	//   selectedProvince, biome, bounds, imgURL, missionType,
	//   briefing, infilPoint, exfilPoint, rallyPoint, infilMethod, exfilMethod, approachVector

	saveMissionGeneratorAI: async (missionId, payload) => {
		if (!missionId) return;

		const patch = {
			// Standard fields — same as saveMissionGenerator
			province: payload.selectedProvince,
			biome: payload.biome,
			briefingText: payload.briefing,

			// Generator sub-doc — first phase drives the top-level generator
			generator: {
				generationMode: "ai",
				selectedLocations: payload.randomSelection ?? [],
				mapBounds: payload.bounds,
				imgURL: payload.imgURL,
				missionType: payload.missionType,
				infilPoint: payload.infilPoint,
				exfilPoint: payload.exfilPoint,
				rallyPoint: payload.rallyPoint,
				infilMethod: payload.infilMethod,
				exfilMethod: payload.exfilMethod,
				approachVector: payload.approachVector,
			},

			// AI campaign fields
			aiGenerated: true,
			opType: payload.opType,
			operationNarrative: payload.narrative,
			campaignPhases: payload.campaignPhases,
			operationStructure: payload.operationStructure,
			friendlyConcerns: payload.friendlyConcerns,
			exfilPlan: payload.exfilPlan,
		};

		await get().updateMission(missionId, patch);
	},

	// ─── Phase reports ─────────────────────────────────────────────────────────

	addPhase: async (missionId, payload) => {
		if (!missionId) return;
		try {
			const result = await MissionsApi.addPhase(missionId, payload);
			const { phase, campaignPhases, missionStatus } = result;

			set((state) => {
				const updatedActiveMission =
					state.activeMission?._id === missionId ?
						{
							...state.activeMission,
							phases: [...(state.activeMission.phases ?? []), phase],
							// Update campaign phases unlock state if returned from server
							...(campaignPhases ? { campaignPhases } : {}),
							// Update mission status if final phase was completed
							...(missionStatus ? { status: missionStatus } : {}),
						}
					:	state.activeMission;

				const updatedMissions = state.missions.map((m) =>
					m._id === missionId ?
						{
							...m,
							phases: [...(m.phases ?? []), phase],
							...(missionStatus ? { status: missionStatus } : {}),
						}
					:	m,
				);

				return {
					activeMission: updatedActiveMission,
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
