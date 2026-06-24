import axios from "axios";
import useAuthStore from "../store/authStore";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Important: sends cookies with requests
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response interceptor for handling auth errors
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Avoid infinite loops for login and refresh-token requests
            const isAuthRequest = originalRequest.url.includes('/login') ||
                originalRequest.url.includes('/refresh-token') ||
                originalRequest.url.includes('/register');

            if (!isAuthRequest) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then(() => {
                        return axiosClient(originalRequest);
                    }).catch(err => {
                        return Promise.reject(err);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    // Call the refresh-token endpoint
                    // We use axios directly to avoid interceptors on the refresh call
                    await axios.post(`${import.meta.env.VITE_API_URL}/refresh-token`, {}, { withCredentials: true });

                    isRefreshing = false;
                    processQueue(null);

                    // Retry the original request
                    return axiosClient(originalRequest);
                } catch (refreshError) {
                    isRefreshing = false;
                    processQueue(refreshError);

                    const authStore = useAuthStore.getState();
                    authStore.setUser(null);

                    // If refresh fails and we were on a protected page, redirect to login
                    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/home')) {
                        window.location.href = '/login';
                    }
                    return Promise.reject(refreshError);
                }
            } else {
                // If it's an auth request failing with 401, clear state
                const authStore = useAuthStore.getState();
                if (authStore.isAuthenticated) {
                    authStore.setUser(null);
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
