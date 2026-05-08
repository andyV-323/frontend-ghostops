import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { WeatherPanel, AOIntelMap } from "@/components";
import {
	PROVINCES,
	PROVINCE_TERRAIN,
	PROVINCE_BIOMES,
} from "@/config";
import PropTypes from "prop-types";
import { getWeatherIcon } from "./dashboardHelpers";
import { getThreats } from "@/utils/Restrictions";

// ─── Province display names ───────────────────────────────────────────────────

const PROVINCE_DISPLAY_NAMES = {
	CapeNorth:        "Cape North",
	DriftwoodIslets:  "Driftwood Islets",
	Golem1:           "Golem Island — Sector 1",
	Golem2:           "Golem Island — Sector 2",
	Golem3:           "Golem Island — Sector 3",
	WildCoast:        "Wild Coast",
	SmugglersCoves:   "Smugglers Coves",
	WhalersBay:       "Whalers Bay",
	FenBog:           "Fen Bog",
	SinkingCountry:   "Sinking Country",
	GoodHopeMountain: "Good Hope Mountain",
	SilentMountain:   "Silent Mountain",
	MountHodgson:     "Mount Hodgson",
	Channels:         "The Channels",
	SealIslands:      "Seal Islands",
	NewArgyll:        "New Argyll",
	NewStirling:      "New Stirling",
	WindyIslands:     "Windy Islands",
	Infinity:         "Infinity",
	Liberty:          "Liberty",
	RestrictedArea01: "Restricted Area 01",
	LakeCountry:      "Lake Country",
};

// ─── Deny category display labels ─────────────────────────────────────────────

const DENY_LABEL = {
	airSupport:   "Air Support",
	aviation:     "Aviation",
	crossCom:     "Cross-Com",
	drone:        "Drones",
	armarosDrone: "Armaros",
	vehicle:      "Vehicles",
};

// ─── Threats panel ────────────────────────────────────────────────────────────

function ThreatsPanel({ provinceKey }) {
	const threats = getThreats(provinceKey);

	return (
		<div
			className="px-3 py-3"
			style={{ fontFamily: "'Courier New', 'Lucida Console', monospace" }}
		>
			<div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-3">
				Active Threats
			</div>

			{threats.length === 0 ? (
				<div className="flex items-center gap-2.5 py-1">
					<span
						className="w-2 h-2 rounded-full bg-green-500/50 shrink-0"
						style={{ boxShadow: "0 0 4px rgba(34,197,94,0.4)" }}
					/>
					<span className="text-[9px] text-green-500/60 uppercase tracking-wider">
						No active deny zones in this AO
					</span>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{threats.map((threat, i) => (
						<div key={i} className="flex flex-col gap-1.5">
							<div className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2 min-w-0">
									<span className="text-red-500/70 text-[9px] shrink-0">◆</span>
									<span className="text-[9px] uppercase tracking-wide text-red-300/80 font-semibold truncate">
										{threat.name}
									</span>
								</div>
								{threat.unlockable && (
									<span className="text-[7px] tracking-widest uppercase px-1.5 py-0.5 border border-amber-800/50 bg-amber-950/20 text-amber-600/70 shrink-0 rounded-sm">
										Unlockable
									</span>
								)}
							</div>
							{threat.denies?.length > 0 && (
								<div className="flex flex-wrap gap-1 pl-4">
									{threat.denies.map((cat) => (
										<span
											key={cat}
											className="text-[7px] uppercase tracking-widest px-1.5 py-0.5 border border-red-900/40 bg-red-950/15 text-red-500/60 rounded-sm"
										>
											{DENY_LABEL[cat] ?? cat}
										</span>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

ThreatsPanel.propTypes = { provinceKey: PropTypes.string };

// ═══════════════════════════════════════════════════════════════════════════════
// AO BRIEFING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function AOBriefingPage() {
	const provinceKeys = Object.keys(PROVINCE_BIOMES);
	const [selectedKey, setSelectedKey] = useState(provinceKeys[0] || "");

	const province    = PROVINCES[selectedKey];
	const terrain     = PROVINCE_TERRAIN[selectedKey];
	const biome       = province?.biome ?? PROVINCE_BIOMES[selectedKey] ?? "Unknown";
	const weatherMeta = getWeatherIcon(biome);
	const displayName = PROVINCE_DISPLAY_NAMES[selectedKey] || selectedKey;

	const mapBounds = province?.coordinates?.bounds ?? null;
	const imgURL    = province?.imgURL ?? "";
	const hasMap    = !!(mapBounds && imgURL);

	return (
		<div className="flex flex-col flex-1 min-h-0 overflow-hidden">
			{/* ── Province selector ── */}
			<div className="shrink-0 flex items-center gap-3 px-4 py-2 border-b border-neutral-700/50 bg-neutral-950/80">
				<FontAwesomeIcon
					icon={weatherMeta.icon}
					className={`text-sm ${weatherMeta.color}`}
				/>
				<select
					value={selectedKey}
					onChange={(e) => setSelectedKey(e.target.value)}
					className="font-mono text-[10px] tracking-widest uppercase bg-neutral-900 border border-neutral-700/60 text-btn rounded-sm px-2 py-1 focus:outline-none focus:border-btn/50 transition-colors cursor-pointer"
				>
					{provinceKeys.map((k) => (
						<option key={k} value={k}>
							{PROVINCE_DISPLAY_NAMES[k] || k}
						</option>
					))}
				</select>
				<div className="flex-1 h-px bg-neutral-800/60" />
				<span className="font-mono text-[8px] tracking-widest uppercase text-neutral-600 hidden sm:inline">
					{biome}
				</span>
				<span className="font-mono text-[7px] tracking-[0.25em] uppercase text-neutral-700 border border-neutral-800/60 px-1.5 py-0.5 rounded-sm">
					AO-INTEL
				</span>
			</div>

			{/* ── Body ── */}
			<div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
				{/* ── Map ── */}
				<div className="lg:flex-1 shrink-0 min-h-[320px] lg:min-h-0 relative overflow-hidden bg-neutral-950">
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
						<div className="w-full h-full flex flex-col items-center justify-center gap-2">
							<div className="w-8 h-8 border border-neutral-700/50 rotate-45" />
							<span
								style={{ fontFamily: "'Share Tech Mono', monospace" }}
								className="text-[9px] tracking-widest uppercase text-neutral-700"
							>
								No Map Data
							</span>
						</div>
					)}
				</div>

				{/* ── Right intel panel ── */}
				<div className="lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-neutral-800/60 bg-neutral-950/70 lg:overflow-y-auto divide-y divide-neutral-800/50">
					{/* Weather */}
					<div className="shrink-0">
						<WeatherPanel province={biome} provinceKey={selectedKey} />
					</div>

					{/* Threats */}
					<div className="shrink-0">
						<ThreatsPanel provinceKey={selectedKey} />
					</div>
				</div>
			</div>
		</div>
	);
}
