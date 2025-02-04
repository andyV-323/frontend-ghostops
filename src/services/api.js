import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
export const getOperators = async () => api.get("/operators");
export const getOperatorById = async (id) => api.get(`/operators/${id}`);
export const createOperator = async (operatorData) =>
  api.post("/operators", operatorData);
export const updateOperator = async (id, operatorData) =>
  api.put(`/operators/${id}`, operatorData);
export const deleteOperator = async (id) => api.delete(`/operators/${id}`);

export default api;
