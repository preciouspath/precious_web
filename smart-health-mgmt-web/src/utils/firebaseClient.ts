import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Messaging is only available in browsers that support service workers
const messaging = typeof window !== "undefined" && "serviceWorker" in navigator
  ? getMessaging(app)
  : null;

/**
 * Request notification permission and get FCM token
 * Returns the token string or null if permission denied / not supported
 */
export const requestFCMToken = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn("[FCM] Messaging not supported in this environment");
    return null;
  }

  try {
    // Request browser notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[FCM] Notification permission denied");
      return null;
    }

    // Register the service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("[FCM] Service worker registered:", registration.scope);

    // Send Firebase config to service worker (it can't read Vite env vars directly)
    const sw = registration.active || registration.waiting || registration.installing;
    if (sw) {
      sw.postMessage({ type: "FIREBASE_CONFIG", config: firebaseConfig });
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("[FCM] Token obtained:", token.substring(0, 20) + "...");
      return token;
    } else {
      console.warn("[FCM] No FCM token available");
      return null;
    }
  } catch (error: any) {
    console.error("[FCM] Error getting FCM token:", error.message);
    return null;
  }
};

/**
 * Listen for foreground messages (when app is open in browser tab)
 * Pass a callback to handle notification display
 */
export const onForegroundMessage = (
  callback: (payload: { notification?: { title?: string; body?: string }; data?: any }) => void
) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

export { messaging };
