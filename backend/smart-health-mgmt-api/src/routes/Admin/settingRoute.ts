import { Router } from "express";
import { getSettings, updateStripeMode, updateSetting, getContactInquiries, uploadSystemImage } from "../../controllers/Admin/SettingController";
import { authenticate } from "../../utils/authMiddleware";
import { uploadSystemSetting } from "../../utils/upload";

const router = Router();

router.use(authenticate);

router.route("/")
  .get(getSettings)
  .put(updateSetting);

router.post("/upload-image", uploadSystemSetting.single("image"), uploadSystemImage);

router.route("/stripe-mode")
  .put(updateStripeMode);

router.route("/contact-inquiries")
  .get(getContactInquiries);

export default router;
