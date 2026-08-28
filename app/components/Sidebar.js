"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  ClipboardList,
  Repeat,
  Target,
  Zap,
  Swords,
  Users,
  Star,
  Newspaper,
  X,
  RefreshCw,
  RotateCw,
  Radio,
  MoreHorizontal,
} from "lucide-react";
import NotificationsToggle from "./NotificationsToggle";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/scores", label: "Live Scores", icon: Radio },
  { href: "/power-rankings", label: "Power Rankings", icon: Trophy },
  { href: "/weekly-report", label: "Weekly Report", icon: ClipboardList },
  { href: "/trades", label: "Trades", icon: Repeat },
  { href: "/waiver-wins", label: "Waiver Wins", icon: Target },
  { href: "/bustboom", label: "Bust/Boom", icon: Zap },
  { href: "/head-to-head", label: "Head-to-Head", icon: Swords },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/top-players", label: "Top 300", icon: Star },
  { href: "/news", label: "News", icon: Newspaper },
];

// Los 4 accesos más usados van fijos abajo en móvil; el resto vive en "More"
const MOBILE_PRIMARY = ["/", "/power-rankings", "/weekly-report", "/scores"];

export default function Sidebar({ logoUrl = "/logo-mark.png" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // El panel de admin y la pantalla de setup tienen su propio look
  if (pathname?.startsWith("/admin") || pathname === "/setup") return null;

  async function handleChangeLeague() {
    await fetch("/api/setup/reset", { method: "POST" });
    window.location.href = "/setup";
  }

  return (
    <>
      {/* Barra fija abajo: solo visible en móvil */}
      <nav className="mobile-bottom-nav">
        {LINKS.filter((l) => MOBILE_PRIMARY.includes(l.href)).map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <a
              key={href}
              href={href}
              className={`bottom-nav-item ${active ? "bottom-nav-item-active" : ""}`}
            >
              <span className="bottom-nav-icon">
                <Icon size={22} />
              </span>
              <span>{label}</span>
            </a>
          );
        })}
        <button className="bottom-nav-item" onClick={() => setOpen(true)}>
          <span className="bottom-nav-icon">
            <MoreHorizontal size={22} />
          </span>
          <span>More</span>
        </button>
      </nav>

      {/* Fondo oscuro detrás del drawer en móvil */}
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-header" style={{ justifyContent: "center", position: "relative" }}>
          <img
            src={logoUrl}
            alt="League logo"
            width={44}
            height={44}
            className="sidebar-logo"
            style={{ width: 44, height: 44, objectFit: "cover" }}
          />
          <button
            className="mobile-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{ position: "absolute", right: 0 }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <a
                key={href}
                href={href}
                className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </a>
            );
          })}
        </nav>

        <NotificationsToggle />

        <button
          onClick={() => window.location.reload()}
          className="sidebar-link"
          style={{ marginTop: "auto", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
        >
          <RotateCw size={20} />
          <span>Refresh</span>
        </button>

        <button
          onClick={handleChangeLeague}
          className="sidebar-link"
          style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
        >
          <RefreshCw size={20} />
          <span>Change League</span>
        </button>
      </aside>
    </>
  );
}
