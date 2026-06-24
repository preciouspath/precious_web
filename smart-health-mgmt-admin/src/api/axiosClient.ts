/// <reference types="vite/client" />
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add a request interceptor to attach the token
axiosClient.interceptors.request.use(
  (config) => {
    // You must import the store inside the interceptor or just before using it 
    // to avoid circular dependency issues if the store imports API
    const token = JSON.parse(localStorage.getItem("auth-store") || "{}").state?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;
