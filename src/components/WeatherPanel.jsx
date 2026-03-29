import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { getProvinceWeather } from "../utils/Weather";
import { PROVINCE_BIOMES } from "@/config";
import {
	resolveRestrictions,
	RESTRICTION_LABELS,
} from "@/utils/Restrictions";
import { STATUS } from "@/config";

// ─── Icons (inline SVG — no dependency) ──────────────────────────────────────

const TempIcon = () => (
	<svg
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='1.5'
		strokeLinecap='round'
		strokeLinejoin='round'
		className='w-4 h-4'>
		<path d='M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z' />
	</svg>
);

const HumidityIcon = () => (
	<svg
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='1.5'
		strokeLinecap='round'
		strokeLinejoin='round'
		className='w-4 h-4'>
		<path d='M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z' />
	</svg>
);

const NoteIcon = () => (
	<svg
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='1.5'
		strokeLinecap='round'
		strokeLinejoin='round'
		className='w-3.5 h-3.5 mt-0.5 shrink-0'>
		<circle
			cx='12'
			cy='12'
			r='10'
		/>
		<line
			x1='12'
			y1='8'
			x2='12'
			y2='12'
		/>
		<line
			x1='12'
			y1='16'
			x2='12.01'
			y2='16'
		/>
	</svg>
);

const GearIcon = () => (
	<svg
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='1.5'
		strokeLinecap='round'
		strokeLinejoin='round'
		className='w-3.5 h-3.5 mt-0.5 shrink-0'>
		<polyline points='9 11 12 14 22 4' />
		<path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' />
	</svg>
);

// ─── Humidity color coding ────────────────────────────────────────────────────

const HUMIDITY_COLOR = {
	"very low": "text-amber-400",
	low: "text-yellow-400",
	"low to moderate": "text-yellow-300",
	moderate: "text-green-400",
	"moderate to high": "text-cyan-400",
	high: "text-blue-400",
	"very high": "text-blue-300",
	extreme: "text-violet-400",
};

// ─── Temperature color coding ────────────────────────────────────────────────

function getTempColor(value, unit) {
	const c = unit === "F" ? ((value - 32) * 5) / 9 : value;
	if (c <= -10) return "text-blue-200";
	if (c <= 0) return "text-blue-300";
	if (c <= 10) return "text-cyan-400";
	if (c <= 20) return "text-green-400";
	if (c <= 30) return "text-yellow-400";
	if (c <= 40) return "text-orange-400";
	return "text-red-400";
}

// ─── Biome accent color ───────────────────────────────────────────────────────

const BIOME_ACCENT = {
	"Rain Forest": {
		border: "border-green-500/30",
		badge: "bg-green-500/10 text-green-400",
		dot: "bg-green-400",
	},
	"Volcanic Rain Forest": {
		border: "border-orange-500/30",
		badge: "bg-orange-500/10 text-orange-400",
		dot: "bg-orange-400",
	},
	"Volcanic Dessert": {
		border: "border-red-500/30",
		badge: "bg-red-500/10 text-red-400",
		dot: "bg-red-400",
	},
	"High Cliffs": {
		border: "border-slate-400/30",
		badge: "bg-slate-400/10 text-slate-300",
		dot: "bg-slate-400",
	},
	"Salt Marsh": {
		border: "border-teal-500/30",
		badge: "bg-teal-500/10 text-teal-400",
		dot: "bg-teal-400",
	},
	"High Thundra": {
		border: "border-blue-400/30",
		badge: "bg-blue-400/10 text-blue-300",
		dot: "bg-blue-300",
	},
	Fjordlands: {
		border: "border-cyan-500/30",
		badge: "bg-cyan-500/10 text-cyan-400",
		dot: "bg-cyan-400",
	},
	"Rain Shadows": {
		border: "border-yellow-600/30",
		badge: "bg-yellow-600/10 text-yellow-500",
		dot: "bg-yellow-500",
	},
	"Mead Lands": {
		border: "border-lime-500/30",
		badge: "bg-lime-500/10 text-lime-400",
		dot: "bg-lime-400",
	},
	"Meadow Lands and Urban City": {
		border: "border-zinc-400/30",
		badge: "bg-zinc-400/10 text-zinc-300",
		dot: "bg-zinc-400",
	},
	"Meadow Lands": {
		border: "border-lime-400/30",
		badge: "bg-lime-400/10 text-lime-300",
		dot: "bg-lime-300",
	},
	"High Thundra and Rain Shadows": {
		border: "border-indigo-400/30",
		badge: "bg-indigo-400/10 text-indigo-300",
		dot: "bg-indigo-300",
	},
	"Rain SHadows": {
		border: "border-yellow-600/30",
		badge: "bg-yellow-600/10 text-yellow-500",
		dot: "bg-yellow-500",
	},
};

