/** @format */

import axios from "axios";

const RAPIDAPI_HOST = "open-ai31.p.rapidapi.com"; // New RapidAPI host
const RAPIDAPI_KEY = "d1c3b13970mshdcdb8568c172ea3p18ca74jsn5e8ffff5f274"; // Same

export const chatGPTApi = async (feature, data) => {
	let messageContent = "";

	if (feature === "bio") {
		messageContent = `Generate a detailed military biography for ${data.name}, call sign ${data.callSign},\
		 nationality ${data.nationality}, role ${data.class}, elite special forces group ${data.sf}, and status${data.status}\
		 (if KIA then say he died in Auroa during a mission). Background, training, and\
		  combat experience should be realistic and concise.Make sure to keep it short. Only include the Biography!`;
	} else if (feature === "team") {
		messageContent = `Given the available operators: ${data.availableOperators
			.map((op) => `${op.name} (${op.role}, ${op.secondaryRole})`)
			.join(", ")}, generate a mission-ready team. ${
			data.teamType
				? `The team should be suitable for a ${data.teamType} operation.`
				: `The team should be suitable for the following mission: "${data.missionDescription}."`
		} Consider operator roles, strengths, and mission requirements when selecting the team. Provide a brief justification for each operator chosen.`;
	}

	try {
		const response = await axios.post(
			`https://${RAPIDAPI_HOST}/api/ai/`, // New endpoint
			{
				model: "gpt-3.5-turbo", // Specify the model you want to use
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
					"x-rapidapi-key": RAPIDAPI_KEY,
					"x-rapidapi-host": RAPIDAPI_HOST,
					"Content-Type": "application/json",
				},
			}
		);

		console.log("DEBUG: Bio Response:", response.data);
		return response.data;
	} catch (error) {
		console.error("❌ ERROR generating bio:", error);
		throw error;
	}
};
