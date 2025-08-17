import axios from "axios";

const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (location.hostname === "localhost" ? "http://localhost:8000/api" : "");

export const apiPublic = axios.create({ baseURL: BASE });

export default apiPublic;
