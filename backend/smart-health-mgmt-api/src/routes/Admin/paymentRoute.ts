import { Router } from "express";
import {
  getAllPayments,
  getPaymentById,
  exportPayments,
} from "../../controllers/Admin/PaymentController";
import { authenticate } from "../../utils/authMiddleware";

const router = Router();

// GET /api/payments
router.get("/", authenticate, getAllPayments);

// GET /api/payments/export
router.get("/export", authenticate, exportPayments);

// GET /api/payments/:id
router.get("/:id", authenticate, getPaymentById);

export default router;
