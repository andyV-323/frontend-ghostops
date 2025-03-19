// This file is used to create an Axios instance that will be used to make requests to the backend API.
// The getAuthToken function retrieves the latest auth token from localStorage.
// The api instance is created with a baseURL and headers object.
// The Authorization token is attached to every request using an interceptor.
// The clearAuthToken function is used to remove the auth token from localStorage.

import axios from "axios";

// Retrieve the latest auth token from localStorage
const getAuthToken = () => {
	const token = localStorage.getItem("authToken");
	if (!token) {
		console.warn("WARNING: No token found in localStorage.");
		return null;
	}
	return `Bearer ${token}`;
};

// Create Axios instance
const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
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
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Handle unauthorized responses (e.g., expired token)
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			console.warn(
				"Unauthorized: Clearing auth token and redirecting to login."
			);
			clearAuthToken();
			window.location.href = "/login"; // Redirect to login page
		}
		return Promise.reject(error);
	}
);

// Clear auth token on logout
export const clearAuthToken = () => {
	localStorage.removeItem("authToken");
};

export default api;
