import { getWeeklyMatchupData } from "../../lib/sleeper";
import { buildWeeklyReport } from "../../lib/weeklyReport";
import { getPublishedPost } from "../../lib/posts";
import { getUpcomingMatchupForecasts } from "../../lib/matchupForecast";
import { getWeeklyReportExtras } from "../../lib/weeklyReportStats";
import { getBustBoom } from "../../lib/bustboom";
import { getWaiverWireWins } from "../../lib/waiverWins";
import { getHeadToHeadRecords } from "../../lib/headToHead";
import { getBets, resolveBetOutcome } from "../../lib/bets";
import { ClipboardList } from "lucide-react";
import { getLeagueId } from "../../lib/session";
import { isValidSession, ADMIN_COOKIE_NAME } from "../../lib/auth";
import { cookies } from "next/headers";
import AdminEditablePost from "../components/AdminEditablePost";
import WeeklyReportTabs from "./WeeklyReportTabs";

export const dynamic = "force-dynamic";

export default async function WeeklyReportPage({ searchParams }) {
  const leagueId = getLeagueId();
  const initialTab = searchParams?.tab || "overview";
  const isAdmin = await isValidSession(cookies().get(ADMIN_COOKIE_NAME)?.value);

  const { matchups, players, rosterTeamNames, week, season } = await getWeeklyMatchupData(leagueId);
  const report = buildWeeklyReport(matchups, rosterTeamNames);

  const [
    weekPost,
    bustboomPost,
    waiverWinsPost,
    headToHeadPost,
    { forecasts },
    extras,
    bustboom,
    waiverWins,
    headToHead,
  ] = await Promise.all([
    getPublishedPost("weekly-report", week).catch(() => null),
    getPublishedPost("bustboom").catch(() => null),
    getPublishedPost("waiver-wins").catch(() => null),
    getPublishedPost("head-to-head").catch(() => null),
    getUpcomingMatchupForecasts(leagueId).catch(() => ({ week: null, forecasts: [] })),
    getWeeklyReportExtras(leagueId, season, week).catch(() => ({
      bestCoach: null,
      worstCoach: null,
      primePlayers: {},
      shitPlayers: {},
      wireTargets: {},
    })),
    getBustBoom({ leagueId, week, season, matchups, players, rosterTeamNames }).catch(() => ({ booms: [], busts: [] })),
    getWaiverWireWins(leagueId).catch(() => []),
    getHeadToHeadRecords(leagueId).catch(() => []),
  ]);

  const weekBets = await getBets(leagueId, { status: "approved" }).catch(() => []);
  const bets = await Promise.all(
    weekBets
      .filter((b) => b.week === week)
      .map(async (bet) => ({ ...bet, outcome: await resolveBetOutcome(leagueId, bet) }))
  );

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <ClipboardList size={26} /> Weekly Report
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0, marginBottom: "0.25rem" }}>
        Everything about this week's action — matchups, standouts, waiver wins and rivalries.
      </p>
      <p style={{ color: "var(--text-faint)", fontSize: "0.8rem", marginTop: 0, marginBottom: "1.5rem" }}>
        {new Date().toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" })}
      </p>

      <AdminEditablePost page="weekly-report" week={week} initialPost={weekPost} isAdmin={isAdmin} />

      <WeeklyReportTabs
        initialTab={initialTab}
        report={report}
        forecasts={forecasts}
        extras={extras}
        bustboom={bustboom}
        bustboomPost={bustboomPost}
        waiverWins={waiverWins}
        waiverWinsPost={waiverWinsPost}
        headToHead={headToHead}
        headToHeadPost={headToHeadPost}
        bets={bets}
        isAdmin={isAdmin}
      />
    </main>
  );
}
