// MissionGenerator.jsx
import { useState, useEffect } from "react";
import { PROVINCES } from "@/config";
import { PROVINCE_TERRAIN } from "@/config/provinceTerrain";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { generateGhostPackage } from "@/api/GhostOpsApi";
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
	faCrosshairs,
	faSkull,
	faBomb,
	faHandcuffs,
	faTruck,
	faEye,
	faUserSecret,
	faHandsBound,
} from "@fortawesome/free-solid-svg-icons";

// ── Mission types ─────────────────────────────────────────────────────────────
const MISSION_TYPES = [
	{
		id: "Special Reconnaissance",
		abbr: "SR",
		icon: faUserSecret,
		color: "text-indigo-400",
		activeBorder: "border-indigo-400/60",
		activeBg: "bg-indigo-400/8",
	},
	{
		id: "Direct Action",
		abbr: "DA",
		icon: faCrosshairs,
		color: "text-red-400",
		activeBorder: "border-red-400/60",
		activeBg: "bg-red-400/8",
	},
	{
		id: "HVT Elimination",
		abbr: "HVT",
		icon: faSkull,
		color: "text-orange-400",
		activeBorder: "border-orange-400/60",
		activeBg: "bg-orange-400/8",
	},
	{
		id: "Sabotage / Demolition",
		abbr: "SAB",
		icon: faBomb,
		color: "text-amber-400",
		activeBorder: "border-amber-400/60",
		activeBg: "bg-amber-400/8",
	},
	{
		id: "Hostage Rescue",
		abbr: "HR",
		icon: faHandcuffs,
		color: "text-cyan-400",
		activeBorder: "border-cyan-400/60",
		activeBg: "bg-cyan-400/8",
	},
	{
		id: "Convoy Interdiction",
		abbr: "CI",
		icon: faTruck,
		color: "text-violet-400",
		activeBorder: "border-violet-400/60",
		activeBg: "bg-violet-400/8",
	},
	{
		id: "Defensive / Overwatch",
		abbr: "OW",
		icon: faEye,
		color: "text-emerald-400",
		activeBorder: "border-emerald-400/60",
		activeBg: "bg-emerald-400/8",
	},
	{
		id: "Capture",
		abbr: "CAP",
		icon: faHandsBound,
		color: "text-blue-400",
		activeBorder: "border-blue-400/60",
		activeBg: "bg-blue-400/8",
	},
];

// ── Compromise chip colours ───────────────────────────────────────────────────
const COMPROMISE_CHIP = {
	cold: {
		label: "COLD",
		color: "text-emerald-400",
		border: "border-emerald-400/50",
		bg: "bg-emerald-400/10",
	},
	warm: {
		label: "WARM",
		color: "text-amber-400",
		border: "border-amber-400/50",
		bg: "bg-amber-400/10",
	},
	engaged: {
		label: "HOT",
		color: "text-orange-400",
		border: "border-orange-400/50",
		bg: "bg-orange-400/10",
	},
	engaged_exfil: {
		label: "HOT",
		color: "text-orange-400",
		border: "border-orange-400/50",
		bg: "bg-orange-400/10",
	},
	burned: {
		label: "BURNED",
		color: "text-red-400",
		border: "border-red-400/50",
		bg: "bg-red-400/10",
	},
};

// ── Sub-components ────────────────────────────────────────────────────────────
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
		ai: "text-purple-300 border-purple-500/40 bg-purple-900/10 hover:bg-purple-900/20 hover:border-purple-500/60",
		muted: "text-lines/20 border-lines/10 bg-transparent cursor-not-allowed",
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

