// utils/buildProvinceContext.js

export function buildProvinceContext(provinceKey, provinces) {
	const province = provinces[provinceKey];
	if (!province) return "";

	const locationLines = province.locations
		.map((loc) => `  - ${loc.name}: ${loc.description}`)
		.join("\n");

	return `PROVINCE: ${provinceKey}
BIOME: ${province.biome}
LOCATIONS:
${locationLines}`;
}
