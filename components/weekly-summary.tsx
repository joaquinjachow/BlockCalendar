"use client"
import { useEffect, useMemo, useState } from "react"
import { CalendarDays, CheckCircle2, Clock3, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { isEventCompleted, useNotes } from "@/contexts/notes-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function getWeekStart(date = new Date()) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const mondayOffset = start.getDay() === 0 ? 6 : start.getDay() - 1
  start.setDate(start.getDate() - mondayOffset)
  return start
}

function getDateTime(date: string, time?: string) {
  const [year, month, day] = date.split("-").map(Number)
  if (!time) return new Date(year, month - 1, day, 23, 59)
  const [hours, minutes] = time.split(":").map(Number)
  return new Date(year, month - 1, day, hours, minutes)
}

export function WeeklySummary() {
  const { user } = useAuth()
  const { notes, getEventsForDate } = useNotes()
  const [isVisible, setIsVisible] = useState(false)
  const weekKey = useMemo(() => formatDate(getWeekStart()), [])
  const storageKey = user ? `notacal:weekly-summary:${user.id}:${weekKey}` : null

  useEffect(() => {
    if (!user?.weeklySummaryEnabled || !storageKey) {
      setIsVisible(false)
      return
    }
    setIsVisible(window.localStorage.getItem(storageKey) !== "dismissed")
  }, [storageKey, user?.weeklySummaryEnabled])

  const summary = useMemo(() => {
    const now = new Date()
    const today = formatDate(now)
    const weekStart = getWeekStart(now)
    const completed = notes.reduce((total, note) => (
      total + Object.values(note.completedOccurrences || {}).filter((completedAt) => {
        const completedDate = new Date(completedAt)
        return completedDate >= weekStart && completedDate <= now
      }).length
    ), 0)

    const overdueKeys = new Set<string>()
    for (let offset = 1; offset <= 90; offset += 1) {
      const date = new Date(now)
      date.setDate(now.getDate() - offset)
      const occurrenceDate = formatDate(date)
      getEventsForDate(occurrenceDate).forEach((note) => {
        if (!isEventCompleted(note, occurrenceDate)) overdueKeys.add(`${note.id}_${occurrenceDate}`)
      })
    }
    getEventsForDate(today).forEach((note) => {
      if (note.time && getDateTime(today, note.time) <= now && !isEventCompleted(note, today)) {
        overdueKeys.add(`${note.id}_${today}`)
      }
    })

    const upcomingKeys = new Set<string>()
    for (let offset = 0; offset <= 7; offset += 1) {
      const date = new Date(now)
      date.setDate(now.getDate() + offset)
      const occurrenceDate = formatDate(date)
      getEventsForDate(occurrenceDate).forEach((note) => {
        const hasAlreadyPassed = occurrenceDate === today && Boolean(note.time) && getDateTime(occurrenceDate, note.time) <= now
        if (!hasAlreadyPassed && !isEventCompleted(note, occurrenceDate)) {
          upcomingKeys.add(`${note.id}_${occurrenceDate}`)
        }
      })
    }

    return {
      completed,
      overdue: overdueKeys.size,
      upcoming: upcomingKeys.size,
    }
  }, [getEventsForDate, notes])

  const dismiss = () => {
    if (storageKey) window.localStorage.setItem(storageKey, "dismissed")
    setIsVisible(false)
  }

  if (!isVisible) return null

  const items = [
    { label: "Completadas", value: summary.completed, description: "en esta semana", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Vencidas", value: summary.overdue, description: "pendientes", icon: Clock3, color: "text-destructive" },
    { label: "Próximas", value: summary.upcoming, description: "en 7 días", icon: CalendarDays, color: "text-primary" },
  ]

  return (
    <Card className="mb-6 border-primary/25 bg-primary/5 shadow-lg shadow-primary/5">
      <CardHeader className="relative block pb-3 text-center sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:grid-rows-[auto] sm:items-start sm:gap-4 sm:text-left">
        <div className="px-8 sm:px-0">
          <CardTitle className="flex items-center justify-center gap-2 text-foreground sm:justify-start">
            <CalendarDays className="h-5 w-5 text-primary" />
            Tu semana en NotaCal
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Un vistazo rápido para organizar lo que sigue.</p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={dismiss} title="Ocultar hasta la próxima semana" className="absolute right-6 top-0 sm:static sm:self-start">
          <X className="h-4 w-4" />
          <span className="sr-only">Ocultar resumen hasta la próxima semana</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-xl border border-border/60 bg-background/70 p-4 text-center sm:text-left">
                <Icon className={`mx-auto mb-2 h-5 w-5 sm:mx-0 ${item.color}`} />
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}