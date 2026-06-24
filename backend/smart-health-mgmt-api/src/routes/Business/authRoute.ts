import { Router } from "express";
import {
    registerBusiness,
    verifyOtp,
    loginBusiness,
    sendOtp,
    forgotPassword,
    resetPassword,
    getMe,
    logoutBusiness,
    updateProfile,
    changePassword,
    resendOtp,
    getNotificationPreferences,
    updateNotificationPreferences,
    logoutAllSessions
} from "../../controllers/Business/authController";
import { uploadFile } from "../../utils/upload";
import { authenticate } from "../../utils/authMiddleware";
import { registerFCMToken, removeFCMToken } from "../../controllers/Business/fcmController";

const router = Router();

router.post("/register", uploadFile.single("businessLicense"), registerBusiness);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginBusiness);
router.post("/send-otp", sendOtp);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logoutBusiness);
router.put("/profile", authenticate, uploadFile.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "businessLicense", maxCount: 1 }
]), updateProfile);
router.post("/change-password", authenticate, changePassword);

// Notification Preferences
router.get("/notification-preferences", authenticate, getNotificationPreferences);
router.put("/notification-preferences", authenticate, updateNotificationPreferences);

// Session Management
router.post("/logout-all-sessions", authenticate, logoutAllSessions);

// 🔔 FCM Push Notification Token
router.post("/fcm-token", authenticate, registerFCMToken);
router.delete("/fcm-token", authenticate, removeFCMToken);

export default router;
