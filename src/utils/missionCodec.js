import LZString from "lz-string";
import { migrate } from "./missionSchema";

export function encodeMission(mission) {
	return LZString.compressToEncodedURIComponent(JSON.stringify(mission));
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
