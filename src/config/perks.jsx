// Maps perk names to restriction keys. Populate as needed.
export const PERK_RESTRICTION_KEYS = {};

export const PERKS = [
	{
		name: "Pack Mule",
		icon: "/icons/packMule.svg",
		description: "+40% Maximum Ammo, +10% Ammo Pick Up",
		type: "Endurance",
	},
	{
		name: "Pistolero",
		icon: "/icons/pistolero.svg",
		description:
			"While using a handgun, +20% Damage, -20% Technique Cooldown, +40% XP Bonus",
		type: "Weapons",
	},
	{
		name: "Close and Personal",
		icon: "/icons/closeAndPersonal.svg",
		description: "+15% Reload Speed, +10 Mobility",
		type: "Weapons",
	},
	{
		name: "Explosive Expert",
		icon: "/icons/explosiveExpert.svg",
		description:
			"+20% Items Area of Effect, +20% Explosive Damage, +60% Throw Range",
		type: "Demolitions",
	},
	{
		name: "Sixth Sense",
		icon: "/icons/sixthSense.svg",
		description:
			"+25m Automatic Marking (Mark all enemies in range. Cannot be used in Ghost War)",
		type: "Reconnaissance",
	},
	{
		name: "Sensor Hack",
		icon: "/icons/sensorHack.svg",
		description: "+30% Drone Evasion, +10% Damage to Drones",
		type: "Reconnaissance",
	},
	{
		name: "Slim Shadow",
		icon: "/icons/slimShadow.svg",
		description: "+80% Stealth, +10% Agility",
		type: "Reconnaissance",
	},
	{
		name: "Burst Forth",
		icon: "/icons/burstForth.svg",
		description: "+10% Movement Speed, +50% Stamina Regen Speed",
		type: "Endurance",
	},
	{
		name: "Recon Mastery",
		icon: "/icons/reconMastery.svg",
		description:
			"For every enemy marked with your drone: -15% Technique Cooldown, +50 XP Gain",
		type: "Reconnaissance",
	},
	{
		name: "Adrenaline",
		icon: "/icons/adrenaline.svg",
		description:
			"After a CQC kill, Health Restore, +20% Reload Speed and +40% Accuracy.",
		type: "Combat",
	},
	{
		name: "Guerilla",
		icon: "/icons/guerilla.svg",
		description:
			"For every hit with the shotgun, +10% Damage Resistance and +20% Health Regen Speed.",
		type: "Combat",
	},
	{
		name: "Cold Blooded",
		icon: "/icons/coldBlooded.svg",
		description: "-30% Health Regen Delay, +100% Health Regen Speed",
		type: "Combat",
	},
	{
		name: "Feel No Pain",
		icon: "/icons/feelNoPain.svg",
		description: "Relentless, +50% Injury Resistance",
		type: "Combat",
	},
	{
		name: "Revivalist",
		icon: "/icons/revivalist.svg",
		description: "+20% Movement Speed, +40 Damage Resistance",
		type: "Support",
	},
	{
		name: "Inspired",
		icon: "/icons/inspired.svg",
		description:
			"For every kill by an ally, instantly heal back some of your health.",
		type: "Support",
	},
	{
		name: "Drone Hunter",
		icon: "/icons/droneHunter.svg",
		description:
			"After destroying a drone, instantly heal back some of your health (Applies to you and teammates).",
		type: "Support",
	},
	{
		name: "Ballistic Advantage",
		icon: "/icons/ballisticAdvantage.svg",
		description: "+60 Range, +30 Handling",
		type: "Weapons",
	},
	{
		name: "Rolling Thunder",
		icon: "/icons/rollingThunder.svg",
		description: "+20% Weapon Damage, +20% Damage To Drones",
		type: "Weapons",
	},
	{
		name: "Gunslinger",
		icon: "/icons/gunslinger.svg",
		description: "+15 Accuracy, +15 Handling",
		type: "Weapons",
	},
];

// Lookup map: perkName → { name, icon, description, type }
export const PERKS_MAP = Object.fromEntries(PERKS.map((p) => [p.name, p]));
