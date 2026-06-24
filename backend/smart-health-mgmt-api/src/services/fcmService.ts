import { messaging } from "../utils/firebase";

/**
 * Send a push notification to specific device tokens
 * @param tokens Array of FCM device tokens
 * @param title Title of the notification
 * @param body Body text of the notification
 * @param data Optional metadata to include in the push
 */
export const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {}
) => {
  if (!messaging) {
    console.warn("FCM messaging is not initialized. Skipping push notification.");
    return null;
  }

  // Filter out any empty tokens
  const validTokens = tokens.filter((token) => !!token);

  if (validTokens.length === 0) {
    console.log("No valid FCM tokens provided. Skipping push notification.");
    return null;
  }

  const message = {
    notification: {
      title,
      body,
    },
    data,
    tokens: validTokens,
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    console.log(`${response.successCount} push notifications sent successfully.`);
    if (response.failureCount > 0) {
      console.warn(`${response.failureCount} notifications failed to send.`);
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          console.error(`Error sending to token ${validTokens[idx]}:`, resp.error);
        }
      });
    }
    return response;
  } catch (error) {
    console.error("Error sending push notification via FCM:", error);
    return null;
  }
};

export default {
  sendPushNotification,
};
