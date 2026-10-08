import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardContent } from "@/components/dashboard/content"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function DriverDashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar userType="driver" />
      <main className="flex-1">
        <DashboardHeader userType="driver" />
        <Suspense fallback={<p className="p-6 text-muted-foreground">Cargando...</p>}>
          <DashboardContent userType="driver" />
        </Suspense>
      </main>
    </div>
  )
}
