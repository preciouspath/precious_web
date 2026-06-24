import admin from "../utils/firebase";

export interface NotificationPayload {
    token: string;
    title: string;
    body: string;
}

export interface BulkNotificationPayload {
    tokens: string[];
    title: string;
    body: string;
}

export const sendNotification = async ({
    token,
    title,
    body,
}: NotificationPayload): Promise<string> => {
    const message: admin.messaging.Message = {
        token,
        notification: {
            title,
            body,
        },
    };

    try {
        const response = await admin.messaging().send(message);
        return response;
    } catch (error: any) {
        console.error("Error sending notification:", error.message);
        throw error;
    }
};

export const sendBulkNotification = async ({
    tokens,
    title,
    body,
}: BulkNotificationPayload): Promise<admin.messaging.BatchResponse> => {
    const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
            title,
            body,
        },
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        return response;
    } catch (error: any) {
        console.error("Bulk error:", error.message);
        throw error;
    }
};