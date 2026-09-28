const CACHE_NAME = 'tecnimus-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './mus.js',
  './manifest.json'
  // Si creaste las imágenes para los iconos, añádelas aquí también (ej: './icono-192.png')
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