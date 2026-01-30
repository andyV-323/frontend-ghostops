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
	items: [],
	secondaryClass: "",
	secondaryGear: "",
	status: "Active",
	weaponType: "",
	weapon: "",
	sideArm: "",
	secondaryWeapon1: "",
	secondaryname: "",
	primaryWeapon2: "",
	primaryname2: "",
	sidearm2: "",
	secondaryWeapon2: "",
	secondaryname2: "",
	image: "",
	bio: "",
	support: false,
	aviator: false,
	role: "",
	perks: [],
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
			await OperatorsApi.createOperator(operatorData);
			toast.success("Operator created successfully!");
			await get().fetchOperators(); // Make sure this completes before continuing
		} catch (error) {
			console.error("ERROR creating operator:", error);
			toast.error("Failed to create operator.");
			toast.warn("Please fill in all required fields");
		}
	},

	// Set selected operator - FIXED: accepts operator object or ID string
	setSelectedOperator: (operatorOrId) => {
		// If it's a string, treat it as an ID and find the operator
		if (typeof operatorOrId === "string") {
			const operator = get().operators.find((op) => op._id === operatorOrId);
			set({ selectedOperator: operator || null });
		} else {
			// Otherwise, it's an operator object
			set({ selectedOperator: operatorOrId });
		}
	},

	// Set clicked operator (kept for backwards compatibility)
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
					currentClass === `${primaryClass}-1` ?
						`${primaryClass}-2`
					:	`${primaryClass}-1`;
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
