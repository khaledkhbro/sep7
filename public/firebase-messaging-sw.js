// Firebase Cloud Messaging Service Worker
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js")

// Declare Firebase variable
const firebase = self.firebase

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
})

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message:", payload)

  const notificationTitle = payload.notification?.title || "New Notification"
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: payload.notification?.icon || "/icon-192x192.png",
    badge: "/badge-72x72.png",
    data: payload.data,
    actions: [
      {
        action: "open",
        title: "Open App",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification clicked:", event)

  event.notification.close()

  if (event.action === "open" || !event.action) {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus()
          }
        }

        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow("/")
        }
      }),
    )
  }
})
