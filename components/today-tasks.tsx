"use client"
import { useState } from "react"
import { Check, Clock3, ListTodo, Trash2 } from "lucide-react"
import { getEventCategoryLabel, getEventColor, isEventCompleted, useNotes } from "@/contexts/notes-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

function getTodayDate() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}

export function TodayTasks() {
  const [content, setContent] = useState("")
  const [time, setTime] = useState("")
  const [savingAction, setSavingAction] = useState("")
  const { addTodayTasks, deleteNote, getEventsForDate, setEventCompletion, savingKeys } = useNotes()
  const isAdding = savingKeys.includes("add-today")
  const today = getTodayDate()
  const tasks = getEventsForDate(today).sort((first, second) => {
    const firstTime = first.time || "23:59"
    const secondTime = second.time || "23:59"
    return firstTime.localeCompare(secondTime)
  })

  const addTasks = async () => {
    if (!content.trim()) return
    if (!await addTodayTasks(content, time || undefined)) return
    setContent("")
    setTime("")
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    addTasks()
  }

  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      addTasks()
    }
  }

  return (
    <main className="container mx-auto w-full min-w-0 flex-1 px-4 py-6">
      <Card className="mx-auto max-w-3xl border-border/50 shadow-lg shadow-primary/5">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ListTodo className="h-5 w-5 text-primary" />
            Notas de hoy
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Anotá una o varias tareas. Separalas con punto o en líneas distintas.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <fieldset disabled={isAdding} className="space-y-3">
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Ej.: ir al gym. ir al súper"
              className="min-h-28 resize-y bg-background"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                aria-label="Hora opcional para las tareas"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="bg-background sm:w-44"
              />
              <Button type="submit" disabled={isAdding} className="sm:ml-auto">
                <ListTodo className="h-4 w-4" />
                {isAdding ? "Guardando..." : "Agregar tareas"}
              </Button>
            </div>
            </fieldset>
          </form>
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Todavía no anotaste tareas para hoy.
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const completed = isEventCompleted(task, today)
                const color = getEventColor(task.category)
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3",
                      completed && "opacity-70"
                    )}
                    style={{
                      backgroundColor: `${color}12`,
                      borderColor: `${color}42`,
                    }}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size={savingKeys.includes(`note-${task.id}`) && savingAction === `complete-${task.id}` ? "sm" : "icon-sm"}
                      disabled={savingKeys.includes(`note-${task.id}`)}
                      onClick={() => { setSavingAction(`complete-${task.id}`); void setEventCompletion(task.id, today, !completed) }}
                      title={completed ? "Reabrir tarea" : "Marcar como completada"}
                      className="shrink-0 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      <Check className={cn("h-4 w-4", completed && "text-emerald-600 dark:text-emerald-400")} />
                      {savingKeys.includes(`note-${task.id}`) && savingAction === `complete-${task.id}` && "Guardando..."}
                      <span className="sr-only">{completed ? "Reabrir tarea" : "Marcar como completada"}</span>
                    </Button>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm text-foreground", completed && "line-through")}>
                        {task.eventText || task.content}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {task.time ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {task.time}
                          </span>
                        ) : (
                          <span>Sin hora</span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                          {getEventCategoryLabel(task.category)}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size={savingKeys.includes(`note-${task.id}`) && savingAction === `delete-${task.id}` ? "sm" : "icon-sm"}
                      disabled={savingKeys.includes(`note-${task.id}`)}
                      onClick={() => { setSavingAction(`delete-${task.id}`); void deleteNote(task.id) }}
                      title="Eliminar tarea"
                      className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      {savingKeys.includes(`note-${task.id}`) && savingAction === `delete-${task.id}` && "Guardando..."}
                      <span className="sr-only">Eliminar tarea</span>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}