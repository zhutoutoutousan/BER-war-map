"use client";

import { useEffect } from "react";

function isLocalHost() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".local");
}

/** Remove SW + caches (fixes stale bundles / offline.html on localhost). */
export async function clearBerHubServiceWorker() {
  if (typeof window === "undefined") return;
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Never use SW on localhost — it caches offline.html and breaks dev / wrong-port reloads.
    const disableSw = process.env.NODE_ENV === "development" || isLocalHost();

    if (disableSw) {
      void clearBerHubServiceWorker();
      const onFocus = () => {
        void clearBerHubServiceWorker();
      };
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    }

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
