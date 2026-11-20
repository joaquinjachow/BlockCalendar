"use client"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { CalendarDays, Notebook } from "lucide-react"

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [touched, setTouched] = useState({ name: false, email: false, password: false })
  const { login, register, requestPasswordReset } = useAuth()

  const fieldErrors = {
    name: !isLogin && !isForgotPassword && !name.trim() ? "El nombre es obligatorio" : "",
    email: !email.trim()
      ? "El email es obligatorio"
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Ingresá un email válido"
      : "",
    password: isForgotPassword
      ? ""
      : !password
      ? "La contraseña es obligatoria"
      : password.length < 6
      ? "La contraseña debe tener al menos 6 caracteres"
      : "",
  }

  const markFieldAsTouched = (field: "name" | "email" | "password") => {
    setTouched((current) => ({ ...current, [field]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: !isLogin && !isForgotPassword, email: true, password: !isForgotPassword })
    setError("")
    setSuccessMessage("")
    if (fieldErrors.name || fieldErrors.email || fieldErrors.password) return
    setIsLoading(true)
    try {
      if (isForgotPassword) {
        const result = await requestPasswordReset(email.trim())
        if (!result.success) setError(result.error || "No se pudo enviar el email de recuperación")
        else setSuccessMessage("Revisá tu email para recuperar la contraseña")
      } else if (isLogin) {
        const result = await login(email.trim(), password)
        if (!result.success) setError(result.error || "Email o contraseña incorrectos")
      } else {
        const result = await register(email.trim(), password, name.trim())
        if (!result.success) setError(result.error || "No se pudo crear la cuenta")
        if (result.requiresEmailConfirmation) {
          setSuccessMessage("Revisá tu email para confirmar la cuenta antes de iniciar sesión")
        }
      }
    } catch {
      setError("Ha ocurrido un error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-1.5">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Notebook className="h-7 w-7 text-primary" />
            </div>
            <div className="p-2.5 rounded-xl bg-accent/20">
              <CalendarDays className="h-7 w-7 text-accent" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">NotaCal</h1>
          <p className="text-muted-foreground">Tu bloc de notas y calendario en uno</p>
        </div>
        <Card className="gap-5 py-5 border-border/50 shadow-lg shadow-primary/5">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-foreground">
              {isForgotPassword ? "Recuperar contraseña" : isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </CardTitle>
            <CardDescription className="text-center">
              {isForgotPassword
                ? "Ingresá tu email y te enviaremos un enlace"
                : isLogin
                ? "Ingresa tus datos para acceder"
                : "Regístrate para comenzar a organizar tu vida"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup className="gap-4">
                {!isLogin && !isForgotPassword && (
                  <Field>
                    <FieldLabel htmlFor="name">Nombre</FieldLabel>
                    <div>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => markFieldAsTouched("name")}
                        aria-invalid={touched.name && Boolean(fieldErrors.name)}
                        aria-describedby={touched.name && fieldErrors.name ? "name-error" : undefined}
                        className="bg-background"
                      />
                      {touched.name && fieldErrors.name && (
                        <p id="name-error" className="mt-1 text-xs leading-tight text-destructive">{fieldErrors.name}</p>
                      )}
                    </div>
                  </Field>
                )}
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <div>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => markFieldAsTouched("email")}
                      required
                      aria-invalid={touched.email && Boolean(fieldErrors.email)}
                      aria-describedby={touched.email && fieldErrors.email ? "email-error" : undefined}
                      className="bg-background"
                    />
                    {touched.email && fieldErrors.email && (
                      <p id="email-error" className="mt-1 text-xs leading-tight text-destructive">{fieldErrors.email}</p>
                    )}
                  </div>
                </Field>
                {!isForgotPassword && (
                  <Field>
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => markFieldAsTouched("password")}
                      required
                      minLength={6}
                      aria-invalid={touched.password && Boolean(fieldErrors.password)}
                      aria-describedby={touched.password && fieldErrors.password ? "password-error" : undefined}
                      className="bg-background"
                    />
                    {touched.password && fieldErrors.password && (
                      <p id="password-error" className="mt-1 text-xs leading-tight text-destructive">{fieldErrors.password}</p>
                    )}
                  </div>
                  </Field>
                )}
              </FieldGroup>
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              {successMessage && (
                <p className="text-sm text-emerald-600 text-center dark:text-emerald-400">{successMessage}</p>
              )}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading
                  ? "Cargando..."
                  : isForgotPassword
                  ? "Enviar enlace"
                  : isLogin
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
              </Button>
            </form>
            {isLogin && !isForgotPassword && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true)
                    setError("")
                    setSuccessMessage("")
                    setTouched({ name: false, email: false, password: false })
                  }}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false)
                  setIsLogin(isForgotPassword ? true : !isLogin)
                  setError("")
                  setSuccessMessage("")
                  setTouched({ name: false, email: false, password: false })
                }}
                className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                {isForgotPassword
                  ? "Volver a iniciar sesión"
                  : isLogin
                  ? "¿No tienes cuenta? Regístrate"
                  : "¿Ya tienes cuenta? Inicia sesión"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}