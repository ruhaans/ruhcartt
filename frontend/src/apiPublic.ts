import axios from "axios";
export const apiPublic = axios.create({
  baseURL: "http://localhost:8000/api",
});
