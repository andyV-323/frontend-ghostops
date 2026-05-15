export const PROVINCES_KEY_LOCATIONS = {
	Golem1: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [400, 950],
		imgURL: "/maps/GolemIsland.png",
		biome: "Volcanic Rain Forest",

		locations: [
			{
				name: "Ancient Harbor",
				coordinates: [190, 360],
				description: "Ancient harbor repurposed as a depot by the Wolves.",
			},
			{
				name: "Golem Island Satellite Dish",
				coordinates: [250, 460],
				description:
					"Skell Facility built to communicate and send data through the world.",
			},
			{
				name: "Golem Island Heliport",
				coordinates: [320, 560],
				description:
					"Cold War Heliport, the only path from sector 1 to sector 2.",
			},
			{
				name: "Chemical Pipeline",
				coordinates: [600, 550],
				description: "Pipeline connecting the refinery to the Workshop.",
			},
			{
				name: "Chemical Refinery",
				coordinates: [450, 450],
				description:
					"Facility producing chemical compounds needed for the Workshop.",
			},
		],
	},
	Golem2: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [360, 1080],
		imgURL: "/maps/GolemIsland.png",
		biome: "Volcanic Rain Forest",

		locations: [
			{
				name: "Golem Island Testing Zone ",
				coordinates: [130, 560],
				description:
					"Skell facility built to test the Titan Drones capabilities.",
			},
			{
				name: "Missile Site Ruins",
				coordinates: [110, 700],
				description: "Cold War, Titan Missiles site covered by lava.",
			},
			{
				name: "Camp Phoenix",
				coordinates: [280, 660],
				description:
					"Skell living quarters repurposed as the Main Wolf camp of the island.",
			},
			{
				name: "Camp Salamander",
				coordinates: [330, 730],
				description: "Wolf camp protecting the gate between sector 2 and 3.",
			},
			{
				name: "Forgotten Sanctuary",
				coordinates: [220, 560],
				description: "Ancient Sanctuary",
			},
		],
	},
	Golem3: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [580, 1235],
		imgURL: "/maps/GolemIsland.png",
		biome: "Volcanic Dessert",

		locations: [
			{
				name: "Red Phoenix Outpost",
				coordinates: [325, 890],
				description: "Outpost protecting the access to No Man's Land.",
			},
			{
				name: "Lava Shield",
				coordinates: [495, 850],
				description: "Thermal shield protecting the Scandium mine from lava.",
			},
			{
				name: "Lavaduct",
				coordinates: [540, 800],
				description: "Skell structure to reroute Lava and power the Workshop.",
			},
			{
				name: "Scandium Mine",
				coordinates: [440, 815],
				description: "Rare mineral mine used to produce Titan and Node Alloy.",
			},
			{
				name: "No Man's Land",
				coordinates: [430, 995],
				description:
					"Cold War training camp obliterated by the 1968 Volcano eruption.",
			},
			{
				name: "Prototype Workshop",
				coordinates: [650, 680],
				description: "Skell facility producing Titan Drones.",
			},
		],
	},
	CapeNorth: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [650, 690],
		imgURL: "/maps/capenorthMap.png",
		biome: "Rain Forest",

		locations: [
			{
				name: "Skell Foundation Campus",
				coordinates: [330, 610],
				description:
					"The epicenter of Skell Tech's AI research, this expansive floating campus is nestled in the heart of a rain forest surrounded lake. It consists of multiple two-story buildings and is partially civilian-operated, supporting PMC activities. The blend of technology and nature, along with its strategic isolation, makes it a critical node for both intelligence operations and direct action missions.",
			},
			{
				name: "Darkwood Island Port",
				coordinates: [250, 740],
				description:
					"Formerly bustling with tourists, this port served as a gateway to the Auroan Islands. Set against a lush rain forest backdrop and accessible by two main roads, its strategic position along vital waterways makes it an ideal location for maritime security operations or covert insertions.",
			},
			{
				name: "Bat SAM Site",
				coordinates: [165, 690],
				description:
					"This beach-adjacent SAM launcher site, though lightly manned, is strategically crucial due to its anti-air capabilities. The surrounding rain forest is patrolled by PMC forces, posing a constant threat and making this site a priority target for disabling enemy air defenses.",
			},

			{
				name: "Underwater Cable Station",
				coordinates: [395, 265],
				description:
					"A hidden gem of technological prowess, this station connects the campus to Aurora's broader network. Accessible only by raft or boat through a clandestine cave, it's manned by civilians under PMC guard, making it a critical communications node ripe for interception or sabotage.",
			},
			{
				name: "Campus Relay Station",
				coordinates: [430, 870],
				description:
					"Perched in an isolated location accessible solely by helicopter, the Darkwood Island radio relay is a linchpin for area communications. Its heavy guard by Sentinel forces underscores its importance, making it a strategic target for disrupting enemy comms or gathering intelligence.",
			},

			{
				name: "Sentinel Corp. Location",
				coordinates: [380, 745],
				description:
					"Tucked between two mountains, this complex is strategically vital, bridging connections to the radio relay. With its buildings linked by bridges and a robust enemy presence, it presents a tactical challenge for operations aiming to disrupt Sentinel's operations or secure high-value intelligence.",
			},
		],
	},
	DriftwoodIslets: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [610, 800],
		imgURL: "/maps/capenorthMap.png",
		biome: "Rain Forest",

		locations: [
			{
				name: "Driftwood Islets Testing Zone",
				coordinates: [530, 1150],
				description:
					"A meticulously constructed simulation of a city center designed for testing advanced drone behavior. The area mimics a bustling small city with an adversarial presence and is dominated by large land drones. Key to its operation is a towering structure that serves as both a monitoring station for drone activity and a strategic vantage point. The zone is heavily fortified, presenting a challenging environment for infiltration and reconnaissance missions.",
			},
			{
				name: "Camp Kodiak",
				coordinates: [80, 1215],
				description:
					"A formidable Wolves base, suspected of detaining captured outcasts. Concealed within the dense rain forest, this heavily defended island base is accessible by a small dock. Its natural camouflage and strategic location make it a daunting challenge to liberate the captives held within. Operations here will require careful planning and stealth, with potential for direct confrontation.",
			},
		],
	},
	WildCoast: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [510, 430],
		imgURL: "/maps/WildCoast.png",
		biome: "High Cliffs",

		locations: [
			{
				name: "Outpost Blue Tiger",
				coordinates: [250, 590],
				description:
					"Nestled between daunting cliffs, this Wolves base potentially detains outcasts. The surrounding sniper positions, combined with artillery and land drones, make it a fortress. Strategic assaults or stealth tactics are paramount for penetration.",
			},

			{
				name: "Anchor Point Station",
				coordinates: [160, 250],
				description:
					"Echoes of the 19th century resonate through this whaler port, now a beach outpost on a secluded island. Sentinel forces maintain a vigilant guard, presenting a historical puzzle wrapped in modern conflict.",
			},
			{
				name: "Drone Station W031",
				coordinates: [265, 435],
				description:
					"Skell Tech’s drone control network relay, veiled in palm trees and watched over by PMC guards. Operations here require a nuanced approach to navigate the natural and human-made defenses.",
			},

			{
				name: "Shark Bank Station",
				coordinates: [680, 620],
				description:
					" A historical whaler port transformed into a small, strategic port, flanked by palm trees leading to a cliff. Patrols in the area necessitate careful planning for any engagement.",
			},
			{
				name: "Control Station Tiger 01",
				coordinates: [550, 660],
				description:
					"A compact control station pivotal since Operation Citadel, guarded by PMC amidst cliffs. Its strategic significance to drone operations makes it a critical target.",
			},

			{
				name: "Checkpoint Tiger Foxtrot",
				coordinates: [335, 655],
				description:
					"A critical road control point since Operation Citadel, overseeing the main paved road. Securing or bypassing this checkpoint is vital for area dominance.",
			},
			{
				name: "Ancient Harbor",
				coordinates: [445, 550],
				description:
					"The remnants of an ancient beach village, now under enemy control, blend history with modern conflict, offering unique operational challenges.",
			},
		],
	},
	SmugglersCoves: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [590, 560],
		imgURL: "/maps/SmugglersCove.png",
		biome: "High Cliffs",

		locations: [
			{
				name: "Maunga Nui Port",
				coordinates: [560, 770],
				description:
					" This bustling industrial hub is the lifeblood of Maunga Nui Island, heavily guarded by PMC forces. It's a critical asset for logistics and supplies, with constant civilian and military activity, posing a challenge for any direct action without causing collateral damage.",
			},
			{
				name: "Smuggler Coves Freight Yard",
				coordinates: [495, 680],
				description:
					"Operated by Skell Tech, this yard processes vital ores and materials. It's a high-security location with surveillance systems and patrolled by armed guards. The open layout offers little cover, demanding a well-planned stealth approach or a swift hit-and-run tactic.",
			},

			{
				name: "Drone Station W011",
				coordinates: [400, 460],
				description:
					"A key node in the Skell Tech drone network, this relay station is fortified with state-of-the-art security measures. Guarded by elite PMC units, infiltrating this facility requires electronic warfare capabilities and precise coordination.",
			},

			{
				name: "Foxglove Station",
				coordinates: [305, 345],
				description:
					"Currently halted by PMC activities, this construction site contains valuable technology and equipment. Entry requires breaching reinforced doors while dealing with heavy guard patrols, making it a high-stakes target for intelligence recovery or sabotage missions.",
			},

			{
				name: "Oleander Station",
				coordinates: [200, 940],
				description:
					"Similar to Foxglove, this Skell Tech site is under PMC lock down. Securing or liberating this site involves breaching operations under the threat of close-quarters combat, ideal for intense MILSIM engagements.",
			},
			{
				name: "Outpost Red Tiger",
				coordinates: [328, 940],
				description:
					"A Wolves stronghold suspected of holding high-value detainees. Surrounded by natural defenses and reinforced with heavy armaments, this outpost requires a coordinated assault or stealth infiltration for prisoner extraction.",
			},
			{
				name: "Checkpoint Tiger Bravo",
				coordinates: [477, 670],
				description:
					"These road control points are strategically placed to secure key transit routes, each manned by heavy infantry and surveillance equipment. Capturing or bypassing these checkpoints would be crucial for controlling movement and supplies in MILSIM scenarios.",
			},
			{
				name: "Checkpoint Tiger Charlie",
				coordinates: [506, 1056],
				description:
					"These road control points are strategically placed to secure key transit routes, each manned by heavy infantry and surveillance equipment. Capturing or bypassing these checkpoints would be crucial for controlling movement and supplies in MILSIM scenarios.",
			},
			{
				name: "Checkpoint Tiger Delta",
				coordinates: [389, 1058],
				description:
					"These road control points are strategically placed to secure key transit routes, each manned by heavy infantry and surveillance equipment. Capturing or bypassing these checkpoints would be crucial for controlling movement and supplies in MILSIM scenarios.",
			},
		],
	},
	SinkingCountry: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [570, 690],
		imgURL: "/maps/SinkingCountry.png",
		biome: "Salt Marsh",

		locations: [
			{
				name: "Howard Airfield",
				coordinates: [655, 783],
				description:
					"This airfield, currently utilized as a Wolves base, is rumored to detain outcasts prisoners. The facility is heavily fortified with aerial defenses and ground troops, making it a high-stakes target for rescue or assault operations.",
			},
			{
				name: "Howard Port",
				coordinates: [460, 1024],
				description:
					"Renovated from a Cold War-era structure by Sentinel Corp, this port is a crucial logistical hub with heavy military presence and civilian workers, requiring careful planning to approach without high civilian impact.",
			},
			{
				name: "Radar Station North",
				coordinates: [577, 930],
				description:
					"A key strategic site providing surveillance over the region, now operated by Sentinel Corp. The station is surrounded by marshlands, offering natural concealment for approach but requiring electronic warfare capabilities to neutralize or hijack the systems.",
			},
			{
				name: "Anti-Aircraft Ruins",
				coordinates: [471, 490],
				description:
					"These abandoned Cold War anti-aircraft installations now serve as a historical curiosity and occasionally as an impromptu outpost for enemy forces, offering a tactical objective for gaining control of air space in MILSIM scenarios.",
			},
			{
				name: "Harrier SAM Site",
				coordinates: [580, 740],
				description:
					"A critical air defense installation equipped with surface-to-air missiles. Capturing or disabling this site would be essential for controlling the airspace and supporting aerial operations.",
			},
			{
				name: "Osprey SAM Site",
				coordinates: [555, 840],
				description:
					" Positioned strategically to defend key assets, this SAM site requires coordinated ground and electronic attacks to neutralize, ideal for training in combined arms and electronic warfare tactics.",
			},
			{
				name: "Sparrowhawk SAM Site",
				coordinates: [327, 1131],
				description:
					" Overlooking the salt marshes, this site forms part of the area’s comprehensive air defense network, making it a prime target for forces aiming to establish air superiority.",
			},
			{
				name: "Sentinel Corp. Land Base",
				coordinates: [300, 610],
				description:
					"Headquarters for Sentinel Corp's land operations on Auroa, heavily guarded with both personnel and automated defense systems. Operations here would involve significant planning and might focus on intelligence gathering or high-value target extraction.",
			},
			{
				name: "Equipment Depot",
				coordinates: [240, 790],
				description:
					"Serving as the main supply depot for Sentinel Corp's ground forces, this site is essential for maintaining the logistical chain. Securing or sabotaging this depot could cripple enemy operations across the region.",
			},
			{
				name: "Ammunition Depot",
				coordinates: [455, 790],
				description:
					"A repurposed Cold War facility now stocking vast amounts of ammunition, making it a critical asset for enemy supply lines. Ideal for demolition operations or as a diversionary target during larger campaigns.",
			},
			{
				name: "Checkpoint Tiger Kilo",
				coordinates: [190, 820],
				description:
					"These checkpoints control major thoroughfares, heavily manned and fortified, making them crucial for controlling movement in the area. Capturing these points could sever enemy supply lines and restrict troop movements, pivotal in large-scale MILSIM operations.",
			},
			{
				name: "Checkpoint Tiger Golf",
				coordinates: [545, 727],
				description:
					"These checkpoints control major thoroughfares, heavily manned and fortified, making them crucial for controlling movement in the area. Capturing these points could sever enemy supply lines and restrict troop movements, pivotal in large-scale MILSIM operations.",
			},
			{
				name: "Checkpoint Tiger India",
				coordinates: [396, 724],
				description:
					"These checkpoints control major thoroughfares, heavily manned and fortified, making them crucial for controlling movement in the area. Capturing these points could sever enemy supply lines and restrict troop movements, pivotal in large-scale MILSIM operations.",
			},
			{
				name: "Checkpoint Tiger Juliet",
				coordinates: [274, 600],
				description:
					"These checkpoints control major thoroughfares, heavily manned and fortified, making them crucial for controlling movement in the area. Capturing these points could sever enemy supply lines and restrict troop movements, pivotal in large-scale MILSIM operations.",
			},
			{
				name: "Bunker Edgehod North",
				coordinates: [480, 1175],
				description: "Cold War bunkers renovated by Sentinel Corp.",
			},
			{
				name: "Bunker Edgehod South",
				coordinates: [80, 1012],
				description:
					"Renovated Cold War bunkers now serve as fortified strong points for Sentinel Corp. These bunkers offer challenging close-quarters combat scenarios, suitable for training in breach and clear tactics.",
			},
			{
				name: "Camp Tiger",
				coordinates: [250, 1155],
				description:
					" A Wolves stronghold believed to hold high-value captives. The camp is fortified with defensive perimeters and watchtowers, demanding a well-coordinated assault plan for successful extraction missions.",
			},
		],
	},
	WhalersBay: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [420, 400],
		imgURL: "/maps/WhalersBay.png",
		biome: "High Cliffs",

		locations: [
			{
				name: "Aconite Station",
				coordinates: [360, 645],
				description:
					" A previously active Skell Tech construction site now seized by PMC forces, necessitating door breach tactics for entry. This site offers a complex urban warfare scenario due to its multiple buildings and fortified positions.",
			},
			{
				name: "Checkpoint Weasel Charlie",
				coordinates: [620, 906],
				description:
					"Strategically positioned to control key road access within the region, this checkpoint is fortified with barriers and heavy weaponry. Capturing or neutralizing this point is crucial for controlling regional movement and disrupting enemy logistics.",
			},
			{
				name: "Checkpoint Weasel Delta",
				coordinates: [580, 870],
				description:
					"Similar in function to Checkpoint Weasel Charlie, this control point manages another critical transit route. Operations here should focus on quick strikes or stealth tactics to avoid prolonged engagement and ensure road dominance.",
			},

			{
				name: "Fanny Bay Port",
				coordinates: [610, 720],
				description:
					"An old whaler port now occasionally used for clandestine operations. Its historical structures provide ample cover and complex battlefields, suitable for amphibious operations or covert landings.",
			},

			{
				name: "Whalers Bay Airfield",
				coordinates: [420, 630],
				description:
					"Essential for air transport across the central mountain range, securing or controlling this airfield provides strategic air mobility and can be pivotal in extended campaigns.",
			},

			{
				name: "Drone Station W061",
				coordinates: [370, 720],
				description:
					"A critical node in Skell Tech's drone network, featuring advanced security protocols and drone defenses. Capturing this facility could severely disrupt enemy communications and drone operations.",
			},
			{
				name: "Blue Cove Station",
				coordinates: [300, 550],
				description:
					"Features remnants of a 19th-century whaler port, offering unique historical and tactical game play elements. The area's old structures could serve as hiding spots or defensive positions in skirmishes.",
			},

			{
				name: "Checkpoint Weasel Echo",
				coordinates: [115, 730],
				description:
					"Guards an important road junction, providing strategic value for controlling vehicle movements in the area. Like other checkpoints, securing this location could be key to establishing area control.",
			},
		],
	},
	MountHodgson: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [515, 540],
		imgURL: "/maps/MountHudgson.png",
		biome: "High Thundra",

		locations: [
			{
				name: "Drone Station W041",
				coordinates: [225, 690],
				description:
					"A critical node in Skell Tech’s drone control network, this relay station is fortified with electronic defenses and surveillance systems. Capturing or defending this station can significantly impact drone operations across the region.",
			},
			{
				name: "Checkpoint Tiger Echo",
				coordinates: [120, 700],
				description:
					"Strategically placed to control access to key mining areas and logistic routes, this checkpoint is essential for maintaining security and operational flow. Securing this checkpoint would provide control over movement and supply distribution in tactical simulations.",
			},
		],
	},
	FenBog: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [445, 620],
		imgURL: "/maps/Fenbog.png",
		biome: "Salt Marsh",

		locations: [
			{
				name: "Fen Bog Port",
				coordinates: [160, 820],
				description:
					"This port is essential for shipping aquaponics supplies, featuring both civilian and military activity. Operations here might involve securing the port for strategic use or protecting it from enemy attacks.",
			},

			{
				name: "Control Station Tiger 03",
				coordinates: [340, 470],
				description:
					"This control station is pivotal for managing lethal drone operations in the region. Engagements here might focus on capturing high-tech control systems or disabling drone operations to weaken enemy defenses.",
			},
			{
				name: "Checkpoint Tiger Bravo",
				coordinates: [350, 535],
				description:
					"These checkpoints regulate traffic and security, serving as critical points for controlling movement. Missions might involve seizing control to cut off enemy reinforcements or to secure escape routes during broader operations.",
			},
			{
				name: "Checkpoint Tiger Hotel",
				coordinates: [655, 363],
				description:
					"These checkpoints regulate traffic and security, serving as critical points for controlling movement. Missions might involve seizing control to cut off enemy reinforcements or to secure escape routes during broader operations.",
			},
			{
				name: "Drone Station W052",
				coordinates: [435, 860],
				description:
					" Vital nodes in the Skell Tech drone network, these stations are well-defended with both technology and personnel. Operations to capture or destroy these facilities would directly impact regional security operations.",
			},
			{
				name: "Control Station Tiger 02",
				coordinates: [350, 950],
				description:
					"This critical control station, established under Operation Citadel, orchestrates lethal drone operations throughout the region. As a nerve center for autonomous warfare capabilities, it is fortified with state-of-the-art defense systems and heavily guarded by elite PMC units. The station's strategic importance makes it a prime target for disabling enemy drone capabilities. Operations here might involve complex cyber warfare to hijack control systems, stealth infiltration to gather intelligence, or a direct assault to neutralize the facility, disrupting enemy aerial superiority and impacting battlefield dynamics across FenBog.",
			},
			{
				name: "Drone Station W051",
				coordinates: [280, 910],
				description:
					" Vital nodes in the Skell Tech drone network, these stations are well-defended with both technology and personnel. Operations to capture or destroy these facilities would directly impact regional security operations.",
			},
			{
				name: "Hogweed Station",
				coordinates: [355, 733],
				description:
					"Currently halted by PMC activities, this construction site contains valuable technology and equipment. Entry requires breaching reinforced doors while dealing with heavy guard patrols, making it a high-stakes target for intelligence recovery or sabotage missions.",
			},
		],
	},
	GoodHopeMountain: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [390, 440],
		imgURL: "/maps/GoodHopeMt.png",
		biome: "High Thundra",

		locations: [
			{
				name: "Red Weasel Outpost",
				coordinates: [380, 900],
				description:
					"A forward operating base established by the Wolves, heavily fortified due to its strategic position in the high tundra. This outpost is crucial for maintaining control over the surrounding regions, making it an essential target for capture or destruction in military simulations.",
			},
			{
				name: "Checkpoint Weasel India",
				coordinates: [345, 600],
				description:
					" Situated on a vital transit route, this checkpoint is heavily manned and equipped to control access through the mountain passes. Securing or neutralizing this location would be key to disrupting enemy movements and gaining territorial advantage.",
			},
			{
				name: "Camp Weasel",
				coordinates: [385, 680],
				description:
					"This Wolves base serves as a logistic and operational hub, supporting regional military activities. Engagements here could involve direct assaults, stealth infiltration to gather intelligence, or sabotage missions to undermine enemy capabilities. ",
			},
			{
				name: "Checkpoint Weasel Hotel",
				coordinates: [435, 660],
				description:
					"Another critical road control point that monitors and regulates traffic in the mountainous terrain. Operations could focus on seizing control to facilitate friendly movements or to cut off enemy reinforcements and supply lines.",
			},

			{
				name: "Drone Station W111",
				coordinates: [190, 290],
				description:
					"A vital link in Skell Tech’s drone network, controlling numerous unmanned systems across the region. Capturing or disabling this station would significantly degrade enemy surveillance and attack capabilities, highlighting the importance of electronic warfare in modern combat simulations.",
			},

			{
				name: "Checkpoint Weasel Alpha",
				coordinates: [440, 1000],
				description:
					" Guards the northern approaches to key strategic sites within GoodHopeMountain. Its capture or neutralization is crucial for establishing control over the northern sectors and securing supply routes.",
			},
			{
				name: "Checkpoint Weasel Golf",
				coordinates: [700, 345],
				description:
					" Located at a strategic junction, controlling this checkpoint would facilitate movements across the southern and western regions, crucial for broad strategic maneuvers or securing flanking routes in extended campaigns",
			},
		],
	},
	SilentMountain: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [450, 470],
		imgURL: "/maps/SilentMt.png",
		biome: "High Thundra",

		locations: [
			{
				name: "Auroa Intranet Control",
				coordinates: [375, 530],
				description:
					"Oversees all internal communication networks for Auroa, making it a key node for cyber operations. Missions could involve electronic warfare to intercept or manipulate data, offering significant tactical advantages.",
			},
			{
				name: "Submarine Cable Control",
				coordinates: [520, 400],
				description:
					"Controls the critical submarine communications cables that connect Auroa to the global network. Its isolation makes it vulnerable to covert operations aimed at severing external communications.",
			},
			{
				name: "Hemlock Station",
				coordinates: [635, 445],
				description:
					"A construction site that has been seized by PMC forces, requiring a breach to gain entry. This site provides excellent training opportunities for close-quarters battle and breach and clear tactics in a construction environment.",
			},

			{
				name: "Camp Black Widow",
				coordinates: [170, 750],
				description:
					"A strategic forward operating base established by Sentinel Corp, equipped with advanced surveillance and defense systems. Capturing this camp could be pivotal for establishing control over the surrounding areas.",
			},
			{
				name: "Drone Station W071",
				coordinates: [285, 290],
				description:
					"Part of Skell Tech’s drone network, this relay station is essential for unmanned operations in the area. Securing or disrupting this station could significantly impact drone surveillance and offensive capabilities.",
			},
		],
	},
	NewArgyll: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [430, 560],
		imgURL: "/maps/NewArgyll.png",
		biome: "Rain Shadows",

		locations: [
			{
				name: "Control Station Tiger 04",
				coordinates: [640, 665],
				description:
					"A high-security facility critical for the command and control of lethal drones throughout the region. Capturing or disabling this station would severely impair enemy drone operations, making it a primary target in electronic warfare and commando operations.",
			},

			{
				name: "Outpost Black Tiger",
				coordinates: [295, 325],
				description:
					"A Wolves military base suspected of holding prisoners of war. Rescue operations or assaults to neutralize this base could be key missions, affecting morale and the operational capabilities of enemy forces.",
			},
		],
	},
	Infinity: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [400, 620],
		imgURL: "/maps/Infinity.png",
		biome: "Meadow Lands",

		locations: [
			{
				name: "Checkpoint Viper Golf",
				coordinates: [715, 600],
				description:
					"A strategically placed checkpoint that controls the main access roads into and out of the city center, crucial for controlling movement and securing the area during operations.",
			},
			{
				name: "Control Station Viper 04",
				coordinates: [740, 560],
				description:
					"This advanced facility controls the deployment and coordination of lethal drones in the region. Disabling or capturing this site would severely impair enemy drone capabilities and provide a tactical advantage.",
			},

			{
				name: "Skell Security",
				coordinates: [525, 435],
				description:
					"Oversees the operation of non-lethal security drones throughout Infinity. Operations might involve hacking or taking control of the drone network to reduce security threats during critical missions.",
			},
			{
				name: "Checkpoint Viper Delta",
				coordinates: [475, 260],
				description:
					" Controls a crucial junction for routes leading to industrial and residential areas. Dominance over this checkpoint would facilitate control over significant portions of the city’s transport routes.",
			},

			{
				name: "Checkpoint Viper Charlie",
				coordinates: [155, 280],
				description:
					"Another vital road control point, its capture or neutralization can isolate key sections of Infinity, limiting enemy reinforcements and controlling civilian movement.",
			},

			{
				name: "Checkpoint Viper Echo",
				coordinates: [75, 400],
				description:
					"Serves as an outer perimeter defense, securing strategic routes into the more rural parts of the region. Controlling this checkpoint would extend operational reach outside the urban core.",
			},

			{
				name: "Outpost Green Viper",
				coordinates: [285, 390],
				description:
					"A Wolves military base that could be holding high-value targets or prisoners, making it a primary target for rescue or assault missions.",
			},

			{
				name: "Infinity Transport Hub",
				coordinates: [465, 660],
				description:
					"Critical infrastructure for controlling the flow of goods and people into and out of the region. Securing or disrupting these hubs would have significant logistical and strategic impacts.",
			},
			{
				name: "Auroa Airport",
				coordinates: [540, 850],
				description:
					"Critical infrastructure for controlling the flow of goods and people into and out of the region. Securing or disrupting these hubs would have significant logistical and strategic impacts.",
			},
		],
	},
	Channels: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [300, 300],
		imgURL: "/maps/Channels.png",
		biome: "Fjordlands",

		locations: [
			{
				name: "Channels Port",
				coordinates: [360, 520],
				description:
					"A vital logistical hub supporting the power plants and receiving supplies. Securing or blockading this port could significantly impact the enemy's supply chains and operational capabilities.",
			},
			{
				name: "Red Shark Outpost",
				coordinates: [315, 400],
				description:
					"A fortified base held by the Wolves, potentially holding high-value hostages or strategic assets. Rescue missions or assaults on this outpost could significantly impact enemy morale and operational strength.",
			},

			{
				name: "Vulture SAM Site",
				coordinates: [290, 675],
				description:
					"Surface-to-air missile sites providing air defense coverage. Neutralizing these sites would be crucial for establishing air superiority and supporting airborne operations.",
			},
			{
				name: "Checkpoint Shark Charlie",
				coordinates: [140, 545],
				description:
					"Surface-to-air missile sites providing air defense coverage. Neutralizing these sites would be crucial for establishing air superiority and supporting airborne operations.",
			},
			{
				name: "Eagle SAM Site",
				coordinates: [180, 520],
				description:
					"Controls key access points along strategic routes, making it essential for controlling movement and securing operational zones within the Fjordlands.",
			},
			{
				name: "Sentinel Corp. Location",
				coordinates: [290, 465],
				description:
					"A location of interest under Sentinel Corp control, possibly containing valuable resources or intelligence. Reconnaissance or capture of this site could yield strategic advantages or insights into enemy operations.",
			},
		],
	},
	RestrictedArea01: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [300, 480],
		imgURL: "/maps/RestrictedArea.png",
		biome: "High Thundra and Rain Shadows",

		locations: [
			{
				name: "Manchineel Station",
				coordinates: [650, 1090],
				description:
					"A critical Skell Tech. construction site now under PMC blockade. Vital for MILSIM scenarios involving forced entry and control of key technological assets.",
			},

			{
				name: "Checkpoint Fox Charlie",
				coordinates: [630, 1185],
				description:
					"Strategically important road checkpoint, controlling access to sensitive areas. Capturing this checkpoint is crucial for controlling movement and logistics.",
			},

			{
				name: "Checkpoint Fox Alpha",
				coordinates: [680, 690],
				description: "Deployed since Operation Citadel to control roads.",
			},
			{
				name: "Control Station Viper 01",
				coordinates: [740, 700],
				description:
					"Deployed since Operation Citadel to control lethal drones.",
			},
			{
				name: "Camp Ferret",
				coordinates: [615, 535],
				description:
					"Formerly a Cold War military base, now a strategic point held by the Wolves. Perfect for MILSIM operations involving base capture or defense.",
			},
			{
				name: "Outpost Red Ferret",
				coordinates: [600, 330],
				description:
					"A heavily fortified position providing strong defense capabilities against enemy forces. This outpost is critical for maintaining territorial control.",
			},
			{
				name: "Assembly Hall Omega 02",
				coordinates: [595, 200],
				description:
					"A facility dedicated to the assembly of air lethal drones, presenting an opportunity for missions targeting the disruption of enemy air capabilities.",
			},
			{
				name: "Checkpoint Weasel Bravo",
				coordinates: [680, 160],
				description: "Deployed since Operation Citadel to control roads.",
			},
			{
				name: "Arrow Testing Zone",
				coordinates: [500, 70],
				description:
					"A testing ground for advanced military drones, providing a realistic setting for MILSIM exercises focusing on electronic warfare and drone interception. ",
			},
			{
				name: "Checkpoint Ferret Bravo",
				coordinates: [450, 270],
				description: "Deployed since Operation Citadel to control roads.",
			},

			{
				name: "Gate 07",
				coordinates: [35, 435],
				description:
					"Various secured entrances to RestrictedArea01, each serving as critical junctures for access control, making them hot spots for breaching or defense operations in MILSIM.",
			},
			{
				name: "Gate 03",
				coordinates: [275, 1160],
				description:
					"Various secured entrances to RestrictedArea01, each serving as critical junctures for access control, making them hot spots for breaching or defense operations in MILSIM.",
			},

			{
				name: "Checkpoint Fox Echo",
				coordinates: [375, 660],
				description:
					"Manages advanced drone production under Project Omega. Seizing or defending this facility is key to controlling next-gen military drone capabilities.",
			},
			{
				name: "Training Center",
				coordinates: [350, 740],
				description:
					" A facility used by the Wolves for combat readiness. Engagements here could involve direct assaults, defense, or training scenarios in a controlled environment.",
			},
			{
				name: "Gate 06",
				coordinates: [200, 650],
				description:
					"Various secured entrances to RestrictedArea01, each serving as critical junctures for access control, making them hot spots for breaching or defense operations in MILSIM.",
			},
			{
				name: "Gate 05",
				coordinates: [150, 660],
				description:
					"Various secured entrances to RestrictedArea01, each serving as critical junctures for access control, making them hot spots for breaching or defense operations in MILSIM.",
			},

			{
				name: "Gate 04",
				coordinates: [80, 845],
				description:
					"Various secured entrances to RestrictedArea01, each serving as critical junctures for access control, making them hot spots for breaching or defense operations in MILSIM.",
			},
			{
				name: "Checkpoint Fox Delta",
				coordinates: [125, 890],
				description: "Deployed since Operation Citadel to control roads.",
			},

			{
				name: "Assembly Hall Omega 01",
				coordinates: [205, 1005],
				description:
					"This crucial facility is at the heart of ground lethal drone production. In a MILSIM context, securing or sabotaging this assembly hall could determine air-to-ground superiority in the operational area. It presents strategic opportunities for engaging in intricate sabotage missions or for defending the facility against opposing forces attempting to disrupt drone production capabilities. Control of this site is vital for maintaining technological dominance on the battlefield.",
			},
			{
				name: "Drone Station W161",
				coordinates: [160, 1040],
				description:
					"Deployed since Operation Citadel too control lethal drones.",
			},

			{
				name: "Outpost Red Fox",
				coordinates: [415, 720],
				description:
					" This heavily fortified Wolves base is rumored to hold key outcast prisoners. It is a strategic site for rescue missions or high-stakes infiltration to extract valuable intelligence or personnel under harsh conditions.",
			},
			{
				name: "Control Station Fox 01",
				coordinates: [545, 800],
				description:
					"Deployed since Operation Citadel too control lethal drones.",
			},
			{
				name: "Control Station Fox 02",
				coordinates: [465, 1030],
				description:
					"Deployed since Operation Citadel too control lethal drones.",
			},

			{
				name: "Camp Fox",
				coordinates: [520, 890],
				description:
					"Positioned to secure this segment of RestrictedArea01, Camp Fox is a military stronghold with vital command and control capabilities. In MILSIM games, capturing or defending this camp could be key to controlling the broader operational theater, offering extensive engagement for both tactical planning and direct combat.",
			},
			{
				name: "Gate 02",
				coordinates: [325, 1130],
				description:
					"Various secured entrances to RestrictedArea01, each serving as critical junctures for access control, making them hot spots for breaching or defense operations in MILSIM.",
			},
			{
				name: "Gate 01",
				coordinates: [450, 1135],
				description:
					"Various secured entrances to RestrictedArea01, each serving as critical junctures for access control, making them hot spots for breaching or defense operations in MILSIM.",
			},
		],
	},
	LakeCountry: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [380, 540],
		imgURL: "/maps/LakeCountry.png",
		biome: "Rain Shadows",

		locations: [
			{
				name: "Red Viper Outpost",
				coordinates: [545, 795],
				description:
					" A stronghold of the Wolves faction, rumored to detain high-value targets. This location is ideal for hostage rescue missions and high-intensity conflict simulations in MILSIM operations.",
			},

			{
				name: "Checkpoint Viper Alpha",
				coordinates: [580, 560],
				description:
					"A critical checkpoint controlling major road access within the region. Capturing or defending this point in MILSIM operations can dictate the flow of logistical support and troop movements, making it a strategic objective.",
			},

			{
				name: "Camp Viper",
				coordinates: [390, 235],
				description:
					"The main operational base for Sentinel Corp in the region, serving as a key objective for both assault and defense simulations, focusing on base security and force readiness.",
			},
			{
				name: "Drone Station W121",
				coordinates: [460, 360],
				description:
					"This drone control station is pivotal for maintaining aerial surveillance and control over unmanned systems in the area, making it a primary target for electronic warfare and cyber operations in MILSIM scenarios.",
			},
		],
	},
	NewStirling: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [290, 590],
		imgURL: "/maps/NewStirling.png",
		biome: "Mead Lands",

		locations: [
			{
				name: "Control Station Viper 03",
				coordinates: [395, 530],
				description:
					"A critical node for controlling lethal drones, offering strategic importance for electronic warfare and cyber defense operations within MILSIM.",
			},

			{
				name: "Drone Station W131",
				coordinates: [135, 620],
				description:
					" Operates as a vital communication and control hub for drone operations, crucial for missions involving the capture or disruption of enemy communications.",
			},
			{
				name: "Checkpoint Viper Hotel",
				coordinates: [80, 580],
				description:
					"Serves as a vital road control point deployed by the PMC, crucial for controlling troop movements and securing logistical routes in MILSIM scenarios.",
			},

			{
				name: "Checkpoint Viper India",
				coordinates: [20, 590],
				description:
					"Deployed by the PMC since Operation Citadel to control roads.",
			},

			{
				name: "Drone Station W132",
				coordinates: [435, 700],
				description:
					"As a Skell Tech drone control network relay station, this facility plays a critical role in UAV operations, making it a strategic target for capture or defense exercises in advanced drone warfare simulations.",
			},

			{
				name: "Control Station Viper 02",
				coordinates: [540, 805],
				description:
					"This control station is central to the operation of lethal drones, providing a high-value target in scenarios focusing on electronic warfare, drone command control, and cyber operations within MILSIM.",
			},

			{
				name: "Blue Viper Outpost",
				coordinates: [625, 800],
				description:
					"A strategically located Wolves base potentially holding prisoners of war, ideal for high-stakes rescue or assault missions in MILSIM scenarios.",
			},
			{
				name: "Checkpoint Viper Foxtrot",
				coordinates: [650, 855],
				description:
					"Deployed by the PMC sice Operation Citadel to control roads.",
			},
			{
				name: "Checkpoint Viper Bravo",
				coordinates: [330, 600],
				description:
					"Deployed by the PMC sice Operation Citadel to control roads.",
			},
		],
	},
	SealIslands: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [220, 380],
		imgURL: "/maps/SealIslands.png",
		biome: "Fjordlands",

		locations: [
			{
				name: "Buzzard SAM Site",
				coordinates: [535, 600],
				description:
					"This surface-to-air missile site is integral to aerial defense strategies, providing a defensive challenge in air superiority exercises within MILSIM environments.",
			},
			{
				name: "Anti Aircraft Battery",
				coordinates: [450, 540],
				description:
					"Refurbished by Sentinel Corp., this Cold War-era anti-aircraft site offers a realistic setting for air defense maneuvers and tactics training.",
			},
			{
				name: "Emelius Port",
				coordinates: [430, 730],
				description:
					" Now a hub for drone control operations, Emelius Port is a key logistic and tactical site, essential for maintaining control over automated defenses in MILSIM scenarios.",
			},
			{
				name: "Ammunition Storage",
				coordinates: [430, 830],
				description:
					"This facility, a repurposed Cold War vestige, serves as an ammunition depot for Sentinel Corp., representing a vital logistical node in supply chain missions.",
			},
			{
				name: "Owl SAM Site",
				coordinates: [320, 830],
				description:
					"Positioned strategically within the fjordlands, this SAM site enhances the air defense grid, posing a significant challenge in air assault simulations.",
			},
			{
				name: "Checkpoint Shark Alpha",
				coordinates: [200, 880],
				description:
					"A critical road checkpoint established to enforce territorial control, ideal for convoy security and interception drills in MILSIM.",
			},
			{
				name: "Control Station Shark 01",
				coordinates: [225, 860],
				description:
					" This control station is central to drone operations, providing a high-value target in exercises focusing on the capture or sabotage of drone command centers.",
			},
			{
				name: "Naval Base Auroa Airfield",
				coordinates: [100, 790],
				description:
					"A renovated Cold War airfield now serving as a forward operating base for Sentinel Corp., key for air deployment and tactical response scenarios.",
			},
			{
				name: "Sentinel Corp. Naval Base",
				coordinates: [40, 900],
				description:
					"The main naval base for Sentinel Corp. on Auroa, it's a strategic point for maritime operations and amphibious assault exercises.",
			},
			{
				name: "Falcon SAM Site",
				coordinates: [175, 550],
				description:
					"Another vital part of the island’s air defense network, offering realistic engagement scenarios for anti-aircraft warfare training.",
			},
			{
				name: "Shark Base",
				coordinates: [260, 600],
				description:
					"Situated in a former Cold War US Navy underground base, this location provides a complex environment for subterranean combat and control room security operations.",
			},
			{
				name: "Camp Seal Cove",
				coordinates: [220, 335],
				description:
					"This historical site of 19th-century seal hunters now serves as a rugged terrain training area, perfect for survival and reconnaissance drills.",
			},
			{
				name: "Abandoned Barracks",
				coordinates: [415, 285],
				description:
					"Once bustling with activity, these now-abandoned barracks offer a haunting setting for urban warfare and clearance operations.",
			},
			{
				name: "Checkpoint Shark Bravo",
				coordinates: [470, 615],
				description:
					"As part of Operation Citadel's security measures, this checkpoint is critical for controlling movement and conducting security operations.",
			},
			{
				name: "Condor SAM site",
				coordinates: [490, 765],
				description:
					"Essential for defending key assets from aerial attacks, this SAM site challenges pilots and tactical teams in air-to-ground conflict simulations.",
			},
		],
	},
	Liberty: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [190, 470],
		imgURL: "/maps/Liberty.png",
		biome: "Meadow Lands and Urban City",

		locations: [
			{
				name: "Detention Center",
				coordinates: [415, 225],
				description:
					"Originally constructed to detain criminals and Outcasts, this facility can serve as a high-stakes rescue or containment operation site.",
			},
			{
				name: "Checkpoint Fox Foxtrot",
				coordinates: [340, 240],
				description:
					"A strategic road checkpoint controlling vital transport routes, perfect for convoy ambush or protection drills.",
			},

			{
				name: "Liberty Airport",
				coordinates: [90, 440],
				description:
					"Once a bustling hub, now a deserted site ideal for extraction or insertion operations.",
			},

			{
				name: "Liberty Port",
				coordinates: [230, 510],
				description:
					"Previously used for travel between islands, now a tactical point for maritime operations and amphibious landings.",
			},

			{
				name: "Auroa Parliament",
				coordinates: [335, 430],
				description:
					"Built for participatory democracy, now closed and controlled by Sentinel Corp, suitable for high-value target acquisition missions.",
			},

			{
				name: "Control Station Fox 01",
				coordinates: [425, 375],
				description:
					"Key network nodes for drone operations, crucial for electronic warfare and cyber-defense exercises.",
			},
			{
				name: "Drone Station W191",
				coordinates: [395, 330],
				description:
					"Key network nodes for drone operations, crucial for electronic warfare and cyber-defense exercises.",
			},

			{
				name: "Drone Station W192",
				coordinates: [335, 570],
				description:
					"A critical node in Skell Tech's drone control network, essential for electronic warfare and drone interception exercises.",
			},

			{
				name: "Liberty Transport Hub",
				coordinates: [215, 615],
				description:
					"The main transportation hub of Liberty city, offering scenarios for securing or sabotaging transport logistics.",
			},

			{
				name: "Control Station Fox 02",
				coordinates: [305, 625],
				description:
					"A vital control point for lethal drone operations, making it a high-value target for capture or defense operations.",
			},

			{
				name: "Checkpoint Fox Bravo",
				coordinates: [435, 800],
				description:
					" A key checkpoint controlling major roadways, suitable for convoy ambush or secure passage operations.",
			},
		],
	},
	WindyIslands: {
		coordinates: {
			center: [0, 0],
			bounds: [
				[0, 0],
				[768, 1366],
			],
		},
		AOO: [80, 380],
		imgURL: "/maps/WindyIslands.png",
		biome: "Meadow Lands",

		locations: [
			{
				name: "Drone Station S01",
				coordinates: [360, 765],
				description:
					"Controls various drone operations, crucial for training on drone warfare and cyber defense tactics.",
			},
			{
				name: "Windy Islands Port",
				coordinates: [325, 680],
				description:
					"Handles waste shipping and recycling material exports, providing a strategic point for maritime security operations.",
			},
		],
	},
};
