"use client"
import { useMemo, useState } from "react"
import { EVENT_CATEGORIES, getEventCategoryLabel, getEventColor, isEventCompleted, type EventCategory, type EventRecurrence, type Note, useNotes } from "@/contexts/notes-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Check, Clock3, Pencil, RotateCcw, Save, Search, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Period = "today" | "week" | "month" | "history"
type CategoryFilter = "all" | "general" | EventCategory

interface ListedEvent {
  note: Note
  occurrenceDate: string
  completedAt?: string
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Próximos 7 días" },
  { value: "month", label: "Este mes" },
  { value: "history", label: "Historial" },
]

const selectClassName = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function formatShortDate(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 4)
  return numbers.length > 2 ? `${numbers.slice(0, 2)}/${numbers.slice(2)}` : numbers
}

function getCurrentYearDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})$/)
  if (!match) return null
  const year = new Date().getFullYear()
  const day = Number(match[1])
  const month = Number(match[2])
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? formatDateValue(date)
    : null
}

function getDatesForPeriod(period: Period) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (period === "today") return [formatDateValue(today)]
  if (period === "history") return []
  if (period === "week") {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() + index + 1)
      return formatDateValue(date)
    })
  }
  const numberOfDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1
  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    return formatDateValue(date)
  })
}

function formatOccurrenceDate(date: string) {
  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
}

