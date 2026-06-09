"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import { API_ENDPOINTS } from "@/lib/api-constants"
import { Loader2, AlertCircle, MapPin, Clock, DollarSign } from "lucide-react"

interface TravelHistory {
  id: number
  rol: string
  fecha_viaje: string
  ruta_id: number
  ruta_info?: {
    salida: string
    destino: string
    hora_salida: string
    precio: number
    distancia: number
    nombre_conductor?: string
    nombre_pasajero?: string
  }
  calificacion?: number
  comentario?: string
}

export function DriverTravelHistory() {
  const [history, setHistory] = useState<TravelHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filterRole, setFilterRole] = useState<"TODOS" | "CONDUCTOR" | "PASAJERO">("TODOS")

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError("")
        
        const response = await apiClient.get<TravelHistory[]>(
          API_ENDPOINTS.GET_TRAVEL_HISTORY
        )
        
        console.log('[DRIVER-TRAVEL-HISTORY] Full response:', response)
        console.log('[DRIVER-TRAVEL-HISTORY] response.success:', response.success)
        console.log('[DRIVER-TRAVEL-HISTORY] response.data:', response.data)
        console.log('[DRIVER-TRAVEL-HISTORY] response.data type:', typeof response.data)
        
        if (response.success && response.data) {
          console.log('[DRIVER-TRAVEL-HISTORY] Setting history with', response.data.length, 'items')
          setHistory(response.data)
        } else {
          console.error('[DRIVER-TRAVEL-HISTORY] Failed - success:', response.success, 'data:', !!response.data)
          setError(response.message || "No se pudo cargar el historial")
        }
      } catch (err: any) {
        console.error("[DRIVER-TRAVEL-HISTORY] Error fetching travel history:", err)
        setError(err.response?.data?.message || "Error al cargar historial")
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const filteredHistory = filterRole === "TODOS" 
    ? history 
    : history.filter(h => h.rol === filterRole)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Viajes</CardTitle>
          <CardDescription>Registro de tus viajes completados</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Historial de Viajes</CardTitle>
            <CardDescription>Registro de tus viajes completados</CardDescription>
          </div>
        </div>
        
        <div className="flex gap-2">
          {(["TODOS", "CONDUCTOR", "PASAJERO"] as const).map((role) => (
            <Badge
              key={role}
              variant={filterRole === role ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterRole(role)}
            >
              {role === "CONDUCTOR" ? "Como Conductor" : role === "PASAJERO" ? "Como Pasajero" : "Todos"}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        
        {filteredHistory.length === 0 && !error ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay viajes en el historial</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((travel) => (
              <div
                key={travel.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(travel.fecha_viaje).toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {travel.rol === "CONDUCTOR" ? "Como Conductor" : "Como Pasajero"}
                    </Badge>
                  </div>
                  {travel.calificacion && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Calificación</p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {travel.calificacion} ⭐
                      </p>
                    </div>
                  )}
                </div>

                {travel.ruta_info && (
                  <div className="space-y-3 mt-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Recorrido</p>
                        <p className="font-semibold">{travel.ruta_info.salida}</p>
                        <p className="text-sm text-gray-600 mt-1">→ {travel.ruta_info.destino}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Hora de Salida</p>
                          <p className="text-sm font-semibold">{travel.ruta_info.hora_salida || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Distancia</p>
                          <p className="text-sm font-semibold">{travel.ruta_info.distancia || 'N/A'} km</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Tarifa</p>
                          <p className="text-sm font-semibold">${travel.ruta_info.precio?.toLocaleString('es-CO') || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {travel.rol === "CONDUCTOR" && travel.ruta_info.nombre_pasajero && (
                      <div className="bg-blue-50 p-3 rounded-lg text-sm border border-blue-100">
                        <p className="text-gray-600">👤 Pasajero: <span className="font-semibold text-blue-900">{travel.ruta_info.nombre_pasajero}</span></p>
                      </div>
                    )}

                    {travel.rol === "PASAJERO" && travel.ruta_info.nombre_conductor && (
                      <div className="bg-green-50 p-3 rounded-lg text-sm border border-green-100">
                        <p className="text-gray-600">👤 Conductor: <span className="font-semibold text-green-900">{travel.ruta_info.nombre_conductor}</span></p>
                      </div>
                    )}

                    {travel.calificacion && (
                      <div className="bg-yellow-50 p-3 rounded-lg text-sm border border-yellow-100">
                        <p className="text-gray-600">⭐ Calificación: <span className="font-semibold text-yellow-700">{travel.calificacion}/5</span></p>
                        {travel.comentario && (
                          <p className="text-gray-500 mt-1 italic">"{travel.comentario}"</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
