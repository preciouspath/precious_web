import mongoose, { Schema, Document } from 'mongoose';

export interface IUserNotification extends Document {
    userId: mongoose.Types.ObjectId;
    userType: 'patient' | 'business' | 'admin';
    title: string;
    message: string;
    type: 'health_alert' | 'doctor_update' | 'system' | 'advertisement' | 'ticket_update' | 'ad_approval' | 'verification';
    read: boolean;
    notificationId?: mongoose.Types.ObjectId;
    metadata?: {
        ticketId?: mongoose.Types.ObjectId;
        adId?: mongoose.Types.ObjectId;
        doctorId?: mongoose.Types.ObjectId;
        prescriptionId?: mongoose.Types.ObjectId;
        [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserNotificationSchema = new Schema<IUserNotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'userType',
        },
        userType: {
            type: String,
            required: true,
            enum: ['patient', 'business', 'admin'],
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['health_alert', 'doctor_update', 'system', 'advertisement', 'ticket_update', 'ad_approval', 'verification'],
        },
        read: {
            type: Boolean,
            default: false,
        },
        notificationId: {
            type: Schema.Types.ObjectId,
            ref: 'Notification',
            default: null,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
UserNotificationSchema.index({ userId: 1, createdAt: -1 });
UserNotificationSchema.index({ userId: 1, read: 1 });
UserNotificationSchema.index({ userType: 1, createdAt: -1 });

export default mongoose.model<IUserNotification>('UserNotification', UserNotificationSchema);
