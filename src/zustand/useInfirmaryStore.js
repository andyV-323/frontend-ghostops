import { create } from "zustand";
import { InfirmaryApi } from "@/api";
import { useOperatorsStore } from "@/zustand";
import { toast } from "react-toastify";

const useInfirmaryStore = create((set) => ({
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

	// Add a new injured operator (when they get injured)
	addInjuredOperator: (newOperator) => {
		set((state) => ({
			injuredOperators: [...state.injuredOperators, newOperator],
		}));
	},
}));

export default useInfirmaryStore;