function MissionTypeGrid({ value, onChange }) {
	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex items-center gap-2'>
				<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
					Mission Type
				</span>
				<div className='flex-1 h-px bg-lines/10' />
			</div>
			<div className='grid grid-cols-4 gap-1'>
				{MISSION_TYPES.map((t) => {
					const active = value === t.id;
					return (
						<button
							key={t.id}
							onClick={() => onChange(active ? "" : t.id)}
							title={t.id}
							className={[
								"flex flex-col items-center gap-1 py-2 px-1 border rounded-sm transition-all",
								active ?
									`${t.activeBorder} ${t.activeBg}`
								:	"border-lines/15 hover:border-lines/30",
							].join(" ")}>
							<FontAwesomeIcon
								icon={t.icon}
								className={`text-[11px] ${active ? t.color : "text-lines/25"}`}
							/>
							<span
								className={`font-mono text-[8px] tracking-widest ${active ? t.color : "text-lines/30"}`}>
								{t.abbr}
							</span>
						</button>
					);
				})}
			</div>
			{value && (
				<span className='font-mono text-[8px] text-lines/40 italic'>
					{value}
				</span>
			)}
		</div>
	);
}

function ReconChips({ reports, selectedId, onSelect }) {
	if (!reports?.length) {
		return (
			<div className='flex flex-col gap-1'>
				<div className='flex items-center gap-2'>
					<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
						Recon Intel
					</span>
					<div className='flex-1 h-px bg-lines/10' />
				</div>
				<span className='font-mono text-[8px] text-lines/20 italic'>
					No recon on file — briefing runs cold
				</span>
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex items-center gap-2'>
				<span className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase'>
					Recon Intel
				</span>
				<div className='flex-1 h-px bg-lines/10' />
				<span className='font-mono text-[7px] text-lines/25 uppercase tracking-widest'>
					tap to apply
				</span>
			</div>
			<div className='flex flex-wrap gap-1.5'>
				<button
					onClick={() => onSelect(null)}
					className={[
						"font-mono text-[8px] tracking-widest px-2.5 py-1 border rounded-sm transition-all",
						selectedId === null ?
							"border-lines/35 bg-lines/8 text-lines/55"
						:	"border-lines/15 text-lines/25 hover:border-lines/30 hover:text-lines/40",
					].join(" ")}>
					NONE
				</button>
				{[...reports].reverse().map((r, i) => {
					const origIdx = reports.length - 1 - i;
					const id = r._id ?? origIdx;
					const m = r.modifiers || {};
					const meta =
						COMPROMISE_CHIP[m.compromiseBadge] || COMPROMISE_CHIP.cold;
					const intel = m.intelAccuracy != null ? `${m.intelAccuracy}%` : "—";
					const active = selectedId === id;
					return (
						<button
							key={String(id)}
							onClick={() => onSelect(active ? null : id)}
							className={[
								"font-mono text-[8px] tracking-widest px-2.5 py-1 border rounded-sm transition-all",
								active ?
									`${meta.border} ${meta.bg} ${meta.color}`
								:	`border-lines/15 text-lines/30 hover:${meta.border} hover:${meta.color}`,
							].join(" ")}>
							{meta.label} // {intel}
						</button>
					);
				})}
			</div>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// MISSION GENERATOR
// ═══════════════════════════════════════════════════════════════
function MissionGenerator({
	onGenerateRandomOps,
	onGenerateOps,
	onGenerateAIMission,
	setMapBounds,
	setImgURL,
	setMissionBriefing,
	setInfilPoint,
	setExfilPoint,
	setRallyPoint,
	setFallbackExfil,
	reconReports,
}) {
	const [selectedProvince, setSelectedProvince] = useState("");
	const [selectedLocations, setSelectedLocations] = useState([]);
	const [numberOfLocations, setNumberOfLocations] = useState(1);
	const [randomSelection, setRandomSelection] = useState([]);
	const [generationMode, setGenerationMode] = useState("random");
	const [missionType, setMissionType] = useState("");
	const [selectedReconId, setSelectedReconId] = useState(null);
	const [missionGenerated, setMissionGenerated] = useState(false);
	const [loading, setLoading] = useState(false);
	const [aiLoading, setAiLoading] = useState(false);

	const provinces = Object.keys(PROVINCES);
	const locationsInProvince =
		selectedProvince ? PROVINCES[selectedProvince].locations : [];
	const allProvinceCoords =
		selectedProvince ? locationsInProvince.map((l) => l.coordinates) : [];

	// Reset on mode or province change
	useEffect(() => {
		setSelectedLocations([]);
		setRandomSelection([]);
		setMissionGenerated(false);
		setMapBounds(null);
		setImgURL("");
		setInfilPoint(null);
		setExfilPoint(null);
		if (setRallyPoint) setRallyPoint(null);
		setFallbackExfil(null);
		setMissionBriefing("");
	}, [generationMode, selectedProvince]);

	// ── Phase 1: generate mission (locations + map) ───────────────────────────
	const generateRandomOps = async () => {
		if (!selectedProvince) {
			toast.warn("Select a province.");
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

	const handleGenerateMission = async () => {
		setLoading(true);
		setMissionGenerated(false);
		setMapBounds(null);
		setImgURL("");
		setInfilPoint(null);
		setExfilPoint(null);
		if (setRallyPoint) setRallyPoint(null);
		setFallbackExfil(null);
		try {
			if (generationMode === "random") await generateRandomOps();
			else await generateOps();
			// Points are NOT generated here — AI owns point placement in Phase 2
			setMissionGenerated(true);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	// ── Phase 2: AI generates briefing + all 3 map points ────────────────────
	const handleGenerateAIBriefing = async () => {
		if (!selectedProvince || !missionType || !missionGenerated) return;
		setAiLoading(true);

		// Clear stale points while AI thinks
		setInfilPoint(null);
		setExfilPoint(null);
		if (setRallyPoint) setRallyPoint(null);
		setFallbackExfil(null);

		try {
			const pd = PROVINCES[selectedProvince];

			// Resolve the currently selected objective locations
			const locations =
				generationMode === "random" ? randomSelection : (
					selectedLocations
						.map((n) => pd.locations.find((l) => l.name === n))
						.filter(Boolean)
				);

			// Resolve the selected recon report (null = run cold)
			const recon =
				selectedReconId != null ?
					((reconReports || []).find(
						(r, i) => (r._id ?? i) === selectedReconId,
					) ?? null)
				:	null;

			// Resolve terrain metadata — safe fallback if province not yet configured
			const terrain = PROVINCE_TERRAIN?.[selectedProvince] ?? {
				isIsland: false,
				hasCoast: false,
				coastZones: [],
				inlandWater: [],
				hasRoads: true,
				hasAirfield: false,
				notes: "No terrain data configured for this province.",
			};

			// Build a readable operation name
			const missionName = `${selectedProvince.replace(/([A-Z])/g, " $1").trim()} — ${missionType}`;

			const result = await generateGhostPackage({
				missionName,
				province: selectedProvince,
				biome: pd.biome,
				// If no locations somehow, fall back to province AOO
				locations:
					locations.length ? locations : (
						[
							{
								name: "Primary Objective",
								description: "No location intel on file.",
								coordinates: pd.AOO ?? [384, 683],
							},
						]
					),
				allLocations: pd.locations, // full list for spatial context
				missionType,
				terrain,
				recon,
			});

			// ── Place AI-generated points on the map ─────────────────────────
			setInfilPoint(result.infilPoint);
			setExfilPoint(result.exfilPoint);
			if (setRallyPoint) setRallyPoint(result.rallyPoint);
			// setFallbackExfil stays null — AI gave us a real exfil

			// ── Assemble briefing text from structured sections ───────────────
			const s = result.sections || {};
			const isSR = missionType === "Special Reconnaissance";

			const briefingLines = [
				s.ASSET_STATUS ? `ASSET STATUS:\n${s.ASSET_STATUS}` : null,
				s.MISSION_INTENT ? `MISSION INTENT:\n${s.MISSION_INTENT}` : null,
				s.INFILTRATION ? `INFILTRATION:\n${s.INFILTRATION}` : null,
				s.GEAR ? `GEAR:\n${s.GEAR}` : null,
				!isSR && s.LOADOUT ? `LOADOUT:\n${s.LOADOUT}` : null,
				s.RULES_OF_ENGAGEMENT ?
					`RULES OF ENGAGEMENT:\n${s.RULES_OF_ENGAGEMENT}`
				:	null,
				s.COMMANDERS_INTENT ?
					`COMMANDER'S INTENT:\n${s.COMMANDERS_INTENT}`
				:	null,
				result.approachVector ? `// Approach: ${result.approachVector}` : null,
			].filter(Boolean);

			const briefing = briefingLines.join("\n\n");
			if (!briefing) {
				toast.error("AI returned an empty briefing.");
				return;
			}

			onGenerateAIMission({
				briefing: briefing.trim(),
				infilPoint: result.infilPoint,
				exfilPoint: result.exfilPoint,
				rallyPoint: result.rallyPoint,
			});
			toast.success("Ghost Protocol Package generated.");
		} catch (err) {
			console.error(err);
			toast.error(err.message || "Failed to generate briefing.");
		} finally {
			setAiLoading(false);
		}
	};

	const aiDisabled = !missionGenerated || !missionType;
	const aiLabel =
		!missionGenerated ? "Generate Mission First"
		: !missionType ? "Select Mission Type"
		: "Generate AI Briefing";

	// ── Render ────────────────────────────────────────────────────────────────
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
								active ? "bg-btn/20 text-btn" : (
									"text-lines/35 hover:text-fontz hover:bg-white/[0.03]"
								),
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

			{/* Scrollable form body */}
			<div className='flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto'>
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

				{/* Random mode: location count stepper */}
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

				{/* Manual mode: location checklist */}
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

				{/* Mission type grid */}
				{selectedProvince && (
					<MissionTypeGrid
						value={missionType}
						onChange={setMissionType}
					/>
				)}

				{/* Recon chips — only shown after mission is generated */}
				{missionGenerated && (
					<>
						<div className='flex items-center gap-2'>
							<div className='flex-1 h-px bg-lines/12' />
							<span className='font-mono text-[7px] tracking-[0.3em] text-lines/20 uppercase'>
								Phase 2 Intel
							</span>
							<div className='flex-1 h-px bg-lines/12' />
						</div>
						<ReconChips
							reports={reconReports}
							selectedId={selectedReconId}
							onSelect={setSelectedReconId}
						/>
					</>
				)}
			</div>

			{/* Action buttons */}
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
				{missionGenerated && (
					<ActionBtn
						onClick={handleGenerateAIBriefing}
						loading={aiLoading}
						disabled={aiDisabled}
						icon={faRobot}
						label={aiLabel}
						variant={aiDisabled ? "muted" : "ai"}
						wide
					/>
				)}
			</div>
		</div>
	);
}

// ── PropTypes ─────────────────────────────────────────────────────────────────
HudSelect.propTypes = {
	label: PropTypes.string,
	value: PropTypes.string,
	onChange: PropTypes.func,
	children: PropTypes.node,
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
MissionTypeGrid.propTypes = {
	value: PropTypes.string,
	onChange: PropTypes.func.isRequired,
};
ReconChips.propTypes = {
	reports: PropTypes.array,
	selectedId: PropTypes.any,
	onSelect: PropTypes.func.isRequired,
};
MissionGenerator.propTypes = {
	onGenerateRandomOps: PropTypes.func.isRequired,
	onGenerateOps: PropTypes.func.isRequired,
	onGenerateAIMission: PropTypes.func.isRequired,
	setMapBounds: PropTypes.func.isRequired,
	setImgURL: PropTypes.func.isRequired,
	setInfilPoint: PropTypes.func.isRequired,
	setExfilPoint: PropTypes.func.isRequired,
	setRallyPoint: PropTypes.func, // new — AI-placed rally point
	setFallbackExfil: PropTypes.func.isRequired,
	setMissionBriefing: PropTypes.func.isRequired,
	reconReports: PropTypes.array,
};

export default MissionGenerator;
