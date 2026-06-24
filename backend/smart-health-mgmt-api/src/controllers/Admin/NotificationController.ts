import { Request, Response } from "express";
import { Notification, NotificationStatus, TargetAudience } from "../../models/Notification";
import user from "../../models/user";
import { BusinessOwner } from "../../models/Business";
import UserNotification from "../../models/UserNotification";
import { sendBulkNotification } from "../../services/pushnotificationService";

const mapPushTypeToUserType = (pushType: string) => {
    switch (pushType) {
        case "HEALTH_ALERT": return 'health_alert';
        case "SYSTEM_UPDATE": return 'system';
        case "PROMOTION": return 'advertisement';
        default: return 'system';
    }
}

// Send notification to users (DB records + FCM push)
const sendNotificationToUsers = async (notification: any) => {
    let users: any[] = [];
    let userType: 'patient' | 'business' | 'admin' = 'patient';

    const audience = notification.targetAudience;
    console.log(`[NotificationTrigger] Starting delivery for notification: ${notification._id}, Audience: ${audience}`);

    if (audience === TargetAudience.PATIENTS || audience === "Patients Only") {
        const query: any = { role: "patient" };
        users = await user.find(query, '_id fcmToken');
        userType = 'patient';
        console.log(`[NotificationTrigger] Found ${users.length} patients for role 'patient'`);
    } else if (audience === TargetAudience.BUSINESS || audience === "Business Only") {
        users = await BusinessOwner.find({}, '_id fcmToken');
        userType = 'business';
        console.log(`[NotificationTrigger] Found ${users.length} business owners`);
    } else if (audience === TargetAudience.ALL || audience === "All Users") {
        const patients = await user.find({ role: 'patient' }, '_id fcmToken');
        const businesses = await BusinessOwner.find({}, '_id fcmToken');

        users = [
            ...patients.map((p: any) => ({ _id: p._id, type: 'patient' as const, fcmToken: p.fcmToken })),
            ...businesses.map((b: any) => ({ _id: b._id, type: 'business' as const, fcmToken: b.fcmToken }))
        ];
        console.log(`[NotificationTrigger] Targeting ALL: ${patients.length} patients, ${businesses.length} businesses`);
    } else if (audience === TargetAudience.SEGMENT || audience === "Filtered Segment") {
        console.log(`[NotificationTrigger] Segment filters:`, notification.filters);
        const query: any = { role: "patient" };

        if (notification.filters?.location) {
            query.$or = [
                { businessAddress: { $regex: notification.filters.location, $options: "i" } },
                { "healthProfile.emergencyContact.countryName": { $regex: notification.filters.location, $options: "i" } }
            ];
        }

        users = await user.find(query, '_id fcmToken');
        userType = 'patient';
        console.log(`[NotificationTrigger] Found ${users.length} users in segment filtering`);
    }

    // Create in-app notifications (DB records)
    const userNotifications = users.map(u => ({
        userId: u._id,
        userType: u.type || userType,
        title: notification.title,
        message: notification.message,
        type: mapPushTypeToUserType(notification.type),
        notificationId: notification._id,
        read: false
    }));

    console.log(`[NotificationTrigger] Creating ${userNotifications.length} UserNotification records`);

    if (userNotifications.length > 0) {
        try {
            await UserNotification.insertMany(userNotifications, { ordered: false });
            console.log(`[NotificationTrigger] Successfully inserted ${userNotifications.length} notifications`);
        } catch (error) {
            console.error(`[NotificationTrigger] Partial or full error during insertMany:`, error);
        }
    }

    // 🔔 Send FCM bulk push to all users who have a registered token
    const fcmTokens: string[] = users
        .map((u: any) => u.fcmToken)
        .filter((t: any): t is string => typeof t === 'string' && t.length > 0);

    if (fcmTokens.length > 0) {
        console.log(`[FCM] Sending bulk push to ${fcmTokens.length} devices...`);
        try {
            const batchResponse = await sendBulkNotification({
                tokens: fcmTokens,
                title: notification.title,
                body: notification.message,
            });
            const successCount = batchResponse.responses.filter((r: any) => r.success).length;
            const failureCount = batchResponse.failureCount;
            console.log(`[FCM] Bulk push complete — Success: ${successCount}, Failed: ${failureCount}`);
        } catch (err: any) {
            console.error(`[FCM] Bulk push error (non-critical):`, err.message);
        }
    } else {
        console.log(`[FCM] No FCM tokens found — skipping push notifications`);
    }

    // Update stats and status
    const count = users.length;
    notification.stats.sent = count;
    notification.stats.delivered = count;
    notification.stats.opened = 0;
    notification.status = NotificationStatus.SENT;
    notification.sentAt = new Date();
    await notification.save();
    console.log(`[NotificationTrigger] Notification status updated to SENT for: ${notification._id}`);
};

