"use client";

import { useState } from "react";
import { Smartphone, X, Copy, Check } from "lucide-react";
import WidgetPreview from "./WidgetPreview";

const SLEEPER_SCRIPT_URL = "/scriptable/sleeper-widget.js";
const SLEEPER_ESPN_SCRIPT_URL = "/scriptable/sleeper-widget-espn.js";

const STEPS = [
  {
    title: "Instala la app Scriptable",
    body: 'Descárgala gratis desde el App Store — búscala como "Scriptable".',
  },
  {
    title: "Crea un script nuevo",
    body: 'Abre Scriptable, dale al botón "+" arriba a la derecha para crear un script nuevo.',
  },
  {
    title: "Pega el código",
    body: "Borra el contenido de ejemplo, y pega el código de una de las dos versiones de abajo.",
  },
  {
    title: "Ponle nombre y guarda",
    body: 'Nómbralo algo como "Fantasy Widget" y ciérralo — Scriptable lo guarda solo.',
  },
  {
    title: "Corre el script dentro de la app",
    body: "Elige cuántos equipos quieres mostrar (1 a 3) y, por cada uno, la liga (y en la versión ESPN, la plataforma).",
  },
  {
    title: "Agrega el widget a tu pantalla de inicio",
    body: 'Mantén presionada tu pantalla de inicio → toca el "+" arriba → busca "Scriptable" → tamaño "Mediano" (1 equipo) o "Grande" (2-3) → agrégalo.',
  },
  {
    title: "Selecciona tu script",
    body: 'Mantén presionado el widget recién agregado → "Editar Widget" → en "Script" elige el que acabas de crear.',
  },
];

export default function WidgetBanner() {
  const [open, setOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [loadingKey, setLoadingKey] = useState(null);

  async function handleCopy(key, url) {
    setLoadingKey(key);
    try {
      const res = await fetch(url);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // silently ignore if clipboard/fetch isn't available
    }
    setLoadingKey(null);
  }

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
          <Smartphone size={20} color="var(--accent)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Get the iPhone home screen widget</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            See your team's score right on your home screen. Tap for setup steps.
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
                <Smartphone size={20} /> Home Screen Widget Setup
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
              Uses a free app called Scriptable — no coding needed on your end, just copy and paste.
            </p>

            <div style={{ margin: "1rem 0" }}>
              <WidgetPreview />
              <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "0.6rem", lineHeight: 1.5 }}>
                The record turns gray with no games played, green when you&rsquo;re on a winning record, and red
                when you&rsquo;re on a losing one. The points bar and each player&rsquo;s ring shift from red to
                blue as your team gets closer to (or passes) its projected score for the week.
              </p>
            </div>

            <div
              style={{
                background: "var(--surface-active)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "0.85rem 1rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.35rem" }}>New: up to 3 teams in one widget</div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0, lineHeight: 1.5 }}>
                Pick how many teams to show (1-3) when you set it up — each one gets its own record, points bar,
                and QB/RB/WR/TE, stacked in the same widget. 1 team fits a Medium widget; 2 or 3 need Large.
              </p>
            </div>

            <ol style={{ paddingLeft: "1.1rem", margin: "1rem 0" }}>
              {STEPS.map((step, i) => (
                <li key={i} style={{ marginBottom: "0.75rem" }}>
                  <strong style={{ fontSize: "0.9rem" }}>{step.title}</strong>
                  <div style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "0.15rem" }}>{step.body}</div>
                </li>
              ))}
            </ol>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "0.9rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Multi-league Sleeper</div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: "0.2rem 0 0.75rem" }}>
                  Up to 3 Sleeper teams, same username.
                </p>
                <button
                  onClick={() => handleCopy("sleeper", SLEEPER_SCRIPT_URL)}
                  disabled={loadingKey === "sleeper"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    width: "100%",
                    padding: "0.7rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--accent)",
                    color: "var(--accent-contrast)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.88rem",
                  }}
                >
                  {copiedKey === "sleeper" ? <Check size={17} /> : <Copy size={17} />}
                  {loadingKey === "sleeper" ? "Copying..." : copiedKey === "sleeper" ? "Copied!" : "Copy Sleeper code"}
                </button>
              </div>

              <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "0.9rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Multi-league Sleeper / ESPN</div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: "0.2rem 0 0.75rem" }}>
                  Mix Sleeper and ESPN teams (ESPN: public leagues only, no login needed).
                </p>
                <button
                  onClick={() => handleCopy("espn", SLEEPER_ESPN_SCRIPT_URL)}
                  disabled={loadingKey === "espn"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    width: "100%",
                    padding: "0.7rem",
                    borderRadius: "8px",
                    border: "1px solid var(--accent)",
                    background: "transparent",
                    color: "var(--accent)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.88rem",
                  }}
                >
                  {copiedKey === "espn" ? <Check size={17} /> : <Copy size={17} />}
                  {loadingKey === "espn" ? "Copying..." : copiedKey === "espn" ? "Copied!" : "Copy Sleeper/ESPN code"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
