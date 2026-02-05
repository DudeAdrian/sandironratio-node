/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * interface/pwa/sw.js
 * ═══════════════════════════════════════════════════════════════════════════════
 * SERVICE WORKER — Offline capability
 * 
 * Caches ephemeris chunks and core assets for offline operation
 * The 9 chambers work even without internet
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const CACHE_NAME = 'sandironratio-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/tailwind.css'
];

// Ephemeris chunks (lazy loaded by century)
const EPHEMERIS_CHUNKS = [
  // '/observatory/swisseph/sepl_18.se1', // 1600-2200
  // '/observatory/swisseph/semo_18.se1',
  // '/observatory/swisseph/seas_18.se1'
];

/**
 * Install event — cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event — clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch event — serve from cache or network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // API calls — network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Ephemeris files — cache first (large files)
  if (url.pathname.includes('/swisseph/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Static assets — cache first
  event.respondWith(cacheFirst(request));
});

/**
 * Cache-first strategy
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network-first strategy
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

/**
 * Sync pending messages when back online
 */
async function syncMessages() {
  // Placeholder: Sync pending chat messages
  console.log('[SW] Syncing messages...');
}

/**
 * Push notifications (future)
 */
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'SOFIE', {
      body: data.body || 'The Dude abides.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: data.data
    })
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[SW] Service Worker loaded');
