const CACHE_NAME = 'tecnimus-cache-beta-1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './mus.js',
  './manifest.json',
  './icono-192.png',
  './icono-512.png',
  './assets/oros.png',
  './assets/copas.png',
  './assets/espadas.png',
  './assets/bastos.png',
  './assets/sota.png',
  './assets/caballo.png',
  './assets/rey.jpg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
