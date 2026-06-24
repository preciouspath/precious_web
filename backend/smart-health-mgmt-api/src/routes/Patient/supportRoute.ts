import { Router } from "express";
import * as SupportController from "../../controllers/supportController";
import * as FAQController from "../../controllers/Admin/FAQController";
import * as ContactController from "../../controllers/Patient/contactController";
import { uploadFile, uploadTicketAttachment } from "../../utils/upload";
import { authenticate } from "../../utils/authMiddleware";

const router = Router();

// Public Routes (Accessible without Authentication)
router.get("/contact-info", ContactController.getSupportInfo);
router.post("/contact", ContactController.submitContactInquiry);
router.get("/faqs", FAQController.getFAQs);

// Protected Routes (Require Authentication)
router.use(authenticate);

router.post("/", uploadTicketAttachment.single("attachment"), SupportController.raiseTicket); // Legacy support
router.post("/tickets", uploadTicketAttachment.single("attachment"), SupportController.raiseTicket);
router.get("/", SupportController.getMyTickets); // Legacy support
router.get("/tickets", SupportController.getMyTickets);
router.get("/:id", SupportController.getTicketDetails); // Legacy support
router.get("/tickets/:id", SupportController.getTicketDetails);
router.post("/:id/respond", uploadTicketAttachment.single("attachment"), SupportController.respondToTicket); // Legacy support
router.post("/tickets/:id/respond", uploadTicketAttachment.single("attachment"), SupportController.respondToTicket);

export default router;
