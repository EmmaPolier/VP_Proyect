import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardContent } from "@/components/dashboard/content"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function PassengerDashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar userType="passenger" />
      <main className="flex-1">
        <DashboardHeader userType="passenger" />
        <DashboardContent userType="passenger" />
      </main>
    </div>
  )
}
