/**
 * Smart India Work App - Android APK & Chrome PWA Service Worker
 * Handles High-Priority Background Push, Chrome Offline Caching & Sync
 */

const CACHE_NAME = 'smart-india-work-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/assets/icon-192.svg',
  '/assets/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Cache failures on individual assets won't break installation
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network First with Fallback to Cache Fetch Handler for Chrome PWA Compliance
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip browser extensions / dev websockets
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.protocol === 'chrome-extension:' || url.pathname.includes('/@vite/') || url.pathname.includes('/@react-refresh')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache valid static responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML navigation, return offline cached root
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});

// High-Priority Push Notification Event (Handles Incoming Job Alert when App is in Background / Phone Locked)
self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 नया काम आया है! (New Job Alert)',
    body: 'तुरंत स्वीकार करें - ग्राहक आपकी सेवा का इंतजार कर रहा है',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'smart_india_emergency_job_alert',
    data: {
      url: '/',
      bookingId: 'BK_PUSH_' + Date.now(),
      sound: 'chime'
    }
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    tag: data.tag || 'job_alert',
    renotify: true,
    requireInteraction: true,
    vibrate: [500, 250, 500, 250, 500],
    data: data.data,
    actions: [
      { action: 'accept', title: '⚡ काम स्वीकारें (Accept)' },
      { action: 'view', title: 'विवरण देखें (View)' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Handler (Brings APK to foreground and navigates to the active job alert)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'PUSH_NOTIFICATION_CLICKED',
            action: event.action,
            data: event.notification.data
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Background Sync Event (Syncs IndexedDB offline queue when network reconnects)
self.addEventListener('sync', (event) => {
  if (event.tag === 'smart-india-offline-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_OFFLINE_SYNC' });
        });
      })
    );
  }
});
