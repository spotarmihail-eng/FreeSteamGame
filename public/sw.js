const CACHE_NAME = "free-steam-game-static-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("free-steam-game-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") return;
  if (url.pathname.includes("/api/") || url.pathname.includes("/admin/") || url.pathname.includes("/invite/")) return;

  const isStaticAsset =
    url.pathname.includes("/_next/static/") ||
    ["style", "script", "image", "font"].includes(request.destination) ||
    url.pathname.endsWith("/manifest.webmanifest") ||
    url.pathname.endsWith("/icons/icon.svg");

  if (!isStaticAsset) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        await cache.put(request, response.clone());
      }
      return response;
    })
  );
});
