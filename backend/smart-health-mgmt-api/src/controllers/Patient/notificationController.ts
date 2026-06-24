import { Request, Response } from 'express';
import UserNotification from '../../models/UserNotification';
import NotificationSettings from '../../models/NotificationSettings';
import { Notification } from '../../models/Notification';

/**
 * Get all notifications for the logged-in patient
 */
/**
 * Get all notifications for the logged-in patient with pagination and filters
 */
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { page = 1, limit = 10, type, read, startDate, endDate } = req.query;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const query: any = {
            userId,
            userType: 'patient',
        };

        // Apply filters
        if (type && type !== 'all') {
            query.type = type;
        }

        if (read !== undefined && read !== 'all') {
            query.read = read === 'true';
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate as string);
            }
            if (endDate) {
                // Set end date to end of day
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const totalDocs = await UserNotification.countDocuments(query);
        const totalPages = Math.ceil(totalDocs / limitNum);

        const notifications = await UserNotification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            data: notifications,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalDocs,
                totalPages,
            }
        });
    } catch (error: any) {
        console.error(`[PatientNotification] Error fetching notifications:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message,
        });
    }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const count = await UserNotification.countDocuments({
            userId,
            userType: 'patient',
            read: false,
        });

        res.status(200).json({
            success: true,
            data: { unreadCount: count },
        });
    } catch (error: any) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count',
            error: error.message,
        });
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || (req as any).user?.sub;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const notification = await UserNotification.findOne({
            _id: id,
            userId,
            userType: 'patient',
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        // If it was linked to a campaign, increment the opened count
        if (!notification.read && notification.notificationId) {
            await Notification.findByIdAndUpdate(notification.notificationId, {
                $inc: { "stats.opened": 1 }
            });
        }

        // Mark as read
        notification.read = true;
        await notification.save();

        res.status(200).json({
            success: true,
            data: notification,
        });
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message,
        });
    }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const unreadNotifications = await UserNotification.find({
            userId,
            userType: 'patient',
            read: false,
        });

        for (const notif of unreadNotifications) {
            if (notif.notificationId) {
                await Notification.findByIdAndUpdate(notif.notificationId, {
                    $inc: { "stats.opened": 1 }
                });
            }
        }

        await UserNotification.updateMany(
            {
                userId,
                userType: 'patient',
                read: false,
            },
            { read: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error: any) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message,
        });
    }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || (req as any).user?.sub;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        let settings = await NotificationSettings.findOne({
            userId,
            userType: 'patient',
        });

        if (!settings) {
            // Create default settings if they don't exist
            settings = await NotificationSettings.create({
                userId,
                userType: 'patient',
                settings: {
                    healthAlerts: true,
                    doctorNotifications: true,
                    personalizedAds: true,
                    systemUpdates: true,
                    ticketUpdates: true,
                },
            });
        }

        res.status(200).json({
            success: true,
            data: settings,
        });
    } catch (error: any) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification preferences',
            error: error.message,
        });
    }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || (req as any).user?.sub;
        const { settings } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        const updatedSettings = await NotificationSettings.findOneAndUpdate(
            { userId, userType: 'patient' },
            { settings },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            data: updatedSettings,
            message: 'Notification settings updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification preferences',
            error: error.message,
        });
    }
};
