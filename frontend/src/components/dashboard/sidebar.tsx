"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, MapPin, Settings, LogOut, Truck, MessageSquare, History, Users, FileText, BarChart3, Loader2 } from "lucide-react"
import { RoleSwitcher } from "@/components/role-switcher"
import { apiClient } from "@/lib/api-client"
import { API_ENDPOINTS } from "@/lib/api-constants"

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
  const [perfiles, setPerfiles] = useState<any[]>([])
  const [rolActual, setRolActual] = useState<number | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Cargar usuario del localStorage
    const userStr = localStorage.getItem('currentUser')
    const perfilesStr = localStorage.getItem('perfiles')
    const rolActivoStr = localStorage.getItem('rolActivo')
    
    if (perfilesStr) {
      setPerfiles(JSON.parse(perfilesStr))
    }
    
    let rol = 1 // default to pasajero
    if (rolActivoStr) {
      rol = parseInt(rolActivoStr)
      setRolActual(rol)
    }
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as CurrentUser
        setCurrentUser(user)
        
        // Cargar menú dinámico usando el rol activo (rolActual)
        fetchMenu(rol)
        if (rol === 1 || rol === 2) {
          loadWalletBalance()
        }
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
      const response = await apiClient.get<{ menu: MenuItem[] }>(API_ENDPOINTS.MENU_BY_PROFILE(idPerfil))
      // El backend puede devolver la estructura { menu, total } directamente
      // o envolverla en { success, message, data: { menu } }.
      // Manejar ambas variantes de forma defensiva.
      const menuFromWrapped = response?.data?.menu
      const menuFromRaw = (response as any)?.menu
      setMenuItems(menuFromWrapped || menuFromRaw || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching menu:', err)
      setError('Error al cargar el menú')
    } finally {
      setLoading(false)
    }
  }

  const loadWalletBalance = async () => {
    try {
      const response = await apiClient.get<{ saldo: number }>(API_ENDPOINTS.WALLET_SALDO)
      const saldo = response.data?.saldo ?? (response as any).saldo ?? null
      setWalletBalance(saldo)
    } catch (err) {
      console.error('Error loading wallet balance:', err)
      setWalletBalance(null)
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

  const isDriver = rolActual === 2
  const isAdmin = rolActual === 3
  const isPassenger = rolActual === 1

  const normalizeMenuUrl = (url: string) => {
    const normalized = url.toLowerCase()
    if (isPassenger) {
      if (normalized.includes('/search') || normalized.includes('buscar')) return 'buscar'
      if (normalized.includes('/my-trips') || normalized.includes('viajes') || normalized.includes('mis-viajes')) return 'viajes'
      if (normalized.includes('/wallet') || normalized.includes('cartera')) return 'cartera'
      if (normalized.includes('/profile') || normalized.includes('perfil') || normalized.includes('/settings')) return 'perfil'
      if (normalized.includes('/carrera') || normalized.includes('resumen')) return 'carrera'
      // Peticiones/solicitudes del pasajero
      if (normalized.includes('/requests') || normalized.includes('solicitudes')) return 'viajes'
    }
    if (isDriver) {
      if (normalized.includes('/routes') || normalized.includes('rutas')) return 'driver-my-routes'
      if (normalized.includes('/requests') || normalized.includes('solicitudes')) return 'driver-requests'
      if (normalized.includes('/wallet') || normalized.includes('cartera')) return 'driver-wallet'
      if (normalized.includes('/profile') || normalized.includes('perfil')) return 'driver-profile'
      if (normalized.includes('/settings') || normalized.includes('configuracion')) return 'driver-settings'
      // Historial de viajes / mis rutas
      if (normalized.includes('/history') || normalized.includes('historial')) return 'driver-travel-history'
      // Vehículos asociados al conductor
      if (normalized.includes('/vehicles') || normalized.includes('vehiculos') || normalized.includes('/vehicle')) return 'driver-my-vehicles'
    }
    if (isAdmin) {
      if (normalized.includes('/catalogs') || normalized.includes('catalogo')) return 'catalogs'
      if (normalized.includes('/users') || normalized.includes('usuario')) return 'usuarios'
      if (normalized.includes('/vehicles') || normalized.includes('vehiculo')) return 'vehiculos'
      if (normalized.includes('/routes') || normalized.includes('ruta')) return 'rutas'
      if (normalized.includes('/reports') || normalized.includes('reporte')) return 'reportes'
      if (normalized.includes('/requests') || normalized.includes('solicitud')) return 'solicitudes'
      if (normalized.includes('/settings') || normalized.includes('configuracion')) return 'configuracion'
    }
    return null
  }

  const getDashboardBasePath = () => {
    if (isDriver) return '/dashboard/driver'
    if (isPassenger) return '/dashboard/passenger'
    if (isAdmin) return '/dashboard/admin'
    return '/dashboard'
  }

  const handleMenuClick = (item: MenuItem) => {
    const section = normalizeMenuUrl(item.url)
    if (section) {
      router.replace(`${getDashboardBasePath()}?section=${section}`)
      return
    }

    // Fallback: use the menu url only when it points to an actual route under /dashboard
    if (item.url.startsWith('/dashboard')) {
      router.replace(item.url)
      return
    }

    console.warn('Menú no mapeado:', item.url)
  }

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
              {isDriver && "Conductor"}
              {isPassenger && "Pasajero"}
              {isAdmin && "Administrador"}
            </p>
          </div>
        </div>
        
        {/* Role Switcher */}
        {perfiles && perfiles.length > 1 && rolActual && (
          <div className="pt-2 border-t">
            <RoleSwitcher perfiles={perfiles} rolActual={rolActual} />
          </div>
        )}
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
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start text-sm hover:bg-accent"
                title={item.nombre}
                onClick={() => handleMenuClick(item)}
              >
                <Icon className="w-4 h-4 mr-2 shrink-0" />
                <span className="truncate">{item.nombre}</span>
              </Button>
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
            <p className="text-2xl font-bold">
              {walletBalance === null ? 'Cargando...' : `$ ${walletBalance.toFixed(0)} COP`}
            </p>
          </div>
          <Button variant="outline" className="w-full" size="sm" onClick={loadWalletBalance}>
            <Wallet className="w-4 h-4 mr-2" />
            Actualizar saldo
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
