import { getEspnScores } from "../../lib/espnScores";
import { getRegularSeasonState } from "../../lib/sleeper";
import { Radio } from "lucide-react";

export const dynamic = "force-dynamic";

const PRESEASON_WEEKS = [1, 2, 3];
const REGULAR_WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);

function formatDayHeader(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatKickoff(dateStr) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

function TeamRow({ team, showScore }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.3rem 0" }}>
      {team.logo ? (
        <img src={team.logo} alt="" width={26} height={26} style={{ width: 26, height: 26, objectFit: "contain", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--border-soft)", flexShrink: 0 }} />
      )}
      <span style={{ fontWeight: team.winner ? 700 : 500, fontSize: "0.92rem" }}>{team.name}</span>
      <span style={{ color: "var(--text-faint)", fontSize: "0.75rem" }}>{team.record}</span>
      {showScore && (
        <span style={{ marginLeft: "auto", fontWeight: team.winner ? 700 : 500, fontSize: "1.05rem" }}>
          {team.score}
        </span>
      )}
    </div>
  );
}

function GameRow({ game }) {
  const isLive = game.state === "in";
  const isPre = game.state === "pre";
  const kickoff = isPre ? formatKickoff(game.date) : null;

  return (
    <div
      style={{
        display: "flex",
        border: `1px solid ${isLive ? "var(--danger)" : "var(--border)"}`,
        borderRadius: "10px",
        padding: "0.75rem 0.9rem",
        marginBottom: "0.6rem",
        background: "var(--surface)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <TeamRow team={game.away} showScore={!isPre} />
        <TeamRow team={game.home} showScore={!isPre} />
      </div>

      <div style={{ textAlign: "right", paddingLeft: "0.75rem", minWidth: "92px" }}>
        {isLive && (
          <div style={{ color: "var(--danger)", fontWeight: 700, fontSize: "0.75rem" }}>{game.statusText}</div>
        )}
        {isLive && game.downDistance && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: "0.2rem" }}>{game.downDistance}</div>
        )}
        {!isLive && !isPre && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600 }}>{game.statusText}</div>
        )}
        {isPre && kickoff && (
          <>
            <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>{kickoff.date}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{kickoff.time}</div>
          </>
        )}
        {game.broadcast && (
          <div style={{ color: "var(--text-faint)", fontSize: "0.68rem", marginTop: "0.3rem" }}>{game.broadcast}</div>
        )}
      </div>
    </div>
  );
}

function WeekTab({ label, active, href }) {
  return (
    <a
      href={href}
      style={{
        flexShrink: 0,
        padding: "0.4rem 0.85rem",
        borderRadius: "999px",
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--surface-active)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-muted)",
        fontSize: "0.8rem",
        fontWeight: active ? 700 : 500,
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </a>
  );
}

export default async function ScoresPage({ searchParams }) {
  const seasonType = searchParams?.st ? Number(searchParams.st) : null;
  const week = searchParams?.wk ? Number(searchParams.wk) : null;

  let year = null;
  if (!seasonType || !week) {
    // Sin selección explícita: dejamos que ESPN nos diga cuál es la semana
    // actual, usando nuestro propio año de temporada regular como referencia.
    const { season } = await getRegularSeasonState().catch(() => ({ season: null }));
    year = season;
  } else {
    const { season } = await getRegularSeasonState().catch(() => ({ season: null }));
    year = season;
  }

  const { games, meta } = await getEspnScores(
    seasonType && week ? { year, seasontype: seasonType, week } : {}
  ).catch(() => ({ games: [], meta: {} }));

  const activeSeasonType = seasonType || meta.seasonType;
  const activeWeek = week || meta.week;

  const buildHref = (st, wk) => `/scores?st=${st}&wk=${wk}`;

  const byDay = {};
  for (const g of games) {
    const key = new Date(g.date).toDateString();
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(g);
  }

  return (
    <main style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Radio size={26} /> Scores
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
        NFL results, updated whenever the site refreshes.
      </p>

      <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", paddingTop: "1rem", paddingBottom: "1rem" }}>
        {PRESEASON_WEEKS.map((w) => (
          <WeekTab key={`pre-${w}`} label={`Pre Wk ${w}`} active={activeSeasonType === 1 && activeWeek === w} href={buildHref(1, w)} />
        ))}
        {REGULAR_WEEKS.map((w) => (
          <WeekTab key={`reg-${w}`} label={`Week ${w}`} active={activeSeasonType === 2 && activeWeek === w} href={buildHref(2, w)} />
        ))}
      </div>

      {games.length === 0 && <p>No games found for this week.</p>}

      {Object.entries(byDay).map(([dateKey, dayGames]) => (
        <div key={dateKey} style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "0.95rem" }}>{formatDayHeader(dayGames[0].date)}</h2>
          {dayGames.map((g) => (
            <GameRow key={g.id} game={g} />
          ))}
        </div>
      ))}
    </main>
  );
}
