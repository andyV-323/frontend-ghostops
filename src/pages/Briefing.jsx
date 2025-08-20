import { useState, useEffect } from "react";
import { MapWrapper, SheetSide, Loadout, AuroaMap } from "@/components";
import { MissionGenerator } from "@/components/ai";
import { Teams, Roster } from "@/components/tables";
import { useOperatorsStore, useSheetStore, useTeamsStore } from "@/zustand";

const Briefing = () => {
	const [randomLocationSelection, setRandomLocationSelection] = useState([]);
	const [locationSelection, setLocationSelection] = useState([]);
	const [mapBounds, setMapBounds] = useState(null);
	const [imgURL, setImgURL] = useState("");
	const [generationMode, setGenerationMode] = useState("random");
	const [missionBriefing, setMissionBriefing] = useState("");
	const [infilPoint, setInfilPoint] = useState(null);
	const [exfilPoint, setExfilPoint] = useState(null);
	const [fallbackExfil, setFallbackExfil] = useState(null);
	const [dataUpdated, setDataUpdated] = useState(false);
	const refreshData = () => {
		setDataUpdated((prev) => !prev); // Toggles state to trigger useEffect in children
	};
	const { fetchOperators, operators, activeClasses, setSelectedOperator } =
		useOperatorsStore();
	const { openSheet, setOpenSheet, closeSheet } = useSheetStore();
	const [sheetContent, setSheetContent] = useState(null);
	const [sheetTitle, setSheetTitle] = useState(null);
	const [sheetDescription, setSheetDescription] = useState(null);
	const [clickedOperator, setClickedOperator] = useState(null);
	const selectedClass =
		activeClasses[clickedOperator?._id] || clickedOperator?.class;
	const { teams } = useTeamsStore();

	useEffect(() => {
		fetchOperators();
	}, [fetchOperators]);
	const handleOpenSheet = (side, content, title, description) => {
		setOpenSheet(side);
		setSheetContent(content);
		setSheetTitle(title);
		setSheetDescription(description);
	};
	// Handles AI-generated mission
	const handleGenerateAIMission = (data) => {
		setMissionBriefing("");
		setInfilPoint(null);
		setExfilPoint(null);
		setFallbackExfil(null);
		setRandomLocationSelection([]);
		setLocationSelection([]);
		setMapBounds(null);
		setImgURL("");
		setMissionBriefing(data.briefing);
		setInfilPoint(data.infilPoint);
		setExfilPoint(data.exfilPoint);
		setFallbackExfil(data.fallbackExfil ?? null);
		setMapBounds(data.bounds);
		setImgURL(data.imgURL || "");
	};

	// Handles Random and Manual mission generation
	const handleGenerateRandomOps = (data) => {
		setMissionBriefing("");
		setInfilPoint(null);
		setExfilPoint(null);
		setFallbackExfil(null);
		setRandomLocationSelection([]);
		setLocationSelection([]);
		setMapBounds(null);
		setImgURL("");
		setMissionBriefing("");
		setRandomLocationSelection(data.randomSelection);
		setMapBounds(data.bounds);
		setImgURL(data.imgURL || "");
	};

	const handleGenerateOps = (data) => {
		setMissionBriefing("");
		setInfilPoint(null);
		setExfilPoint(null);
		setFallbackExfil(null);
		setRandomLocationSelection([]);
		setLocationSelection([]);
		setMapBounds(null);
		setImgURL("");
		setMissionBriefing("");
		setLocationSelection(data.randomSelection);
		setMapBounds(data.bounds);
		setImgURL(data.imgURL);
	};
	// Get all active AOs from teams
	const getActiveAOs = () => {
		return teams
			.filter((team) => team.AO) // Only teams with an AO assigned
			.map((team) => team.AO)
			.filter((ao, index, self) => self.indexOf(ao) === index); // Remove duplicates
	};
	return (
		<div className='bg-transparent flex flex-col p-4 space-y-4'>
			{/* === GRID LAYOUT === */}
			<div className='grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2'>
				{/* === MISSION GENERATOR === */}
				<div
					className='bg-background/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px]'
					style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
					<MissionGenerator
						onGenerateRandomOps={handleGenerateRandomOps}
						onGenerateOps={handleGenerateOps}
						onGenerateAIMission={handleGenerateAIMission}
						setMapBounds={setMapBounds}
						setImgURL={setImgURL}
						setGenerationMode={setGenerationMode}
						setInfilPoint={setInfilPoint}
						setExfilPoint={setExfilPoint}
						setFallbackExfil={setFallbackExfil}
						setMissionBriefing={setMissionBriefing}
						generationMode={generationMode}
					/>
				</div>

				{/* === MAP === */}
				<div
					className='bg-background/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px]  flex items-center justify-center'
					style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
					<MapWrapper
						mapBounds={mapBounds}
						locationSelection={locationSelection}
						randomLocationSelection={randomLocationSelection}
						imgURL={imgURL}
						generationMode={generationMode}
						infilPoint={infilPoint}
						exfilPoint={exfilPoint}
						fallbackExfil={fallbackExfil}
					/>
				</div>

				{/* === MISSION BRIEFING === */}
				<div
					className='bg-background/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px]'
					style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
					<h2 className='text-white font-bold text-xl p-4'>
						Mission Briefing:
					</h2>
					<p className='text-gray-300 px-5'>
						{missionBriefing || "No AI briefing generated yet."}
					</p>
				</div>

				{/* === TEAMS === */}
				<div
					className='bg-background/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px]'
					style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
					<Teams
						dataUdated={dataUpdated}
						refreshData={refreshData}
						openSheet={handleOpenSheet}
					/>
				</div>

				{/* === ROSTER === */}
				<div
					className='bg-background/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px]'
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

				{/* === GEAR === */}
				<div
					className='bg-background/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[450px]'
					style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
					<AuroaMap selectedAOs={getActiveAOs()} />
					<Loadout
						operator={clickedOperator}
						selectedClass={selectedClass}
						openSheet={handleOpenSheet}
					/>
				</div>

				{/* === SLIDE SHEET (Optional floating component) === */}
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
		</div>
	);
};

export default Briefing;
