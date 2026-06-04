"use client"

import React, { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Star, Plus } from "lucide-react"
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api"
import { apiClient } from "@/lib/api-client"
import { API_ENDPOINTS } from "@/lib/api-constants"
import RatingModal from "../rating-modal"
import CreateRouteForm from "./driver/create-route-form"
import ViewRoutesMap from "./passenger/view-routes-map"
import { VehiclesList } from "./driver/vehicles-list"
import { DriverTravelHistory } from "./driver/driver-travel-history"
import { DriverWallet } from "./driver/driver-wallet"
import { DriverProfile } from "./driver/driver-profile"
import { DriverSettings } from "./driver/driver-settings"

interface DashboardContentProps {
  userType?: "passenger" | "driver" | "admin"
}

interface MeetingPoint {
  id?: number
  lat: number
  lng: number
  order: number
  label?: string
  name?: string
}

interface RouteSearchResult {
  id: number
  departure: string
  availableSeats: number
  totalSeats: number
  price: number
  distance: number
  driverName: string
  vehiclePlate: string
  driverRating?: number
  status: string
  meetingPoints?: MeetingPoint[]
}

interface SolicitudItem {
  id: number
  routeId: number
  departure: string
  amount: number
  paymentMethod: string
  status: string
  requestedAt: string
  passenger?: string
  routeStatus?: string
  driverDocument?: string
  passengerDocument?: string
  driverName?: string
  // Flag local to UI indicating current user already left a rating for this solicitud
  calificadoPorMi?: boolean
}

interface PassengerDashboardStats {
  wallet: number
  rating: number
  completedTrips: number
  acceptedRequests: number
  pendingRequests: number
  totalRequests: number
  totalSpent: number
  acceptanceRate: number
}

interface DriverDashboardStats {
  wallet: number
  rating: number
  activeRoutes: number
  pendingRequests: number
  acceptedRequests: number
  totalEarned: number
}

interface WalletTransaction {
  id: number
  tipoNombre: string
  monto: number
  saldoResultante: number
  fecha: string
}

type PaymentMethod = 'CARTERA_VIRTUAL' | 'EFECTIVO'

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'CARTERA_VIRTUAL', label: 'Cartera virtual (ficticia)' },
  { value: 'EFECTIVO', label: 'Pago en efectivo al conductor' },
]

const POLITECNICO_DEFAULT = {
  label: 'Politécnico Colombiano Jaime Isaza Cadavid',
  lat: 6.212873948557249,
  lng: -75.57651331490655,
}

// Keep libraries as a static constant to avoid re-creating the array on each render
const GOOGLE_MAPS_LIBRARIES: any = ['places']

