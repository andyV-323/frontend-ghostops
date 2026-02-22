import { useState, useEffect } from "react";
import { MapWrapper, SheetSide, Loadout, AuroaMap } from "@/components";
import { MissionGenerator } from "@/components/ai";
import { useOperatorsStore, useSheetStore, useTeamsStore } from "@/zustand";
import { OperationsBoard } from "@/components/tables";
import ReconTool from "@/components/reconTool/recontool";

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

	// Handles Random mission generation
	const handleGenerateRandomOps = (data) => {
		setMissionBriefing("");
		setInfilPoint(null);
		setExfilPoint(null);
		setFallbackExfil(null);
		setRandomLocationSelection([]);
		setLocationSelection([]);
		setMapBounds(null);
		setImgURL("");

		setRandomLocationSelection(data.randomSelection);
		setMapBounds(data.bounds);
		setImgURL(data.imgURL || "");
	};

	// Handles Manual mission generation
	const handleGenerateOps = (data) => {
		setMissionBriefing("");
		setInfilPoint(null);
		setExfilPoint(null);
		setFallbackExfil(null);
		setRandomLocationSelection([]);
		setLocationSelection([]);
		setMapBounds(null);
		setImgURL("");

		setLocationSelection(data.randomSelection);
		setMapBounds(data.bounds);
		setImgURL(data.imgURL);
	};

	// Get all active AOs from teams
	const getActiveAOs = () => {
		return teams
			.filter((team) => team.AO)
			.map((team) => team.AO)
			.filter((ao, index, self) => self.indexOf(ao) === index);
	};

	// Shared panel styles (no fixed height)
	const panelClass =
		"bg-background/50 flex-1 min-h-0 overflow-y-auto rounded-3xl shadow-lg shadow-black";
	const panelShadow = { boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" };

	return (
		<div className='bg-transparent flex flex-col flex-grow p-4 min-h-0'>
			{/* 4 PANELS: 1 col on mobile, 2x2 on lg+ */}
			<div className='grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-4 flex-grow min-h-0'>
				{/* === MISSION GENERATOR === */}
				<div
					className={panelClass}
					style={panelShadow}>
					{/*<OperationsBoard openSheet={handleOpenSheet} />*/}
					<ReconTool />
				</div>

				{/* === MAP === */}
				<div
					className={`${panelClass} flex items-center justify-center`}
					style={panelShadow}>
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

				{/* === MISSION BRIEFING === */}
				<div
					className={panelClass}
					style={panelShadow}>
					<h2 className='text-white font-bold text-xl p-4'>
						Mission Briefing:
					</h2>
					<p className='text-gray-300 px-5'>
						{missionBriefing || "No AI briefing generated yet."}
					</p>
				</div>

				{/* === GEAR === */}
				<div
					className={panelClass}
					style={panelShadow}>
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
	);
};

export default Briefing;
