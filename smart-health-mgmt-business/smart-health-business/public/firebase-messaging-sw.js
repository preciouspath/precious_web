// Firebase Cloud Messaging Service Worker
// Place this file in /public/firebase-messaging-sw.js
// Firebase config is injected via postMessage from the app after registration

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

let messaging = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    const config = event.data.config;
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
      messaging = firebase.messaging();

      messaging.onBackgroundMessage((payload) => {
        console.log('[FCM SW] Business Background message:', payload);
        const title = payload.notification?.title || 'Smart Health Business';
        const options = {
          body: payload.notification?.body || '',
          icon: '/images/logo.svg', // Assuming same icon path
          badge: '/images/logo.svg',
          data: payload.data,
        };
        self.registration.showNotification(title, options);
      });
    }
  }
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/dashboard');
    })
  );
});
