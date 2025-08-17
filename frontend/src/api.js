// frontend/src/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

export function setToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh");
  setToken(null);
  window.location.href = "/login";
}

// Load any saved token on app start
const saved = localStorage.getItem("token");
if (saved) setToken(saved);

// --- AUTO REFRESH ON 401 ---
let isRefreshing = false;
// queue of resolver functions; each awaiting request will resolve with the new token
let pendingQueue = [];

api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const original = error?.config || {};

    // if not unauthorized, or we've already retried, just fail
    if (error?.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // mark so we don't loop forever
    original._retry = true;

    const refresh = localStorage.getItem("refresh");
    if (!refresh) {
      logout();
      return Promise.reject(error);
    }

    try {
      // if a refresh is already happening, queue this request until it finishes
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

      // flush queued requests
      pendingQueue.forEach((fn) => fn(newAccess));
      pendingQueue = [];
      isRefreshing = false;

      // retry the original request with the new token
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

// optional default export if you ever want `import api from "./api"`
export default api;