export function DashboardContent({ userType = "passenger" }: DashboardContentProps) {
  const isDriver = userType === "driver"
  const isAdmin = userType === "admin"

  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [dashboardUser, setDashboardUser] = useState<{ nombres: string; id_perfil: number; documento?: string } | null>(null)
  const [searchResults, setSearchResults] = useState<RouteSearchResult[]>([])
  const [driverRoutes, setDriverRoutes] = useState<RouteSearchResult[]>([])
  const [passengerStats, setPassengerStats] = useState<PassengerDashboardStats | null>(null)
  const [driverStats, setDriverStats] = useState<DriverDashboardStats | null>(null)
  const [ratingModalOpen, setRatingModalOpen] = useState(false)
  const [selectedRatingRequest, setSelectedRatingRequest] = useState<SolicitudItem | null>(null)
  const [ratingRole, setRatingRole] = useState<'PASAJERO' | 'CONDUCTOR' | null>(null)
  const [ratingTargetDocument, setRatingTargetDocument] = useState<string | null>(null)
  const [ratingTargetName, setRatingTargetName] = useState('')
  const [ratingLoading, setRatingLoading] = useState(false)
  const [ratingMessage, setRatingMessage] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [routeLoading, setRouteLoading] = useState(false)

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const passengerSection = searchParams.get('section') ?? 'buscar'
  const validPassengerSections = ['buscar', 'viajes', 'cartera', 'carrera', 'perfil', 'configuracion']
  const passengerTabValue = validPassengerSections.includes(passengerSection) ? passengerSection : 'buscar'
  const driverSection = searchParams.get('section') ?? 'driver-my-routes'
  
  const adminSection = searchParams.get('section') ?? 'usuarios'
  const validAdminSections = ['usuarios', 'vehiculos', 'rutas', 'solicitudes', 'catalogs', 'reportes', 'configuracion']
  const adminTabValue = validAdminSections.includes(adminSection) ? adminSection : 'usuarios'

  const handlePassengerTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', value)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleAdminTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', value)
    router.replace(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    if (isDriver && driverSection) {
      const element = document.getElementById(driverSection)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [driverSection, isDriver])
  const [routeSaving, setRouteSaving] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [requestMessage, setRequestMessage] = useState("")
  const [departureDate, setDepartureDate] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [myRequests, setMyRequests] = useState<SolicitudItem[]>([])
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [walletHistory, setWalletHistory] = useState<WalletTransaction[]>([])
  const [walletReloadAmount, setWalletReloadAmount] = useState<number>(0)
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletHistoryLoading, setWalletHistoryLoading] = useState(false)
  const [walletReloading, setWalletReloading] = useState(false)
  const [walletMessage, setWalletMessage] = useState("")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CARTERA_VIRTUAL')
  const [driverRequests, setDriverRequests] = useState<SolicitudItem[]>([])
  const [ratingSummary, setRatingSummary] = useState<{
    promedio: number
    totalCalificaciones: number
    minimo: number | null
    maximo: number | null
    calificaciones: Array<{ id: number; calificador: string; puntaje: number; comentario: string; rol: string; fecha: string }>
  } | null>(null)
  const [ratingStats, setRatingStats] = useState<{
    totalCalificaciones: number
    promediaGeneral: number
    porRol: Record<string, { cantidad: number; promedio: number; minimo: number | null; maximo: number | null }>
  } | null>(null)
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestActionLoading, setRequestActionLoading] = useState<number | null>(null)
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false)
  const [deleteAccountMessage, setDeleteAccountMessage] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState<'ALL' | 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA'>('ALL')
  const [routeStatusFilter, setRouteStatusFilter] = useState<'ALL' | 'ACTIVA' | 'COMPLETADA'>('ALL')
  const [fromDateFilter, setFromDateFilter] = useState('')
  const [toDateFilter, setToDateFilter] = useState('')
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null)
  const [isCreatingRoute, setIsCreatingRoute] = useState(false)
  const [activeMapTarget, setActiveMapTarget] = useState<'origin' | 'destination' | `meeting-${number}` | null>(null)
  const [newRouteData, setNewRouteData] = useState({
    originLabel: POLITECNICO_DEFAULT.label,
    originLat: POLITECNICO_DEFAULT.lat,
    originLng: POLITECNICO_DEFAULT.lng,
    destinationLabel: POLITECNICO_DEFAULT.label,
    destinationLat: POLITECNICO_DEFAULT.lat,
    destinationLng: POLITECNICO_DEFAULT.lng,
    departure: '',
    availableSeats: 1,
    price: 0,
    meetingPoints: [
      {
        label: 'Punto de encuentro inicial',
        lat: POLITECNICO_DEFAULT.lat,
        lng: POLITECNICO_DEFAULT.lng,
      },
    ],
  })

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES as any,
  })

  const mapContainerStyle = { width: '100%', height: '100%' }
  const mapCenter = {
    lat: newRouteData.originLat,
    lng: newRouteData.originLng,
  }

  // Return the current user's solicitud for a given route, if any (excluding canceled)
  const getMyRequestForRoute = (routeId: number) => {
    return myRequests.find(r => r.routeId === routeId && (r.status ?? '').toUpperCase() !== 'CANCELADA')
  }

  const searchRoutes = async () => {
    setSearchLoading(true)
    setSearchError("")
    setRequestMessage("")

    try {
      const params: Record<string, string> = {}
      if (origin) params.origin = origin
      if (destination) params.destination = destination
      if (departureDate) params.date = departureDate
      if (departureTime) params.time = departureTime
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice

      const response = await apiClient.get<RouteSearchResult[]>(API_ENDPOINTS.SEARCH_ROUTES, params)
      setSearchResults(response.data ?? [])
    } catch (error: any) {
      setSearchError(error.message || "No se pudo cargar las rutas")
    } finally {
      setSearchLoading(false)
    }
  }

  const requestRoute = async (routeId: number, amount: number) => {
    setRequestMessage("")

    // Validar fondos localmente si usa cartera virtual
    if (selectedPaymentMethod === 'CARTERA_VIRTUAL' && walletBalance !== null && walletBalance < amount) {
      setRequestMessage(`❌ Saldo insuficiente. Necesitas $${amount} pero tienes $${walletBalance}. Recarga tu cartera.`)
      return
    }

    try {
      const response = await apiClient.post(API_ENDPOINTS.CREATE_SOLICITUD(routeId), {
        paymentMethod: selectedPaymentMethod,
        amount,
      })

      setRequestMessage(`✅ ${response.message || "Solicitud enviada correctamente. Espera la respuesta del conductor."}`)
      await loadMyRequests()
    } catch (error: any) {
      // Manejo específico de errores
      const status = error?.response?.status
      const message = error.message || "No se pudo enviar la solicitud"
      
      if (message.includes('Saldo insuficiente')) {
        setRequestMessage(`❌ Fondos insuficientes en tu cartera. Recargue saldo para poder solicitar esta ruta.`)
      } else if (message.includes('solicitud activa')) {
        setRequestMessage(`⚠️ Ya existe una solicitud activa para esta ruta. Cancela la anterior si deseas solicitar nuevamente.`)
      } else if (message.includes('no está activa')) {
        setRequestMessage(`❌ Esta ruta ya no está disponible.`)
      } else {
        setRequestMessage(`❌ ${message}`)
      }
    }
  }

  const cancelSolicitud = async (solicitudId: number) => {
    setRequestMessage('')
    setRequestActionLoading(solicitudId)
    
    try {
      const response = await apiClient.post<{ id: number; status: string }>(API_ENDPOINTS.CANCEL_SOLICITUD(solicitudId), {})
      setRequestMessage(`✅ ${response.message || 'Solicitud cancelada correctamente'}`)
      // Actualizar estado local inmediatamente
      setMyRequests(prev => prev.map(r => r.id === solicitudId ? { ...r, status: 'CANCELADA' } : r))
      // Recargar datos del servidor después de 1 segundo
      setTimeout(() => loadMyRequests(), 1000)
    } catch (error: any) {
      const message = error.message || 'No se pudo cancelar la solicitud'
      
      if (message.includes('en curso') || message.includes('completada')) {
        setRequestMessage(`❌ No puedes cancelar una solicitud que ya está en curso o completada.`)
      } else if (message.includes('pendiente')) {
        setRequestMessage(`❌ Solo se pueden cancelar solicitudes pendientes.`)
      } else {
        setRequestMessage(`❌ ${message}`)
      }
    } finally {
      setRequestActionLoading(null)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible.')) {
      return
    }

    if (!confirm('⚠️ ADVERTENCIA: Se perderán todos tus datos. ¿Deseas continuar?')) {
      return
    }

    setDeleteAccountLoading(true)
    setDeleteAccountMessage('')

    try {
      // Llamar al endpoint para eliminar la cuenta
      const response = await apiClient.post(API_ENDPOINTS.DELETE_ACCOUNT, {})
      setDeleteAccountMessage('✅ ' + (response.message || 'Cuenta eliminada correctamente'))
      
      // Limpiar localStorage y redirigir al login después de 2 segundos
      setTimeout(() => {
        localStorage.removeItem('currentUser')
        localStorage.removeItem('rolActivo')
        localStorage.removeItem('perfilNombre')
        localStorage.removeItem('usuario')
        localStorage.removeItem('perfiles')
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      setDeleteAccountMessage('❌ ' + (error.message || 'No se pudo eliminar la cuenta'))
    } finally {
      setDeleteAccountLoading(false)
    }
  }

  const openRatingModal = (request: SolicitudItem, role: 'PASAJERO' | 'CONDUCTOR') => {
    setSelectedRatingRequest(request)
    setRatingMessage('')
    setRatingRole(role)
    setRatingModalOpen(true)

    if (role === 'PASAJERO') {
      setRatingTargetDocument(request.driverDocument ?? null)
      setRatingTargetName(request.driverName ?? 'Conductor')
      if (!request.driverDocument) {
        setRatingMessage('No se encontró el documento del conductor para la calificación.')
      }
    } else {
      // Cuando conductor califica pasajero
      setRatingTargetDocument(request.passengerDocument ?? null)
      setRatingTargetName(request.passenger ?? 'Pasajero')
      if (!request.passengerDocument) {
        setRatingMessage('No se encontró el documento del pasajero para la calificación.')
      }
      // Cargar datos de calificación del pasajero para mostrar historial
      if (request.passengerDocument) {
        loadRatingData(request.passengerDocument)
      }
    }
  }

  const closeRatingModal = () => {
    setSelectedRatingRequest(null)
    setRatingRole(null)
    setRatingTargetDocument(null)
    setRatingTargetName('')
    setRatingModalOpen(false)
  }

  const loadRatingData = async (documento?: string) => {
    if (!documento) {
      return
    }

    setRatingsLoading(true)
    try {
      const [summaryResponse, statsResponse] = await Promise.all([
        apiClient.get<{
          promedio: number
          totalCalificaciones: number
          minimo: number | null
          maximo: number | null
          calificaciones: Array<{ id: number; calificador: string; puntaje: number; comentario: string; rol: string; fecha: string }>
        }>(API_ENDPOINTS.USER_RATINGS(documento)),
        apiClient.get<{
          totalCalificaciones: number
          promediaGeneral: number
          porRol: Record<string, { cantidad: number; promedio: number; minimo: number | null; maximo: number | null }>
        }>(API_ENDPOINTS.USER_RATING_STATS(documento)),
      ])

      setRatingSummary(summaryResponse.data ?? null)
      setRatingStats(statsResponse.data ?? null)
    } catch (error) {
      console.error('Error cargando calificaciones:', error)
      setRatingSummary(null)
      setRatingStats(null)
    } finally {
      setRatingsLoading(false)
    }
  }

  const submitRating = async (rating: number, comment: string) => {
    if (!selectedRatingRequest || !dashboardUser?.documento || !ratingRole || !ratingTargetDocument) {
      setRatingMessage('No hay información suficiente para enviar la calificación')
      return
    }

    setRatingLoading(true)
    setRatingMessage('')

    try {
      const response = await apiClient.post(API_ENDPOINTS.CREATE_CALIFICACION, {
        solId: selectedRatingRequest.id,
        rutId: selectedRatingRequest.routeId,
        documentoCalificador: dashboardUser.documento,
        documentoCalificado: ratingTargetDocument,
        puntaje: rating,
        comentario: comment || null,
        rolCalificador: ratingRole,
      })

      setRatingMessage(`✅ ${response.message || 'Calificación enviada correctamente'}`)
      
      // Optimistically mark the solicitud as calificada by current user
      setMyRequests(prev => prev.map(r => r.id === selectedRatingRequest.id ? { ...r, calificadoPorMi: true } : r))
      setDriverRequests(prev => prev.map(r => r.id === selectedRatingRequest.id ? { ...r, calificadoPorMi: true } : r))
      
      // Cerrar modal después de 500ms para que se vea el mensaje
      setTimeout(() => {
        closeRatingModal()
      }, 500)

      // Refresh requests depending on current role
      if (isDriver) {
        await loadDriverRequests()
        await loadDriverDashboard()
      } else {
        await loadMyRequests()
        await loadPassengerDashboard()
      }
      await loadRatingData(dashboardUser.documento)
    } catch (error: any) {
      const errorMsg = error.message || 'No se pudo enviar la calificación'
      setRatingMessage(errorMsg)
    } finally {
      setRatingLoading(false)
    }
  }

  const loadMyRequests = async (filters?: { status?: string; routeStatus?: string; fromDate?: string; toDate?: string }) => {
    setRequestsLoading(true)
    try {
      const params: Record<string, string> = {}

      if (filters?.status && filters.status !== 'ALL') {
        params.status = filters.status
      }
      if (filters?.routeStatus && filters.routeStatus !== 'ALL') {
        params.routeStatus = filters.routeStatus
      }
      if (filters?.fromDate) {
        params.fromDate = filters.fromDate
      }
      if (filters?.toDate) {
        params.toDate = filters.toDate
      }

      const response = await apiClient.get<SolicitudItem[]>(API_ENDPOINTS.MY_SOLICITUDES, params)
      setMyRequests(response.data ?? [])
    } catch (error) {
      console.error('Error cargando solicitudes:', error)
      setMyRequests([])
    } finally {
      setRequestsLoading(false)
    }
  }

  const applyRequestFilters = async () => {
    await loadMyRequests({
      status: requestStatusFilter,
      routeStatus: routeStatusFilter,
      fromDate: fromDateFilter,
      toDate: toDateFilter,
    })
  }

  const clearRequestFilters = async () => {
    setRequestStatusFilter('ALL')
    setRouteStatusFilter('ALL')
    setFromDateFilter('')
    setToDateFilter('')
    await loadMyRequests()
  }

  const toggleRequestDetails = (requestId: number) => {
    setExpandedRequestId(prev => prev === requestId ? null : requestId)
  }

  const loadDriverRequests = async () => {
    setRequestsLoading(true)
    try {
      const response = await apiClient.get<SolicitudItem[]>(API_ENDPOINTS.DRIVER_SOLICITUDES)
      setDriverRequests(response.data ?? [])
    } catch (error) {
      console.error('Error cargando solicitudes de conductor:', error)
      setDriverRequests([])
    } finally {
      setRequestsLoading(false)
    }
  }

  const handleSolicitudAction = async (solicitudId: number, action: 'aceptar' | 'rechazar') => {
    setRequestActionLoading(solicitudId)
    setRequestMessage('')

    try {
      const endpoint = action === 'aceptar'
        ? API_ENDPOINTS.ACCEPT_SOLICITUD(solicitudId)
        : API_ENDPOINTS.REJECT_SOLICITUD(solicitudId)

      const response = await apiClient.post<{ id: number; status: string }>(endpoint, {})
      
      const successMsg = action === 'aceptar' 
        ? `✅ Solicitud aceptada. El pasajero verá tu confirmación.`
        : `✅ Solicitud rechazada correctamente.`
      
      setRequestMessage(successMsg)
      await loadDriverRequests()
      await loadDriverDashboard()
      await loadDriverRoutes()
    } catch (error: any) {
      const message = error.message || 'No se pudo actualizar la solicitud'
      
      // Manejo específico de errores
      if (message.includes('No hay cupos')) {
        setRequestMessage(`❌ ¡Lo siento! Ya no hay cupos disponibles en esta ruta (otro conductor acaba de aceptar el último).`)
      } else if (message.includes('No tienes permiso')) {
        setRequestMessage(`❌ No tienes permiso para gestionar esta solicitud.`)
      } else if (message.includes('pendientes')) {
        setRequestMessage(`❌ Solo puedes gestionar solicitudes pendientes.`)
      } else {
        setRequestMessage(`❌ ${message}`)
      }
    } finally {
      setRequestActionLoading(null)
    }
  }

  const loadDriverRoutes = async () => {
    setRouteLoading(true)
    try {
      const response = await apiClient.get<RouteSearchResult[]>(API_ENDPOINTS.DRIVER_ROUTES)
      setDriverRoutes(response.data ?? [])
    } catch (error) {
      console.error('Error cargando rutas del conductor:', error)
      setDriverRoutes([])
    } finally {
      setRouteLoading(false)
    }
  }

  const loadPassengerDashboard = async () => {
    setDashboardLoading(true)
    try {
      const response = await apiClient.get<PassengerDashboardStats>(API_ENDPOINTS.PASSENGER_DASHBOARD)
      setPassengerStats(response.data ?? null)
    } catch (error) {
      console.error('Error cargando dashboard de pasajero:', error)
      setPassengerStats(null)
    } finally {
      setDashboardLoading(false)
    }
  }

  const loadDriverDashboard = async () => {
    setDashboardLoading(true)
    try {
      const response = await apiClient.get<DriverDashboardStats>(API_ENDPOINTS.DRIVER_DASHBOARD)
      setDriverStats(response.data ?? null)
    } catch (error) {
      console.error('Error cargando dashboard de conductor:', error)
      setDriverStats(null)
    } finally {
      setDashboardLoading(false)
    }
  }

  const loadWalletBalance = async () => {
    setWalletLoading(true)
    try {
      const response = await apiClient.get<{ saldo: number }>(API_ENDPOINTS.WALLET_SALDO)
      const saldo = response.data?.saldo ?? (response as any).saldo ?? 0
      setWalletBalance(saldo)
    } catch (error) {
      console.error('Error cargando saldo de cartera:', error)
      setWalletBalance(null)
    } finally {
      setWalletLoading(false)
    }
  }

  const loadWalletHistory = async () => {
    setWalletHistoryLoading(true)
    try {
      const response = await apiClient.get<{ historial: WalletTransaction[] }>(API_ENDPOINTS.WALLET_HISTORIAL)
      const historial = response.data?.historial ?? (response as any).historial ?? []
      setWalletHistory(historial)
    } catch (error) {
      console.error('Error cargando historial de cartera:', error)
      setWalletHistory([])
    } finally {
      setWalletHistoryLoading(false)
    }
  }

  const reloadWallet = async () => {
    setWalletMessage('')
    if (walletReloadAmount <= 0) {
      setWalletMessage('Ingresa un monto válido para recargar')
      return
    }

    setWalletReloading(true)
    try {
      const response = await apiClient.post<{ saldo: number }>(API_ENDPOINTS.WALLET_RECARGA, {
        monto: walletReloadAmount,
      })
      const saldo = response.data?.saldo ?? (response as any).data?.saldo ?? (response as any).saldo ?? 0
      setWalletBalance(saldo)
      setWalletMessage(response.message || 'Recarga ficticia realizada con éxito')
      setWalletReloadAmount(0)
      await loadWalletHistory()
    } catch (error: any) {
      setWalletMessage(error.message || 'No se pudo recargar la cartera')
    } finally {
      setWalletReloading(false)
    }
  }

  const resetNewRouteForm = () => {
    setNewRouteData({
      originLabel: POLITECNICO_DEFAULT.label,
      originLat: POLITECNICO_DEFAULT.lat,
      originLng: POLITECNICO_DEFAULT.lng,
      destinationLabel: POLITECNICO_DEFAULT.label,
      destinationLat: POLITECNICO_DEFAULT.lat,
      destinationLng: POLITECNICO_DEFAULT.lng,
      departure: '',
      availableSeats: 1,
      price: 0,
      meetingPoints: [
        {
          label: 'Punto de encuentro inicial',
          lat: POLITECNICO_DEFAULT.lat,
          lng: POLITECNICO_DEFAULT.lng,
        },
      ],
    })
    setIsCreatingRoute(false)
  }

  const handleNewRouteChange = (field: string, value: string | number) => {
    setNewRouteData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddMeetingPoint = () => {
    setNewRouteData((prev) => ({
      ...prev,
      meetingPoints: [
        ...prev.meetingPoints,
        {
          label: `Punto de encuentro ${prev.meetingPoints.length + 1}`,
          lat: POLITECNICO_DEFAULT.lat,
          lng: POLITECNICO_DEFAULT.lng,
        },
      ],
    }))
    setActiveMapTarget(`meeting-${newRouteData.meetingPoints.length}`)
  }

  const handleSelectMapTarget = (target: 'origin' | 'destination' | `meeting-${number}`) => {
    setActiveMapTarget(target)
  }

  const handleMapClick = (event: any) => {
    if (!event.latLng) {
      return
    }

    const clickedLat = event.latLng.lat()
    const clickedLng = event.latLng.lng()

    if (activeMapTarget === 'origin') {
      setNewRouteData((prev) => ({
        ...prev,
        originLabel: 'Origen seleccionado en el mapa',
        originLat: clickedLat,
        originLng: clickedLng,
      }))
      return
    }

    if (activeMapTarget === 'destination') {
      setNewRouteData((prev) => ({
        ...prev,
        destinationLabel: 'Destino seleccionado en el mapa',
        destinationLat: clickedLat,
        destinationLng: clickedLng,
      }))
      return
    }

    if (activeMapTarget?.startsWith('meeting-')) {
      const index = Number(activeMapTarget.split('-')[1])
      setNewRouteData((prev) => ({
        ...prev,
        meetingPoints: prev.meetingPoints.map((point, idx) =>
          idx === index ? { ...point, lat: clickedLat, lng: clickedLng } : point
        ),
      }))
    }
  }

  const handleStartCreateRoute = () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      alert('⚠️ Falta configurar NEXT_PUBLIC_GOOGLE_MAPS_API_KEY\n\nCrea o edita el archivo "frontend/.env.local" con:\nNEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_clave_aqui\n\nLuego reinicia el servidor (npm run dev)')
      return
    }

    // Clear any previous messages and open the create route form
    setRequestMessage('')
    setIsCreatingRoute(true)
    setActiveMapTarget('origin')
  }

  const handleCancelCreateRoute = () => {
    resetNewRouteForm()
  }

  const handleRouteCreated = (routeId: number) => {
    setIsCreatingRoute(false)
    resetNewRouteForm()
    // Reload routes to show the new one
    window.location.reload()
  }

  const handleSaveRoute = async () => {
    setRouteSaving(true)
    setRequestMessage('')

    try {
      const response = await apiClient.post(API_ENDPOINTS.CREATE_ROUTE, {
        originLabel: newRouteData.originLabel,
        originLat: newRouteData.originLat,
        originLng: newRouteData.originLng,
        destinationLabel: newRouteData.destinationLabel,
        destinationLat: newRouteData.destinationLat,
        destinationLng: newRouteData.destinationLng,
        departure: newRouteData.departure,
        availableSeats: newRouteData.availableSeats,
        price: newRouteData.price,
        meetingPoints: newRouteData.meetingPoints.map((point, index) => ({
          label: point.label,
          lat: point.lat,
          lng: point.lng,
          order: index + 1,
        })),
      })

      setRequestMessage(response.message || 'Ruta creada correctamente')
      resetNewRouteForm()
      await loadDriverRoutes()
      await loadDriverDashboard()
    } catch (error: any) {
      setRequestMessage(error.message || 'No se pudo guardar la ruta')
    } finally {
      setRouteSaving(false)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentUser')
      if (stored) {
        try {
          setDashboardUser(JSON.parse(stored))
        } catch (err) {
          console.error('Error parsing currentUser', err)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (isDriver) {
      loadDriverRequests()
      loadDriverRoutes()
      loadDriverDashboard()
      loadWalletBalance()
      loadWalletHistory()
    }

    if (!isDriver && !isAdmin) {
      searchRoutes()
      loadMyRequests()
      loadPassengerDashboard()
      loadWalletBalance()
      loadWalletHistory()
    }
  }, [isDriver, isAdmin])

  useEffect(() => {
    if (dashboardUser?.documento) {
      loadRatingData(dashboardUser.documento)
    }
  }, [dashboardUser])

  useEffect(() => {
    if (ratingModalOpen) {
      try {
        // eslint-disable-next-line no-alert
        alert('debug: ratingModalOpen is true (useEffect)')
      } catch (e) {
        // ignore
      }
    }
  }, [ratingModalOpen])

  const ratingModalElement = (
    <RatingModal
      isOpen={ratingModalOpen}
      onClose={closeRatingModal}
      onSubmit={submitRating}
      targetName={ratingTargetName || selectedRatingRequest?.driverName || selectedRatingRequest?.passenger || 'Usuario'}
      role={ratingRole ?? 'PASAJERO'}
      loading={ratingLoading}
    />
  )

  const ratingMessageElement = ratingMessage ? (
    <div className="fixed bottom-4 right-4 rounded-xl bg-white border border-slate-200 shadow-lg p-4">
      <p className="text-sm text-slate-900">{ratingMessage}</p>
    </div>
  ) : null

  // Admin Dashboard
  if (isAdmin) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-muted-foreground">Gestión central de VamosPues</p>
          </div>
        </div>
      
      {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Total Usuarios</p>
              <p className="text-3xl font-bold">1,234</p>
              <p className="text-xs text-muted-foreground">+12% desde el mes anterior</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Viajes Activos</p>
              <p className="text-3xl font-bold">87</p>
              <p className="text-xs text-muted-foreground">En progreso</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Ingresos Total</p>
              <p className="text-3xl font-bold text-green-600">$45.2k</p>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Solicitudes Pendientes</p>
              <p className="text-3xl font-bold text-orange-600">23</p>
              <p className="text-xs text-muted-foreground">Requieren revisión</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs value={adminTabValue} onValueChange={handleAdminTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
            <TabsTrigger value="rutas">Rutas</TabsTrigger>
            <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
            <TabsTrigger value="catalogs">Catálogos</TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
            <TabsTrigger value="configuracion">Configuración</TabsTrigger>
          </TabsList>

          {/* Usuarios Tab */}
          <TabsContent value="usuarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>Total: 1,234 usuarios registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input placeholder="Buscar por email o nombre..." className="flex-1" />
                    <Button className="bg-black text-white hover:bg-black/90">Buscar</Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha Registro</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Juan García</TableCell>
                        <TableCell>juan@example.com</TableCell>
                        <TableCell><Badge>Conductor</Badge></TableCell>
                        <TableCell>2024-05-10</TableCell>
                        <TableCell><Badge variant="outline" className="bg-green-50">Activo</Badge></TableCell>
                        <TableCell><Button variant="ghost" size="sm">Ver →</Button></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>María López</TableCell>
                        <TableCell>maria@example.com</TableCell>
                        <TableCell><Badge variant="secondary">Pasajero</Badge></TableCell>
                        <TableCell>2024-05-12</TableCell>
                        <TableCell><Badge variant="outline" className="bg-green-50">Activo</Badge></TableCell>
                        <TableCell><Button variant="ghost" size="sm">Ver →</Button></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehiculos Tab */}
          <TabsContent value="vehiculos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Vehículos</CardTitle>
                <CardDescription>Total: 456 vehículos registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Registro</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>ABC-123</TableCell>
                      <TableCell>Toyota Corolla</TableCell>
                      <TableCell>Juan García</TableCell>
                      <TableCell><Badge className="bg-green-100 text-green-800">Activo</Badge></TableCell>
                      <TableCell>2024-05-10</TableCell>
                      <TableCell><Button variant="ghost" size="sm">Ver →</Button></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rutas Tab */}
          <TabsContent value="rutas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Rutas</CardTitle>
                <CardDescription>Total: 234 rutas activas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Funcionalidad de gestión de rutas en construcción</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Solicitudes Tab */}
          <TabsContent value="solicitudes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes Pendientes</CardTitle>
                <CardDescription>23 solicitudes requieren revisión</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Funcionalidad de solicitudes en construcción</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Catálogos Tab */}
          <TabsContent value="catalogs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Catálogos del Sistema</CardTitle>
                <CardDescription>Gestión de marcas, modelos, colores y otras categorías</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="marcas" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="marcas">Marcas</TabsTrigger>
                    <TabsTrigger value="modelos">Modelos</TabsTrigger>
                    <TabsTrigger value="colores">Colores</TabsTrigger>
                    <TabsTrigger value="estados">Estados</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="marcas" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Marcas de Vehículos</h3>
                      <Button className="bg-black text-white hover:bg-black/90"><Plus className="w-4 h-4 mr-2" /> Agregar</Button>
                    </div>
                    <p className="text-muted-foreground">Gestión de marcas en construcción</p>
                  </TabsContent>
                  
                  <TabsContent value="modelos" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Modelos de Vehículos</h3>
                      <Button className="bg-black text-white hover:bg-black/90"><Plus className="w-4 h-4 mr-2" /> Agregar</Button>
                    </div>
                    <p className="text-muted-foreground">Gestión de modelos en construcción</p>
                  </TabsContent>
                  
                  <TabsContent value="colores" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Colores</h3>
                      <Button className="bg-black text-white hover:bg-black/90"><Plus className="w-4 h-4 mr-2" /> Agregar</Button>
                    </div>
                    <p className="text-muted-foreground">Gestión de colores en construcción</p>
                  </TabsContent>
                  
                  <TabsContent value="estados" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Estados del Sistema</h3>
                      <Button className="bg-black text-white hover:bg-black/90"><Plus className="w-4 h-4 mr-2" /> Agregar</Button>
                    </div>
                    <p className="text-muted-foreground">Gestión de estados en construcción</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reportes Tab */}
          <TabsContent value="reportes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reportes y Análisis</CardTitle>
                <CardDescription>Datos de desempeño y estadísticas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Módulo de reportes en construcción</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuración Tab */}
          <TabsContent value="configuracion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Opciones de configuración en construcción</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  if (isDriver) {
    return (
      <div id="driver-dashboard" className="p-6 space-y-6">
        {/* Header with profile - ALWAYS VISIBLE */}
        <div id="driver-profile" className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{dashboardUser?.nombres || 'Conductor'}</h2>
              <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                <span>Conductor</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{driverStats?.rating?.toFixed(1) ?? '—'}</span>
                <span className="text-xs text-green-600">${driverStats?.wallet?.toFixed(0) ?? 0}</span>
                <span>{driverRoutes.length ? `${driverRoutes.length} rutas` : '— rutas'}</span>
              </p>
            </div>
          </div>
          {driverSection === 'driver-my-routes' && (
            <Button className="bg-black text-white hover:bg-black/90" onClick={handleStartCreateRoute}>
              <Plus className="w-4 h-4 mr-2" />
              Publicar nueva ruta
            </Button>
          )}
        </div>

        {isCreatingRoute && (
          <CreateRouteForm onRouteCreated={handleRouteCreated} onCancel={handleCancelCreateRoute} />
        )}

        {/* MIS RUTAS SECTION */}
        {driverSection === 'driver-my-routes' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">Rutas activas</p>
                  <p className="text-3xl font-bold">{driverStats?.activeRoutes ?? driverRoutes.filter((route) => route.status?.toUpperCase() === 'ACTIVA').length}</p>
                  <p className="text-xs text-muted-foreground">Rutas con cupos disponibles</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">Solicitudes pendientes</p>
                  <p className="text-3xl font-bold">{driverStats?.pendingRequests ?? driverRequests.filter((request) => request.status?.toUpperCase() === 'PENDIENTE').length}</p>
                  <p className="text-xs text-muted-foreground">Nuevas solicitudes por revisar</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">Saldo cartera</p>
                  <p className="text-3xl font-bold text-green-600">${driverStats?.wallet?.toFixed(0) ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Saldo disponible en tu cuenta</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-2">Ganancia del mes</p>
                  <p className="text-3xl font-bold text-green-600">${driverStats?.totalEarned?.toFixed(0) ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Ingresos por solicitudes aceptadas</p>
                </CardContent>
              </Card>
            </div>

            {/* Routes Grid */}
            <Card id="driver-my-routes">
              <CardHeader>
                <CardTitle>Rutas publicadas</CardTitle>
                <CardDescription>Rutas activas en tu perfil</CardDescription>
              </CardHeader>
              <CardContent>
                {routeLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando rutas...</p>
                ) : driverRoutes.length > 0 ? (
                  <div className="space-y-4">
                    {driverRoutes.map((route) => (
                      <Card key={route.id} className="border border-slate-200">
                        <CardContent className="pt-6">
                          <div className="flex flex-col gap-4">
                            {/* Encabezado de ruta */}
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-semibold text-lg">Ruta #{route.id}</p>
                                <p className="text-sm text-muted-foreground">
                                  📅 Salida: {route.departure}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  👥 Cupos: {route.availableSeats}/{route.totalSeats} · 💵 ${route.price}
                                </p>
                              </div>
                              <div className="text-right space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    route.status === 'ACTIVA' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {route.status}
                                  </span>
                                </p>
                                <p className="text-sm text-muted-foreground">🚗 {route.vehiclePlate}</p>
                                {route.status !== 'COMPLETADA' && (
                                  <Button
                                    className="w-full md:w-auto bg-red-600 text-white hover:bg-red-700 text-xs"
                                    onClick={async () => {
                                      if (!confirm('¿Deseas finalizar esta ruta? Esta acción marcará la ruta como COMPLETADA.')) return
                                      try {
                                        await apiClient.post(API_ENDPOINTS.FINALIZE_ROUTE(route.id))
                                        loadDriverRoutes()
                                      } catch (err) {
                                        console.error('Error finalizando ruta:', err)
                                        alert('No se pudo finalizar la ruta. Revisa la consola para más detalles.')
                                      }
                                    }}
                                  >
                                    Finalizar
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Ruta en línea */}
                            <div className="pt-3 border-t">
                              <p className="text-xs font-medium text-gray-600 mb-2">📍 Ruta:</p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-green-600 font-medium">Inicio</span>
                                <span className="text-gray-400">━━━━</span>
                                {route.meetingPoints && route.meetingPoints.length > 0 ? (
                                  <>
                                    {route.meetingPoints.map((point, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium text-xs">
                                          {idx + 1}
                                        </span>
                                        <span className="text-gray-400">━━━━</span>
                                      </div>
                                    ))}
                                  </>
                                ) : null}
                                <span className="text-red-600 font-medium">Fin</span>
                              </div>
                            </div>

                            {/* Puntos de encuentro detallados */}
                            {route.meetingPoints && route.meetingPoints.length > 0 && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-blue-900 mb-2">
                                  🚩 {route.meetingPoints.length} Punto{route.meetingPoints.length !== 1 ? 's' : ''} de Encuentro
                                </p>
                                <div className="space-y-2">
                                  {route.meetingPoints.map((point, idx) => (
                                    <div key={idx} className="text-xs bg-white border border-blue-100 rounded p-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                                          {idx + 1}
                                        </span>
                                        <span className="font-medium">{point.name || 'Sin nombre'}</span>
                                      </div>
                                      <p className="text-gray-600 ml-7">
                                        📌 {point.lat?.toFixed(4)}, {point.lng?.toFixed(4)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aún no tienes rutas publicadas. Crea una nueva ruta para comenzar a recibir solicitudes.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* SOLICITUDES SECTION */}
        {driverSection === 'driver-requests' && (
          <Card id="driver-requests" className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle>Solicitudes de pasajeros</CardTitle>
              <CardDescription>Gestiona las solicitudes de pasajeros para tus rutas</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {requestsLoading ? (
                <p className="text-sm text-muted-foreground">Cargando solicitudes...</p>
              ) : driverRequests.length > 0 ? (
                <div className="space-y-4">
                  {driverRequests.map((request) => (
                    <div key={request.id} className="rounded-lg border p-4 bg-white dark:bg-slate-950">
                      <p className="font-semibold">Solicitud #{request.id}</p>
                      <p className="text-sm text-muted-foreground">Ruta: {request.departure}</p>
                      <p className="text-sm text-muted-foreground">Pasajero: {request.passenger}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full border px-2 py-1">{request.paymentMethod}</span>
                        <span className="rounded-full border px-2 py-1">{request.status}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {request.status?.toUpperCase() === 'PENDIENTE' ? (
                          <>
                            <Button
                              variant="secondary"
                              className="bg-green-600 text-white hover:bg-green-700"
                              onClick={() => handleSolicitudAction(request.id, 'aceptar')}
                              disabled={requestActionLoading === request.id}
                            >
                              {requestActionLoading === request.id ? 'Procesando…' : 'Aceptar'}
                            </Button>
                            <Button
                              variant="secondary"
                              className="bg-red-600 text-white hover:bg-red-700"
                              onClick={() => handleSolicitudAction(request.id, 'rechazar')}
                              disabled={requestActionLoading === request.id}
                            >
                              {requestActionLoading === request.id ? 'Procesando…' : 'Rechazar'}
                            </Button>
                          </>
                        ) : null}

                        {request.status?.toUpperCase() === 'ACEPTADA' && request.routeStatus?.toUpperCase() === 'COMPLETADA' && !request.calificadoPorMi ? (
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => openRatingModal(request, 'CONDUCTOR')}
                          >
                            Calificar pasajero
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay solicitudes nuevas por el momento.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* MIS VEHICULOS SECTION */}
        {driverSection === 'driver-my-vehicles' && (
          <div id="driver-my-vehicles">
            <VehiclesList />
          </div>
        )}

        {/* HISTORIAL DE VIAJES SECTION */}
        {driverSection === 'driver-travel-history' && (
          <div id="driver-travel-history">
            <DriverTravelHistory />
          </div>
        )}

        {/* CARTERA SECTION */}
        {driverSection === 'driver-wallet' && (
          <div id="driver-wallet">
            <DriverWallet />
          </div>
        )}

        {/* MI PERFIL SECTION */}
        {driverSection === 'driver-profile' && (
          <div id="driver-profile">
            <DriverProfile />
          </div>
        )}

        {/* CONFIGURACION SECTION */}
        {driverSection === 'driver-settings' && (
          <div id="driver-settings">
            <DriverSettings />
          </div>
        )}

      {ratingModalElement}
      {ratingMessageElement}
    </div>
    )
  }

  // Passenger Dashboard
  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <Tabs value={passengerTabValue} onValueChange={handlePassengerTabChange} className="w-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Viajes realizados</p>
              <p className="text-3xl font-bold">{passengerStats?.completedTrips ?? 0}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Mi calificación</p>
              <p className="text-3xl font-bold flex items-center gap-2">
                {passengerStats?.rating?.toFixed(1) ?? '0.0'}
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Saldo cartera</p>
              <p className="text-3xl font-bold text-green-600">${passengerStats?.wallet?.toFixed(0) ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Buscar Tab */}
        <TabsContent value="buscar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buscar ruta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Origen</label>
                  <Input
                    placeholder="San Cristóbal, Belén..."
                    value={origin}
                    onChange={(event) => setOrigin(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Destino</label>
                  <Input
                    placeholder="Politécnico..."
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha</label>
                  <Input
                    type="date"
                    value={departureDate}
                    onChange={(event) => setDepartureDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hora</label>
                  <Input
                    type="time"
                    value={departureTime}
                    onChange={(event) => setDepartureTime(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio mínimo</label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="Desde"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio máximo</label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="Hasta"
                  />
                </div>
              </div>

              {requestMessage ? (
                <div className="rounded-lg bg-green-100 p-4 text-green-900">
                  {requestMessage}
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Forma de pago</label>
                  <select
                    value={selectedPaymentMethod}
                    onChange={(event) => setSelectedPaymentMethod(event.target.value as PaymentMethod)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Saldo disponible</p>
                  <p className="text-lg font-bold text-green-600">
                    {walletLoading ? 'Cargando...' : `$ ${walletBalance?.toFixed(0) ?? 0}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <Button
                  className="w-full md:w-auto bg-black text-white hover:bg-black/90"
                  onClick={searchRoutes}
                  disabled={searchLoading}
                >
                  {searchLoading ? 'Buscando...' : 'Buscar rutas'}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {searchResults.length} rutas encontradas
                </div>
              </div>

              {searchError ? (
                <div className="rounded-lg bg-red-100 p-4 text-red-900">
                  {searchError}
                </div>
              ) : null}

              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((route) => (
                    <Card key={route.id} className="border border-slate-200">
                      <CardContent>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-semibold">Ruta disponible</p>
                            <p className="text-sm text-muted-foreground">
                              Salida: {route.departure} · {route.distance} km · {route.availableSeats}/{route.totalSeats} cupos disponibles
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Conductor: {route.driverName} · Vehículo: {route.vehiclePlate}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Calificación conductor: {route.driverRating?.toFixed(1) ?? '—'} ★
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Puntos de encuentro: {route.meetingPoints?.length ?? 0}
                            </p>
                          </div>

                          <div className="space-y-2 text-right">
                            <p className="text-lg font-bold">${route.price}</p>
                            {(() => {
                              const existing = getMyRequestForRoute(route.id)
                              if (existing) {
                                // Show status and disable further requests for same route
                                return (
                                  <div className="flex flex-col items-end">
                                    <Button className="w-full md:w-auto bg-gray-200 text-gray-700" disabled>
                                      {existing.status?.toUpperCase() === 'PENDIENTE' ? 'Solicitud enviada' : existing.status}
                                    </Button>
                                    <a href="#mis-viajes" className="text-xs text-gray-500 mt-1">Ver en Mis viajes</a>
                                  </div>
                                )
                              }

                              return (
                                <Button
                                  className="w-full md:w-auto bg-black text-white hover:bg-black/90"
                                  onClick={() => requestRoute(route.id, route.price)}
                                  disabled={
                                    selectedPaymentMethod === 'CARTERA_VIRTUAL' &&
                                    walletBalance !== null &&
                                    walletBalance < route.price
                                  }
                                >
                                  Solicitar cupo
                                </Button>
                              )
                            })()}
                            {selectedPaymentMethod === 'CARTERA_VIRTUAL' && walletBalance !== null && walletBalance < route.price ? (
                              <p className="text-xs text-red-600">Saldo insuficiente para pagar con cartera virtual.</p>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  Usa el formulario para buscar rutas y ver resultados disponibles.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mis Viajes Tab */}
        <TabsContent value="viajes">
          <Card>
            <CardHeader>
              <CardTitle>Mis viajes</CardTitle>
              <CardDescription>Historial de solicitudes y viajes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                  <p className="text-sm text-muted-foreground">Calificación promedio</p>
                  <p className="text-3xl font-bold">
                    {ratingsLoading ? 'Cargando...' : ratingSummary?.promedio?.toFixed(1) ?? '--'}
                  </p>
                  <p className="text-xs text-muted-foreground">Sobre 5</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                  <p className="text-sm text-muted-foreground">Total de reseñas</p>
                  <p className="text-3xl font-bold">
                    {ratingsLoading ? '...' : ratingSummary?.totalCalificaciones ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Últimas 5 reseñas mostradas</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                  <p className="text-sm text-muted-foreground">Calificaciones por rol</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <p>Conductor: {ratingStats?.porRol?.PASAJERO?.promedio?.toFixed(1) ?? '--'}</p>
                    <p>Pasajero: {ratingStats?.porRol?.CONDUCTOR?.promedio?.toFixed(1) ?? '--'}</p>
                  </div>
                </div>
              </div>
              <Card className="mb-6 border border-slate-200">
                <CardHeader>
                  <CardTitle>Reseñas recientes</CardTitle>
                  <CardDescription>Comentarios anónimos de tus viajes</CardDescription>
                </CardHeader>
                <CardContent>
                  {ratingsLoading ? (
                    <p className="text-sm text-muted-foreground">Cargando reseñas...</p>
                  ) : ratingSummary?.calificaciones?.length ? (
                    <div className="space-y-4">
                      {ratingSummary.calificaciones.map((review) => (
                        <div key={review.id} className="rounded-lg border border-slate-200 p-4 bg-white">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm font-semibold">{review.rol === 'PASAJERO' ? 'Pasajero' : 'Conductor'}</p>
                            <p className="text-xs text-muted-foreground">{review.fecha}</p>
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-yellow-500">
                            {'★'.repeat(review.puntaje)}{'☆'.repeat(5 - review.puntaje)}
                          </div>
                          <p className="mt-3 text-sm text-slate-700">{review.comentario || 'Sin comentario'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aún no tienes reseñas. Califica viajes recientes para generarlas.</p>
                  )}
                </CardContent>
              </Card>
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Filtrar por estado de solicitud</label>
                  <select
                    value={requestStatusFilter}
                    onChange={(event) => setRequestStatusFilter(event.target.value as typeof requestStatusFilter)}
                    className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-900"
                  >
                    <option value="ALL">Todos</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="ACEPTADA">Aceptada</option>
                    <option value="RECHAZADA">Rechazada</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Filtrar por estado de ruta</label>
                  <select
                    value={routeStatusFilter}
                    onChange={(event) => setRouteStatusFilter(event.target.value as typeof routeStatusFilter)}
                    className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-900"
                  >
                    <option value="ALL">Todos</option>
                    <option value="ACTIVA">Activa</option>
                    <option value="COMPLETADA">Completada</option>
                  </select>
                </div>
                <div className="grid gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Desde</label>
                    <Input
                      type="date"
                      value={fromDateFilter}
                      onChange={(event) => setFromDateFilter(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Hasta</label>
                    <Input
                      type="date"
                      value={toDateFilter}
                      onChange={(event) => setToDateFilter(event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="text-sm text-muted-foreground">Aplica filtros para reducir el historial de tus solicitudes.</div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={applyRequestFilters}>
                    Aplicar filtros
                  </Button>
                  <Button variant="secondary" className="text-slate-900" onClick={clearRequestFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              </div>

              {requestsLoading ? (
                <p className="text-sm text-muted-foreground">Cargando solicitudes...</p>
              ) : myRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No se encontraron viajes con esos filtros o no has solicitado ningún viaje aún.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Solicitud</TableHead>
                      <TableHead>Ruta</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Solicitud</TableHead>
                      <TableHead>Ruta</TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myRequests.map((request) => (
                      <React.Fragment key={request.id}>
                        <TableRow>
                          <TableCell># {request.id}</TableCell>
                          <TableCell>{request.routeId}</TableCell>
                          <TableCell>{request.departure}</TableCell>
                          <TableCell>{request.driverName ?? '—'}</TableCell>
                          <TableCell>${request.amount}</TableCell>
                          <TableCell>{request.paymentMethod}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{request.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{request.routeStatus ?? '—'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <Button variant="outline" size="sm" onClick={() => toggleRequestDetails(request.id)}>
                                {expandedRequestId === request.id ? 'Ocultar' : 'Detalles'}
                              </Button>
                              {request.status?.toUpperCase() === 'ACEPTADA' && request.routeStatus === 'COMPLETADA' && !request.calificadoPorMi ? (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => openRatingModal(request, 'PASAJERO')}
                                >
                                  Calificar
                                </Button>
                              ) : request.status?.toUpperCase() === 'PENDIENTE' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => cancelSolicitud(request.id)}
                                  disabled={requestActionLoading === request.id}
                                >
                                  {requestActionLoading === request.id ? 'Cancelando...' : 'Cancelar'}
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRequestId === request.id ? (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-slate-50">
                              <div className="grid gap-3 md:grid-cols-3 py-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Fecha de solicitud</p>
                                  <p>{request.requestedAt ?? 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">ID ruta</p>
                                  <p>{request.routeId}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Método de pago</p>
                                  <p>{request.paymentMethod}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Rol del conductor</p>
                                  <p>{request.driverName ?? '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Estado de ruta</p>
                                  <p>{request.routeStatus ?? '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Pago</p>
                                  <p>${request.amount}</p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cartera Tab */}
        <TabsContent value="cartera">
          <Card>
            <CardHeader>
              <CardTitle>Cartera virtual</CardTitle>
              <CardDescription>Recargas ficticias y saldo disponible.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-muted-foreground">Saldo actual</p>
                  <p className="text-3xl font-bold text-green-600">
                    {walletLoading ? 'Cargando...' : `$ ${walletBalance?.toFixed(0) ?? 0}`}
                  </p>
                </div>
                <div className="md:col-span-2 rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-medium">Recargar saldo</p>
                  <p className="text-xs text-muted-foreground">Esto es una recarga ficticia: no hay un pago real ni pasarela integrada.</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Input
                      type="number"
                      min={1}
                      step={1000}
                      value={walletReloadAmount}
                      onChange={(event) => setWalletReloadAmount(Number(event.target.value))}
                      placeholder="Monto a recargar"
                    />
                    <Button
                      className="bg-black text-white hover:bg-black/90"
                      onClick={reloadWallet}
                      disabled={walletReloading || walletReloadAmount <= 0}
                    >
                      {walletReloading ? 'Recargando...' : 'Recargar saldo'}
                    </Button>
                  </div>
                  {walletMessage ? (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                      {walletMessage}
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Historial de recargas</h3>
                {walletHistoryLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando historial...</p>
                ) : walletHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {walletHistory.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{tx.id}</TableCell>
                          <TableCell>{tx.tipoNombre}</TableCell>
                          <TableCell>${tx.monto.toFixed(0)}</TableCell>
                          <TableCell>${tx.saldoResultante.toFixed(0)}</TableCell>
                          <TableCell>{new Date(tx.fecha).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay transacciones registradas.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carrera Tab */}
        <TabsContent value="carrera">
          <Card>
            <CardHeader>
              <CardTitle>Mi Carrera</CardTitle>
              <CardDescription>Resumen de viajes y solicitudes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Viajes completados</p>
                    <p className="text-2xl font-bold">{passengerStats?.completedTrips ?? 0}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Solicitudes aceptadas</p>
                    <p className="text-2xl font-bold">{passengerStats?.acceptedRequests ?? 0}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Calificación promedio</p>
                    <p className="text-2xl font-bold">{passengerStats?.rating?.toFixed(1) ?? '0.0'}★</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Solicitudes pendientes</p>
                    <p className="text-2xl font-bold">{passengerStats?.pendingRequests ?? 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Perfil Tab */}
        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Mi Perfil</CardTitle>
              <CardDescription>Información de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre</label>
                    <Input value={dashboardUser?.nombres || ''} placeholder="Tu nombre" disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Documento</label>
                    <Input value={dashboardUser?.documento || ''} placeholder="Documento" disabled className="bg-muted" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración Tab */}
        <TabsContent value="configuracion">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Cuenta</CardTitle>
              <CardDescription>Gestiona tu cuenta y privacidad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información de cuenta */}
              <div className="space-y-4 pb-6 border-b">
                <h3 className="text-lg font-semibold">Información de Cuenta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                    <p className="text-sm font-medium">{dashboardUser?.nombres || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Documento</label>
                    <p className="text-sm font-medium">{dashboardUser?.documento || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Zona de peligro */}
              <div className="space-y-4 pt-6 border-t border-red-200">
                <h3 className="text-lg font-semibold text-red-600">Zona de Peligro</h3>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Eliminar Cuenta</h4>
                  <p className="text-sm text-red-800 mb-4">
                    ⚠️ Esta acción es irreversible. Se eliminarán todos tus datos, rutas, solicitudes y transacciones.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteAccountLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteAccountLoading ? 'Eliminando...' : 'Eliminar mi cuenta'}
                  </Button>
                  {deleteAccountMessage && (
                    <div className="mt-3 rounded-lg bg-white p-3 text-sm">
                      {deleteAccountMessage}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {ratingModalElement}
      {ratingMessageElement}
    </div>
  )
}
