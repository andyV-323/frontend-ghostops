import { create } from "zustand";
import { MemorialApi } from "@/api";
import { useOperatorsStore } from "@/zustand";
import { toast } from "react-toastify";

const useMemorialStore = create((set) => ({
	KIAOperators: [],

	// Fetch all KIA operators
	fetchKIAOperators: async () => {
		try {
			const data = await MemorialApi.getMemorialOperators();
			set({ KIAOperators: data });
		} catch (error) {
			console.error("ERROR fetching KIA operators:", error);
		}
	},
	// Revive an operator and remove from Memorial
	reviveOperator: async (operatorId) => {
		try {
			await MemorialApi.reviveOperator(operatorId);
			toast.success("Operator has been revived");
			set((state) => ({
				KIAOperators: state.KIAOperators.filter((op) => op._id !== operatorId),
			}));
			useOperatorsStore.getState().fetchOperators();
		} catch (error) {
			console.error("ERROR reviving operator:", error);
		}
	},
	// Add an operator to Memorial
	addKIAOperator: (newOperator) => {
		set((state) => ({
			KIAOperators: [...state.KIAOperators, newOperator],
		}));
	},
}));

export default useMemorialStore;
