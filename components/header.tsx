"use client"
import { useAuth } from "@/contexts/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { CalendarDays, LogOut, Notebook } from "lucide-react"

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Notebook className="h-5 w-5 text-primary" />
            </div>
            <div className="p-1.5 rounded-lg bg-accent/20">
              <CalendarDays className="h-5 w-5 text-accent" />
            </div>
          </div>
          <span className="text-xl font-bold text-foreground">NotaCal</span>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              Hola, <span className="font-medium text-foreground">{user.name}</span>
            </span>
          )}
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