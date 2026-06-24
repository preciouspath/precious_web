import { Request, Response } from "express";
import { BusinessOwner } from "../../models/Business";

/**
 * Register or update FCM token for a business owner
 * Called by React Native mobile app after Firebase messaging setup
 * POST /api/business/auth/fcm-token
 */
export const registerFCMToken = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { fcmToken } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!fcmToken || typeof fcmToken !== "string") {
            return res.status(400).json({ success: false, message: "fcmToken is required" });
        }

        await BusinessOwner.findByIdAndUpdate(userId, { fcmToken }, { new: true });

        return res.json({
            success: true,
            message: "FCM token registered successfully",
        });
    } catch (error: any) {
        console.error("[FCM] Error registering business FCM token:", error);
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * Remove FCM token on logout
 * DELETE /api/business/auth/fcm-token
 */
export const removeFCMToken = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        await BusinessOwner.findByIdAndUpdate(userId, { fcmToken: null });

        return res.json({
            success: true,
            message: "FCM token removed successfully",
        });
    } catch (error: any) {
        console.error("[FCM] Error removing business FCM token:", error);
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
