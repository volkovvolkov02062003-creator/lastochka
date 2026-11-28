const CACHE_NAME = 'lastochka-offline-v2';
const CORE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './train.jpg',
  './app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(CORE_FILES.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Кэшируем только GET-запросы; живую синхронизацию Firebase не перехватываем
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com')
  ) {
    return;
  }

  // Ждём сеть не дольше 2.5 сек — если связи нет или она слабая, сразу открываем кэш
  event.respondWith(
    Promise.race([
      fetch(req).then((res) => {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        }
        return res;
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
    ]).catch(async () => {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (req.mode === 'navigate') {
        return caches.match('./index.html');
      }
      return new Response('', { status: 503, statusText: 'Offline' });
    })
  );
});
