"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, MapPin, Settings, LogOut, Truck, MessageSquare, History, HelpCircle, PlusCircle} from "lucide-react"
import Link from "next/link"

interface DashboardSidebarProps {
  userType?: "passenger" | "driver"
}

export function DashboardSidebar({ userType = "passenger" }: DashboardSidebarProps) {
  const router = useRouter()
  const isDriver = userType === "driver"

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/login")
  }

  if (isDriver) {
    return (
      <div className="w-64 bg-card border-r p-6 space-y-6 h-screen sticky top-0 overflow-y-auto">
        {/* Profile Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl">
              👤
            </div>
            <div>
              <h3 className="font-bold text-sm">Davison J.</h3>
              <p className="text-xs text-muted-foreground">
                Conductor <span className="text-yellow-500">⭐</span> 4.9
              </p>
            </div>
          </div>
        </div>

        {/* Principal Menu */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Principal</p>
          <nav className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-sm">
              <MapPin className="w-4 h-4 mr-2" />
              Mis rutas
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Solicitudes
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </nav>
        </div>

        {/* Gestión Menu */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Gestión</p>
          <nav className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-sm">
              <History className="w-4 h-4 mr-2" />
              Historial
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm">
              <Truck className="w-4 h-4 mr-2" />
              Vehículo
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm">
              <Settings className="w-4 h-4 mr-2" />
              Perfil
            </Button>
          </nav>
        </div>

        {/* Cuenta Menu */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Cuenta</p>
          <nav className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-sm">
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </nav>
        </div>

        {/* Spacer */}
        <div className="flex-1" />
      </div>
    )
  }

  // Passenger Sidebar
  return (
    <div className="w-64 bg-card border-r p-6 space-y-8 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold">
          VP
        </div>
        <span className="font-bold">ViamosPues</span>
      </div>

      {/* User Type Badge */}
      <div className="text-xs font-medium px-3 py-1.5 bg-primary/10 text-primary rounded-lg w-fit">
        👤 Pasajero
      </div>

      {/* Menu */}
      <nav className="space-y-2">
        <Button variant="ghost" className="w-full justify-start">
          <MapPin className="w-4 h-4 mr-2" />
          Buscar ruta
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <MapPin className="w-4 h-4 mr-2" />
          Mis viajes
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <MapPin className="w-4 h-4 mr-2" />
          Historial
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="w-4 h-4 mr-2" />
          Perfil
        </Button>
      </nav>

      {/* Wallet Section */}
      <Card className="p-4 space-y-4 border-primary/20 bg-primary/5">
        <div>
          <p className="text-xs text-muted-foreground">Saldo de cartera</p>
          <p className="text-2xl font-bold">$ 45.000 cop</p>
        </div>
        <Button variant="outline" className="w-full" size="sm">
          <Wallet className="w-4 h-4 mr-2" />
          Recargar
        </Button>
      </Card>

      {/* Logout */}
      <div className="absolute bottom-6 left-6 right-6">
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
