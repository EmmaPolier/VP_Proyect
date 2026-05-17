"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, MapPin, Settings, LogOut, Truck, MessageSquare, History, Users, FileText, BarChart3, HelpCircle, PlusCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

interface MenuItem {
  id: number
  nombre: string
  url: string
  orden: number
  permisos: {
    crear: boolean
    actualizar: boolean
    eliminar: boolean
    leer: boolean
  }
}

interface CurrentUser {
  id: string
  email: string
  nombres: string
  documento: string
  id_perfil: number
  type: string
}

interface DashboardSidebarProps {
  userType?: "passenger" | "driver" | "admin"
}

// Mapeo de iconos por URL
const iconMap: { [key: string]: React.ComponentType<{ className: string }> } = {
  '/driver/routes': MapPin,
  '/driver/requests': MessageSquare,
  '/driver/vehicles': Truck,
  '/driver/wallet': Wallet,
  '/driver/history': History,
  '/driver/profile': Users,
  '/driver/settings': Settings,
  '/passenger/search': MapPin,
  '/passenger/my-trips': MapPin,
  '/passenger/requests': MessageSquare,
  '/passenger/wallet': Wallet,
  '/passenger/profile': Users,
  '/passenger/settings': Settings,
  '/admin/users': Users,
  '/admin/vehicles': Truck,
  '/admin/routes': MapPin,
  '/admin/requests': MessageSquare,
  '/admin/catalogs': FileText,
  '/admin/reports': BarChart3,
  '/admin/settings': Settings,
}

export function DashboardSidebar({ userType }: DashboardSidebarProps) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Cargar usuario del localStorage
    const userStr = localStorage.getItem('currentUser')
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as CurrentUser
        setCurrentUser(user)
        
        // Cargar menú dinámico
        fetchMenu(user.id_perfil)
      } catch (err) {
        console.error('Error parsing user:', err)
        setError('Error al cargar usuario')
        setLoading(false)
      }
    } else {
      router.push('/login')
    }
  }, [router])

  const fetchMenu = async (idPerfil: number) => {
    try {
      const response = await axios.get(`${API_URL}/menu/${idPerfil}`)
      setMenuItems(response.data.menu || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching menu:', err)
      setError('Error al cargar el menú')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="w-64 bg-card border-r p-6 h-screen sticky top-0 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  const isDriver = currentUser.id_perfil === 2
  const isAdmin = currentUser.id_perfil === 3
  const isPassenger = currentUser.id_perfil === 1

  // Obtener nombre corto
  const firstName = currentUser.nombres?.split(' ')[0] || 'Usuario'

  return (
    <div className="w-64 bg-card border-r p-6 space-y-6 h-screen sticky top-0 overflow-y-auto flex flex-col">
      {/* Profile Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl">
            👤
          </div>
          <div>
            <h3 className="font-bold text-sm">{firstName}</h3>
            <p className="text-xs text-muted-foreground">
              {isDriver && "Conductor ⭐ 4.9"}
              {isPassenger && "Pasajero"}
              {isAdmin && "Administrador"}
            </p>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2 text-sm font-semibold">
        <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">
          VP
        </div>
        <span>VamosPues</span>
      </div>

      {/* Dynamic Menu */}
      {error ? (
        <div className="text-xs text-red-600">{error}</div>
      ) : menuItems.length > 0 ? (
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = iconMap[item.url] || MapPin
            return (
              <Link
                key={item.id}
                href={item.url}
                className="block"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm hover:bg-accent"
                  title={item.nombre}
                >
                  <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{item.nombre}</span>
                </Button>
              </Link>
            )
          })}
        </nav>
      ) : (
        <div className="text-xs text-muted-foreground">No hay menú disponible</div>
      )}

      {/* Wallet Section - Solo para Pasajero y Conductor */}
      {(isDriver || isPassenger) && (
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
      )}

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Cerrar sesión
      </Button>
    </div>
  )
}
