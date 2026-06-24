import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationSettings extends Document {
    userId: mongoose.Types.ObjectId;
    userType: 'patient' | 'business';
    settings: {
        healthAlerts?: boolean;
        doctorNotifications?: boolean;
        personalizedAds?: boolean;
        adApprovals?: boolean;
        performanceAlerts?: boolean;
        systemUpdates?: boolean;
        ticketUpdates?: boolean;
    };
    updatedAt: Date;
    createdAt: Date;
}

const NotificationSettingsSchema = new Schema<INotificationSettings>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'userType',
        },
        userType: {
            type: String,
            required: true,
            enum: ['patient', 'business'],
        },
        settings: {
            // Patient settings
            healthAlerts: {
                type: Boolean,
                default: true,
            },
            doctorNotifications: {
                type: Boolean,
                default: true,
            },
            personalizedAds: {
                type: Boolean,
                default: true,
            },
            // Business settings
            adApprovals: {
                type: Boolean,
                default: true,
            },
            performanceAlerts: {
                type: Boolean,
                default: true,
            },
            // Common settings
            systemUpdates: {
                type: Boolean,
                default: true,
            },
            ticketUpdates: {
                type: Boolean,
                default: true,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Unique index to ensure one settings document per user
NotificationSettingsSchema.index({ userId: 1, userType: 1 }, { unique: true });

export default mongoose.model<INotificationSettings>('NotificationSettings', NotificationSettingsSchema);