export const createNotification = async (req: Request, res: Response) => {
    try {
        const { title, message, type, targetAudience, filters, scheduledFor } = req.body;

        if (!title || !message || !type || !targetAudience) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const notification = new Notification({
            title,
            message,
            type,
            targetAudience,
            filters,
            scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
            status: scheduledFor && new Date(scheduledFor) > new Date() ? NotificationStatus.SCHEDULED : NotificationStatus.SENT
        });

        await notification.save();

        if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
            await sendNotificationToUsers(notification);
        }

        return res.status(201).json({ success: true, data: notification, message: "Notification created" });

    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, type } = req.query;
        const filters: any = {};
        if (type) filters.type = type;

        const notifications = await Notification.find(filters)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        const total = await Notification.countDocuments(filters);
        const totalPages = Math.ceil(total / Number(limit));

        return res.json({
            success: true,
            data: notifications,
            meta: {
                total,
                totalPages,
                page: Number(page),
                limit: Number(limit)
            }
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

export const cancelNotification = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        if (notification.status !== NotificationStatus.SCHEDULED) {
            return res.status(400).json({ success: false, message: "Cannot cancel a notification that is not scheduled" });
        }

        notification.status = NotificationStatus.CANCELED;
        await notification.save();

        return res.json({ success: true, message: "Notification canceled", data: notification });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

export const getNotificationStats = async (req: Request, res: Response) => {
    try {
        const scheduled = await Notification.countDocuments({ status: NotificationStatus.SCHEDULED });

        const aggregation = await Notification.aggregate([
            { $match: { status: NotificationStatus.SENT } },
            {
                $group: {
                    _id: null,
                    totalDelivered: { $sum: "$stats.delivered" },
                    totalSentCount: { $sum: "$stats.sent" },
                    totalOpened: { $sum: "$stats.opened" }
                }
            }
        ]);

        const stats = aggregation[0] || { totalDelivered: 0, totalSentCount: 0, totalOpened: 0 };

        const deliveryRate = stats.totalSentCount > 0 ? Math.round((stats.totalDelivered / stats.totalSentCount) * 100) : 0;
        const openRate = stats.totalDelivered > 0 ? Math.round((stats.totalOpened / stats.totalDelivered) * 100) : 0;

        return res.json({
            success: true,
            data: {
                totalSent: stats.totalSentCount,
                deliveryRate,
                openRate,
                scheduledCount: scheduled
            }
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        return res.json({ success: true, message: "Notification deleted" });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

export const updateNotification = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, message, type, targetAudience, filters, scheduledFor } = req.body;

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        if (notification.status === NotificationStatus.SENT) {
            return res.status(400).json({ success: false, message: "Cannot edit a notification that has already been sent" });
        }

        notification.title = title || notification.title;
        notification.message = message || notification.message;
        notification.type = type || notification.type;
        notification.targetAudience = targetAudience || notification.targetAudience;
        notification.filters = filters || notification.filters;

        if (scheduledFor) {
            notification.scheduledFor = new Date(scheduledFor);
            if (notification.scheduledFor > new Date()) {
                notification.status = NotificationStatus.SCHEDULED;
            } else {
                notification.status = NotificationStatus.SCHEDULED;
            }
        }

        await notification.save();

        return res.json({ success: true, message: "Notification updated", data: notification });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};
