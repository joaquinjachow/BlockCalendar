"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export function PasswordRecoveryForm() {
  const router = useRouter()
  const { user, isLoading, updatePassword } = useAuth()
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Enlace no disponible</CardTitle>
            <CardDescription className="text-center">
              El enlace de recuperación venció o ya fue utilizado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" className="w-full" onClick={() => router.replace("/")}>
              Volver al login
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsSaving(true)
    const result = await updatePassword(password)
    setIsSaving(false)
    if (!result.success) {
      setError(result.error || "No se pudo actualizar la contraseña")
      return
    }
    setSuccess(true)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg shadow-primary/5">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-foreground">Nueva contraseña</CardTitle>
          <CardDescription className="text-center">
            Elegí una nueva contraseña para tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Tu contraseña se actualizó correctamente.
              </p>
              <Button type="button" className="w-full" onClick={() => router.replace("/")}>
                Ir al inicio
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="recovery-password" className="text-sm font-medium text-foreground">
                  Nueva contraseña
                </label>
                <Input
                  id="recovery-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="recovery-confirmation" className="text-sm font-medium text-foreground">
                  Repetir contraseña
                </label>
                <Input
                  id="recovery-confirmation"
                  type="password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  minLength={6}
                  required
                  className="bg-background"
                />
              </div>
              {error && <p className="text-sm text-center text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Actualizar contraseña"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}