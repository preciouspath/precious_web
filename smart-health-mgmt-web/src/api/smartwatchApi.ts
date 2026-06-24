import axiosClient from "./axiosClient";

export const updateSmartwatchStatus = (smartwatchData: any) => {
    return axiosClient.post("/update-profile", { smartwatch: smartwatchData });
};

// Function to fetch latest device data from backend
export const syncSmartwatchData = async () => {
    try {
        const response = await axiosClient.get("/me");
        if (response.data?.success) {
            const health = response.data.data.healthProfile || {};
            const smartwatch = health.smartwatch || {};
            return {
                success: true,
                lastSync: smartwatch.lastSync ? new Date(smartwatch.lastSync) : new Date(),
                data: smartwatch.data || {
                    heartRate: "--",
                    steps: "0",
                    sleep: "--",
                    bloodOxygen: "--",
                    bloodPressure: "--"
                }
            };
        }
        return { success: false, lastSync: new Date(), data: null };
    } catch (error) {
        console.error("Sync error:", error);
        return { success: false, lastSync: new Date(), data: null };
    }
};

