// ─────────────────────────────────────────────────────────────────────────────
// AIAdvisor.jsx
// Generates two contrasting COAs via Groq.  The advisory result is passed
// upstream via onGenerateAI so BriefingPage can open it in a sheet.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { PROVINCES } from "@/config";
import { generateAdvisory } from "@/api/GhostOpsApi";
import { buildTacticalContext } from "@/utils/BuildTacticalContext";
import { getProvinceWeather } from "@/utils/Weather";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faBrain,
	faSpinner,
	faPlus,
	faTrash,
	faRotateRight,
	faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

// ── Operation types ───────────────────────────────────────────────────────────

const OPERATION_TYPES = [
	{ id: "rescue",             label: "Personnel Recovery",  abbr: "RECOV", objectiveMode: "fixed_location" },
	{ id: "hvt_hunt",           label: "HVT Hunt",            abbr: "HVT",   objectiveMode: "fixed_location" },
	{ id: "direct_action",      label: "Direct Action",       abbr: "DA",    objectiveMode: "fixed_location" },
	{ id: "intel_gathering",    label: "Intel Gathering",     abbr: "INTEL", objectiveMode: "ao_exploration" },
	{ id: "convoy_interdiction",label: "Convoy Interdiction", abbr: "CI",    objectiveMode: "fixed_location" },
	{ id: "sabotage",           label: "Sabotage",            abbr: "SAB",   objectiveMode: "fixed_location" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function ActionBtn({ onClick, disabled, loading, icon, label, variant = "default", wide = false }) {
	const variants = {
		default: "text-btn border-btn/35 bg-btn/8 hover:bg-btn/18 hover:border-btn/60",
		primary: "text-blk border-btn bg-btn hover:bg-highlight",
		muted:   "text-lines/20 border-lines/10 bg-transparent cursor-not-allowed",
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
			{loading ? (
				<FontAwesomeIcon icon={faSpinner} className="animate-spin text-[10px]" />
			) : icon ? (
				<FontAwesomeIcon icon={icon} className="text-[10px]" />
			) : null}
			{label}
		</button>
	);
}

function OpTypeSelector({ value, onChange }) {
	return (
		<div className="flex flex-col gap-1.5">
			<span className="font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase">
				Operation Type
			</span>
			<div className="grid grid-cols-2 gap-1">
				{OPERATION_TYPES.map((op) => {
					const active = value === op.id;
					return (
						<button
							key={op.id}
							onClick={() => onChange(active ? "" : op.id)}
							className={[
								"flex flex-col gap-0.5 p-2 border rounded-sm text-left transition-all",
								active ? "border-btn/50 bg-btn/10" : "border-lines/15 hover:border-lines/30",
							].join(" ")}>
							<span className={`font-mono text-[9px] tracking-widest uppercase ${active ? "text-btn" : "text-lines/40"}`}>
								{op.abbr}
							</span>
							<span className={`font-mono text-[10px] ${active ? "text-fontz" : "text-fontz/50"}`}>
								{op.label}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

function ProvinceSelector({ value, onChange }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase">
				Province
			</span>
			<div className="relative">
				<select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="w-full appearance-none bg-blk/60 border border-lines/25 hover:border-lines/50 focus:border-btn/60 focus:outline-none rounded-sm px-3 py-2 font-mono text-[11px] text-fontz/80 cursor-pointer transition-colors">
					<option value="">— Select Province —</option>
					{Object.keys(PROVINCES).map((p) => (
						<option key={p} value={p}>{p}</option>
					))}
				</select>
				<div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
					<div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-lines/30" />
				</div>
			</div>
		</div>
	);
}

function LocationRow({ index, location, provinceLocations, onLocationChange, onRemove, totalCount }) {
	return (
		<div className="flex flex-col gap-1 p-2 border rounded-sm border-lines/15 bg-blk/30">
			<div className="flex items-center justify-between">
				<span className="font-mono text-[8px] tracking-widest uppercase text-lines/35">
					{`Location ${index + 1}`}
				</span>
				{totalCount > 1 && (
					<button onClick={onRemove} className="text-lines/25 hover:text-red-400/60 transition-colors">
						<FontAwesomeIcon icon={faTrash} className="text-[9px]" />
					</button>
				)}
			</div>
			<div className="relative">
				<select
					value={location}
					onChange={(e) => onLocationChange(e.target.value)}
					className="w-full appearance-none bg-blk/60 border border-lines/20 hover:border-lines/40 focus:border-btn/50 focus:outline-none rounded-sm px-2.5 py-1.5 font-mono text-[10px] text-fontz/70 cursor-pointer transition-colors">
					<option value="">— Select Location —</option>
					{provinceLocations.map((loc) => (
						<option key={loc.name} value={loc.name}>{loc.name}</option>
					))}
				</select>
				<div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
					<div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-lines/25" />
				</div>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AIAdvisor({ onGenerateAI, setMapBounds, setImgURL }) {
	const [province, setProvince]                   = useState("");
	const [opType, setOpType]                       = useState("");
	const [selectedLocations, setSelectedLocations] = useState([""]);
	const [context, setContext]                     = useState("");
	const [loading, setLoading]                     = useState(false);
	const [generatedName, setGeneratedName]         = useState(null);
	const [weather, setWeather]                     = useState(null);

	const provinceData      = province ? PROVINCES[province] : null;
	const provinceLocations = provinceData?.locations ?? [];
	const opTypeDef         = OPERATION_TYPES.find((o) => o.id === opType) ?? null;
	const isRecon           = opTypeDef?.objectiveMode === "ao_exploration";

	useEffect(() => {
		const pd = province ? PROVINCES[province] : null;
		if (!pd) {
			setWeather(null);
			setSelectedLocations([""]);
			return;
		}
		setWeather(getProvinceWeather(pd.biome));
		setSelectedLocations([""]);
	}, [province]);

	const addLocation    = () => setSelectedLocations((p) => p.length < 6 ? [...p, ""] : p);
	const removeLocation = (i) => setSelectedLocations((p) => p.filter((_, idx) => idx !== i));
	const updateLocation = (i, v) => setSelectedLocations((p) => p.map((l, idx) => idx === i ? v : l));

	const canGenerate = () => {
		if (!opType || !province) return false;
		return isRecon || selectedLocations.some((l) => l !== "");
	};

	const handleGenerate = async () => {
		if (!canGenerate()) {
			if (!opType)    toast.warn("Select an operation type.");
			else if (!province) toast.warn("Select a province.");
			else toast.warn("Select at least one location for this op type.");
			return;
		}

		setLoading(true);
		setGeneratedName(null);

		try {
			const pd           = PROVINCES[province];
			const filledLocs   = selectedLocations.filter((l) => l !== "");
			const objectiveMode = opTypeDef.objectiveMode;

			const tacticalContext = buildTacticalContext({
				province,
				provinceData: pd,
				locations: filledLocs,
				weather,
				opType,
				opTypeDef,
			});

			const systemPrompt =
				"You are a Ghost Recon Breakpoint special operations mission planner producing " +
				"classified Courses of Action (COAs) for Ghost operators on Auroa — a remote " +
				"technology archipelago seized by Sentinel Corp and defended by the Wolves.\n\n" +
				"ABSOLUTE RULES:\n" +
				"1. ONLY reference mechanics that exist in Ghost Recon Breakpoint.\n" +
				"2. Infiltration methods (ONLY these): HALO, HAHO, helo_insertion, " +
				"helo_landing_open_field, vehicle, on_foot, aquatic. " +
				"NEVER use fast-rope, rappel, or any other method.\n" +
				"3. Classes (EXACTLY these 7): Assault, Engineer, Panther, Sharpshooter, Medic, Echelon, Pathfinder.\n" +
				"4. teamSize: integer 1–4. Do NOT name specific operators.\n" +
				"5. Key threats: Azrael recon drones, Behemoth heavy drones, base alert level.\n" +
				"6. Tools that exist: recon drone, sync-shot drone, sync-shot teammates, " +
				"prone camo, suppressors, C4, mines.\n" +
				"7. Weather exploitation is real — lean on the AO's actual conditions.\n" +
				"8. COA-1 and COA-2 must be meaningfully contrasting in posture.\n" +
				"9. Return ONLY valid JSON. No markdown, no explanation.";

			const reconNote = isRecon
				? "\nIMPORTANT: This is AO-level reconnaissance — the objective may not yet be " +
				  "confirmed. Plan for sweeping the AO, establishing OPs, scouting routes. " +
				  "Do NOT assume the objective can be approached directly. " +
				  "objectiveMode must be \"ao_exploration\".\n"
				: "";

			const userPrompt =
				`Generate exactly two contrasting Courses of Action.\n\n` +
				`TACTICAL CONTEXT:\n${tacticalContext}\n\n` +
				`ADDITIONAL CONTEXT: ${context.trim() || "None provided."}\n` +
				`OBJECTIVE MODE: ${objectiveMode}\n` +
				reconNote +
				`\nCONSTRAINTS:\n` +
				`- objectiveMode must be "${objectiveMode}"\n` +
				`- COA-1 and COA-2 must contrast meaningfully\n` +
				`- teamSize per COA: integer 1–4\n` +
				`- classes length must equal teamSize; every class from the 7 allowed\n` +
				`- infiltration.method: HALO | HAHO | helo_insertion | helo_landing_open_field | vehicle | on_foot | aquatic\n` +
				`- courses must have exactly 2 entries with ids "coa1" and "coa2"\n` +
				`\nReturn this exact JSON (no extra keys, no markdown):\n` +
				`{\n` +
				`  "operationName": "TWO WORD CODENAME IN CAPS",\n` +
				`  "objectiveMode": "${objectiveMode}",\n` +
				`  "aoSummary": "METT-TC read: enemy disposition, key terrain, threats, alert level",\n` +
				`  "weatherImpact": "how AO weather shapes infiltration timing and detection",\n` +
				`  "recommendedCOA": "coa1 or coa2",\n` +
				`  "courses": [\n` +
				`    {\n` +
				`      "id": "coa1",\n` +
				`      "name": "short codename",\n` +
				`      "posture": "stealth | balanced | aggressive",\n` +
				`      "teamSize": 1,\n` +
				`      "classes": ["Panther"],\n` +
				`      "infiltration": { "method": "HAHO", "timing": "night", "rationale": "..." },\n` +
				`      "approach": { "vector": "...", "oakoc": "...", "movement": "..." },\n` +
				`      "loadout": { "primaryWeaponType": "suppressed AR", "camo": "...", "rationale": "..." },\n` +
				`      "execution": ["step1", "step2", "step3"],\n` +
				`      "contingencies": { "compromised": "...", "casualty": "..." },\n` +
				`      "exfil": { "method": "...", "rallyPoint": "...", "rationale": "..." },\n` +
				`      "tradeoffs": "what this COA gives up"\n` +
				`    },\n` +
				`    { ... second COA with id "coa2" ... }\n` +
				`  ]\n` +
				`}`;

			const result = await generateAdvisory({
				systemPrompt,
				userPrompt,
				province,
				provinceLocationNames: pd.locations.map((l) => l.name),
				opType,
			});

			setGeneratedName(result.operationName);

			const locationObjs = filledLocs
				.map((n) => pd.locations.find((l) => l.name === n))
				.filter(Boolean);

			const payload = {
				operationName:      result.operationName,
				opType,
				aiGenerated:        true,
				narrative:          result.aoSummary,
				operationStructure: "direct_action",
				friendlyConcerns:   "",
				exfilPlan:          "",
				campaignPhases:     [],
				selectedProvince:   province,
				biome:              pd.biome,
				bounds:             pd.coordinates.bounds,
				imgURL:             pd.imgURL,
				missionType:        "",
				randomSelection:    locationObjs,
				briefing:           "",
				infilPoint:         null,
				exfilPoint:         null,
				rallyPoint:         null,
				infilMethod:        null,
				exfilMethod:        null,
				approachVector:     null,
				advisory:           result,
			};

			onGenerateAI(payload);
			setMapBounds(pd.coordinates.bounds);
			setImgURL(pd.imgURL);

			toast.success(`Operation ${result.operationName} — open Advisory sheet to review COAs.`);
		} catch (err) {
			console.error(err);
			toast.error(err.message || "Advisory generation failed.");
		} finally {
			setLoading(false);
		}
	};

	const ATM_LABELS = {
		cloudless: "Cloudless", sunshine: "Sunshine", overcast: "Overcast",
		precipitation: "Precipitation", storm: "Storm",
	};

	return (
		<div className="flex flex-col gap-4 h-full">
			<div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
				<OpTypeSelector value={opType} onChange={setOpType} />
				<ProvinceSelector value={province} onChange={setProvince} />

				{/* Weather — read-only, auto-derived from province */}
				{province && weather && (
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<span className="font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase">
								AO Weather
							</span>
							<button
								onClick={() => setWeather(getProvinceWeather(provinceData?.biome))}
								className="flex items-center gap-1 font-mono text-[8px] text-lines/25 hover:text-btn/60 transition-colors">
								<FontAwesomeIcon icon={faRotateRight} className="text-[8px]" />
								reroll
							</button>
						</div>
						<div className="flex items-center gap-2 px-2.5 py-1.5 border border-lines/15 rounded-sm bg-blk/30">
							<span className="font-mono text-[10px] text-fontz/55">
								{ATM_LABELS[weather.atmosphere] ?? weather.atmosphere}
							</span>
							<span className="text-lines/20">·</span>
							<span className="font-mono text-[10px] text-fontz/45">
								{weather.temperature?.value}°{weather.temperature?.unit}
							</span>
							<span className="text-lines/20">·</span>
							<span className="font-mono text-[9px] text-lines/35 uppercase">
								{weather.humidity} humidity
							</span>
						</div>
					</div>
				)}

				{/* Location pickers */}
				{province && (
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<span className="font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase">
								{isRecon ? (
									<>Locations{" "}<span className="text-lines/25 normal-case tracking-normal">optional</span></>
								) : "Locations"}
							</span>
							{selectedLocations.length < 6 && (
								<button
									onClick={addLocation}
									className="flex items-center gap-1.5 font-mono text-[9px] text-lines/35 hover:text-btn transition-colors">
									<FontAwesomeIcon icon={faPlus} className="text-[8px]" />
									Add
								</button>
							)}
						</div>
						<div className="flex flex-col gap-1.5">
							{selectedLocations.map((loc, index) => (
								<LocationRow
									key={index}
									index={index}
									location={loc}
									provinceLocations={provinceLocations}
									onLocationChange={(val) => updateLocation(index, val)}
									onRemove={() => removeLocation(index)}
									totalCount={selectedLocations.length}
								/>
							))}
						</div>
					</div>
				)}

				{/* Optional context */}
				<div className="flex flex-col gap-1">
					<span className="font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase">
						Context{" "}<span className="text-lines/25 normal-case tracking-normal">optional</span>
					</span>
					<textarea
						value={context}
						onChange={(e) => setContext(e.target.value)}
						maxLength={200}
						rows={2}
						placeholder="e.g. locate the Wolves comms officer before the convoy departs"
						className="w-full bg-blk/60 border border-lines/25 hover:border-lines/40 focus:border-btn/50 focus:outline-none rounded-sm px-3 py-2 font-mono text-[10px] text-fontz/70 placeholder:text-lines/20 resize-none transition-colors"
					/>
				</div>

				{/* Post-generation indicator */}
				{generatedName && (
					<div className="flex items-center gap-2 px-2.5 py-2 border border-btn/20 rounded-sm bg-btn/5">
						<FontAwesomeIcon icon={faCheckCircle} className="text-btn/60 text-[10px] shrink-0" />
						<div className="flex flex-col min-w-0">
							<span className="font-mono text-[9px] tracking-widest text-btn/70 uppercase">
								{generatedName}
							</span>
							<span className="font-mono text-[9px] text-lines/35">
								Open Advisory from the header to review COAs
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Generate button */}
			<div className="shrink-0">
				<ActionBtn
					onClick={handleGenerate}
					loading={loading}
					disabled={!canGenerate()}
					icon={faBrain}
					label={loading ? "Generating..." : "Generate Advisory"}
					variant="primary"
					wide
				/>
			</div>
		</div>
	);
}

// ─── PropTypes ────────────────────────────────────────────────────────────────

AIAdvisor.propTypes = {
	onGenerateAI: PropTypes.func.isRequired,
	setMapBounds:  PropTypes.func.isRequired,
	setImgURL:     PropTypes.func.isRequired,
};

ActionBtn.propTypes = {
	onClick: PropTypes.func, disabled: PropTypes.bool, loading: PropTypes.bool,
	icon: PropTypes.object, label: PropTypes.string, variant: PropTypes.string, wide: PropTypes.bool,
};

OpTypeSelector.propTypes = { value: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired };
ProvinceSelector.propTypes = { value: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired };

LocationRow.propTypes = {
	index: PropTypes.number.isRequired, location: PropTypes.string.isRequired,
	provinceLocations: PropTypes.array.isRequired, onLocationChange: PropTypes.func.isRequired,
	onRemove: PropTypes.func.isRequired, totalCount: PropTypes.number.isRequired,
};
