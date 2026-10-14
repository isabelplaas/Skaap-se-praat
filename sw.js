/* Skaap se Praat – hou die app beskikbaar sonder sein */
const WEERGAWE = 'ssp-v8';
const LEER = ['./', 'index.html', 'app.css', 'data.js', 'demo.js', 'app.js', 'vorms.js', 'manifest.webmanifest',
  'ikoon.svg', 'ikoon-192.png', 'ikoon-512.png', 'ikone.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(WEERGAWE).then(function (c) { return c.addAll(LEER); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (n) { return n !== WEERGAWE; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const url = new URL(e.request.url);
  // Data van die sheet gaan altyd direk na die bediener (die app hou self 'n kopie).
  if (url.hostname.indexOf('script.google') >= 0 || url.hostname.indexOf('googleusercontent') >= 0 || e.request.method !== 'GET') return;
  // Eers die netwerk vir die app self (sodat opdaterings deurkom), anders die gestoorde kopie.
  e.respondWith(
    fetch(e.request).then(function (r) {
      if (r && (r.ok || r.type === 'opaque')) {
        const kopie = r.clone();
        caches.open(WEERGAWE).then(function (c) { c.put(e.request, kopie); });
      }
      return r;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); });
    })
  );
});
