import api from "./ApiClient";

export const getKits = async () => {
	try {
		const response = await api.get("/kits");
		return response.data;
	} catch (error) {
		console.error("ERROR fetching kits:", error);
		return [];
	}
};

export const createKit = async (kitData) => api.post("/kits", kitData);

export const updateKit = async (id, kitData) => api.put(`/kits/${id}`, kitData);

export const deleteKit = async (id) => api.delete(`/kits/${id}`);
