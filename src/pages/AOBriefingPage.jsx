import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { WeatherPanel, AOIntelMap } from "@/components";
import { PROVINCES, PROVINCE_TERRAIN, PROVINCE_BIOMES, SOURCE, STATUS } from "@/config";
import PropTypes from "prop-types";
import { getWeatherIcon } from "./dashboardHelpers";
import {
	resolveRestrictions,
	RESTRICTION_LABELS,
} from "@/utils/Restrictions";

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

// ─── Source badge ─────────────────────────────────────────────────────────────

const SOURCE_STYLE = {
	[SOURCE.THREAT]: "border-red-900/60 bg-red-950/20 text-red-400/80",
	[SOURCE.WEATHER]: "border-sky-900/60 bg-sky-950/20 text-sky-400/80",
	[SOURCE.TERRAIN]: "border-amber-900/60 bg-amber-950/20 text-amber-500/70",
	[SOURCE.THREAT_WEATHER]: "border-orange-900/60 bg-orange-950/20 text-orange-400/80",
	[SOURCE.TERRAIN_WEATHER]: "border-yellow-900/60 bg-yellow-950/20 text-yellow-500/70",
};

const SOURCE_LABEL = {
	[SOURCE.THREAT]: "THREAT",
	[SOURCE.WEATHER]: "WEATHER",
	[SOURCE.TERRAIN]: "TERRAIN",
	[SOURCE.THREAT_WEATHER]: "THREAT / WTHR",
	[SOURCE.TERRAIN_WEATHER]: "TERRAIN / WTHR",
};

function SourceBadge({ source }) {
	const cls = SOURCE_STYLE[source] ?? "border-neutral-800 text-neutral-600";
	return (
		<span className={`font-mono text-[6px] tracking-widest uppercase px-1.5 py-0.5 border rounded-sm shrink-0 ${cls}`}>
			{SOURCE_LABEL[source] ?? source}
		</span>
	);
}

SourceBadge.propTypes = { source: PropTypes.string };

// ─── Asset restriction row ────────────────────────────────────────────────────

function AssetRow({ assetKey, entry }) {
	const label = RESTRICTION_LABELS[assetKey] ?? assetKey.toUpperCase();
	const isDenied = entry.status === STATUS.DENIED;
	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex items-center justify-between gap-2'>
				<span className={`font-mono text-[8px] tracking-wider uppercase ${isDenied ? "text-red-400/90" : "text-amber-400/90"}`}>
					{label}
				</span>
				<div className='flex items-center gap-1.5 shrink-0'>
					<SourceBadge source={entry.source} />
					<span className={`font-mono text-[6px] tracking-widest uppercase px-1.5 py-0.5 border rounded-sm ${isDenied ? "border-red-900/60 bg-red-950/20 text-red-400/80" : "border-amber-900/60 bg-amber-950/20 text-amber-500/70"}`}>
						{entry.status.toUpperCase()}
					</span>
				</div>
			</div>
			{entry.reason && (
				<p className='font-mono text-[7px] text-neutral-500 leading-relaxed border-l-2 border-neutral-800 pl-3'>
					{entry.reason}
					{entry.unlockable && (
						<span className='block mt-0.5 text-[6px] tracking-widest text-amber-600/70 uppercase'>
							↑ Threat-sourced — unlockable via campaign
						</span>
					)}
				</p>
			)}
		</div>
	);
}

AssetRow.propTypes = {
	assetKey: PropTypes.string,
	entry: PropTypes.shape({
		status: PropTypes.string,
		source: PropTypes.string,
		reason: PropTypes.string,
		unlockable: PropTypes.bool,
	}),
};

// ─── Terrain badge ────────────────────────────────────────────────────────────

function TerrainBadge({ label, active }) {
	return (
		<div
			className={[
				"flex items-center gap-1.5 px-2 py-1 rounded-sm border font-mono text-[7px] tracking-widest uppercase",
				active ?
					"border-green-900/50 bg-green-950/20 text-green-400/80"
				:	"border-neutral-800/60 bg-neutral-900/30 text-neutral-700",
			].join(" ")}>
			<span className={`w-1 h-1 rounded-full shrink-0 ${active ? "bg-green-500" : "bg-neutral-700"}`} />
			{label}
		</div>
	);
}

TerrainBadge.propTypes = { label: PropTypes.string, active: PropTypes.bool };

