import { Router } from "express";
import { authenticate } from "../../utils/authMiddleware";
import {
  getFitbitAuthUrl,
  fitbitCallback,
  syncFitbitData,
  getFitbitStatus,
  disconnectFitbit,
} from "../../controllers/Patient/fitbitController";

const router = Router();

router.get("/auth-url", authenticate, getFitbitAuthUrl);
router.post("/callback", authenticate, fitbitCallback);
router.post("/sync", authenticate, syncFitbitData);
router.get("/status", authenticate, getFitbitStatus);
router.post("/disconnect", authenticate, disconnectFitbit);

export default router;