const DEFAULT_ACCENT = {
	border: "border-zinc-600/30",
	badge: "bg-zinc-600/10 text-zinc-400",
	dot: "bg-zinc-400",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeatherPanel({ province, provinceKey: provinceKeyProp, userUnit = "C" }) {
	const [unit, setUnit] = useState(userUnit);

	const biomeKey = useMemo(() => {
		if (!province) return null;
		if (typeof province === "string")
			return PROVINCE_BIOMES[province] ?? province;
		return province.biome ?? PROVINCE_BIOMES[province] ?? null;
	}, [province]);

	// Generate both C and F values from the same biome range
	const weatherC = useMemo(() => {
		if (!biomeKey) return null;
		return getProvinceWeather(biomeKey, "C");
	}, [biomeKey]);

	const weatherF = useMemo(() => {
		if (!biomeKey) return null;
		return getProvinceWeather(biomeKey, "F");
	}, [biomeKey]);

	const weather = weatherC; // base data always from C instance

	// Resolve province key — prefer explicit prop, fall back to province string
	const provinceKey = provinceKeyProp ?? (typeof province === "string" ? province : null);

	const restrictions = useMemo(
		() => resolveRestrictions(provinceKey, null),
		[provinceKey],
	);

	const restrictedEntries = useMemo(() => {
		if (!restrictions) return [];
		return Object.entries(restrictions).filter(
			([, v]) => v.status !== STATUS.NOMINAL,
		);
	}, [restrictions]);

	if (!weather) return null;

	const displayTemp =
		unit === "F" ? weatherF?.temperature : weatherC?.temperature;

	const accent = BIOME_ACCENT[weather.biome] ?? DEFAULT_ACCENT;
	const tempColor =
		displayTemp ?
			getTempColor(displayTemp.value, displayTemp.unit)
		:	"text-zinc-400";
	const humidityColor = HUMIDITY_COLOR[weather.humidity] ?? "text-zinc-400";

	return (
		<div
			className={`
        w-full rounded-sm border ${accent.border}
        bg-[#0a0c0e] font-mono text-xs
        divide-y divide-zinc-800/60
      `}
			style={{ fontFamily: "'Courier New', 'Lucida Console', monospace" }}>
			{/* ── Header ── */}
			<div className='flex items-center justify-between px-3 py-2'>
				<div className='flex items-center gap-2'>
					<span
						className={`inline-block w-1.5 h-1.5 rounded-full ${accent.dot}`}
					/>
					<span className='text-zinc-500 uppercase tracking-widest text-[10px]'>
						Pre-Op Conditions
					</span>
				</div>
				<div className='flex items-center gap-2'>
					{/* Unit toggle */}
					<div className='flex items-center border border-zinc-800 rounded-sm overflow-hidden'>
						<button
							onClick={() => setUnit("C")}
							className={[
								"px-2 py-0.5 text-[9px] uppercase tracking-widest transition-all",
								unit === "C" ?
									"bg-zinc-700 text-zinc-200"
								:	"text-zinc-600 hover:text-zinc-400",
							].join(" ")}>
							°C
						</button>
						<button
							onClick={() => setUnit("F")}
							className={[
								"px-2 py-0.5 text-[9px] uppercase tracking-widest transition-all",
								unit === "F" ?
									"bg-zinc-700 text-zinc-200"
								:	"text-zinc-600 hover:text-zinc-400",
							].join(" ")}>
							°F
						</button>
					</div>
					<span
						className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${accent.badge}`}>
						{weather.biome}
					</span>
				</div>
			</div>

			{/* ── Temp + Humidity ── */}
			<div className='grid grid-cols-2 divide-x divide-zinc-800/60'>
				{/* Temperature */}
				<div className='flex flex-col gap-1 px-3 py-2.5'>
					<div className='flex items-center gap-1.5 text-zinc-600'>
						<TempIcon />
						<span className='uppercase tracking-widest text-[9px]'>Temp</span>
					</div>
					<div className={`text-2xl font-bold tracking-tight ${tempColor}`}>
						{displayTemp?.value}°
						<span className='text-sm font-normal text-zinc-500 ml-0.5'>
							{displayTemp?.unit}
						</span>
					</div>
					<div className='text-[9px] text-zinc-600 uppercase tracking-wider'>
						Estimated at insertion
					</div>
				</div>

				{/* Humidity */}
				<div className='flex flex-col gap-1 px-3 py-2.5'>
					<div className='flex items-center gap-1.5 text-zinc-600'>
						<HumidityIcon />
						<span className='uppercase tracking-widest text-[9px]'>
							Humidity
						</span>
					</div>
					<div
						className={`text-lg font-semibold tracking-tight capitalize ${humidityColor}`}>
						{weather.humidity}
					</div>
					<div className='text-[9px] text-zinc-600 uppercase tracking-wider'>
						Ambient moisture level
					</div>
				</div>
			</div>

			{/* ── Operational Notes ── */}
			<div className='px-3 py-2.5 space-y-1.5'>
				<div className='text-[9px] text-zinc-600 uppercase tracking-widest mb-2'>
					Operational Notes
				</div>
				{weather.operationalNotes.map((note, i) => (
					<div
						key={i}
						className='flex items-start gap-2 text-zinc-400 leading-relaxed'>
						<NoteIcon />
						<span>{note}</span>
					</div>
				))}
			</div>

			{/* ── Gear Hints ── */}
			<div className='px-3 py-2.5 space-y-1.5'>
				<div className='text-[9px] text-zinc-600 uppercase tracking-widest mb-2'>
					Gear Considerations
				</div>
				{weather.gearHints.map((hint, i) => (
					<div
						key={i}
						className='flex items-start gap-2 text-zinc-500 leading-relaxed'>
						<GearIcon />
						<span>{hint}</span>
					</div>
				))}
			</div>

			{/* ── Asset Restrictions ── */}
			{restrictedEntries.length > 0 && (
				<div className='px-3 py-2.5 space-y-1.5'>
					<div className='text-[9px] text-zinc-600 uppercase tracking-widest mb-2'>
						Asset Restrictions
					</div>
					{restrictedEntries.map(([key, entry]) => (
						<div
							key={key}
							className='flex items-center justify-between gap-2'>
							<span className='text-zinc-500 text-[10px] uppercase tracking-wider'>
								{RESTRICTION_LABELS[key] ?? key}
							</span>
							<span
								className={[
									"text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm font-semibold",
									entry.status === STATUS.DENIED ?
										"bg-red-500/10 text-red-400"
									:	"bg-amber-500/10 text-amber-400",
								].join(" ")}>
								{entry.status}
							</span>
						</div>
					))}
				</div>
			)}

			{/* ── Footer ── */}
			<div className='px-3 py-1.5 flex items-center justify-between'>
				<span className='text-[9px] text-zinc-700 uppercase tracking-widest'>
					Biome-derived estimate
				</span>
				<span className='text-[9px] text-zinc-700 uppercase tracking-widest'>
					Verify in-field
				</span>
			</div>
		</div>
	);
}
WeatherPanel.propTypes = {
	province: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
	provinceKey: PropTypes.string,
	userUnit: PropTypes.oneOf(["C", "F"]),
};
