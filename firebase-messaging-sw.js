importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAAmCPK_Fxm2WIsIFdhcQCDn8KZG0-O32U",
  authDomain: "rajarefrigeration-d63a9.firebaseapp.com",
  projectId: "rajarefrigeration-d63a9",
  storageBucket: "rajarefrigeration-d63a9.firebasestorage.app",
  messagingSenderId: "548338328589",
  appId: "1:548338328589:web:f82d72cce3008b1161e144"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Raja Refrigeration";
  const body = payload.notification?.body || "";
  self.registration.showNotification(title, {
    body,
    icon: "./icon-192.png",
    badge: "./icon-192.png"
  });
});
