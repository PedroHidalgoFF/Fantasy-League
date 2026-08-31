import { redirect } from "next/navigation";

// Bust/Boom ahora vive como tab dentro de Weekly Report — esta ruta se
// mantiene solo para no romper links/bookmarks/notificaciones viejas.
export default function BustBoomRedirect() {
  redirect("/weekly-report?tab=bustboom");
}
