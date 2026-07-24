const CACHE_NAME = 'agency365-v3';
const ASSETS = [
  '/',
  '/dashboard.html',
  '/clients.html',
  '/finance.html',
  '/calendar.html',
  '/crm.html',
  '/proposals.html',
  '/account.html',
  '/styles.css',
  '/mobile-overrides.css',
  '/app.js',
  '/supabaseClient.js',
  '/clients.js',
  '/finance.js',
  '/dashboard.js',
  '/crm.js',
  '/calendar.js',
  '/proposals.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // Cache the newest version for offline use
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // If offline, fallback to cache
        return caches.match(e.request);
      })
  );
});