function formatCompletionDate(completedAt: string) {
  return new Date(completedAt).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function UpcomingActivities() {
  const { notes, getEventsForDate, updateEvent, setEventCompletion, deleteNote, savingKeys } = useNotes()
  const [savingAction, setSavingAction] = useState("")
  const [period, setPeriod] = useState<Period>("week")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [dateFilter, setDateFilter] = useState("")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategory, setEditCategory] = useState<EventCategory | "">("")
  const [editRecurrence, setEditRecurrence] = useState<EventRecurrence | "">("")
  const [editReminderMinutes, setEditReminderMinutes] = useState("15")
  const isEditing = editingNoteId !== null && savingKeys.includes(`note-${editingNoteId}`)

  const startEditing = (note: Note, key: string) => {
    setEditingKey(key)
    setEditingNoteId(note.id)
    setEditDate(note.date || "")
    setEditTime(note.time || "")
    setEditDescription(note.eventText || note.content)
    setEditCategory(note.category || "")
    setEditRecurrence(note.recurrence || "")
    setEditReminderMinutes(String(note.reminderMinutes ?? 15))
  }

  const cancelEditing = () => {
    setEditingKey(null)
    setEditingNoteId(null)
    setEditDate("")
    setEditTime("")
    setEditDescription("")
    setEditCategory("")
    setEditRecurrence("")
    setEditReminderMinutes("15")
  }

  const saveEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingNoteId || !editDate || !editDescription.trim()) return
    const saved = await updateEvent(editingNoteId, {
      date: editDate,
      time: editTime || undefined,
      eventText: editDescription.trim(),
      category: editCategory || undefined,
      recurrence: editRecurrence || undefined,
      reminderMinutes: Number(editReminderMinutes),
    })
    if (saved) cancelEditing()
  }

  const activities = useMemo(() => {
    const selectedDate = getCurrentYearDate(dateFilter)
    const dates = selectedDate ? [selectedDate] : getDatesForPeriod(period)
    const normalizedSearch = search.trim().toLocaleLowerCase("es-AR")
    const upcomingActivities: ListedEvent[] = dates
      .flatMap((occurrenceDate) =>
        getEventsForDate(occurrenceDate).map((note) => ({ note, occurrenceDate }))
      )
    const completedActivities: ListedEvent[] = notes.flatMap((note) =>
      Object.entries(note.completedOccurrences || {}).map(([occurrenceDate, completedAt]) => ({
        note,
        occurrenceDate,
        completedAt,
      }))
    )
    const source = period === "history" ? completedActivities : upcomingActivities

    return source
      .filter(({ note, occurrenceDate }) => {
        const matchesText = !normalizedSearch || (note.eventText || note.content)
          .toLocaleLowerCase("es-AR")
          .includes(normalizedSearch)
        const matchesCategory = categoryFilter === "all" || (
          categoryFilter === "general" ? !note.category : note.category === categoryFilter
        )
        const matchesStatus = period === "history" || !isEventCompleted(note, occurrenceDate)
        const matchesDate = !selectedDate || occurrenceDate === selectedDate
        return matchesText && matchesCategory && matchesStatus && matchesDate
      })
      .sort((first, second) => {
        if (period === "history") {
          return (second.completedAt || "").localeCompare(first.completedAt || "")
        }
        const firstValue = `${first.occurrenceDate}T${first.note.time || "23:59"}`
        const secondValue = `${second.occurrenceDate}T${second.note.time || "23:59"}`
        return firstValue.localeCompare(secondValue)
      })
  }, [categoryFilter, dateFilter, getEventsForDate, notes, period, search])

  return (
    <Card className="border-border/50 shadow-lg shadow-primary/5">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center justify-center gap-2 text-foreground sm:justify-start">
            <CalendarDays className="h-5 w-5 text-primary" />
            Próximas actividades
          </CardTitle>
          <div className="grid grid-cols-2 rounded-lg border border-border/60 p-1 sm:grid-cols-4">
            {PERIODS.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPeriod(item.value)}
                className={cn(
                  "px-2 text-xs sm:px-3",
                  period === item.value && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                )}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="relative sm:col-span-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar actividad..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="bg-background pl-9"
            />
          </div>
          <select
            aria-label="Filtrar por categoría"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
            className={selectClassName}
          >
            <option value="all">Todas las categorías</option>
            <option value="general">General (violeta)</option>
            {EVENT_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            <Input
              aria-label="Filtrar por fecha"
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="dd/mm"
              value={dateFilter}
              onChange={(event) => setDateFilter(formatShortDate(event.target.value))}
              className="bg-background"
            />
            {dateFilter && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setDateFilter("")}
                title="Limpiar fecha"
                className="shrink-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Limpiar fecha</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No hay actividades que coincidan con los filtros.
          </div>
        ) : (
          <div className="relative max-h-[min(32rem,60vh)] space-y-2 overflow-y-auto pr-1">
            {activities.map(({ note, occurrenceDate, completedAt }) => {
              const key = `${note.id}_${occurrenceDate}`
              const isCompleted = isEventCompleted(note, occurrenceDate)
              return editingKey === key ? (
                <form
                  key={key}
                  onSubmit={saveEvent}
                  className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3"
                >
                  <fieldset disabled={isEditing} className="space-y-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      aria-label="Fecha del evento"
                      type="date"
                      value={editDate}
                      onChange={(event) => setEditDate(event.target.value)}
                      required
                    />
                    <Input
                      aria-label="Hora del evento"
                      type="time"
                      value={editTime}
                      onChange={(event) => setEditTime(event.target.value)}
                    />
                  </div>
                  <Input
                    aria-label="Descripción del evento"
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    placeholder="Descripción del evento"
                    required
                  />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select
                      aria-label="Categoría del evento"
                      value={editCategory}
                      onChange={(event) => setEditCategory(event.target.value as EventCategory | "")}
                      className={selectClassName}
                    >
                      <option value="">General (violeta)</option>
                      {EVENT_CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Repetición del evento"
                      value={editRecurrence}
                      onChange={(event) => setEditRecurrence(event.target.value as EventRecurrence | "")}
                      className={selectClassName}
                    >
                      <option value="">No repetir</option>
                      <option value="weekly">Todas las semanas</option>
                      <option value="monthly">Todos los meses</option>
                    </select>
                    <Input
                      aria-label="Minutos de anticipación para el recordatorio"
                      type="number"
                      min="0"
                      max="1440"
                      value={editReminderMinutes}
                      onChange={(event) => setEditReminderMinutes(event.target.value)}
                      placeholder="Minutos antes"
                    />
                  </div>
                  <div className="flex justify-end gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                      <X className="h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm" disabled={isEditing || !editDate || !editDescription.trim()}>
                      <Save className="h-3.5 w-3.5" />
                      {isEditing ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                  </fieldset>
                </form>
              ) : (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center",
                    isCompleted && "opacity-70"
                  )}
                  style={{
                    backgroundColor: `${getEventColor(note.category)}12`,
                    borderColor: `${getEventColor(note.category)}42`,
                  }}
                >
                  <div className="flex min-w-36 items-center gap-2 text-sm font-medium text-foreground">
                    <CalendarDays className="h-4 w-4" style={{ color: getEventColor(note.category) }} />
                    {formatOccurrenceDate(occurrenceDate)}
                  </div>
                  <div className="flex flex-1 items-center gap-2">
                    <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-12 text-sm font-semibold text-foreground">
                      {note.time || "Sin hora"}
                    </span>
                    <p className={cn("min-w-0 flex-1 text-sm text-foreground", isCompleted && "line-through")}>
                      {note.eventText || note.content}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: getEventColor(note.category) }}
                      />
                      {getEventCategoryLabel(note.category)}
                    </span>
                    {isCompleted && completedAt && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Completada: {formatCompletionDate(completedAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size={savingKeys.includes(`note-${note.id}`) && savingAction === `complete-${key}` ? "sm" : "icon-sm"}
                      disabled={savingKeys.includes(`note-${note.id}`)}
                      onClick={() => { setSavingAction(`complete-${key}`); void setEventCompletion(note.id, occurrenceDate, !isCompleted) }}
                      title={isCompleted ? "Reabrir actividad" : "Marcar como completada"}
                      className="text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      {isCompleted ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      {savingKeys.includes(`note-${note.id}`) && savingAction === `complete-${key}` && "Guardando..."}
                      <span className="sr-only">{isCompleted ? "Reabrir actividad" : "Marcar como completada"}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => startEditing(note, key)}
                      disabled={savingKeys.includes(`note-${note.id}`)}
                      title="Editar actividad"
                      className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Editar actividad</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size={savingKeys.includes(`note-${note.id}`) && savingAction === `delete-${key}` ? "sm" : "icon-sm"}
                      disabled={savingKeys.includes(`note-${note.id}`)}
                      onClick={() => { setSavingAction(`delete-${key}`); void deleteNote(note.id) }}
                      title="Eliminar actividad"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {savingKeys.includes(`note-${note.id}`) && savingAction === `delete-${key}` && "Guardando..."}
                      <span className="sr-only">Eliminar actividad</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}