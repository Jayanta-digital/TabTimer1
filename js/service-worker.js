// Service Worker for PWA
const CACHE_NAME = 'tabtimer-v1.0.0';
const ASSETS = [
  '/',
  '/index.html',
  '/auth-login.html',
  '/auth-signup.html',
  '/css/reset.css',
  '/css/variables.css',
  '/css/components.css',
  '/js/config.js',
  '/js/utils.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => 
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/assets/icons/icon-192x192.png'
    })
  );
});
