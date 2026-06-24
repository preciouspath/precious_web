import axiosClient from "./axiosClient";

export const login = (data: any) => axiosClient.post("/login", data);
export const register = (formData: FormData) => axiosClient.post("/register", formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const sendOtp = (data: { mobile: string }) => axiosClient.post("/send-otp", data);
export const verifyOtp = (data: { email?: string; mobile?: string; otp: string }) =>
    axiosClient.post("/verify-otp", data);
export const forgotPassword = (data: { email: string }) => axiosClient.post("/forgot-password", data);
export const resetPassword = (data: any) => axiosClient.post("/reset-password", data);
export const getMe = () => axiosClient.get("/me");
export const logout = () => axiosClient.post("/logout");
export const resendOtp = (data: { email?: string; mobile?: string }) => axiosClient.post("/resend-otp", data);
export const updateProfile = (data: any) => {
    const isFormData = data instanceof FormData;
    return axiosClient.put("/profile", data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }
    });
};
export const changePassword = (data: any) => axiosClient.post("/change-password", data);

// ------------------- Ad APIs -------------------

export const getAds = (params: any) => axiosClient.get("/ads", { params });
export const createAd = (data: any) => {
    const isFormData = data instanceof FormData;
    return axiosClient.post("/ads/v2", data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }
    });
};
export const getAdStats = () => axiosClient.get("/ads/v2/stats");
export const updateAdStatus = (id: string, status: string) => axiosClient.put(`/ads/v2/${id}/status`, { status });
export const getAdsV2 = (params: any) => axiosClient.get("/ads/v2", { params });
export const getAdDetailsV2 = (id: string) => axiosClient.get(`/ads/v2/${id}`);

// ------------------- Ad Payment APIs (Stripe) -------------------

export const createAdPaymentIntent = (data: { campaignId: string }) =>
    axiosClient.post("/ads/v2/payment/create-intent", data);
export const confirmAdPayment = (data: { campaignId: string; paymentIntentId: string }) =>
    axiosClient.post("/ads/v2/payment/confirm", data);
export const getAdPaymentConfig = () => axiosClient.get("/ads/v2/payment/config");

// ------------------- Security Settings -------------------

export const logoutAllSessions = () => axiosClient.post("/logout-all-sessions");

// ------------------- Support & Tickets -------------------

export const getTickets = () => axiosClient.get("/support/tickets");
export const getTicketById = (id: string) => axiosClient.get(`/support/tickets/${id}`);
