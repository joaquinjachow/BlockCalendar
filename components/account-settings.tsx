"use client"
import { useEffect, useState } from "react"
import { CalendarDays, KeyRound, Save, UserRound } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function AccountSettings() {
  const { user, updatePassword, updateProfile, updateWeeklySummaryPreference } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [newPassword, setNewPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [profileMessage, setProfileMessage] = useState("")
  const [profileError, setProfileError] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(user?.weeklySummaryEnabled ?? true)
  const [weeklySummaryMessage, setWeeklySummaryMessage] = useState("")
  const [weeklySummaryError, setWeeklySummaryError] = useState("")
  const [isSavingWeeklySummary, setIsSavingWeeklySummary] = useState(false)

  useEffect(() => {
    setWeeklySummaryEnabled(user?.weeklySummaryEnabled ?? true)
  }, [user?.weeklySummaryEnabled])

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileMessage("")
    setProfileError("")
    if (!name.trim() || !email.trim()) {
      setProfileError("El nombre y el email son obligatorios")
      return
    }

    setIsSavingProfile(true)
    const result = await updateProfile(name.trim(), email.trim())
    setIsSavingProfile(false)
    if (!result.success) {
      setProfileError(result.error || "No se pudo actualizar la cuenta")
      return
    }
    setProfileMessage(
      result.requiresEmailConfirmation
        ? "Datos guardados. Revisá tu email para confirmar el nuevo correo."
        : "Datos guardados correctamente."
    )
  }

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordMessage("")
    setPasswordError("")
    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres")
      return
    }
    if (newPassword !== confirmation) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }

    setIsSavingPassword(true)
    const result = await updatePassword(newPassword)
    setIsSavingPassword(false)
    if (!result.success) {
      setPasswordError(result.error || "No se pudo actualizar la contraseña")
      return
    }
    setNewPassword("")
    setConfirmation("")
    setPasswordMessage("Contraseña actualizada correctamente.")
  }

  const changeWeeklySummaryPreference = async (enabled: boolean) => {
    const previousValue = weeklySummaryEnabled
    setWeeklySummaryEnabled(enabled)
    setWeeklySummaryMessage("")
    setWeeklySummaryError("")
    setIsSavingWeeklySummary(true)
    const result = await updateWeeklySummaryPreference(enabled)
    setIsSavingWeeklySummary(false)
    if (!result.success) {
      setWeeklySummaryEnabled(previousValue)
      setWeeklySummaryError(result.error || "No se pudo actualizar la preferencia")
      return
    }
    setWeeklySummaryMessage(enabled ? "Resumen semanal activado." : "Resumen semanal desactivado.")
  }

  return (
    <main className="container mx-auto w-full min-w-0 flex-1 px-4 py-6">
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card className="border-border/50 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <UserRound className="h-5 w-5 text-primary" />
              Datos de la cuenta
            </CardTitle>
            <CardDescription>Actualizá tu nombre y email de acceso.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="account-name" className="text-sm font-medium text-foreground">Nombre</label>
                <Input id="account-name" value={name} onChange={(event) => setName(event.target.value)} required className="bg-background" />
              </div>
              <div className="space-y-2">
                <label htmlFor="account-email" className="text-sm font-medium text-foreground">Email</label>
                <Input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="bg-background" />
              </div>
              {profileError && <p className="text-sm text-destructive">{profileError}</p>}
              {profileMessage && <p className="text-sm text-emerald-600 dark:text-emerald-400">{profileMessage}</p>}
              <Button type="submit" disabled={isSavingProfile}>
                <Save className="h-4 w-4" />
                {isSavingProfile ? "Guardando..." : "Guardar datos"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <KeyRound className="h-5 w-5 text-primary" />
              Cambiar contraseña
            </CardTitle>
            <CardDescription>Elegí una contraseña nueva para tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={savePassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="account-password" className="text-sm font-medium text-foreground">Nueva contraseña</label>
                <Input id="account-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={6} required className="bg-background" />
              </div>
              <div className="space-y-2">
                <label htmlFor="account-password-confirmation" className="text-sm font-medium text-foreground">Repetir contraseña</label>
                <Input id="account-password-confirmation" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={6} required className="bg-background" />
              </div>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              {passwordMessage && <p className="text-sm text-emerald-600 dark:text-emerald-400">{passwordMessage}</p>}
              <Button type="submit" disabled={isSavingPassword}>
                <KeyRound className="h-4 w-4" />
                {isSavingPassword ? "Guardando..." : "Cambiar contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CalendarDays className="h-5 w-5 text-primary" />
              Resumen semanal
            </CardTitle>
            <CardDescription>Mostrá un resumen de tareas al iniciar una nueva semana.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label htmlFor="weekly-summary-enabled" className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 p-3">
              <span>
                <span className="block text-sm font-medium text-foreground">Mostrar al abrir la app</span>
                <span className="mt-1 block text-xs text-muted-foreground">Incluye completadas, vencidas y próximas actividades.</span>
              </span>
              <input
                id="weekly-summary-enabled"
                type="checkbox"
                checked={weeklySummaryEnabled}
                onChange={(event) => changeWeeklySummaryPreference(event.target.checked)}
                disabled={isSavingWeeklySummary}
                className="peer sr-only"
              />
              <span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-muted transition-colors after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-background after:shadow-sm after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-5 peer-disabled:cursor-not-allowed peer-disabled:opacity-60" />
            </label>
            {weeklySummaryError && <p className="text-sm text-destructive">{weeklySummaryError}</p>}
            {weeklySummaryMessage && <p className="text-sm text-emerald-600 dark:text-emerald-400">{weeklySummaryMessage}</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}