const CACHE='beast-mode-v4';
const CORE=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.all(CORE.map(async url=>{try{await cache.add(url)}catch(err){console.warn('Could not cache',url,err)}}));await self.skipWaiting()})());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('beast-mode-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})());
});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);if(req.mode==='navigate'||CORE.some(x=>new URL(x,self.registration.scope).href===req.url)){
  try{const fresh=await fetch(req,{cache:'no-store'});if(fresh&&fresh.ok)cache.put(req,fresh.clone());return fresh}catch(err){return (await cache.match(req))||(await cache.match('./index.html'))||Response.error()}
 }
 const cached=await cache.match(req);if(cached)return cached;try{const response=await fetch(req);if(response&&response.ok)cache.put(req,response.clone());return response}catch(err){return Response.error()}
 })());
});
