"use client";

import { useState } from "react";
import { ClipboardList, Home, PenSquare } from "lucide-react";

function Editor({ label, page, week }) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadExisting() {
    const res = await fetch("/api/admin/get-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, week }),
    });
    const data = await res.json();
    if (data.post) {
      setContent(data.post.content || "");
      setStatus(data.post.published ? "Published" : "Unpublished draft");
    }
    setLoaded(true);
  }

  async function handleSave(published) {
    setLoading(true);
    const res = await fetch("/api/admin/save-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, week, content, published }),
    });
    setLoading(false);

    if (res.ok) {
      setStatus(published ? "✓ Published" : "✓ Saved as draft");
    } else {
      setStatus("Error saving");
    }
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
      <h2 style={{ marginTop: 0 }}>{label}</h2>

      {!loaded && (
        <button onClick={loadExisting} style={btnStyle("var(--border)")}>
          Load what's already saved
        </button>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        placeholder="Write or paste the text you want to publish."
        style={{
          width: "100%",
          marginTop: "1rem",
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
        <button onClick={() => handleSave(true)} disabled={loading || !content} style={btnStyle("var(--success)", "var(--bg)")}>
          Publish
        </button>
      </div>

      {status && <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>{status}</p>}
    </div>
  );
}

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

export default function AdminDashboard({ currentWeek }) {
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <main style={{ maxWidth: 700, margin: "2rem auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{display:"flex",alignItems:"center",gap:"0.5rem"}}><PenSquare size={26} /> Editor Panel</h1>
        <button onClick={handleLogout} style={btnStyle("var(--border)")}>
          Log out
        </button>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Write or paste your text and hit "Publish" — it shows up on the site the next time it updates.
      </p>

      <Editor label={<span style={{display:"flex",alignItems:"center",gap:"0.4rem"}}><ClipboardList size={20}/> Weekly Report</span>} page="weekly-report" week={currentWeek} />
      <Editor label={<span style={{display:"flex",alignItems:"center",gap:"0.4rem"}}><Home size={20}/> Home Message</span>} page="home" week={null} />
    </main>
  );
}
