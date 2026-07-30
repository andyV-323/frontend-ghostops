import LZString from "lz-string";
import { migrate, defaultMission } from "./missionSchema";

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function deepEqual(a, b) {
	if (a === b) return true;
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
	}
	if (isPlainObject(a) && isPlainObject(b)) {
		const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
		for (const k of keys) if (!deepEqual(a[k], b[k])) return false;
		return true;
	}
	return false;
}

const SAME = Symbol("same");

// Drops values that match their schema default, since migrate() already
// merges partial data back onto defaultMission() (including per-item, via
// each leg/base/objective's own `{...defaultX(), ...item}` merge) — so a
// mission that's mostly default-valued encodes to a much smaller payload
// without losing anything on decode.
function reduce(value, def) {
	if (value === def) return SAME;
	if (deepEqual(value, def)) return SAME;
	if (Array.isArray(value) && Array.isArray(def)) {
		const template = def[0];
		return value.map((item) => {
			const r = reduce(item, template);
			return r === SAME ? {} : r;
		});
	}
	if (isPlainObject(value) && isPlainObject(def)) {
		const out = {};
		for (const key of Object.keys(value)) {
			const r = reduce(value[key], def[key]);
			if (r !== SAME) out[key] = r;
		}
		return out;
	}
	return value;
}

export function encodeMission(mission) {
	const reduced = reduce(mission, defaultMission());
	const payload = reduced === SAME ? {} : reduced;
	return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeMission(hashOrRaw) {
	if (!hashOrRaw) return null;
	const raw = hashOrRaw.startsWith("#") ? hashOrRaw.slice(1) : hashOrRaw;
	try {
		const str = LZString.decompressFromEncodedURIComponent(raw);
		if (!str) return null;
		return migrate(JSON.parse(str));
	} catch {
		return null;
	}
}
