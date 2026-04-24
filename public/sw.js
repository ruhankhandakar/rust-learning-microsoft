const CACHE_NAME = "rust-training-4.3.13";
const CONTENT_HASH_URL = "/content-hash.json";

const PRECACHE_URLS = ["/", "/~offline", "/manifest.webmanifest", "/icon.svg"];

// Paths that must never be cached (heavy / high-churn / too many pages).
// The entire 100-rust-projects book has 100+ chapters; caching them bloats
// storage for little benefit (users rarely revisit the same chapter offline).
const NO_CACHE_PATH_PATTERNS = [/^\/books\/100-rust-projects(\/|$)/];

function shouldBypassCache(pathname) {
  return NO_CACHE_PATH_PATTERNS.some((re) => re.test(pathname));
}

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

  if (shouldBypassCache(url.pathname)) {
    event.respondWith(networkOnly(request));
    return;
  }

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

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    if (request.mode === "navigate") {
      const offline = await caches.match("/~offline");
      if (offline) return offline;
    }
    return new Response("Offline", { status: 503 });
  }
}

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
    const urls = (event.data.urls || []).filter((u) => {
      try {
        return !shouldBypassCache(new URL(u, self.location.origin).pathname);
      } catch {
        return false;
      }
    });
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        for (const url of urls) {
          const exists = await cache.match(url);
          if (!exists) {
            try {
              const res = await fetch(url);
              if (res.ok) await cache.put(url, res);
            } catch { }
          }
        }
      })
    );
  }

  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        const source = event.source;
        if (source && "postMessage" in source) {
          source.postMessage({ type: "CACHE_CLEARED" });
        }
      })()
    );
  }

  if (event.data?.type === "CHECK_CONTENT_UPDATE") {
    event.waitUntil(
      (async () => {
        try {
          const res = await fetch(CONTENT_HASH_URL, { cache: "no-store" });
          if (!res.ok) return;
          const remote = await res.json();
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(CONTENT_HASH_URL);
          const local = cached ? await cached.json() : null;
          if (local && local.version !== remote.version) {
            self.clients.matchAll().then((clients) => {
              clients.forEach((c) =>
                c.postMessage({ type: "CONTENT_UPDATED", version: remote.version })
              );
            });
          }
          await cache.put(CONTENT_HASH_URL, new Response(JSON.stringify(remote)));
        } catch { }
      })()
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
