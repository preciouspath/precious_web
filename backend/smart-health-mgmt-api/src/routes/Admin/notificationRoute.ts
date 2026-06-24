import { Router } from "express";
import { createNotification, getNotifications, cancelNotification, getNotificationStats, deleteNotification, updateNotification } from "../../controllers/Admin/NotificationController";

const router = Router();

router.post("/", createNotification);
router.get("/", getNotifications);
router.get("/stats", getNotificationStats);
router.post("/:id/cancel", cancelNotification);
router.delete("/:id", deleteNotification);
router.put("/:id", updateNotification);

export default router;
