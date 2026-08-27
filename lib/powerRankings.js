// lib/powerRankings.js
// Calcula un "power score" objetivo por equipo, combinando récord y puntos.
// Esto es un punto de partida automático — más adelante puedes ajustarlo
// manualmente cada semana si quieres el toque editorial.

export function calculatePowerRankings(standings) {
  if (standings.length === 0) return [];

  const maxPointsFor = Math.max(...standings.map((s) => s.pointsFor), 1);
  const totalGames = standings.map((s) => s.wins + s.losses + s.ties);
  const maxGames = Math.max(...totalGames, 1);

  const withScore = standings.map((team) => {
    const games = team.wins + team.losses + team.ties;
    const winPct = games > 0 ? (team.wins + team.ties * 0.5) / games : 0;
    const pointsScore = team.pointsFor / maxPointsFor; // 0 a 1

    // Fórmula simple: 60% récord, 40% puntos a favor.
    // Ajustable: sube el peso de winPct si quieres premiar más el récord
    // que el "podría haber ganado más" de los puntos.
    const powerScore = winPct * 0.6 + pointsScore * 0.4;

    return { ...team, powerScore: Math.round(powerScore * 1000) / 10 }; // 0-100
  });

  withScore.sort((a, b) => b.powerScore - a.powerScore);

  return withScore.map((team, index) => ({
    ...team,
    rank: index + 1,
  }));
}
