const CACHE_NAME = "neon-player-x-v10-core";
const CORE_ASSETS = [
  "./", "./index.html", "./style.css", "./script.js", "./manifest.webmanifest",
  "./icon-48.png", "./icon-96.png", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./favicon-32.png", "./app-icon.jpg"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    event.respondWith((async()=>{
      try { const fresh = await fetch(req); const copy=fresh.clone(); caches.open(CACHE_NAME).then(c=>c.put(req,copy)); return fresh; }
      catch(e){ return (await caches.match(req)) || (await caches.match("./index.html")); }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(req);
    if(cached){
      fetch(req).then(r=>{if(r.ok)caches.open(CACHE_NAME).then(c=>c.put(req,r.clone()))}).catch(()=>{});
      return cached;
    }
    try{const r=await fetch(req);if(r.ok)caches.open(CACHE_NAME).then(c=>c.put(req,r.clone()));return r;}catch(e){return Response.error();}
  })());
});
