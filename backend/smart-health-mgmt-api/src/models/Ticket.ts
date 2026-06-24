import mongoose, { Schema, Document } from "mongoose";

export interface ITicketMessage {
    sender: mongoose.Types.ObjectId;
    senderRole: "admin" | "business" | "patient" | "user";
    message: string;
    attachments?: string[];
    createdAt: Date;
}

export interface ITicket extends Document {
    ticketId: string;
    user: mongoose.Types.ObjectId;
    userModel: "User" | "BusinessOwner";
    userRole: "business" | "patient" | "admin" | "user";
    subject: string;
    description: string;
    priority: "low" | "medium" | "high";
    status: "open" | "in-progress" | "resolved" | "closed";
    attachments: string[];
    messages: ITicketMessage[];
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
    {
        ticketId: { type: String, unique: true, required: true },
        user: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: "userModel"
        },
        userModel: {
            type: String,
            required: true,
            enum: ["User", "BusinessOwner"],
            default: "User"
        },
        userRole: { type: String, enum: ["business", "patient", "admin", "user"], required: true },
        subject: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },
        status: {
            type: String,
            enum: ["open", "in-progress", "resolved", "closed"],
            default: "open",
        },
        attachments: [{ type: String }],
        messages: [
            {
                sender: { type: Schema.Types.ObjectId, ref: "User" },
                senderRole: { type: String, enum: ["admin", "business", "patient", "user"] },
                message: { type: String, required: true },
                attachments: [{ type: String }],
                createdAt: { type: Date, default: Date.now },
            },
        ],
        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Pre-save hook to generate ticket ID if not present
ticketSchema.pre("validate", async function (next) {
    if (this.isNew && !this.ticketId) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const random = Math.floor(1000 + Math.random() * 9000);
        this.ticketId = `TKT-${year}${month}-${random}`;
    }
    next();
});

export default mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", ticketSchema);
