import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db, getMessagingInstance } from './firebase';

/**
 * Get current browser notification permission status
 */
export function getNotificationPermissionStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission and save FCM token to Firestore
 */
export async function requestFCMToken(userId) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn("FCM: Notifications are not supported in this environment.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn("FCM: Notification permission was not granted:", permission);
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.warn("FCM: Messaging instance not available.");
      return null;
    }

    // Register service worker if available
    let swRegistration = null;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log("FCM: Service worker registered successfully.");
      } catch (swErr) {
        console.warn("FCM: Service worker registration failed:", swErr);
      }
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;
    const tokenOptions = {
      ...(swRegistration ? { serviceWorkerRegistration: swRegistration } : {}),
      ...(vapidKey ? { vapidKey } : {})
    };

    const currentToken = await getToken(messaging, tokenOptions);

    if (currentToken) {
      console.log("FCM: Generated Device Token:", currentToken);

      if (userId && db) {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          fcmToken: currentToken,
          fcmTokens: arrayUnion(currentToken),
          fcmLastUpdated: serverTimestamp()
        }, { merge: true });

        // Also update shadow 'donars' registry if present
        try {
          const donorRef = doc(db, 'donars', userId);
          await setDoc(donorRef, {
            fcmToken: currentToken,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {}

        console.log("FCM: Token saved to Firestore for user:", userId);
      }
      return currentToken;
    } else {
      console.warn("FCM: No registration token available. Request permission to generate one.");
      return null;
    }
  } catch (err) {
    console.error("FCM: Error getting FCM token:", err);
    return null;
  }
}

/**
 * Register foreground message listener
 */
export async function listenToForegroundMessages(onMessageCallback) {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return () => {};

    return onMessage(messaging, (payload) => {
      console.log("FCM: Foreground message received:", payload);
      if (typeof onMessageCallback === 'function') {
        onMessageCallback(payload);
      }
    });
  } catch (err) {
    console.error("FCM: Error setting up foreground message listener:", err);
    return () => {};
  }
}
