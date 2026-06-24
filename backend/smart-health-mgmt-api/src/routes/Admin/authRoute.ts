import { Router } from 'express';
import { changePassword, forgotPassword, getProfile, login, logout, register, resetPassword, updateProfile } from '../../controllers/Admin/AuthController';
import { authenticate } from '../../utils/authMiddleware';
import { uploadProfileImage } from '../../utils/upload';
const router = Router();

router.post("/register", register)
router.post("/login", login)
router.post("/logout", logout)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)

router.get("/profile", authenticate, getProfile);
router.post("/change-password", authenticate, changePassword)

router.put("/update-profile", authenticate, uploadProfileImage.single("profileImage"), updateProfile);
export default router;