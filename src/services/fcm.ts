/** Firebase Cloud Messaging — push xabar (bepul tier) */

export async function initFirebaseMessaging(): Promise<boolean> {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;

  if (!apiKey || !projectId || !messagingSenderId || !appId) return false;

  try {
    const { initializeApp } = await import("firebase/app");
    const { getMessaging, getToken, onMessage } = await import("firebase/messaging");

    const app = initializeApp({ apiKey, projectId, messagingSenderId, appId });
    const messaging = getMessaging(app);

    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (vapidKey && Notification.permission === "granted") {
      const token = await getToken(messaging, { vapidKey });
      if (token) localStorage.setItem("404GO_FCM_TOKEN", token);
    }

    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || "404-GO";
      const body = payload.notification?.body || "";
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/logo-404-go.png" });
      }
    });

    return true;
  } catch {
    return false;
  }
}

export function showLocalPush(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/logo-404-go.png" });
  }
}
