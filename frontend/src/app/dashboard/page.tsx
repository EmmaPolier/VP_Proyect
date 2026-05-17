"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardContent } from "@/components/dashboard/content"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function DashboardPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<"passenger" | "driver" | "admin">("passenger")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    
    if (!currentUser) {
      // Si no hay usuario, redirigir al login
      router.push("/login")
      return
    }

    try {
      const user = JSON.parse(currentUser)
      // Mapear id_perfil a userType: 1=passenger, 2=driver, 3=admin
      const type = user.type || (user.id_perfil === 2 ? "driver" : user.id_perfil === 3 ? "admin" : "passenger")
      setUserType(type as "passenger" | "driver" | "admin")
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/login")
      return
    }

    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar userType={userType} />
      <main className="flex-1">
        <DashboardHeader userType={userType} />
        <DashboardContent userType={userType} />
      </main>
    </div>
  )
}
