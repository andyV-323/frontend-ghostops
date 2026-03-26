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

// Returns a pre-op conditions brief for a province.
// Temperature is randomized within the biome range on each call.
// Pass the province object or the biome string directly.
export function getProvinceWeather(province, userUnit = "C") {
	const biome = typeof province === "string" ? province : province?.biome;
	if (!biome) return null;

	const config = BIOME_WEATHER[biome];
	if (!config) return null;

	const temperature = selectTemperature(biome, userUnit);

	return {
		biome,
		temperature,
		humidity: config.humidity,
		operationalNotes: config.operationalNotes,
		gearHints: config.gearHints,
	};
}
