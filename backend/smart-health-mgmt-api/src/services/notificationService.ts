import UserNotification from '../models/UserNotification';
import NotificationSettings from '../models/NotificationSettings';
import mongoose from 'mongoose';
import { sendNotification } from './pushnotificationService';
import UserModel from '../models/user';
import { BusinessOwner } from '../models/Business';

interface CreateNotificationParams {
    userId: mongoose.Types.ObjectId | string;
    userType: 'patient' | 'business' | 'admin';
    title: string;
    message: string;
    type: 'health_alert' | 'doctor_update' | 'system' | 'advertisement' | 'ticket_update' | 'ad_approval' | 'verification';
    metadata?: any;
}

/**
 * Resolve FCM token for a user based on their type
 */
const getFCMToken = async (
    userId: mongoose.Types.ObjectId | string,
    userType: 'patient' | 'business' | 'admin'
): Promise<string | null> => {
    try {
        if (userType === 'patient') {
            const u = await UserModel.findById(userId).select('fcmToken');
            return (u as any)?.fcmToken || null;
        } else if (userType === 'business') {
            const b = await BusinessOwner.findById(userId).select('fcmToken');
            return (b as any)?.fcmToken || null;
        }
        return null;
    } catch {
        return null;
    }
};

/**
 * Create a notification for a user (DB record + optional FCM push)
 */
export const createNotification = async (params: CreateNotificationParams) => {
    try {
        const notification = await UserNotification.create({
            userId: params.userId,
            userType: params.userType,
            title: params.title,
            message: params.message,
            type: params.type,
            metadata: params.metadata || {},
        });

        // 🔔 Send FCM push if token exists (non-blocking)
        const fcmToken = await getFCMToken(params.userId, params.userType);
        if (fcmToken) {
            sendNotification({ token: fcmToken, title: params.title, body: params.message })
                .then(msgId => console.log(`[FCM] Push sent: ${msgId}`))
                .catch(err => console.warn(`[FCM] Push failed (non-critical): ${err.message}`));
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

/**
 * Check if user has notification type enabled
 */
export const isNotificationEnabled = async (
    userId: mongoose.Types.ObjectId | string,
    userType: 'patient' | 'business',
    notificationType: string
): Promise<boolean> => {
    try {
        const settings = await NotificationSettings.findOne({ userId, userType });

        if (!settings) {
            // Default to true if no settings exist
            return true;
        }

        // Map notification types to settings keys
        const typeToSettingMap: { [key: string]: keyof typeof settings.settings } = {
            'health_alert': 'healthAlerts',
            'doctor_update': 'doctorNotifications',
            'advertisement': 'personalizedAds',
            'ad_approval': 'adApprovals',
            'system': 'systemUpdates',
            'ticket_update': 'ticketUpdates',
        };

        const settingKey = typeToSettingMap[notificationType];
        if (!settingKey) {
            return true; // Default to enabled for unknown types
        }

        return settings.settings[settingKey] ?? true;
    } catch (error) {
        console.error('Error checking notification settings:', error);
        return true; // Default to enabled on error
    }
};

/**
 * Create notification with settings check
 */
export const createNotificationIfEnabled = async (params: CreateNotificationParams) => {
    try {
        // Skip settings check for admins (always send)
        if (params.userType === 'admin') {
            return await createNotification(params);
        }

        const isEnabled = await isNotificationEnabled(
            params.userId,
            params.userType as 'patient' | 'business',
            params.type
        );

        if (isEnabled) {
            return await createNotification(params);
        }

        return null;
    } catch (error) {
        console.error('Error in createNotificationIfEnabled:', error);
        throw error;
    }
};

/**
 * Send ad approval notification
 */
export const notifyAdApproval = async (
    businessOwnerId: mongoose.Types.ObjectId | string,
    adTitle: string,
    adId: mongoose.Types.ObjectId | string
) => {
    return await createNotificationIfEnabled({
        userId: businessOwnerId,
        userType: 'business',
        title: 'Ad Approved',
        message: `Your ad "${adTitle}" has been approved and is now live.`,
        type: 'ad_approval',
        metadata: { adId },
    });
};

/**
 * Send ad rejection notification
 */
export const notifyAdRejection = async (
    businessOwnerId: mongoose.Types.ObjectId | string,
    adTitle: string,
    reason: string,
    adId: mongoose.Types.ObjectId | string
) => {
    return await createNotificationIfEnabled({
        userId: businessOwnerId,
        userType: 'business',
        title: 'Ad Rejected',
        message: `Your ad "${adTitle}" was rejected. Reason: ${reason}. Please review and resubmit.`,
        type: 'ad_approval',
        metadata: { adId, reason },
    });
};

/**
 * Send verification approval notification
 */
export const notifyVerificationApproval = async (businessOwnerId: mongoose.Types.ObjectId | string) => {
    return await createNotificationIfEnabled({
        userId: businessOwnerId,
        userType: 'business',
        title: 'Business Verified',
        message: 'Your business has been verified successfully. You can now access your advertiser dashboard.',
        type: 'verification',
    });
};

/**
 * Send verification rejection notification
 */
export const notifyVerificationRejection = async (
    businessOwnerId: mongoose.Types.ObjectId | string,
    reason: string
) => {
    return await createNotificationIfEnabled({
        userId: businessOwnerId,
        userType: 'business',
        title: 'Verification Rejected',
        message: `Your verification was rejected. Reason: ${reason}. Please re-upload valid documents.`,
        type: 'verification',
        metadata: { reason },
    });
};

/**
 * Send ticket response notification
 */
export const notifyTicketResponse = async (
    userId: mongoose.Types.ObjectId | string,
    userType: 'patient' | 'business',
    ticketId: mongoose.Types.ObjectId | string
) => {
    return await createNotificationIfEnabled({
        userId,
        userType,
        title: 'Support Ticket Updated',
        message: `Your support ticket #${ticketId} has been updated by the support team.`,
        type: 'ticket_update',
        metadata: { ticketId },
    });
};

/**
 * Send doctor upload notification to patient
 */
export const notifyDoctorUpload = async (
    patientId: mongoose.Types.ObjectId | string,
    prescriptionId: mongoose.Types.ObjectId | string
) => {
    return await createNotificationIfEnabled({
        userId: patientId,
        userType: 'patient',
        title: 'New Prescription Added',
        message: 'A new prescription has been added and transcribed.',
        type: 'doctor_update',
        metadata: { prescriptionId },
    });
};

/**
 * Send QR upload notification to patient
 */
export const notifyQRUpload = async (
    patientId: mongoose.Types.ObjectId | string,
    fileName: string,
    doctorName: string
) => {
    return await createNotificationIfEnabled({
        userId: patientId,
        userType: 'patient',
        title: 'New Document Uploaded',
        message: `${doctorName} has uploaded a new document: ${fileName}`,
        type: 'doctor_update',
        metadata: { fileName, doctorName },
    });
};

export default {
    createNotification,
    createNotificationIfEnabled,
    isNotificationEnabled,
    notifyAdApproval,
    notifyAdRejection,
    notifyVerificationApproval,
    notifyVerificationRejection,
    notifyTicketResponse,
    notifyDoctorUpload,
    notifyQRUpload
};
