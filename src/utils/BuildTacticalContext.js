// utils/BuildTacticalContext.js
// Assembles deterministic tactical context for the AIAdvisor Groq prompt.
// Computes biome→camo, weather→detection modifier, terrain→infil methods,
// and province restriction data so Groq synthesises rather than invents.

import { PROVINCE_TERRAIN, PROVINCE_RESTRICTIONS } from "@/config";

// ── Biome → camo recommendation ───────────────────────────────────────────────

const BIOME_CAMO = {
	"Volcanic Rain Forest":          "ash-grey / volcanic camouflage",
	"Volcanic Dessert":              "ash-grey / volcanic camouflage",
	"Rain Forest":                   "woodland green / olive",
	"Rain Shadows":                  "woodland green / olive",
	"Salt Marsh":                    "swamp / dark earth camouflage",
	"High Thundra":                  "white / alpine snow camouflage",
	"High Thundra and Rain Shadows": "white / alpine with grey blend",
	Fjordlands:                      "grey / rocky coastal camouflage",
	"High Cliffs":                   "grey / rocky terrain camouflage",
	"Meadow Lands and Urban City":   "grey / urban camouflage",
	"Meadow Lands":                  "woodland green / olive",
	"Mead Lands":                    "woodland green / olive",
};

function getBiomeCamo(biome) {
	return BIOME_CAMO[biome] ?? "woodland green / olive";
}

// ── Weather → detection modifier ─────────────────────────────────────────────

function getDetectionModifier(atmosphere) {
	switch (atmosphere) {
		case "storm":
			return "HEAVILY REDUCED — storm degrades all enemy sensors; NVG asymmetry maximized";
		case "precipitation":
			return "REDUCED — rain degrades optical sensors and audio detection range";
		case "overcast":
			return "SLIGHTLY REDUCED — overcast limits drone optics; daytime movement less exposed";
		case "sunshine":
			return "INCREASED — full sun activates all sensors at maximum; avoid open ground";
		case "cloudless":
			return "INCREASED — clear sky maximizes Azrael drone optics and sensor ring";
		default:
			return "STANDARD — no significant weather modifier";
	}
}

// ── Biome + terrain → viable infil methods ────────────────────────────────────

function getViableInfilMethods(biome, terrain) {
	const b = biome?.toLowerCase() ?? "";
	const methods = [];

	const isHighAlt =
		b.includes("cliff") ||
		b.includes("mountain") ||
		b.includes("thundra") ||
		b.includes("fjord");
	const isDense =
		b.includes("rain") ||
		b.includes("forest") ||
		b.includes("fen") ||
		b.includes("marsh") ||
		b.includes("salt") ||
		b.includes("bog");
	const isOpen =
		b.includes("meadow") ||
		b.includes("mead") ||
		b.includes("shadows") ||
		b.includes("dessert");

	if (isHighAlt) {
		methods.push("HAHO (preferred — altitude favors long standoff glide past drone ring)");
	}
	methods.push("HALO (fast vertical drop near target)");
	methods.push("HAHO (standoff glide — land outside drone sensor ring and move in)");
	if (isDense) {
		methods.push("on_foot (dense vegetation provides natural concealment)");
	}
	if (terrain?.hasCoast) {
		methods.push("aquatic (maritime approach — avoid Azrael coverage from sea)");
	}
	if (isOpen && !isDense) {
		methods.push(
			"vehicle (NOTE: open ground penalizes vehicles — Azrael drones detect movement signatures)",
		);
	}
	methods.push("helo_insertion (helicopter insert — noise signature, plan alert suppression)");
	methods.push("helo_landing_open_field (chopper sets down in open LZ — NOT fast-rope, which does not exist in GRB)");

	return methods.join("; ");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildTacticalContext({
	province,
	provinceData,
	locations,
	weather,
	opType,
	opTypeDef,
}) {
	const biome       = provinceData.biome;
	const terrain     = PROVINCE_TERRAIN?.[province] ?? null;
	const restrictions = PROVINCE_RESTRICTIONS?.[province] ?? null;

	const camo       = getBiomeCamo(biome);
	const detection  = getDetectionModifier(weather?.atmosphere);
	const infilMethods = getViableInfilMethods(biome, terrain);

	const locationLines =
		locations.filter(Boolean).length > 0
			? locations
					.filter(Boolean)
					.map((n) => {
						const loc = provinceData.locations.find((l) => l.name === n);
						return loc ? `  - ${loc.name}: ${loc.description}` : `  - ${n}`;
					})
					.join("\n")
			: "  (AO-level — specific objective not yet confirmed; plan for area sweep)";

	const coastAccess =
		terrain?.hasCoast
			? `Yes — ${(terrain.coastZones ?? []).map((z) => z.label).join(", ")}`
			: "No coastal access.";
	const roadNet     = terrain?.hasRoads ? "Present" : "None — vehicle movement restricted.";
	const restrictNotes =
		restrictions?.terrain?.description ?? "No documented terrain restrictions.";
	const activeThreats =
		(restrictions?.threats ?? []).map((t) => t.name).filter(Boolean).join(", ") ||
		"None documented";

	const weatherLine = weather
		? `${weather.atmosphere ?? "unknown"} | ${weather.temperature?.value ?? "?"}°${weather.temperature?.unit ?? "C"} | Humidity: ${weather.humidity ?? "unknown"}`
		: "No weather data.";

	return `PROVINCE: ${province}
BIOME: ${biome}
OP TYPE: ${opTypeDef.label} (${opType})

OPERATIONAL OBJECTIVES:
${locationLines}

WEATHER:
  Conditions: ${weatherLine}
  Detection Impact: ${detection}

TERRAIN (OAKOC):
  Notes: ${terrain?.notes ?? "No detailed terrain data."}
  Coastal Access: ${coastAccess}
  Road Network: ${roadNet}
  Island Province: ${terrain?.isIsland ? "Yes" : "No"}

CAMO RECOMMENDATION: ${camo}

VIABLE INFIL METHODS (game-accurate):
  ${infilMethods}

OPERATIONAL RESTRICTIONS:
  Terrain: ${restrictNotes}
  Active Province Threats: ${activeThreats}`;
}
