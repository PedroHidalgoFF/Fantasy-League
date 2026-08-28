import "./globals.css";
import Sidebar from "./components/Sidebar";
import { getLeagueId } from "../lib/session";
import { getLeague } from "../lib/sleeper";

export const metadata = {
  title: "Fantasy Partner",
  description: "Power rankings, standings, trades, and league news",
  appleWebApp: {
    capable: true,
    title: "RedZone Redemption",
    statusBarStyle: "black-translucent",
  },
};

export default async function RootLayout({ children }) {
  const leagueId = getLeagueId();

  // Intentamos usar el logo real de la liga en Sleeper. Si no hay liga
  // configurada todavía, o Sleeper falla, usamos el logo por default.
  let logoUrl = "/logo-mark.png";
  if (leagueId) {
    try {
      const league = await getLeague(leagueId);
      if (league?.avatar) {
        logoUrl = `https://sleepercdn.com/avatars/thumbs/${league.avatar}`;
      }
    } catch {
      // se queda con el logo por default
    }
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-shell">
          <Sidebar logoUrl={logoUrl} />
          <div className="app-content">{children}</div>
        </div>
      </body>
    </html>
  );
}
