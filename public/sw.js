const VERSION = "v5";
const SHELL_CACHE = `rhythm-shell-${VERSION}`;
const STATIC_CACHE = `rhythm-static-${VERSION}`;
const APP_SHELL = "/home";
const OFFLINE_FALLBACK = "/offline.html";
const APP_SHELLS = [APP_SHELL];
const PRECACHE = [
  ...APP_SHELLS,
  OFFLINE_FALLBACK,
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

async function precachePublicShell() {
  const shellCache = await caches.open(SHELL_CACHE);
  const staticCache = await caches.open(STATIC_CACHE);
  const assetUrls = new Set();

  await Promise.all(PRECACHE.map(async (path) => {
    const request = new Request(path, { cache: "reload", credentials: "omit" });
    const response = await fetch(request);
    if (!response.ok) throw new Error(`Unable to precache ${path}`);
    await shellCache.put(path, response.clone());
    if (response.headers.get("content-type")?.includes("text/html")) {
      const html = await response.text();
      for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) assetUrls.add(match[1]);
    }
  }));

  await Promise.all([...assetUrls].map(async (path) => {
    const request = new Request(path, { cache: "reload", credentials: "omit" });
    const response = await fetch(request);
    if (response.ok) await staticCache.put(path, response);
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil(precachePublicShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("rhythm-") && ![SHELL_CACHE, STATIC_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

function isSafeStaticRequest(request, url) {
  if (url.origin !== self.location.origin) return false;
  if (request.headers.has("authorization")) return false;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/__/")) return false;
  return url.pathname.startsWith("/_next/static/")
    || url.pathname.startsWith("/assets/")
    || url.pathname.startsWith("/icons/")
    || ["/favicon.svg", "/og.png"].includes(url.pathname);
}

async function cacheFirstStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic" && !response.headers.get("cache-control")?.includes("no-store")) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function navigationFallback(request) {
  try {
    return await fetch(request);
  } catch {
    const url = new URL(request.url);
    const routeShell = APP_SHELLS.includes(url.pathname) ? url.pathname : APP_SHELL;
    return (await caches.match(routeShell, { cacheName: SHELL_CACHE }))
      || (await caches.match(OFFLINE_FALLBACK, { cacheName: SHELL_CACHE }))
      || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (request.mode === "navigate") {
    event.respondWith(navigationFallback(request));
    return;
  }
  if (isSafeStaticRequest(request, url)) {
    event.respondWith(cacheFirstStatic(request));
  }
});
