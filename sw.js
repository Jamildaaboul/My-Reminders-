// RemindMe service worker
// Bump CACHE_NAME any time you want to force all clients to drop old cached files.
const CACHE_NAME = 'remindme-cache-v5';
const PRECACHE_URLS = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const isPageRequest = event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isPageRequest) {
    // Network-first for the app shell itself: always try to get the latest
    // version; only fall back to the cached copy if you're offline.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for everything else (fonts, icons, etc.) since those rarely change.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
