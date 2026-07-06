/* LifeOS service worker — offline app shell cache. Bump CACHE to release updates. */
const CACHE = 'lifeos-v2.0.3';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/tokens.css',
  'assets/styles.css',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/icon-180.png',
  'assets/icon-maskable.png',
  'src/utils.js',
  'src/store.js',
  'src/state.js',
  'src/engine.js',
  'src/data/meals.js',
  'src/nutrition.js',
  'src/supplements.js',
  'src/hydration.js',
  'src/training.js',
  'src/data/quotes.js',
  'src/scoring.js',
  'src/skincare.js',
  'src/log.js',
  'src/charts.js',
  'src/progress.js',
  'src/game.js',
  'src/ai-provider.js',
  'src/coach.js',
  'src/data/knowledge.js',
  'src/timeline.js',
  'src/schema.js',
  'src/components.js',
  'src/onboarding.js',
  'src/dashboard.js',
  'src/modules/registry.js',
  'src/modules/faith.js',
  'src/modules/finance.js',
  'src/modules/soon.js',
  'src/core.js',
  'src/app.js',
  'src/gestures.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
      return res;
    }).catch(() => e.request.mode === 'navigate' ? caches.match('index.html') : undefined))
  );
});
