// Cache-first so the app works offline. Bump CACHE whenever any file below changes, or phones keep the old copy.
const CACHE = 'predictionary-v19';
const FILES = ['./', 'index.html', 'engine.js', 'lang-fr.js', 'lang-es.js', 'words.txt', 'common.txt',
  'words-fr.txt', 'common-fr.txt', 'lemmas-fr.txt', 'words-es.txt', 'common-es.txt', 'lemmas-es.txt',
  'everyday-en.tsv', 'everyday-fr.tsv', 'everyday-es.tsv',
  'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache (GitHub Pages allows 10 min), so versions never mix.
  const fresh = FILES.map(f => new Request(f, { cache: 'reload' }));
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(fresh)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (new URL(e.request.url).origin !== self.location.origin) return; // Wiktionary checks go straight to the network
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
