const CACHE_NAME = "notacal-v3"
const APP_SHELL = ["/", "/favicon.svg", "/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName))
    )).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseCopy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put("/", responseCopy))
          return response
        })
        .catch(() => caches.match("/"))
    )
    return
  }

  if (new URL(request.url).pathname.startsWith("/_next/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseCopy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy))
          }
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse
      return fetch(request).then((response) => {
        if (response.ok) {
          const responseCopy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy))
        }
        return response
      })
    })
  )
})

self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data?.json() || {}
  } catch {
    payload = {}
  }
  event.waitUntil(self.registration.showNotification(payload.title || "Recordatorio de NotaCal", {
    body: payload.body || "Tenés una actividad pendiente.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag,
  }))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
    const existingWindow = windows.find((client) => new URL(client.url).origin === self.location.origin)
    if (existingWindow) return existingWindow.focus()
    return self.clients.openWindow("/")
  })())
})