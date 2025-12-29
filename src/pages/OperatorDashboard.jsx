import { useEffect, useState } from "react";
import { SheetSide } from "@/components";
import { Roster, Infirmary, Memorial, Teams } from "@/components/tables";
//import { Bio } from "@/components/ai";
import { useOperatorsStore, useSheetStore } from "@/zustand";
import OperationsBoard from "@/components/tables/OperationsBoard";

const OperatorDashboard = () => {
	const { activeClasses, setSelectedOperator, operators, fetchOperators } =
		useOperatorsStore();

	const [clickedOperator, setClickedOperator] = useState(null);
	const selectedClass =
		activeClasses[clickedOperator?._id] || clickedOperator?.class;

	const [dataUpdated, setDataUpdated] = useState(false);

	const refreshData = () => {
		setDataUpdated((prev) => !prev); // Toggles state to trigger useEffect in children
	};

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

	return (
		<div className='bg-transparent flex flex-col p-4 space-y-4'>
			{/* === GRID LAYOUT === */}
			<div className='grid grid-cols-1 gap-4 lg:grid-cols-2 flex-grow'>
				{/* === TEAMS & ROSTER === */}

				<div className='space-y-4'>
					<div
						className=' shadow-lg shadow-black  rounded-3xl overflow-y-auto h-[450px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<Teams
							dataUpdated={dataUpdated}
							refreshData={refreshData}
							openSheet={handleOpenSheet}
						/>
					</div>
					<div
						className=' shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
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
				</div>

				{/* === GARAGE === */}
				{/*}	<div className='space-y-4'>
					<div
						className='  shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px] '
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<Garage
							dataUpdated={dataUpdated}
							refreshData={refreshData}
							openSheet={handleOpenSheet}
						/>
					</div>*/}
				{/* ===ID CARD & LOADOUT=== */}
				{/*	<div
						className='  shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px] '
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						{/*<IdCard
							operator={clickedOperator}
							openSheet={handleOpenSheet}
							selectedClass={selectedClass}
						/>*/}
				{/*<AuroaMap selectedAOs={getActiveAOs()} />
						<Loadout
							operator={clickedOperator}
							selectedClass={selectedClass}
							openSheet={handleOpenSheet}
						/>
					</div>
				</div>*/}

				{/* === INFIRMARY, LOADOUT, GEAR === */}
				<div className='space-y-4'>
					<div
						className=' shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<OperationsBoard
							dataUpdated={dataUpdated}
							refreshData={refreshData}
							openSheet={handleOpenSheet}
						/>
					</div>
					<div
						className=' shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
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
