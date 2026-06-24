import { Router } from 'express';
import { addOnboardingScreen, getOnboardingScreens } from '../../controllers/Patient/onboardingController';
import { uploadOnboarding } from '../../utils/upload';
const router = Router();

router.get("/", getOnboardingScreens);
router.post("/", uploadOnboarding.single("image"), addOnboardingScreen);
export default router;