"use client"
import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        await Promise.all(registrations.map((registration) => registration.unregister()))
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("notacal-"))
            .map((cacheName) => caches.delete(cacheName))
        )
      }).catch(() => undefined)
      return
    }
    navigator.serviceWorker.register("/sw.js").catch(() => undefined)
  }, [])
  return null
}