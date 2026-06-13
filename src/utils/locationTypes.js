// Shared location-type classification for AO Intel Map markers and AO Briefing page.

export const LOC_TYPE_CONFIG = {
	sam:        { color: "#ef4444", bg: "rgba(239,68,68,0.20)",   label: "SAM",  symbol: "⚠", size: 28 },
	aa:         { color: "#ef4444", bg: "rgba(239,68,68,0.18)",   label: "AA",   symbol: "⊗", size: 26 },
	base:       { color: "#dc2626", bg: "rgba(220,38,38,0.20)",   label: "BASE", symbol: "★", size: 28 },
	camp:       { color: "#f97316", bg: "rgba(249,115,22,0.18)",  label: "CAMP", symbol: "■", size: 26 },
	outpost:    { color: "#fb923c", bg: "rgba(251,146,60,0.16)",  label: "OPST", symbol: "◆", size: 24 },
	checkpoint: { color: "#fbbf24", bg: "rgba(251,191,36,0.15)",  label: "CKPT", symbol: "◇", size: 22 },
	port:       { color: "#60a5fa", bg: "rgba(96,165,250,0.16)",  label: "PORT", symbol: "⚓", size: 24 },
	airfield:   { color: "#fde68a", bg: "rgba(253,230,138,0.14)", label: "ARFL", symbol: "✈", size: 24 },
	control:    { color: "#a78bfa", bg: "rgba(167,139,250,0.16)", label: "CTRL", symbol: "◉", size: 22 },
	facility:   { color: "#818cf8", bg: "rgba(129,140,248,0.14)", label: "FAC",  symbol: "◈", size: 22 },
	bunker:     { color: "#6b7280", bg: "rgba(107,114,128,0.14)", label: "BNK",  symbol: "▬", size: 20 },
	gate:       { color: "#9ca3af", bg: "rgba(156,163,175,0.12)", label: "GATE", symbol: "□", size: 20 },
	radar:      { color: "#22d3ee", bg: "rgba(34,211,238,0.14)",  label: "RAD",  symbol: "◎", size: 22 },
	depot:      { color: "#86efac", bg: "rgba(134,239,172,0.12)", label: "DPT",  symbol: "▪", size: 20 },
	poi:        { color: "#7caa79", bg: "rgba(124,170,121,0.12)", label: "POI",  symbol: "●", size: 18 },
};

export const getLocationType = (name) => {
	const n = name.toLowerCase();
	if (/sam site|surface.to.air/.test(n))       return "sam";
	if (/anti.aircraft|anti aircraft/.test(n))   return "aa";
	if (/naval base/.test(n))                    return "base";
	if (/\bcamp\b/.test(n))                      return "camp";
	if (/\boutpost\b/.test(n))                   return "outpost";
	if (/checkpoint/.test(n))                    return "checkpoint";
	if (/drone station|control station/.test(n)) return "control";
	if (/assembly hall/.test(n))                 return "facility";
	if (/\bbunker\b/.test(n))                    return "bunker";
	if (/\bgate\b/.test(n))                      return "gate";
	if (/radar/.test(n))                         return "radar";
	if (/depot|storage|ammunition/.test(n))      return "depot";
	if (/\bport\b|\bharbor\b/.test(n))           return "port";
	if (/airfield|airport/.test(n))              return "airfield";
	if (/\bbase\b/.test(n))                      return "base";
	return "poi";
};

// ─── Province-location faction/type config (used by AOBriefingPage map) ──────

export const PROVINCE_LOC_CONFIG = {
	wolves:     { color: "#ef4444", bg: "rgba(239,68,68,0.22)",     label: "WOLVES",   symbol: "▲", size: 26 },
	sentinel:   { color: "#a78bfa", bg: "rgba(167,139,250,0.22)",   label: "SENTINEL", symbol: "■", size: 24 },
	skell:      { color: "#22d3ee", bg: "rgba(34,211,238,0.18)",    label: "SKELL",    symbol: "◈", size: 22 },
	sam:        { color: "#ef4444", bg: "rgba(239,68,68,0.20)",     label: "SAM",      symbol: "⚠", size: 26 },
	port:       { color: "#60a5fa", bg: "rgba(96,165,250,0.18)",    label: "PORT",     symbol: "⚓", size: 22 },
	ancient:    { color: "#9ca3af", bg: "rgba(156,163,175,0.16)",   label: "RUINS",    symbol: "◎", size: 22 },
	checkpoint: { color: "#fbbf24", bg: "rgba(251,191,36,0.16)",    label: "CKPT",     symbol: "◇", size: 20 },
	factory:    { color: "#86efac", bg: "rgba(134,239,172,0.16)",   label: "FCTRY",    symbol: "▬", size: 22 },
	airfield:   { color: "#fde68a", bg: "rgba(253,230,138,0.16)",   label: "AIRF",     symbol: "✈", size: 24 },
	research:   { color: "#818cf8", bg: "rgba(129,140,248,0.18)",   label: "R&D",      symbol: "◉", size: 22 },
	depot:      { color: "#6b7280", bg: "rgba(107,114,128,0.16)",   label: "DEPOT",    symbol: "▪", size: 20 },
	mine:       { color: "#4ade80", bg: "rgba(74,222,128,0.16)",    label: "MINE",     symbol: "◆", size: 22 },
	wind:       { color: "#38bdf8", bg: "rgba(56,189,248,0.14)",    label: "ENERGY",   symbol: "○", size: 20 },
	outpost:    { color: "#fb923c", bg: "rgba(251,146,60,0.18)",    label: "OUTPOST",  symbol: "◆", size: 22 },
	poi:        { color: "#7caa79", bg: "rgba(124,170,121,0.14)",   label: "POI",      symbol: "●", size: 18 },
};

// Classify a province location by name + description (faction-aware).
export const getProvinceLocType = (name = "", description = "") => {
	const n = name.toLowerCase();
	const d = description.toLowerCase();

	if (/sam site|sam launcher/.test(n))                    return "sam";
	if (/checkpoint/.test(n))                               return "checkpoint";
	if (/\bport\b|\bharbor\b/.test(n))                     return "port";
	if (/heliport|airfield/.test(n))                        return "airfield";
	if (/ancient|sanctuary|cemetery|fortress|ruins/.test(n)) return "ancient";
	if (/\bmine\b/.test(n))                                 return "mine";
	if (/depot|storage/.test(n))                            return "depot";
	if (/factory|refinery|workshop|pipeline/.test(n))       return "factory";
	if (/wind farm/.test(n))                                return "wind";
	if (/testing zone|r&d|experimental center/.test(n))     return "research";

	// Faction from description (checked before generic name patterns)
	if (/\bwolf\b|\bwolves\b/.test(d))                     return "wolves";
	if (/\bsentinel\b/.test(d))                             return "sentinel";
	if (/\bskell\b/.test(n) || /\bskell\b/.test(d))        return "skell";
	if (/\bpmc\b/.test(d))                                  return "sentinel";

	// Generic name patterns as fallback
	if (/\bcamp\b/.test(n))                                 return "wolves";
	if (/\boutpost\b/.test(n))                              return "outpost";

	return "poi";
};

export const ENEMY_TIER_WEIGHT = {
	sam: 4, aa: 4, base: 4, camp: 3, outpost: 2,
	control: 2, radar: 2, bunker: 2,
	checkpoint: 1, facility: 1, port: 1,
	airfield: 1, depot: 1, gate: 1, poi: 1,
};
