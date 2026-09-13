// NEON PLAYER X V5.4 — install icon update only
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});