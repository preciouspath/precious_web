import { Request, Response } from "express";
import user from "../../models/user";


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

        await user.findByIdAndUpdate(userId, { fcmToken }, { new: true });

        return res.json({
            success: true,
            message: "FCM token registered successfully",
        });
    } catch (error: any) {
        console.error("[FCM] Error registering patient FCM token:", error);
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * Remove FCM token on logout (so stale tokens don't receive pushes)
 * DELETE /api/patient/auth/fcm-token
 */
export const removeFCMToken = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        await user.findByIdAndUpdate(userId, { fcmToken: null });

        return res.json({
            success: true,
            message: "FCM token removed successfully",
        });
    } catch (error: any) {
        console.error("[FCM] Error removing patient FCM token:", error);
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};
