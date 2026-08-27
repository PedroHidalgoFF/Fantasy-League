"use client";

import { useState } from "react";
import Image from "next/image";
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
  Menu,
  X,
  RefreshCw,
  Radio,
} from "lucide-react";

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

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // El panel de admin y la pantalla de setup tienen su propio look
  if (pathname?.startsWith("/admin") || pathname === "/setup") return null;

  async function handleChangeLeague() {
    await fetch("/api/setup/reset", { method: "POST" });
    window.location.href = "/setup";
  }

  const midpoint = Math.ceil(LINKS.length / 2);
  const firstHalf = LINKS.slice(0, midpoint);
  const secondHalf = LINKS.slice(midpoint);

  function renderLinks(links) {
    return links.map(({ href, label, icon: Icon }) => {
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
    });
  }

  return (
    <>
      {/* Botón hamburguesa: solo visible en móvil */}
      <button className="mobile-toggle" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu size={22} />
      </button>

      {/* Fondo oscuro detrás del drawer en móvil */}
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-header" style={{ justifyContent: "flex-end" }}>
          <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">{renderLinks(firstHalf)}</nav>

        <div style={{ display: "flex", justifyContent: "center", padding: "1.25rem 0" }}>
          <Image src="/logo-mark.png" alt="League logo" width={44} height={44} className="sidebar-logo" />
        </div>

        <nav className="sidebar-nav">{renderLinks(secondHalf)}</nav>

        <button
          onClick={handleChangeLeague}
          className="sidebar-link"
          style={{ marginTop: "auto", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
        >
          <RefreshCw size={20} />
          <span>Change League</span>
        </button>
      </aside>
    </>
  );
}
