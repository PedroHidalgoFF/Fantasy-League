"use client";

import { useState } from "react";
import Image from "next/image";

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [leagueId, setLeagueId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leagueInfo, setLeagueInfo] = useState(null);
  const [selectedRoster, setSelectedRoster] = useState("");

  async function handleValidate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/setup/validate-league", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leagueId }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    setLeagueInfo(data);
    setStep(2);
  }

  async function handleFinish(e) {
    e.preventDefault();
    if (!selectedRoster) {
      setError("Pick your team first.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/setup/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leagueId, rosterId: selectedRoster }),
    });

    setLoading(false);

    if (res.ok) {
      window.location.href = "/";
    } else {
      setError("Couldn't save your league. Try again.");
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "3rem auto", padding: "0 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <Image src="/logo-mark.png" alt="League logo" width={56} height={56} style={{ borderRadius: "10px", margin: "0 auto 1rem" }} />
        <h1 style={{ fontSize: "1.5rem" }}>Welcome</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          {step === 1 ? "Connect your Sleeper league to get started." : "Which team is yours?"}
        </p>
      </div>

      {step === 1 && (
        <form onSubmit={handleValidate}>
          <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Sleeper League ID</label>
          <input
            type="text"
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
            placeholder="e.g. 1361083494620479488"
            style={{
              width: "100%",
              padding: "0.65rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              marginTop: "0.4rem",
              marginBottom: "0.5rem",
            }}
          />
          <p style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginBottom: "1rem" }}>
            Find it in your league's URL on sleeper.com: sleeper.com/leagues/<strong>THIS PART</strong>/team
          </p>
          <button
            type="submit"
            disabled={loading || !leagueId}
            style={{
              width: "100%",
              padding: "0.65rem",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent)",
              color: "var(--accent-contrast)",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading ? "Checking..." : "Continue"}
          </button>
        </form>
      )}

      {step === 2 && leagueInfo && (
        <form onSubmit={handleFinish}>
          <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
            <strong>{leagueInfo.leagueName}</strong> · {leagueInfo.season}
          </p>

          <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
            {leagueInfo.teams.map((t) => (
              <label
                key={t.rosterId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  border: `1px solid ${selectedRoster === String(t.rosterId) ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "8px",
                  padding: "0.6rem 0.75rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="team"
                  value={t.rosterId}
                  checked={selectedRoster === String(t.rosterId)}
                  onChange={(e) => setSelectedRoster(e.target.value)}
                />
                {t.teamName}
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.65rem",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent)",
              color: "var(--accent-contrast)",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading ? "Saving..." : "Finish"}
          </button>
        </form>
      )}

      {error && <p style={{ color: "var(--danger)", marginTop: "1rem", fontSize: "0.85rem" }}>{error}</p>}
    </main>
  );
}
