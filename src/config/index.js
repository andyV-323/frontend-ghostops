import { about } from "./about";
import { features } from "./features";
import { PROVINCES } from "./provinces";
import { ghostID } from "./ghostID";
import { INJURIES } from "./injuries";
import { TEAMS } from "./teams";
import { KITS } from "./kits";
import { CLASS } from "./classNames";
import { WEAPON_TYPES, WEAPONS_BY_TYPE, ATTACHMENTS, MISSION_PROFILES, WEAPON_COMPATIBILITY } from "./weapons";
import { GARAGE } from "./garage";
import { CONDITION } from "./vehicleCondition";
import { ITEMS, ITEM_RESTRICTION_KEYS } from "./items";
import { PERKS, PERK_RESTRICTION_KEYS } from "./perks";
import { BIOME_WEATHER } from "./biome";
import { PROVINCE_BIOMES } from "./provinceBiomes";
import { PROVINCE_TERRAIN } from "./provinceTerrain";
import { PROVINCE_RESTRICTIONS } from "./provinceRestrictions";
import { STATUS, SOURCE } from "../utils/Restrictions";

// WEAPONS is kept as an alias for WEAPON_TYPES so existing imports don't break
const WEAPONS = WEAPON_TYPES;

export {
	about,
	features,
	PROVINCES,
	ghostID,
	INJURIES,
	TEAMS,
	KITS,
	CLASS,
	WEAPONS,
	WEAPON_TYPES,
	WEAPONS_BY_TYPE,
	ATTACHMENTS,
	MISSION_PROFILES,
	WEAPON_COMPATIBILITY,
	GARAGE,
	CONDITION,
	ITEMS,
	ITEM_RESTRICTION_KEYS,
	PERKS,
	PERK_RESTRICTION_KEYS,
	BIOME_WEATHER,
	PROVINCE_BIOMES,
	PROVINCE_TERRAIN,
	PROVINCE_RESTRICTIONS,
	SOURCE,
	STATUS,
};
