"use client"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useAuth } from "./auth-context"
import { createClient } from "@/utils/supabase/client"

export type EventCategory = "work" | "study" | "personal" | "important"
export type EventRecurrence = "weekly" | "monthly"

const DEFAULT_EVENT_COLOR = "#8B5CF6"
const DEFAULT_REMINDER_MINUTES = 15
export const EVENT_CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: "work", label: "Trabajo", color: "#3B82F6" },
  { value: "study", label: "Estudio", color: "#10B981" },
  { value: "personal", label: "Personal", color: "#8B5CF6" },
  { value: "important", label: "Importante", color: "#F97316" },
]

export interface Note {
  id: string
  content: string
  createdAt: string
  date?: string
  time?: string
  eventText?: string
  category?: EventCategory
  recurrence?: EventRecurrence
  reminderMinutes?: number
  completedOccurrences?: Record<string, string>
  isTodayTask?: boolean
}

interface EventDetails {
  date: string
  time?: string
  eventText: string
  category?: EventCategory
  recurrence?: EventRecurrence
  reminderMinutes?: number
}

type QuickEventDetails = EventDetails

interface NotesContextType {
  notes: Note[]
  savingKeys: string[]
  addNote: (content: string, quickAdd?: QuickEventDetails) => Promise<boolean>
  addTodayTasks: (content: string, time?: string) => Promise<boolean>
  updateEvent: (id: string, event: EventDetails) => Promise<boolean>
  setEventCompletion: (id: string, occurrenceDate: string, isCompleted: boolean) => Promise<boolean>
  deleteNote: (id: string) => Promise<boolean>
  getEventsForDate: (date: string) => Note[]
}

interface NoteRow {
  id: string
  user_id: string
  content: string
  created_at: string
  date: string | null
  time: string | null
  event_text: string | null
  category: string | null
  recurrence: string | null
  reminder_minutes: number | null
  completed_occurrences: Record<string, string> | null
  is_today_task: boolean | null
}

const supabase = createClient()
const NotesContext = createContext<NotesContextType | undefined>(undefined)

function reportDatabaseError(context: string, error: { code?: string; message?: string; details?: string; hint?: string }) {
  const description = [error.code, error.message, error.details, error.hint].filter(Boolean).join(" | ")
  console.warn(`${context}: ${description || "error desconocido de Supabase"}`)
}

function isEventCategory(value: string | null): value is EventCategory {
  return EVENT_CATEGORIES.some((category) => category.value === value)
}

function isEventRecurrence(value: string | null): value is EventRecurrence {
  return value === "weekly" || value === "monthly"
}

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    date: row.date || undefined,
    time: row.time || undefined,
    eventText: row.event_text || undefined,
    category: isEventCategory(row.category) ? row.category : undefined,
    recurrence: isEventRecurrence(row.recurrence) ? row.recurrence : undefined,
    reminderMinutes: row.reminder_minutes ?? DEFAULT_REMINDER_MINUTES,
    completedOccurrences: row.completed_occurrences || undefined,
    isTodayTask: row.is_today_task || undefined,
  }
}

function getTodayDate() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}

