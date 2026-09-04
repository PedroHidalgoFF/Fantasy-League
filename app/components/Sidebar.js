"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  ClipboardList,
  Repeat,
  Handshake,
  Users,
  Star,
  Newspaper,
  X,
  RefreshCw,
  RotateCw,
  Radio,
  MoreHorizontal,
  UserCircle,
  Rows3,
  Rss,
  BarChart3,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import NotificationsToggle from "./NotificationsToggle";
import DarkModeToggle from "./DarkModeToggle";

// Home y My Team siempre visibles arriba (son las más usadas). El resto
// vive agrupado, para que el menú no se sienta como una lista interminable.
const TOP_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/my-team", label: "My Team", icon: UserCircle },
];

const GROUPS = [
  {
    label: "Feed",
    icon: Rss,
    links: [
      { href: "/news", label: "News", icon: Newspaper },
      { href: "/scores", label: "Scores", icon: Radio },
      { href: "/weekly-report", label: "Weekly Report", icon: ClipboardList },
    ],
  },
  {
    label: "Rankings",
    icon: BarChart3,
    links: [
      { href: "/power-rankings", label: "Power Rankings", icon: Trophy },
      { href: "/top-players", label: "Top 300", icon: Star },
      { href: "/players", label: "Player Stats", icon: Rows3 },
    ],
  },
  {
    label: "Playbook",
    icon: BookOpen,
    links: [
      { href: "/trades", label: "Trades", icon: Repeat },
      { href: "/bets", label: "Bets", icon: Handshake },
      { href: "/teams", label: "Teams", icon: Users },
    ],
  },
];

const ALL_LINKS = [...TOP_LINKS, ...GROUPS.flatMap((g) => g.links)];

// My Team va al centro de la barra de móvil (posición 3 de 5), es el
// acceso que más se usa.
const MOBILE_PRIMARY_ORDERED = [
  { href: "/", label: "Home", icon: Home },
  { href: "/scores", label: "Scores", icon: Radio },
  { href: "/my-team", label: "My Team", icon: UserCircle },
  { href: "/weekly-report", label: "Weekly Report", icon: ClipboardList },
];

export default function Sidebar({ logoUrl = "/logo-mark.png" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState([]);

  // Al cargar (o cambiar de página), abre automáticamente el grupo que
  // contiene la página activa, para que no tengas que buscarla.
  useEffect(() => {
    const activeGroup = GROUPS.find((g) => g.links.some((l) => l.href === pathname));
    if (activeGroup && !openGroups.includes(activeGroup.label)) {
      setOpenGroups((prev) => [...prev, activeGroup.label]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggleGroup(label) {
    setOpenGroups((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  }

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
        {MOBILE_PRIMARY_ORDERED.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav-item ${active ? "bottom-nav-item-active" : ""}`}
            >
              <span className="bottom-nav-icon">
                <Icon size={22} />
              </span>
              <span>{label}</span>
            </Link>
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
          {TOP_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}

          {GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const isOpen = openGroups.includes(group.label);
            const hasActiveChild = group.links.some((l) => l.href === pathname);

            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`sidebar-link ${hasActiveChild ? "sidebar-link-active" : ""}`}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                    <GroupIcon size={20} />
                    <span>{group.label}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}
                  />
                </button>

                {isOpen && (
                  <div style={{ paddingLeft: "1.1rem", borderLeft: "1px solid rgba(255,255,255,0.08)", marginLeft: "1.1rem" }}>
                    {group.links.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href;
                      return (
                        <Link
                          key={href}
                          href={href}
                          className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
                          onClick={() => setOpen(false)}
                          style={{ fontSize: "0.8rem" }}
                        >
                          <Icon size={16} />
                          <span>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <NotificationsToggle />
        <DarkModeToggle />

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
