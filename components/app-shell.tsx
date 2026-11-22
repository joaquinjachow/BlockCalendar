"use client"
import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"

const pagesWithHeader = new Set(["/", "/hoy", "/estadisticas", "/configuracion"])

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {user && !isLoading && pagesWithHeader.has(pathname) && <Header />}
      {children}
    </div>
  )
}