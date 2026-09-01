"use client";

import { useState } from "react";
import { Download, X, Share, Menu, Bell } from "lucide-react";
import NotificationsToggle from "./NotificationsToggle";

const IOS_STEPS = [
  {
    title: "Abre el sitio en Safari",
    body: "Tiene que ser Safari — Chrome en iPhone no puede agregar apps a la pantalla de inicio.",
  },
  {
    title: 'Toca el ícono de "Compartir"',
    body: "Es el cuadrito con la flecha hacia arriba, abajo al centro de la pantalla.",
  },
  {
    title: 'Busca "Agregar a inicio"',
    body: "Desliza hacia abajo en el menú que se abre hasta encontrar esa opción.",
  },
  {
    title: 'Toca "Agregar"',
    body: "Arriba a la derecha — te va a quedar un ícono en tu pantalla de inicio.",
  },
  {
    title: "Abre la app desde ese ícono",
    body: "No desde Safari — las notificaciones solo funcionan abriéndola desde el ícono.",
  },
];

const ANDROID_STEPS = [
  {
    title: "Abre el sitio en Chrome",
    body: "Debe ser Chrome (o cualquier navegador basado en él, como Edge o Brave).",
  },
  {
    title: 'Toca el menú de 3 puntos (⋮)',
    body: "Arriba a la derecha de la pantalla.",
  },
  {
    title: 'Toca "Instalar app" (o "Agregar a pantalla de inicio")',
    body: "El texto exacto varía un poco según la versión de Chrome.",
  },
  {
    title: 'Confirma con "Instalar"',
    body: "Te va a quedar un ícono en tu pantalla de inicio, sin la barra del navegador.",
  },
];

function StepList({ steps }) {
  return (
    <ol style={{ paddingLeft: "1.1rem", margin: "1rem 0" }}>
      {steps.map((step, i) => (
        <li key={i} style={{ marginBottom: "0.75rem" }}>
          <strong style={{ fontSize: "0.9rem" }}>{step.title}</strong>
          <div style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "0.15rem" }}>{step.body}</div>
        </li>
      ))}
    </ol>
  );
}

function PlatformTabs({ platform, setPlatform }) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
      {["ios", "android"].map((p) => (
        <button
          key={p}
          onClick={() => setPlatform(p)}
          style={{
            flex: 1,
            padding: "0.5rem",
            borderRadius: "8px",
            border: platform === p ? "1px solid var(--accent)" : "1px solid var(--border)",
            background: platform === p ? "var(--surface-active)" : "transparent",
            color: platform === p ? "var(--accent)" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          {p === "ios" ? "iPhone" : "Android"}
        </button>
      ))}
    </div>
  );
}

export default function InstallAppBanner() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState("ios");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          width: "100%",
          textAlign: "left",
          border: "1px solid var(--accent)",
          borderRadius: "12px",
          padding: "1rem 1.1rem",
          marginBottom: "1.5rem",
          background: "var(--surface)",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            background: `var(--accent)22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Download size={20} color="var(--accent)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Add to your home screen</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            Get an app icon, no browser bar, and push notifications.
          </div>
        </div>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderRadius: "14px",
              maxWidth: "480px",
              width: "100%",
              maxHeight: "85vh",
              overflow: "auto",
              border: "1px solid var(--border)",
              padding: "1.5rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, border: "none", padding: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Download size={20} /> Add to home screen
              </h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
              No app store needed — this installs straight from your browser, with your own icon and no browser
              bar.
            </p>

            <PlatformTabs platform={platform} setPlatform={setPlatform} />

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "1.25rem", marginBottom: "0.25rem" }}>
              <Share size={16} style={{ display: platform === "ios" ? "block" : "none" }} />
              <Menu size={16} style={{ display: platform === "android" ? "block" : "none" }} />
              <strong style={{ fontSize: "0.9rem" }}>Step 1 — Add to home screen</strong>
            </div>
            <StepList steps={platform === "ios" ? IOS_STEPS : ANDROID_STEPS} />

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem", marginBottom: "0.25rem" }}>
              <Bell size={16} />
              <strong style={{ fontSize: "0.9rem" }}>Step 2 — Turn on notifications</strong>
            </div>
            {platform === "ios" ? (
              <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "0.15rem" }}>
                On iPhone, notifications only work from the installed app — open it from your home screen icon
                (not Safari), then open the menu and tap &ldquo;Enable Notifications&rdquo;. If you open it from
                Safari first, that option won&rsquo;t show up yet.
              </p>
            ) : (
              <p style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "0.15rem" }}>
                On Android this works right in Chrome, install or not. Open the menu and tap &ldquo;Enable
                Notifications&rdquo; — installing to your home screen first is optional but gives you the full
                app feel.
              </p>
            )}

            <div
              style={{
                marginTop: "1rem",
                "--sidebar-text": "var(--text-primary)",
                "--sidebar-text-active": "var(--accent)",
              }}
            >
              <NotificationsToggle />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
