import { FavoriteDrivers } from "@/components/favorite-drivers"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function FavoriteDriversPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar userType="passenger" />
      <main className="min-w-0 flex-1">
        <DashboardHeader userType="passenger" />
        <div className="mx-auto w-full max-w-3xl p-6 md:p-10">
          <FavoriteDrivers />
        </div>
      </main>
    </div>
  )
}
