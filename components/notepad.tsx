"use client"
import { useState } from "react"
import { useNotes } from "@/contexts/notes-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, CalendarCheck, Notebook, Zap, Clock, X } from "lucide-react"

export function Notepad() {
  const [newNote, setNewNote] = useState("")
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickDate, setQuickDate] = useState("")
  const [quickTime, setQuickTime] = useState("")
  const [quickDetail, setQuickDetail] = useState("")
  const { notes, addNote, deleteNote } = useNotes()

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(newNote)
      setNewNote("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddNote()
    }
  }

  const handleQuickAdd = () => {
    if (quickDate.trim() && quickDetail.trim()) {
      addNote("", {
        date: quickDate,
        time: quickTime || undefined,
        eventText: quickDetail,
      })
      setQuickDate("")
      setQuickTime("")
      setQuickDetail("")
      setShowQuickAdd(false)
    }
  }

  const handleQuickKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleQuickAdd()
    }
  }

  return (
    <Card className="h-full flex flex-col border-border/50 shadow-lg shadow-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Notebook className="h-5 w-5 text-primary" />
          Bloc de Notas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Escribe <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">dd/mm HH:MM texto</span> para agregar al calendario
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Quick Add Form */}
        {showQuickAdd ? (
          <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Anotar Rápido
              </h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowQuickAdd(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Día (dd/mm)
                </label>
                <Input
                  placeholder="23/07"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  onKeyDown={handleQuickKeyDown}
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Hora (opcional)
                </label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={quickTime}
                    onChange={(e) => setQuickTime(e.target.value)}
                    onKeyDown={handleQuickKeyDown}
                    className="bg-background pl-9"
                  />
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
            <Button
              onClick={handleQuickAdd}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!quickDate.trim() || !quickDetail.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowQuickAdd(true)}
            className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5 hover:text-primary"
          >
            <Zap className="h-4 w-4 mr-2" />
            Anotar Rápido
          </Button>
        )}
        {/* Regular note input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Ejemplo: 23/07 19:30 Reunión de trabajo&#10;O escribe cualquier nota..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] resize-none bg-background"
          />
          <Button
            onClick={handleAddNote}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={!newNote.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar nota
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Notebook className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay notas todavía</p>
              <p className="text-sm">Comienza a escribir para crear una</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="group p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {note.content}
                    </p>
                    {note.date && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <CalendarCheck className="h-3.5 w-3.5 text-accent" />
                        <span className="text-xs text-accent font-medium">
                          Evento: {new Date(note.date + "T00:00:00").toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                          })}
                          {note.time && ` a las ${note.time}`}
                        </span>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNote(note.id)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar nota</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}