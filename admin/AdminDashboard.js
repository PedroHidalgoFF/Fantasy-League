"use client";

import { useState, useRef } from "react";
import {
  PenSquare,
  Bold,
  Heading2,
  List,
  Home,
  Trophy,
  ClipboardList,
  Repeat,
  Target,
  Zap,
  Swords,
  Users,
  Star,
  Newspaper,
} from "lucide-react";

const PAGES = [
  { value: "home", label: "Home", icon: Home, hasWeek: false },
  { value: "power-rankings", label: "Power Rankings", icon: Trophy, hasWeek: false },
  { value: "weekly-report", label: "Weekly Report", icon: ClipboardList, hasWeek: true },
  { value: "trades", label: "Trades", icon: Repeat, hasWeek: false },
  { value: "waiver-wins", label: "Waiver Wins", icon: Target, hasWeek: false },
  { value: "bustboom", label: "Bust/Boom", icon: Zap, hasWeek: false },
  { value: "head-to-head", label: "Head-to-Head", icon: Swords, hasWeek: false },
  { value: "teams", label: "Teams", icon: Users, hasWeek: false },
  { value: "top-players", label: "Top 300", icon: Star, hasWeek: false },
  { value: "news", label: "News", icon: Newspaper, hasWeek: false },
];

function btnStyle(bg, color = "var(--text)") {
  return {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "none",
    background: bg,
    color,
    cursor: "pointer",
    fontWeight: "bold",
  };
}

function FormatButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        borderRadius: "6px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text-muted)",
        cursor: "pointer",
      }}
    >
      <Icon size={16} />
    </button>
  );
}

export default function AdminDashboard({ currentWeek }) {
  const [pageKey, setPageKey] = useState("home");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  const pageInfo = PAGES.find((p) => p.value === pageKey);
  const week = pageInfo?.hasWeek ? currentWeek : null;

  async function handlePageChange(newPageKey) {
    setPageKey(newPageKey);
    setContent("");
    setStatus("Loading...");

    const newPageInfo = PAGES.find((p) => p.value === newPageKey);
    const res = await fetch("/api/admin/get-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: newPageKey, week: newPageInfo?.hasWeek ? currentWeek : null }),
    });
    const data = await res.json();
    if (data.post) {
      setContent(data.post.content || "");
      setStatus(data.post.published ? "Published" : "Unpublished draft");
    } else {
      setStatus("Nothing published here yet.");
    }
  }

  // Envuelve la selección actual del textarea con la sintaxis de markdown
  // que corresponda (negritas, título, lista).
  function wrapSelection(before, after = before) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end) || "text";
    const newContent = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(newContent);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function insertLinePrefix(prefix) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const newContent = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(newContent);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  }

  async function handleSave(published) {
    setLoading(true);
    const res = await fetch("/api/admin/save-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pageKey, week, content, published }),
    });
    setLoading(false);

    if (res.ok) {
      setStatus(published ? "✓ Published — push notification sent" : "✓ Saved as draft");
    } else {
      setStatus("Error saving");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <main style={{ maxWidth: 700, margin: "2rem auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <PenSquare size={26} /> Editor Panel
        </h1>
        <button onClick={handleLogout} style={btnStyle("var(--border)")}>
          Log out
        </button>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Choose which page gets "A word from the Commish:" — write your text, format it, and hit
        "Publish". Every publish sends a push notification to anyone who enabled alerts.
      </p>

      <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Post to:</label>
      <select
        value={pageKey}
        onChange={(e) => handlePageChange(e.target.value)}
        style={{
          display: "block",
          width: "100%",
          padding: "0.6rem",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
          marginTop: "0.4rem",
          marginBottom: "1.25rem",
        }}
      >
        {PAGES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
            {p.hasWeek ? ` (week ${currentWeek})` : ""}
          </option>
        ))}
      </select>

      <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.6rem" }}>
          <FormatButton icon={Bold} label="Bold" onClick={() => wrapSelection("**")} />
          <FormatButton icon={Heading2} label="Heading" onClick={() => insertLinePrefix("## ")} />
          <FormatButton icon={List} label="Bullet list" onClick={() => insertLinePrefix("- ")} />
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Write or paste the text you want to publish. Select text and click Bold, or use the Heading/List buttons."
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontFamily: "inherit",
            fontSize: "0.95rem",
          }}
        />

        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => handleSave(false)} disabled={loading || !content} style={btnStyle("var(--border)")}>
            Save draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={loading || !content}
            style={btnStyle("var(--success)", "var(--bg)")}
          >
            Publish
          </button>
        </div>

        {status && <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>{status}</p>}
      </div>
    </main>
  );
}
