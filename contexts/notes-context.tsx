"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"

export interface Note {
  id: string
  content: string
  createdAt: string
  date?: string
  time?: string
  eventText?: string
}

interface NotesContextType {
  notes: Note[]
  addNote: (content: string, quickAdd?: { date: string; time?: string; eventText: string }) => void
  deleteNote: (id: string) => void
  getEventsForDate: (date: string) => Note[]
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

function parseNoteDate(content: string): { date: string; time?: string; eventText: string } | null {
  const dateTimePattern = /^(\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?\s+(.+)$/
  const match = content.trim().match(dateTimePattern)
  
  if (match) {
    const day = match[1].padStart(2, "0")
    const month = match[2].padStart(2, "0")
    const currentYear = new Date().getFullYear()
    const date = `${currentYear}-${month}-${day}`
    
    let time: string | undefined
    if (match[3] && match[4]) {
      time = `${match[3].padStart(2, "0")}:${match[4]}`
    }
    const eventText = match[5].trim()
    return { date, time, eventText }
  }
  return null
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const savedNotes = localStorage.getItem(`notes_${user.id}`)
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes))
      } else {
        setNotes([])
      }
    } else {
      setNotes([])
    }
  }, [user])

  const saveNotes = (newNotes: Note[]) => {
    if (user) {
      localStorage.setItem(`notes_${user.id}`, JSON.stringify(newNotes))
    }
  }

  const addNote = (content: string, quickAdd?: { date: string; time?: string; eventText: string }) => {
    if (!user) return
    if (quickAdd) {
      const newNote: Note = {
        id: crypto.randomUUID(),
        content: quickAdd.time 
          ? `${quickAdd.date} ${quickAdd.time} ${quickAdd.eventText}`
          : `${quickAdd.date} ${quickAdd.eventText}`,
        createdAt: new Date().toISOString(),
        date: (() => {
          const [day, month] = quickAdd.date.split("/")
          const currentYear = new Date().getFullYear()
          return `${currentYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
        })(),
        time: quickAdd.time,
        eventText: quickAdd.eventText,
      }
      const newNotes = [newNote, ...notes]
      setNotes(newNotes)
      saveNotes(newNotes)
      return
    }
    if (!content.trim()) return
    const parsed = parseNoteDate(content)
    const newNote: Note = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
      date: parsed?.date,
      time: parsed?.time,
      eventText: parsed?.eventText,
    }
    const newNotes = [newNote, ...notes]
    setNotes(newNotes)
    saveNotes(newNotes)
  }

  const deleteNote = (id: string) => {
    const newNotes = notes.filter((note) => note.id !== id)
    setNotes(newNotes)
    saveNotes(newNotes)
  }

  const getEventsForDate = (date: string): Note[] => {
    return notes.filter((note) => note.date === date)
  }

  return (
    <NotesContext.Provider value={{ notes, addNote, deleteNote, getEventsForDate }}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const context = useContext(NotesContext)
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider")
  }
  return context
}