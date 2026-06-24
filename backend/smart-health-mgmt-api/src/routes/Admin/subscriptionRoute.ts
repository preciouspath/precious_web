import { Router } from "express";
import { getSubscriptions, updateSubscription, resendConfirmation, addSubscription, exportSubscriptions } from "../../controllers/Admin/SubscriptionController";
import { authenticate } from "../../utils/authMiddleware";

const router = Router();

router.get("/", authenticate, getSubscriptions);
router.post("/", authenticate, addSubscription);
router.get("/export", authenticate, exportSubscriptions);
router.post("/:id", authenticate, updateSubscription);
router.post("/:id/resend-confirmation", authenticate, resendConfirmation);

export default router;
