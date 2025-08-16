import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

export function setToken(token: string | null) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}

const saved = localStorage.getItem("seller_token");
if (saved) setToken(saved);