function parseNoteDate(content: string): { date: string; time?: string; eventText: string } | null {
  const originalContent = content.trim()
  if (!originalContent) return null

  const now = new Date()
  let remainingContent = originalContent
  let date: string | undefined

  const numericDateMatch = remainingContent.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/)
  if (numericDateMatch) {
    const yearValue = numericDateMatch[3]
      ? Number(numericDateMatch[3].length === 2 ? `20${numericDateMatch[3]}` : numericDateMatch[3])
      : now.getFullYear()
    const month = Number(numericDateMatch[2])
    const day = Number(numericDateMatch[1])
    const candidate = new Date(yearValue, month - 1, day)
    if (candidate.getFullYear() === yearValue && candidate.getMonth() === month - 1 && candidate.getDate() === day) {
      date = `${yearValue}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      remainingContent = remainingContent.replace(numericDateMatch[0], " ")
    }
  }

  if (!date) {
    const relativeDateMatch = remainingContent.match(/\b(?:el\s+|este\s+|pr[oó]ximo\s+)?(pasado\s+ma[ñn]ana|ma[ñn]ana|hoy)\b/i)
    if (relativeDateMatch) {
      const phrase = relativeDateMatch[1].toLocaleLowerCase()
      const daysToAdd = phrase.startsWith("pasado") ? 2 : phrase === "mañana" || phrase === "manana" ? 1 : 0
      const candidate = new Date(now)
      candidate.setDate(candidate.getDate() + daysToAdd)
      date = formatLocalDate(candidate)
      remainingContent = remainingContent.replace(relativeDateMatch[0], " ")
    }
  }

  if (!date) {
    const weekdays: Record<string, number> = {
      domingo: 0,
      lunes: 1,
      martes: 2,
      miercoles: 3,
      miércoles: 3,
      jueves: 4,
      viernes: 5,
      sabado: 6,
      sábado: 6,
    }
    const weekdayMatch = remainingContent.match(/\b(?:el\s+|este\s+|pr[oó]ximo\s+)?(domingo|lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado)\b/i)
    if (weekdayMatch) {
      const weekday = weekdays[weekdayMatch[1].toLocaleLowerCase()]
      const daysToAdd = (weekday - now.getDay() + 7) % 7
      const candidate = new Date(now)
      candidate.setDate(candidate.getDate() + daysToAdd)
      date = formatLocalDate(candidate)
      remainingContent = remainingContent.replace(weekdayMatch[0], " ")
    }
  }

  let time: string | undefined
  const timeMatch = remainingContent.match(/\ba\s+las?\s+(\d{1,2})(?::(\d{2}))?\s*(?:hs?|h)?\b/i)
    || remainingContent.match(/\b(\d{1,2}):(\d{2})\b/)
    || remainingContent.match(/\b(\d{1,2})\s*(?:hs?|h)\b/i)
  if (timeMatch) {
    const hours = Number(timeMatch[1])
    const minutes = Number(timeMatch[2] || "0")
    if (hours <= 23 && minutes <= 59) {
      time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
      remainingContent = remainingContent.replace(timeMatch[0], " ")
    }
  }

  if (!date) date = getTodayDate()
  const eventText = remainingContent
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .replace(/^[,.;:\-]+|[,.;:\-]+$/g, "")
    .trim()
  return { date, time, eventText: eventText || originalContent }
}

export function getEventColor(category?: EventCategory) {
  return EVENT_CATEGORIES.find((item) => item.value === category)?.color || DEFAULT_EVENT_COLOR
}

export function getEventCategoryLabel(category?: EventCategory) {
  return EVENT_CATEGORIES.find((item) => item.value === category)?.label || "General"
}

export function isEventCompleted(note: Note, occurrenceDate: string) {
  return Boolean(note.completedOccurrences?.[occurrenceDate])
}

function normalizeReminderMinutes(minutes?: number) {
  if (typeof minutes !== "number" || !Number.isFinite(minutes)) return DEFAULT_REMINDER_MINUTES
  return Math.min(Math.max(Math.round(minutes), 0), 1440)
}

function formatEventContent({ date, time, eventText }: EventDetails) {
  const [, month, day] = date.split("-")
  const shortDate = `${day}/${month}`
  return time ? `${shortDate} ${time} ${eventText}` : `${shortDate} ${eventText}`
}

function eventOccursOnDate(note: Note, date: string) {
  if (!note.date || date < note.date) return false
  if (date === note.date) return true
  if (!note.recurrence) return false

  const [year, month, day] = date.split("-").map(Number)
  const [startYear, startMonth, startDay] = note.date.split("-").map(Number)
  if (note.recurrence === "monthly") return day === startDay

  return new Date(year, month - 1, day).getDay() === new Date(startYear, startMonth - 1, startDay).getDay()
}

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function getDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)
  return new Date(year, month - 1, day, hours, minutes)
}

function toNoteRow(note: Note, userId: string) {
  return {
    id: note.id,
    user_id: userId,
    content: note.content,
    created_at: note.createdAt,
    date: note.date || null,
    time: note.time || null,
    event_text: note.eventText || null,
    category: note.category || null,
    recurrence: note.recurrence || null,
    reminder_minutes: normalizeReminderMinutes(note.reminderMinutes),
    completed_occurrences: note.completedOccurrences || {},
    is_today_task: Boolean(note.isTodayTask),
  }
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [savingKeys, setSavingKeys] = useState<string[]>([])
  const [saveError, setSaveError] = useState("")
  const pendingKeys = useRef(new Set<string>())
  const errorDialog = useRef<HTMLDialogElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (saveError && !errorDialog.current?.open) errorDialog.current?.showModal()
  }, [saveError])

  const save = async (key: string, message: string, operation: () => PromiseLike<{ error: { message?: string } | null }>, onSuccess: () => void) => {
    if (pendingKeys.current.has(key)) return false
    pendingKeys.current.add(key)
    setSavingKeys(Array.from(pendingKeys.current))
    try {
      const { error } = await operation()
      if (error) throw error
      onSuccess()
      return true
    } catch (error) {
      console.warn(message, error)
      setSaveError(message)
      return false
    } finally {
      pendingKeys.current.delete(key)
      setSavingKeys(Array.from(pendingKeys.current))
    }
  }

  useEffect(() => {
    let isActive = true
    if (!user) {
      setNotes([])
      return () => {
        isActive = false
      }
    }

    const loadNotes = async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (!isActive) return
      if (error) {
        reportDatabaseError("No se pudieron cargar las actividades", error)
        setNotes([])
        return
      }
      setNotes((data as NoteRow[]).map(mapNote))
    }

    void loadNotes()
    return () => {
      isActive = false
    }
  }, [user])

  const addNote = async (content: string, quickAdd?: QuickEventDetails) => {
    if (!user) return false

    let newNote: Note
    if (quickAdd) {
      const [day, month] = quickAdd.date.split("/")
      const date = `${new Date().getFullYear()}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      newNote = {
        id: crypto.randomUUID(),
        content: quickAdd.time
          ? `${quickAdd.date} ${quickAdd.time} ${quickAdd.eventText}`
          : `${quickAdd.date} ${quickAdd.eventText}`,
        createdAt: new Date().toISOString(),
        date,
        time: quickAdd.time,
        eventText: quickAdd.eventText,
        category: quickAdd.category,
        recurrence: quickAdd.recurrence,
        reminderMinutes: normalizeReminderMinutes(quickAdd.reminderMinutes),
      }
    } else {
      if (!content.trim()) return false
      const parsed = parseNoteDate(content) || { date: getTodayDate(), eventText: content.trim() }
      newNote = {
        id: crypto.randomUUID(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        date: parsed.date,
        time: parsed.time,
        eventText: parsed.eventText,
        reminderMinutes: DEFAULT_REMINDER_MINUTES,
      }
    }

    return save("add-note", "No se pudo guardar la actividad. Intentá nuevamente.",
      () => supabase.from("notes").insert(toNoteRow(newNote, user.id)),
      () => setNotes((current) => [newNote, ...current]))
  }

  const addTodayTasks = async (content: string, time?: string) => {
    if (!user) return false
    const tasks = content.split(/[.\n]+/).map((task) => task.trim()).filter(Boolean)
    if (!tasks.length) return false

    const date = getTodayDate()
    const createdAt = new Date().toISOString()
    const newNotes = tasks.map((eventText): Note => ({
      id: crypto.randomUUID(),
      content: formatEventContent({ date, time, eventText }),
      createdAt,
      date,
      time,
      eventText,
      reminderMinutes: DEFAULT_REMINDER_MINUTES,
      isTodayTask: true,
    }))
    return save("add-today", "No se pudieron guardar las tareas. Intentá nuevamente.",
      () => supabase.from("notes").insert(newNotes.map((note) => toNoteRow(note, user.id))),
      () => setNotes((current) => [...newNotes, ...current]))
  }

  const updateEvent = async (id: string, event: EventDetails) => {
    if (!user) return false
    const updatedNote = notes.find((note) => note.id === id)
    if (!updatedNote) return false
    const nextNote: Note = {
      ...updatedNote,
      content: formatEventContent(event),
      date: event.date,
      time: event.time,
      eventText: event.eventText,
      category: event.category,
      recurrence: event.recurrence,
      reminderMinutes: normalizeReminderMinutes(event.reminderMinutes),
    }
    return save(`note-${id}`, "No se pudo actualizar la actividad. Intentá nuevamente.",
      () => supabase.from("notes").update(toNoteRow(nextNote, user.id)).eq("id", id).eq("user_id", user.id).select("id").single(),
      () => setNotes((current) => current.map((note) => note.id === id ? nextNote : note)))
  }

  const setEventCompletion = async (id: string, occurrenceDate: string, isCompleted: boolean) => {
    if (!user) return false
    const note = notes.find((item) => item.id === id)
    if (!note) return false
    const completedOccurrences = { ...note.completedOccurrences }
    if (isCompleted) completedOccurrences[occurrenceDate] = new Date().toISOString()
    else delete completedOccurrences[occurrenceDate]

    const nextNote = {
      ...note,
      completedOccurrences: Object.keys(completedOccurrences).length ? completedOccurrences : undefined,
    }
    return save(`note-${id}`, "No se pudo actualizar el estado de la actividad. Intentá nuevamente.",
      () => supabase.from("notes").update({ completed_occurrences: completedOccurrences }).eq("id", id).eq("user_id", user.id).select("id").single(),
      () => setNotes((current) => current.map((item) => item.id === id ? nextNote : item)))
  }

  const deleteNote = async (id: string) => {
    if (!user) return false
    return save(`note-${id}`, "No se pudo eliminar la actividad. Intentá nuevamente.",
      () => supabase.from("notes").delete().eq("id", id).eq("user_id", user.id).select("id").single(),
      () => setNotes((current) => current.filter((note) => note.id !== id)))
  }

  const getEventsForDate = (date: string) => notes.filter((note) => eventOccursOnDate(note, date))

  useEffect(() => {
    if (!user || !notes.length) return

    const completePastEvents = () => {
      const now = new Date()
      const updates: { id: string; completedOccurrences: Record<string, string> }[] = []
      const updatedNotes = notes.map((note) => {
        if (pendingKeys.current.has(`note-${note.id}`)) return note
        const completionTime = note.isTodayTask ? "23:59" : note.time
        if (!note.date || !completionTime) return note

        const completedOccurrences = { ...note.completedOccurrences }
        let occurrenceDate: string | undefined
        if (!note.recurrence) occurrenceDate = note.date
        else {
          for (let offset = 0; offset <= 31; offset += 1) {
            const candidate = new Date(now)
            candidate.setDate(now.getDate() - offset)
            const candidateDate = formatLocalDate(candidate)
            if (eventOccursOnDate(note, candidateDate) && getDateTime(candidateDate, completionTime) <= now) {
              occurrenceDate = candidateDate
              break
            }
          }
        }
        if (!occurrenceDate || isEventCompleted(note, occurrenceDate)) return note

        const occurrenceDateTime = getDateTime(occurrenceDate, completionTime)
        if (occurrenceDateTime > now) return note
        completedOccurrences[occurrenceDate] = occurrenceDateTime.toISOString()
        updates.push({ id: note.id, completedOccurrences })
        return { ...note, completedOccurrences }
      })

      if (!updates.length) return
      setNotes(updatedNotes)
      void Promise.all(updates.map(({ id, completedOccurrences }) =>
        supabase.from("notes").update({ completed_occurrences: completedOccurrences }).eq("id", id).eq("user_id", user.id)
      )).then((results) => {
        results.forEach(({ error }) => {
          if (error) reportDatabaseError("No se pudo guardar el historial automático", error)
        })
      })
    }

    completePastEvents()
    const intervalId = window.setInterval(completePastEvents, 60_000)
    return () => window.clearInterval(intervalId)
  }, [notes, savingKeys, user])

  return (
    <NotesContext.Provider value={{ notes, savingKeys, addNote, addTodayTasks, updateEvent, setEventCompletion, deleteNote, getEventsForDate }}>
      {children}
      <dialog ref={errorDialog} onClose={() => setSaveError("")} aria-labelledby="save-error-title" className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg backdrop:bg-black/50">
        <h2 id="save-error-title" className="text-lg font-semibold">No se pudo guardar</h2>
        <p className="mt-2 text-sm text-muted-foreground">{saveError}</p>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={() => errorDialog.current?.close()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Cerrar</button>
        </div>
      </dialog>
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const context = useContext(NotesContext)
  if (context === undefined) throw new Error("useNotes must be used within a NotesProvider")
  return context
}