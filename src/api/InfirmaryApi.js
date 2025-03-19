//this file contains all the api calls related to the infirmary

import api from "./ApiClient";

// Get all injured operators
export const getInjuredOperators = async () => {
	try {
		const response = await api.get("/infirmary");
		return response.data;
	} catch (error) {
		console.error("ERROR fetching injured operators from API:", error);
		return [];
	}
};

//Update Status to Active
export const recoverOperator = async (id) => {
	try {
		const response = await api.put(`/infirmary/recover/${id}`);
		return response.data;
	} catch (error) {
		console.error("ERROR recovering operator:", error);
		throw error;
	}
};

export const addInfirmaryEntry = async (data) => {
	try {
		const response = await api.post("/infirmary", data);
		return response.data;
	} catch (error) {
		console.error(
			"ERROR adding infirmary entry:",
			error.response?.data || error
		);
		throw error;
	}
};
