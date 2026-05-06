import { BIOME_WEATHER } from "@/config";

// Returns a random temperature within the biome range.
export function selectTemperature(biome, userUnit = "C") {
	const config = BIOME_WEATHER[biome];
	if (!config) return null;

	const { min, max, fahrenheit } = config.tempRange;

	if (userUnit === "F") {
		const temp = Math.round(
			fahrenheit.min + Math.random() * (fahrenheit.max - fahrenheit.min),
		);
		return { value: temp, unit: "F" };
	}

	const temp = Math.round(min + Math.random() * (max - min));
	return { value: temp, unit: "C" };
}

// Picks a weighted-random atmosphere condition from the biome's pool.
export function selectAtmosphere(biome) {
	const config = BIOME_WEATHER[biome];
	if (!config?.atmosphere?.length) return null;

	const total = config.atmosphere.reduce((sum, a) => sum + a.weight, 0);
	let r = Math.random() * total;
	for (const a of config.atmosphere) {
		r -= a.weight;
		if (r <= 0) return a.condition;
	}
	return config.atmosphere[config.atmosphere.length - 1].condition;
}

// Returns a pre-op conditions brief for a province.
// Base notes and gear are always included; atmosphere-specific entries are
// appended so the brief reflects the exact conditions at insertion time.
export function getProvinceWeather(province, userUnit = "C") {
	const biome = typeof province === "string" ? province : province?.biome;
	if (!biome) return null;

	const config = BIOME_WEATHER[biome];
	if (!config) return null;

	const temperature = selectTemperature(biome, userUnit);
	const atmosphere = selectAtmosphere(biome);

	const atmosphereNotes = atmosphere ? (config.atmosphereNotes?.[atmosphere] ?? []) : [];
	const atmosphereGear  = atmosphere ? (config.atmosphereGear?.[atmosphere]  ?? []) : [];

	return {
		biome,
		temperature,
		atmosphere,
		humidity: config.humidity,
		operationalNotes: [...config.operationalNotes, ...atmosphereNotes],
		gearHints:        [...config.gearHints,        ...atmosphereGear],
	};
}
