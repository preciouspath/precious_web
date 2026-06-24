import { Router } from "express";
import { getDashboardTiles, getPatientBusinessGraph } from "../../controllers/Admin/dashboardController";


const router = Router();

router.get("/tiles", getDashboardTiles);
router.get("/graph", getPatientBusinessGraph);

export default router;
