"use client"
import { Header } from "@/components/header"
import { Notepad } from "@/components/notepad"
import { CalendarView } from "@/components/calendar-view"

export function Dashboard() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-7rem)]">
          <Notepad />
          <CalendarView />
        </div>
      </main>
    </div>
  )
}