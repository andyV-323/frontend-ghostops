// Description: API call to chatGPT to generate a military biography for a Operator and to generate teams.
import { toast } from "react-toastify";
import axios from "axios";

export const chatGPTApi = async (feature, data) => {
	let messageContent = "";

	if (feature === "bio") {
		messageContent = `Generate a detailed military biography for ${data.name}, call sign ${data.callSign},\
		 nationality ${data.nationality}, role ${data.class}, elite special forces group ${data.sf}, and status${data.status}\
		 (if KIA then say he died in Auroa during a mission). Background, training, and\
		  combat experience should be realistic and concise.Make sure to keep it short. `;
	} else if (feature === "team") {
		messageContent = `Given the available operators: ${data.availableOperators
			.map((op) => `${op.name} (${op.role}, ${op.secondaryRole})`)
			.join(", ")}, generate a mission-ready team. ${
			data.teamType
				? `The team should be suitable for a ${data.teamType} operation.`
				: `The team should be suitable for the following mission: "${data.missionDescription}."`
		} Consider operator roles, strengths, and mission requirements when selecting the team. Provide a brief justification for each operator chosen.`;
	} else if (feature === "mission") {
		messageContent = `Generate a mission briefing based on:
		- Mission Description: ${data.missionDescription}
		- Biome: ${data.biome}
		- Province Description: ${data.provinceDescription}
		- Map Bounds: ${JSON.stringify(data.bounds)}
		- Central Mission Coordinates: ${JSON.stringify(data.coordinates)}
		- Existing Mission Locations: ${JSON.stringify(data.allProvinceCoordinates)}

		**Instructions**:
		You are a seasoned special operations commander briefing elite operators on an upcoming mission.  

 Create a **realistic** tactical mission briefing based on the **biome, province details, and mission description**.  - **Equipment recomedations and operator specialties**: recommend what equipment might be useful and what operator specialist or class would be an ideal team for the operation.   
Walk the team through all phases of the mission:  
  
	Select **three unique coordinates** for infiltration, exfiltration, and a rally point that:
			- Are **within** the map bounds.
			- Are **NOT** in the provided list of mission locations.
			- The **Infil Point** should be at least **20 units away** from mission coordinates **and** at least **30 units away** from existing mission locations.
			- The **Exfil Point** should be at least **10 units away** from both the **mission coordinates** and **Infil Point**.
			- The **Fallback Exfil Point** should be at least **10 units away from **Infil Point** 
			

		**Output JSON Example**:
		{
			"briefing": "This mission will require stealth due to dense jungle conditions...",
			"infilPoint": [x, y],
			"exfilPoint": [x, y],
			"fallbackExfil": [x, y] 
		}
`;
	}

	try {
		const host = import.meta.env.VITE_RAPIDAPI_HOST;
		const key = import.meta.env.VITE_RAPIDAPI_KEY;
		const response = await axios.post(
			//Endpoint for chatGPT
			`https://${host}/api/ai/`,
			{
				//Model for chatGPT
				model: "gpt-3.5-turbo",
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
					"x-rapidapi-host": host,
					"Content-Type": "application/json",
				},
			}
		);
		return response.data;
	} catch (error) {
		toast.error("ERROR generating response:", error);
		throw error;
	}
};
