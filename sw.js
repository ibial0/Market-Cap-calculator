const CACHE_NAME = 'crypto-mc-calc-v4';

// On install, skip waiting immediately to take control
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// On activate, delete ALL old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete every cache including old versions
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first for ALL requests
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Skip non-http(s) requests (chrome-extension etc.)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Only cache successful responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed — try cache as fallback (for offline use only)
        return caches.match(event.request);
      })
  );
});
