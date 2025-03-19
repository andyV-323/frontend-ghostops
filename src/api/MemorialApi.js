//this file contains all the api calls related to the Memorial

import api from "./ApiClient";

// Get all KIA operators
export const getMemorialOperators = async () => {
	try {
		const response = await api.get("/memorial/operators", {
			params: { status: "KIA" },
		});
		return response.data;
	} catch (error) {
		console.error(
			"ERROR fetching KIA operators:",
			error.response?.data || error
		);
		return [];
	}
};

// Add an operator to the memorial (KIA)
export const addMemorialEntry = async (data) => {
	try {
		const response = await api.post("/memorial", data);
		return response.data;
	} catch (error) {
		console.error("ERROR adding to memorial:", error.response?.data || error);
		throw error;
	}
};

//Remove Operator from Memorial
export const reviveOperator = async (id) => {
	try {
		const response = await api.put(`/memorial/revive/${id}`);
		return response.data;
	} catch (error) {
		console.error("ERROR recovering operator:", error.response?.data || error);
		throw error;
	}
};
