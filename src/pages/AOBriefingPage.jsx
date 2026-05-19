import { useState, useEffect, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faChevronDown,
	faSkullCrossbones,
	faTriangleExclamation,
	faXmark,
	faRotate,
} from "@fortawesome/free-solid-svg-icons";
import { AOIntelMap, FatigueSimulator } from "@/components";
import { PROVINCES, PROVINCE_TERRAIN, PROVINCE_BIOMES, GARAGE } from "@/config";
import PropTypes from "prop-types";
import { getWeatherIcon } from "./dashboardHelpers";
import {
	getThreats,
	resolveRestrictions,
	getWeatherConditionData,
} from "@/utils/Restrictions";
import { selectTemperature, selectAtmosphere } from "@/utils/Weather";
import { PROVINCES_KEY_LOCATIONS } from "@/config/ProvinceKeyLocations";
import {
	LOC_TYPE_CONFIG,
	getLocationType,
	ENEMY_TIER_WEIGHT,
} from "@/utils/locationTypes";
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

const DENY_LABEL = {
	airSupport: "Air Support",
	aviation: "Aviation",
	crossCom: "Cross-Com",
	drone: "Drones",
	armarosDrone: "Armaros",
	vehicle: "Vehicles",
};

// ─── Atmosphere config ────────────────────────────────────────────────────────

const ATM = {
	cloudless: { code: "CLR", color: "#38bdf8", label: "Cloudless", icon: "○" },
	sunshine: { code: "SUN", color: "#fbbf24", label: "Sunshine", icon: "◐" },
	overcast: { code: "OVC", color: "#94a3b8", label: "Overcast", icon: "●" },
	precipitation: {
		code: "PCPN",
		color: "#60a5fa",
		label: "Precipitation",
		icon: "▽",
	},
	storm: { code: "STRM", color: "#f87171", label: "Storm", icon: "▼" },
};

// ─── Biome OAKOC data ─────────────────────────────────────────────────────────

const BIOME_OAKOC = {
	"Volcanic Rain Forest": {
		mobility: "RESTRICTED",
		visibility: "LOW",
		cover: "HIGH",
		avenues: "Foot / Maritime",
		hazards: [
			"Volcanic Activity",
			"Dense Vegetation",
			"High Humidity",
			"Unstable Ground",
		],
		notes:
			"Dense canopy degrades optics and comms. Volcanic terrain severely limits vehicle mobility. High humidity degrades electronics and raises personnel fatigue.",
	},
	"Rain Forest": {
		mobility: "CONDITIONAL",
		visibility: "LOW",
		cover: "HIGH",
		avenues: "Foot / Coastal Maritime",
		hazards: ["Dense Vegetation", "High Humidity", "Limited Vehicle Mobility"],
		notes:
			"Dense canopy limits aerial observation and thermal effectiveness. Wet ground degrades wheeled mobility. Excellent cover for dismounted ops.",
	},
	"High Cliffs": {
		mobility: "CONDITIONAL",
		visibility: "HIGH",
		cover: "LOW",
		avenues: "Foot (cliff paths) / Maritime (coves)",
		hazards: [
			"Steep Terrain",
			"Narrow Avenues of Approach",
			"Exposure to Fire",
		],
		notes:
			"Cliff terrain creates chokepoints and dominant observation posts. Vehicle access is road-dependent. Maritime insertion via coves viable.",
	},
	"Salt Marsh": {
		mobility: "DENIED (wheeled)",
		visibility: "MODERATE",
		cover: "MODERATE",
		avenues: "Foot / Boat (waterways)",
		hazards: [
			"Soft Ground",
			"Vehicle Mobility Denied",
			"Water Obstacles",
			"Disease Vectors",
		],
		notes:
			"Marsh terrain denies wheeled vehicles. Dismounted movement is slow and fatiguing. Boat infil preferred. Soil instability is an additional hazard.",
	},
	"High Thundra": {
		mobility: "CONDITIONAL",
		visibility: "HIGH",
		cover: "LOW",
		avenues: "Ground Vehicle / Foot (open terrain)",
		hazards: [
			"Cold Weather Injuries",
			"Limited Concealment",
			"Sustained Cold Ops",
		],
		notes:
			"Open tundra provides excellent fields of fire but minimal concealment. Cold weather degrades equipment and accelerates personnel fatigue.",
	},
	Fjordlands: {
		mobility: "RESTRICTED",
		visibility: "MODERATE",
		cover: "MODERATE",
		avenues: "Maritime (fjords) / Foot",
		hazards: ["Channelized Terrain", "Water Obstacles", "Maritime Dependency"],
		notes:
			"Fjord terrain channels movement into predictable avenues — high ambush risk. Maritime approach via fjords viable. Limited wheeled mobility off roads.",
	},
	"Meadow Lands": {
		mobility: "GO",
		visibility: "HIGH",
		cover: "LOW",
		avenues: "Ground Vehicle / Foot",
		hazards: [
			"Limited Concealment",
			"Long Engagement Ranges",
			"Observation Exposure",
		],
		notes:
			"Open terrain provides excellent vehicle trafficability and observation. Minimal cover for dismounted forces. Long engagement ranges favor precision fires.",
	},
	"Meadow Lands and Urban City": {
		mobility: "GO (urban limited)",
		visibility: "MODERATE",
		cover: "HIGH",
		avenues: "Ground Vehicle / Foot",
		hazards: ["Urban Combat Complexity", "Civilian Presence", "Degraded EW"],
		notes:
			"Urban environment provides cover but complicates C2. Dense structure degrades EW. Vehicle movement road-constrained. Civilian presence limits fires.",
	},
	"Rain Shadows": {
		mobility: "GO",
		visibility: "HIGH",
		cover: "LOW",
		avenues: "Ground Vehicle / Foot",
		hazards: ["Dust Signatures", "Limited Concealment", "Heat"],
		notes:
			"Dry terrain provides good vehicle mobility. Movement creates visible dust signatures. High temperatures increase personnel fatigue.",
	},
	"Volcanic Dessert": {
		mobility: "CONDITIONAL",
		visibility: "HIGH",
		cover: "LOW",
		avenues: "Foot (navigating lava flows)",
		hazards: [
			"Extreme Heat",
			"Lava Flow Hazard",
			"Volcanic Terrain",
			"Equipment Damage",
		],
		notes:
			"Hardened lava flows create natural obstacles limiting vehicle routes. Extreme heat significantly increases fatigue. Sparse vegetation offers minimal concealment.",
	},
	"High Thundra and Rain Shadows": {
		mobility: "CONDITIONAL",
		visibility: "HIGH",
		cover: "LOW",
		avenues: "Ground Vehicle / Foot",
		hazards: ["Cold Weather", "High Wind", "Limited Concealment"],
		notes:
			"Mixed tundra and rain shadow. Cold weather impacts personnel. Open areas provide vehicle mobility but minimal cover.",
	},
	"Mead Lands": {
		mobility: "GO",
		visibility: "HIGH",
		cover: "LOW",
		avenues: "Ground Vehicle / Foot",
		hazards: ["Limited Concealment", "Observation Exposure"],
		notes:
			"Open meadowlands with good trafficability. Minimal cover for dismounted forces. Clear sight lines.",
	},
};

