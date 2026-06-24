import { Router } from "express";
import { getBusinessOwners, updateBusinessOwner, deleteBusinessOwner, registerBusinessOwner, getBusinessOwnerById } from "../../controllers/Admin/BusinessController";
import { uploadFile } from "../../utils/upload";

const router = Router();

router.post("/create", uploadFile.single("businessLicense"), registerBusinessOwner);
router.get("/", getBusinessOwners);
router.get("/:id", getBusinessOwnerById);
router.put("/:ownerId", uploadFile.single("businessLicense"), updateBusinessOwner);
router.delete("/:ownerId", deleteBusinessOwner);

export default router;