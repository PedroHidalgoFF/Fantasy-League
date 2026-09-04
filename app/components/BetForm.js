"use client";

import { useState } from "react";
import { Send, Check } from "lucide-react";

const selectStyle = {
  flex: 1,
  minWidth: 140,
  padding: "0.6rem",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
};
const inputStyle = {
  width: "100%",
  padding: "0.6rem",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  marginBottom: "0.9rem",
  boxSizing: "border-box",
};
const labelStyle = {
  display: "block",
  fontSize: "0.8rem",
  color: "var(--text-muted)",
  marginBottom: "0.3rem",
  fontWeight: 600,
};

export default function BetForm({ teams, currentWeek }) {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [week, setWeek] = useState(currentWeek || 1);
  const [wager, setWager] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!teamA || !teamB || teamA === teamB || !wager.trim()) return;

    setStatus("sending");
    const teamAObj = teams.find((t) => String(t.rosterId) === teamA);
    const teamBObj = teams.find((t) => String(t.rosterId) === teamB);

    try {
      const res = await fetch("/api/bets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week: Number(week),
          teamARosterId: teamA,
          teamAName: teamAObj?.teamName || "",
          teamBRosterId: teamB,
          teamBName: teamBObj?.teamName || "",
          wager: wager.trim(),
          submittedBy: submittedBy.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      setStatus("sent");
      setTeamA("");
      setTeamB("");
      setWager("");
      setSubmittedBy("");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        style={{
          border: "1px solid var(--accent)",
          borderRadius: "12px",
          padding: "1.5rem",
          background: "var(--surface)",
          textAlign: "center",
        }}
      >
        <Check size={28} color="var(--accent)" style={{ marginBottom: "0.5rem" }} />
        <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>¡Enviada!</div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
          El admin la va a revisar antes de que aparezca en la lista.
        </p>
        <button
          onClick={() => setStatus("idle")}
          style={{
            marginTop: "1rem",
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "0.5rem 1rem",
            cursor: "pointer",
            color: "var(--text)",
          }}
        >
          Proponer otra
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", background: "var(--surface)" }}
    >
      <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Proponer una apuesta</h3>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <select value={teamA} onChange={(e) => setTeamA(e.target.value)} required style={selectStyle}>
          <option value="">Equipo A</option>
          {teams.map((t) => (
            <option key={t.rosterId} value={t.rosterId} disabled={String(t.rosterId) === teamB}>
              {t.teamName}
            </option>
          ))}
        </select>
        <span style={{ alignSelf: "center", color: "var(--text-muted)" }}>vs</span>
        <select value={teamB} onChange={(e) => setTeamB(e.target.value)} required style={selectStyle}>
          <option value="">Equipo B</option>
          {teams.map((t) => (
            <option key={t.rosterId} value={t.rosterId} disabled={String(t.rosterId) === teamA}>
              {t.teamName}
            </option>
          ))}
        </select>
      </div>

      <label style={labelStyle}>Semana</label>
      <input
        type="number"
        min="1"
        max="18"
        value={week}
        onChange={(e) => setWeek(e.target.value)}
        required
        style={inputStyle}
      />

      <label style={labelStyle}>¿Qué se apuestan?</label>
      <input
        type="text"
        value={wager}
        onChange={(e) => setWager(e.target.value)}
        placeholder="ej. 2 caguamas de las caras en la barra de Luis"
        required
        style={inputStyle}
      />

      <label style={labelStyle}>Tu nombre (opcional)</label>
      <input type="text" value={submittedBy} onChange={(e) => setSubmittedBy(e.target.value)} style={inputStyle} />

      {status === "error" && <p style={{ color: "var(--danger)", fontSize: "0.85rem" }}>{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          width: "100%",
          padding: "0.75rem",
          borderRadius: "8px",
          border: "none",
          background: "var(--accent)",
          color: "var(--accent-contrast)",
          fontWeight: 700,
          cursor: "pointer",
          marginTop: "0.5rem",
        }}
      >
        <Send size={16} /> {status === "sending" ? "Enviando..." : "Enviar para aprobación"}
      </button>
    </form>
  );
}
