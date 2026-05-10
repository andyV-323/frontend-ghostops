import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faChevronDown,
	faLocationDot,
	faSkullCrossbones,
	faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { WeatherPanel, AOIntelMap } from "@/components";
import { PROVINCES, PROVINCE_TERRAIN, PROVINCE_BIOMES } from "@/config";
import PropTypes from "prop-types";
import { getWeatherIcon } from "./dashboardHelpers";
import { getThreats } from "@/utils/Restrictions";

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

const DENY_LABEL = {
	airSupport: "Air Support",
	aviation: "Aviation",
	crossCom: "Cross-Com",
	drone: "Drones",
	armarosDrone: "Armaros",
	vehicle: "Vehicles",
};

// ─── Threats Panel ────────────────────────────────────────────────────────────

function ThreatsPanel({ provinceKey }) {
	const threats = getThreats(provinceKey);

	return (
		<div
			className='relative w-full overflow-hidden'
			style={{ fontFamily: "'Courier New','Lucida Console',monospace" }}>
			{/* Header */}
			<div
				className='flex items-center justify-between px-3 py-1.5 border-b border-neutral-800/60'
				style={{ background: "rgba(239,68,68,0.06)" }}>
				<span className='text-[8px] uppercase tracking-[0.35em] font-bold text-red-400/80'>
					◈ Threat Intelligence
				</span>
				<span className='text-[8px] uppercase tracking-widest text-btn/50'>
					{threats.length} Active
				</span>
			</div>

			<div className='px-3 py-3'>
				{threats.length === 0 ?
					<div className='flex items-center gap-3 px-3 py-3 border border-btn/20 bg-btn/5'>
						<span className='text-btn text-sm'>●</span>
						<div>
							<div className='text-xs font-bold uppercase tracking-widest text-btn'>
								AO Clear
							</div>
							<div className='text-[9px] text-btn/50 mt-0.5'>
								No active deny zones in this province
							</div>
						</div>
					</div>
				:	<div className='flex flex-col gap-2.5'>
						{threats.map((threat, i) => (
							<div
								key={i}
								className='border border-red-900/40 bg-red-950/10'>
								{/* Threat header row */}
								<div
									className='flex items-center justify-between gap-2 px-3 py-2 border-b border-red-900/30'
									style={{ background: "rgba(239,68,68,0.07)" }}>
									<div className='flex items-center gap-2 min-w-0'>
										<FontAwesomeIcon
											icon={
												threat.unlockable ?
													faTriangleExclamation
												:	faSkullCrossbones
											}
											className={`text-[10px] shrink-0 ${threat.unlockable ? "text-amber-400" : "text-red-400"}`}
										/>
										<span className='text-xs font-bold uppercase tracking-wide text-red-200 truncate'>
											{threat.name}
										</span>
									</div>
									{threat.unlockable && (
										<span className='text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 border border-amber-600/40 bg-amber-950/20 text-amber-400 shrink-0'>
											Unlockable
										</span>
									)}
								</div>

								{/* Deny categories */}
								{threat.denies?.length > 0 && (
									<div className='px-3 py-2 flex flex-wrap gap-1.5'>
										<span className='text-[8px] uppercase tracking-[0.25em] text-red-500/50 w-full mb-0.5'>
											Denies
										</span>
										{threat.denies.map((cat) => (
											<span
												key={cat}
												className='text-[9px] font-bold uppercase tracking-widest px-2 py-1 border border-red-800/40 bg-red-950/20 text-red-300'>
												{DENY_LABEL[cat] ?? cat}
											</span>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				}
			</div>
		</div>
	);
}

ThreatsPanel.propTypes = { provinceKey: PropTypes.string };

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AOBriefingPage() {
	const provinceKeys = Object.keys(PROVINCE_BIOMES);
	const [selectedKey, setSelectedKey] = useState(provinceKeys[0] || "");

	const province = PROVINCES[selectedKey];
	const terrain = PROVINCE_TERRAIN[selectedKey];
	const biome = province?.biome ?? PROVINCE_BIOMES[selectedKey] ?? "Unknown";
	const weatherMeta = getWeatherIcon(biome);
	const displayName = PROVINCE_DISPLAY_NAMES[selectedKey] || selectedKey;

	const mapBounds = province?.coordinates?.bounds ?? null;
	const imgURL = province?.imgURL ?? "";
	const hasMap = !!(mapBounds && imgURL);

	return (
		<div
			className='flex flex-col flex-1 min-h-0 overflow-hidden'
			style={{ fontFamily: "'Courier New','Lucida Console',monospace" }}>
			{/* ── Classification header ── */}
			<div
				className='shrink-0 flex items-center justify-between px-4 py-1 border-b border-neutral-800/60'
				style={{ background: "rgba(124,170,121,0.05)" }}>
				<span className='text-[8px] uppercase tracking-[0.4em] font-bold text-btn/60'>
					◈ Area of Operations — Intel Brief
				</span>
				<span className='text-[8px] uppercase tracking-widest text-neutral-600'>
					Auroa Archipelago
				</span>
			</div>

			{/* ── Province selector bar ── */}
			<div className='shrink-0 flex items-center gap-3 px-4 py-2 border-b border-neutral-700/50 bg-neutral-950/80'>
				<FontAwesomeIcon
					icon={weatherMeta.icon}
					className={`text-sm ${weatherMeta.color}`}
				/>

				<div className='relative flex items-center'>
					<select
						value={selectedKey}
						onChange={(e) => setSelectedKey(e.target.value)}
						className='appearance-none font-mono text-[10px] tracking-widest uppercase bg-neutral-900 border border-btn/30 text-fontz pr-7 pl-2 py-1.5 focus:outline-none focus:border-btn/60 transition-colors cursor-pointer font-bold'>
						{provinceKeys.map((k) => (
							<option
								key={k}
								value={k}>
								{PROVINCE_DISPLAY_NAMES[k] || k}
							</option>
						))}
					</select>
					<FontAwesomeIcon
						icon={faChevronDown}
						className='absolute right-2 text-[8px] text-btn/50 pointer-events-none'
					/>
				</div>

				<div className='flex-1 h-px bg-neutral-800/60' />

				{/* Biome badge */}
				<span className='font-mono text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 border border-btn/25 text-btn/70 hidden sm:inline'>
					{biome}
				</span>
				<span className='font-mono text-[7px] tracking-[0.3em] uppercase text-neutral-600 border border-neutral-800/60 px-1.5 py-0.5'>
					AO-INTEL
				</span>
			</div>

			{/* ── Body ── */}
			<div className='flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden'>
				{/* ── Map panel ── */}
				<div className='lg:flex-1 shrink-0 min-h-[320px] lg:w-[500px] xl:w-[500px] lg:min-h-0 relative overflow-hidden bg-neutral-950'>
					{hasMap ?
						<AOIntelMap
							bounds={mapBounds}
							imgURL={imgURL}
							province={selectedKey}
							terrain={terrain}
							provinceName={displayName}
							biome={biome}
						/>
					:	<div className='w-full h-full flex flex-col items-center justify-center gap-3'>
							<div className='w-10 h-10 border border-neutral-700/50 rotate-45' />
							<span className='text-[9px] tracking-[0.3em] uppercase text-neutral-600 font-bold'>
								No Map Data
							</span>
							<span className='text-[8px] tracking-widest uppercase text-neutral-700'>
								{displayName}
							</span>
						</div>
					}
				</div>

				{/* ── Right intel panel ── */}
				<div className='lg:w-[500px] xl:w-[500px] shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-neutral-800/60 bg-neutral-950/70 lg:overflow-y-auto divide-y divide-neutral-800/50'>
					{/* Province name band */}
					<div className='shrink-0 px-3 py-2.5 bg-neutral-900/50 border-b border-neutral-800/60'>
						<div className='flex items-center justify-between gap-2'>
							<div className='flex items-center gap-2 min-w-0'>
								<FontAwesomeIcon
									icon={faLocationDot}
									className='text-[9px] text-btn/60 shrink-0'
								/>
								<span className='text-xs font-bold uppercase tracking-widest text-fontz truncate'>
									{displayName}
								</span>
							</div>
							<span className='text-[8px] uppercase tracking-widest text-neutral-600 shrink-0'>
								{selectedKey}
							</span>
						</div>
					</div>

					{/* Weather */}
					<div className='shrink-0'>
						<WeatherPanel
							province={biome}
							provinceKey={selectedKey}
						/>
					</div>

					{/* Threats */}
					<div className='shrink-0'>
						<ThreatsPanel provinceKey={selectedKey} />
					</div>
				</div>
			</div>
		</div>
	);
}
