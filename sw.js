const CACHE_NAME = 'disaster-monitor-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// Install Service Worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Fetch Assets
self.addEventListener('fetch', (e) => {
  // PENTING: Jika request mengarah ke API GDACS, langsung ambil dari internet (jangan di-cache)
  if (e.request.url.includes('gdacs.org')) {
    return e.respondWith(fetch(e.request));
  }

  // Untuk aset statis (HTML, JS, Manifest), gunakan strategi cache dahulu
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
