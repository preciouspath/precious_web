import axiosClient from "./axiosClient";

export const getDashboardStats = () => {
    return axiosClient.get("/dashboard/stats");
};

export const getHealthTrends = (period: 'weekly' | 'monthly') => {
    return axiosClient.get(`/dashboard/trends?period=${period}`);
};