// ═══════════════════════════════════════════════════════════════════════════════
// AO BRIEFING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

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

	const restrictions = resolveRestrictions(selectedKey);
	const restrictedEntries = restrictions
		? Object.entries(restrictions).filter(
				([, v]) => v.status !== STATUS.NOMINAL,
			)
		: [];

	return (
		<div className='flex flex-col flex-1 min-h-0 overflow-hidden'>

			{/* ── Province selector ──────────────────────────────────── */}
			<div className='shrink-0 flex items-center gap-3 px-4 py-2 border-b border-neutral-700/50 bg-neutral-950/80'>
				<FontAwesomeIcon
					icon={weatherMeta.icon}
					className={`text-sm ${weatherMeta.color}`}
				/>
				<select
					value={selectedKey}
					onChange={(e) => setSelectedKey(e.target.value)}
					className='font-mono text-[10px] tracking-widest uppercase bg-neutral-900 border border-neutral-700/60 text-btn rounded-sm px-2 py-1 focus:outline-none focus:border-btn/50 transition-colors cursor-pointer'>
					{provinceKeys.map((k) => (
						<option key={k} value={k}>
							{PROVINCE_DISPLAY_NAMES[k] || k}
						</option>
					))}
				</select>
				<div className='flex-1 h-px bg-neutral-800/60' />
				<span className='font-mono text-[8px] tracking-widest uppercase text-neutral-600 hidden sm:inline'>
					{biome}
				</span>
				<span className='font-mono text-[7px] tracking-[0.25em] uppercase text-neutral-700 border border-neutral-800/60 px-1.5 py-0.5 rounded-sm'>
					AO-INTEL
				</span>
			</div>

			{/* ── Body ───────────────────────────────────────────────── */}
			<div className='flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden'>

				{/* ── MAP ────────────────────────────────────────────── */}
				<div className='lg:flex-1 shrink-0 min-h-[320px] lg:min-h-0 relative overflow-hidden bg-neutral-950'>
					{hasMap ? (
						<AOIntelMap
							bounds={mapBounds}
							imgURL={imgURL}
							province={selectedKey}
							terrain={terrain}
							provinceName={displayName}
							biome={biome}
						/>
					) : (
						<div className='w-full h-full flex flex-col items-center justify-center gap-2'>
							<div className='w-8 h-8 border border-neutral-700/50 rotate-45' />
							<span
								style={{ fontFamily: "'Share Tech Mono', monospace" }}
								className='text-[9px] tracking-widest uppercase text-neutral-700'>
								No Map Data
							</span>
						</div>
					)}
				</div>

				{/* ── RIGHT INTEL PANEL ──────────────────────────────── */}
				<div className='lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-neutral-800/60 bg-neutral-950/70 lg:overflow-y-auto divide-y divide-neutral-800/50'>

					{/* Weather */}
					<div className='shrink-0'>
						<WeatherPanel
							province={biome}
							provinceKey={selectedKey}
						/>
					</div>

					{/* Terrain Intel */}
					{terrain && (
						<div className='p-4 flex flex-col gap-3'>
							<span className='font-mono text-[7px] tracking-[0.25em] uppercase text-neutral-600'>
								Terrain Intel
							</span>
							<div className='grid grid-cols-2 gap-1.5'>
								<TerrainBadge label='Island' active={terrain.isIsland} />
								<TerrainBadge label='Coastline' active={terrain.hasCoast} />
								<TerrainBadge label='Road Network' active={terrain.hasRoads} />
								<TerrainBadge label='Airfield' active={terrain.hasAirfield} />
							</div>
							{terrain.notes && (
								<p className='font-mono text-[8px] text-neutral-500 leading-relaxed border-l-2 border-neutral-800 pl-3'>
									{terrain.notes}
								</p>
							)}
							{terrain.coastZones?.length > 0 && (
								<div className='flex flex-col gap-1'>
									<span className='font-mono text-[7px] tracking-widest uppercase text-neutral-700'>
										Insertion Zones
									</span>
									{terrain.coastZones.map((z, i) => (
										<div key={i} className='flex items-center gap-2'>
											<span className='font-mono text-[7px] text-neutral-600 capitalize w-8 shrink-0'>
												{z.side}
											</span>
											<div className='flex-1 h-px bg-neutral-800/80' />
											<span className='font-mono text-[7px] text-neutral-500 text-right'>
												{z.label}
											</span>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Asset Status */}
					<div className='p-4 flex flex-col gap-3'>
						<span className='font-mono text-[7px] tracking-[0.25em] uppercase text-neutral-600'>
							Asset Status
						</span>
						{restrictedEntries.length === 0 ? (
							<p className='font-mono text-[8px] text-neutral-600 italic'>
								All assets nominal. No restrictions in this AO.
							</p>
						) : (
							<div className='flex flex-col gap-3'>
								{restrictedEntries.map(([key, entry]) => (
									<AssetRow key={key} assetKey={key} entry={entry} />
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
