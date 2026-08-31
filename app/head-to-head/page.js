import { redirect } from "next/navigation";

// Head-to-Head ahora vive como tab dentro de Weekly Report — esta ruta se
// mantiene solo para no romper links/bookmarks/notificaciones viejas.
export default function HeadToHeadRedirect() {
  redirect("/weekly-report?tab=head-to-head");
}
