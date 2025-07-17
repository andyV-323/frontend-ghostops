import { useEffect, useState } from "react";
import { IdCard, Loadout, Gear, SheetSide, Perk } from "@/components";
import { Roster, Infirmary, Memorial, Teams } from "@/components/tables";
//import { Bio } from "@/components/ai";
import { useOperatorsStore, useSheetStore } from "@/zustand";

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
			<div className='grid grid-cols-1 gap-4 lg:grid-cols-3 flex-grow'>
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
						{/*Clickable*/}
					</div>
				</div>

				{/* === ID CARD & BIO (SEPARATED) === */}
				<div className='space-y-4'>
					<div
						className='relative flex flex-col items-center text-gray-400  shadow-lg rounded-3xl overflow-hidden h-[185px] p-4 w-full sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						{/* Edit Icon in Top Right */}

						{/* ID Card Component */}
						<IdCard
							operator={clickedOperator}
							openSheet={handleOpenSheet}
						/>
						{/*when operator is clicked from roster displayed idcard info*/}
					</div>

					{/*<div
						className='bg-bckground/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[185px] flex flex-col items-center'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<Gear
							operator={clickedOperator}
							selectedClass={selectedClass}
						/>
					</div>*/}
					<div
						className=' flex flex-col shadow-lg shadow-black rounded-3xl overflow-y-auto h-[500px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<Gear
							operator={clickedOperator}
							selectedClass={selectedClass}
						/>
						<Loadout
							operator={clickedOperator}
							selectedClass={selectedClass}
							openSheet={handleOpenSheet}
						/>

						{/*when operator clicked show his loadout here*/}
					</div>
					<div
						className='  shadow-lg shadow-black rounded-3xl overflow-y-auto h-[200px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<Perk
							operator={clickedOperator}
							selectedClass={selectedClass}
						/>

						{/*when operator is clicked show his gear here*/}
					</div>
				</div>

				{/* === INFIRMARY, LOADOUT, GEAR === */}
				<div className='space-y-4'>
					<div
						className=' shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<Infirmary
							dataUpdated={dataUpdated}
							refreshData={refreshData}
						/>
					</div>
					<div
						className=' shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
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
