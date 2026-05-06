import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { getProvinceWeather } from "../utils/Weather";
import { PROVINCE_BIOMES } from "@/config";
import { resolveRestrictions, RESTRICTION_LABELS } from "@/utils/Restrictions";
import { STATUS } from "@/config";

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
@keyframes hud-pulse-slow {
  0%, 100% { opacity: 0.55; }
  50%       { opacity: 1; }
}
@keyframes hud-pulse-fast {
  0%, 100% { opacity: 0.35; }
  50%       { opacity: 1; }
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
		label:     'Cloudless',
		bgTint:    'rgba(14,165,233,0.025)',
		borderHex: '#7dd3fc',
		accent:    'text-sky-300',
		badge:     'bg-sky-500/10 border border-sky-500/30 text-sky-300',
		animation: null,
	},
	sunshine: {
		label:     'Sunshine',
		bgTint:    'rgba(251,191,36,0.035)',
		borderHex: '#fbbf24',
		accent:    'text-yellow-400',
		badge:     'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400',
		animation: 'shimmer',
	},
	overcast: {
		label:     'Overcast',
		bgTint:    'rgba(100,116,139,0.04)',
		borderHex: '#94a3b8',
		accent:    'text-slate-400',
		badge:     'bg-slate-500/10 border border-slate-500/30 text-slate-300',
		animation: null,
	},
	precipitation: {
		label:     'Precipitation',
		bgTint:    'rgba(59,130,246,0.045)',
		borderHex: '#60a5fa',
		accent:    'text-blue-400',
		badge:     'bg-blue-500/10 border border-blue-500/30 text-blue-400',
		animation: 'rain',
	},
	storm: {
		label:     'Storm',
		bgTint:    'rgba(239,68,68,0.05)',
		borderHex: '#f87171',
		accent:    'text-red-400',
		badge:     'bg-red-500/10 border border-red-500/30 text-red-400',
		animation: 'storm',
	},
};

const ATM_DEFAULT = {
	label: 'Unknown', bgTint: 'transparent', borderHex: '#52525b',
	accent: 'text-zinc-400', badge: 'bg-zinc-800 border border-zinc-700 text-zinc-400',
	animation: null,
};

// ─── Atmosphere hero icon (large) ─────────────────────────────────────────────

