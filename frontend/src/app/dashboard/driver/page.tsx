import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardContent } from "@/components/dashboard/content"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function DriverDashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar userType="driver" />
      <main className="flex-1">
        <DashboardHeader userType="driver" />
        <DashboardContent userType="driver" />
      </main>
    </div>
  )
}
