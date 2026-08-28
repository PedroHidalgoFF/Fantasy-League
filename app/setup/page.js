"use client";

import { useState } from "react";
import Image from "next/image";
import TeamLogo from "../components/TeamLogo";

export default function SetupPage() {
  const [step, setStep] = useState(1); // 1: username/ID, 2: choose league (if via username), 3: choose team
  const [mode, setMode] = useState("username"); // "username" | "id"
  const [username, setUsername] = useState("");
  const [leagueIdInput, setLeagueIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [userLeagues, setUserLeagues] = useState([]); // from username lookup
  const [leagueId, setLeagueId] = useState("");
  const [leagueInfo, setLeagueInfo] = useState(null); // from validate-league (teams list)
  const [selectedRoster, setSelectedRoster] = useState("");

  async function handleLookupUsername(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/setup/lookup-leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    if (data.leagues.length === 0) {
      setError("No fantasy football leagues found for that username.");
      return;
    }

    setUserLeagues(data.leagues);
    setStep(2);
  }

  async function loadTeamsForLeague(id) {
    setLoading(true);
    setError("");

    const res = await fetch("/api/setup/validate-league", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leagueId: id }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    setLeagueId(id);
    setLeagueInfo(data);
    setStep(3);
  }

  async function handleValidateId(e) {
    e.preventDefault();
    await loadTeamsForLeague(leagueIdInput);
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

  const inputStyle = {
    width: "100%",
    padding: "0.65rem",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    marginTop: "0.4rem",
    marginBottom: "0.5rem",
  };

  const buttonStyle = {
    width: "100%",
    padding: "0.65rem",
    borderRadius: "8px",
    border: "none",
    background: "var(--accent)",
    color: "var(--accent-contrast)",
    fontWeight: "bold",
    cursor: "pointer",
  };

  return (
    <main style={{ maxWidth: 420, margin: "3rem auto", padding: "0 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <Image src="/logo-mark.png" alt="League logo" width={56} height={56} style={{ borderRadius: "10px", margin: "0 auto 1rem" }} />
        <h1 style={{ fontSize: "1.5rem" }}>Welcome</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          {step === 1 && mode === "username" && "Find your league with your Sleeper username."}
          {step === 1 && mode === "id" && "Connect your Sleeper league to get started."}
          {step === 2 && "Which league?"}
          {step === 3 && "Which team is yours?"}
        </p>
      </div>

      {step === 1 && mode === "username" && (
        <form onSubmit={handleLookupUsername}>
          <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Sleeper Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. sleeperuser"
            style={inputStyle}
          />
          <button type="submit" disabled={loading || !username} style={{ ...buttonStyle, marginBottom: "0.75rem" }}>
            {loading ? "Looking up..." : "Find my leagues"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("id");
              setError("");
            }}
            style={{ width: "100%", background: "none", border: "none", color: "var(--text-faint)", fontSize: "0.8rem", cursor: "pointer" }}
          >
            Or paste a league ID instead →
          </button>
        </form>
      )}

      {step === 1 && mode === "id" && (
        <form onSubmit={handleValidateId}>
          <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Sleeper League ID</label>
          <input
            type="text"
            value={leagueIdInput}
            onChange={(e) => setLeagueIdInput(e.target.value)}
            placeholder="e.g. 1361083494620479488"
            style={inputStyle}
          />
          <p style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginBottom: "1rem" }}>
            Find it in your league's URL on sleeper.com: sleeper.com/leagues/<strong>THIS PART</strong>/team
          </p>
          <button type="submit" disabled={loading || !leagueIdInput} style={{ ...buttonStyle, marginBottom: "0.75rem" }}>
            {loading ? "Checking..." : "Continue"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("username");
              setError("");
            }}
            style={{ width: "100%", background: "none", border: "none", color: "var(--text-faint)", fontSize: "0.8rem", cursor: "pointer" }}
          >
            ← Find my leagues by username instead
          </button>
        </form>
      )}

      {step === 2 && (
        <div>
          <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
            {userLeagues.map((l) => (
              <button
                key={l.leagueId}
                onClick={() => loadTeamsForLeague(l.leagueId)}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "0.6rem 0.75rem",
                  background: "var(--surface)",
                  color: "var(--text)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <TeamLogo avatar={l.avatar} teamName={l.name} size={30} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{l.name}</div>
                  <div style={{ color: "var(--text-faint)", fontSize: "0.75rem" }}>{l.season}</div>
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            style={{ width: "100%", background: "none", border: "none", color: "var(--text-faint)", fontSize: "0.8rem", cursor: "pointer" }}
          >
            ← Back
          </button>
        </div>
      )}

      {step === 3 && leagueInfo && (
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
                <TeamLogo avatar={t.avatar} teamName={t.teamName} size={30} />
                {t.teamName}
              </label>
            ))}
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Saving..." : "Finish"}
          </button>
        </form>
      )}

      {error && <p style={{ color: "var(--danger)", marginTop: "1rem", fontSize: "0.85rem" }}>{error}</p>}
    </main>
  );
}
