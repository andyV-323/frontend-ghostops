import { useState, useEffect } from "react";
import { PROVINCES } from "@/config";
import PropTypes from "prop-types";
import { chatGPTApi } from "@/api";
import { toast } from "react-toastify";
import { generateInsertionExtractionPoints } from "@/utils/generatePoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faLocationDot,
	faShuffle,
	faListCheck,
	faBolt,
	faSpinner,
	faRobot,
	faMinus,
	faPlus,
} from "@fortawesome/free-solid-svg-icons";

/* ─── HUD Select ─────────────────────────────────────────────── */
function HudSelect({ label, value, onChange, children }) {
	return (
		<div className='flex flex-col gap-1'>
			<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
				{label}
			</span>
			<div className='relative'>
				<select
					value={value}
					onChange={onChange}
					className='w-full appearance-none bg-blk/60 border border-lines/25 hover:border-lines/50 focus:border-btn/60 focus:outline-none rounded-sm px-3 py-2 font-mono text-[11px] text-fontz/80 cursor-pointer transition-colors'>
					{children}
				</select>
				<div className='absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none'>
					<div className='w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-lines/30' />
				</div>
			</div>
		</div>
	);
}

/* ─── HUD Textarea ───────────────────────────────────────────── */
function HudTextarea({ label, value, onChange, placeholder }) {
	return (
		<div className='flex flex-col gap-1'>
			<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
				{label}
			</span>
			<textarea
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				rows={3}
				className='bg-blk/60 border border-lines/25 hover:border-lines/40 focus:border-btn/50 focus:outline-none rounded-sm px-3 py-2 font-mono text-[11px] text-fontz/75 placeholder:text-lines/20 resize-none transition-colors'
			/>
		</div>
	);
}

/* ─── Action button ──────────────────────────────────────────── */
function ActionBtn({
	onClick,
	disabled,
	loading,
	icon,
	label,
	variant = "default",
	wide = false,
}) {
	const variants = {
		default:
			"text-btn border-btn/35 bg-btn/8 hover:bg-btn/18 hover:border-btn/60",
		primary: "text-blk border-btn bg-btn hover:bg-highlight",
		ai: "text-purple-300 border-purple-800/50 bg-purple-900/10 hover:bg-purple-900/20 hover:border-purple-600/50",
		muted: "text-lines/25 border-lines/12 bg-transparent cursor-not-allowed",
	};
	return (
		<button
			onClick={onClick}
			disabled={disabled || loading}
			className={[
				"flex items-center justify-center gap-2 border rounded-sm font-mono text-[10px] tracking-widest uppercase transition-all py-2",
				wide ? "w-full px-4" : "px-3",
				disabled || loading ? variants.muted : variants[variant],
			].join(" ")}>
			{loading ?
				<FontAwesomeIcon
					icon={faSpinner}
					className='animate-spin text-[10px]'
				/>
			:	icon && (
					<FontAwesomeIcon
						icon={icon}
						className='text-[10px]'
					/>
				)
			}
			{label}
		</button>
	);
}

