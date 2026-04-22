const APP_SHELL_CACHE = "fuse-beads-assistant-shell-v3";
const RUNTIME_CACHE = "fuse-beads-assistant-runtime-v3";
const LOCALES = ["zh", "en", "ja", "ko"];
const APP_SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/apple-icon",
  "/pwa-192.png",
  "/pwa-512.png",
  "/browserconfig.xml",
  "/Mard221.csv",
  ...LOCALES.flatMap((locale) => [
    `/${locale}`,
    `/${locale}/pattern`,
    `/${locale}/pattern/export`,
    `/${locale}/offline`,
  ]),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      await Promise.allSettled(APP_SHELL_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
      notifyAllClients({type: "OFFLINE_READY"});
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
      notifyAllClients({type: "OFFLINE_READY"});
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (shouldUseCacheFirst(request, requestUrl)) {
    event.respondWith(handleCacheFirstRequest(request));
    return;
  }

  if (requestUrl.origin === self.location.origin) {
    event.respondWith(handleStaleWhileRevalidateRequest(request));
  }
});

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const runtimeCached = await caches.match(request);

    if (runtimeCached) {
      return runtimeCached;
    }

    const fallback = inferLocaleFallback(request.url);
    const cachedFallback = await caches.match(`${fallback}/offline`);

    if (cachedFallback) {
      return cachedFallback;
    }

    const cachedLocaleRoot = await caches.match(fallback);

    if (cachedLocaleRoot) {
      return cachedLocaleRoot;
    }

    return caches.match("/zh/offline");
  }
}

async function handleCacheFirstRequest(request) {
  const cached = await caches.match(request);

  if (cached) {
    void refreshRuntimeCache(request);
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    return (
      (await caches.match(request, { ignoreSearch: true })) ||
      (await caches.match("/icon.svg"))
    );
  }
}

async function handleStaleWhileRevalidateRequest(request) {
  const cached = await caches.match(request);
  const networkPromise = refreshRuntimeCache(request);

  if (cached) {
    return cached;
  }

  const networkResponse = await networkPromise;

  if (networkResponse) {
    return networkResponse;
  }

  return caches.match(request, { ignoreSearch: true });
}

async function refreshRuntimeCache(request) {
  try {
    const response = await fetch(request);

    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    return null;
  }
}

function shouldUseCacheFirst(request, requestUrl) {
  if (requestUrl.origin !== self.location.origin) {
    return false;
  }

  if (requestUrl.pathname === "/Mard221.csv") {
    return true;
  }

  if (requestUrl.pathname.startsWith("/_next/static/")) {
    return true;
  }

  return ["style", "script", "worker", "font", "image"].includes(request.destination);
}

function inferLocaleFallback(requestUrl) {
  const pathname = new URL(requestUrl).pathname;
  const locale = LOCALES.find((candidate) => pathname === `/${candidate}` || pathname.startsWith(`/${candidate}/`));

  return locale ? `/${locale}` : "/zh";
}

async function notifyAllClients(message) {
  const clients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window",
  });

  await Promise.all(clients.map((client) => client.postMessage(message)));
}
