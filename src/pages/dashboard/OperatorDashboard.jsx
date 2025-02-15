/** @format */
import { useState } from "react";
import {
	Bio,
	IdCard,
	Roster,
	Teams,
	Loadout,
	Infirmary,
	Gear,
	Footer,
	Header,
	Memorial,
} from "../../components";

const OperatorDashboard = () => {
	const [clickedOperator, setClickedOperator] = useState(null);
	const [selectedClass, setSelectedClass] = useState(null);

	//const status = clickedOperator?.status?.[0] || "No status available";
	// ✅ State to trigger re-renders when data changes
	const [dataUpdated, setDataUpdated] = useState(false);

	// ✅ Function to trigger a refresh across all components
	const refreshData = () => {
		setDataUpdated((prev) => !prev); // Toggles state to trigger useEffect in children
	};

	return (
		<div
			className='bg-linear-45 from-blk via-bckground to-neutral-800 min-h-screen flex flex-col p-4 space-y-4'
			style={{ boxShadow: "-4px 0px 10px rgba(0, 0, 0, 0.99)" }}>
			{/* === GRID LAYOUT === */}
			<div className='grid grid-cols-1 gap-4 lg:grid-cols-3 flex-grow'>
				{/* === TEAMS & ROSTER === */}
				<div className='space-y-4'>
					<div
						className='bg-bckground/50 shadow-lg shadow-black  rounded-3xl overflow-y-auto h-[450px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<Teams
							dataUpdated={dataUpdated}
							refreshData={refreshData}
						/>
					</div>
					<div
						className='bg-bckground/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<Roster
							setClickedOperator={setClickedOperator}
							setSelectedClass={setSelectedClass}
							dataUpdated={dataUpdated}
							refreshData={refreshData}
						/>
						{/*Clickable*/}
					</div>
				</div>

				{/* === ID CARD & BIO (SEPARATED) === */}
				<div className='space-y-4'>
					<div
						className='relative flex flex-col items-center text-gray-400 bg-bckground/50 shadow-lg rounded-3xl overflow-hidden h-[185px] p-4 w-full sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						{/* Edit Icon in Top Right */}

						{/* ID Card Component */}
						<IdCard operator={clickedOperator} />
						{/*when operator is clicked from roster displayed idcard info*/}
					</div>

					<div
						className='bg-bckground/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[342px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<Bio
							operator={clickedOperator}
							setOperator={setClickedOperator}
						/>
					</div>
					<div
						className='bg-bckground/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[358px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<Infirmary
							dataUpdated={dataUpdated}
							refreshData={refreshData}
						/>
					</div>
				</div>

				{/* === INFIRMARY, LOADOUT, GEAR === */}
				<div className='space-y-4'>
					<div
						className='bg-bckground/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[300px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<Memorial
							dataUpdated={dataUpdated}
							refreshData={refreshData}
						/>
					</div>
					<div
						className=' flex flex-row bg-bckground/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[200px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<Loadout
							operator={clickedOperator}
							selectedClass={selectedClass}
						/>

						{/*when operator clicked show his loadout here*/}
					</div>
					<div
						className=' bg-bckground/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[385px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						<Gear
							operator={clickedOperator}
							selectedClass={selectedClass}
						/>

						{/*when operator is clicked show his gear here*/}
					</div>
				</div>
			</div>

			<Footer />
		</div>
	);
};

export default OperatorDashboard;
