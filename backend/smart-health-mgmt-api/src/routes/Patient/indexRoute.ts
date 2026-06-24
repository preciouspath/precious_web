import { Router } from 'express';
import userRoute from "./userRoute"
import onboardingRoute from "./onboardingRoute"
import termsRoute from "./termsRoute"
import supportRoute from "./supportRoute"
import notificationRoute from "./notificationRoute"
import subscriptionRoute from "./subscriptionRoute"
import dashboardRoute from "./dashboardRoute"
import advertisementRoute from "./advertisementRoute"
import folderRoute from "./folderRoute";
import insuranceRoute from "./insuranceRoute";
import paymentRoute from "./paymentRoute";
import fitbitRoute from "./fitbitRoute";
const router = Router();

router.use("/onboarding", onboardingRoute);
router.use("/terms", termsRoute);
router.use("/auth/notifications", notificationRoute);
router.use("/auth/support", supportRoute);
router.use("/auth/subscription", subscriptionRoute);
router.use("/auth/dashboard", dashboardRoute);
router.use("/auth/ads", advertisementRoute);
router.use("/auth/folders", folderRoute);
router.use("/auth/insurance", insuranceRoute);
router.use("/auth/payment", paymentRoute);
router.use("/auth/fitbit", fitbitRoute);
router.use("/auth", userRoute);
export default router;