import { Router } from "express";
import * as FAQController from "../../controllers/Admin/FAQController";
import { authenticate } from "../../utils/authMiddleware";

const router = Router();

// Public routes for active FAQs
router.get("/", FAQController.getFAQs);

// Protected administrative CRUD
router.post("/", authenticate, FAQController.createFAQ);
router.put("/:id", authenticate, FAQController.updateFAQ);
router.delete("/:id", authenticate, FAQController.deleteFAQ);

export default router;
