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
} from "lucide-react";

const LINKS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/power-rankings", label: "Power Rankings", icon: Trophy },
  { href: "/weekly-report", label: "Reporte Semanal", icon: ClipboardList },
  { href: "/trades", label: "Trades", icon: Repeat },
  { href: "/waiver-wins", label: "Waiver Wins", icon: Target },
  { href: "/bustboom", label: "Bust/Boom", icon: Zap },
  { href: "/head-to-head", label: "Head-to-Head", icon: Swords },
  { href: "/teams", label: "Equipos", icon: Users },
  { href: "/top-players", label: "Top 300", icon: Star },
  { href: "/news", label: "Noticias", icon: Newspaper },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // El panel de admin tiene su propio look, no mostramos el sidebar ahí
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* Botón hamburguesa: solo visible en móvil */}
      <button className="mobile-toggle" onClick={() => setOpen(true)} aria-label="Abrir menú">
        <Menu size={22} />
      </button>

      {/* Fondo oscuro detrás del drawer en móvil */}
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <Image src="/logo-mark.png" alt="Logo de la liga" width={40} height={40} className="sidebar-logo" />
          <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Cerrar menú">
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
      </aside>
    </>
  );
}
