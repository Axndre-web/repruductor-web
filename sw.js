const CACHE='neon-player-x-v8-8';
const APP=['./','./index.html','./style.css','./script.js','./manifest.webmanifest','./icon-48.png','./icon-96.png','./icon-180.png','./icon-192.png','./icon-512.png','./favicon-32.png','./app-icon.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{const copy=res.clone();if(new URL(e.request.url).origin===location.origin)caches.open(CACHE).then(c=>c.put(e.request,copy));return res}).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):undefined)))})
