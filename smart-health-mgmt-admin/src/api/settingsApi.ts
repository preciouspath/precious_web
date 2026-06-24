import axiosClient from "./axiosClient";

export const getSettings = async () => {
    const response = await axiosClient.get("/settings");
    return response.data.data;
};

export const updateSetting = async (data: { key: string; value: any; description?: string }) => {
    const response = await axiosClient.put("/settings", data);
    return response.data.data;
};

export const getPublicSettings = async (keys: string) => {
    const response = await axiosClient.get(`/patient/auth/support/contact-info?keys=${keys}`);
    return response.data.data;
};

export const uploadSettingImage = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await axiosClient.post("/settings/upload-image", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data.data;
};
