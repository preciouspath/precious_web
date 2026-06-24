import { Router } from "express";
import { getAds, updateAdStatus, getAdStats, createAd } from "../../controllers/Admin/AdvertisementController";
import * as AdminCampaignV2 from "../../controllers/Admin/AdvertisementV2Controller";
import { uploadAdBanner } from "../../utils/upload";

const router = Router();

router.post("/", uploadAdBanner.single("image"), createAd);
router.get("/", getAds);
router.get("/stats", getAdStats);
router.put("/:id/status", updateAdStatus);

// ─── V2 Routes (Smart Ads Platform) ──────────────────────────
router.post("/v2", uploadAdBanner.single("image"), AdminCampaignV2.createCampaignV2);
router.get("/v2", AdminCampaignV2.getAllCampaignsV2);
router.get("/v2/stats", AdminCampaignV2.getPlatformAdStatsV2);
router.put("/v2/:id/status", AdminCampaignV2.moderateCampaignV2);

export default router;
