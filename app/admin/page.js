import { getWeeklyMatchupData } from "../../lib/sleeper";
import { getLeagueId } from "../../lib/session";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const leagueId = getLeagueId();
  // Usamos exactamente la misma función que /weekly-report para que el
  // post que publiques quede asociado a la semana correcta.
  const { week: currentWeek } = await getWeeklyMatchupData(leagueId).catch(() => ({ week: 1 }));

  return <AdminDashboard currentWeek={currentWeek} />;
}
