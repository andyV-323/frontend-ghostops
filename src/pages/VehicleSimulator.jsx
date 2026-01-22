import { useState } from "react";
import { SheetSide } from "@/components";
import { Garage } from "@/components/tables";
import { useSheetStore } from "@/zustand";

const VehicleSimulator = () => {
	const [dataUpdated, setDataUpdated] = useState(false);

	const refreshData = () => {
		setDataUpdated((prev) => !prev); // Toggles state to trigger useEffect in children
	};

	const { openSheet, setOpenSheet, closeSheet } = useSheetStore();
	const [sheetContent, setSheetContent] = useState(null);
	const [sheetTitle, setSheetTitle] = useState(null);
	const [sheetDescription, setSheetDescription] = useState(null);

	const handleOpenSheet = (side, content, title, description) => {
		setOpenSheet(side);
		setSheetContent(content);
		setSheetTitle(title);
		setSheetDescription(description);
	};
	return (
		<div className='flex flex-col p-10'>
			<Garage
				dataUpdated={dataUpdated}
				refreshData={refreshData}
				openSheet={handleOpenSheet}
			/>
			{openSheet && (
				<SheetSide
					openSheet={openSheet}
					setOpenSheet={setOpenSheet}
					side={openSheet}
					content={sheetContent}
					title={sheetTitle}
					description={sheetDescription}
					onClose={closeSheet}
				/>
			)}
		</div>
	);
};

export default VehicleSimulator;
