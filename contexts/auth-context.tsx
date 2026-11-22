"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { removePushSubscription } from "@/utils/push-notifications"

interface User {
  id: string
  email: string
  name: string
  weeklySummaryEnabled: boolean
}

interface AuthResult {
  success: boolean
  error?: string
  requiresEmailConfirmation?: boolean
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<AuthResult>
  register: (email: string, password: string, name: string) => Promise<AuthResult>
  updateProfile: (name: string, email: string) => Promise<AuthResult>
  updatePassword: (password: string) => Promise<AuthResult>
  updateWeeklySummaryPreference: (enabled: boolean) => Promise<AuthResult>
  requestPasswordReset: (email: string) => Promise<AuthResult>
  logout: () => Promise<void>
  isLoading: boolean
}

const supabase = createClient()
const AuthContext = createContext<AuthContextType | undefined>(undefined)

function toAppUser(user: { id: string; email?: string; user_metadata: Record<string, unknown> }): User {
  const metadataName = user.user_metadata.name
  const name = typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim()
    : user.email?.split("@")[0] || "Usuario"

  return {
    id: user.id,
    email: user.email || "",
    name,
    weeklySummaryEnabled: user.user_metadata.show_weekly_summary !== false,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!isActive) return
      setUser(data.user ? toAppUser(data.user) : null)
      setIsLoading(false)
    }

    void loadUser()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return
      setUser(session?.user ? toAppUser(session.user) : null)
      setIsLoading(false)
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
      ? { success: false, error: "Email o contraseña incorrectos" }
      : { success: true }
  }

  const register = async (email: string, password: string, name: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) {
      return {
        success: false,
        error: error.message.includes("already") ? "Este email ya está registrado" : "No se pudo crear la cuenta",
      }
    }

    return {
      success: true,
      requiresEmailConfirmation: !data.session,
    }
  }

  const updateProfile = async (name: string, email: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.updateUser({
      email,
      data: { name },
    })
    if (error) {
      return {
        success: false,
        error: error.message.includes("already")
          ? "Ese email ya está registrado"
          : "No se pudo actualizar la cuenta",
      }
    }

    if (data.user) setUser(toAppUser(data.user))
    return {
      success: true,
      requiresEmailConfirmation: email !== user?.email,
    }
  }

  const updatePassword = async (password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.updateUser({ password })
    return error
      ? { success: false, error: "No se pudo actualizar la contraseña" }
      : { success: true }
  }

  const updateWeeklySummaryPreference = async (enabled: boolean): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.updateUser({
      data: { show_weekly_summary: enabled },
    })
    if (error) {
      return { success: false, error: "No se pudo actualizar la preferencia" }
    }

    if (data.user) setUser(toAppUser(data.user))
    return { success: true }
  }

  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar-contrasena`,
    })
    return error
      ? { success: false, error: "No se pudo enviar el email de recuperación" }
      : { success: true }
  }

  const logout = async () => {
    if (user) {
      try {
        await removePushSubscription(user.id)
      } catch {
        console.warn("No se pudo desactivar la suscripción de avisos de este dispositivo")
      }
    }
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, updateProfile, updatePassword, updateWeeklySummaryPreference, requestPasswordReset, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}