// ─── Grid reference helper ────────────────────────────────────────────────────

const GRID_COLS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const toGridRef = (coords, bounds) => {
	if (!coords || !bounds) return "??";
	const [[minY, minX], [maxY, maxX]] = bounds;
	const col = Math.min(Math.floor(((coords[1] - minX) / (maxX - minX)) * 8), 7);
	const row = Math.min(Math.floor(((maxY - coords[0]) / (maxY - minY)) * 6), 5);
	return `${GRID_COLS[col] ?? "?"}${row + 1}`;
};

// ─── HUD overlays (rendered as React absolute overlays on the map) ────────────

function WeatherHUD({
	atmosphere,
	tempData,
	condData,
	onAtmosphereChange,
	onReroll,
}) {
	const atm = ATM[atmosphere] ?? ATM.cloudless;
	const allowed = condData?.mobility ?? [];

	const mob = {
		foot: allowed.includes("foot") ? "GO" : "DENY",
		vehicle: allowed.includes("ground vehicle") ? "GO" : "DENY",
		air: allowed.includes("aircraft") ? "GO" : "DENY",
		boat: allowed.includes("boat") ? "GO" : "DENY",
	};
	const suppressed = condData?.sound?.includes("suppressors");
	const nvgReq = condData?.visibility?.includes("night vision");

	return (
		<div
			className='overflow-hidden'
			style={{
				fontFamily: "'Courier New','Lucida Console',monospace",
				background: "rgba(4,6,3,0.90)",
				border: "1px solid rgba(100,100,100,0.3)",
				backdropFilter: "blur(4px)",
				minWidth: 175,
			}}>
			{/* Atmosphere label + temp */}
			<div className='flex items-center justify-between px-2 py-1.5 border-b border-lines/60'>
				<div className='flex items-center gap-1.5'>
					<span style={{ color: atm.color, fontSize: 14 }}>{atm.icon}</span>
					<div>
						<div
							style={{
								fontSize: 11,
								letterSpacing: "0.15em",
								color: "rgba(220,220,210,0.75)",
								textTransform: "uppercase",
							}}>
							{atm.label}
						</div>
						{tempData && (
							<div
								style={{
									fontSize: 10,
									color: atm.color,
									opacity: 0.7,
									letterSpacing: "0.1em",
								}}>
								{tempData.value}°{tempData.unit}
							</div>
						)}
					</div>
				</div>
				<button
					onClick={onReroll}
					title='Reroll temperature'
					style={{
						color: "rgba(100,120,80,0.6)",
						padding: "2px 4px",
						cursor: "pointer",
						background: "none",
						border: "none",
					}}>
					<FontAwesomeIcon
						icon={faRotate}
						style={{ fontSize: 11 }}
					/>
				</button>
			</div>

			{/* Atmosphere selector */}
			<div className='flex border-b border-lines/60'>
				{Object.entries(ATM).map(([key, cfg]) => (
					<button
						key={key}
						onClick={() => onAtmosphereChange(key)}
						style={{
							flex: 1,
							padding: "3px 0",
							fontSize: 9,
							letterSpacing: "0.08em",
							fontFamily: "'Courier New','Lucida Console',monospace",
							color: atmosphere === key ? cfg.color : "rgba(120,120,100,0.5)",
							background: atmosphere === key ? `${cfg.color}12` : "transparent",
							borderTop: "none",
							borderLeft: "none",
							borderRight: "none",
							borderBottom:
								atmosphere === key ?
									`2px solid ${cfg.color}`
								:	"2px solid transparent",
							cursor: "pointer",
						}}>
						{cfg.code}
					</button>
				))}
			</div>

			{/* Mobility grid */}
			<div
				className='grid grid-cols-4'
				style={{ background: "rgba(0,0,0,0.25)", padding: "4px 6px", gap: 2 }}>
				{[
					{ label: "FOOT", val: mob.foot },
					{ label: "VHC", val: mob.vehicle },
					{ label: "AIR", val: mob.air },
					{ label: "BOAT", val: mob.boat },
				].map(({ label, val }) => (
					<div
						key={label}
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							padding: "2px 0",
						}}>
						<span
							style={{
								fontSize: 9,
								color: "rgba(130,140,110,0.5)",
								letterSpacing: "0.1em",
							}}>
							{label}
						</span>
						<span
							style={{
								fontSize: 9,
								fontWeight: "bold",
								letterSpacing: "0.08em",
								color: val === "GO" ? "#7caa79" : "#f87171",
							}}>
							{val}
						</span>
					</div>
				))}
			</div>

			{/* Sound / vision notes */}
			{(suppressed || nvgReq) && (
				<div
					className='flex gap-2 flex-wrap px-2 py-1'
					style={{ borderTop: "1px solid rgba(60,70,50,0.4)" }}>
					{suppressed && (
						<span
							style={{
								fontSize: 9,
								color: "rgba(148,163,184,0.6)",
								letterSpacing: "0.1em",
							}}>
							SILENCED
						</span>
					)}
					{nvgReq && (
						<span
							style={{
								fontSize: 9,
								color: "rgba(148,163,184,0.6)",
								letterSpacing: "0.1em",
							}}>
							NVG REQ
						</span>
					)}
				</div>
			)}
		</div>
	);
}

