import axios from "axios";
import useAuthStore from "../store/authStore";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/business/auth",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Important: sends cookies with requests
});

// Request interceptor for adding auth header
axiosClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling auth errors
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized - auto logout
        if (error.response?.status === 401) {
            const authStore = useAuthStore.getState();
            // Only logout if user was previously authenticated
            if (authStore.isAuthenticated) {
                authStore.setUser(null);
                // Optionally redirect to login
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
