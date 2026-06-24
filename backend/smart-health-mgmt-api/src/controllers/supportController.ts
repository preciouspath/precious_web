import { Request, Response } from "express";
import Ticket from "../models/Ticket";

export const raiseTicket = async (req: Request, res: Response) => {
    try {
        const { subject, description, priority = "medium" } = req.body;
        const userId = (req as any).user.id || (req as any).user.sub;
        const userRole = (req as any).user.role;
        const userModel = userRole === "business" ? "BusinessOwner" : "User";

        const attachments: string[] = [];
        if (req.file) {
            attachments.push(`/uploads/tickets/${req.file.filename}`);
        }

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

        res.status(201).json({
            success: true,
            message: "Support ticket raised successfully",
            data: ticket
        });
    } catch (err) {
        console.error("Raise Ticket Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getMyTickets = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id || (req as any).user.sub;

        const tickets = await Ticket.find({ user: userId })
            .sort({ updatedAt: -1 });

        res.json({
            success: true,
            data: tickets
        });
    } catch (err) {
        console.error("Get My Tickets Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const getTicketDetails = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id || (req as any).user.sub;
        const ticket = await Ticket.findOne({ _id: req.params.id, user: userId })
            .populate("messages.sender", "fullName ownerName profileImage");

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        res.json({ success: true, data: ticket });
    } catch (err) {
        console.error("Get Ticket Details Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const respondToTicket = async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        const userId = (req as any).user.id || (req as any).user.sub;
        const userRole = (req as any).user.role;

        const ticket = await Ticket.findOne({ _id: req.params.id, user: userId });

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        if (ticket.status === "closed") {
            return res.status(400).json({ success: false, message: "Cannot respond to a closed ticket" });
        }

        const attachments: string[] = [];
        if (req.file) {
            attachments.push(`/uploads/tickets/${req.file.filename}`);
        }

        ticket.messages.push({
            sender: userId,
            senderRole: userRole as any,
            message,
            attachments: attachments.length > 0 ? attachments : undefined,
            createdAt: new Date()
        });

        ticket.lastUpdated = new Date();
        // If it was resolved, reopen it? Or just keep it as is. 
        // Typically, user response keeps it open or resolved.

        await ticket.save();

        res.json({ success: true, message: "Response added successfully", data: ticket });
    } catch (err) {
        console.error("Respond to Ticket Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
