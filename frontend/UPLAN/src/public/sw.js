// Service Worker for U PLAN PWA
const CACHE_NAME = 'u-plan-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/globals.css',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never intercept API, websocket, browser extension, or non-GET requests.
  // This prevents stale/corrupt cached responses from surfacing as
  // ERR_CONTENT_DECODING_FAILED / "Failed to fetch" in chat and other SaaS APIs.
  const apiPrefixes = [
    '/auth',
    '/bff',
    '/chat',
    '/workspaces',
    '/sessions',
    '/assessments',
    '/goals',
    '/notifications',
    '/calendar',
    '/timetable',
    '/auto-generate',
    '/user',
    '/admin',
  ];

  if (
    request.method !== 'GET' ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:' ||
    url.origin !== self.location.origin ||
    apiPrefixes.some((prefix) => url.pathname.startsWith(prefix))
  ) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Background sync for offline task creation
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  // Implement task syncing logic here
  console.log('Syncing tasks...');
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Time to focus!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'start',
        title: 'Start Timer'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('U PLAN Pomodoro', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'start') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
