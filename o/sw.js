/* Cá Ngựa 3D — service worker cache */
var CACHE = "canguav3d-v4";
var ASSETS = [
  "./",
  "./index.html",
  "./board.html",
  "./manifest.webmanifest",
  "./three.min.js",
  "./OrbitControls.js",
  "./engine.js",
  "./rules.js",
  "./bot.js",
  "./actions.js",
  "./board-data.js",
  "./dice6d.js",
  "./gamelog.js",
  "./advanced-skills.js",
  "./advanced-rules.js",
  "./advanced-bot.js",
  "./advanced-fx.js",
  "./skill-events.js",
  "./Lac_hop.html",
  "./Mat_dice.html",
  "./a1.mp3","./a2.mp3","./a3a.mp3","./a3b.mp3","./a4a.mp3","./a4b.mp3","./a5.mp3",
  "./color.mp3","./cmd.mp3","./dice.mp3","./step.mp3",
  "./icon_red.png","./icon_blue.png","./icon_cyan.png","./icon_yellow.png"
];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(ASSETS.map(function(u){ return new Request(u, { cache: "reload" }); })).catch(function(){}); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  // Không cache stream nhạc ngoài (archive.org)
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then(function(hit) {
      if (hit) return hit;
      return fetch(req).then(function(res) {
        if (!res || res.status !== 200 || res.type === "opaque") return res;
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
        return res;
      }).catch(function(){ return hit || Response.error(); });
    })
  );
});
