"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function NotificationsToggle() {
  const [status, setStatus] = useState("unsupported"); // unsupported | default | granted | denied | loading

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission); // "default" | "granted" | "denied"
  }, []);

  async function handleEnable() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission);
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      setStatus("granted");
    } catch (err) {
      console.error("Notification setup failed:", err);
      setStatus("default");
    }
  }

  if (status === "unsupported") return null;

  if (status === "granted") {
    return (
      <div className="sidebar-link" style={{ opacity: 0.7, cursor: "default" }}>
        <BellRing size={20} />
        <span>Notifications on</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleEnable}
      disabled={status === "loading" || status === "denied"}
      className="sidebar-link"
      style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
    >
      <Bell size={20} />
      <span>
        {status === "loading" && "Enabling..."}
        {status === "denied" && "Notifications blocked"}
        {status === "default" && "Enable Notifications"}
      </span>
    </button>
  );
}
