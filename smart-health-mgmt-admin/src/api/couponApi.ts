import axiosClient from "./axiosClient";

export const getCoupons = async (params: any) => {
    const response = await axiosClient.get("/coupons", { params });
    return response.data;
};

export const createCoupon = async (data: any) => {
    const response = await axiosClient.post("/coupons", data);
    return response.data;
};

export const toggleCoupon = async (id: string) => {
    const response = await axiosClient.post(`/coupons/${id}/toggle`);
    return response.data;
};

export const exportCoupons = async () => {
    const response = await axiosClient.get("/coupons/export", { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'coupons.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
};
