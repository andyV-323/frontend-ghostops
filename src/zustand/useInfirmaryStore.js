import { create } from "zustand";
import { InfirmaryApi } from "@/api";
import { useOperatorsStore } from "@/zustand";
import { toast } from "react-toastify";

const useInfirmaryStore = create((set, get) => ({
	injuredOperators: [],

	// Fetch all injured operators
	fetchInjuredOperators: async () => {
		try {
			const data = await InfirmaryApi.getInjuredOperators();
			set({ injuredOperators: data });
		} catch (error) {
			console.error("ERROR fetching injured operators:", error);
		}
	},

	// Recover an operator and remove them from the infirmary
	recoverOperator: async (operatorId) => {
		try {
			await InfirmaryApi.recoverOperator(operatorId);
			toast.success("Operator Recovered");
			set((state) => ({
				injuredOperators: state.injuredOperators.filter(
					(op) => op._id !== operatorId
				),
			}));

			// Fetch updated operators to update the Roster
			useOperatorsStore.getState().fetchOperators();
		} catch (error) {
			console.error("ERROR recovering operator:", error);
		}
	},

	// Recover all injured operators at once
	recoverAll: async () => {
		const { injuredOperators } = get();
		if (injuredOperators.length === 0) return;
		try {
			await Promise.all(injuredOperators.map((op) => InfirmaryApi.recoverOperator(op._id)));
			set({ injuredOperators: [] });
			toast.success(`${injuredOperators.length} operator${injuredOperators.length !== 1 ? "s" : ""} discharged`);
			useOperatorsStore.getState().fetchOperators();
		} catch (error) {
			console.error("ERROR recovering all operators:", error);
			toast.error("Failed to discharge all operators");
		}
	},

	// Add a new injured operator (when they get injured)
	addInjuredOperator: (newOperator) => {
		set((state) => ({
			injuredOperators: [...state.injuredOperators, newOperator],
		}));
	},
}));

export default useInfirmaryStore;
