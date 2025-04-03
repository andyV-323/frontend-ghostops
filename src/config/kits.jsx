export const KITS = {
	BREACHER: {
		name: "Breacher",
		class: ["Assault"],
		img: "/icons/Breacher.svg",
		perk: "Guerrilla",
		description: "For every hit with the shotgun:",
		perk1: "Damage Resistance",
		percentage1: "+10%",
		perk2: "Health Regen Speed",
		percentage2: "+20%",
		perk3: null,
		percentage3: null,
	},

	CBRN: {
		name: "Chemical Defense Specialist",
		class: ["Engineer"],
		img: "/icons/CBRN.svg",
		perk: "Cold Blooded",
		description: null,
		perk1: "Health Regen Delay",
		percentage1: "-30%",
		perk2: "Health Regen Speed",
		percentage2: "+100%",
		perk3: null,
		percentage3: null,
	},
	COMMS: {
		name: "Field Communications Engineer",
		class: ["Engineer"],
		img: "/icons/Comms.svg",
		perk: "Sixth Sense",
		description: null,
		perk1: "Automatic Marking",
		percentage1: "+25m",
		perk2: null,
		percentage2: null,
		perk3: null,
		percentage3: null,
	},
	EW: {
		name: "Electronic Warfare Operator",
		class: ["Echelon"],
		img: "/icons/Cyber2.svg",
		perk: "Drone Hunter",
		description:
			"After destroying a drone, instantly heal back some of your health.",
		perk1: null,
		percentage1: null,
		perk2: null,
		percentage2: null,
		perk3: null,
		percentage3: null,
	},

	EW2: {
		name: "Cyber Operations Specialist",
		class: ["Echelon"],
		img: "/icons/Cyber.svg",

		perk: "Slime Shadow",
		description: null,
		perk1: "Stealth",
		percentage1: "+80%",
		perk2: "Agility",
		percentage2: "+10%",
		perk3: null,
		percentage3: null,
	},
	LEAD: {
		name: "Team Leader",
		class: ["Assault"],
		img: "/icons/default.svg",
		perk: "Inspired",
		description:
			"For every kill by an ally, instantly heal back some of your health.",
		perk1: null,
		percentage1: null,
		perk2: null,
		percentage2: null,
		perk3: null,
		percentage3: null,
	},
	LEAD2: {
		name: "Logistics Coordinator",
		class: ["Engineer"],
		img: "/icons/default.svg",
		perk: "Pack Mule",
		description: null,
		perk1: "Maximum Ammo",
		percentage1: "+40%",
		perk2: "Ammo Pick Up",
		percentage2: "+10%",
		perk3: null,
		percentage3: null,
	},
	LEAD3: {
		name: "Reconnaissance Team Leader",
		class: ["Echelon"],
		img: "/icons/default.svg",
		perk: "Sixth Sense",
		description: null,
		perk1: "Automatic Marking",
		percentage1: "+25m",
		perk2: null,
		percentage2: null,
		perk3: null,
		percentage3: null,
	},
	LEAD4: {
		name: "Special Operations Team Leader",
		class: ["Panther"],
		img: "/icons/default.svg",
		perk: "Close and Personal",
		description: null,
		perk1: "Reload Speed",
		percentage1: "+15%",
		perk2: "Mobility",
		percentage2: "+10%",
		perk3: null,
		percentage3: null,
	},
	LEAD5: {
		name: "Reconnaissance Drone Operator",
		class: ["Pathfinder"],
		img: "/icons/default.svg",
		perk: "Recon Mastery",
		description: "For every enemy marked with your drone:",
		perk1: "Technique Cool-down",
		percentage1: "-15%",
		perk2: "XP Gain",
		percentage2: "+50",
		perk3: null,
		percentage3: null,
	},
	LEAD6: {
		name: "Combat Medic Leader",
		class: ["Medic"],
		img: "/icons/default.svg",
		perk: "Revivalist",
		description: null,
		perk1: "Movement Speed",
		percentage1: "+20%",
		perk2: "Damage Resistance",
		percentage2: "+40%",
		perk3: null,
		percentage3: null,
	},
	LEAD7: {
		name: "Sniper Team Leader",
		class: ["Sharpshooter"],
		img: "/icons/default.svg",
		perk: "Ballistic Advantage",
		description: null,
		perk1: "Range",
		percentage1: "+60%",
		perk2: "Handling",
		percentage2: "+30%",
		perk3: null,
		percentage3: null,
	},
	CE: {
		name: "Demolition Engineer",
		class: ["Engineer"],
		img: "/icons/Demo.svg",
		perk: "Explosive Expert",
		description: null,
		perk1: "Items Area of Effect",
		percentage1: "+20%",
		perk2: "Explosive Damage",
		percentage2: "+20%",
		perk3: "Throw Range",
		percentage3: "+60%",
	},
	DRONE: {
		name: "Tactical Unmanned Aircraft System Operator",
		class: ["Engineer"],
		img: "/icons/Drone.svg",
		perk: "Sensor Hack",
		description: null,
		perk1: "Drone Evasion",
		percentage1: "+30%",
		perk2: "Damage to drones",
		percentage2: "+10%",
		perk3: null,
		percentage3: null,
	},
	EOD: {
		name: "Explosive Ordnance Specialist",
		class: ["Engineer"],
		img: "/icons/EOD.svg",
		perk: "Feel No Pain",
		description: "Relentless:",
		perk1: "Injury Resistance",
		percentage1: "+50%",
		perk2: null,
		percentage2: null,
		perk3: null,
		percentage3: null,
	},
	GUNNER: {
		name: "Heavy Weapons Specialist",
		class: ["Assault"],
		img: "/icons/Gunner.svg",
		perk: "Rolling Thunder",
		description: null,
		perk1: "Weapon Damage",
		percentage1: "+20%",
		perk2: "Damage to drones",
		percentage2: "+20%",
		perk3: null,
		percentage3: null,
	},

	JTAC: {
		name: "Joint Terminal Attack Controller",
		class: ["Assault"],
		img: "/icons/JTAC.svg",
		perk: "Sixth Sense",
		description: null,
		perk1: "Automatic Marking",
		percentage1: "+25m",
		perk2: null,
		percentage2: null,
		perk3: null,
		percentage3: null,
	},
	JTAC2: {
		name: "Combat Controller",
		class: ["Pathfinder"],
		img: "/icons/JTAC2.svg",
		perk: "Recon Mastery",
		description: "For ever enemy marked with your drone:",
		perk1: "Technique Cool-down",
		percentage1: "-15%",
		perk2: "XP Gain",
		percentage2: "+50",
		perk3: null,
		percentage3: null,
	},
	MEDIC: {
		name: "Combat Medic",
		class: ["Medic"],
		img: "/icons/Medic.svg",
		perk: "Revivalist",
		description: null,
		perk1: "Movement Speed",
		percentage1: "+20%",
		perk2: "Damage Resistance",
		percentage2: "+40%",
		perk3: null,
		percentage3: null,
	},
	MEDIC2: {
		name: "Field Medic",
		class: ["Medic"],
		img: "/icons/Medic2.svg",
		perk: "Cold Blooded",
		description: null,
		perk1: "Health Regen Delay",
		percentage1: "-30%",
		perk2: "Health Regen Speed",
		percentage2: "+100%",
		perk3: null,
		percentage3: null,
	},
	MEDIC3: {
		name: "Para Jumper",
		class: ["Medic"],
		img: "/icons/Medic3.svg",
		perk: "Inspired",
		description:
			"For every kill by an ally, instantly heal back some of your health.",
		perk1: null,
		percentage1: null,
		perk2: null,
		percentage2: null,
		perk3: null,
		percentage3: null,
	},
	PILOT: {
		name: "Special Operations Pilot",
		class: ["Assault"],
		img: "/icons/Pilot2.svg",
		perk: "Cold Blooded",
		description: null,
		perk1: "Health Regen Delay",
		percentage1: "-30%",
		perk2: "Health Regen Speed",
		percentage2: "+100%",
		perk3: null,
		percentage3: null,
	},
	PILOT2: {
		name: "Rotary-Wing Pilot",
		class: ["Pathfinder"],
		img: "/icons/Pilot.svg",
		perk: "Pistolero",
		description: "While using a handgun:",
		perk1: "Damage",
		percentage1: "+20%",
		perk2: "Technique Cool-down",
		percentage2: "-20%",
		perk3: "XP Bonus",
		percentage3: "+40%",
	},
	SNIPER: {
		name: "Long-Range Marksman",
		class: ["Sharpshooter"],
		img: "/icons/Sniper.svg",
		perk: "Ballistic Advantage",
		description: null,
		perk1: "Range",
		percentage1: "+60%",
		perk2: "Handling",
		percentage2: "+30%",
		perk3: null,
		percentage3: null,
	},
	SIGINT: {
		name: "Signals Intelligence Analyst",
		class: ["Echelon"],
		img: "/icons/Sigint.svg",
		perk: "Recon Mastery",
		description: "For ever enemy marked with your drone:",
		perk1: "Technique Cool-down",
		percentage1: "-15%",
		perk2: "XP Gain",
		percentage2: "+50",
		perk3: null,
		percentage3: null,
	},
	CQC: {
		name: "Close Quarters combat Specialist",
		class: ["Panther"],
		img: "/icons/CQC.svg",
		perk: "Adrenaline",
		description: "After a CQC kill:",
		perk1: "Health Restore",
		percentage1: "+20%",
		perk2: "Reload Speed",
		percentage2: "+40%",
		perk3: "Accuracy",
		percentage3: "+40%",
	},
	INFILTRATOR: {
		name: "Black Ops Operator",
		class: ["Panther"],
		img: "/icons/Infiltrator2.svg",
		perk: "Slime Shadow",
		description: null,
		perk1: "Stealth",
		percentage1: "+80%",
		perk2: "Agility",
		percentage2: "+10%",
		perk3: null,
		percentage3: null,
	},
	INFILTRATOR2: {
		name: "Special Reconnaissance Operator",
		class: ["Panther"],
		img: "/icons/Infiltrator.svg",
		perk: "Sixth Sense",
		description: null,
		perk1: "Automatic Marking",
		percentage1: "+25m",
		perk2: null,
		percentage2: null,
		perk3: null,
		percentage3: null,
	},
	MARKSMAN: {
		name: "Designated Marksman",
		class: ["Sharpshooter"],
		img: "/icons/Marksman.svg",
		perk: "Gunslinger",
		description: null,
		perk1: "Accuracy",
		percentage1: "+15%",
		perk2: "Handling",
		percentage2: "+15%",
		perk3: null,
		percentage3: null,
	},
	DIVER: {
		name: "Amphibious Operations Specialist",
		class: ["Pathfinder"],
		img: "/icons/Diver.svg",
		perk: "Burst Forth",
		description: null,
		perk1: "Movement Speed",
		percentage1: "+10%",
		perk2: "Stamina Regen Speed",
		percentage2: "+50%",
		perk3: null,
		percentage3: null,
	},

	MOUNTAINEER: {
		name: "Mountain Warfare Specialist",
		class: ["Pathfinder"],
		img: "/icons/Mountaineer.svg",
		perk: "Burst Forth",
		description: null,
		perk1: "Movement Speed",
		percentage1: "+10%",
		perk2: "Stamina Regen Speed",
		percentage2: "+50%",
		perk3: null,
		percentage3: null,
	},
	MOUNTAINEER2: {
		name: "High-Altitude Sniper",
		class: ["Sharpshooter"],
		img: "/icons/Mountaineer2.svg",
		perk: "Ballistic Advantage",
		description: null,
		perk1: "Range",
		percentage1: "+60%",
		perk2: "Handling",
		percentage2: "+30%",
		perk3: null,
		percentage3: null,
	},

	RECON: {
		name: "Reconnaissance Specialist",
		class: ["Pathfinder"],
		img: "/icons/Recon.svg",
		perk: "Recon Mastery",
		description: "For every enemy marked with your drone:",
		perk1: "Technique Cool-down",
		percentage1: "-15%",
		perk2: "XP Gain",
		percentage2: "+50",
		perk3: null,
		percentage3: null,
	},

	RECON2: {
		name: "Reconnaissance Scout",
		class: ["Sharpshooter"],
		img: "/icons/Recon2.svg",
		perk: "Gunslinger",
		description: null,
		perk1: "Accuracy",
		percentage1: "+15%",
		perk2: "Handling",
		percentage2: "+15%",
		perk3: null,
		percentage3: null,
	},
};
