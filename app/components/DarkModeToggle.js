"use client";

import { useEffect, useState } from "react";
import { Moon } from "lucide-react";

export default function DarkModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark-mode");
    setEnabled(isDark);
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    document.documentElement.classList.toggle("dark-mode", next);
    localStorage.setItem("ff-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="sidebar-link"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        justifyContent: "space-between",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
        <Moon size={20} />
        <span>Dark Mode</span>
      </span>
      <span
        style={{
          width: 34,
          height: 19,
          borderRadius: "999px",
          background: enabled ? "var(--accent)" : "rgba(255,255,255,0.15)",
          position: "relative",
          transition: "background 0.15s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: enabled ? 17 : 2,
            width: 15,
            height: 15,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.15s ease",
          }}
        />
      </span>
    </button>
  );
}
