import { Request, Response } from 'express';
import UserNotification from '../../models/UserNotification';
import NotificationSettings from '../../models/NotificationSettings';
import { Notification } from '../../models/Notification';

/**
 * Get all notifications for the logged-in business owner
 */
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const notifications = await UserNotification.find({
            userId,
            userType: 'business',
        })
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            data: notifications,
        });
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
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
            userType: 'business',
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
        const userId = (req as any).user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const notification = await UserNotification.findOne({
            _id: id,
            userId,
            userType: 'business',
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

        // Now actually mark as read
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
            userType: 'business',
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
                userType: 'business',
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
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let settings = await NotificationSettings.findOne({
            userId,
            userType: 'business',
        });

        if (!settings) {
            // Create default settings if they don't exist
            settings = await NotificationSettings.create({
                userId,
                userType: 'business',
                settings: {
                    adApprovals: true,
                    performanceAlerts: true,
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
        console.error('Error fetching notification preferences:', error);
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
        const userId = (req as any).user?.id;
        const { settings } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const updatedSettings = await NotificationSettings.findOneAndUpdate(
            { userId, userType: 'business' },
            { settings },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            data: updatedSettings,
            message: 'Notification preferences updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification preferences',
            error: error.message,
        });
    }
};
