import { getWeeklyMatchupData } from "../../lib/sleeper";
import { getLeagueId } from "../../lib/session";
import AdminDashboard from "./AdminDashboard";
import BetsAdmin from "./BetsAdmin";
import AdminNotifications from "./AdminNotifications";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const leagueId = getLeagueId();
  // Usamos exactamente la misma función que /weekly-report para que el
  // post que publiques quede asociado a la semana correcta.
  const { week: currentWeek } = await getWeeklyMatchupData(leagueId).catch(() => ({ week: 1 }));

  return (
    <>
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "var(--text-muted)",
          textDecoration: "none",
          marginBottom: "1.25rem",
        }}
      >
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <AdminDashboard currentWeek={currentWeek} />
      <BetsAdmin />
      <AdminNotifications />
    </>
  );
}
