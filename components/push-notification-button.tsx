"use client"
import { useEffect, useRef, useState } from "react"
import { Bell, BellOff, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import { activatePush, canUsePush, isInstalledApp, isPushRegistered } from "@/utils/push-notifications"

type Status = "checking" | "unavailable" | "inactive" | "blocked" | "active"

export function PushNotificationButton({ userId }: { userId: string }) {
  const [installed, setInstalled] = useState(false)
  const [status, setStatus] = useState<Status>("checking")
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const errorDialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!isInstalledApp()) return
    setInstalled(true)
    if (!canUsePush()) {
      setStatus("unavailable")
      return
    }
    if (Notification.permission === "denied") {
      setStatus("blocked")
      return
    }
    if (Notification.permission !== "granted") {
      setStatus("inactive")
      return
    }
    let active = true
    void isPushRegistered(userId).then((registered) => {
      if (active) setStatus(registered ? "active" : "inactive")
    }).catch(() => {
      if (active) setStatus("inactive")
    })
    return () => { active = false }
  }, [userId])

  useEffect(() => {
    if (errorMessage && !errorDialog.current?.open) errorDialog.current?.showModal()
  }, [errorMessage])
  const enable = async () => {
    setIsSaving(true)
    try {
      const permission = await activatePush(userId)
      setStatus(permission === "granted" ? "active" : permission === "denied" ? "blocked" : "inactive")
    } catch {
      setStatus("inactive")
      setErrorMessage("No se pudieron activar los avisos. Revisá la conexión e intentá nuevamente.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!installed) return null
  const label = isSaving ? "Activando..." : status === "active" ? "Avisos activos" : status === "blocked" ? "Avisos bloqueados" : status === "unavailable" ? "Avisos no disponibles" : status === "checking" ? "Revisando avisos..." : "Activar avisos"
  return (
    <>
      <Button variant="outline" size="sm" onClick={enable} disabled={isSaving || status !== "inactive"} title={label} className="h-9 px-2 sm:px-3">
        {status === "active" ? <BellRing className="h-4 w-4 text-primary" /> : status === "blocked" || status === "unavailable" ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        <span className="hidden sm:inline">{label}</span>
        <span className="sr-only">{label}</span>
      </Button>
      <dialog ref={errorDialog} onClose={() => setErrorMessage("")} aria-labelledby="push-error-title" className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg backdrop:bg-black/50">
        <h2 id="push-error-title" className="text-lg font-semibold">No se pudieron activar los avisos</h2>
        <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
        <div className="mt-5 flex justify-end"><Button type="button" onClick={() => errorDialog.current?.close()}>Cerrar</Button></div>
      </dialog>
    </>
  )
}