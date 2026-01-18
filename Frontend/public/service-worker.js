const CACHE_NAME = "payorpray-cache-v1";
const PRECACHE_URLS = ["/", "/index.html", "/manifest.json"];

// Install - pre-cache some core assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // ignore failures (individual hosts may return 404)
      });
    })
  );
});

// Activate - clean up old caches
self.addEventListener("activate", (event) => {
  clients.claim();
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
    })
  );
});

// Network-first fetch strategy with cache fallback
self.addEventListener("fetch", (event) => {
  // only handle GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async function () {
      try {
        const networkResponse = await fetch(event.request);
        // if invalid response, throw to fallback
        if (!networkResponse || networkResponse.status >= 400) {
          throw new Error("Network response not ok");
        }
        // update cache asynchronously
        const cloned = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try {
            cache.put(event.request, cloned);
          } catch (e) {
            // ignore put errors for opaque responses
          }
        });
        return networkResponse;
      } catch (err) {
        // network failed, try cache
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // fallback to index.html for navigations (SPA)
        if (event.request.mode === "navigate" || (event.request.headers.get("accept") || "").includes("text/html")) {
          const indexResp = await caches.match("/index.html");
          if (indexResp) return indexResp;
        }
        // finally, just throw
        throw err;
      }
    })()
  );
});
