// ═══════════════════════════════════════════════════════════
//  SERVICE WORKER — Optimized for fast loads & offline support
//
//  Strategy:
//    • Static assets (HTML, JS, CSS, fonts, images) → Cache-First
//      → Serve instantly from cache, update in background
//    • Firebase / API calls → Network-First with cache fallback
//    • Everything else → Network-First
//
//  This prevents the "2-3 minute load time" issue caused by
//  waiting for the network for every static file.
// ═══════════════════════════════════════════════════════════

const CACHE_VERSION = 'v6';
const STATIC_CACHE  = `mc-static-${CACHE_VERSION}`;
const API_CACHE     = `mc-api-${CACHE_VERSION}`;

// Static assets to pre-cache on install
const PRECACHE_URLS = [
    './',
    './index.html',
    './admin.html',
    './png-editor.html',
    './manifest.json',
    './favicon.svg',
];

// ── Install: pre-cache critical shell ──────────────────────
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache =>
            cache.addAll(PRECACHE_URLS).catch(() => {})
        )
    );
});

// ── Message: handle SKIP_WAITING from page ─────────────────
self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ── Activate: delete old caches ────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys
                .filter(k => k !== STATIC_CACHE && k !== API_CACHE)
                .map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

// ── Fetch: routing strategy ────────────────────────────────
self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = req.url;

    // Skip non-http requests (chrome-extension, etc.)
    if (!url.startsWith('http')) return;

    // ── Firebase / Firestore / Auth → Network-First ────────
    if (
        url.includes('firebaseio.com') ||
        url.includes('firestore.googleapis.com') ||
        url.includes('identitytoolkit.googleapis.com') ||
        url.includes('firebase') ||
        url.includes('googleapis.com/google.firestore')
    ) {
        event.respondWith(networkFirst(req, API_CACHE, 8000));
        return;
    }

    // ── Google Fonts → Cache-First (they rarely change) ───
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        event.respondWith(cacheFirst(req, STATIC_CACHE));
        return;
    }

    // ── html2canvas CDN → Cache-First ─────────────────────
    if (url.includes('html2canvas') || url.includes('cdn.jsdelivr.net') || url.includes('cdnjs.cloudflare.com')) {
        event.respondWith(cacheFirst(req, STATIC_CACHE));
        return;
    }

    // ── Same-origin JS/CSS/HTML/Images → Stale-While-Revalidate ──
    if (url.includes(self.location.origin) || url.startsWith('./')) {
        event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
        return;
    }

    // ── Everything else → Network-First with cache fallback ──
    event.respondWith(networkFirst(req, STATIC_CACHE, 10000));
});

// ── Strategy: Cache-First ──────────────────────────────────
// Serve from cache immediately. If not cached, fetch & cache.
async function cacheFirst(req, cacheName) {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
        const resp = await fetch(req);
        if (resp && resp.ok && resp.type !== 'opaque') {
            const cache = await caches.open(cacheName);
            cache.put(req, resp.clone());
        }
        return resp;
    } catch {
        return new Response('Offline', { status: 503 });
    }
}

// ── Strategy: Stale-While-Revalidate ──────────────────────
// Serve from cache immediately (fast), then update cache in background.
async function staleWhileRevalidate(req, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req);

    const fetchPromise = fetch(req).then(resp => {
        if (resp && resp.ok && resp.type !== 'opaque') {
            cache.put(req, resp.clone());
        }
        return resp;
    }).catch(() => null);

    return cached || fetchPromise;
}

// ── Strategy: Network-First with timeout ──────────────────
// Try network first. If slow/offline, fall back to cache.
async function networkFirst(req, cacheName, timeoutMs = 10000) {
    const cache = await caches.open(cacheName);

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const resp = await fetch(req, { signal: controller.signal });
        clearTimeout(timer);

        if (resp && resp.ok && resp.type !== 'opaque') {
            cache.put(req, resp.clone());
        }
        return resp;
    } catch {
        // Network failed or timed out — try cache
        const cached = await cache.match(req);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
