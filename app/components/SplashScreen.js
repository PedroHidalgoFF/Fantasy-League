"use client";

import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "ff-splash-shown";

export default function SplashScreen() {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Solo la mostramos una vez por sesión de pestaña, no en cada
    // navegación interna entre páginas del sitio.
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible || !containerRef.current) return;

    let anim;
    let fallbackTimer;

    import("lottie-web").then(({ default: lottie }) => {
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: false,
        autoplay: true,
        path: "/lottie/splash.json",
      });

      anim.addEventListener("complete", () => {
        setFadingOut(true);
        setTimeout(() => setVisible(false), 300);
      });
    });

    // Respaldo: si algo falla al cargar la animación, no dejamos al
    // visitante viendo una pantalla negra para siempre.
    fallbackTimer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => setVisible(false), 300);
    }, 4000);

    return () => {
      clearTimeout(fallbackTimer);
      anim?.destroy();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadingOut ? 0 : 1,
        transition: "opacity 0.3s ease",
        pointerEvents: fadingOut ? "none" : "auto",
      }}
    >
      <div ref={containerRef} style={{ width: "60vw", maxWidth: 320 }} />
    </div>
  );
}
