import axiosClient from "./axiosClient";

export const getNotifications = async ({ page, limit, type }: any) => {
    const res = await axiosClient.get("/notifications", { params: { page, limit, type } });
    return res.data;
};

export const createNotification = async (data: any) => {
    const res = await axiosClient.post("/notifications", data);
    return res.data;
};

export const cancelNotification = async (id: string) => {
    const res = await axiosClient.post(`/notifications/${id}/cancel`);
    return res.data;
};

export const getNotificationStats = async () => {
    const res = await axiosClient.get("/notifications/stats");
    return res.data;
};

export const deleteNotification = async (id: string) => {
    const res = await axiosClient.delete(`/notifications/${id}`);
    return res.data;
};

export const updateNotification = async ({ id, data }: { id: string; data: any }) => {
    const res = await axiosClient.put(`/notifications/${id}`, data);
    return res.data;
};
