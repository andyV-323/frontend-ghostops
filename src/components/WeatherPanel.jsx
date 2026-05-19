import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { getProvinceWeather } from "../utils/Weather";
import { PROVINCE_BIOMES } from "@/config";
import { getWeatherConditionData, getTerrainData, RESTRICTION_LABELS } from "@/utils/Restrictions";

// ─── Keyframes ────────────────────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes hud-rain {
  0%   { transform: translateY(-10px); opacity: 0; }
  8%   { opacity: 0.35; }
  92%  { opacity: 0.2; }
  100% { transform: translateY(400px); opacity: 0; }
}
@keyframes hud-shimmer {
  0%, 100% { opacity: 0; }
  50%       { opacity: 1; }
}
@keyframes hud-flash {
  0%, 93%, 100% { opacity: 0; }
  95%  { opacity: 0.07; }
  97%  { opacity: 0; }
}
@keyframes hud-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0.3; }
}
`;

// ─── Atmosphere config ────────────────────────────────────────────────────────

const ATM = {
	cloudless: {
		label: "Cloudless",
		code: "CLR",
		hex: "#38bdf8",
		accent: "text-sky-300",
		tint: "rgba(14,165,233,0.05)",
		animation: null,
	},
	sunshine: {
		label: "Sunshine",
		code: "SUN",
		hex: "#fbbf24",
		accent: "text-yellow-300",
		tint: "rgba(251,191,36,0.05)",
		animation: "shimmer",
	},
	overcast: {
		label: "Overcast",
		code: "OVC",
		hex: "#94a3b8",
		accent: "text-slate-300",
		tint: "rgba(148,163,184,0.04)",
		animation: null,
	},
	precipitation: {
		label: "Precipitation",
		code: "PCPN",
		hex: "#60a5fa",
		accent: "text-blue-300",
		tint: "rgba(59,130,246,0.05)",
		animation: "rain",
	},
	storm: {
		label: "Storm",
		code: "STRM",
		hex: "#f87171",
		accent: "text-red-400",
		tint: "rgba(239,68,68,0.06)",
		animation: "storm",
	},
};

const ATM_DEFAULT = {
	label: "Unknown",
	code: "UNK",
	hex: "#7caa79",
	accent: "text-btn",
	tint: "transparent",
	animation: null,
};

// ─── Atmosphere SVG icon ──────────────────────────────────────────────────────

function HeroIcon({ condition, color }) {
	const p = {
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: color,
		strokeWidth: "1.4",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		width: 52,
		height: 52,
	};
	switch (condition) {
		case "cloudless":
			return (
				<svg {...p}>
					<circle
						cx='12'
						cy='12'
						r='5'
					/>
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
						<line
							key={i}
							x1={x1}
							y1={y1}
							x2={x2}
							y2={y2}
						/>
					))}
				</svg>
			);
		case "sunshine":
			return (
				<svg {...p}>
					<circle
						cx='12'
						cy='12'
						r='4'
					/>
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
						<line
							key={i}
							x1={x1}
							y1={y1}
							x2={x2}
							y2={y2}
						/>
					))}
				</svg>
			);
		case "overcast":
			return (
				<svg {...p}>
					<path d='M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z' />
				</svg>
			);
		case "precipitation":
			return (
				<svg {...p}>
					<path d='M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25' />
					<line
						x1='16'
						y1='13'
						x2='16'
						y2='21'
					/>
					<line
						x1='8'
						y1='13'
						x2='8'
						y2='21'
					/>
					<line
						x1='12'
						y1='15'
						x2='12'
						y2='23'
					/>
				</svg>
			);
		case "storm":
			return (
				<svg {...p}>
					<path d='M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9' />
					<polyline
						points='13 11 9 17 15 17 11 23'
						strokeWidth='1.75'
					/>
				</svg>
			);
		default:
			return null;
	}
}
HeroIcon.propTypes = { condition: PropTypes.string, color: PropTypes.string };

// ─── Rain / storm particles ───────────────────────────────────────────────────

const BASE_DROPS = [
	{ l: 5, d: 0.0, dur: 1.9 },
	{ l: 12, d: 0.4, dur: 2.2 },
	{ l: 20, d: 0.1, dur: 1.7 },
	{ l: 28, d: 0.7, dur: 2.0 },
	{ l: 35, d: 0.3, dur: 1.8 },
	{ l: 43, d: 0.9, dur: 2.3 },
	{ l: 50, d: 0.5, dur: 1.6 },
	{ l: 58, d: 0.2, dur: 2.1 },
	{ l: 65, d: 0.8, dur: 1.9 },
	{ l: 73, d: 0.1, dur: 2.0 },
	{ l: 80, d: 0.6, dur: 1.7 },
	{ l: 88, d: 0.4, dur: 2.2 },
	{ l: 95, d: 0.9, dur: 1.8 },
];

function AmbientLayer({ animation }) {
	if (!animation) return null;
	if (animation === "shimmer")
		return (
			<div
				className='absolute inset-0 pointer-events-none'
				style={{
					background:
						"linear-gradient(120deg,transparent 20%,rgba(251,191,36,0.07) 50%,transparent 80%)",
					animation: "hud-shimmer 5s ease-in-out infinite",
				}}
			/>
		);
	const isStorm = animation === "storm";
	const drops =
		isStorm ?
			[
				...BASE_DROPS.map((d) => ({ ...d, dur: d.dur * 0.48 })),
				{ l: 8, d: 0.2, dur: 0.9 },
				{ l: 17, d: 0.6, dur: 1.0 },
				{ l: 25, d: 0.1, dur: 0.8 },
				{ l: 32, d: 0.5, dur: 1.1 },
				{ l: 40, d: 0.3, dur: 0.9 },
				{ l: 48, d: 0.7, dur: 1.0 },
			]
		:	BASE_DROPS;
	const color = isStorm ? "rgba(248,113,113,0.3)" : "rgba(96,165,250,0.35)";
	const h = isStorm ? "9px" : "5px";
	return (
		<div className='absolute inset-0 pointer-events-none overflow-hidden'>
			{drops.map((drop, i) => (
				<div
					key={i}
					style={{
						position: "absolute",
						left: `${drop.l}%`,
						top: 0,
						width: isStorm ? "1.5px" : "1px",
						height: h,
						background: color,
						borderRadius: "1px",
						animation: `hud-rain ${drop.dur}s linear ${drop.d}s infinite`,
					}}
				/>
			))}
			{isStorm && (
				<div
					className='absolute inset-0'
					style={{
						background: "rgba(239,68,68,0.04)",
						animation: "hud-flash 6s linear infinite",
					}}
				/>
			)}
		</div>
	);
}
AmbientLayer.propTypes = { animation: PropTypes.string };

// ─── Temperature color ────────────────────────────────────────────────────────

function tempColor(value, unit) {
	const c = unit === "F" ? ((value - 32) * 5) / 9 : value;
	if (c <= -10) return "#bfdbfe";
	if (c <= 0) return "#93c5fd";
	if (c <= 10) return "#34d399";
	if (c <= 20) return "#4ade80";
	if (c <= 30) return "#facc15";
	if (c <= 40) return "#fb923c";
	return "#f87171";
}

// ─── Mobility icons ───────────────────────────────────────────────────────────

const MOB_MODES = ["foot", "aircraft", "ground vehicle", "boat"];
const MOB_ABBR = {
	foot: "FOOT",
	aircraft: "AIR",
	"ground vehicle": "GND",
	boat: "BOAT",
};

function MobIcon({ mode, color }) {
	const p = {
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: color,
		strokeWidth: "1.5",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		width: 18,
		height: 18,
	};
	switch (mode) {
		case "foot":
			return (
				<svg {...p}>
					<path d='M5 20h12v-2H5z' />
					<path d='M5 18v-5h4V9h4v4h2v5' />
					<path d='M15 13h2v5h-2z' />
				</svg>
			);
		case "aircraft":
			return (
				<svg {...p}>
					{/* main rotor */}
					<line x1='2' y1='7' x2='22' y2='7' />
					<circle cx='12' cy='7' r='1' fill={color} stroke='none' />
					{/* mast */}
					<line x1='12' y1='7' x2='12' y2='10' />
					{/* fuselage */}
					<path d='M4 10h14a2 2 0 0 1 0 4H6l-2-2v-2z' />
					{/* tail boom */}
					<line x1='18' y1='12' x2='22' y2='10' />
					{/* tail rotor */}
					<line x1='22' y1='8' x2='22' y2='12' />
					{/* skids */}
					<line x1='6' y1='14' x2='6' y2='17' />
					<line x1='12' y1='14' x2='12' y2='17' />
					<line x1='4' y1='17' x2='14' y2='17' />
				</svg>
			);
		case "ground vehicle":
			return (
				<svg {...p}>
					<rect
						x='1'
						y='9'
						width='22'
						height='9'
						rx='2'
					/>
					<path d='M5 18v2M19 18v2' />
					<path d='M3 9l2-5h14l2 5' />
					<circle
						cx='7'
						cy='18'
						r='2'
					/>
					<circle
						cx='17'
						cy='18'
						r='2'
					/>
				</svg>
			);
		case "boat":
			return (
				<svg {...p}>
					<path d='M3 17l2-9h14l2 9' />
					<path d='M3 17a9 9 0 0 0 18 0' />
					<line
						x1='12'
						y1='3'
						x2='12'
						y2='8'
					/>
				</svg>
			);
		default:
			return null;
	}
}
MobIcon.propTypes = { mode: PropTypes.string, color: PropTypes.string };

// ─── Gear / terrain maps ──────────────────────────────────────────────────────

// ─── Vision modes ─────────────────────────────────────────────────────────────

const VIS_MODES = ["night vision", "thermal vision", "eye protection"];
const VIS_ABBR = {
	"night vision": "NVG",
	"thermal vision": "THML",
	"eye protection": "EYEPRO",
};

function VisionIcon({ mode, color }) {
	const p = {
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: color,
		strokeWidth: "1.5",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		width: 18,
		height: 18,
	};
	switch (mode) {
		case "night vision":
			return (
				<svg {...p}>
					<circle cx='7' cy='14' r='4' />
					<circle cx='17' cy='14' r='4' />
					<path d='M3 6h5l2 4h4l2-4h5' />
					<line x1='11' y1='14' x2='13' y2='14' />
				</svg>
			);
		case "thermal vision":
			return (
				<svg {...p}>
					<path d='M8 3c0 2-2 3-2 5s2 3 2 5M12 1c0 2-2 3-2 5s2 3 2 5M16 3c0 2-2 3-2 5s2 3 2 5' />
					<rect x='3' y='15' width='18' height='6' rx='1' />
				</svg>
			);
		case "eye protection":
			return (
				<svg {...p}>
					<path d='M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z' />
					<circle cx='12' cy='12' r='3' />
					<path d='M2 10c0-1 1-2 3-2h14c2 0 3 1 3 2' />
				</svg>
			);
		default:
			return null;
	}
}
VisionIcon.propTypes = { mode: PropTypes.string, color: PropTypes.string };

// ─── Sound modes ──────────────────────────────────────────────────────────────

const SOUND_MODES = ["suppressors", "go loud"];
const SOUND_ABBR = { suppressors: "SUPP", "go loud": "LOUD" };

function SoundIcon({ mode, color }) {
	const p = {
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: color,
		strokeWidth: "1.5",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		width: 18,
		height: 18,
	};
	switch (mode) {
		case "suppressors":
			return (
				<svg {...p}>
					<rect x='2' y='10' width='13' height='4' rx='1' />
					<rect x='15' y='9' width='6' height='6' rx='1' />
					<line x1='21' y1='12' x2='23' y2='12' />
					<line x1='1' y1='8' x2='1' y2='16' />
				</svg>
			);
		case "go loud":
			return (
				<svg {...p}>
					<polygon points='11 5 6 9 2 9 2 15 6 15 11 19 11 5' />
					<path d='M15.54 8.46a5 5 0 0 1 0 7.07' />
					<path d='M19.07 4.93a10 10 0 0 1 0 14.14' />
				</svg>
			);
		default:
			return null;
	}
}
SoundIcon.propTypes = { mode: PropTypes.string, color: PropTypes.string };

// ─── Equipment category expansion ────────────────────────────────────────────

const CAT_EXPAND = {
	drone: ["reconDrone", "syncDrone", "combatDrone", "supplyDrone"],
	airSupport: ["strikeDesignator", "armarosDrone"],
	crossCom: ["crossCom", "satelliteFeed", "sonarVision", "intelGrenades"],
	aviation: ["aviation"],
	vehicle: ["vehicle"],
	armarosDrone: ["armarosDrone"],
};

const ALL_EQUIP_KEYS = Object.keys(RESTRICTION_LABELS);

// ─── Field block (military-style labeled data row) ────────────────────────────

function Field({ label, children }) {
	return (
		<div className='flex flex-col gap-0.5'>
			<span className='text-[10px] uppercase tracking-[0.25em] font-bold text-btn/60'>
				{label}
			</span>
			<div>{children}</div>
		</div>
	);
}
Field.propTypes = { label: PropTypes.string, children: PropTypes.node };

// ─── Section rule ─────────────────────────────────────────────────────────────

function Rule({ label, hex }) {
	return (
		<div className='flex items-center gap-2 mt-4 mb-3'>
			<div
				className='h-px flex-1'
				style={{ background: `linear-gradient(to right, ${hex}60, ${hex}10)` }}
			/>
			<span
				className='text-[11px] font-bold uppercase tracking-[0.3em] shrink-0'
				style={{ color: hex }}>
				{label}
			</span>
			<div
				className='w-1.5 h-1.5 rotate-45 shrink-0'
				style={{ background: hex, opacity: 0.6 }}
			/>
		</div>
	);
}
Rule.propTypes = { label: PropTypes.string, hex: PropTypes.string };

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeatherPanel({
	province,
	provinceKey: provinceKeyProp,
	onAtmosphereChange = null,
}) {
	const [unit, setUnit] = useState("C");
	const [rollKey, setRollKey] = useState(0);
	const [selectedAtmosphere, setSelectedAtmosphere] = useState(null);

	const biomeKey = useMemo(() => {
		if (!province) return null;
		if (typeof province === "string")
			return PROVINCE_BIOMES[province] ?? province;
		return province.biome ?? PROVINCE_BIOMES[province] ?? null;
	}, [province]);

	// reset selection when province changes
	useEffect(() => {
		setSelectedAtmosphere(null);
	}, [biomeKey]);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const weatherC = useMemo(
		() => (biomeKey ? getProvinceWeather(biomeKey, "C") : null),
		[biomeKey, rollKey],
	);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const weatherF = useMemo(
		() => (biomeKey ? getProvinceWeather(biomeKey, "F") : null),
		[biomeKey, rollKey],
	);
	const weather = weatherC;

	const resolvedAtmosphere = selectedAtmosphere ?? weather?.atmosphere;

	// report current atmosphere to parent whenever it changes
	const onAtmosphereChangeRef = useRef(onAtmosphereChange);
	useEffect(() => { onAtmosphereChangeRef.current = onAtmosphereChange; });
	useEffect(() => {
		if (resolvedAtmosphere) onAtmosphereChangeRef.current?.(resolvedAtmosphere);
	}, [resolvedAtmosphere]);

	// reroll = clear manual selection + new random temp
	const handleReroll = useCallback(() => {
		setSelectedAtmosphere(null);
		setRollKey((k) => k + 1);
	}, []);

	// select = lock atmosphere + new random temp
	const handleAtmosphereSelect = useCallback((e) => {
		setSelectedAtmosphere(e.target.value);
		setRollKey((k) => k + 1);
	}, []);

	const provinceKey =
		provinceKeyProp ?? (typeof province === "string" ? province : null);

	const condData = useMemo(
		() => getWeatherConditionData(provinceKey, resolvedAtmosphere),
		[provinceKey, resolvedAtmosphere],
	);
	const terrain = useMemo(() => getTerrainData(provinceKey), [provinceKey]);
	const degradedKeys = useMemo(() => {
		const keys = new Set();
		for (const cat of (terrain?.degraded ?? [])) {
			(CAT_EXPAND[cat] ?? [cat]).forEach((k) => keys.add(k));
		}
		return keys;
	}, [terrain]);

	if (!weather) return null;

	const atm = ATM[resolvedAtmosphere] ?? ATM_DEFAULT;
	const displayTemp =
		unit === "F" ? weatherF?.temperature : weatherC?.temperature;
	const tColor =
		displayTemp ? tempColor(displayTemp.value, displayTemp.unit) : "#7caa79";

	const available = new Set(condData?.mobility ?? []);
	const conditional = new Set(condData?.mobilityConditional ?? []);
	const visionGear = condData?.visibility ?? [];
	const soundRule = condData?.sound?.[0] ?? null;
	const terrainDeg = terrain?.degraded ?? [];

	// scanline overlay
	const scanline =
		"repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(0,0,0,0.18) 1px,rgba(0,0,0,0.18) 2px)";

	return (
		<div
			className='relative w-full overflow-hidden select-none'
			style={{
				background: `linear-gradient(180deg, ${atm.tint} 0%, #07090a 60%)`,
				fontFamily: "'Courier New','Lucida Console',monospace",
			}}>
			<style>{KEYFRAMES}</style>

			{/* Scanline texture */}
			<div
				className='absolute inset-0 pointer-events-none z-0'
				style={{ background: scanline, opacity: 0.6 }}
			/>
			<AmbientLayer animation={atm.animation} />

			{/* ── Classification bar ── */}
			<div
				className='relative z-10 flex items-center justify-between px-3 py-1.5 border-b'
				style={{ borderColor: `${atm.hex}40`, background: `${atm.hex}10` }}>
				<span
					className='text-[10px] uppercase tracking-[0.35em] font-bold'
					style={{ color: atm.hex }}>
					◈ Meteorological Intel
				</span>
				<span className='text-[10px] uppercase tracking-widest text-btn/80'>
					AO — Auroa
				</span>
			</div>

			{/* ── Controls bar ── */}
			<div className='relative z-10 flex items-center gap-2 px-3 py-2 border-b border-neutral-800/50'>
				<button
					onClick={handleReroll}
					className='flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-bold px-2 py-1 border transition-all shrink-0'
					style={{ borderColor: `${atm.hex}40`, color: `${atm.hex}cc` }}
					title='Re-roll temperature'>
					↺ Temp
				</button>
				<select
					value={resolvedAtmosphere ?? ""}
					onChange={handleAtmosphereSelect}
					className='flex-1 appearance-none font-mono text-[11px] tracking-widest uppercase bg-neutral-900 border border-btn/25 text-fontz px-2 py-1 focus:outline-none focus:border-btn/50 transition-colors cursor-pointer'
					style={{ borderColor: `${atm.hex}30` }}>
					{Object.entries(ATM).map(([key, val]) => (
						<option key={key} value={key}>{val.label}</option>
					))}
				</select>
				<div className='flex items-center border border-neutral-700 overflow-hidden shrink-0'>
					{["C", "F"].map((u) => (
						<button
							key={u}
							onClick={() => setUnit(u)}
							className='px-2.5 py-1 text-[12px] uppercase tracking-widest font-bold transition-all'
							style={
								unit === u ?
									{ background: `${atm.hex}25`, color: atm.hex }
								:	{ color: "#8ca89e" }
							}>
							°{u}
						</button>
					))}
				</div>
			</div>

			{/* ── Condition hero ── */}
			<div className='relative z-10 px-4 py-4 border-b border-neutral-800/50'>
				{/* corner brackets */}
				{[
					["top-2 left-2", "border-t border-l"],
					["top-2 right-2", "border-t border-r"],
					["bottom-2 left-2", "border-b border-l"],
					["bottom-2 right-2", "border-b border-r"],
				].map(([pos, cls], i) => (
					<div
						key={i}
						className={`absolute w-3 h-3 pointer-events-none ${pos} ${cls}`}
						style={{ borderColor: `${atm.hex}50` }}
					/>
				))}

				<div className='flex items-center gap-4'>
					<div className='shrink-0 relative'>
						<HeroIcon
							condition={resolvedAtmosphere}
							color={atm.hex}
						/>
					</div>
					<div className='flex-1 min-w-0 flex flex-col gap-2'>
						{/* condition code + label */}
						<div className='flex items-baseline gap-2'>
							<span
								className='text-[12px] font-bold tracking-[0.35em] uppercase'
								style={{ color: `${atm.hex}80` }}>
								{atm.code}
							</span>
							<span
								className='text-xl font-bold uppercase tracking-wider leading-none'
								style={{ color: atm.hex }}>
								{atm.label}
							</span>
						</div>
						{/* temperature + humidity */}
						<div className='flex items-end gap-3'>
							<div className='flex items-baseline gap-0.5'>
								<span
									className='text-4xl font-bold tabular-nums leading-none'
									style={{ color: tColor }}>
									{displayTemp?.value}°
								</span>
								<span
									className='text-sm font-bold mb-0.5'
									style={{ color: `${tColor}70` }}>
									{displayTemp?.unit}
								</span>
							</div>
							<div className='flex flex-col gap-0.5 mb-0.5'>
								<span className='text-[10px] uppercase tracking-[0.25em] text-btn/80'>
									Humidity
								</span>
								<span className='text-xs font-bold uppercase tracking-wide text-fontz/80'>
									{weather.humidity}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ── Mobility grid ── */}
			{condData && (
				<div className='relative z-10 px-3 py-3 border-b border-neutral-800/50'>
					<Rule
						label='Mobility'
						hex={atm.hex}
					/>
					<div className='grid grid-cols-4 gap-2'>
						{MOB_MODES.map((mode) => {
							const isAvail = available.has(mode);
							const isCond = conditional.has(mode);
							let hex, bg, label;
							if (isAvail) {
								hex = "#4ade80";
								bg = "rgba(74,222,128,0.07)";
								label = "GO";
							} else if (isCond) {
								hex = "#fbbf24";
								bg = "rgba(251,191,36,0.07)";
								label = "COND";
							} else {
								hex = "#8ca89e";
								bg = "rgba(255,255,255,0.02)";
								label = "DENY";
							}

							return (
								<div
									key={mode}
									className='flex flex-col items-center gap-1.5 py-3 border'
									style={{ borderColor: `${hex}35`, background: bg }}>
									<MobIcon
										mode={mode}
										color={hex}
									/>
									<span
										className='text-[11px] font-bold uppercase tracking-widest'
										style={{ color: hex }}>
										{MOB_ABBR[mode]}
									</span>
									<span
										className='text-[10px] font-bold uppercase tracking-widest'
										style={{ color: `${hex}80` }}>
										{label}
									</span>
								</div>
							);
						})}
					</div>
					{conditional.size > 0 && (
						<p className='text-[11px] text-amber-400/60 mt-2'>
							◐ Conditional — active threat neutralization required
						</p>
					)}
				</div>
			)}

			{/* ── Vision ── */}
			{condData && (
				<div className='relative z-10 px-3 py-3 border-b border-neutral-800/50'>
					<Rule
						label='Vision'
						hex={atm.hex}
					/>
					<div className='grid grid-cols-3 gap-2'>
						{VIS_MODES.map((mode) => {
							const isActive = visionGear.includes(mode);
							const hex = isActive ? "#4ade80" : "#8ca89e";
							const bg =
								isActive ?
									"rgba(74,222,128,0.07)"
								:	"rgba(255,255,255,0.02)";
							return (
								<div
									key={mode}
									className='flex flex-col items-center gap-1.5 py-3 border'
									style={{ borderColor: `${hex}35`, background: bg }}>
									<VisionIcon
										mode={mode}
										color={hex}
									/>
									<span
										className='text-[11px] font-bold uppercase tracking-widest'
										style={{ color: hex }}>
										{VIS_ABBR[mode]}
									</span>
									<span
										className='text-[10px] font-bold uppercase tracking-widest'
										style={{ color: `${hex}80` }}>
										{isActive ? "REQ" : "N/A"}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* ── Sound Discipline ── */}
			{condData && (
				<div className='relative z-10 px-3 py-3 border-b border-neutral-800/50'>
					<Rule
						label='Sound Discipline'
						hex={atm.hex}
					/>
					<div className='grid grid-cols-2 gap-2'>
						{SOUND_MODES.map((mode) => {
							const isActive = soundRule === mode;
							const hex = isActive ? "#4ade80" : "#8ca89e";
							const bg =
								isActive ?
									"rgba(74,222,128,0.07)"
								:	"rgba(255,255,255,0.02)";
							return (
								<div
									key={mode}
									className='flex flex-col items-center gap-1.5 py-3 border'
									style={{ borderColor: `${hex}35`, background: bg }}>
									<SoundIcon
										mode={mode}
										color={hex}
									/>
									<span
										className='text-[11px] font-bold uppercase tracking-widest'
										style={{ color: hex }}>
										{SOUND_ABBR[mode]}
									</span>
									<span
										className='text-[10px] font-bold uppercase tracking-widest'
										style={{ color: `${hex}80` }}>
										{isActive ? "ACTIVE" : "OFF"}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* ── Terrain / Equipment ── */}
			{terrainDeg.length > 0 && (
				<div className='relative z-10 px-3 py-3'>
					<Rule
						label='Terrain Degraded'
						hex='#d97706'
					/>
					{terrain?.description && (
						<p className='text-[11px] text-fontz/80 mb-3 leading-relaxed'>
							{terrain.description}
						</p>
					)}
					<div className='grid grid-cols-4 gap-2'>
						{ALL_EQUIP_KEYS.map((key) => {
							const cfg = RESTRICTION_LABELS[key];
							if (!cfg) return null;
							const isDegr = degradedKeys.has(key);
							const hex = isDegr ? "#d97706" : "#374151";
							const bg =
								isDegr ?
									"rgba(217,119,6,0.07)"
								:	"rgba(255,255,255,0.01)";
							return (
								<div
									key={key}
									className='flex flex-col items-center gap-1.5 py-2.5 border'
									style={{
										borderColor: isDegr ? "#d9770650" : "#37415130",
										background: bg,
									}}>
									<img
										src={cfg.icon}
										alt={cfg.name}
										width={20}
										height={20}
										style={{
											filter: isDegr ?
												"brightness(0) saturate(100%) invert(60%) sepia(100%) saturate(300%) hue-rotate(5deg)"
											:	"brightness(0) invert(1)",
											opacity: isDegr ? 1 : 0.12,
											display: "block",
										}}
									/>
									<span
										className='text-[10px] font-bold uppercase tracking-widest text-center leading-tight'
										style={{ color: hex }}>
										{cfg.name}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

WeatherPanel.propTypes = {
	province: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
	provinceKey: PropTypes.string,
	onAtmosphereChange: PropTypes.func,
};
