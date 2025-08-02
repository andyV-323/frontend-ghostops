import { useState, useEffect } from "react";
import { PROVINCES } from "@/config";
import PropTypes from "prop-types";
import { Button } from "@material-tailwind/react";
import { chatGPTApi } from "@/api";
import { toast } from "react-toastify";

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
	useEffect(() => {
		if (randomLocationSelection.length > 0) {
			generateAIMission();
		}
	}, [randomLocationSelection]);
	const allProvinceCoordinates = selectedProvince
		? PROVINCES[selectedProvince].locations.map((loc) => loc.coordinates)
		: [];

	const provinces = Object.keys(PROVINCES);

	const locationsInProvince =
		selectedProvince && PROVINCES[selectedProvince]
			? PROVINCES[selectedProvince].locations
			: [];
	const generateAIMission = async () => {
		if (
			!selectedProvince ||
			(!randomLocationSelection.length && !selectedLocations.length)
		) {
			toast.warn("Select a province and at least one location first.");
			toast.error("No province or locations selected.");
			return;
		}

		const provinceData = PROVINCES[selectedProvince];

		const missionData = {
			missionDescription: missionDescription || null,
			biome: provinceData.biome,
			provinceDescription: provinceData.description || "unknown",
			bounds: provinceData.coordinates.bounds,
			coordinates:
				randomLocationSelection.length > 0
					? randomLocationSelection
					: selectedLocations,
			allProvinceCoordinates: allProvinceCoordinates,
		};

		try {
			const aiResponse = await chatGPTApi("mission", missionData);

			if (aiResponse && aiResponse.result) {
				// More robust cleaning
				const cleanedResponse = aiResponse.result
					.replace(/```json\n?/g, "")
					.replace(/\n?```/g, "")
					.replace(/```/g, "")
					.replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
					.trim();

				const parsedResponse = JSON.parse(cleanedResponse);

				setMissionBriefing(parsedResponse.briefing || "No briefing provided.");
				setInfilPoint(parsedResponse.infilPoint || [0, 0]);
				setExfilPoint(parsedResponse.exfilPoint || [0, 0]);
				setFallbackExfil(parsedResponse.fallbackExfil || [0, 0]);

				toast.success("Mission briefing generated successfully!");
			} else {
				toast.error("AI Response is invalid or empty!");
			}
		} catch (error) {
			console.error(
				"AI Mission Generation Failed:",
				error.response?.data || error
			);
			toast.error("Failed to generate mission briefing.");
		}
	};

	//Province selection and number of locations
	const generateRandomOps = async () => {
		// Check if valid selections were made
		if (!selectedProvince || numberOfLocations <= 0) {
			let message = "";
			if (!selectedProvince) {
				message += toast.warn("Please select a province. ");
			}
			if (numberOfLocations <= 0) {
				message += toast.warn(
					"The number of locations must be greater than 0."
				);
			}
			setErrMsg(message);
			return Promise.reject(); // Stop execution if validation fails
		}

		setErrMsg("");

		return new Promise((resolve) => {
			if (selectedProvince && numberOfLocations > 0) {
				const provinceData = PROVINCES[selectedProvince];
				let locationsInProvince = [...provinceData.locations];
				const ops = [];

				// Shuffle locations
				for (let i = locationsInProvince.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[locationsInProvince[i], locationsInProvince[j]] = [
						locationsInProvince[j],
						locationsInProvince[i],
					];
				}

				// Pick a subset of locations
				for (
					let i = 0;
					i < Math.min(numberOfLocations, locationsInProvince.length);
					i++
				) {
					ops.push(locationsInProvince[i]);
				}

				// Set bounds and coordinates for the selected province
				const bounds = provinceData.coordinates.bounds;
				const coordinates = ops.map((location) => location.coordinates);
				const imgURL = provinceData.imgURL;
				const biome = provinceData.biome;

				// Pass the generated data to the parent component
				onGenerateRandomOps({
					selectedProvince,
					allProvinceCoordinates,
					bounds,
					coordinates,
					randomSelection: ops,
					imgURL,
					biome,
				});

				// **Set state and resolve promise after state updates**
				setRandomSelection(ops);
				resolve();
			}
		});
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

		// Update the state
		setSelectedLocations(validLocations);
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
	const handleGenerate = async () => {
		setLoading(true);
		setMapBounds(null);
		setImgURL("");
		setErrMsg("");
		setSelectedLocations([]);
		setRandomSelection([]);

		if (generationMode === "random") {
			await generateRandomOps();
		} else {
			await generateOps();
			await generateAIMission();
		}
		setTimeout(() => setLoading(false), 5000); // Ensures a smooth transition
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
								<Button
									className='bg-transparent text-white font-semibold py-3 px-8 rounded-lg  mt-6'
									onClick={handleGenerate}>
									<img
										src='/icons/ai.svg'
										alt='AI Icon'
										className='bg-blk/50 hover:bg-highlight rounded'
									/>
								</Button>
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
