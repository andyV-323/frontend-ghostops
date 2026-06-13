import { useState, useEffect, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faRotate, faXmark } from "@fortawesome/free-solid-svg-icons";
import { AOIntelMap } from "@/components";
import { PROVINCES, PROVINCE_BIOMES } from "@/config";
import PropTypes from "prop-types";
import { getWeatherConditionData } from "@/utils/Restrictions";
import { selectTemperature, selectAtmosphere } from "@/utils/Weather";
import { PROVINCE_LOC_CONFIG } from "@/utils/locationTypes";
import useTeamsStore from "@/zustand/useTeamStore";

// ─── Province display names ───────────────────────────────────────────────────

const PROVINCE_DISPLAY_NAMES = {
	CapeNorth: "Cape North",
	DriftwoodIslets: "Driftwood Islets",
	Golem1: "Golem Island — Sector 1",
	Golem2: "Golem Island — Sector 2",
	Golem3: "Golem Island — Sector 3",
	WildCoast: "Wild Coast",
	SmugglersCoves: "Smugglers Coves",
	WhalersBay: "Whalers Bay",
	FenBog: "Fen Bog",
	SinkingCountry: "Sinking Country",
	GoodHopeMountain: "Good Hope Mountain",
	SilentMountain: "Silent Mountain",
	MountHodgson: "Mount Hodgson",
	Channels: "The Channels",
	SealIslands: "Seal Islands",
	NewArgyll: "New Argyll",
	NewStirling: "New Stirling",
	WindyIslands: "Windy Islands",
	Infinity: "Infinity",
	Liberty: "Liberty",
	RestrictedArea01: "Restricted Area 01",
	LakeCountry: "Lake Country",
};

// ─── Atmosphere config ────────────────────────────────────────────────────────

const ATM = {
	cloudless:     { code: "CLR",  color: "#38bdf8", label: "Cloudless",     icon: "○" },
	sunshine:      { code: "SUN",  color: "#fbbf24", label: "Sunshine",      icon: "◐" },
	overcast:      { code: "OVC",  color: "#94a3b8", label: "Overcast",      icon: "●" },
	precipitation: { code: "PCPN", color: "#60a5fa", label: "Precipitation", icon: "▽" },
	storm:         { code: "STRM", color: "#f87171", label: "Storm",         icon: "▼" },
};

// ─── Weather panel ────────────────────────────────────────────────────────────

function WeatherPanel({ atmosphere, tempData, condData, onAtmosphereChange, onReroll }) {
	const atm = ATM[atmosphere] ?? ATM.overcast;
	const allowed = condData?.mobility ?? [];
	const mob = {
		FOOT:  allowed.includes("foot")           ? "GO" : "DENY",
		VHC:   allowed.includes("ground vehicle") ? "GO" : "DENY",
		AIR:   allowed.includes("aircraft")       ? "GO" : "DENY",
		BOAT:  allowed.includes("boat")           ? "GO" : "DENY",
	};
	return (
		<div className='border-b border-lines/60'>
			{/* Section header */}
			<div className='flex items-center justify-between px-4 py-2.5 border-b border-lines/60 bg-neutral-950/60'>
				<span className='font-mono text-[10px] tracking-[0.35em] uppercase text-btn/60'>
					Weather
				</span>
				<button
					onClick={onReroll}
					title='Reroll weather'
					className='text-lines/40 hover:text-btn transition-colors'>
					<FontAwesomeIcon icon={faRotate} className='text-xs' />
				</button>
			</div>

			<div className='px-4 py-4 flex flex-col gap-4'>
				{/* Atmosphere — current condition */}
				<div className='flex items-center gap-3'>
					<span
						className='text-3xl leading-none'
						style={{ color: atm.color }}>
						{atm.icon}
					</span>
					<div>
						<p
							className='font-mono text-base font-bold tracking-widest uppercase'
							style={{ color: atm.color }}>
							{atm.label}
						</p>
						{tempData && (
							<p className='font-mono text-sm tracking-wide text-lines'>
								{tempData.value}°{tempData.unit}
							</p>
						)}
					</div>
				</div>

				{/* Atmosphere selector */}
				<div className='flex gap-1'>
					{Object.entries(ATM).map(([key, cfg]) => (
						<button
							key={key}
							onClick={() => onAtmosphereChange(key)}
							className={[
								"flex-1 font-mono text-[10px] tracking-wider uppercase py-1.5 border transition-all",
								atmosphere === key
									? "border-btn/60 bg-btn/10 text-btn"
									: "border-lines/40 text-lines hover:border-lines/70 hover:text-fontz",
							].join(" ")}>
							{cfg.code}
						</button>
					))}
				</div>

				{/* Mobility grid */}
				<div>
					<p className='font-mono text-[10px] tracking-[0.3em] uppercase text-lines mb-2'>
						Mobility
					</p>
					<div className='grid grid-cols-4 gap-1.5'>
						{Object.entries(mob).map(([label, val]) => (
							<div
								key={label}
								className='flex flex-col items-center gap-1 border border-lines/40 py-2 bg-neutral-950/40'>
								<span className='font-mono text-[10px] tracking-widest uppercase text-lines'>
									{label}
								</span>
								<span
									className={[
										"font-mono text-xs font-bold tracking-wide",
										val === "GO" ? "text-btn" : "text-red-400",
									].join(" ")}>
									{val}
								</span>
							</div>
						))}
					</div>
				</div>

			</div>
		</div>
	);
}

