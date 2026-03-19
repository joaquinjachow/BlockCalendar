"use client"
import { useState } from "react"
import { useNotes, type Note } from "@/contexts/notes-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Convert Sunday (0) to 6, Monday (1) to 0
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const { getEventsForDate } = useNotes()
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
    setSelectedDate(dateStr)
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
    <Card className="h-full flex flex-col border-border/50 shadow-lg shadow-primary/5">
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
        <div className="grid grid-cols-7 gap-1 flex-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }
            const dateStr = formatDateStr(day)
            const events = getEventsForDate(dateStr)
            const hasEvents = events.length > 0
            const isSelected = selectedDate === dateStr
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={cn(
                  "aspect-square rounded-lg text-sm font-medium transition-all relative flex flex-col items-center justify-center",
                  "hover:bg-muted",
                  isToday(day) && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                  !isSelected && !isToday(day) && "text-foreground"
                )}
              >
                {day}
                {hasEvents && (
                  <span
                    className={cn(
                      "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                      isSelected ? "bg-primary-foreground" : "bg-accent"
                    )}
                  />
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
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-2 rounded-md bg-accent/20 border border-accent/30"
                  >
                    <div className="flex items-center gap-2">
                      {event.time && (
                        <span className="text-xs font-semibold text-accent bg-accent/20 px-1.5 py-0.5 rounded">
                          {event.time}
                        </span>
                      )}
                      <p className="text-sm text-foreground">{event.eventText}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}