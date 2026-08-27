"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      window.location.href = "/admin";
    } else {
      setError("Contraseña incorrecta");
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: "4rem auto", textAlign: "center" }}>
      <h1>🔒 Acceso de editor</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          style={{
            width: "100%",
            padding: "0.6rem",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            marginBottom: "1rem",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.6rem",
            borderRadius: "8px",
            border: "none",
            background: "var(--accent)",
            color: "var(--bg)",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
        {error && <p style={{ color: "var(--danger)", marginTop: "0.75rem" }}>{error}</p>}
      </form>
    </main>
  );
}