WeatherPanel.propTypes = {
	atmosphere: PropTypes.string,
	tempData: PropTypes.object,
	condData: PropTypes.object,
	onAtmosphereChange: PropTypes.func,
	onReroll: PropTypes.func,
};

// ─── Selected location detail ─────────────────────────────────────────────────

function LocationDetail({ location, onClear }) {
	const config = location.locConfig ?? PROVINCE_LOC_CONFIG[location.type] ?? PROVINCE_LOC_CONFIG.poi;

	return (
		<div className='border-b border-lines/60'>
			<div className='flex items-center justify-between px-4 py-2.5 border-b border-lines/60 bg-neutral-950/60'>
				<span className='font-mono text-[10px] tracking-[0.35em] uppercase text-btn/60'>
					Selected Location
				</span>
				<button
					onClick={onClear}
					className='text-lines/50 hover:text-fontz transition-colors'>
					<FontAwesomeIcon icon={faXmark} className='text-xs' />
				</button>
			</div>

			<div className='px-4 py-4 flex flex-col gap-3'>
				{/* Symbol + type badge + name */}
				<div className='flex items-start gap-2.5'>
					<span
						className='text-xl leading-none shrink-0 mt-0.5'
						style={{ color: config.color }}>
						{config.symbol}
					</span>
					<div className='min-w-0'>
						<p className='font-mono text-sm font-bold uppercase tracking-wide text-fontz leading-snug'>
							{location.name}
						</p>
						<span
							className='font-mono text-[10px] font-bold uppercase tracking-widest'
							style={{ color: config.color }}>
							{config.label}
						</span>
					</div>
				</div>

				{/* Description */}
				{location.description && (
					<p className='font-mono text-xs leading-relaxed text-lines/80'>
						{location.description}
					</p>
				)}
			</div>
		</div>
	);
}

