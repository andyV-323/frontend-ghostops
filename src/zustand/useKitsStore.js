import { create } from "zustand";
import { KitsApi } from "@/api";
import { toast } from "react-toastify";

const useKitsStore = create((set, get) => ({
	kits:    [],
	loading: false,

	fetchKits: async () => {
		set({ loading: true });
		try {
			const data = await KitsApi.getKits();
			set({ kits: data, loading: false });
		} catch (error) {
			console.error("ERROR fetching kits:", error);
			set({ kits: [], loading: false });
		}
	},

	createKit: async (kitData) => {
		try {
			await KitsApi.createKit(kitData);
			toast.success("Kit created!");
			await get().fetchKits();
		} catch (error) {
			console.error("ERROR creating kit:", error);
			toast.error("Failed to create kit.");
		}
	},

	updateKit: async (kitId, kitData) => {
		try {
			await KitsApi.updateKit(kitId, kitData);
			toast.success("Kit updated!");
			await get().fetchKits();
		} catch (error) {
			console.error("ERROR updating kit:", error);
			toast.error("Failed to update kit.");
		}
	},

	deleteKit: async (kitId) => {
		try {
			await KitsApi.deleteKit(kitId);
			toast.success("Kit deleted!");
			await get().fetchKits();
		} catch (error) {
			console.error("ERROR deleting kit:", error);
			toast.error("Failed to delete kit.");
		}
	},
}));

export default useKitsStore;
