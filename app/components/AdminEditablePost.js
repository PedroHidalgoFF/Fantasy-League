"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import CommishPost from "./CommishPost";

// Igual que CommishPost, pero si isAdmin es true agrega un botón de
// "Edit" que abre un editor de texto ahí mismo — sin salir de la página
// ni tener que ir a /admin a buscar la página/semana correcta.
export default function AdminEditablePost({ page, week, initialPost, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(initialPost?.content || "");
  const [post, setPost] = useState(initialPost);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isAdmin) return <CommishPost post={post} />;

  async function handleSave(published) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/save-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, week: week ?? null, content, published }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setPost({ content, published });
      setEditing(false);
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  }

  if (!editing) {
    return (
      <div>
        <CommishPost post={post} />
        <button
          onClick={() => setEditing(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.78rem",
            color: "var(--accent)",
            background: "none",
            border: "1px solid var(--accent)",
            borderRadius: "999px",
            padding: "0.3rem 0.75rem",
            cursor: "pointer",
            marginBottom: "1.25rem",
          }}
        >
          <Pencil size={13} /> {post?.content ? "Edit Commish note" : "Add Commish note"}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid var(--accent)",
        borderRadius: "12px",
        padding: "1.25rem",
        marginBottom: "1.5rem",
        background: "var(--surface)",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.5rem" }}>Edit Commish note</div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        placeholder="Write the note for this section..."
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--bg)",
          color: "var(--text)",
          fontFamily: "inherit",
          fontSize: "0.9rem",
          boxSizing: "border-box",
        }}
      />
      {error && <p style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{error}</p>}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
        <button onClick={() => handleSave(true)} disabled={saving || !content} style={btn("var(--accent)", "var(--accent-contrast)")}>
          <Check size={14} /> Publish
        </button>
        <button onClick={() => handleSave(false)} disabled={saving} style={btn("var(--surface-active)", "var(--text)")}>
          Save draft
        </button>
        <button onClick={() => setEditing(false)} style={btn("transparent", "var(--text-muted)", "1px solid var(--border)")}>
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}

function btn(bg, color, border = "none") {
  return {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.5rem 0.9rem",
    borderRadius: "8px",
    border,
    background: bg,
    color,
    fontWeight: 700,
    fontSize: "0.82rem",
    cursor: "pointer",
  };
}
