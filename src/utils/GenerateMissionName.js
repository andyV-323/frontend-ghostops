// ─────────────────────────────────────────────────────────────────
// generateMissionName.js
// Zero dependencies. Call generateMissionName() to get a random
// two-word military operation name.
// ─────────────────────────────────────────────────────────────────

// ── Word banks ────────────────────────────────────────────────────
// Adjectives — military/tactical flavour, themed around Ghost Recon
const ADJECTIVES = [
	// Darkness / stealth
	"SILENT",
	"SHADOW",
	"PHANTOM",
	"GHOST",
	"HOLLOW",
	"DARK",
	"BLIND",
	"BURIED",
	"OBSCURED",
	"COVERT",
	"VEILED",
	"CLOAKED",
	"SUNKEN",
	"FADED",
	"MUTED",

	// Aggression / force
	"IRON",
	"STEEL",
	"STONE",
	"HARD",
	"BRUTAL",
	"SAVAGE",
	"LETHAL",
	"BROKEN",
	"SHATTERED",
	"FRACTURED",
	"RAZORED",
	"BLUNT",
	"JAGGED",
	"SCARRED",
	"SCORCHED",

	// Cold / isolation
	"FROZEN",
	"ARCTIC",
	"CRIMSON",
	"ASHEN",
	"PALE",
	"GREY",
	"BARREN",
	"HOLLOW",
	"COLD",
	"DEAD",
	"DISTANT",
	"LOST",
	"FALLEN",
	"FORSAKEN",
	"SEVERED",

	// Urgency / precision
	"SWIFT",
	"SHARP",
	"CLEAN",
	"PRECISE",
	"FINAL",
	"RAPID",
	"SILENT",
	"NARROW",
	"DIRECT",
	"CERTAIN",
	"ABSOLUTE",
	"TERMINAL",
	"CRITICAL",
	"URGENT",
	"LAST",

	// Environment / terrain (Ghost Recon biome flavour)
	"JUNGLE",
	"ALPINE",
	"COASTAL",
	"HIGHLAND",
	"LOWLAND",
	"DEEP",
	"WIDE",
	"OPEN",
	"REMOTE",
	"RUGGED",
];

// Nouns — operational / tactical objects and concepts
const NOUNS = [
	// Weapons / tools
	"ANVIL",
	"BLADE",
	"LANCE",
	"HAMMER",
	"BOLT",
	"ARROW",
	"SPIKE",
	"CHAIN",
	"TRIGGER",
	"ROUND",
	"BARREL",
	"BREACH",
	"FUSE",
	"CHARGE",
	"RAIL",

	// Terrain / geography
	"RIDGE",
	"VALLEY",
	"SUMMIT",
	"CANYON",
	"CRATER",
	"MESA",
	"DELTA",
	"GLACIER",
	"HOLLOW",
	"SHORE",
	"DUNE",
	"MARSH",
	"CLIFF",
	"BASIN",
	"PLATEAU",

	// Military structures / concepts
	"SENTINEL",
	"FORTRESS",
	"BUNKER",
	"OUTPOST",
	"PERIMETER",
	"SECTOR",
	"VECTOR",
	"AXIS",
	"CORRIDOR",
	"FLANK",
	"SALIENT",
	"BRIDGEHEAD",
	"FIREBASE",
	"OVERWATCH",
	"FOXHOLE",

	// Symbolic / code-word style
	"VEIL",
	"SHROUD",
	"SPECTRE",
	"WRAITH",
	"REAPER",
	"TEMPEST",
	"SERPENT",
	"FALCON",
	"RAVEN",
	"WOLF",
	"DAGGER",
	"CROWN",
	"THRONE",
	"MANTLE",
	"SIGIL",

	// Abstract / mission flavour
	"PROTOCOL",
	"DOCTRINE",
	"MANDATE",
	"DECREE",
	"VERDICT",
	"ACCORD",
	"CIPHER",
	"SIGNAL",
	"ECHO",
	"STATIC",
];

// ── Core generator ────────────────────────────────────────────────

/**
 * Pick a random element from an array.
 * @param {string[]} arr
 * @returns {string}
 */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Generate a random military operation name.
 * Returns a string in the format "OPERATION [ADJECTIVE] [NOUN]".
 *
 * @param {{ prefix?: boolean }} options
 *   prefix — include "OPERATION" prefix (default: true)
 * @returns {string}
 *
 * @example
 * generateMissionName()          // "OPERATION IRON VEIL"
 * generateMissionName({ prefix: false })  // "IRON VEIL"
 */
export function generateMissionName({ prefix = true } = {}) {
	// Keep regenerating if adjective and noun happen to be the same word
	// (both word banks share a few words like "HOLLOW")
	let adj, noun;
	do {
		adj = pick(ADJECTIVES);
		noun = pick(NOUNS);
	} while (adj === noun);

	return prefix ? `OPERATION ${adj} ${noun}` : `${adj} ${noun}`;
}

/**
 * Generate N unique mission names.
 * Useful for offering the user a choice of names on mission creation.
 *
 * @param {number} count   How many names to generate (default: 3)
 * @param {boolean} prefix Include "OPERATION" prefix (default: true)
 * @returns {string[]}
 *
 * @example
 * generateMissionNames(3)
 * // ["OPERATION IRON VEIL", "OPERATION GHOST RIDGE", "OPERATION SILENT ANVIL"]
 */
export function generateMissionNames(count = 3, prefix = true) {
	const names = new Set();
	// Safety cap — avoid infinite loop if count is absurdly large
	const maxAttempts = count * 20;
	let attempts = 0;

	while (names.size < count && attempts < maxAttempts) {
		names.add(generateMissionName({ prefix }));
		attempts++;
	}

	return [...names];
}

export default generateMissionName;