WeatherHUD.propTypes = {
	atmosphere: PropTypes.string,
	tempData: PropTypes.object,
	condData: PropTypes.object,
	onAtmosphereChange: PropTypes.func,
	onReroll: PropTypes.func,
};

function RestrictionsHUD({ restrictions }) {
	const RANK = { nominal: 0, degraded: 1, denied: 2 };
	const worst = useCallback(
		(keys) => {
			let s = "nominal";
			keys.forEach((k) => {
				const r = restrictions?.[k];
				if (r && (RANK[r.status] ?? 0) > (RANK[s] ?? 0)) s = r.status;
			});
			return s;
		},
		[restrictions],
	);

	const cats = useMemo(
		() =>
			[
				{ label: "AVIATION", keys: ["aviation"] },
				{
					label: "DRONES",
					keys: ["reconDrone", "syncDrone", "combatDrone", "supplyDrone"],
				},
				{ label: "VEHICLES", keys: ["vehicle"] },
				{ label: "CROSS-COM", keys: ["crossCom", "satelliteFeed"] },
				{ label: "AIR SUP", keys: ["strikeDesignator", "armarosDrone"] },
			]
				.map((c) => ({ ...c, status: worst(c.keys) }))
				.filter((c) => c.status !== "nominal"),
		[worst],
	);

	if (!cats.length) return null;

	return (
		<div
			style={{
				fontFamily: "'Courier New','Lucida Console',monospace",
				background: "rgba(4,6,3,0.90)",
				border: "1px solid rgba(100,100,100,0.3)",
				backdropFilter: "blur(4px)",
				minWidth: 155,
			}}>
			<div
				style={{
					padding: "3px 8px 4px",
					fontSize: 9,
					letterSpacing: "0.28em",
					color: "rgba(143,184,64,0.45)",
					borderBottom: "1px solid rgba(60,70,50,0.4)",
					textTransform: "uppercase",
				}}>
				Asset Status
			</div>
			{cats.map(({ label, status }) => {
				const color = status === "denied" ? "#f87171" : "#fbbf24";
				return (
					<div
						key={label}
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: "3px 8px",
							borderBottom: "1px solid rgba(40,45,35,0.5)",
							gap: 12,
						}}>
						<span
							style={{
								fontSize: 9,
								letterSpacing: "0.12em",
								color: "rgba(180,180,160,0.5)",
							}}>
							{label}
						</span>
						<span
							style={{
								fontSize: 9,
								fontWeight: "bold",
								letterSpacing: "0.1em",
								color,
							}}>
							{status.toUpperCase()}
						</span>
					</div>
				);
			})}
		</div>
	);
}