/* ═══════════════════════════════════════════════════════════════
   MISSION GENERATOR
═══════════════════════════════════════════════════════════════ */
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
	const [randomSelection, setRandomSelection] = useState([]);
	const [generationMode, setGenerationMode] = useState("random");
	const [missionDescription, setMissionDescription] = useState("");
	const [loading, setLoading] = useState(false);
	const [aiLoading, setAiLoading] = useState(false);

	const provinces = Object.keys(PROVINCES);
	const locationsInProvince =
		selectedProvince ? PROVINCES[selectedProvince].locations : [];
	const allProvinceCoords =
		selectedProvince ? locationsInProvince.map((l) => l.coordinates) : [];

	useEffect(() => {
		setSelectedLocations([]);
		setRandomSelection([]);
		setMapBounds(null);
		setImgURL("");
		setInfilPoint(null);
		setExfilPoint(null);
		setFallbackExfil(null);
		setMissionBriefing("");
	}, [generationMode]);

	/* ── Ops generation ── */
	const generateRandomOps = async () => {
		if (!selectedProvince || numberOfLocations <= 0) {
			if (!selectedProvince) toast.warn("Select a province.");
			if (numberOfLocations <= 0) toast.warn("Locations must be > 0.");
			throw new Error("Invalid");
		}
		const pd = PROVINCES[selectedProvince];
		const shuffled = [...pd.locations].sort(() => Math.random() - 0.5);
		const ops = shuffled.slice(0, Math.min(numberOfLocations, shuffled.length));
		onGenerateRandomOps({
			selectedProvince,
			allProvinceCoordinates: allProvinceCoords,
			bounds: pd.coordinates.bounds,
			coordinates: ops.map((l) => l.coordinates),
			randomSelection: ops,
			imgURL: pd.imgURL,
			biome: pd.biome,
		});
		setRandomSelection(ops);
		return ops;
	};

	const generateOps = async () => {
		if (!selectedProvince || selectedLocations.length === 0) {
			toast.error("Select a province and at least one location.");
			return;
		}
		const pd = PROVINCES[selectedProvince];
		const valid = selectedLocations
			.map((n) => pd.locations.find((l) => l.name === n))
			.filter((l) => l?.coordinates);
		if (!valid.length) {
			toast.error("Invalid locations selected.");
			return;
		}
		onGenerateOps({
			selectedProvince,
			allProvinceCoordinates: allProvinceCoords,
			bounds: pd.coordinates.bounds,
			coordinates: valid.map((l) => l.coordinates),
			randomSelection: valid,
			imgURL: pd.imgURL,
			biome: pd.biome,
		});
	};

	const generateNonAIPoints = (pickedLocations = null) => {
		if (!selectedProvince) {
			toast.error("Select a province first.");
			return;
		}
		const pd = PROVINCES[selectedProvince];
		let coords = [];
		if (pickedLocations?.length)
			coords = pickedLocations.map((l) => l.coordinates);
		else if (randomSelection.length)
			coords = randomSelection.map((l) => l.coordinates);
		else if (selectedLocations.length)
			coords = selectedLocations
				.map((n) => pd.locations.find((l) => l.name === n))
				.filter(Boolean)
				.map((l) => l.coordinates);
		if (!coords.length) {
			toast.error("Pick at least one mission location.");
			return;
		}
		try {
			const pts = generateInsertionExtractionPoints({
				bounds: pd.coordinates.bounds,
				missionCoordinates: coords,
				allProvinceCoordinates: allProvinceCoords,
				maxAttempts: 20000,
			});
			setInfilPoint(pts.infilPoint);
			setExfilPoint(pts.exfilPoint);
			setFallbackExfil(pts.fallbackExfil);
			toast.success("Infil / exfil / rally points generated.");
		} catch (err) {
			toast.error(err.message || "Failed to generate points.");
		}
	};

	const handleGenerateMission = async () => {
		setLoading(true);
		setMapBounds(null);
		setImgURL("");
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
		if (!selectedProvince) {
			toast.error("Select a province first.");
			return;
		}
		setAiLoading(true);
		try {
			const pd = PROVINCES[selectedProvince];
			const res = await chatGPTApi("briefing", {
				missionDescription: missionDescription || "",
				biome: pd.biome,
				provinceDescription: pd.description || "unknown",
			});
			const raw =
				res?.result ?? res?.choices?.[0]?.message?.content ?? res?.output ?? "";
			if (!raw) {
				toast.error("AI response was empty.");
				return;
			}
			setMissionBriefing(raw.replace(/```/g, "").trim());
			toast.success("Mission briefing generated.");
		} catch {
			toast.error("Failed to generate briefing.");
		} finally {
			setAiLoading(false);
		}
	};

	/* ── UI ── */
	return (
		<div className='flex flex-col gap-4 h-full'>
			{/* Mode toggle */}
			<div className='flex gap-0 border border-lines/20 rounded-sm overflow-hidden shrink-0'>
				{[
					{ id: "random", icon: faShuffle, label: "Random" },
					{ id: "ops", icon: faListCheck, label: "Mission" },
				].map((m) => {
					const active = generationMode === m.id;
					return (
						<button
							key={m.id}
							onClick={() => setGenerationMode(m.id)}
							className={[
								"flex-1 flex items-center justify-center gap-2 py-2 font-mono text-[10px] tracking-widest uppercase transition-all",
								active ?
									"bg-btn/20 text-btn border-r border-lines/20 last:border-r-0"
								:	"text-lines/35 hover:text-fontz hover:bg-white/[0.03]",
							].join(" ")}>
							<FontAwesomeIcon
								icon={m.icon}
								className='text-[9px]'
							/>
							{m.label}
						</button>
					);
				})}
			</div>

			{/* Form fields */}
			<div className='flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto'>
				{/* Province */}
				<HudSelect
					label='Province'
					value={selectedProvince}
					onChange={(e) => {
						setSelectedProvince(e.target.value);
						setSelectedLocations([]);
					}}>
					<option value=''>— Select Province —</option>
					{provinces.map((p) => (
						<option
							key={p}
							value={p}>
							{p}
						</option>
					))}
				</HudSelect>

				{/* Location count (random mode) */}
				{generationMode === "random" && selectedProvince && (
					<div className='flex flex-col gap-1'>
						<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
							Locations
						</span>
						<div className='flex items-center gap-0 border border-lines/25 rounded-sm overflow-hidden w-32'>
							<button
								onClick={() => setNumberOfLocations((n) => Math.max(1, n - 1))}
								className='w-9 h-9 flex items-center justify-center text-lines/40 hover:text-btn hover:bg-btn/10 transition-colors border-r border-lines/20'>
								<FontAwesomeIcon
									icon={faMinus}
									className='text-[9px]'
								/>
							</button>
							<span className='flex-1 text-center font-mono text-xs text-fontz tabular-nums'>
								{numberOfLocations}
							</span>
							<button
								onClick={() => setNumberOfLocations((n) => n + 1)}
								className='w-9 h-9 flex items-center justify-center text-lines/40 hover:text-btn hover:bg-btn/10 transition-colors border-l border-lines/20'>
								<FontAwesomeIcon
									icon={faPlus}
									className='text-[9px]'
								/>
							</button>
						</div>
					</div>
				)}

				{/* Location checklist (ops mode) */}
				{generationMode === "ops" &&
					selectedProvince &&
					locationsInProvince.length > 0 && (
						<div className='flex flex-col gap-1'>
							<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
								Locations{" "}
								<span className='text-btn ml-1'>
									{selectedLocations.length} selected
								</span>
							</span>
							<div className='flex flex-col gap-0.5 max-h-36 overflow-y-auto border border-lines/15 rounded-sm bg-blk/40 p-1'>
								{locationsInProvince.map((loc) => {
									const checked = selectedLocations.includes(loc.name);
									return (
										<label
											key={loc.name}
											className={[
												"flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm cursor-pointer transition-colors",
												checked ?
													"bg-btn/10 border border-btn/20"
												:	"hover:bg-white/[0.03] border border-transparent",
											].join(" ")}>
											{/* Custom checkbox */}
											<span
												className={[
													"w-3 h-3 border rounded-sm shrink-0 flex items-center justify-center transition-colors",
													checked ? "bg-btn border-btn" : (
														"border-lines/30 bg-transparent"
													),
												].join(" ")}>
												{checked && (
													<span className='w-1.5 h-1 border-b border-r border-blk rotate-45 -translate-y-px' />
												)}
											</span>
											<input
												type='checkbox'
												className='sr-only'
												value={loc.name}
												checked={checked}
												onChange={(e) =>
													setSelectedLocations(
														e.target.checked ?
															[...selectedLocations, loc.name]
														:	selectedLocations.filter((l) => l !== loc.name),
													)
												}
											/>
											<span className='font-mono text-[10px] text-fontz/70'>
												<FontAwesomeIcon
													icon={faLocationDot}
													className='text-lines/25 mr-1.5 text-[8px]'
												/>
												{loc.name}
											</span>
										</label>
									);
								})}
							</div>
						</div>
					)}

				{/* Mission description */}
				<HudTextarea
					label='Mission Description (optional)'
					value={missionDescription}
					onChange={(e) => setMissionDescription(e.target.value)}
					placeholder='Describe the mission objective for AI briefing generation...'
				/>
			</div>

			{/* Action buttons — always at bottom */}
			<div className='flex flex-col gap-2 shrink-0'>
				<ActionBtn
					onClick={handleGenerateMission}
					loading={loading}
					disabled={!selectedProvince}
					icon={faBolt}
					label='Generate Mission'
					variant='primary'
					wide
				/>
				<ActionBtn
					onClick={handleGenerateBriefing}
					loading={aiLoading}
					disabled={!selectedProvince}
					icon={faRobot}
					label='Generate AI Briefing'
					variant='ai'
					wide
				/>
			</div>
		</div>
	);
}
HudSelect.propTypes = {
	label: PropTypes.string,
	value: PropTypes.string,
	onChange: PropTypes.func,
	children: PropTypes.array,
};
HudTextarea.propTypes = {
	label: PropTypes.string,
	value: PropTypes.string,
	onChange: PropTypes.func,
	placeholder: PropTypes.string,
};
ActionBtn.propTypes = {
	onClick: PropTypes.func,
	disabled: PropTypes.bool,
	loading: PropTypes.bool,
	icon: PropTypes.object,
	label: PropTypes.string,
	variant: PropTypes.string,
	wide: PropTypes.bool,
};
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
