import { Router } from "express";
import { authenticate } from "../../utils/authMiddleware";
import { uploadInsurance } from "../../utils/upload";
import {
    addInsurance,
    getInsurances,
    updateInsurance,
    deleteInsurance
} from "../../controllers/Patient/insuranceController";

const router = Router();

router.get("/", authenticate, getInsurances);
router.post("/add", authenticate, uploadInsurance.single("document"), addInsurance);
router.put("/update/:id", authenticate, uploadInsurance.single("document"), updateInsurance);
router.delete("/:id", authenticate, deleteInsurance);

export default router;