RestrictionsHUD.propTypes = { restrictions: PropTypes.object };

function TeamsSummaryHUD({ teams }) {
	if (!teams?.length) return null;
	const COND_COLOR = {
		Fresh: "#7caa79",
		Rested: "#7caa79",
		Nominal: "#c8d4b4",
		Fatigued: "#fbbf24",
		Exhausted: "#f87171",
	};
	return (
		<div
			style={{
				fontFamily: "'Courier New','Lucida Console',monospace",
				background: "rgba(4,6,3,0.90)",
				border: "1px solid rgba(100,100,100,0.3)",
				backdropFilter: "blur(4px)",
				maxWidth: 190,
			}}>
			<div
				style={{
					padding: "3px 8px 4px",
					fontSize: 9,
					letterSpacing: "0.28em",
					color: "rgba(143,184,64,0.45)",
					borderBottom: "1px solid rgba(60,70,50,0.4)",
					textTransform: "uppercase",
				}}>
				Deployed · {teams.length}
			</div>
			{teams.map((team) => {
				const ops = (team.operators || []).filter((op) => op.status !== "KIA");
				let worstColor = "#7caa79";
				ops.forEach((op) => {
					const c = COND_COLOR[op.conditionLevel] ?? "#7caa79";
					if (c === "#f87171") worstColor = "#f87171";
					else if (c === "#fbbf24" && worstColor !== "#f87171")
						worstColor = "#fbbf24";
				});
				return (
					<div
						key={team._id}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							padding: "3px 8px",
							borderBottom: "1px solid rgba(40,45,35,0.5)",
							borderLeft: `2px solid ${worstColor}`,
						}}>
						<span
							style={{
								fontSize: 10,
								letterSpacing: "0.08em",
								color: "rgba(200,210,190,0.75)",
								flex: 1,
							}}>
							{(team.name || "UNIT").toUpperCase()}
						</span>
						<span
							style={{
								fontSize: 9,
								color: "rgba(143,184,64,0.4)",
								letterSpacing: "0.06em",
							}}>
							{ops.length}P
						</span>
					</div>
				);
			})}
		</div>
	);
}

TeamsSummaryHUD.propTypes = { teams: PropTypes.array };

// ─── Right panel — Location detail card ──────────────────────────────────────

function LocationDetailCard({ location, bounds, onClear }) {
	const config = LOC_TYPE_CONFIG[location.type] ?? LOC_TYPE_CONFIG.poi;
	const gridRef = bounds ? toGridRef(location.coordinates, bounds) : "??";

	return (
		<div
			className='border-b border-lines/60'
			style={{ fontFamily: "'Courier New','Lucida Console',monospace" }}>
			<div
				className='flex items-center justify-between px-3 py-2 border-b border-lines/60'
				style={{ background: "rgba(143,184,64,0.04)" }}>
				<span className='text-[10px] uppercase tracking-[0.35em] font-bold text-btn/60'>
					◈ Selected Location
				</span>
				<button
					onClick={onClear}
					className='text-lines hover:text-neutral-300 transition-colors'>
					<FontAwesomeIcon
						icon={faXmark}
						style={{ fontSize: 11 }}
					/>
				</button>
			</div>

			<div className='px-3 py-3'>
				{/* Type badge + name */}
				<div className='flex items-start gap-2 mb-3'>
					<span
						className='text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border shrink-0 mt-0.5'
						style={{
							color: config.color,
							borderColor: `${config.color}44`,
							background: `${config.color}12`,
						}}>
						{config.label}
					</span>
					<span className='text-[13px] font-bold uppercase tracking-wide text-lines leading-snug'>
						{location.name}
					</span>
				</div>

				{/* Grid ref */}
				<div className='flex items-center gap-2 mb-3'>
					<span className='text-[9px] uppercase tracking-[0.25em] text-lines'>
						Grid
					</span>
					<span
						className='text-[11px] font-bold tracking-widest'
						style={{ color: config.color, opacity: 0.7 }}>
						{gridRef}
					</span>
					<span className='text-[9px] text-lines'>
						[{location.coordinates[0]}, {location.coordinates[1]}]
					</span>
				</div>

				{/* Description */}
				<p className='text-[10px] leading-relaxed text-neutral-500'>
					{location.description}
				</p>
			</div>
		</div>
	);
}

LocationDetailCard.propTypes = {
	location: PropTypes.object.isRequired,
	bounds: PropTypes.array,
	onClear: PropTypes.func.isRequired,
};