LocationDetail.propTypes = {
	location: PropTypes.object.isRequired,
	onClear: PropTypes.func.isRequired,
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AOBriefingPage() {
	const provinceKeys = Object.keys(PROVINCE_BIOMES);
	const [selectedKey, setSelectedKey] = useState(provinceKeys[0] || "");
	const [selectedLocation, setSelectedLocation] = useState(null);
	const [atmosphere, setAtmosphere] = useState(null);
	const [tempData, setTempData] = useState(null);

	// Roll weather whenever province changes
	useEffect(() => {
		const province = PROVINCES[selectedKey];
		const biomeKey = province?.biome ?? PROVINCE_BIOMES[selectedKey] ?? "";
		setAtmosphere(selectAtmosphere(biomeKey) ?? "overcast");
		setTempData(selectTemperature(biomeKey, "F"));
		setSelectedLocation(null);
	}, [selectedKey]);

	const rollTemp = useCallback(() => {
		const province = PROVINCES[selectedKey];
		const biomeKey = province?.biome ?? PROVINCE_BIOMES[selectedKey] ?? "";
		setAtmosphere(selectAtmosphere(biomeKey) ?? "overcast");
		setTempData(selectTemperature(biomeKey, "F"));
	}, [selectedKey]);

	const { teams, fetchTeams } = useTeamsStore();
	useEffect(() => { fetchTeams(); }, [fetchTeams]);

	const activeAOs = useMemo(() => {
		const s = new Set((teams ?? []).filter((t) => t.AO).map((t) => t.AO));
		return [...s];
	}, [teams]);

	const province = PROVINCES[selectedKey];
	const displayName = PROVINCE_DISPLAY_NAMES[selectedKey] || selectedKey;
	const mapBounds = province?.coordinates?.bounds ?? null;
	const imgURL = province?.imgURL ?? "";
	const hasMap = !!(mapBounds && imgURL);

	const condData = useMemo(
		() => getWeatherConditionData(selectedKey, atmosphere),
		[selectedKey, atmosphere],
	);

	const provinceLocations = useMemo(
		() => PROVINCES[selectedKey]?.locations ?? [],
		[selectedKey],
	);

	return (
		<div className='flex flex-col flex-1 min-h-0 overflow-hidden font-mono'>
			{/* ── Header: province selector + active AO chips ── */}
			<div className='shrink-0 flex items-center gap-3 px-4 py-2 border-b border-lines/60 bg-neutral-950/80'>
				<div className='relative flex items-center'>
					<select
						value={selectedKey}
						onChange={(e) => setSelectedKey(e.target.value)}
						className='appearance-none font-mono text-xs tracking-widest uppercase bg-neutral-900 border border-btn/30 text-fontz pr-7 pl-2 py-1.5 focus:outline-none focus:border-btn/60 transition-colors cursor-pointer font-bold'>
						{provinceKeys.map((k) => (
							<option key={k} value={k}>
								{PROVINCE_DISPLAY_NAMES[k] || k}
							</option>
						))}
					</select>
					<FontAwesomeIcon
						icon={faChevronDown}
						className='absolute right-2 text-[10px] text-btn/50 pointer-events-none'
					/>
				</div>

				{activeAOs.length > 0 && (
					<>
						<div className='h-4 w-px bg-neutral-700/50 shrink-0' />
						<span className='font-mono text-[10px] tracking-[0.35em] text-btn/50 uppercase shrink-0'>
							●
						</span>
						<div className='flex items-center gap-1.5 overflow-x-auto min-w-0 flex-1'>
							{activeAOs.map((ao) => (
								<button
									key={ao}
									onClick={() => setSelectedKey(ao)}
									className={[
										"font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 border transition-colors shrink-0",
										selectedKey === ao
											? "text-btn border-btn/60 bg-btn/10"
											: "text-lines border-lines/40 hover:text-btn hover:border-btn/40",
									].join(" ")}>
									{PROVINCE_DISPLAY_NAMES[ao] || ao}
								</button>
							))}
						</div>
					</>
				)}
			</div>

			{/* ── Body ── */}
			<div className='flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden'>
				{/* ══ MAP ══ */}
				<div className='h-[52vh] lg:h-auto lg:flex-1 relative overflow-hidden bg-neutral-950'>
					{hasMap ? (
						<AOIntelMap
							bounds={mapBounds}
							imgURL={imgURL}
							locations={provinceLocations}
							onLocationSelect={setSelectedLocation}
						/>
					) : (
						<div className='w-full h-full flex flex-col items-center justify-center gap-3'>
							<div className='w-10 h-10 border border-lines/60 rotate-45' />
							<span className='font-mono text-xs tracking-[0.3em] uppercase text-lines font-bold'>
								No Map Data
							</span>
							<span className='font-mono text-[11px] tracking-widest uppercase text-lines'>
								{displayName}
							</span>
						</div>
					)}
				</div>

				{/* ══ RIGHT PANEL ══ */}
				<div className='flex-1 lg:flex-none lg:w-[320px] shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-lines/60 bg-neutral-950/80 overflow-y-auto'>
					{/* Biome */}
					{province?.biome && (
						<div className='px-4 py-2.5 border-b border-lines/60 bg-neutral-950/60 flex items-center gap-2'>
							<span className='font-mono text-[10px] tracking-[0.35em] uppercase text-btn/60 shrink-0'>
								Biome
							</span>
							<span className='font-mono text-xs tracking-widest uppercase text-fontz font-bold'>
								{province.biome}
							</span>
						</div>
					)}

					<WeatherPanel
						atmosphere={atmosphere}
						tempData={tempData}
						condData={condData}
						onAtmosphereChange={setAtmosphere}
						onReroll={rollTemp}
					/>

					{selectedLocation && (
						<LocationDetail
							location={selectedLocation}
							onClear={() => setSelectedLocation(null)}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
