import { create } from "zustand";

const useSheetStore = create((set) => ({
	openSheet: null,
	setOpenSheet: (side) => set({ openSheet: side }),
	closeSheet: () => set({ openSheet: null }),
}));
export default useSheetStore;
