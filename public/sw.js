/// <reference lib="webworker" />

const CACHE_NAME = "neo-edu-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/study",
  "/exam",
  "/flashcards",
  "/achievements",
  "/offline",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests - network only with timeout
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful GET requests
          if (request.method === "GET" && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Return cached and update in background
          fetch(request).then((response) => {
            if (response.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response);
              });
            }
          });
          return cached;
        }
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages - network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match("/offline");
        });
      })
  );
});

// Push notification
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  
  const options = {
    body: data.body || "Bạn có thông báo mới",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/dashboard",
    },
    actions: [
      {
        action: "open",
        title: "Xem ngay",
      },
      {
        action: "close",
        title: "Đóng",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "NEO-EDU", options)
  );
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-progress") {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  // Sync offline progress when back online
  const cache = await caches.open(CACHE_NAME);
  const pendingRequests = await cache.match("/pending-sync");
  
  if (pendingRequests) {
    const data = await pendingRequests.json();
    
    for (const request of data) {
      try {
        await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
      } catch (e) {
        console.error("Sync failed:", e);
      }
    }
    
    await cache.delete("/pending-sync");
  }
}
