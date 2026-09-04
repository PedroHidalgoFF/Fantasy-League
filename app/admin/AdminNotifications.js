"use client";

import { useEffect, useState } from "react";
import { Send, Users } from "lucide-react";
import NotificationsToggle from "../components/NotificationsToggle";

function inputStyle() {
  return {
    width: "100%",
    padding: "0.6rem",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    marginBottom: "0.75rem",
    boxSizing: "border-box",
  };
}

export default function AdminNotifications() {
  const [testStatus, setTestStatus] = useState("idle"); // idle | sending | sent | error
  const [testResult, setTestResult] = useState(null);

  const [counts, setCounts] = useState(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [announceStatus, setAnnounceStatus] = useState("idle"); // idle | sending | sent | error
  const [announceResult, setAnnounceResult] = useState(null);

  useEffect(() => {
    fetch("/api/admin/subscribers")
      .then((r) => r.json())
      .then(setCounts)
      .catch(() => {});
  }, [testStatus, announceStatus]);

  async function sendTest() {
    setTestStatus("sending");
    try {
      const res = await fetch("/api/admin/test-push", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setTestResult(data.sent);
      setTestStatus("sent");
    } catch (e) {
      setTestStatus("error");
    }
  }

  async function sendAnnouncement(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setAnnounceStatus("sending");
    try {
      const res = await fetch("/api/admin/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setAnnounceResult(data.sent);
      setAnnounceStatus("sent");
      setTitle("");
      setBody("");
    } catch (e) {
      setAnnounceStatus("error");
    }
  }

  return (
    <div style={{ marginTop: "3rem", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
      <h2>Notifications</h2>

      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <Users size={16} />
        {counts ? (
          <>
            {counts.total} device{counts.total === 1 ? "" : "s"} subscribed
            {counts.admin > 0 ? ` (${counts.admin} marked as admin)` : ""}
          </>
        ) : (
          "Loading subscriber count..."
        )}
      </p>

      <h3 style={{ fontSize: "0.9rem", marginTop: "1.5rem" }}>This device</h3>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
        Turn on notifications for this device to get admin-only test pushes — separate from the ones everyone in
        the league gets when you publish a post, approve a bet, or send an announcement.
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
        disabled={testStatus === "sending"}
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
        <Send size={16} /> {testStatus === "sending" ? "Sending..." : "Send test notification to me"}
      </button>

      {testStatus === "sent" && (
        <p style={{ color: testResult > 0 ? "var(--success)" : "var(--text-faint)", fontSize: "0.85rem", marginTop: "0.6rem" }}>
          {testResult > 0
            ? `Sent to ${testResult} admin device(s).`
            : "Sent to 0 devices — turn on notifications above first (on this device)."}
        </p>
      )}
      {testStatus === "error" && (
        <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.6rem" }}>Something went wrong sending it.</p>
      )}

      <h3 style={{ fontSize: "0.9rem", marginTop: "2rem" }}>Quick announcement</h3>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
        A one-off push to everyone in the league — doesn't get saved anywhere or attached to a page.
      </p>

      <form onSubmit={sendAnnouncement} style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", background: "var(--surface)" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. Draft is Saturday!)"
          required
          style={inputStyle()}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          rows={3}
          required
          style={{ ...inputStyle(), fontFamily: "inherit", marginBottom: "0.9rem" }}
        />
        {announceStatus === "error" && <p style={{ color: "var(--danger)", fontSize: "0.85rem" }}>Something went wrong sending it.</p>}
        {announceStatus === "sent" && (
          <p style={{ color: "var(--success)", fontSize: "0.85rem" }}>Sent to {announceResult} device(s).</p>
        )}
        <button
          type="submit"
          disabled={announceStatus === "sending"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            width: "100%",
            padding: "0.7rem",
            borderRadius: "8px",
            border: "none",
            background: "var(--accent)",
            color: "var(--accent-contrast)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Send size={16} /> {announceStatus === "sending" ? "Sending..." : "Send to everyone"}
        </button>
      </form>
    </div>
  );
}
