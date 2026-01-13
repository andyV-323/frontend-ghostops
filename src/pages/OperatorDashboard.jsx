import { useEffect, useState } from "react";
import { SheetSide } from "@/components";
import { Roster, Infirmary, Memorial, Teams } from "@/components/tables";
import { useOperatorsStore, useSheetStore } from "@/zustand";

const OperatorDashboard = () => {
	const { setSelectedOperator, operators, fetchOperators } =
		useOperatorsStore();

	const [setClickedOperator] = useState(null);

	const [dataUpdated, setDataUpdated] = useState(false);
	const refreshData = () => setDataUpdated((prev) => !prev);

	const { openSheet, setOpenSheet, closeSheet } = useSheetStore();
	const [sheetContent, setSheetContent] = useState(null);
	const [sheetTitle, setSheetTitle] = useState(null);
	const [sheetDescription, setSheetDescription] = useState(null);

	useEffect(() => {
		fetchOperators();
	}, [fetchOperators]);

	const handleOpenSheet = (side, content, title, description) => {
		setOpenSheet(side);
		setSheetContent(content);
		setSheetTitle(title);
		setSheetDescription(description);
	};

	// Shared panel styles
	const panelClass =
		"flex-1 min-h-0 overflow-y-auto rounded-3xl shadow-lg shadow-black";
	const panelShadow = { boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" };

	return (
		<div className='bg-transparent flex flex-col flex-grow p-4 min-h-0'>
			{/* GRID fills remaining height */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-4 flex-grow min-h-0'>
				{/* LEFT COLUMN */}
				<div className='flex flex-col gap-4 min-h-0'>
					<div
						className={panelClass}
						style={panelShadow}>
						<Roster
							operators={operators}
							setClickedOperator={(op) => {
								setClickedOperator(op);
								setSelectedOperator(op._id);
							}}
							dataUpdated={dataUpdated}
							refreshData={refreshData}
							openSheet={handleOpenSheet}
						/>
					</div>

					<div
						className={panelClass}
						style={panelShadow}>
						placeholder
					</div>
				</div>

				{/* RIGHT COLUMN */}
				<div className='flex flex-col gap-4 min-h-0'>
					<div
						className={panelClass}
						style={panelShadow}>
						<Teams
							dataUpdated={dataUpdated}
							refreshData={refreshData}
							openSheet={handleOpenSheet}
						/>
					</div>

					<div
						className={panelClass}
						style={panelShadow}>
						<Infirmary
							dataUpdated={dataUpdated}
							refreshData={refreshData}
						/>
						<Memorial
							dataUpdated={dataUpdated}
							refreshData={refreshData}
						/>
					</div>
				</div>
			</div>

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

export default OperatorDashboard;
