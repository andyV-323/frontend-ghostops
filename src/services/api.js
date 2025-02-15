/** @format */

import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

// Function to retrieve the latest auth token from localStorage
const getAuthToken = () => {
	const token = localStorage.getItem("authToken");
	if (!token) {
		console.warn("WARNING: No token found in localStorage.");
	}
	return token ? `Bearer ${token}` : "";
};

// Create Axios instance
const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Attach Authorization token to every request
api.interceptors.request.use(
	(config) => {
		const token = getAuthToken();
		if (token) {
			config.headers.Authorization = token;
			console.log("DEBUG: Sending request with token:", token); // ✅ Debugging
		} else {
			console.warn("WARNING: No token attached to request.");
		}
		return config;
	},
	(error) => Promise.reject(error)
);
// Function to clear auth token on logout
export const clearAuthToken = () => {
	localStorage.removeItem("authToken"); // ✅ Remove stored token on logout
	console.log("DEBUG: Token cleared from localStorage.");
};

// ---------------------- OPERATORS API ----------------------
// Get all operators
export const getOperators = async () => {
	try {
		const response = await api.get("/operators");
		console.log("DEBUG: API Response for Operators:", response.data); // ✅ Check data
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

// ---------------------- TEAMS API ----------------------
// Get all teams
export const getTeams = async () => {
	try {
		const response = await api.get("/teams");
		console.log("DEBUG: API Response for Operators:", response.data); // ✅ Check data
		return response.data;
	} catch (error) {
		console.error("ERROR fetching operators from API:", error);
		return [];
	}
};

// Get a single team by ID
export const getTeamById = async (id) => api.get(`/teams/${id}`);

// Create a new team
export const createTeam = async (teamData) => api.post("/teams", teamData);

// Update an existing team
export const updateTeam = async (id, teamData) =>
	api.put(`/teams/${id}`, teamData);

// Delete a team
export const deleteTeam = async (id) => api.delete(`/teams/${id}`);

// Get all injured operators
export const getInjuredOperators = async () => {
	try {
		const response = await api.get("/infirmary");
		console.log("DEBUG: API Response for Injured Operators:", response.data);
		return response.data;
	} catch (error) {
		console.error("ERROR fetching injured operators from API:", error);
		return [];
	}
};

// Mark an operator as recovered (removes from infirmary)
// Recover Operator - Update Status to Active
export const recoverOperator = async (id) => {
	try {
		const response = await api.put(`/infirmary/recover/${id}`);
		console.log("✅ Operator Recovered:", response.data);
		return response.data;
	} catch (error) {
		console.error("❌ ERROR recovering operator:", error);
		throw error;
	}
};

// ---------------------- MEMORIAL API ----------------------
// Get all KIA operators
export const getMemorialOperators = async () => {
	try {
		const response = await api.get("/memorial/operators", {
			params: { status: "KIA" }, // ✅ Use Axios params instead of query string
		});
		console.log("DEBUG: API Response for Memorial Operators:", response.data);
		return response.data;
	} catch (error) {
		console.error(
			"❌ ERROR fetching KIA operators:",
			error.response?.data || error
		);
		return [];
	}
};

// Add an operator to the memorial (KIA)
export const addToMemorial = async (Operatordata) => {
	try {
		const response = await api.post("/memorial", Operatordata);
		console.log("✅ Operator added to memorial:", response.data);
		return response.data;
	} catch (error) {
		console.error(
			"❌ ERROR adding to memorial:",
			error.response?.data || error
		);
		throw error;
	}
};

// Update operator bio
export const updateOperatorBio = async (operatorId, bio) => {
	try {
		const response = await axios.put(
			`${API_BASE_URL}/operators/${operatorId}/bio`,
			{ bio },
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: getAuthToken(), // ✅ Include Authorization token
				},
			}
		);
		console.log("✅ Operator bio updated:", response.data);
		return response.data;
	} catch (error) {
		console.error("❌ ERROR updating operator bio:", error);
		throw error;
	}
};
export const updateOperatorStatus = async (operatorId, status) => {
	return api.put(`/operators/${operatorId}/status`, { status });
};

export const addInfirmaryEntry = async (data) => {
	try {
		console.log("DEBUG: Sending Infirmary Data:", data); // ✅ Log before sending
		const response = await api.post("/infirmary", data);
		console.log("✅ Infirmary Entry Created:", response.data);
		return response.data;
	} catch (error) {
		console.error(
			"❌ ERROR adding infirmary entry:",
			error.response?.data || error
		);
		throw error;
	}
};
export const removeOperatorFromTeams = async (operatorId) => {
	try {
		console.log(`🟢 DEBUG: Sending DELETE request for ${operatorId}`);

		const response = await api.delete(`/teams/removeOperator/${operatorId}`);

		console.log(`✅ DEBUG: Successfully removed ${operatorId} from teams`);
		return response.data;
	} catch (error) {
		console.error(
			"❌ ERROR removing operator from teams:",
			error.response?.data || error
		);
		throw error;
	}
};
export const reviveOperator = async (id) => {
	try {
		const response = await api.put(`/memorial/revive/${id}`);
		console.log("✅ Operator Recovered:", response.data);
		return response.data;
	} catch (error) {
		console.error(
			"❌ ERROR recovering operator:",
			error.response?.data || error
		);
		throw error;
	}
};

export default api;
