// src/routes/Admin/patientRoute.ts
import { Router } from "express";
import {
  getPatients,
  getPatientById,
  resetPatientPassword,
  togglePatientStatus,
  getPatientReports,
  addPatient,
  deletePatient,
  updatePatient,
} from "../../controllers/Admin/PatientController";

const router = Router();

router.post("/create", addPatient)
router.get("/", getPatients);
router.delete("/delete/:id", deletePatient)
router.put("/update/:id", updatePatient)
router.get("/:id", getPatientById);
router.post("/:id/reset-password", resetPatientPassword);
router.put("/:id/status", togglePatientStatus);
router.get("/:id/reports", getPatientReports);

export default router;
