"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Service workers break Next.js dev HMR (stale /_next/ chunks → 404).
    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
