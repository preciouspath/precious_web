import mongoose, { Schema, Document } from "mongoose";

export interface IFAQ extends Document {
    question: string;
    answer: string;
    category: "General" | "Technical" | "Billing" | "Account";
    status: "active" | "inactive";
    createdAt: Date;
    updatedAt: Date;
}

const faqSchema = new Schema<IFAQ>(
    {
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true },
        category: {
            type: String,
            enum: ["General", "Technical", "Billing", "Account"],
            default: "General",
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    { timestamps: true }
);

export default mongoose.models.FAQ || mongoose.model<IFAQ>("FAQ", faqSchema);
