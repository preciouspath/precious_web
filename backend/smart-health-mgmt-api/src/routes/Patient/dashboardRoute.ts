import { Router } from "express";
import { getDashboardStats, getHealthTrends } from "../../controllers/Patient/dashboardController";
import { updateHealthData } from "../../controllers/Patient/healthController";
import { authenticate } from "../../utils/authMiddleware";

const router = Router();

router.get("/stats", authenticate, getDashboardStats);
router.get("/trends", authenticate, getHealthTrends);
router.post("/save-health-data", authenticate, updateHealthData);

export default router;
