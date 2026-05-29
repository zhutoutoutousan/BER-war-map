/* PWA service worker — disabled on localhost. Do NOT cache /_next/. */
const CACHE_NAME = "ber-hub-v4";

function isLocalDev() {
  const h = self.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

self.addEventListener("install", (event) => {
  if (isLocalDev()) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(["/offline.html", "/manifest.webmanifest", "/icon.svg"]);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (isLocalDev()) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) client.navigate(client.url);
        return;
      }
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (isLocalDev()) return;

  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch {
          if (self.navigator && !self.navigator.onLine) {
            const cache = await caches.open(CACHE_NAME);
            const offline = await cache.match("/offline.html");
            if (offline) return offline;
          }
          return new Response(
            `<!doctype html><html><body style="font-family:system-ui;background:#06080c;color:#fff;padding:2rem"><h1>Server unreachable</h1><p><a href="/">Retry</a></p></body></html>`,
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        }
      })()
    );
    return;
  }

  const core = ["/offline.html", "/manifest.webmanifest", "/icon.svg"];
  if (req.method === "GET" && core.some((p) => url.pathname === p)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      })()
    );
  }
});
