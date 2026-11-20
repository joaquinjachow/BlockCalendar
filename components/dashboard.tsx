"use client"
import { useState } from "react"
import { Notepad } from "@/components/notepad"
import { CalendarView } from "@/components/calendar-view"
import { UpcomingActivities } from "@/components/upcoming-activities"
import { WeeklySummary } from "@/components/weekly-summary"

export function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  return (
    <main className="container mx-auto w-full min-w-0 flex-1 px-4 py-6">
      <WeeklySummary />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start lg:h-[calc(100vh-7rem)] lg:grid-rows-[minmax(0,1fr)]">
        <Notepad selectedDate={selectedDate} onClearSelectedDate={() => setSelectedDate(null)} />
        <CalendarView selectedDate={selectedDate} onSelectedDateChange={setSelectedDate} />
      </div>
      <div className="mt-6">
        <UpcomingActivities />
      </div>
    </main>
  )
}