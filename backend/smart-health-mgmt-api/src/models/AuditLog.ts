import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
    admin: mongoose.Types.ObjectId;
    action: "VIEW" | "UPDATE" | "RESPOND" | "DELETE" | "LOGIN" | "LOGOUT";
    resourceType: "TICKET" | "PATIENT" | "BUSINESS" | "AD" | "COUPON";
    resourceId?: string;
    details: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
    {
        admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
        action: {
            type: String,
            enum: ["VIEW", "UPDATE", "RESPOND", "DELETE", "LOGIN", "LOGOUT"],
            required: true,
        },
        resourceType: {
            type: String,
            enum: ["TICKET", "PATIENT", "BUSINESS", "AD", "COUPON"],
            required: true,
        },
        resourceId: { type: String },
        details: { type: String, required: true },
        ipAddress: { type: String },
        userAgent: { type: String },
    },
    { timestamps: true }
);

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
