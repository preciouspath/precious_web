import { Router } from "express";
import {
    addPatient,
    loginPatient,
    sendOtp,
    verifyOtp,
    updateProfile,
    resetPassword,
    getUser,
    getMe,
    logout,
    uploadProfileImage as uploadProfileImageController,
    removeProfileImage,
    changePassword,
    doctorUploadDocument,
    transcribeDoctorAudio,
    addTrustedDoctor,
    getTrustedDoctors,
    deleteTrustedDoctor,
    toggleTrustedDoctorFavorite,
    updateTrustedDoctor,
    getReports,
    deleteReport,
    refreshToken,
    forgotPassword,
    moveReport,
    deleteAccount,
    getReportCounts,
    updateSmartwatchData,
    generateQuestions
} from "../../controllers/Patient/userController";
import { registerFCMToken, removeFCMToken } from "../../controllers/Patient/fcmController";
import { authenticate } from "../../utils/authMiddleware";
import { uploadProfileImage, uploadMedicalReport } from "../../utils/upload";

const router = Router();

// Public routes
router.post("/create", addPatient);
router.post("/login", loginPatient);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/user/:id", getUser); // Public for QR upload
router.post("/transcribe-audio", uploadMedicalReport.single('audio'), transcribeDoctorAudio);
router.post("/upload-document", uploadMedicalReport.fields([{ name: 'file', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), doctorUploadDocument); // Public for QR scan upload
router.post("/generate-questions", generateQuestions);

// Doctor Management
router.post("/add-doctor", authenticate, addTrustedDoctor);
router.get("/doctors", authenticate, getTrustedDoctors);
router.delete("/doctor/:doctorId", authenticate, deleteTrustedDoctor);
router.put("/doctor/:doctorId/toggle-favorite", authenticate, toggleTrustedDoctorFavorite);
router.put("/doctor/:doctorId", authenticate, updateTrustedDoctor);

// Reports
router.get("/reports", authenticate, getReports);
router.get("/report-counts", authenticate, getReportCounts);
router.delete("/report/:reportId", authenticate, deleteReport);
router.put("/report/:reportId/move", authenticate, moveReport);

// Protected routes (require authentication)
router.get("/me", authenticate, getMe);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticate, logout);
// router.post("/update-profile", authenticate, updateProfile);
router.post(
    "/update-profile",
    authenticate,
    uploadProfileImage.single("image"),
    updateProfile
);
router.post("/upload-image", authenticate, uploadProfileImage.single('image'), uploadProfileImageController);
router.post("/remove-image", authenticate, removeProfileImage);
router.post("/change-password", authenticate, changePassword);
router.delete("/delete-account", authenticate, deleteAccount);
router.post("/smartwatch-data", authenticate, updateSmartwatchData);

// 🔔 FCM Push Notification Token
router.post("/fcm-token", authenticate, registerFCMToken);
router.delete("/fcm-token", authenticate, removeFCMToken);

export default router;
