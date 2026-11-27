/* Service worker: network-first with a cache fallback.
   Bump CACHE_NAME (calvirtues-vN) every time the list of files below changes. */
'use strict';

var CACHE_NAME = 'calvirtues-v1';
var PREFIX = 'calvirtues-';

var FILES = [
  './',
  'index.html',
  'css/styles.css',
  'js/app.js',
  'js/calendar.js',
  'js/virtues.js',
  'js/monk.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (names) {
        return Promise.all(names.filter(function (name) {
          return name.indexOf(PREFIX) === 0 && name !== CACHE_NAME;
        }).map(function (name) { return caches.delete(name); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') { return; }
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) { return; }

  event.respondWith(
    fetch(request)
      .then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      })
      .catch(function () {
        return caches.match(request).then(function (cached) {
          if (cached) { return cached; }
          if (request.mode === 'navigate') { return caches.match('index.html'); }
          return Response.error();
        });
      })
  );
});
