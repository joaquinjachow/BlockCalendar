"use client"
import { useState } from "react"
import { EVENT_CATEGORIES, getEventCategoryLabel, getEventColor, type EventCategory, type EventRecurrence, useNotes, type Note } from "@/contexts/notes-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, CalendarDays, Pencil, Save, X } from "lucide-react"
import { cn } from "@/lib/utils"

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]
const selectClassName = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

interface CalendarViewProps {
  selectedDate: string | null
  onSelectedDateChange: (date: string) => void
}

export function CalendarView({ selectedDate, onSelectedDateChange }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategory, setEditCategory] = useState<EventCategory | "">("")
  const [editRecurrence, setEditRecurrence] = useState<EventRecurrence | "">("")
  const [editReminderMinutes, setEditReminderMinutes] = useState("15")
  const { getEventsForDate, updateEvent, savingKeys } = useNotes()
  const isEditing = editingEventId !== null && savingKeys.includes(`note-${editingEventId}`)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    onSelectedDateChange(dateStr)
  }

  const formatDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    )
  }

  const startEditing = (event: Note) => {
    setEditingEventId(event.id)
    setEditDate(event.date || "")
    setEditTime(event.time || "")
    setEditDescription(event.eventText || event.content)
    setEditCategory(event.category || "")
    setEditRecurrence(event.recurrence || "")
    setEditReminderMinutes(String(event.reminderMinutes ?? 15))
  }

  const cancelEditing = () => {
    setEditingEventId(null)
    setEditDate("")
    setEditTime("")
    setEditDescription("")
    setEditCategory("")
    setEditRecurrence("")
    setEditReminderMinutes("15")
  }

  const saveEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingEventId || !editDate || !editDescription.trim()) return
    const saved = await updateEvent(editingEventId, {
      date: editDate,
      time: editTime || undefined,
      eventText: editDescription.trim(),
      category: editCategory || undefined,
      recurrence: editRecurrence || undefined,
      reminderMinutes: Number(editReminderMinutes),
    })
    if (saved) cancelEditing()
  }

  const selectedEvents: Note[] = selectedDate
    ? getEventsForDate(selectedDate)
    : []

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <Card className="flex flex-col border-border/50 shadow-lg shadow-primary/5 lg:h-full lg:min-h-0 lg:overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CalendarDays className="h-5 w-5 text-primary" />
            Calendario
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs"
          >
            Hoy
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Mes anterior</span>
          </Button>
          <h3 className="text-lg font-semibold text-foreground">
            {MONTHS[month]} {year}
          </h3>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Mes siguiente</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 flex-1 lg:min-h-0 lg:auto-rows-fr">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square lg:aspect-auto lg:min-h-0" />
            }
            const dateStr = formatDateStr(day)
            const events = getEventsForDate(dateStr)
            const hasEvents = events.length > 0
            const isSelected = selectedDate === dateStr
            const eventColors = Array.from(new Set(events.map((event) => getEventColor(event.category)))).slice(0, 4)
            const primaryEventColor = eventColors[0]
            return (
              <button
                key={day}
                onClick={() => onSelectedDateChange(dateStr)}
                aria-label={hasEvents ? `${day}: ${events.length} actividad${events.length > 1 ? "es" : ""}` : String(day)}
                style={
                  hasEvents && !isSelected
                    ? {
                        backgroundColor: `${primaryEventColor}1A`,
                        color: primaryEventColor,
                        boxShadow: `inset 0 0 0 1px ${primaryEventColor}4D`,
                      }
                    : undefined
                }
                className={cn(
                  "aspect-square rounded-lg text-sm font-medium transition-all relative flex flex-col items-center justify-center lg:aspect-auto lg:min-h-0",
                  "hover:bg-muted",
                  isToday(day) && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                  hasEvents && !isSelected && "font-bold shadow-sm",
                  !hasEvents && !isSelected && !isToday(day) && "text-foreground"
                )}
              >
                {day}
                {hasEvents && (
                  <span className="absolute bottom-1 flex items-center gap-0.5">
                    {eventColors.map((color) => (
                      <span
                        key={color}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: isSelected ? "currentColor" : color }}
                      />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {selectedDate && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Eventos del{" "}
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
              })}
            </h4>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay eventos</p>
            ) : (
              <div className="relative space-y-2 max-h-72 overflow-y-auto">
                {selectedEvents.map((event) =>
                  editingEventId === event.id ? (
                    <form
                      key={event.id}
                      onSubmit={saveEvent}
                      className="space-y-2 p-3 rounded-md bg-primary/5 border border-primary/30"
                    >
                      <fieldset disabled={isEditing} className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
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
                      <div className="grid grid-cols-2 gap-2">
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
                      </div>
                      <Input
                        aria-label="Minutos de anticipación para el recordatorio"
                        type="number"
                        min="0"
                        max="1440"
                        value={editReminderMinutes}
                        onChange={(event) => setEditReminderMinutes(event.target.value)}
                        placeholder="Minutos antes del aviso"
                      />
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancelar
                        </Button>
                        <Button type="submit" size="sm" disabled={isEditing || !editDate || !editDescription.trim()}>
                          <Save className="h-3.5 w-3.5 mr-1" />
                          {isEditing ? "Guardando..." : "Guardar"}
                        </Button>
                      </div>
                      </fieldset>
                    </form>
                  ) : (
                    <div
                      key={event.id}
                      className="p-2 rounded-md border"
                      style={{
                        backgroundColor: `${getEventColor(event.category)}1A`,
                        borderColor: `${getEventColor(event.category)}4D`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {event.time && (
                          <span
                            className="text-xs font-semibold px-1.5 py-0.5 rounded"
                            style={{
                              color: getEventColor(event.category),
                              backgroundColor: `${getEventColor(event.category)}20`,
                            }}
                          >
                            {event.time}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{event.eventText || event.content}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: getEventColor(event.category) }}
                              />
                              {getEventCategoryLabel(event.category)}
                            </span>
                            {event.recurrence === "weekly" && <span>Cada semana</span>}
                            {event.recurrence === "monthly" && <span>Cada mes</span>}
                            {event.time && <span>Aviso: {event.reminderMinutes ?? 15} min antes</span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(event)}
                          disabled={savingKeys.includes(`note-${event.id}`)}
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Editar evento</span>
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}