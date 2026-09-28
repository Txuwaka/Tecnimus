const CACHE_NAME = 'tecnimus-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './mus.js',
  './manifest.json',
  './icono-192.png',
  './icono-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
