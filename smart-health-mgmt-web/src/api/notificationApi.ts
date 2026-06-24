import axiosClient from "./axiosClient";

const BASE_PATH = "/notifications";

export const getNotifications = (params?: any) => axiosClient.get(`${BASE_PATH}`, { params });
export const getUnreadCount = () => axiosClient.get(`${BASE_PATH}/unread-count`);
export const markAsRead = (id: string | number) => axiosClient.put(`${BASE_PATH}/${id}/read`);
export const markAllAsRead = () => axiosClient.put(`${BASE_PATH}/mark-all-read`);
export const getNotificationPreferences = () => axiosClient.get(`${BASE_PATH}/preferences`);
export const updateNotificationPreferences = (data: any) => axiosClient.put(`${BASE_PATH}/preferences`, data);

// 🔔 FCM Token Registration
export const registerFCMToken = (fcmToken: string) =>
  axiosClient.post(`/auth/fcm-token`, { fcmToken });
export const removeFCMToken = () =>
  axiosClient.delete(`/auth/fcm-token`);

