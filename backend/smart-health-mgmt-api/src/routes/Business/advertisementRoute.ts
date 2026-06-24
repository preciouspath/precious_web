import { Router } from "express";
import { getAds, updateAdStatus, getAdStats, createAd } from "../../controllers/Business/AdvertisementController";
import * as CampaignV2 from "../../controllers/Business/AdvertisementV2Controller";
import * as AdPayment from "../../controllers/Business/adPaymentController";
import { uploadFile, uploadAdBanner } from "../../utils/upload";

const router = Router();

router.post("/", uploadFile.single("image"), createAd);
router.get("/", getAds);
router.get("/stats", getAdStats);
router.put("/:id/status", updateAdStatus);

// ─── V2 Routes (Smart Ads Platform) ──────────────────────────
router.post("/v2", uploadAdBanner.single("image"), CampaignV2.createCampaignV2);
router.get("/v2", CampaignV2.getCampaignsV2);
router.get("/v2/stats", CampaignV2.getAdStatsV2);
router.get("/v2/:id", CampaignV2.getCampaignDetailsV2);
router.put("/v2/:id/status", CampaignV2.updateCampaignStatusV2);

// ─── V2 Payment Routes (Stripe) ─────────────────────────────
router.post("/v2/payment/create-intent", AdPayment.createAdPaymentIntent);
router.post("/v2/payment/confirm", AdPayment.confirmAdPayment);
router.get("/v2/payment/config", AdPayment.getAdPaymentConfig);

export default router;

