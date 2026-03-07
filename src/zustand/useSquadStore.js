import { create } from "zustand";
import {
	getSquads,
	createSquad,
	updateSquad,
	deleteSquad,
} from "@/api/SquadsAPI";

const useSquadStore = create((set, get) => ({
	squads: [],
	enablers: [],
	aviation: [],
	activeSquadId: null,
	loading: false,
	error: null,

	// ── Fetch all squads + shared pools ───────────────────────
	fetchSquads: async () => {
		set({ loading: true, error: null });
		try {
			const data = await getSquads();
			set({
				squads: data.squads ?? [],
				enablers: data.enablers ?? [],
				aviation: data.aviation ?? [],
			});
		} catch (err) {
			set({ error: err.message });
		} finally {
			set({ loading: false });
		}
	},

	// ── Create squad ──────────────────────────────────────────
	createSquad: async (name) => {
		try {
			const res = await createSquad(name);
			const squad = res.data;
			set((s) => ({ squads: [squad, ...s.squads] }));
			return squad;
		} catch (err) {
			set({ error: err.message });
		}
	},

	// ── Rename squad ──────────────────────────────────────────
	renameSquad: async (squadId, name) => {
		try {
			const res = await updateSquad(squadId, { name });
			const updated = res.data;
			set((s) => ({
				squads: s.squads.map((sq) => (sq._id === squadId ? updated : sq)),
			}));
		} catch (err) {
			set({ error: err.message });
		}
	},

	// ── Delete squad ──────────────────────────────────────────
	deleteSquad: async (squadId) => {
		try {
			await deleteSquad(squadId);
			set((s) => ({
				squads: s.squads.filter((sq) => sq._id !== squadId),
				activeSquadId: s.activeSquadId === squadId ? null : s.activeSquadId,
			}));
		} catch (err) {
			set({ error: err.message });
		}
	},

	// ── Local filter only — no API call ───────────────────────
	setActiveSquadId: (squadId) => set({ activeSquadId: squadId }),
}));

export default useSquadStore;
