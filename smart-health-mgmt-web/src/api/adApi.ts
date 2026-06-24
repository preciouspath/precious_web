import axiosClient from "./axiosClient";

export const getActiveAds = async () => {
    const res = await axiosClient.get("/ads/v2");
    return res.data;
};

export const trackImpression = async (creativeId: string) => {
    const res = await axiosClient.post(`/ads/v2/${creativeId}/impression`, {});
    return res.data;
};

export const trackClick = async (creativeId: string) => {
    const res = await axiosClient.post(`/ads/v2/${creativeId}/click`, {});
    return res.data;
};

