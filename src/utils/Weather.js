import { BIOME_WEATHER } from "@/config";

// Returns a random temperature within the biome range.
// userUnit: 'C' or 'F'
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
// Higher weight = more likely. Returns condition string or null.
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
// Temperature and atmosphere are randomized within the biome profile on each call.
export function getProvinceWeather(province, userUnit = "C") {
	const biome = typeof province === "string" ? province : province?.biome;
	if (!biome) return null;

	const config = BIOME_WEATHER[biome];
	if (!config) return null;

	const temperature = selectTemperature(biome, userUnit);
	const atmosphere = selectAtmosphere(biome);

	return {
		biome,
		temperature,
		atmosphere,
		humidity: config.humidity,
		operationalNotes: config.operationalNotes,
		gearHints: config.gearHints,
	};
}
