"use client"
import { useEffect, useState } from "react"
import { EVENT_CATEGORIES, getEventCategoryLabel, getEventColor, type EventCategory, type EventRecurrence, useNotes } from "@/contexts/notes-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, CalendarCheck, Notebook, Zap, Clock, X, Pencil, Save } from "lucide-react"

const selectClassName = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

function formatShortDate(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 4)
  return numbers.length > 2 ? `${numbers.slice(0, 2)}/${numbers.slice(2)}` : numbers
}

function getDefaultDate(selectedDate: string | null) {
  if (selectedDate) {
    const [, month, day] = selectedDate.split("-")
    return `${day}/${month}`
  }
  const today = new Date()
  return `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}`
}

interface NotepadProps {
  selectedDate: string | null
  onClearSelectedDate: () => void
}

export function Notepad({ selectedDate, onClearSelectedDate }: NotepadProps) {
  const [newNote, setNewNote] = useState("")
  const [showQuickTextInput, setShowQuickTextInput] = useState(false)
  const [quickDate, setQuickDate] = useState("")
  const [quickTime, setQuickTime] = useState("")
  const [quickDetail, setQuickDetail] = useState("")
  const [quickCategory, setQuickCategory] = useState<EventCategory | "">("")
  const [quickRecurrence, setQuickRecurrence] = useState<EventRecurrence | "">("")
  const [quickReminderMinutes, setQuickReminderMinutes] = useState("15")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategory, setEditCategory] = useState<EventCategory | "">("")
  const [editRecurrence, setEditRecurrence] = useState<EventRecurrence | "">("")
  const [editReminderMinutes, setEditReminderMinutes] = useState("15")
  const { notes, savingKeys, addNote, updateEvent, deleteNote, getEventsForDate } = useNotes()
  const isAdding = savingKeys.includes("add-note")
  const isEditing = editingNoteId !== null && savingKeys.includes(`note-${editingNoteId}`)
  const displayedNotes = selectedDate ? getEventsForDate(selectedDate) : notes

  useEffect(() => {
    setQuickDate(getDefaultDate(selectedDate))
  }, [selectedDate])

  const handleAddNote = async () => {
    if (newNote.trim()) {
      if (await addNote(newNote)) {
        setNewNote("")
        setShowQuickTextInput(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddNote()
    }
  }

  const handleQuickAdd = async () => {
    if (quickDate.trim() && quickDetail.trim()) {
      const saved = await addNote("", {
        date: quickDate,
        time: quickTime || undefined,
        eventText: quickDetail,
        category: quickCategory || undefined,
        recurrence: quickRecurrence || undefined,
        reminderMinutes: Number(quickReminderMinutes),
      })
      if (!saved) return
      setQuickDate(getDefaultDate(selectedDate))
      setQuickTime("")
      setQuickDetail("")
      setQuickCategory("")
      setQuickRecurrence("")
      setQuickReminderMinutes("15")
    }
  }

  const handleQuickKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleQuickAdd()
    }
  }

  const startEditing = (note: (typeof notes)[number]) => {
    setEditingNoteId(note.id)
    setEditDate(note.date || "")
    setEditTime(note.time || "")
    setEditDescription(note.eventText || note.content)
    setEditCategory(note.category || "")
    setEditRecurrence(note.recurrence || "")
    setEditReminderMinutes(String(note.reminderMinutes ?? 15))
  }

  const cancelEditing = () => {
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

  return (
    <Card className="flex flex-col border-border/50 shadow-lg shadow-primary/5 lg:h-full lg:min-h-0 lg:overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-center gap-2 text-foreground sm:justify-start">
          <Notebook className="h-5 w-5 text-primary" />
          Bloc de Notas
        </CardTitle>
        <p className="text-center text-sm text-muted-foreground sm:text-left">
          Cargá una actividad con fecha, hora, categoría, repetición y recordatorio.
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex min-h-0 flex-col gap-4">
        {/* Main activity form */}
        {!showQuickTextInput && (
          <fieldset disabled={isAdding} className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-center sm:justify-between">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                Nueva actividad
              </h4>
          </div>
            <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Fecha inicial (dd/mm)
                </label>
                <Input
                  value={quickDate}
                  onChange={(event) => setQuickDate(formatShortDate(event.target.value))}
                  onKeyDown={handleQuickKeyDown}
                  inputMode="numeric"
                  maxLength={5}
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Hora (opcional)
                </label>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      aria-label="Hora opcional de la actividad"
                      value={quickTime}
                      onChange={(e) => setQuickTime(e.target.value)}
                      onKeyDown={handleQuickKeyDown}
                      className="bg-background pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() => {
                      const now = new Date()
                      setQuickTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`)
                    }}
                    aria-label="Usar la hora actual"
                  >
                    Ya
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Detalle
              </label>
              <Input
                placeholder="Descripción del evento..."
                value={quickDetail}
                onChange={(e) => setQuickDetail(e.target.value)}
                onKeyDown={handleQuickKeyDown}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Categoría
                </label>
                <select
                  value={quickCategory}
                  onChange={(event) => setQuickCategory(event.target.value as EventCategory | "")}
                  className={selectClassName}
                >
                  <option value="">General (violeta)</option>
                  {EVENT_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Repetir
                </label>
                <select
                  value={quickRecurrence}
                  onChange={(event) => setQuickRecurrence(event.target.value as EventRecurrence | "")}
                  className={selectClassName}
                >
                  <option value="">No repetir</option>
                  <option value="weekly">Todas las semanas</option>
                  <option value="monthly">Todos los meses</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Avisar antes (minutos)
              </label>
              <Input
                type="number"
                min="0"
                max="1440"
                value={quickReminderMinutes}
                onChange={(event) => setQuickReminderMinutes(event.target.value)}
                onKeyDown={handleQuickKeyDown}
                className="bg-background"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Predeterminado: 15 minutos. Indicá la hora del evento para recibir el aviso.
              </p>
            </div>
            <Button
              onClick={handleQuickAdd}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isAdding || !quickDate.trim() || !quickDetail.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAdding ? "Guardando..." : "Agregar actividad"}
            </Button>
          </fieldset>
        )}
        {/* Quick text input */}
        {showQuickTextInput ? (
          <fieldset disabled={isAdding} className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Anotar rápido
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Escribí texto libre: <span className="font-mono">Dentista mañana a las 16</span>.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowQuickTextInput(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar anotación rápida</span>
              </Button>
            </div>
            <Textarea
              placeholder="Ejemplo: Dentista mañana a las 16&#10;También podés usar 23/07 19:30 Reunión de trabajo"
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-25 resize-none bg-background"
            />
            <Button
              onClick={handleAddNote}
              className="w-full cursor-pointer bg-primary text-primary-foreground hover:bg-primary/80"
              disabled={isAdding || !newNote.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAdding ? "Guardando..." : "Agregar desde texto"}
            </Button>
          </fieldset>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowQuickTextInput(true)}
            disabled={isAdding}
            className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5 hover:text-primary"
          >
            <Zap className="h-4 w-4 mr-2" />
            Anotar rápido
          </Button>
        )}
        {selectedDate && (
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
            <p className="text-sm font-medium text-foreground">
              Actividades del {new Date(selectedDate + "T00:00:00").toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
              })}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={onClearSelectedDate}>
              Ver todas
            </Button>
          </div>
        )}
        <div className="relative max-h-128 overflow-y-auto space-y-2 lg:max-h-none lg:min-h-0 lg:flex-1">
          {displayedNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Notebook className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{selectedDate ? "No hay actividades para este día" : "No hay notas todavía"}</p>
              {!selectedDate && <p className="text-sm">Comienza a escribir para crear una</p>}
            </div>
          ) : (
            displayedNotes.map((note) => (
              <div
                key={note.id}
                className="group p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50"
              >
                {editingNoteId === note.id ? (
                  <form onSubmit={saveEvent} className="space-y-2">
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground whitespace-pre-wrap wrap-break-word">
                        {note.content}
                      </p>
                      {note.date && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <CalendarCheck
                            className="h-3.5 w-3.5"
                            style={{ color: getEventColor(note.category) }}
                          />
                          <span className="text-xs font-medium" style={{ color: getEventColor(note.category) }}>
                            Evento: {new Date((selectedDate || note.date) + "T00:00:00").toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "long",
                            })}
                            {note.time && ` a las ${note.time}`}
                          </span>
                        </div>
                      )}
                      {note.date && (
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: getEventColor(note.category) }}
                            />
                            {getEventCategoryLabel(note.category)}
                          </span>
                          {note.recurrence === "weekly" && <span>Cada semana</span>}
                          {note.recurrence === "monthly" && <span>Cada mes</span>}
                          {note.time && <span>Aviso: {note.reminderMinutes ?? 15} min antes</span>}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(note.createdAt).toLocaleString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      {note.date && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(note)}
                          disabled={savingKeys.includes(`note-${note.id}`)}
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar evento</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size={savingKeys.includes(`note-${note.id}`) ? "sm" : "icon"}
                        onClick={() => deleteNote(note.id)}
                        disabled={savingKeys.includes(`note-${note.id}`)}
                        className="h-8 opacity-0 group-hover:opacity-100 disabled:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        {savingKeys.includes(`note-${note.id}`) && "Guardando..."}
                        <span className="sr-only">Eliminar nota</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}