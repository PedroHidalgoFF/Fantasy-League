"use client";

import { useState } from "react";
import { Smartphone, X, Copy, Check } from "lucide-react";
import WidgetPreview from "./WidgetPreview";

const WIDGET_SCRIPT_URL = "/scriptable/sleeper-widget.js";

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
    body: 'Borra el contenido de ejemplo, y pega el código completo (usa el botón "Copiar código" de abajo).',
  },
  {
    title: "Ponle nombre y guarda",
    body: 'Nómbralo algo como "Fantasy Widget" y ciérralo — Scriptable lo guarda solo.',
  },
  {
    title: "Agrega el widget a tu pantalla de inicio",
    body: 'Mantén presionada tu pantalla de inicio → toca el "+" arriba → busca "Scriptable" → elige el tamaño → agrégalo.',
  },
  {
    title: "Selecciona tu script",
    body: 'Mantén presionado el widget recién agregado → "Editar Widget" → en "Script" elige el que acabas de crear.',
  },
];

export default function WidgetBanner() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCopy() {
    setLoading(true);
    try {
      const res = await fetch(WIDGET_SCRIPT_URL);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently ignore if clipboard/fetch isn't available
    }
    setLoading(false);
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

            <ol style={{ paddingLeft: "1.1rem", margin: "1rem 0" }}>
              {STEPS.map((step, i) => (
                <li key={i} style={{ marginBottom: "0.75rem" }}>
                  <strong style={{ fontSize: "0.9rem" }}>{step.title}</strong>
                  <div style={{ color: "var(--text-soft)", fontSize: "0.85rem", marginTop: "0.15rem" }}>{step.body}</div>
                </li>
              ))}
            </ol>

            <button
              onClick={handleCopy}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--accent)",
                color: "var(--accent-contrast)",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {loading ? "Copying..." : copied ? "Copied!" : "Copy widget code"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
