// Basic service worker
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
});

self.addEventListener('fetch', (event) => {
  // We are not caching anything in this basic service worker
  // This just prevents the "service worker not found" error
  event.respondWith(fetch(event.request));
});
