import { Router } from "express";
import { createCoupon, getCoupons, deactivateCoupon, exportCoupons } from "../../controllers/Admin/CouponController";
import { authenticate } from "../../utils/authMiddleware";

const router = Router();

router.get("/", authenticate, getCoupons);
router.post("/", authenticate, createCoupon);
router.post("/:id/toggle", authenticate, deactivateCoupon);
router.get("/export", authenticate, exportCoupons);

export default router;
