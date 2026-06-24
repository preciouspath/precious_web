import { Request, Response } from "express";
import Ticket from "../../models/Ticket";
import AuditLog from "../../models/AuditLog";
import mongoose from "mongoose";
import notificationService from "../../services/notificationService";

// helper for audit logging
const logAction = async (adminId: any, action: any, resourceId: string, details: string) => {
    try {
        await AuditLog.create({
            admin: adminId,
            action,
            resourceType: "TICKET",
            resourceId,
            details
        });
    } catch (err) {
        console.error("Audit Log Error:", err);
    }
};

export const createTicket = async (req: Request, res: Response) => {
    try {
        const { subject, description, priority = "medium", attachments = [] } = req.body;
        const userId = (req as any).user.id || (req as any).user.sub;
        const userRole = (req as any).user.role; // Extract from token

        const userModel = userRole === "business" ? "BusinessOwner" : "User";

        const ticket = await Ticket.create({
            user: userId,
            userModel,
            userRole,
            subject,
            description,
            priority,
            attachments,
            messages: []
        });

        // Audit Log
        await logAction(
            userId,
            "UPDATE",
            ticket.ticketId,
            `${userRole} raised a support ticket: ${ticket.ticketId}`
        );

        res.json({
            success: true,
            message: "Support ticket submitted successfully. Our team will get back to you shortly.",
            data: ticket
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getAllTickets = async (req: Request, res: Response) => {
    try {
        const {
            status,
            priority,
            userRole,
            search,
            page = "1",
            limit = "10"
        } = req.query;

        const filters: any = {};

        if (status) filters.status = status;
        if (priority) filters.priority = priority;
        if (userRole) filters.userRole = userRole;

        if (search) {
            const regex = { $regex: search as string, $options: "i" };
            filters.$or = [
                { ticketId: regex },
                { subject: regex },
                { description: regex }
            ];
        }

        const pageNumber = Math.max(parseInt(page as string, 10), 1);
        const pageSize = Math.max(parseInt(limit as string, 10), 1);

        const total = await Ticket.countDocuments(filters);
        const tickets = await Ticket.find(filters)
            .populate("user", "fullName ownerName email")
            .sort({ updatedAt: -1 })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .lean();

        // Normalize user name for unified view
        const normalizedTickets = tickets.map((t: any) => ({
            ...t,
            userName: t.user ? (t.user.fullName || t.user.ownerName || "Unknown") : "Unknown"
        }));

        res.json({
            success: true,
            data: normalizedTickets,
            meta: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getTicketById = async (req: Request, res: Response) => {
    try {
        const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({ success: false, message: "Invalid Ticket ID format" });
        }
        const ticket = await Ticket.findById(ticketId)

            .populate("user", "fullName ownerName email")
            .populate("messages.sender", "fullName ownerName email");

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        const ticketObj = ticket.toObject();
        (ticketObj as any).userName = ticketObj.user ? ((ticketObj.user as any).fullName || (ticketObj.user as any).ownerName || "Unknown") : "Unknown";

        // Audit Log for HIPAA (Access Control)
        await logAction(
            (req as any).user.id || (req as any).user.sub,
            "VIEW",
            ticket.ticketId,
            `Admin viewed ticket details for ${ticket.ticketId}`
        );

        res.json({ success: true, data: ticketObj });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const respondToTicket = async (req: Request, res: Response) => {
    try {
        const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({ success: false, message: "Invalid Ticket ID format" });
        }
        const { message, status } = req.body;
        const ticket = await Ticket.findById(ticketId);


        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        const adminId = (req as any).user.id || (req as any).user.sub;

        // Add response to history
        ticket.messages.push({
            sender: adminId,
            senderRole: "admin",
            message,
            createdAt: new Date()
        });

        // Update status if provided
        if (status) {
            ticket.status = status;
        }

        ticket.lastUpdated = new Date();
        await ticket.save();

        // Audit Log
        await logAction(
            adminId,
            "RESPOND",
            ticket.ticketId,
            `Admin responded to ticket ${ticket.ticketId}. Status updated to: ${ticket.status}`
        );

        // Send In-App Notification to User
        const userType = ticket.userRole === "business" ? "business" : "patient";
        await notificationService.notifyTicketResponse(ticket.user as any, userType, ticket.ticketId);

        res.json({ success: true, message: "Response added successfully", data: ticket });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const updateTicketStatus = async (req: Request, res: Response) => {
    try {
        const ticketId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({ success: false, message: "Invalid Ticket ID format" });
        }
        const { status } = req.body;
        const ticket = await Ticket.findById(ticketId);


        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        const adminId = (req as any).user.id || (req as any).user.sub;
        const oldStatus = ticket.status;
        ticket.status = status;
        ticket.lastUpdated = new Date();
        await ticket.save();

        // Audit Log
        await logAction(
            adminId,
            "UPDATE",
            ticket.ticketId,
            `Admin updated ticket ${ticket.ticketId} status from ${oldStatus} to ${status}`
        );

        res.json({ success: true, message: "Status updated successfully", data: ticket });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
