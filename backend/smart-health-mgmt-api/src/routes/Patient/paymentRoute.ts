import { Router } from "express";
import {
  createIntent,
  createSubscriptionPayment,
  verifySubscriptionPayment,
  confirmPayment,
  getPaymentHistory,
  refundPayment,
} from "../../controllers/Patient/PaymentController";
import { authenticate } from "../../utils/authMiddleware";

const router = Router();

// POST /api/patient/auth/payment/create-intent (generic)
router.post("/create-intent", authenticate, createIntent);

// POST /api/patient/auth/payment/create-subscription-payment
// Main endpoint for subscription upgrades with coupon support
router.post("/create-subscription-payment", authenticate, createSubscriptionPayment);

// POST /api/patient/auth/payment/verify-subscription-payment
router.post("/verify-subscription-payment", authenticate, verifySubscriptionPayment);

// POST /api/patient/auth/payment/confirm
router.post("/confirm", authenticate, confirmPayment);

// GET /api/patient/auth/payment/history
router.get("/history", authenticate, getPaymentHistory);

// POST /api/patient/auth/payment/refund/:paymentId
router.post("/refund/:paymentId", authenticate, refundPayment);

export default router;
