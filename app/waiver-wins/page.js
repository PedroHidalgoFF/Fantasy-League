import { redirect } from "next/navigation";

// Waiver Wins ahora vive como tab dentro de Weekly Report — esta ruta se
// mantiene solo para no romper links/bookmarks/notificaciones viejas.
export default function WaiverWinsRedirect() {
  redirect("/weekly-report?tab=waiver-wins");
}
