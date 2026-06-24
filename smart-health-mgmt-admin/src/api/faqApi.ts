import axiosClient from "./axiosClient";

export interface FAQ {
    _id: string;
    question: string;
    answer: string;
    category: "General" | "Technical" | "Billing" | "Account";
    status: "active" | "inactive";
    createdAt: string;
    updatedAt: string;
}

export const getFAQs = async (admin = false) => {
    const res = await axiosClient.get("/faq", { params: { admin } });
    return res.data.data;
};

export const createFAQ = async (data: Partial<FAQ>) => {
    const res = await axiosClient.post("/faq", data);
    return res.data;
};

export const updateFAQ = async (id: string, data: Partial<FAQ>) => {
    const res = await axiosClient.put(`/faq/${id}`, data);
    return res.data;
};

export const deleteFAQ = async (id: string) => {
    const res = await axiosClient.delete(`/faq/${id}`);
    return res.data;
};
