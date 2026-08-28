"use client";

import { useEffect } from "react";

export default function SplashScreen() {
  useEffect(() => {
    // Si el script del <head> ya lo escondió (misma sesión), no hacemos nada.
    if (document.documentElement.classList.contains("ff-no-splash")) return;

    const splash = document.getElementById("ff-splash");
    const animContainer = document.getElementById("ff-splash-anim");
    if (!splash || !animContainer) return;

    let anim;
    const fallbackTimer = setTimeout(hideSplash, 4000);

    function hideSplash() {
      clearTimeout(fallbackTimer);
      splash.style.transition = "opacity 0.3s ease";
      splash.style.opacity = "0";
      splash.style.pointerEvents = "none";
      setTimeout(() => {
        splash.style.display = "none";
      }, 300);
    }

    import("lottie-web").then(({ default: lottie }) => {
      anim = lottie.loadAnimation({
        container: animContainer,
        renderer: "svg",
        loop: false,
        autoplay: true,
        path: "/lottie/splash.json",
      });
      anim.addEventListener("complete", hideSplash);
    });

    return () => {
      clearTimeout(fallbackTimer);
      anim?.destroy();
    };
  }, []);

  return null;
}
