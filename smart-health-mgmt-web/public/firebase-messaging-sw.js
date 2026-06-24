// Firebase Cloud Messaging Service Worker
// Place this file in /public/firebase-messaging-sw.js
// Firebase config is injected via query params when registering the SW

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Config is passed via self.__FIREBASE_CONFIG injected during SW registration
// See: firebaseClient.ts -> navigator.serviceWorker.register(url + '?config=...')
let messaging = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    const config = event.data.config;
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
      messaging = firebase.messaging();

      messaging.onBackgroundMessage((payload) => {
        console.log('[FCM SW] Background message received:', payload);
        const title = payload.notification?.title || 'Smart Health';
        const options = {
          body: payload.notification?.body || '',
          icon: '/images/logo.svg',
          badge: '/images/logo.svg',
          data: payload.data,
        };
        self.registration.showNotification(title, options);
      });
    }
  }
});

// Fallback: if Firebase is already configured before message event
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle notification click — open app or focus existing tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/notifications');
    })
  );
});

