import { Router } from "express";
import * as AdvertisementController from "../../controllers/Patient/AdvertisementController";
import * as AdvertisementV2 from "../../controllers/Patient/AdvertisementV2Controller";
import { authenticate } from "../../utils/authMiddleware";

const router = Router();

router.get("/", authenticate, AdvertisementController.getActiveAds);
router.post("/:id/impression", authenticate, AdvertisementController.trackImpression);
router.post("/:id/click", authenticate, AdvertisementController.trackClick);

// ─── V2 Routes (Smart Ads Platform) ──────────────────────────
router.get("/v2", authenticate, AdvertisementV2.getActiveAdsV2);
router.post("/v2/:creativeId/impression", authenticate, AdvertisementV2.trackImpressionV2);
router.post("/v2/:creativeId/click", authenticate, AdvertisementV2.trackClickV2);

export default router;
