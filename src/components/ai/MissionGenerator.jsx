import { useState, useEffect } from "react";
import { PROVINCES } from "@/config";
import PropTypes from "prop-types";
import { Button } from "@material-tailwind/react";
import { chatGPTApi } from "@/api";
import { toast } from "react-toastify";
import { generateInsertionExtractionPoints } from "@/utils/generatePoints";

function MissionGenerator({
	onGenerateRandomOps,
	onGenerateOps,
	setMapBounds,
	setImgURL,
	setMissionBriefing,
	setInfilPoint,
	setExfilPoint,
	setFallbackExfil,
}) {
	const [selectedProvince, setSelectedProvince] = useState("");
	const [selectedLocations, setSelectedLocations] = useState([]);
	const [numberOfLocations, setNumberOfLocations] = useState(1);
	const [randomLocationSelection, setRandomSelection] = useState([]);

	const [errmsg, setErrMsg] = useState("");
	const [generationMode, setGenerationMode] = useState("random");
	const [missionDescription, setMissionDescription] = useState("");
	const [loading, setLoading] = useState(false);
	const [aiLoading, setAiLoading] = useState(false);

	useEffect(() => {
		// Reset selections when switching modes
		setSelectedLocations([]);
		setRandomSelection([]);
		setMapBounds(null);
		setImgURL("");

		setErrMsg("");
		setInfilPoint(null);
		setExfilPoint(null);
		setFallbackExfil(null);
		setMissionBriefing("");
	}, [generationMode]);

	const allProvinceCoordinates = selectedProvince
		? PROVINCES[selectedProvince].locations.map((loc) => loc.coordinates)
		: [];

	const provinces = Object.keys(PROVINCES);

	const locationsInProvince =
		selectedProvince && PROVINCES[selectedProvince]
			? PROVINCES[selectedProvince].locations
			: [];
	const generateAIBriefing = async () => {
		if (
			!selectedProvince ||
			(!randomLocationSelection.length && !selectedLocations.length)
		) {
			toast.warn("Select a province and at least one location first.");
			return;
		}

		const provinceData = PROVINCES[selectedProvince];

		const briefingData = {
			missionDescription: missionDescription || "",
			biome: provinceData.biome,
			provinceDescription: provinceData.description || "unknown",
		};

		try {
			const aiResponse = await chatGPTApi("briefing", briefingData);

			// RapidAPI wrappers vary: support multiple response shapes
			const rawText =
				aiResponse?.result ??
				aiResponse?.choices?.[0]?.message?.content ??
				aiResponse?.output ??
				"";

			if (!rawText || typeof rawText !== "string") {
				toast.error("AI briefing response is empty.");
				return;
			}

			// Clean any accidental code fences
			const cleaned = rawText.replace(/```/g, "").trim();

			setMissionBriefing(cleaned);
			toast.success("Mission briefing generated!");
		} catch (error) {
			console.error(
				"AI Briefing Generation Failed:",
				error.response?.data || error
			);
			toast.error("Failed to generate mission briefing.");
		}
	};

	//Province selection and number of locations
	const generateRandomOps = async () => {
		if (!selectedProvince || numberOfLocations <= 0) {
			if (!selectedProvince) toast.warn("Please select a province.");
			if (numberOfLocations <= 0)
				toast.warn("The number of locations must be > 0.");
			throw new Error("Invalid selections");
		}

		const provinceData = PROVINCES[selectedProvince];
		let locationsInProvince = [...provinceData.locations];

		// Shuffle
		for (let i = locationsInProvince.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[locationsInProvince[i], locationsInProvince[j]] = [
				locationsInProvince[j],
				locationsInProvince[i],
			];
		}

		// Pick subset
		const ops = locationsInProvince.slice(
			0,
			Math.min(numberOfLocations, locationsInProvince.length)
		);

		const bounds = provinceData.coordinates.bounds;
		const coordinates = ops.map((loc) => loc.coordinates);
		const imgURL = provinceData.imgURL;
		const biome = provinceData.biome;

		onGenerateRandomOps({
			selectedProvince,
			allProvinceCoordinates,
			bounds,
			coordinates,
			randomSelection: ops,
			imgURL,
			biome,
		});

		// keep state for UI
		setRandomSelection(ops);

		// ✅ return ops so caller can use immediately
		return ops;
	};

	const generateOps = async () => {
		if (!selectedProvince || selectedLocations.length === 0) {
			toast.error("Please select a province and at least one location.");
			return;
		}

		const provinceData = PROVINCES[selectedProvince];

		// Ensure selected locations exist in the province
		const validLocations = selectedLocations
			.map((locName) =>
				provinceData.locations.find((loc) => loc.name === locName)
			)
			.filter((loc) => loc?.coordinates); // Ensure locations are valid

		// If no valid locations are found, show error
		if (validLocations.length === 0) {
			toast.error(
				"Invalid location(s) selected. Please choose from the available list."
			);
			return;
		}

		const bounds = provinceData.coordinates.bounds;
		const coordinates = validLocations.map((location) => location.coordinates);
		const imgURL = provinceData.imgURL;
		const biome = provinceData.biome;

		onGenerateOps({
			selectedProvince,
			allProvinceCoordinates,
			bounds,
			coordinates,
			randomSelection: validLocations,
			imgURL,
			biome,
		});
	};

	// Function to handle incrementing the number of locations
	const handleIncrement = () => {
		setNumberOfLocations((prevCount) => prevCount + 1);
	};

	// Function to handle decrementing the number of locations
	const handleDecrement = () => {
		setNumberOfLocations((prevCount) => Math.max(0, prevCount - 1)); // Prevent negative values
	};
	// Handles the function selection between "Random Generator" and "Generate Ops"
	const handleGenerateMission = async () => {
		setLoading(true);

		// clear map + points (optional)
		setMapBounds(null);
		setImgURL("");
		setErrMsg("");
		setInfilPoint(null);
		setExfilPoint(null);
		setFallbackExfil(null);

		try {
			if (generationMode === "random") {
				const ops = await generateRandomOps();
				generateNonAIPoints(ops);
			} else {
				await generateOps();
				generateNonAIPoints();
			}
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};
	const handleGenerateBriefing = async () => {
		// do not require locations if you truly don’t want to
		if (!selectedProvince) {
			toast.error("Select a province first.");
			return;
		}
		setAiLoading(true);

		try {
			await generateAIBriefing();
		} finally {
			setAiLoading(false);
		}
	};

	const handleModeChange = (mode) => {
		setGenerationMode(mode);
		setSelectedLocations([]);
		setRandomSelection([]);
		setNumberOfLocations(1);
		setMapBounds(null);
		setImgURL("");

		setErrMsg("");
	};
	const generateNonAIPoints = (pickedLocations = null) => {
		if (!selectedProvince) {
			toast.error("Please select a province first.");
			return;
		}

		const provinceData = PROVINCES[selectedProvince];

		let missionCoordinates = [];

		// ✅ if caller provided fresh random picks, use them
		if (pickedLocations && pickedLocations.length > 0) {
			missionCoordinates = pickedLocations.map((loc) => loc.coordinates);
		} else if (randomLocationSelection.length > 0) {
			missionCoordinates = randomLocationSelection.map(
				(loc) => loc.coordinates
			);
		} else if (selectedLocations.length > 0) {
			missionCoordinates = selectedLocations
				.map((name) => provinceData.locations.find((l) => l.name === name))
				.filter(Boolean)
				.map((loc) => loc.coordinates);
		}

		if (missionCoordinates.length === 0) {
			toast.error("Pick at least one mission location first.");
			return;
		}

		try {
			const { infilPoint, exfilPoint, fallbackExfil } =
				generateInsertionExtractionPoints({
					bounds: provinceData.coordinates.bounds,
					missionCoordinates,
					allProvinceCoordinates,
					maxAttempts: 20000,
				});

			setInfilPoint(infilPoint);
			setExfilPoint(exfilPoint);
			setFallbackExfil(fallbackExfil);

			toast.success("Generated infil/exfil/rally points!");
		} catch (err) {
			console.error(err);
			toast.error(err.message || "Failed to generate points.");
		}
	};

	return (
		<div className='flex flex-col items-center justify-center text-fontz text-md'>
			{/* Error Message */}
			{errmsg && (
				<div style={{ color: "red", marginBottom: "10px" }}>{errmsg}</div>
			)}

			{/* Title */}
			<div className='w-full'>
				<label className='font-bold text-2xl p-2 flex flex-col items-center'>
					Mission Generator
				</label>
			</div>
			{/* Select Generation Mode */}
			<div className='grid lg:grid-cols-2 '>
				<div className='flex flex-col items-center '>
					<label className='inline-flex items-center cursor-pointer'>
						<input
							type='checkbox'
							checked={generationMode === "ops"} // true when in "random" mode
							onChange={() =>
								handleModeChange(generationMode === "random" ? "ops" : "random")
							}
							className='sr-only peer'
						/>
						<div className="relative w-11 h-6 bg-highlight peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lines  rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-btn after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-blk/50 "></div>
						<span className='ms-3 text-sm font-medium'>
							{generationMode === "ops" ? "Mission Mode" : "Random Mode"}
						</span>
					</label>
					<br />

					{/* Province Selection - Always Visible */}
					<label className='flex flex-col items-center '>
						Select a Province:
						<select
							className=' form rounded-lg shadow-black shadow-lg  outline-lines text-fontz'
							value={selectedProvince}
							onChange={(e) => {
								setSelectedProvince(e.target.value);
								setSelectedLocations([]); // Reset locations when province changes
							}}>
							<option value=''>Select Province</option>
							{provinces.map((province) => (
								<option
									key={province}
									value={province}>
									{province}
								</option>
							))}
						</select>
					</label>
					<br />
					<label className='text-md font-bold'>Mission Description</label>
					<textarea
						className='form flex flex-col items-center  border border-lines h-25 outline-lines'
						value={missionDescription}
						onChange={(e) => setMissionDescription(e.target.value)}
						placeholder='Provide details about the mission to get AI recommendations...'
					/>
				</div>
				<div className='flex flex-col  justify-center'>
					{/* Location Selection - Only Visible in "Generate Ops" Mode */}
					{generationMode === "ops" &&
						selectedProvince &&
						locationsInProvince.map((location) => (
							<label
								key={location.name}
								className=' space-x-2'>
								<input
									className='accent-btn'
									type='checkbox'
									value={location.name}
									checked={selectedLocations.includes(location.name)}
									onChange={(e) => {
										if (e.target.checked) {
											setSelectedLocations([
												...selectedLocations,
												location.name,
											]);
										} else {
											setSelectedLocations(
												selectedLocations.filter((loc) => loc !== location.name)
											);
										}
									}}
								/>
								<span>{location.name}</span>
							</label>
						))}

					{/* Number of Locations - Only Visible in "Random Generator" Mode */}
					{generationMode === "random" && selectedProvince && (
						<form className='flex flex-col items-center max-w-xs mx-auto text-fontz'>
							<br />
							<label
								htmlFor='quantity-input'
								className='mb-2 text-sm font-medium'>
								Choose number of locations:
							</label>
							<div className='relative flex items-center max-w-[8rem]'>
								<button
									type='button'
									onClick={handleDecrement}
									className='btn rounded-s-lg p-3 h-11 '>
									-
								</button>
								<input
									type='text'
									value={numberOfLocations}
									onChange={(e) =>
										setNumberOfLocations(parseInt(e.target.value) || 1)
									}
									className='bg-gray-50 border-x-0 text-center text-gray-900 text-sm w-full py-2.5'
								/>

								<button
									type='button'
									onClick={handleIncrement}
									className='btn rounded-e-lg p-3 h-11'>
									+
								</button>
							</div>
						</form>
					)}

					<div className='flex flex-col items-center bg-transparent'>
						{/* Generate Button */}
						<>
							{loading ? (
								<div className='w-10 h-10 border-4 border-gray-300 border-t-highlight rounded-full animate-spin'></div>
							) : (
								<div className='flex flex-col items-center bg-transparent gap-3 mt-6'>
									<Button
										className='btn'
										onClick={handleGenerateMission}
										disabled={loading}>
										Generate Mission
									</Button>

									<Button
										className='bg-transparent py-3 px-8 rounded-lg  mt-6 flex flex-col items-center text-font'
										onClick={handleGenerateBriefing}
										disabled={aiLoading}>
										<img
											src='/icons/ai.svg'
											alt='AI Icon'
											className='bg-blk/50 hover:bg-highlight rounded '
										/>
										<br />
										Generate Briefing
									</Button>
								</div>
							)}
						</>
					</div>
				</div>
			</div>
		</div>
	);
}
MissionGenerator.propTypes = {
	onGenerateRandomOps: PropTypes.func.isRequired,
	onGenerateOps: PropTypes.func.isRequired,
	setMapBounds: PropTypes.func.isRequired,
	setImgURL: PropTypes.func.isRequired,
	setInfilPoint: PropTypes.func.isRequired,
	setExfilPoint: PropTypes.func.isRequired,
	setFallbackExfil: PropTypes.func.isRequired,
	setMissionBriefing: PropTypes.func.isRequired,
};

export default MissionGenerator;
