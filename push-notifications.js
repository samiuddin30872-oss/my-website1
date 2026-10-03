import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase.js";

const firebaseConfig = {
  apiKey: "AIzaSyAAmCPK_Fxm2WIsIFdhcQCDn8KZG0-O32U",
  authDomain: "rajarefrigeration-d63a9.firebaseapp.com",
  projectId: "rajarefrigeration-d63a9",
  storageBucket: "rajarefrigeration-d63a9.firebasestorage.app",
  messagingSenderId: "548338328589",
  appId: "1:548338328589:web:f82d72cce3008b1161e144"
};

const VAPID_KEY = "BDgla4uQMAMJWFb4p5DcEVJfBN5bpFPZt1GwP_M8_7e7yb9HSe3hJMo0LD-9TIjfnL7H4w5eVtO27zYXvoU1cxU";

export async function enableComplaintNotifications() {
  try {
    if (!("Notification" in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const swReg = await navigator.serviceWorker.register("./firebase-messaging-sw.js");

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg
    });

    if (token) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      await supabase.from("device_tokens").upsert({ token }, { onConflict: "token" });
    }
  } catch (err) {
    console.error("Notification setup failed:", err);
  }
}
