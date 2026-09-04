"use client";

import { useEffect, useState } from "react";
import { Handshake, Check, X, RefreshCw } from "lucide-react";

function BetRow({ bet, onUpdate, onDelete }) {
  const [wager, setWager] = useState(bet.wager);
  const [week, setWeek] = useState(bet.week);
  const [busy, setBusy] = useState(false);

  async function act(status) {
    setBusy(true);
    await onUpdate(bet.id, { status, wager, week });
    setBusy(false);
  }

  async function remove() {
    if (!window.confirm(`¿Borrar "${bet.team_a_name} vs ${bet.team_b_name}"? No se puede deshacer.`)) return;
    setBusy(true);
    await onDelete(bet.id);
    setBusy(false);
  }

  const statusColor = bet.status === "approved" ? "var(--success)" : bet.status === "rejected" ? "var(--danger)" : "var(--text-muted)";

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "1rem",
        marginBottom: "0.85rem",
        background: "var(--surface)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <strong style={{ fontSize: "0.9rem" }}>
          {bet.team_a_name} vs {bet.team_b_name}
        </strong>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: statusColor, textTransform: "uppercase" }}>
          {bet.status}
        </span>
      </div>
      {bet.submitted_by && (
        <div style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginBottom: "0.5rem" }}>
          Propuesta por {bet.submitted_by}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)" }}>Semana</label>
          <input
            type="number"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            style={{ width: 70, padding: "0.4rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)" }}>Apuesta</label>
          <input
            type="text"
            value={wager}
            onChange={(e) => setWager(e.target.value)}
            style={{ width: "100%", padding: "0.4rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", boxSizing: "border-box" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        {bet.status !== "approved" && (
          <button disabled={busy} onClick={() => act("approved")} style={btn("var(--accent)", "var(--accent-contrast)")}>
            <Check size={14} /> Aprobar
          </button>
        )}
        {bet.status !== "rejected" && (
          <button disabled={busy} onClick={() => act("rejected")} style={btn("transparent", "var(--danger)", "1px solid var(--danger)")}>
            <X size={14} /> Rechazar
          </button>
        )}
        {bet.status === "approved" && (
          <button disabled={busy} onClick={() => act("approved")} style={btn("var(--surface-active)", "var(--text)")}>
            Guardar cambios
          </button>
        )}
        <button disabled={busy} onClick={remove} style={btn("transparent", "var(--text-faint)", "1px solid var(--border)")}>
          Eliminar
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
    padding: "0.4rem 0.8rem",
    borderRadius: "6px",
    border,
    background: bg,
    color,
    fontWeight: 700,
    fontSize: "0.8rem",
    cursor: "pointer",
  };
}

export default function BetsAdmin() {
  const [bets, setBets] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/bets");
      const data = await res.json();
      setBets(data.bets || []);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpdate(id, updates) {
    try {
      const res = await fetch("/api/admin/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch("/api/admin/bets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const pending = (bets || []).filter((b) => b.status === "pending");
  const others = (bets || []).filter((b) => b.status !== "pending");

  return (
    <div style={{ marginTop: "3rem", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Handshake size={22} /> Apuestas
        <button onClick={load} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", marginLeft: "0.5rem" }} title="Actualizar">
          <RefreshCw size={16} />
        </button>
      </h2>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {bets === null && <p style={{ color: "var(--text-faint)" }}>Cargando...</p>}

      {bets !== null && (
        <>
          <h3 style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Pendientes {pending.length > 0 && `(${pending.length})`}
          </h3>
          {pending.length === 0 && <p style={{ color: "var(--text-faint)", fontSize: "0.85rem" }}>Nada pendiente.</p>}
          {pending.map((bet) => (
            <BetRow key={bet.id} bet={bet} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}

          {others.length > 0 && (
            <>
              <h3 style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "1.5rem" }}>Historial</h3>
              {others.map((bet) => (
                <BetRow key={bet.id} bet={bet} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
