const CACHE = 'arevys-v2-shell-69';
const SHELL = ['./','index.html','styles.css','arevys-app.css','arevys-core.js','app.js','manifest.webmanifest','assets/images/arevys_intro_logo.png','assets/images/avatars_arevys_v5.png','assets/images/arevys-anatomy-premium-front-v4.png','assets/images/arevys-anatomy-premium-back-v4.png'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))); });
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});
