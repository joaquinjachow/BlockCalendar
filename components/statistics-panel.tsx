"use client"
import { useMemo } from "react"
import { BarChart3, CheckCircle2, Clock3, Target } from "lucide-react"
import { getEventCategoryLabel, isEventCompleted, type EventCategory, useNotes } from "@/contexts/notes-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function getDateTime(date: string, time?: string) {
  const [year, month, day] = date.split("-").map(Number)
  if (!time) return new Date(year, month - 1, day, 23, 59)
  const [hours, minutes] = time.split(":").map(Number)
  return new Date(year, month - 1, day, hours, minutes)
}

function getWeekStart() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const mondayOffset = today.getDay() === 0 ? 6 : today.getDay() - 1
  today.setDate(today.getDate() - mondayOffset)
  return today
}

function getWeekDates() {
  const start = getWeekStart()
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return formatDate(date)
  })
}

export function StatisticsPanel() {
  const { notes, getEventsForDate } = useNotes()
  const statistics = useMemo(() => {
    const now = new Date()
    const today = formatDate(now)
    const completed = notes.reduce(
      (total, note) => total + Object.keys(note.completedOccurrences || {}).length,
      0
    )
    const categoryCounts = new Map<string, number>()
    notes.forEach((note) => {
      const category = note.category || "general"
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1)
    })
    const mostUsedCategory = [...categoryCounts.entries()].sort((first, second) => second[1] - first[1])[0]
    const mostUsedCategoryLabel = mostUsedCategory
      ? mostUsedCategory[0] === "general"
        ? "General"
        : getEventCategoryLabel(mostUsedCategory[0] as EventCategory)
      : "General"
    const weekOccurrences = getWeekDates().flatMap((date) =>
      getEventsForDate(date).map((note) => ({ date, note }))
    )
    const dueThisWeek = weekOccurrences.filter(({ date, note }) => getDateTime(date, note.time) <= now)
    const completedThisWeek = dueThisWeek.filter(({ date, note }) => isEventCompleted(note, date)).length
    const weeklyCompliance = dueThisWeek.length
      ? Math.round((completedThisWeek / dueThisWeek.length) * 100)
      : 0

    const overdueKeys = new Set<string>()
    for (let offset = 0; offset <= 90; offset += 1) {
      const date = new Date()
      date.setDate(date.getDate() - offset)
      const dateValue = formatDate(date)
      getEventsForDate(dateValue).forEach((note) => {
        const isDue = dateValue < today || (dateValue === today && Boolean(note.time) && getDateTime(dateValue, note.time) <= now)
        if (isDue && !isEventCompleted(note, dateValue)) overdueKeys.add(`${note.id}_${dateValue}`)
      })
    }

    return {
      completed,
      overdue: overdueKeys.size,
      weeklyCompliance,
      mostUsedCategory: mostUsedCategoryLabel,
    }
  }, [getEventsForDate, notes])

  const cards = [
    {
      label: "Actividades completadas",
      value: statistics.completed,
      description: "Total registrado en tu historial",
      icon: CheckCircle2,
    },
    {
      label: "Pendientes vencidas",
      value: statistics.overdue,
      description: "Actividades atrasadas sin completar",
      icon: Clock3,
    },
    {
      label: "Categoría más utilizada",
      value: statistics.mostUsedCategory,
      description: "Según tus actividades guardadas",
      icon: BarChart3,
    },
    {
      label: "Cumplimiento semanal",
      value: `${statistics.weeklyCompliance}%`,
      description: "Completadas sobre las actividades vencidas de esta semana",
      icon: Target,
    },
  ]

  return (
    <main className="container mx-auto flex-1 px-4 py-6">
      <Card className="mx-auto max-w-5xl border-border/50 shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BarChart3 className="h-5 w-5 text-primary" />
            Estadísticas
          </CardTitle>
          <CardDescription>Un resumen de cómo venís organizando tus actividades.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <Icon className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-1 truncate text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{card.description}</p>
                </div>
              )
            })}
          </div>
          {notes.length === 0 && (
            <p className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Cuando agregues actividades vas a empezar a ver tus estadísticas.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}