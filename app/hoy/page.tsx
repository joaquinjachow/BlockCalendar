"use client"
import { LoginForm } from "@/components/login-form"
import { TodayTasks } from "@/components/today-tasks"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/contexts/auth-context"

export default function TodayPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!user) return <LoginForm />
  return <TodayTasks />
}