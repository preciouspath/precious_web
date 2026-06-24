import axiosClient from "./axiosClient";

export const getSubscriptions = async (params: any) => {
    const response = await axiosClient.get("/subscriptions", { params });
    return response.data;
};

export const updateSubscription = async (id: string, data: any) => {
    const response = await axiosClient.post(`/subscriptions/${id}`, data);
    return response.data;
};

export const resendConfirmation = async (id: string) => {
    const response = await axiosClient.post(`/subscriptions/${id}/resend-confirmation`);
    return response.data;
};

export const createSubscription = async (data: any) => {
    const response = await axiosClient.post("/subscriptions", data);
    return response.data;
};

export const exportSubscriptions = async () => {
    const response = await axiosClient.get("/subscriptions/export", { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'subscriptions.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
};
