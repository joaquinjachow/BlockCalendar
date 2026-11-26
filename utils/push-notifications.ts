import { createClient } from "@/utils/supabase/client"

const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY

export function isInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
}

export function canUsePush() {
  return Boolean(publicKey && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window)
}

function decodePublicKey(value: string) {
  const padded = (value + "=".repeat((4 - value.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/")
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
}

function matchesPublicKey(subscription: PushSubscription) {
  if (!publicKey || !subscription.options.applicationServerKey) return false
  const actual = new Uint8Array(subscription.options.applicationServerKey)
  const expected = decodePublicKey(publicKey)
  return actual.length === expected.length && actual.every((byte, index) => byte === expected[index])
}

async function getPushSubscription() {
  const registration = await navigator.serviceWorker.getRegistration("/")
  return registration?.pushManager.getSubscription() || null
}

export async function isPushRegistered(userId: string) {
  const subscription = await getPushSubscription()
  if (!subscription || !matchesPublicKey(subscription)) return false
  const { data, error } = await createClient().from("push_subscriptions")
    .select("id, timezone").eq("user_id", userId).eq("endpoint", subscription.endpoint).maybeSingle()
  if (error) throw error
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (data && data.timezone !== timezone) {
    const { error: updateError } = await createClient().from("push_subscriptions").update({ timezone }).eq("id", data.id).eq("user_id", userId)
    if (updateError) throw updateError
  }
  return Boolean(data)
}

export async function activatePush(userId: string) {
  if (!publicKey || !isInstalledApp() || !canUsePush()) throw new Error("Las notificaciones no están disponibles en este dispositivo.")
  const permission = await Notification.requestPermission()
  if (permission !== "granted") return permission

  const registration = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (subscription && !matchesPublicKey(subscription)) {
    await removePushSubscription(userId)
    subscription = null
  }
  subscription ||= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodePublicKey(publicKey),
  })
  const keys = subscription.toJSON().keys
  if (!keys?.p256dh || !keys.auth) throw new Error("No se pudo registrar este dispositivo.")
  const { error } = await createClient().from("push_subscriptions").upsert({
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }, { onConflict: "endpoint" })
  if (error) throw error
  return "granted"
}

export async function removePushSubscription(userId: string) {
  if (!("serviceWorker" in navigator)) return
  const subscription = await getPushSubscription()
  if (!subscription) return
  const { error } = await createClient().from("push_subscriptions").delete()
    .eq("user_id", userId).eq("endpoint", subscription.endpoint)
  const unsubscribed = await subscription.unsubscribe()
  if (error && !unsubscribed) throw error
}