// ─── Right panel — AO Analysis (IPB) ─────────────────────────────────────────

function AOAnalysisPanel({ biome, locations }) {
	const oakoc = BIOME_OAKOC[biome];

	const { score, typeCounts } = useMemo(() => {
		let sc = 0;
		const counts = {};
		(locations || []).forEach((loc) => {
			const t = getLocationType(loc.name);
			counts[t] = (counts[t] || 0) + 1;
			sc += ENEMY_TIER_WEIGHT[t] ?? 1;
		});
		return { score: sc, typeCounts: counts };
	}, [locations]);

	const strength =
		score >= 35 ? "CRITICAL"
		: score >= 20 ? "HIGH"
		: score >= 10 ? "MODERATE"
		: "LOW";

	const strengthColor = {
		CRITICAL: "#ef4444",
		HIGH: "#f97316",
		MODERATE: "#fbbf24",
		LOW: "#7caa79",
	}[strength];

	const highThreat = ["sam", "aa", "base", "camp", "outpost"]
		.filter((t) => typeCounts[t] > 0)
		.map((t) => ({
			type: t,
			count: typeCounts[t],
			label: LOC_TYPE_CONFIG[t]?.label ?? t.toUpperCase(),
		}));

	const supportThreat = ["control", "checkpoint", "radar", "bunker"]
		.filter((t) => typeCounts[t] > 0)
		.map((t) => ({
			type: t,
			count: typeCounts[t],
			label: LOC_TYPE_CONFIG[t]?.label ?? t.toUpperCase(),
		}));

	const mobilityColor = {
		GO: "#7caa79",
		CONDITIONAL: "#fbbf24",
		RESTRICTED: "#f97316",
		"DENIED (wheeled)": "#ef4444",
		"GO (urban limited)": "#fbbf24",
	};

	return (
		<div
			className='border-b border-lines/60'
			style={{ fontFamily: "'Courier New','Lucida Console',monospace" }}>
			<div
				className='flex items-center justify-between px-3 py-2 border-b border-lines/60'
				style={{ background: "rgba(143,184,64,0.04)" }}>
				<span className='text-[10px] uppercase tracking-[0.35em] font-bold text-btn/60'>
					◈ AO Analysis — IPB
				</span>
				<span className='text-[9px] uppercase tracking-widest text-neutral-700'>
					OAKOC
				</span>
			</div>

			<div className='px-3 py-2.5'>
				{/* Biome header */}
				<div className='text-[10px] uppercase tracking-[0.3em] text-lines mb-1'>
					Biome Classification
				</div>
				<div className='text-[11px] font-bold uppercase tracking-wide text-lines/60 mb-3'>
					{biome}
				</div>

				{/* OAKOC grid */}
				{oakoc && (
					<div className='grid grid-cols-2 gap-x-3 gap-y-1 mb-3'>
						{[
							{
								label: "Mobility",
								val: oakoc.mobility,
								color: mobilityColor[oakoc.mobility] ?? "#fbbf24",
							},
							{
								label: "Visibility",
								val: oakoc.visibility,
								color:
									oakoc.visibility === "HIGH" ? "#7caa79"
									: oakoc.visibility === "LOW" ? "#ef4444"
									: "#fbbf24",
							},
							{
								label: "Cover",
								val: oakoc.cover,
								color: oakoc.cover?.startsWith("HIGH") ? "#7caa79" : "#fbbf24",
							},
							{
								label: "Avenues",
								val: oakoc.avenues,
								color: "rgba(180,180,160,0.6)",
							},
						].map(({ label, val, color }) => (
							<div
								key={label}
								className='flex flex-col gap-0.5'>
								<span className='text-[10px] uppercase tracking-[0.2em] text-lines'>
									{label}
								</span>
								<span
									className='text-[10px] font-bold tracking-wide'
									style={{ color }}>
									{val}
								</span>
							</div>
						))}
					</div>
				)}

				{/* Terrain notes */}
				{oakoc?.notes && (
					<p className='text-[10px] leading-relaxed text-lines mb-3 pb-3 border-b border-lines/60'>
						{oakoc.notes}
					</p>
				)}

				{/* Hazards */}
				{oakoc?.hazards?.length > 0 && (
					<div className='mb-3 pb-3 border-b border-lines/60'>
						<div className='text-[10px] uppercase tracking-[0.25em] text-lines mb-1.5'>
							Operational Hazards
						</div>
						<div className='flex flex-wrap gap-1'>
							{oakoc.hazards.map((h) => (
								<span
									key={h}
									className='text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5'
									style={{
										color: "rgba(251,191,36,0.7)",
										border: "1px solid rgba(180,130,0,0.25)",
										background: "rgba(180,100,0,0.08)",
									}}>
									{h}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Enemy posture */}
				<div>
					<div className='flex items-center justify-between mb-2'>
						<span className='text-[10px] uppercase tracking-[0.25em] text-lines'>
							Enemy Posture
						</span>
						<span
							className='text-[12px] font-bold uppercase tracking-widest'
							style={{ color: strengthColor }}>
							{strength}
						</span>
					</div>

					<div className='text-[10px] text-lines mb-2'>
						{locations?.length ?? 0} locations · threat score {score}
					</div>

					{highThreat.length > 0 && (
						<div className='flex flex-wrap gap-1 mb-1.5'>
							{highThreat.map(({ type, count, label }) => (
								<span
									key={type}
									className='text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5'
									style={{
										color: LOC_TYPE_CONFIG[type]?.color ?? "#f97316",
										border: `1px solid ${LOC_TYPE_CONFIG[type]?.color ?? "#f97316"}33`,
										background: `${LOC_TYPE_CONFIG[type]?.color ?? "#f97316"}10`,
									}}>
									{count}× {label}
								</span>
							))}
						</div>
					)}

					{supportThreat.length > 0 && (
						<div className='flex flex-wrap gap-1'>
							{supportThreat.map(({ type, count, label }) => (
								<span
									key={type}
									className='text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 border border-lines/60 bg-neutral-800/20 text-lines'>
									{count}× {label}
								</span>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

AOAnalysisPanel.propTypes = {
	biome: PropTypes.string,
	locations: PropTypes.array,
};

// ─── Threats Panel (compact) ──────────────────────────────────────────────────

function ThreatsPanel({ provinceKey }) {
	const threats = getThreats(provinceKey);
	if (!threats.length) return null;

	return (
		<div
			className='border-b border-lines/60'
			style={{ fontFamily: "'Courier New','Lucida Console',monospace" }}>
			<div
				className='flex items-center justify-between px-3 py-2 border-b border-lines/60'
				style={{ background: "rgba(239,68,68,0.05)" }}>
				<span className='text-[10px] uppercase tracking-[0.35em] font-bold text-red-400/70'>
					◈ Active Threats
				</span>
				<span className='text-[10px] uppercase tracking-widest text-red-500/50'>
					{threats.length}
				</span>
			</div>

			<div className='px-3 py-2.5 flex flex-col gap-2'>
				{threats.map((threat, i) => (
					<div
						key={i}
						className='border border-red-900/35 bg-red-950/8'>
						<div
							className='flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-red-900/25'
							style={{ background: "rgba(239,68,68,0.06)" }}>
							<div className='flex items-center gap-1.5 min-w-0'>
								<FontAwesomeIcon
									icon={
										threat.unlockable ?
											faTriangleExclamation
										:	faSkullCrossbones
									}
									className={`text-[10px] shrink-0 ${threat.unlockable ? "text-amber-400" : "text-red-400"}`}
								/>
								<span className='text-[11px] font-bold uppercase tracking-wide text-red-200 truncate'>
									{threat.name}
								</span>
							</div>
							{threat.unlockable && (
								<span className='text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 border border-amber-600/35 bg-amber-950/15 text-amber-400/80 shrink-0'>
									Unlockable
								</span>
							)}
						</div>
						{threat.denies?.length > 0 && (
							<div className='px-2.5 py-1.5 flex flex-wrap gap-1'>
								{threat.denies.map((cat) => (
									<span
										key={cat}
										className='text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 border border-red-800/35 bg-red-950/15 text-red-300/80'>
										{DENY_LABEL[cat] ?? cat}
									</span>
								))}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

ThreatsPanel.propTypes = { provinceKey: PropTypes.string };

// ─── Map legend (bottom-left of map) ─────────────────────────────────────────

function MapLegend() {
	const [open, setOpen] = useState(false);

	const legendTypes = [
		["sam", "aa", "base"],
		["camp", "outpost", "checkpoint"],
		["control", "port", "airfield"],
		["bunker", "depot", "gate"],
	];

	return (
		<div style={{ fontFamily: "'Courier New','Lucida Console',monospace" }}>
			{open && (
				<div
					className='mb-1'
					style={{
						background: "rgba(4,6,3,0.90)",
						border: "1px solid rgba(100,100,100,0.3)",
						backdropFilter: "blur(4px)",
						padding: "6px 8px",
					}}>
					{legendTypes.map((row, ri) => (
						<div
							key={ri}
							className='flex gap-3 mb-1'>
							{row.map((type) => {
								const c = LOC_TYPE_CONFIG[type];
								return (
									<div
										key={type}
										className='flex items-center gap-1'>
										<span style={{ color: c.color, fontSize: 11 }}>
											{c.symbol}
										</span>
										<span
											style={{
												fontSize: 9,
												color: "rgba(160,160,140,0.6)",
												letterSpacing: "0.1em",
												textTransform: "uppercase",
											}}>
											{c.label}
										</span>
									</div>
								);
							})}
						</div>
					))}
				</div>
			)}
			<button
				onClick={() => setOpen((v) => !v)}
				style={{
					fontSize: 9,
					letterSpacing: "0.2em",
					textTransform: "uppercase",
					color: "rgba(143,184,64,0.5)",
					background: "rgba(4,6,3,0.88)",
					border: "1px solid rgba(74,90,40,0.3)",
					padding: "2px 8px",
					cursor: "pointer",
					fontFamily: "'Courier New','Lucida Console',monospace",
				}}>
				{open ? "▾ LEGEND" : "▸ LEGEND"}
			</button>
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AOBriefingPage() {
	const provinceKeys = Object.keys(PROVINCE_BIOMES);
	const [selectedKey, setSelectedKey] = useState(provinceKeys[0] || "");
	const [selectedLocation, setSelectedLocation] = useState(null);
	const [atmosphere, setAtmosphere] = useState(null);
	const [tempData, setTempData] = useState(null);

	const { teams, fetchTeams } = useTeamsStore();
	useEffect(() => {
		fetchTeams();
	}, [fetchTeams]);

	// Roll weather on province change
	useEffect(() => {
		const province = PROVINCES[selectedKey];
		const biomeKey = province?.biome ?? PROVINCE_BIOMES[selectedKey] ?? "";
		const atm = selectAtmosphere(biomeKey);
		const temp = selectTemperature(biomeKey, "F");
		setAtmosphere(atm ?? "overcast");
		setTempData(temp);
		setSelectedLocation(null);
	}, [selectedKey]);

	const rollTemp = useCallback(() => {
		const province = PROVINCES[selectedKey];
		const biomeKey = province?.biome ?? PROVINCE_BIOMES[selectedKey] ?? "";
		setAtmosphere(selectAtmosphere(biomeKey) ?? "overcast");
		setTempData(selectTemperature(biomeKey, "F"));
	}, [selectedKey]);

	const enrichAssets = (assets) =>
		(assets || []).map((a) => {
			if (typeof a !== "object") return a;
			const g = GARAGE.find((v) => v.name === a.vehicle);
			return { ...a, imgUrl: g?.imgUrl || "/img/default-vehicle.png" };
		});

	const aoTeams = useMemo(() => {
		if (!teams?.length || !selectedKey) return [];
		return teams
			.filter((t) => t.AO === selectedKey)
			.map((team) => ({
				...team,
				assets: enrichAssets(team.assets),
				attachedTeams: (team.attachedTeams || [])
					.map((at) => {
						const atId = typeof at === "object" ? at._id : at;
						const resolved =
							teams.find((t) => t._id === atId) ??
							(typeof at === "object" && at.name ? at : null);
						if (!resolved) return null;
						return { ...resolved, assets: enrichAssets(resolved.assets) };
					})
					.filter(Boolean),
			}));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [teams, selectedKey]);

	const activeAOs = useMemo(() => {
		const s = new Set(teams.filter((t) => t.AO).map((t) => t.AO));
		return [...s];
	}, [teams]);

	const province = PROVINCES[selectedKey];
	const terrain = PROVINCE_TERRAIN[selectedKey];
	const biome = province?.biome ?? PROVINCE_BIOMES[selectedKey] ?? "Unknown";
	const weatherMeta = getWeatherIcon(biome);
	const displayName = PROVINCE_DISPLAY_NAMES[selectedKey] || selectedKey;
	const mapBounds = province?.coordinates?.bounds ?? null;
	const imgURL = province?.imgURL ?? "";
	const hasMap = !!(mapBounds && imgURL);
	const restrictions = useMemo(
		() => resolveRestrictions(selectedKey, null),
		[selectedKey],
	);
	const condData = useMemo(
		() => getWeatherConditionData(selectedKey, atmosphere),
		[selectedKey, atmosphere],
	);
	const provinceLocations = useMemo(
		() => PROVINCES_KEY_LOCATIONS[selectedKey]?.locations ?? [],
		[selectedKey],
	);

	return (
		<div
			className='flex flex-col flex-1 min-h-0 overflow-hidden'
			style={{ fontFamily: "'Courier New','Lucida Console',monospace" }}>
			{/* ── Province selector bar ── */}
			<div className='shrink-0 flex items-center gap-3 px-4 py-2 border-b border-lines/60 bg-neutral-950/80'>
				<FontAwesomeIcon
					icon={weatherMeta.icon}
					className={`text-sm ${weatherMeta.color}`}
				/>

				<div className='relative flex items-center'>
					<select
						value={selectedKey}
						onChange={(e) => setSelectedKey(e.target.value)}
						className='appearance-none font-mono text-[12px] tracking-widest uppercase bg-neutral-900 border border-btn/30 text-fontz pr-7 pl-2 py-1.5 focus:outline-none focus:border-btn/60 transition-colors cursor-pointer font-bold'>
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
						className='absolute right-2 text-[10px] text-btn/50 pointer-events-none'
					/>
				</div>

				{activeAOs.length > 0 && (
					<>
						<div className='h-4 w-px bg-neutral-700/50 shrink-0' />
						<span className='font-mono text-[10px] tracking-[0.35em] text-btn/50 uppercase shrink-0'>
							●{" "}
						</span>
						<div className='flex items-center gap-1.5 overflow-x-auto min-w-0 flex-1'>
							{activeAOs.map((ao) => (
								<button
									key={ao}
									onClick={() => setSelectedKey(ao)}
									className={[
										"font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 border transition-colors shrink-0",
										selectedKey === ao ?
											"text-btn border-btn/60 bg-btn/10"
										:	"text-neutral-400 border-neutral-700/40 hover:text-btn hover:border-btn/40",
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
				{/* ══ MAP — full stage ══ */}
				<div className='h-[52vh] lg:h-auto lg:flex-1 relative overflow-hidden bg-neutral-950'>
					{hasMap ?
						<AOIntelMap
							bounds={mapBounds}
							imgURL={imgURL}
							province={selectedKey}
							terrain={terrain}
							provinceName={displayName}
							biome={biome}
							locations={provinceLocations}
							onLocationSelect={setSelectedLocation}
						/>
					:	<div className='w-full h-full flex flex-col items-center justify-center gap-3'>
							<div className='w-10 h-10 border border-lines/60 rotate-45' />
							<span className='text-[11px] tracking-[0.3em] uppercase text-lines font-bold'>
								No Map Data
							</span>
							<span className='text-[10px] tracking-widest uppercase text-lines'>
								{displayName}
							</span>
						</div>
					}

					{/* ── React HUD overlays ── */}
					<div
						style={{
							position: "absolute",
							inset: 0,
							pointerEvents: "none",
							zIndex: 800,
						}}>
						{/* Weather HUD — top right */}
						<div
							style={{
								position: "absolute",
								top: 8,
								right: 8,
								pointerEvents: "auto",
							}}>
							<WeatherHUD
								atmosphere={atmosphere}
								tempData={tempData}
								condData={condData}
								onAtmosphereChange={setAtmosphere}
								onReroll={rollTemp}
							/>
						</div>

						{/* Restrictions HUD — bottom right */}
						<div
							style={{
								position: "absolute",
								bottom: 8,
								right: 8,
								pointerEvents: "none",
							}}>
							<RestrictionsHUD restrictions={restrictions} />
						</div>

						{/* Teams summary — bottom left */}
						{aoTeams.length > 0 && (
							<div
								style={{
									position: "absolute",
									bottom: 8,
									left: 8,
									pointerEvents: "none",
								}}>
								<TeamsSummaryHUD teams={aoTeams} />
							</div>
						)}

						{/* Legend toggle — bottom left, above teams */}
						<div
							style={{
								position: "absolute",
								bottom: aoTeams.length > 0 ? aoTeams.length * 24 + 42 : 8,
								left: 8,
								pointerEvents: "auto",
							}}>
							<MapLegend />
						</div>
					</div>
				</div>

				{/* ══ RIGHT PANEL — intel + teams ══ */}
				<div className='flex-1 lg:flex-none lg:w-[350px] shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-lines/60 bg-neutral-950/80 overflow-y-auto'>
					{/* Selected location detail */}
					{selectedLocation && (
						<LocationDetailCard
							location={selectedLocation}
							bounds={mapBounds}
							onClear={() => setSelectedLocation(null)}
						/>
					)}

					{/* AO Analysis */}
					<AOAnalysisPanel
						biome={biome}
						locations={provinceLocations}
					/>

					{/* Active threats */}
					<ThreatsPanel provinceKey={selectedKey} />

					{/* Deployed units */}
					<div
						className='border-b border-lines/60'
						style={{ background: "rgba(143,184,64,0.03)" }}>
						<div
							className='flex items-center justify-between px-3 py-2 border-b border-lines/40'
							style={{ background: "rgba(143,184,64,0.04)" }}>
							<span className='text-[10px] uppercase tracking-[0.35em] font-bold text-btn/60'>
								◈ Deployed Units
							</span>
							<span className='text-[10px] uppercase tracking-widest text-lines'>
								{aoTeams.length} team{aoTeams.length !== 1 ? "s" : ""} ·{" "}
								{displayName}
							</span>
						</div>

						{aoTeams.length > 0 ?
							<FatigueSimulator
								teams={aoTeams}
								biome={biome}
								provinceKey={selectedKey}
								atmosphere={atmosphere}
							/>
						:	<div className='flex flex-col items-center gap-2 py-8 px-6 text-center'>
								<div className='w-7 h-7 border border-lines/40 rotate-45' />
								<span className='text-[10px] tracking-[0.3em] uppercase text-lines'>
									No units deployed to {displayName}
								</span>
							</div>
						}
					</div>
				</div>
			</div>
		</div>
	);
}
