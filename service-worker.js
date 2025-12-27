const CACHE_NAME = 'noms-v3';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// INSTALL
self.addEventListener('install', event => {
event.waitUntil(
  caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
);
self.skipWaiting(); // optional but recommended
});

// ACTIVATE
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    )
  );
});

// FETCH
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});

// // development mode
// self.addEventListener('fetch', event => {
//   event.respondWith(fetch(event.request));
// });
