import { create } from "zustand";
import { OperatorsApi } from "@/api";
import { toast } from "react-toastify";

const defaultOperator = {
	createdBy: "",
	name: "",
	callSign: "",
	sf: "",
	nationality: "",
	rank: "",
	class: "",
	gear: "",
	secondaryClass: "",
	secondaryGear: "",
	status: "Active",
	primaryWeapon1: "",
	primaryname: "",
	sidearm1: "",
	secondaryWeapon1: "",
	secondaryname: "",
	primaryWeapon2: "",
	primaryname2: "",
	sidearm2: "",
	secondaryWeapon2: "",
	secondaryname2: "",
	image: "",
	bio: "",
	// ADD THESE MISSING FIELDS:
	specialist: false,
	specialization: "",
};

const useOperatorsStore = create((set, get) => ({
	operators: [],
	activeClasses: {}, // Track active class for each operator
	selectedOperator: null,
	loading: false,

	// Fetch operators from the API
	fetchOperators: async () => {
		try {
			const data = await OperatorsApi.getOperators();
			console.log("Fetched operators:", data); // DEBUG: Check what data is returned
			set({ operators: data });
		} catch (error) {
			console.error("ERROR fetching operators:", error);
			set({ operators: [] });
		}
	},

	initializeNewOperator: () => {
		set({ selectedOperator: { ...defaultOperator } });
	},

	// Create new operator
	createOperator: async (operatorData) => {
		try {
			console.log("Creating operator with data:", operatorData); // DEBUG: Check what's being sent
			await OperatorsApi.createOperator(operatorData);
			toast.success("Operator created successfully!");
			await get().fetchOperators(); // Make sure this completes before continuing
		} catch (error) {
			console.error("ERROR creating operator:", error);
			toast.error("Failed to create operator.");
			toast.warn("Please fill in all required fields");
		}
	},

	// Set selected operator
	setSelectedOperator: (operatorId) => set({ selectedOperator: operatorId }),

	// Set clicked operator
	setClickedOperator: (operator) => set({ selectedOperator: operator }),

	// Toggle between primary and secondary class
	toggleClass: (operatorId, primaryClass, secondaryClass) => {
		set((state) => {
			if (!secondaryClass) return state;
			const currentClass = state.activeClasses[operatorId] || primaryClass;
			let newClass;
			if (primaryClass === secondaryClass) {
				// Special case: both classes are the same
				newClass =
					currentClass === `${primaryClass}-1`
						? `${primaryClass}-2`
						: `${primaryClass}-1`;
			} else {
				newClass =
					currentClass === primaryClass ? secondaryClass : primaryClass;
			}
			return {
				activeClasses: { ...state.activeClasses, [operatorId]: newClass },
				selectedClass: newClass,
			};
		});
	},

	// Fetch a single operator by ID
	fetchOperatorById: async (operatorId) => {
		if (!operatorId) return;
		set({ loading: true });
		try {
			const response = await OperatorsApi.getOperatorById(operatorId);
			set({ selectedOperator: response.data, loading: false });
		} catch (error) {
			console.error("Error fetching operator:", error);
			set({ selectedOperator: null, loading: false });
		}
	},

	// Update an operator
	updateOperator: async (operatorId, updatedData) => {
		if (!operatorId) return;
		try {
			console.log("Updating operator with data:", updatedData); // DEBUG
			await OperatorsApi.updateOperator(operatorId, updatedData);
			toast.success("Operator updated successfully!");
			await get().fetchOperators(); // Refresh operators list
		} catch (error) {
			console.error("ERROR updating operator:", error);
			toast.error("Failed to update operator.");
		}
	},

	// Delete an operator
	deleteOperator: async (operatorId) => {
		if (!operatorId) return;
		try {
			await OperatorsApi.deleteOperator(operatorId);
			toast.success("Operator deleted successfully!");
			await get().fetchOperators(); // Refresh operator list
		} catch (error) {
			console.error("ERROR deleting operator:", error);
		}
	},

	// Reset store
	resetOperatorsStore: () =>
		set({ operators: [], activeClasses: {}, selectedOperator: null }),
}));

export default useOperatorsStore;
