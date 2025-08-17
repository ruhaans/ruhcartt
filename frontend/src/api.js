import axios from "axios";

// Use the backend you set in Netlify env var; fall back to localhost in dev
const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (location.hostname === "localhost" ? "http://localhost:8000/api" : ""); // empty = same-origin (not used if env var set)

export const api = axios.create({ baseURL: BASE });

export function setToken(token) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh");
  setToken(null);
  window.location.href = "/login";
}

// Load saved token on app start
const saved = localStorage.getItem("token");
if (saved) setToken(saved);

// --- AUTO REFRESH ON 401 ---
let isRefreshing = false;
let pendingQueue = [];

api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const original = error?.config || {};
    if (error?.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    const refresh = localStorage.getItem("refresh");
    if (!refresh) {
      logout();
      return Promise.reject(error);
    }

    try {
      if (isRefreshing) {
        const newToken = await new Promise((resolve) => pendingQueue.push(resolve));
        original.headers = original.headers || {};
        original.headers["Authorization"] = `Bearer ${newToken}`;
        return api(original);
      }

      isRefreshing = true;

      const r = await api.post("/auth/token/refresh/", { refresh });
      const newAccess = r?.data?.access;
      if (!newAccess) throw new Error("No access token in refresh response");

      localStorage.setItem("token", newAccess);
      setToken(newAccess);

      pendingQueue.forEach((fn) => fn(newAccess));
      pendingQueue = [];
      isRefreshing = false;

      original.headers = original.headers || {};
      original.headers["Authorization"] = `Bearer ${newAccess}`;
      return api(original);
    } catch (e) {
      isRefreshing = false;
      pendingQueue = [];
      logout();
      return Promise.reject(e);
    }
  }
);

export default api;
