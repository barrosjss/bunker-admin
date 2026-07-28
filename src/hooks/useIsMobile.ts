"use client";

import { useEffect, useState } from "react";

// Debajo del breakpoint "sm" de Tailwind (640px) — mismo corte mobile/desktop
// que usa el resto del layout mobile-first del proyecto.
const MOBILE_QUERY = "(max-width: 639px)";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
