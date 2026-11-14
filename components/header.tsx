"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { InstallAppButton } from "@/components/install-app-button"
import { PushNotificationButton } from "@/components/push-notification-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { BarChart3, CalendarDays, ListTodo, LogOut, Notebook, Settings } from "lucide-react"

export function Header() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex min-h-16 w-full flex-col items-center justify-center gap-2 px-3 py-2 lg:h-16 lg:flex-row lg:justify-between lg:px-4 lg:py-0">
        <Link href="/" aria-label="Ir al calendario" className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Notebook className="h-5 w-5 text-primary" />
            </div>
            <div className="p-1.5 rounded-lg bg-accent/20">
              <CalendarDays className="h-5 w-5 text-accent" />
            </div>
          </div>
          <span className="text-xl font-bold text-foreground">NotaCal</span>
        </Link>
        <div className="flex w-full flex-wrap items-center justify-center gap-1.5 lg:w-auto lg:justify-end lg:gap-3">
          {user && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              Hola, <span className="font-medium text-foreground">{user.name}</span>
            </span>
          )}
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(pathname === "/hoy" ? "/" : "/hoy")}
              className="h-9 px-2 sm:px-3 md:w-28"
            >
              {pathname === "/hoy" ? <CalendarDays className="h-4 w-4" /> : <ListTodo className="h-4 w-4" />}
              <span className="hidden md:inline">{pathname === "/hoy" ? "Calendario" : "Hoy"}</span>
              <span className="sr-only">{pathname === "/hoy" ? "Volver al calendario" : "Ver tareas de hoy"}</span>
            </Button>
          )}
          {user && (
            <Button
              variant={pathname === "/estadisticas" ? "default" : "outline"}
              size="sm"
              onClick={() => router.push("/estadisticas")}
              className={`h-9 px-2 sm:px-3 ${pathname === "/estadisticas" ? "border border-transparent" : ""}`}
              aria-current={pathname === "/estadisticas" ? "page" : undefined}
              title="Ver estadísticas"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden xl:inline">Estadísticas</span>
              <span className="sr-only">Ver estadísticas</span>
            </Button>
          )}
          {user && (
            <Button
              variant={pathname === "/configuracion" ? "default" : "outline"}
              size="sm"
              onClick={() => router.push("/configuracion")}
              className={`h-9 px-2 sm:px-3 ${pathname === "/configuracion" ? "border border-transparent" : ""}`}
              aria-current={pathname === "/configuracion" ? "page" : undefined}
              title="Configurar cuenta"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden xl:inline">Cuenta</span>
              <span className="sr-only">Configurar cuenta</span>
            </Button>
          )}
          {user && <PushNotificationButton userId={user.id} />}
          {user && <InstallAppButton />}
          <ThemeToggle />
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Cerrar sesión</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}