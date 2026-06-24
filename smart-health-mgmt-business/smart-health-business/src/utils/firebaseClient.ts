import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDuNJkAz3CSeK5DvYdgyjTP-Gzv8Uw8fFs",
  authDomain: "smart-health-4e977.firebaseapp.com",
  projectId: "smart-health-4e977",
  storageBucket: "smart-health-4e977.firebasestorage.app",
  messagingSenderId: "550320124674",
  appId: "1:550320124674:web:3a9ef5294a012b4fca881b",
  measurementId: "G-0KZZ7S6VBY"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const messaging = typeof window !== "undefined" && "serviceWorker" in navigator
  ? getMessaging(app)
  : null;

export const requestFCMToken = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn("[FCM] Messaging not supported");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    // Inject config into SW
    const sw = registration.active || registration.waiting || registration.installing;
    if (sw) {
      sw.postMessage({ type: "FIREBASE_CONFIG", config: firebaseConfig });
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (error) {
    console.error("[FCM] Error:", error);
    return null;
  }
};

export const onForegroundMessage = (callback: any) => {
  if (!messaging) return () => { };
  return onMessage(messaging, callback);
};

export { messaging };
