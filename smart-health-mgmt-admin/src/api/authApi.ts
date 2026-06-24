import axiosClient from "./axiosClient";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

interface PatientData {
  fullName: string;
  email: string;
  password?: string;
  mobileNumber?: string;
  dateOfBirth: string;
  gender: string;
  healthProfile?: {
    height?: number;
    weight?: number;
    bp?: string;
    bloodGroup?: string;
    healthConditions?: string;
    syncSmartWatch?: boolean;
  };
}

interface BusinessData {
  owner: string;
  business: string;
  email: string;
  phone: string;
  location?: string;
  businessType?: string;
  status?: string;
}

export interface DashboardTiles {
  totalPatients: number;
  activePatients: number;
  totalBusiness: number;
  pendingBusinessKYC: number;
  openTickets: number;
  totalAds: number;
}


export interface DashboardGraphPoint {
  month: string;
  patients: number;
  business: number;
}

// ------------------- Auth APIs -------------------

export const login = async (data: LoginData) => {
  const res = await axiosClient.post("/auth/login", data);
  return res.data;
};

export const register = async (data: RegisterData) => {
  const res = await axiosClient.post("/auth/register", data);
  return res.data;
};

export const forgotPassword = async ({ email }: { email: string }) => {
  const res = await axiosClient.post("/auth/forgot-password", { email });
  return res.data;
};

export const resetPassword = async ({ token, password }: any) => {
  const res = await axiosClient.post("/auth/reset-password", { token, password });
  return res.data;
};

export const getProfile = async () => {
  const { data } = await axiosClient.get("/auth/profile");
  return data.user;
};

export const changePassword = (data: { currentPassword: string; newPassword: string }) => {
  return axiosClient.post("/auth/change-password", data);
};

export const updateProfile = async (formData: FormData) => {
  const res = await axiosClient.put("/auth/update-profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data.user;
};

export const logout = async () => {
  const res = await axiosClient.post("/auth/logout");
  return res.data;
};

// ------------------- Patient APIs -------------------

export const createPatient = async (data: PatientData) => {
  const res = await axiosClient.post("/patient/create", data);
  return res.data;
};

export const getPatients = async ({ page, limit, search }: { page: number; limit: number; search: string }) => {
  const res = await axiosClient.get("/patient", { params: { page, limit, search } });
  return res.data;
};
export const getPatientById = async (id: string) => {
  const res = await axiosClient.get(`/patient/${id}`);
  return res.data.data;
};

export const updatePatient = async (patientId: string, data: Partial<PatientData>) => {
  const res = await axiosClient.put(`/patient/update/${patientId}`, data);
  if (!res.data.success) throw new Error("Failed to update patient");
  return res.data;
};

export const deletePatient = async (patientId: string) => {
  const res = await axiosClient.delete(`/patient/delete/${patientId}`);
  if (!res.data.success) throw new Error("Failed to delete patient");
  return res.data;
};

export const togglePatientStatus = async (patientId: string) => {
  const res = await axiosClient.put(`/patient/${patientId}/status`);
  if (!res.data.success) throw new Error("Failed to update patient status");
  return res.data;
};

// ------------------- Business APIs -------------------

export const createBusinessOwner = async (data: BusinessData | FormData) => {
  const config = data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
  const res = await axiosClient.post("/business/create", data, config);
  return res.data;
};

export const getBusinessOwners = async ({ page, limit, search }: { page: number; limit: number; search?: string }) => {
  const res = await axiosClient.get("/business", { params: { page, limit, search } });
  return res.data;
};

export const getBusinessOwnerById = async (id: string) => {
  const res = await axiosClient.get(`/business/${id}`);
  return res.data.data;
};

export const updateBusinessOwner = async (businessId: string, data: Partial<BusinessData> | FormData) => {
  const config = data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
  const res = await axiosClient.put(`/business/${businessId}`, data, config);
  if (!res.data.success) throw new Error("Failed to update business");
  return res.data;
};

export const deleteBusinessOwner = async (businessId: string) => {
  const res = await axiosClient.delete(`/business/${businessId}`);
  if (!res.data.success) throw new Error("Failed to delete business");
  return res.data;
};

export const toggleBusinessStatus = async (businessId: string) => {
  const res = await axiosClient.put(`/business/${businessId}/status`);
  if (!res.data.success) throw new Error("Failed to update business status");
  return res.data;
};



// ------------------- Dashboard APIs -------------------

export const getDashboardTiles = async (): Promise<DashboardTiles> => {
  const res = await axiosClient.get("/dashboard/tiles");
  return res.data.data;
};

export const getDashboardUserGraph = async (
  year?: number
): Promise<DashboardGraphPoint[]> => {
  const res = await axiosClient.get("/dashboard/graph", {
    params: year ? { year } : {},
  });
  return res.data.data;
};

// ------------------- Ad APIs -------------------

export const getAds = async ({ page, limit, search, status, ownerId }: any) => {
  const res = await axiosClient.get("/ads/v2", { params: { page, limit, search, status, ownerId } });
  return res.data;
};

export const updateAdStatus = async (id: string, status: string, rejectionReason?: string, adminNotes?: string) => {
  const res = await axiosClient.put(`/ads/v2/${id}/status`, { status, rejectionReason, adminNotes });
  return res.data;
};

export const createAd = async (data: any) => {
  const config = data instanceof FormData
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : {};

  const res = await axiosClient.post("/ads/v2", data, config);
  return res.data;
};

export const getAdStats = async () => {
  const res = await axiosClient.get("/ads/v2/stats");
  return res.data.data;
}

export const getAdsV2 = async (params: any) => {
  const res = await axiosClient.get("/ads/v2", { params });
  return res.data;
};

export const getAdDetailsV2 = async (id: string) => {
  const res = await axiosClient.get(`/ads/v2/${id}`);
  return res.data;
};

// ------------------- QR & OCR APIs -------------------

export const getQrOcrMonitoringLogs = async (params: { search?: string; page?: number; limit?: number }) => {
  const res = await axiosClient.get("/qr-ocr", { params });
  return res.data;
};

export const toggleFlagApi = async (reportId: string) => {
  const res = await axiosClient.put(`/qr-ocr/${reportId}/toggle-flag`);
  return res.data;
};

export const uploadOcrDocument = async (file: File, patientId?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (patientId) formData.append("patientId", patientId);

  const res = await axiosClient.post("/qr-ocr/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const translateOcrText = async (text: string, targetLanguage: string) => {
  const res = await axiosClient.post("/qr-ocr/translate", {
    text,
    targetLanguage
  });
  return res.data;
};

// ------------------- System Settings APIs -------------------

export const getSettings = async () => {
  const res = await axiosClient.get("/settings");
  return res.data.data;
};

export const updateStripeMode = async (mode: string) => {
  const res = await axiosClient.put("/settings/stripe-mode", { mode });
  return res.data.data;
};