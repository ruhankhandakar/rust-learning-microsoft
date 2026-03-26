const CACHE_NAME = "rust-training-3.1.0";

const PRECACHE_URLS = ["/", "/~offline", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstThenCache(request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/icon.svg"
  ) {
    event.respondWith(cacheFirstThenNetwork(request));
    return;
  }

  event.respondWith(networkFirstThenCache(request));
});

async function networkFirstThenCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const offline = await caches.match("/~offline");
      if (offline) return offline;
    }
    return new Response("Offline", { status: 503 });
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_BOOK") {
    const urls = event.data.urls;
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        for (const url of urls) {
          const exists = await cache.match(url);
          if (!exists) {
            try {
              const res = await fetch(url);
              if (res.ok) await cache.put(url, res);
            } catch {}
          }
        }
      })
    );
  }
});

async function cacheFirstThenNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}
