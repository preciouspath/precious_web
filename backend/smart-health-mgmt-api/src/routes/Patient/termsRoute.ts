import { Router } from 'express';
import { getTermsUrl } from '../../controllers/Patient/termsController';

const router = Router();

// Public route - no authentication required
router.get('/', getTermsUrl);

export default router;
