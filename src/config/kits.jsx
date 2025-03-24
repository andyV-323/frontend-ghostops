export const KITS = {
	NONE: {
		name: "None",
		img: "/gear/none.png",
		perk: null,
		description: null,
		perk1: null,
		percentage1: null,
		perk2: null,
		percentage2: null,
		perk3: null,
		percentage3: null,
	},
	BREACHER: {
		name: "Breacher",
		img: "/icons/Breacher.svg",
		perk: "Explosive Expert",
		description: null,
		perk1: "Items Area of Effect",
		percentage1: "+20%",
		perk2: "Explosive Damage",
		percentage2: "+20%",
		perk3: "Throw Range",
		percentage3: "+60%",
	},
	CBRN: {
		name: "CBRN",
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
		name: "Communications Specialist",
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
		name: "Electronic Warfare Specialist",
		img: "/icons/Cyber.svg",
		perk: "Guerrilla",
		description: "For every hit with the shotgun :",
		perk1: "Damage Resistance",
		percentage1: "+10%",
		perk2: "Health Regen Speed",
		percentage2: "+20%",
		perk3: null,
		percentage3: null,
	},
	LEAD: {
		name: "Team Leader",
		img: "/icons/default.svg",
		perk: "Player's Choice",
		description: null,
		perk1: null,
		percentage1: null,
		perk2: null,
		percentage2: null,
		perk3: null,
		percentage3: null,
	},
	DEMO: {
		name: "Combat Engineer",
		img: "/icons/Demo.svg",
		perk: "Pack Mule",
		description: null,
		perk1: "Maximum Ammo",
		percentage1: "+40%",
		perk2: "Ammo Pick Up",
		percentage2: "+10%",
		perk3: null,
		percentage3: null,
	},
	DRONE: {
		name: "Drone Operator",
		img: "/icons/Drone.svg",
		perk: "Drone Hunter",
		description:
			"After destroying a drone, instantly heal back some of your health",
		perk1: null,
		percentage1: null,
		perk2: null,
		percentage2: null,
		perk3: null,
		percentage3: null,
	},
	EOD: {
		name: "Explosive Ordnance Disposal",
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
		name: "Support Gunner",
		img: "/icons/Gunner.svg",
		perk: "Revivalist",
		description: null,
		perk1: "Movement Speed",
		percentage1: "+20%",
		perk2: "Damage Resistance",
		percentage2: "+40%",
		perk3: null,
		percentage3: null,
	},
	JTAC: {
		name: "Joint Terminal Attack Controller",
		img: "/icons/JTAC.svg",
		perk: "Ballistic Advantage",
		description: null,
		perk1: "Range",
		percentage1: "+60%",
		perk2: "Handling",
		percentage2: "+30%",
		perk3: null,
		percentage3: null,
	},
	MEDIC: {
		name: "Medic",
		img: "/icons/Medic.svg",
		perk: "Inspired",
		description:
			"For every kill b an ally, instantly heal back some of your health :",
		perk1: null,
		percentage1: null,
		perk2: null,
		percentage2: null,
		perk3: null,
		percentage3: null,
	},
	PILOT: {
		name: "Pilot",
		img: "/icons/Pilot.svg",
		perk: "Pistolero",
		description: "While using a handgun :",
		perk1: "Damage",
		percentage1: "+20%",
		perk2: "Technique Cool-down",
		percentage2: "-20%",
		perk3: "XP Bonus",
		percentage3: "+40%",
	},
	SNIPER: {
		name: "Sniper",
		img: "/icons/Sniper.svg",
		perk: "Rolling Thunder",
		description: null,
		perk1: "Weapon Damage",
		percentage1: "+20%",
		perk2: "Damage to drones",
		percentage2: "+20%",
		perk3: null,
		percentage3: null,
	},
	SIGINT: {
		name: "Signals Intelligence ",
		img: "/icons/Sigint.svg",
		perk: "Sensor Hack",
		description: null,
		perk1: "Drone Evasion",
		percentage1: "+30%",
		perk2: "Damage to drones",
		percentage2: "+10%",
		perk3: null,
		percentage3: null,
	},
	CQC: {
		name: "Close Quarter Combat Specialist",
		img: "/icons/CQC.svg",
		perk: "Adrenaline",
		description: "After CQC kill :",
		perk1: "Health Restore",
		percentage1: "+20%",
		perk2: "Reload Speed",
		percentage2: "+40%",
		perk3: "Accuracy",
		percentage3: "+40%",
	},
	INFILTRATOR: {
		name: "Infiltration Specialist",
		img: "/icons/Infiltrator.svg",
		perk: "Slime Shadow",
		description: null,
		perk1: "Stealth",
		percentage1: "+80%",
		perk2: "Agility",
		percentage2: "+10%",
		perk3: null,
		percentage3: null,
	},
	MARKSMAN: {
		name: "Marksman",
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
		name: "Combat Diver",
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
		name: "Mountaineer",
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

	POINTMAN: {
		name: "Point Man",
		img: "/icons/PointMan.svg",
		perk: "Close and Personal",
		description: null,
		perk1: "Reload Speed",
		percentage1: "+15%",
		perk2: "Mobility",
		percentage2: "+10%",
		perk3: null,
		percentage3: null,
	},
	RECON: {
		name: "Recon Specialist",
		img: "/icons/Recon.svg",
		perk: "Recon Mastery",
		description: "For ever enemy marked with your drone :",
		perk1: "Technique Cool-down",
		percentage1: "-15%",
		perk2: "XP Gain",
		percentage2: "+50",
		perk3: null,
		percentage3: null,
	},
};
