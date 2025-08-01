// Description: API call to chatGPT to generate a military biography for a Operator and to generate teams.
import { toast } from "react-toastify";
import axios from "axios";

export const chatGPTApi = async (feature, data) => {
	let messageContent = "";

	if (feature === "team") {
		messageContent = `Given the available operators: ${data.availableOperators
			.map((op) => `${op.name} `)
			.join(", ")}, generate a mission-ready team. ${
			data.teamType
				? `The team should be suitable for a ${data.teamType} operation.`
				: `The team should be suitable for the following mission: "${data.missionDescription}."`
		} Consider operator roles, strengths, and mission requirements when selecting the team. Provide a brief justification for each operator chosen.`;
	} else if (feature === "mission") {
		messageContent = `You are a Special Operations Commander. Generate a realistic tactical mission briefing using the information below. Follow ALL instructions.

---
MISSION PARAMETERS:
- Objective: ${data.missionDescription}
- Biome: ${data.biome}
- Province: ${data.provinceDescription}
- Mission Coordinates: ${JSON.stringify(data.coordinates)}
- Other Mission Locations: ${JSON.stringify(data.allProvinceCoordinates)}
- Map Bounds: ${JSON.stringify(data.bounds)}

---
OUTPUT INSTRUCTIONS:
Your output MUST follow this exact JSON format:

{
  "briefing": "Write a detailed tactical mission briefing here that includes the following:
  
1. Mission Overview — summarize the objective and risks.
2. Terrain & Biome — explain how the environment affects movement, cover, and visibility.
3. Insertion Method — recommend one based on the terrain (HALO, vehicle, foot, etc.).
4. Time of Day — say if this mission should ONLY occur at night or if timing is flexible.
5. Gear Loadout — recommend headgear, tops, bottoms, gloves, boots, camo or civilian disguise.
6. Infil Strategy — describe how to approach the target area stealthily.
7. Exfil Strategy — how to get out safely.
8. Rally Point — when and why to use it if the mission is compromised.

",
  "infilPoint": [x, y],
  "exfilPoint": [x, y],
  "fallbackExfil": [x, y]
}

Coordinate rules:
- All 3 points must be within the map bounds.
- All 3 points must be UNIQUE.
- They CANNOT match any in allProvinceCoordinates.
- \`infilPoint\` must be at least 20 units from missionCoordinates and 30 from allProvinceCoordinates.
- \`exfilPoint\` must be at least 10 units from both the missionCoordinates and infilPoint.
- \`fallbackExfil\` must be at least 10 units from infilPoint.
`;
	}

	try {
		const key = import.meta.env.VITE_RAPIDAPI_KEY;

		const response = await axios.post(
			// New endpoint
			"https://open-ai21.p.rapidapi.com/chatgpt",
			{
				// Updated payload structure for new API
				messages: [
					{
						role: "user",
						content: messageContent,
					},
				],
				web_access: false,
			},
			{
				headers: {
					"x-rapidapi-key": key,
					"x-rapidapi-host": "open-ai21.p.rapidapi.com",
					"Content-Type": "application/json",
				},
			}
		);

		return response.data;
	} catch (error) {
		console.error("ERROR generating response:", error);
		toast.error("Failed to generate response. Please try again.");
		throw error;
	}
};
