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
		set((state) => {
			// Ensure the operator has an ID
			if (!newOperator._id && !newOperator.id) {
				newOperator._id = `memorial-${Date.now()}-${Math.random()
					.toString(36)
					.substr(2, 9)}`;
			}

			// Check for duplicates
			const operatorId = newOperator._id || newOperator.id;
			const exists = state.KIAOperators.some((existing) => {
				const existingId = existing._id || existing.id;
				return existingId === operatorId;
			});

			if (exists) {
				return state;
			}

			// Add to array
			const newKIAOperators = [...state.KIAOperators, newOperator];
			return {
				KIAOperators: newKIAOperators,
			};
		});
	},
}));

export default useMemorialStore;
