import { Router } from "express";
import * as SupportController from "../../controllers/supportController";
import * as FAQController from "../../controllers/Admin/FAQController";
import { uploadFile } from "../../utils/upload";
import { authenticate } from "../../utils/authMiddleware";

const router = Router();

router.use(authenticate);

router.post("/", uploadFile.none(), SupportController.raiseTicket); // Legacy support
router.post("/tickets", uploadFile.none(), SupportController.raiseTicket);
router.get("/", SupportController.getMyTickets); // Legacy support
router.get("/tickets", SupportController.getMyTickets);
router.get("/faqs", FAQController.getFAQs);
router.get("/:id", SupportController.getTicketDetails); // Legacy support
router.get("/tickets/:id", SupportController.getTicketDetails);
router.post("/:id/respond", SupportController.respondToTicket); // Legacy support
router.post("/tickets/:id/respond", SupportController.respondToTicket);

export default router;
