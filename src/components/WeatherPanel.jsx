import { useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { getProvinceWeather } from "../utils/Weather";
import { PROVINCE_BIOMES } from "@/config";
import { getWeatherConditionData, getTerrainData } from "@/utils/Restrictions";

// ─── Keyframe animations ──────────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes hud-rain {
  0%   { transform: translateY(-10px); opacity: 0; }
  8%   { opacity: var(--drop-op, 0.35); }
  92%  { opacity: var(--drop-op, 0.2); }
  100% { transform: translateY(320px); opacity: 0; }
}
@keyframes hud-shimmer {
  0%, 100% { opacity: 0.0; }
  50%       { opacity: 1.0; }
}
@keyframes hud-flash {
  0%, 93%, 100% { opacity: 0; }
  95%            { opacity: 0.08; }
  97%            { opacity: 0; }
}
`;

// ─── Atmosphere config ────────────────────────────────────────────────────────

const ATM = {
	cloudless: {
		label: "Cloudless",
		bgTint: "rgba(14,165,233,0.02)",
		borderHex: "#7dd3fc",
		accent: "text-sky-300",
		badge: "bg-sky-500/10 border border-sky-500/30 text-sky-300",
		animation: null,
	},
	sunshine: {
		label: "Sunshine",
		bgTint: "rgba(251,191,36,0.03)",
		borderHex: "#fbbf24",
		accent: "text-yellow-400",
		badge: "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400",
		animation: "shimmer",
	},
	overcast: {
		label: "Overcast",
		bgTint: "rgba(100,116,139,0.035)",
		borderHex: "#94a3b8",
		accent: "text-slate-400",
		badge: "bg-slate-500/10 border border-slate-500/30 text-slate-300",
		animation: null,
	},
	precipitation: {
		label: "Precipitation",
		bgTint: "rgba(59,130,246,0.04)",
		borderHex: "#60a5fa",
		accent: "text-blue-400",
		badge: "bg-blue-500/10 border border-blue-500/30 text-blue-400",
		animation: "rain",
	},
	storm: {
		label: "Storm",
		bgTint: "rgba(239,68,68,0.045)",
		borderHex: "#f87171",
		accent: "text-red-400",
		badge: "bg-red-500/10 border border-red-500/30 text-red-400",
		animation: "storm",
	},
};

const ATM_DEFAULT = {
	label: "Unknown",
	bgTint: "transparent",
	borderHex: "#52525b",
	accent: "text-zinc-400",
	badge: "bg-zinc-800 border border-zinc-700 text-zinc-400",
	animation: null,
};

// ─── Atmosphere hero icon ─────────────────────────────────────────────────────

const HeroIcon = ({ condition }) => {
	const props = {
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.25",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: "w-10 h-10",
	};
	switch (condition) {
		case "cloudless":
			return (
				<svg {...props}>
					<circle cx="12" cy="12" r="5" strokeWidth="1.5" />
					{[
						[12, 1, 12, 3],
						[12, 21, 12, 23],
						[4.22, 4.22, 5.64, 5.64],
						[18.36, 18.36, 19.78, 19.78],
						[1, 12, 3, 12],
						[21, 12, 23, 12],
						[4.22, 19.78, 5.64, 18.36],
						[18.36, 5.64, 19.78, 4.22],
					].map(([x1, y1, x2, y2], i) => (
						<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.5" />
					))}
				</svg>
			);
		case "sunshine":
			return (
				<svg {...props}>
					<circle cx="12" cy="12" r="4" strokeWidth="1.5" />
					{[
						[12, 2, 12, 6],
						[12, 18, 12, 22],
						[4.93, 4.93, 7.76, 7.76],
						[16.24, 16.24, 19.07, 19.07],
						[2, 12, 6, 12],
						[18, 12, 22, 12],
						[4.93, 19.07, 7.76, 16.24],
						[16.24, 7.76, 19.07, 4.93],
					].map(([x1, y1, x2, y2], i) => (
						<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.5" />
					))}
				</svg>
			);
		case "overcast":
			return (
				<svg {...props}>
					<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" strokeWidth="1.5" />
				</svg>
			);
		case "precipitation":
			return (
				<svg {...props}>
					<path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" strokeWidth="1.5" />
					<line x1="16" y1="13" x2="16" y2="21" strokeWidth="1.5" />
					<line x1="8" y1="13" x2="8" y2="21" strokeWidth="1.5" />
					<line x1="12" y1="15" x2="12" y2="23" strokeWidth="1.5" />
				</svg>
			);
		case "storm":
			return (
				<svg {...props}>
					<path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" strokeWidth="1.5" />
					<polyline points="13 11 9 17 15 17 11 23" strokeWidth="1.75" />
				</svg>
			);
		default:
			return null;
	}
};
HeroIcon.propTypes = { condition: PropTypes.string };

// ─── Ambient animation layer ──────────────────────────────────────────────────

const RAIN_DROPS = [
	{ l: 5, d: 0.0, dur: 1.9 }, { l: 12, d: 0.4, dur: 2.2 }, { l: 20, d: 0.1, dur: 1.7 },
	{ l: 28, d: 0.7, dur: 2.0 }, { l: 35, d: 0.3, dur: 1.8 }, { l: 43, d: 0.9, dur: 2.3 },
	{ l: 50, d: 0.5, dur: 1.6 }, { l: 58, d: 0.2, dur: 2.1 }, { l: 65, d: 0.8, dur: 1.9 },
	{ l: 73, d: 0.1, dur: 2.0 }, { l: 80, d: 0.6, dur: 1.7 }, { l: 88, d: 0.4, dur: 2.2 },
	{ l: 95, d: 0.9, dur: 1.8 },
];

const STORM_DROPS = [
	...RAIN_DROPS.map((d) => ({ ...d, dur: d.dur * 0.48 })),
	{ l: 8, d: 0.2, dur: 0.9 }, { l: 17, d: 0.6, dur: 1.0 }, { l: 25, d: 0.1, dur: 0.8 },
	{ l: 32, d: 0.5, dur: 1.1 }, { l: 40, d: 0.3, dur: 0.9 }, { l: 48, d: 0.7, dur: 1.0 },
	{ l: 56, d: 0.4, dur: 0.8 }, { l: 63, d: 0.2, dur: 1.1 }, { l: 71, d: 0.8, dur: 0.9 },
	{ l: 78, d: 0.5, dur: 1.0 }, { l: 86, d: 0.1, dur: 0.8 }, { l: 93, d: 0.6, dur: 1.1 },
];

const AmbientLayer = ({ animation }) => {
	if (!animation) return null;
	if (animation === "shimmer")
		return (
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background:
						"linear-gradient(120deg, transparent 20%, rgba(251,191,36,0.05) 50%, transparent 80%)",
					animation: "hud-shimmer 5s ease-in-out infinite",
				}}
			/>
		);
	const drops      = animation === "storm" ? STORM_DROPS : RAIN_DROPS;
	const dropColor  = animation === "storm" ? "rgba(248,113,113,0.25)" : "rgba(96,165,250,0.3)";
	const dropHeight = animation === "storm" ? "9px" : "5px";
	const dropWidth  = animation === "storm" ? "1.5px" : "1px";
	return (
		<div className="absolute inset-0 pointer-events-none overflow-hidden">
			{drops.map((drop, i) => (
				<div
					key={i}
					style={{
						position: "absolute",
						left: `${drop.l}%`,
						top: 0,
						width: dropWidth,
						height: dropHeight,
						background: dropColor,
						borderRadius: "1px",
						animation: `hud-rain ${drop.dur}s linear ${drop.d}s infinite`,
					}}
				/>
			))}
			{animation === "storm" && (
				<div
					className="absolute inset-0"
					style={{
						background: "rgba(239,68,68,0.04)",
						animation: "hud-flash 6s linear infinite",
					}}
				/>
			)}
		</div>
	);
};
AmbientLayer.propTypes = { animation: PropTypes.string };

// ─── Temperature color ────────────────────────────────────────────────────────

function getTempColor(value, unit) {
	const c = unit === "F" ? ((value - 32) * 5) / 9 : value;
	if (c <= -10) return "#bfdbfe";
	if (c <= 0)   return "#93c5fd";
	if (c <= 10)  return "#34d399";
	if (c <= 20)  return "#4ade80";
	if (c <= 30)  return "#facc15";
	if (c <= 40)  return "#fb923c";
	return "#f87171";
}

// ─── Mobility mode config ─────────────────────────────────────────────────────

const ALL_MOBILITY_MODES = ["foot", "aircraft", "ground vehicle", "boat"];

const MOB_LABEL = {
	foot:           "FOOT",
	aircraft:       "AIR",
	"ground vehicle":"GND",
	boat:           "BOAT",
};

const MOB_ICON = ({ mode }) => {
	const p = {
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.5",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: "w-4 h-4",
	};
	switch (mode) {
		case "foot":
			return (
				<svg {...p}>
					<circle cx="12" cy="5" r="1.5" />
					<path d="M9 20l1-5 2 2 1-7" />
					<path d="M7 17l2-2 4 1 2-3" />
				</svg>
			);
		case "aircraft":
			return (
				<svg {...p}>
					<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
				</svg>
			);
		case "ground vehicle":
			return (
				<svg {...p}>
					<rect x="1" y="9" width="22" height="9" rx="2" />
					<path d="M5 18v2M19 18v2" />
					<path d="M3 9l2-5h14l2 5" />
					<circle cx="7" cy="18" r="2" />
					<circle cx="17" cy="18" r="2" />
				</svg>
			);
		case "boat":
			return (
				<svg {...p}>
					<path d="M3 17l2-9h14l2 9" />
					<path d="M3 17a9 9 0 0 0 18 0" />
					<line x1="12" y1="3" x2="12" y2="8" />
				</svg>
			);
		default:
			return null;
	}
};
MOB_ICON.propTypes = { mode: PropTypes.string };

// ─── Vision gear config ───────────────────────────────────────────────────────

const VIS_CONFIG = {
	"night vision": {
		label: "NVG",
		fullLabel: "Night Vision",
		color: "text-emerald-400",
		border: "border-emerald-700/50",
		bg: "bg-emerald-950/30",
	},
	"thermal vision": {
		label: "THERMAL",
		fullLabel: "Thermal Vision",
		color: "text-orange-400",
		border: "border-orange-700/50",
		bg: "bg-orange-950/30",
	},
	"eye protection": {
		label: "EYEPRO",
		fullLabel: "Eye Protection",
		color: "text-amber-300",
		border: "border-amber-700/50",
		bg: "bg-amber-950/30",
	},
};

// ─── Terrain degraded category labels ────────────────────────────────────────

const TERRAIN_LABEL = {
	drone:      "DRONE",
	crossCom:   "CROSS-COM",
	airSupport: "AIR SUPPORT",
	vehicle:    "VEHICLES",
	aviation:   "AVIATION",
	armarosDrone: "ARMAROS",
};

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionHeader({ label, color = "#52525b" }) {
	return (
		<div className="flex items-center gap-2 mb-2">
			<div className="h-px flex-1 opacity-25" style={{ backgroundColor: color }} />
			<span
				className="text-[8px] uppercase tracking-widest shrink-0 font-semibold"
				style={{ color }}
			>
				{label}
			</span>
			<div className="h-px flex-1 opacity-25" style={{ backgroundColor: color }} />
		</div>
	);
}
SectionHeader.propTypes = { label: PropTypes.string, color: PropTypes.string };

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeatherPanel({ province, provinceKey: provinceKeyProp, userUnit = "C" }) {
	const [unit, setUnit] = useState(userUnit);
	const [rollKey, setRollKey] = useState(0);

	const biomeKey = useMemo(() => {
		if (!province) return null;
		if (typeof province === "string") return PROVINCE_BIOMES[province] ?? province;
		return province.biome ?? PROVINCE_BIOMES[province] ?? null;
	}, [province]);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const weatherC = useMemo(() => (biomeKey ? getProvinceWeather(biomeKey, "C") : null), [biomeKey, rollKey]);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const weatherF = useMemo(() => (biomeKey ? getProvinceWeather(biomeKey, "F") : null), [biomeKey, rollKey]);
	const weather  = weatherC;

	const handleReroll = useCallback(() => setRollKey((k) => k + 1), []);

	const provinceKey = provinceKeyProp ?? (typeof province === "string" ? province : null);

	const condData  = useMemo(() => getWeatherConditionData(provinceKey, weather?.atmosphere), [provinceKey, weather?.atmosphere]);
	const terrain   = useMemo(() => getTerrainData(provinceKey), [provinceKey]);

	if (!weather) return null;

	const atm         = ATM[weather.atmosphere] ?? ATM_DEFAULT;
	const displayTemp = unit === "F" ? weatherF?.temperature : weatherC?.temperature;
	const tempColor   = displayTemp ? getTempColor(displayTemp.value, displayTemp.unit) : "#71717a";

	// Mobility classification
	const available   = new Set(condData?.mobility ?? []);
	const conditional = new Set(condData?.mobilityConditional ?? []);

	// Vision requirements
	const visionGear = condData?.visibility ?? [];

	// Sound discipline
	const soundRule = condData?.sound?.[0] ?? null;

	// Terrain degraded categories
	const terrainDegraded = terrain?.degraded ?? [];

	return (
		<div
			className="relative w-full overflow-hidden"
			style={{
				background: `linear-gradient(180deg, ${atm.bgTint} 0%, #0a0c0e 40%)`,
				border: `1px solid ${atm.borderHex}44`,
				fontFamily: "'Courier New', 'Lucida Console', monospace",
			}}
		>
			<style>{KEYFRAMES}</style>
			<AmbientLayer animation={atm.animation} />

			{/* ── Header ── */}
			<div className="relative z-10 flex items-center justify-between px-3 py-2 border-b border-zinc-800/60">
				<div className="flex items-center gap-2">
					<span className="text-[9px] uppercase tracking-widest text-zinc-600">
						Pre-Op Conditions
					</span>
					<button
						onClick={handleReroll}
						title="Re-roll weather conditions"
						className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 border border-zinc-800 text-zinc-700 hover:text-zinc-400 hover:border-zinc-600 transition-all leading-none"
					>
						↺ Re-roll
					</button>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center border border-zinc-800 overflow-hidden">
						{["C", "F"].map((u) => (
							<button
								key={u}
								onClick={() => setUnit(u)}
								className={[
									"px-2 py-0.5 text-[9px] uppercase tracking-widest transition-all",
									unit === u
										? "bg-zinc-700 text-zinc-200"
										: "text-zinc-600 hover:text-zinc-400",
								].join(" ")}
							>
								°{u}
							</button>
						))}
					</div>
					<span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 ${atm.badge}`}>
						{weather.biome}
					</span>
				</div>
			</div>

			{/* ── Condition + Temp ── */}
			<div className="relative z-10 flex items-center gap-4 px-4 py-4 border-b border-zinc-800/60">
				<div className={`shrink-0 ${atm.accent}`}>
					<HeroIcon condition={weather.atmosphere} />
				</div>
				<div className="flex flex-col gap-1.5 min-w-0 flex-1">
					<span className={`text-sm font-bold uppercase tracking-[0.2em] leading-none ${atm.accent}`}>
						{atm.label}
					</span>
					<div className="flex items-center gap-3">
						<span
							className="text-2xl font-bold leading-none tabular-nums"
							style={{ color: tempColor }}
						>
							{displayTemp?.value}°
							<span className="text-sm font-normal text-zinc-600 ml-0.5">
								{displayTemp?.unit}
							</span>
						</span>
						<div className="w-px h-5 bg-zinc-800" />
						<span className="text-[10px] text-zinc-500 capitalize leading-none">
							{weather.humidity} humidity
						</span>
					</div>
				</div>
			</div>

			{/* ── Mobility ── */}
			{condData && (
				<div className="relative z-10 px-3 py-3 border-b border-zinc-800/60">
					<SectionHeader label="Mobility" color={atm.borderHex} />
					<div className="grid grid-cols-4 gap-1.5">
						{ALL_MOBILITY_MODES.map((mode) => {
							const isAvail = available.has(mode);
							const isCond  = conditional.has(mode);

							let bgCls, borderCls, textCls, indicator, indicatorColor;
							if (isAvail) {
								bgCls = "bg-green-950/30"; borderCls = "border-green-700/40";
								textCls = "text-green-400"; indicator = "●"; indicatorColor = "#4ade80";
							} else if (isCond) {
								bgCls = "bg-amber-950/30"; borderCls = "border-amber-700/40";
								textCls = "text-amber-400"; indicator = "◐"; indicatorColor = "#fbbf24";
							} else {
								bgCls = "bg-zinc-900/40"; borderCls = "border-zinc-800/50";
								textCls = "text-zinc-700"; indicator = "✕"; indicatorColor = "#52525b";
							}

							return (
								<div
									key={mode}
									className={`flex flex-col items-center gap-1 px-1.5 py-2 border rounded-sm ${bgCls} ${borderCls}`}
								>
									<span style={{ color: indicatorColor }} className="text-[8px] leading-none">
										{indicator}
									</span>
									<span className={`${textCls}`}>
										<MOB_ICON mode={mode} />
									</span>
									<span className={`text-[8px] uppercase tracking-widest font-semibold leading-none ${textCls}`}>
										{MOB_LABEL[mode]}
									</span>
								</div>
							);
						})}
					</div>
					{conditional.size > 0 && (
						<p className="text-[8px] text-amber-700/70 mt-1.5 leading-relaxed">
							◐ Conditional — requires active threat neutralization
						</p>
					)}
				</div>
			)}

			{/* ── Vision Requirements ── */}
			{visionGear.length > 0 && (
				<div className="relative z-10 px-3 py-3 border-b border-zinc-800/60">
					<SectionHeader label="Vision Requirements" color={atm.borderHex} />
					<div className="flex flex-wrap gap-1.5">
						{visionGear.map((gear) => {
							const cfg = VIS_CONFIG[gear];
							if (!cfg) return null;
							return (
								<div
									key={gear}
									className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-sm ${cfg.bg} ${cfg.border}`}
								>
									<span className={`text-[8px] leading-none ${cfg.color}`}>▶</span>
									<span className={`text-[9px] uppercase tracking-widest font-semibold ${cfg.color}`}>
										{cfg.label}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* ── Sound Discipline ── */}
			{soundRule && (
				<div className="relative z-10 px-3 py-3 border-b border-zinc-800/60">
					<SectionHeader label="Sound Discipline" color={atm.borderHex} />
					{soundRule === "suppressors" ? (
						<div className="flex items-center gap-2 px-2.5 py-2 border border-teal-800/40 bg-teal-950/25 rounded-sm">
							<span className="text-teal-400 text-[9px] leading-none">◼</span>
							<span className="text-[9px] uppercase tracking-widest text-teal-300 font-semibold">
								Suppressors Required
							</span>
						</div>
					) : (
						<div className="flex items-center gap-2 px-2.5 py-2 border border-amber-700/40 bg-amber-950/25 rounded-sm">
							<span className="text-amber-400 text-[10px] leading-none">◉</span>
							<div className="flex flex-col gap-0.5">
								<span className="text-[9px] uppercase tracking-widest text-amber-300 font-semibold">
									Go Loud
								</span>
								<span className="text-[8px] text-amber-700/80 leading-none">
									Weather conditions mask acoustic signature
								</span>
							</div>
						</div>
					)}
				</div>
			)}

			{/* ── Terrain Effects ── */}
			{terrainDegraded.length > 0 && (
				<div className="relative z-10 px-3 py-3 border-b border-zinc-800/60">
					<SectionHeader label="Terrain Degraded" color="#a16207" />
					{terrain?.description && (
						<p className="text-[8px] text-zinc-600 mb-2 leading-relaxed">
							{terrain.description}
						</p>
					)}
					<div className="flex flex-wrap gap-1.5">
						{terrainDegraded.map((cat) => (
							<span
								key={cat}
								className="text-[8px] uppercase tracking-widest px-2 py-1 border border-amber-900/40 bg-amber-950/20 text-amber-600/80 rounded-sm"
							>
								{TERRAIN_LABEL[cat] ?? cat}
							</span>
						))}
					</div>
				</div>
			)}

			{/* ── Footer ── */}
			<div className="relative z-10 px-3 py-1.5 flex items-center justify-between">
				<span className="text-[8px] text-zinc-800 uppercase tracking-widest">
					Biome-derived estimate
				</span>
				<span className="text-[8px] text-zinc-800 uppercase tracking-widest">
					Verify in-field
				</span>
			</div>
		</div>
	);
}

WeatherPanel.propTypes = {
	province:    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
	provinceKey: PropTypes.string,
	userUnit:    PropTypes.oneOf(["C", "F"]),
};
