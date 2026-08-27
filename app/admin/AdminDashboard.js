"use client";

import { useState } from "react";

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
      setStatus(data.post.published ? "Publicado" : "Borrador sin publicar");
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
      setStatus(published ? "✓ Publicado" : "✓ Guardado como borrador");
    } else {
      setStatus("Error al guardar");
    }
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
      <h2 style={{ marginTop: 0 }}>{label}</h2>

      {!loaded && (
        <button onClick={loadExisting} style={btnStyle("var(--border)")}>
          Cargar lo que ya está guardado
        </button>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        placeholder="Escribe o pega aquí el texto que quieres publicar."
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
          Guardar borrador
        </button>
        <button onClick={() => handleSave(true)} disabled={loading || !content} style={btnStyle("var(--success)", "var(--bg)")}>
          Publicar
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
        <h1>✍️ Panel de editor</h1>
        <button onClick={handleLogout} style={btnStyle("var(--border)")}>
          Cerrar sesión
        </button>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Escribe o pega tu texto y dale "Publicar" — aparece de inmediato en el sitio la próxima vez que se actualice.
      </p>

      <Editor label="📋 Reporte Semanal" page="weekly-report" week={currentWeek} />
      <Editor label="🏠 Mensaje de Inicio" page="home" week={null} />
    </main>
  );
}
