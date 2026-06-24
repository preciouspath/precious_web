import { Router } from "express";
import {
  addBusinessOwner,
  getBusinessOwners,
  getBusinessOwner,
  updateBusinessOwner,
  deleteBusinessOwner,
  changeBusinessStatus,
} from "../../controllers/Business/userController";

const router = Router();

router.get("/", getBusinessOwners);
router.get("/:id", getBusinessOwner);
router.post("/", addBusinessOwner);
router.put("/:id", updateBusinessOwner);
router.delete("/:id", deleteBusinessOwner);
router.patch("/:id/status", changeBusinessStatus);

export default router;
