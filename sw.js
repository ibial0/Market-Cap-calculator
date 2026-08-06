const CACHE_NAME = 'crypto-mc-calc-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './styles/base.css',
  './styles/components.css',
  './styles/modals.css',
  './styles/cards.css',
  './styles/journal.css',
  './styles/index.css',
  './scripts/app.js',
  './scripts/journal.js',
  './ui/theme.js',
  './ui/modals.js',
  './ui/profile.js',
  './cards/engine.js',
  './cards/templates.js',
  './calculator/core.js',
  './utils/formatters.js',
  './utils/storage.js',
  './config/state.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Network-first for HTML pages
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Stale-While-Revalidate for everything else (JS, CSS, Images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback or just fail silently if offline and no cache
      });

      // Return cached immediately if available (Stale-While-Revalidate), else wait for network
      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
