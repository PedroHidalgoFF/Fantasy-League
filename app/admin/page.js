import { getNFLState } from "../../lib/sleeper";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const state = await getNFLState().catch(() => ({ week: 1 }));
  const currentWeek = Math.max(state.week || 1, 1);

  return <AdminDashboard currentWeek={currentWeek} />;
}
