// api/chatGPTApi.js
import { toast } from "react-toastify";
import axios from "axios";

export const chatGPTApi = async (feature, data) => {
	let messageContent = "";

	if (feature === "team") {
		messageContent = `Given the available operators: ${data.availableOperators
			.map((op) => op.name)
			.join(", ")}, generate a mission-ready team.
${
	data.teamType
		? `The team should be suitable for a ${data.teamType} operation.`
		: `The team should be suitable for the following mission: "${data.missionDescription}".`
}
Consider operator roles, strengths, and mission requirements when selecting the team.
Provide a brief justification for each operator chosen.`;
	}

	if (feature === "briefing") {
		messageContent = `You are a Special Operations Commander.

Write a realistic tactical mission briefing based ONLY on the info below.
Do NOT output JSON. Do NOT include coordinates. Do NOT include markdown code fences.

MISSION:
- Objective: ${data.missionDescription || "Not provided"}
- Biome: ${data.biome || "Unknown"}
- Province Details: ${data.provinceDescription || "Unknown"}

FORMAT:
Write 8 labeled sections in this exact order:
1) Mission Overview
2) Terrain & Biome
3) Insertion Method
4) Time of Day
5) Gear Loadout
6) Infil Strategy
7) Exfil Strategy
8) Rally Point

Keep it tactical, concise, and realistic.`;
	}

	try {
		const key = import.meta.env.VITE_RAPIDAPI_KEY;

		const response = await axios.post(
			"https://open-ai21.p.rapidapi.com/chatgpt",
			{
				messages: [{ role: "user", content: messageContent }],
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
