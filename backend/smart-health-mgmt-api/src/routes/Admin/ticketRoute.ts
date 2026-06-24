import { Router } from "express";
import * as TicketController from "../../controllers/Admin/TicketController";

const router = Router();

router.get("/", TicketController.getAllTickets);
router.post("/", TicketController.createTicket);
router.get("/:id", TicketController.getTicketById);
router.post("/:id/respond", TicketController.respondToTicket);
router.put("/:id/status", TicketController.updateTicketStatus);

export default router;
