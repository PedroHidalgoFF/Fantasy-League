import { NextResponse } from "next/server";
import { getAllPlayers } from "../../../../lib/sleeper";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const position = searchParams.get("position") || null;

  const players = await getAllPlayers();

  const results = Object.entries(players)
    .filter(([, p]) => {
      if (typeof p.search_rank !== "number") return false;
      if (position && p.position !== position) return false;
      if (q.length < 2) return true; // modo "explorar": sin texto, se filtra solo por posición
      const fullName = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
      return fullName.includes(q);
    })
    .map(([playerId, p]) => ({
      playerId,
      name: `${p.first_name} ${p.last_name}`,
      position: p.position,
      nflTeam: p.team || "FA",
      searchRank: p.search_rank,
    }))
    .sort((a, b) => a.searchRank - b.searchRank)
    .slice(0, 24);

  return NextResponse.json({ results });
}
