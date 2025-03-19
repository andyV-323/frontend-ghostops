//This file contains all the API calls related to operators

import api from "./ApiClient";

// Get all operators
export const getOperators = async () => {
	try {
		const response = await api.get("/operators");
		return response.data;
	} catch (error) {
		console.error("ERROR fetching operators from API:", error);
		return [];
	}
};
// Get operator by ID
export const getOperatorById = async (id) => api.get(`/operators/${id}`);

// Create a new operator
export const createOperator = async (operatorData) =>
	api.post("/operators", operatorData);

// Update an existing operator
export const updateOperator = async (id, operatorData) =>
	api.put(`/operators/${id}`, operatorData);

// Delete an operator
export const deleteOperator = async (id) => api.delete(`/operators/${id}`);

// Update operator bio
export const updateOperatorBio = async (operatorId, bio) => {
	try {
		const response = await api.put(`/operators/${operatorId}/bio`, { bio });
		return response.data;
	} catch (error) {
		console.error("ERROR updating operator bio:", error);
		throw error;
	}
};

//Update Status
export const updateOperatorStatus = async (operatorId, status) => {
	return api.put(`/operators/${operatorId}/status`, { status });
};
