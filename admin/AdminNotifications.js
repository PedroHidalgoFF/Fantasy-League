"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import NotificationsToggle from "../components/NotificationsToggle";

export default function AdminNotifications() {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [result, setResult] = useState(null);

  async function sendTest() {
    setStatus("sending");
    try {
      const res = await fetch("/api/admin/test-push", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setResult(data.sent);
      setStatus("sent");
    } catch (e) {
      setStatus("error");
    }
  }

  return (
    <div style={{ marginTop: "3rem", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
      <h2>Notifications</h2>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
        Turn on notifications for this device to get admin-only test pushes — separate from the ones everyone in
        the league gets when you publish a post or approve a bet.
      </p>

      <div
        style={{
          marginBottom: "1rem",
          "--sidebar-text": "var(--text-primary)",
          "--sidebar-text-active": "var(--accent)",
        }}
      >
        <NotificationsToggle isAdmin />
      </div>

      <button
        onClick={sendTest}
        disabled={status === "sending"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.6rem 1.1rem",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <Send size={16} /> {status === "sending" ? "Sending..." : "Send test notification to me"}
      </button>

      {status === "sent" && (
        <p style={{ color: result > 0 ? "var(--success)" : "var(--text-faint)", fontSize: "0.85rem", marginTop: "0.6rem" }}>
          {result > 0
            ? `Sent to ${result} admin device(s).`
            : "Sent to 0 devices — turn on notifications above first (on this device)."}
        </p>
      )}
      {status === "error" && (
        <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.6rem" }}>Something went wrong sending it.</p>
      )}
    </div>
  );
}
