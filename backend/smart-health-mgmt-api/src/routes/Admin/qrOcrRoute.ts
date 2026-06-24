import { Router } from "express";
import { getMonitoringLogs, toggleReportFlag, uploadOcrDocument, translateOcrText } from "../../controllers/Admin/QrOcrController";
import { authenticate } from "../../utils/authMiddleware";
import { uploadMedicalReport } from "../../utils/upload";

const router = Router();

// QR & OCR Monitoring (Require Admin Auth)
router.get("/", authenticate, getMonitoringLogs);
router.put("/:reportId/toggle-flag", authenticate, toggleReportFlag);

// OCR Upload & Translation
router.post("/upload", authenticate, uploadMedicalReport.single("file"), uploadOcrDocument);
router.post("/translate", authenticate, translateOcrText);

export default router;

