import { Schema, model } from "mongoose";

export enum NotificationType {
    HEALTH_ALERT = "HEALTH_ALERT",
    SYSTEM_UPDATE = "SYSTEM_UPDATE",
    PROMOTION = "PROMOTION",
}

export enum TargetAudience {
    ALL = "ALL",
    PATIENTS = "PATIENTS",
    BUSINESS = "BUSINESS",
    SEGMENT = "SEGMENT",
}

export enum NotificationStatus {
    SCHEDULED = "Scheduled",
    SENT = "Sent",
    CANCELED = "Canceled",
}

const notificationSchema = new Schema(
    {
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: Object.values(NotificationType),
            required: true,
        },
        targetAudience: {
            type: String,
            enum: Object.values(TargetAudience),
            required: true,
        },
        // Optional filters for Segment
        filters: {
            location: String,
            subscriptionType: String,
            healthCondition: String, // Regex or specific condition
        },
        scheduledFor: { type: Date, default: null }, // If null, send immediately
        sentAt: { type: Date, default: null },

        status: {
            type: String,
            enum: Object.values(NotificationStatus),
            default: NotificationStatus.SCHEDULED,
        },

        stats: {
            sent: { type: Number, default: 0 },
            delivered: { type: Number, default: 0 },
            opened: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

export const Notification = model("Notification", notificationSchema);
