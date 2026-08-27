// lib/weeklyReport.js
// A partir de los matchups de una semana, arma los pares de equipos que
// se enfrentaron y calcula estadísticas destacadas: quién puntuó más/menos,
// el enfrentamiento más cerrado, el más lopsided, etc.

export function buildWeeklyReport(matchups, rosterTeamNames) {
  // Sleeper da un objeto por equipo, con un matchup_id que comparten los
  // dos equipos que se enfrentaron. Los agrupamos en pares.
  const byMatchupId = {};
  for (const m of matchups) {
    if (!byMatchupId[m.matchup_id]) byMatchupId[m.matchup_id] = [];
    byMatchupId[m.matchup_id].push(m);
  }

  const pairs = Object.values(byMatchupId)
    .filter((teams) => teams.length === 2)
    .map(([a, b]) => {
      const teamA = { name: rosterTeamNames[a.roster_id] || `Equipo ${a.roster_id}`, points: a.points ?? 0 };
      const teamB = { name: rosterTeamNames[b.roster_id] || `Equipo ${b.roster_id}`, points: b.points ?? 0 };
      const winner = teamA.points >= teamB.points ? teamA : teamB;
      const loser = teamA.points >= teamB.points ? teamB : teamA;

      return {
        teamA,
        teamB,
        winner: winner.name,
        margin: Math.round((winner.points - loser.points) * 10) / 10,
      };
    });

  if (pairs.length === 0) {
    return { pairs: [], highScore: null, lowScore: null, closest: null, blowout: null };
  }

  // Todas las puntuaciones individuales (no por matchup, por equipo)
  const allTeamScores = pairs.flatMap((p) => [p.teamA, p.teamB]);

  const highScore = [...allTeamScores].sort((x, y) => y.points - x.points)[0];
  const lowScore = [...allTeamScores].sort((x, y) => x.points - y.points)[0];

  const closest = [...pairs].sort((x, y) => x.margin - y.margin)[0];
  const blowout = [...pairs].sort((x, y) => y.margin - x.margin)[0];

  return { pairs, highScore, lowScore, closest, blowout };
}
