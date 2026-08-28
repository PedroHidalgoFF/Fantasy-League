import PlayerCompare from "./PlayerCompare";
import { Rows3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PlayerStatsPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Rows3 size={26} /> Player Stats
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0, marginBottom: "1.5rem" }}>
        Search and compare season stats — passing, rushing, receiving, and more.
        You can only compare players at the same position.
      </p>

      <PlayerCompare />
    </main>
  );
}
