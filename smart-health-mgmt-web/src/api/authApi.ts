import axiosClient from "./axiosClient";

// Public auth APIs
export const login = async (data: { email: string; password: string }) => {
    const response = await axiosClient.post("/login", data);
    return response.data;
};

export const register = async (data: any) => {
    const response = await axiosClient.post("/create", data);
    return response.data;
};

export const sendOtp = async (data: { email?: string; mobileNumber?: string; countryCode?: string }) => {
    const response = await axiosClient.post("/send-otp", data);
    return response.data;
};

export const forgotPassword = async (data: { email: string }) => {
    const response = await axiosClient.post("/forgot-password", data);
    return response.data;
};

export const verifyOtp = async (data: { mobileNumber?: string; email?: string; otp: string; countryCode?: string }) => {
    const response = await axiosClient.post("/verify-otp", data);
    return response.data;
};

export const resetPassword = async (data: { userId: string; newPassword: string }) => {
    const response = await axiosClient.post("/reset-password", data);
    return response.data;
};

// Protected APIs (use cookies automatically)
export const getMe = async () => {
    const response = await axiosClient.get("/me");
    return response.data;
};

export const logout = async () => {
    const response = await axiosClient.post("/logout");
    return response.data;
};

export const updateProfileApi = (data: any) => axiosClient.post("/update-profile", data);

// Doctor Management
export const addDoctorApi = (data: any) => axiosClient.post("/add-doctor", data);
export const getDoctorsApi = () => axiosClient.get("/doctors");
export const deleteDoctorApi = (doctorId: string) => axiosClient.delete(`/doctor/${doctorId}`);
export const toggleDoctorFavoriteApi = (doctorId: string) => axiosClient.put(`/doctor/${doctorId}/toggle-favorite`);
export const updateDoctorApi = (doctorId: string, data: any) => axiosClient.put(`/doctor/${doctorId}`, data);

// Get medical reports
export const getReportsApi = (params?: {
    uploadedBy?: string;
    folderId?: string | null;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    fileType?: string;
    startDate?: string;
    endDate?: string;
}) => axiosClient.get("/reports", { params });
export const getReportCountsApi = () => axiosClient.get("/report-counts");
export const moveReportApi = (reportId: string, folderId: string | null) => axiosClient.put(`/report/${reportId}/move`, { folderId });

export const uploadImage = async (formData: FormData) => {
    const response = await axiosClient.post("/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

export const removeImage = async () => {
    const response = await axiosClient.post("/remove-image");
    return response.data;
};

export const changePassword = async (data: any) => {
    const response = await axiosClient.post("/change-password", data);
    return response.data;
};

// Public API for QR-based access
export const getUser = async (userId: string) => {
    const response = await axiosClient.get(`/user/${userId}`);
    return response.data;
};

export const deleteAccountApi = async () => {
    const response = await axiosClient.delete("/delete-account");
    return response.data;
};
