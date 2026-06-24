import axiosClient from "./axiosClient";

const BASE_PATH = "/notifications";

export const getNotifications = () => axiosClient.get(`${BASE_PATH}`);
export const getUnreadCount = () => axiosClient.get(`${BASE_PATH}/unread-count`);
export const markAsRead = (id: string) => axiosClient.put(`${BASE_PATH}/${id}/read`);
export const markAllAsRead = () => axiosClient.put(`${BASE_PATH}/mark-all-read`);
export const getNotificationPreferences = () => axiosClient.get(`${BASE_PATH}/preferences`);
export const updateNotificationPreferences = (data: any) => axiosClient.put(`${BASE_PATH}/preferences`, data);
