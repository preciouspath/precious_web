import { Router } from 'express';
import businessRoute from "./userRoute"
import authRoute from "./authRoute"
import ticketRoute from "./ticketRoute"
import advertisementRoute from "./advertisementRoute"
import notificationRoute from "./notificationRoute"
import { authenticate } from "../../utils/authMiddleware";
const router = Router();

router.use("/business", businessRoute);
router.use("/auth/support", ticketRoute);
router.use("/auth/ads", authenticate, advertisementRoute);
router.use("/auth/notifications", authenticate, notificationRoute);
router.use("/auth", authRoute);
export default router;