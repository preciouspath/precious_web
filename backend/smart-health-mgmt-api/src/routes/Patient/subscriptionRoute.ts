import { Router } from "express";
import { validateCoupon } from "../../controllers/Admin/CouponController";
import {
    upgradeSubscription,
    downgradeSubscription,
    getSubscriptionStatus,
    getSubscriptionPlans
} from "../../controllers/Patient/subscriptionController";
import { authenticate } from "../../utils/authMiddleware";

const router = Router();

router.post("/validate-coupon", authenticate, validateCoupon);
router.get("/status", authenticate, getSubscriptionStatus);
router.get("/plans", authenticate, getSubscriptionPlans);
router.post("/upgrade", authenticate, upgradeSubscription);
router.post("/downgrade", authenticate, downgradeSubscription);

export default router;
