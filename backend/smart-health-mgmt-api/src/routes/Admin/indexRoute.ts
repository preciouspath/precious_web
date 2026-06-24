import { Router } from 'express';
import authRoute from "./authRoute"
import patientRoute from "./patientRoute"
import businessRoute from "./businessRoute"
import dashboardRoutes from "./dashboardRoutes"
import ticketRoute from "./ticketRoute"
import faqRoute from "./faqRoute"
import subscriptionRoute from "./subscriptionRoute"
import couponRoute from "./couponRoute"
import advertisementRoute from "./advertisementRoute";
import qrOcrRoute from "./qrOcrRoute";
import { authenticate } from '../../utils/authMiddleware';
import notificationRoute from "./notificationRoute";
import paymentRoute from "./paymentRoute";
import settingRoute from "./settingRoute";
const router = Router();

router.use("/auth", authRoute);
router.use("/patient", authenticate, patientRoute);
router.use("/business", authenticate, businessRoute);
router.use("/dashboard", authenticate, dashboardRoutes);
router.use("/support", authenticate, ticketRoute);
router.use("/faq", faqRoute);
router.use("/subscriptions", authenticate, subscriptionRoute);
router.use("/coupons", authenticate, couponRoute);
router.use("/ads", authenticate, advertisementRoute);


router.use("/notifications", authenticate, notificationRoute);
router.use("/qr-ocr", authenticate, qrOcrRoute);
router.use("/payments", authenticate, paymentRoute);
router.use("/settings", authenticate, settingRoute);
export default router;