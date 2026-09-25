// Offline shell for the Spice Road Experience.
// The page and its assets are cached so the app opens with no signal; the
// page itself is network-first so a deploy is picked up as soon as there is
// signal. (The festival's over — the page no longer talks to a database.)
const CACHE = 'spice-road-v2';
const SHELL = ['./', './index.html', './map.jpg', './roster.enc', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname.endsWith('firebasedatabase.app') || url.hostname.endsWith('firebaseio.com')) return;
  const isPage = e.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/on-shift/');
  const isRoster = url.pathname.endsWith('roster.enc');
  if (isPage || isRoster) {
    // network first, cache fallback — fresh when there's signal, still opens when there isn't
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
    return;
  }
  // everything else: cache first, then network (and remember it)
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => { if (res.ok && (url.origin === location.origin || url.hostname === 'www.gstatic.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })));
});

// tapping a block-change notification brings the app back up
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const c = cs.find(x => x.url.includes('/on-shift')); return c ? c.focus() : self.clients.openWindow('./');
  }));
});