const HeroIcon = ({ condition }) => {
	const props = {
		viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
		strokeWidth: '1.25', strokeLinecap: 'round', strokeLinejoin: 'round',
		className: 'w-16 h-16',
	};
	switch (condition) {
		case 'cloudless': return (
			<svg {...props}>
				<circle cx="12" cy="12" r="5" strokeWidth="1.5" />
				{[[12,1,12,3],[12,21,12,23],[4.22,4.22,5.64,5.64],[18.36,18.36,19.78,19.78],
				  [1,12,3,12],[21,12,23,12],[4.22,19.78,5.64,18.36],[18.36,5.64,19.78,4.22]]
				  .map(([x1,y1,x2,y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.5" />)}
			</svg>
		);
		case 'sunshine': return (
			<svg {...props}>
				<circle cx="12" cy="12" r="4" strokeWidth="1.5" />
				{[[12,2,12,6],[12,18,12,22],[4.93,4.93,7.76,7.76],[16.24,16.24,19.07,19.07],
				  [2,12,6,12],[18,12,22,12],[4.93,19.07,7.76,16.24],[16.24,7.76,19.07,4.93]]
				  .map(([x1,y1,x2,y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.5" />)}
			</svg>
		);
		case 'overcast': return (
			<svg {...props}>
				<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" strokeWidth="1.5" />
			</svg>
		);
		case 'precipitation': return (
			<svg {...props}>
				<path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" strokeWidth="1.5" />
				<line x1="16" y1="13" x2="16" y2="21" strokeWidth="1.5" />
				<line x1="8"  y1="13" x2="8"  y2="21" strokeWidth="1.5" />
				<line x1="12" y1="15" x2="12" y2="23" strokeWidth="1.5" />
			</svg>
		);
		case 'storm': return (
			<svg {...props}>
				<path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" strokeWidth="1.5" />
				<polyline points="13 11 9 17 15 17 11 23" strokeWidth="1.75" />
			</svg>
		);
		default: return null;
	}
};
HeroIcon.propTypes = { condition: PropTypes.string };

// ─── Ambient animation layer ──────────────────────────────────────────────────

const RAIN_DROPS = [
	{ l: 5,  d: 0.0, dur: 1.9 }, { l: 12, d: 0.4, dur: 2.2 }, { l: 20, d: 0.1, dur: 1.7 },
	{ l: 28, d: 0.7, dur: 2.0 }, { l: 35, d: 0.3, dur: 1.8 }, { l: 43, d: 0.9, dur: 2.3 },
	{ l: 50, d: 0.5, dur: 1.6 }, { l: 58, d: 0.2, dur: 2.1 }, { l: 65, d: 0.8, dur: 1.9 },
	{ l: 73, d: 0.1, dur: 2.0 }, { l: 80, d: 0.6, dur: 1.7 }, { l: 88, d: 0.4, dur: 2.2 },
	{ l: 95, d: 0.9, dur: 1.8 },
];

const STORM_DROPS = [
	...RAIN_DROPS.map(d => ({ ...d, dur: d.dur * 0.48 })),
	{ l: 8,  d: 0.2, dur: 0.9 }, { l: 17, d: 0.6, dur: 1.0 }, { l: 25, d: 0.1, dur: 0.8 },
	{ l: 32, d: 0.5, dur: 1.1 }, { l: 40, d: 0.3, dur: 0.9 }, { l: 48, d: 0.7, dur: 1.0 },
	{ l: 56, d: 0.4, dur: 0.8 }, { l: 63, d: 0.2, dur: 1.1 }, { l: 71, d: 0.8, dur: 0.9 },
	{ l: 78, d: 0.5, dur: 1.0 }, { l: 86, d: 0.1, dur: 0.8 }, { l: 93, d: 0.6, dur: 1.1 },
];

const AmbientLayer = ({ animation }) => {
	if (!animation) return null;

	if (animation === 'shimmer') return (
		<div
			className="absolute inset-0 pointer-events-none"
			style={{
				background: 'linear-gradient(120deg, transparent 20%, rgba(251,191,36,0.06) 50%, transparent 80%)',
				animation: 'hud-shimmer 5s ease-in-out infinite',
			}}
		/>
	);

	const drops      = animation === 'storm' ? STORM_DROPS : RAIN_DROPS;
	const dropColor  = animation === 'storm' ? 'rgba(248,113,113,0.28)' : 'rgba(96,165,250,0.35)';
	const dropHeight = animation === 'storm' ? '9px' : '5px';
	const dropWidth  = animation === 'storm' ? '1.5px' : '1px';

	return (
		<div className="absolute inset-0 pointer-events-none overflow-hidden">
			{drops.map((drop, i) => (
				<div
					key={i}
					style={{
						position:        'absolute',
						left:            `${drop.l}%`,
						top:             0,
						width:           dropWidth,
						height:          dropHeight,
						background:      dropColor,
						borderRadius:    '1px',
						animation:       `hud-rain ${drop.dur}s linear ${drop.d}s infinite`,
					}}
				/>
			))}
			{animation === 'storm' && (
				<div
					className="absolute inset-0"
					style={{ background: 'rgba(239,68,68,0.04)', animation: 'hud-flash 6s linear infinite' }}
				/>
			)}
		</div>
	);
};
AmbientLayer.propTypes = { animation: PropTypes.string };

// ─── Gauge bar ────────────────────────────────────────────────────────────────

function gaugeColor(type, value, max) {
	const pct = (value / max) * 100;
	if (type === 'visibility') {
		if (pct > 65) return '#38bdf8';
		if (pct > 35) return '#3b82f6';
		if (pct > 15) return '#d97706';
		return '#dc2626';
	}
	if (type === 'acoustic') {
		if (pct > 55) return '#22c55e';
		if (pct > 25) return '#84cc16';
		if (pct > 10) return '#eab308';
		return '#71717a';
	}
	if (type === 'thermal') {
		if (pct > 55) return '#22c55e';
		if (pct > 35) return '#84cc16';
		if (pct > 18) return '#eab308';
		return '#ef4444';
	}
	if (type === 'wind') {
		if (pct < 18) return '#22c55e';
		if (pct < 42) return '#eab308';
		if (pct < 65) return '#f97316';
		return '#ef4444';
	}
	return '#71717a';
}

const BarGauge = ({ label, value, max, unit, type }) => {
	const pct   = Math.min(100, Math.round((value / max) * 100));
	const color = gaugeColor(type, value, max);
	const displayVal = type === 'visibility' && value >= 1000
		? `${(value / 1000).toFixed(1)} km`
		: `${value}${unit}`;
	return (
		<div className="flex items-center gap-3 px-3 py-2">
			<span className="text-[9px] uppercase tracking-widest text-zinc-600 w-[68px] shrink-0">{label}</span>
			<div className="flex-1 h-[3px] bg-zinc-900 rounded-full overflow-hidden">
				<div
					className="h-full rounded-full"
					style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 5px ${color}66` }}
				/>
			</div>
			<span className="text-[10px] font-mono text-zinc-400 w-[54px] text-right shrink-0">{displayVal}</span>
		</div>
	);
};
BarGauge.propTypes = {
	label: PropTypes.string.isRequired,
	value: PropTypes.number.isRequired,
	max:   PropTypes.number.isRequired,
	unit:  PropTypes.string.isRequired,
	type:  PropTypes.string.isRequired,
};

const AirRow = ({ status }) => {
	const tiers   = [STATUS.NOMINAL, STATUS.DEGRADED, STATUS.DENIED];
	const colors  = { [STATUS.NOMINAL]: '#22c55e', [STATUS.DEGRADED]: '#eab308', [STATUS.DENIED]: '#ef4444' };
	const labels  = { [STATUS.NOMINAL]: 'Nominal', [STATUS.DEGRADED]: 'Degraded', [STATUS.DENIED]: 'Denied' };
	const active  = colors[status] ?? '#71717a';
	return (
		<div className="flex items-center gap-3 px-3 py-2">
			<span className="text-[9px] uppercase tracking-widest text-zinc-600 w-[68px] shrink-0">Air Assets</span>
			<div className="flex gap-2">
				{tiers.map(tier => (
					<div
						key={tier}
						className="w-2 h-2 rounded-full"
						style={{
							backgroundColor: tier === status ? colors[tier] : '#27272a',
							boxShadow:       tier === status ? `0 0 6px ${colors[tier]}99` : 'none',
						}}
					/>
				))}
			</div>
			<span className="text-[10px] font-mono w-[54px] text-right shrink-0" style={{ color: active }}>
				{labels[status] ?? status}
			</span>
		</div>
	);
};
AirRow.propTypes = { status: PropTypes.string.isRequired };

// ─── Restriction list ─────────────────────────────────────────────────────────

const RESTRICT_KEYS = [
	'isrDrone', 'crossCom', 'sonarVision', 'intelGrenades',
	'aviation', 'vehicle',
	'reconDrone', 'syncDrone', 'combatDrone', 'supplyDrone',
	'nvgThermal', 'uplinkProtocol', 'lrOptics',
];

// ─── Decision chips ───────────────────────────────────────────────────────────

const CHIPS = {
	cloudless: {
		exploit: ['Long-range fire', 'ISR coverage', 'Air mobility'],
		avoid:   ['Silhouette exposure'],
		adapt:   ['Sun discipline', 'Shade movement'],
	},
	sunshine: {
		exploit: ['Max visibility', 'Air assets optimal'],
		avoid:   ['Glass glare (urban)', 'Heat shimmer (volcanic)'],
		adapt:   ['Hydration protocol', 'Shade concealment'],
	},
	overcast: {
		exploit: ['Drone ceiling stable', 'Thermal enhanced'],
		avoid:   ['ISR consistency'],
		adapt:   ['NVG ready', 'IR strobe armed'],
	},
	precipitation: {
		exploit: ['Sound masking', 'Track concealment', 'Thermal cover'],
		avoid:   ['LR optics', 'ISR feed', 'Air assets'],
		adapt:   ['Sealed optics', 'Waterproof kit', 'Radio protocol'],
	},
	storm: {
		exploit: ['Max sound masking', 'Thermal blind', 'Full concealment'],
		avoid:   ['Air assets', 'Drone ops', 'LR fire'],
		adapt:   ['Ground nav only', 'SITREP on foot'],
	},
};

const CHIP_ROW_STYLE = {
	exploit: { label: 'EXPLOIT', cls: 'bg-green-500/10 border-green-500/30 text-green-400' },
	avoid:   { label: 'AVOID',   cls: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
	adapt:   { label: 'ADAPT',   cls: 'bg-sky-500/10   border-sky-500/30   text-sky-400'   },
};

// ─── Gauge derivation ─────────────────────────────────────────────────────────

const BIOME_GROUP_MAP = {
	'Rain Forest':                     'tropical',
	'Volcanic Rain Forest':            'volcanic',
	'Volcanic Dessert':                'volcanic',
	'High Cliffs':                     'maritime',
	'Salt Marsh':                      'marsh',
	'High Thundra':                    'tundra',
	'Fjordlands':                      'maritime',
	'Rain Shadows':                    'open',
	'Mead Lands':                      'open',
	'Meadow Lands and Urban City':     'urban',
	'Meadow Lands':                    'open',
	'High Thundra and Rain Shadows':   'tundra',
};

const WIND_DIRS = {
	tropical: 'SE', volcanic: 'NW', tundra: 'N',
	maritime: 'W',  marsh:    'SW', urban:  'VAR', open: 'NE',
};

function deriveGauges(atmosphere, biome, restrictions) {
	const group = BIOME_GROUP_MAP[biome] ?? 'open';

	const BASE = {
		vis:      { cloudless: 9000, sunshine: 7000, overcast: 4000, precipitation: 1200, storm: 300 },
		acoustic: { cloudless: 5,    sunshine: 10,   overcast: 22,   precipitation: 65,   storm: 92  },
		thermal:  { cloudless: 78,   sunshine: 62,   overcast: 55,   precipitation: 32,   storm: 14  },
		wind:     { cloudless: 5,    sunshine: 12,   overcast: 22,   precipitation: 38,   storm: 72  },
	};

	let vis      = BASE.vis[atmosphere]      ?? 5000;
	let acoustic = BASE.acoustic[atmosphere] ?? 15;
	let thermal  = BASE.thermal[atmosphere]  ?? 50;
	let wind     = BASE.wind[atmosphere]     ?? 15;

	if (group === 'tropical' || group === 'marsh') {
		vis      = Math.round(vis * 0.7);
		acoustic = Math.min(100, acoustic + 10);
	}
	if (group === 'volcanic') {
		thermal = Math.max(0, thermal - 35);
		vis     = Math.round(vis * 0.85);
	}
	if (group === 'tundra' && ['storm', 'precipitation'].includes(atmosphere)) {
		vis  = Math.round(vis * 0.6);
		wind += 20;
	}
	if (group === 'maritime' && atmosphere === 'storm') wind += 15;
	if (group === 'tundra' || group === 'maritime')     thermal = Math.min(100, thermal + 15);

	thermal = Math.max(0, Math.min(100, thermal));

	return {
		vis,
		acoustic,
		thermal,
		wind,
		windDir:   WIND_DIRS[group] ?? 'VAR',
		airStatus: restrictions?.aviation?.status ?? STATUS.NOMINAL,
	};
}

function calcSeverity(restrictions) {
	if (!restrictions) return 0;
	let score = 0;
	for (const v of Object.values(restrictions)) {
		if (v.status === STATUS.DEGRADED) score += 1;
		if (v.status === STATUS.DENIED)   score += 2;
	}
	return Math.min(5, Math.floor(score / 3));
}

// ─── Temperature color ────────────────────────────────────────────────────────

function getTempColor(value, unit) {
	const c = unit === 'F' ? ((value - 32) * 5) / 9 : value;
	if (c <= -10) return '#bfdbfe';
	if (c <= 0)   return '#93c5fd';
	if (c <= 10)  return '#34d399';
	if (c <= 20)  return '#4ade80';
	if (c <= 30)  return '#facc15';
	if (c <= 40)  return '#fb923c';
	return '#f87171';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeatherPanel({ province, provinceKey: provinceKeyProp, userUnit = 'C' }) {
	const [unit, setUnit] = useState(userUnit);

	const biomeKey = useMemo(() => {
		if (!province) return null;
		if (typeof province === 'string') return PROVINCE_BIOMES[province] ?? province;
		return province.biome ?? PROVINCE_BIOMES[province] ?? null;
	}, [province]);

	const weatherC = useMemo(() => biomeKey ? getProvinceWeather(biomeKey, 'C') : null, [biomeKey]);
	const weatherF = useMemo(() => biomeKey ? getProvinceWeather(biomeKey, 'F') : null, [biomeKey]);
	const weather  = weatherC;

	const provinceKey = provinceKeyProp ?? (typeof province === 'string' ? province : null);

	const restrictions = useMemo(
		() => resolveRestrictions(
			provinceKey,
			null,
			weather ? { atmosphere: weather.atmosphere, biome: weather.biome } : null,
		),
		[provinceKey, weather],
	);

	const gauges = useMemo(
		() => deriveGauges(weather?.atmosphere, weather?.biome, restrictions),
		[weather?.atmosphere, weather?.biome, restrictions],
	);

	const severity = useMemo(() => calcSeverity(restrictions), [restrictions]);

	if (!weather) return null;

	const atm         = ATM[weather.atmosphere] ?? ATM_DEFAULT;
	const chips       = CHIPS[weather.atmosphere] ?? { exploit: [], avoid: [], adapt: [] };
	const displayTemp = unit === 'F' ? weatherF?.temperature : weatherC?.temperature;
	const tempColor   = displayTemp ? getTempColor(displayTemp.value, displayTemp.unit) : '#71717a';

	const severityAnim = severity >= 5
		? 'hud-pulse-fast 0.75s ease-in-out infinite'
		: severity >= 3
			? 'hud-pulse-slow 2s ease-in-out infinite'
			: 'none';

	return (
		<div
			className="relative w-full rounded-sm overflow-hidden"
			style={{
				background:  `linear-gradient(180deg, ${atm.bgTint} 0%, #0a0c0e 38%)`,
				border:      `1px solid ${atm.borderHex}55`,
				fontFamily:  "'Courier New', 'Lucida Console', monospace",
			}}
		>
			<style>{KEYFRAMES}</style>
			<AmbientLayer animation={atm.animation} />

			{/* ── Header ── */}
			<div className="relative z-10 flex items-center justify-between px-3 py-2 border-b border-zinc-800/60">
				<span className="text-[9px] uppercase tracking-widest text-zinc-600">Pre-Op Conditions</span>
				<div className="flex items-center gap-2">
					<div className="flex items-center border border-zinc-800 rounded-sm overflow-hidden">
						{['C', 'F'].map(u => (
							<button
								key={u}
								onClick={() => setUnit(u)}
								className={[
									'px-2 py-0.5 text-[9px] uppercase tracking-widest transition-all',
									unit === u ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-600 hover:text-zinc-400',
								].join(' ')}
							>
								°{u}
							</button>
						))}
					</div>
					<span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${atm.badge}`}>
						{weather.biome}
					</span>
				</div>
			</div>

			{/* ── Atmosphere Hero ── */}
			<div className="relative z-10 flex flex-col items-center pt-6 pb-5 border-b border-zinc-800/60">
				<div className={atm.accent}>
					<HeroIcon condition={weather.atmosphere} />
				</div>
				<div
					className={`mt-2 text-sm font-bold uppercase tracking-[0.22em] ${atm.accent}`}
					style={severity >= 3 ? { animation: severityAnim } : undefined}
				>
					{atm.label}
				</div>

				{/* Temp + Humidity */}
				<div className="mt-4 flex items-center gap-6">
					<div className="text-center">
						<div className="text-2xl font-bold tracking-tight" style={{ color: tempColor }}>
							{displayTemp?.value}°
							<span className="text-sm font-normal text-zinc-600 ml-0.5">{displayTemp?.unit}</span>
						</div>
						<div className="text-[8px] uppercase tracking-widest text-zinc-700 mt-0.5">Temperature</div>
					</div>
					<div className="w-px h-8 bg-zinc-800" />
					<div className="text-center">
						<div className="text-sm font-semibold capitalize text-zinc-400">{weather.humidity}</div>
						<div className="text-[8px] uppercase tracking-widest text-zinc-700 mt-0.5">Humidity</div>
					</div>
				</div>

				{/* Severity badge */}
				{severity >= 3 && (
					<div
						className="mt-3 text-[8px] uppercase tracking-widest px-2 py-0.5 border rounded-sm font-semibold"
						style={{
							borderColor: severity >= 5 ? '#ef4444' : '#eab308',
							color:       severity >= 5 ? '#f87171' : '#fbbf24',
							background:  severity >= 5 ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
							animation:   severityAnim,
						}}
					>
						{severity >= 5 ? '⚠ Critical Restriction' : '⚠ Significant Restriction'}
					</div>
				)}
			</div>

			{/* ── Gauges ── */}
			<div className="relative z-10 divide-y divide-zinc-800/40 border-b border-zinc-800/60">
				<BarGauge label="Visibility"  value={gauges.vis}      max={10000} unit="m"  type="visibility" />
				<BarGauge label="Acoustic"    value={gauges.acoustic}  max={100}   unit="%" type="acoustic"   />
				<BarGauge label="Thermal"     value={gauges.thermal}   max={100}   unit="%" type="thermal"    />

				{/* Wind row */}
				<div className="flex items-center gap-3 px-3 py-2">
					<span className="text-[9px] uppercase tracking-widest text-zinc-600 w-[68px] shrink-0">Wind</span>
					<div className="flex-1 h-[3px] bg-zinc-900 rounded-full overflow-hidden">
						<div
							className="h-full rounded-full"
							style={{
								width:           `${Math.min(100, Math.round((gauges.wind / 120) * 100))}%`,
								backgroundColor: gaugeColor('wind', gauges.wind, 120),
								boxShadow:       `0 0 5px ${gaugeColor('wind', gauges.wind, 120)}66`,
							}}
						/>
					</div>
					<span className="text-[10px] font-mono text-zinc-400 w-[54px] text-right shrink-0">
						{gauges.wind} kph {gauges.windDir}
					</span>
				</div>

				<AirRow status={gauges.airStatus} />
			</div>

			{/* ── Restriction List ── */}
			<div className="relative z-10 px-3 py-2.5 border-b border-zinc-800/60">
				<div className="text-[8px] uppercase tracking-widest text-zinc-700 mb-2">Asset Status</div>
				<div className="space-y-1.5">
					{RESTRICT_KEYS.map(key => {
						const entry    = restrictions?.[key];
						const status   = entry?.status ?? STATUS.NOMINAL;
						const isNom    = status === STATUS.NOMINAL;
						const isDenied = status === STATUS.DENIED;
						return (
							<div key={key} className="flex items-center justify-between gap-2">
								<span
									className="text-[10px] uppercase tracking-wider"
									style={{ color: isNom ? '#3f3f46' : isDenied ? '#f87171' : '#fbbf24' }}
								>
									{RESTRICTION_LABELS[key] ?? key}
								</span>
								{!isNom && (
									<span
										className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm font-semibold border shrink-0"
										style={{
											color:      isDenied ? '#f87171' : '#fbbf24',
											background: isDenied ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.09)',
											borderColor:isDenied ? 'rgba(239,68,68,0.35)' : 'rgba(234,179,8,0.3)',
										}}
									>
										{isDenied ? 'Denied' : 'Degraded'}
										{isDenied && entry?.unlockable && (
											<span className="ml-1 opacity-60">⚿</span>
										)}
									</span>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* ── Decision Chips ── */}
			<div className="relative z-10 px-3 py-2.5 space-y-1.5 border-b border-zinc-800/60">
				{(['exploit', 'avoid', 'adapt']).map(type => {
					const { label, cls } = CHIP_ROW_STYLE[type];
					const list = chips[type] ?? [];
					if (list.length === 0) return null;
					return (
						<div key={type} className="flex items-start gap-2">
							<span className="text-[8px] uppercase tracking-widest text-zinc-600 pt-0.5 w-[44px] shrink-0">
								{label}
							</span>
							<div className="flex flex-wrap gap-1">
								{list.map((chip, i) => (
									<span
										key={i}
										className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 border rounded-sm font-semibold ${cls}`}
									>
										{chip}
									</span>
								))}
							</div>
						</div>
					);
				})}
			</div>

			{/* ── Footer ── */}
			<div className="relative z-10 px-3 py-1.5 flex items-center justify-between">
				<span className="text-[8px] text-zinc-800 uppercase tracking-widest">Biome-derived estimate</span>
				<span className="text-[8px] text-zinc-800 uppercase tracking-widest">Verify in-field</span>
			</div>
		</div>
	);
}

WeatherPanel.propTypes = {
	province:    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
	provinceKey: PropTypes.string,
	userUnit:    PropTypes.oneOf(['C', 'F']),
};
