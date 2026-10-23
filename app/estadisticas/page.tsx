"use client"
import { Header } from "@/components/header"
import { LoginForm } from "@/components/login-form"
import { StatisticsPanel } from "@/components/statistics-panel"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/contexts/auth-context"

export default function StatisticsPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!user) return <LoginForm />

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <StatisticsPanel />
    </div>
  )
}