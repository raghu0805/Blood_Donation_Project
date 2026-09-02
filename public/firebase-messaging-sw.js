// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC7YuFSaRwlhVbOcqWVPYhSkrdtkZwS2J4",
  authDomain: "portfolio-f6281.firebaseapp.com",
  projectId: "portfolio-f6281",
  storageBucket: "portfolio-f6281.firebasestorage.app",
  messagingSenderId: "194147287587",
  appId: "1:194147287587:web:d278d2a3b0e3eff045e796"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || 'LifeLink Blood Alert';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Emergency blood donation update received.',
      icon: '/app logo.png',
      badge: '/app logo.png',
      data: payload.data || {},
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open_app', title: 'Open LifeLink' }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  console.error("[firebase-messaging-sw.js] Error initializing background messaging:", err);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.actionPath || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
