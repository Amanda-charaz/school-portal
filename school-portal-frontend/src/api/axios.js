import axios from "axios";

const api = axios.create({
  // 🔥 FIXED: Appended /api to match your backend controller routers
  baseURL: "https://school-portal-xqp8.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;