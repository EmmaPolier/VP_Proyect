"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api-client"
import { API_ENDPOINTS } from "@/lib/api-constants"
import { Loader2, AlertCircle, Plus, Trash2, X } from "lucide-react"

interface Vehicle {
  id: number
  documento: string
  marca: string
  modelo: string
  placa: string
  color: string
  estado: string
  soat_url?: string
  licencia_url?: string
  tarjeta_url?: string
  foto_url?: string
  fecha_registro?: string
}

interface VehicleResponse {
  success: boolean
  data?: Vehicle[]
  message?: string
}

export function DriverVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    marca: "",
    modelo: "",
    placa: "",
    color: "",
    estado: "ACTIVO",
    soat_url: "",
    licencia_url: "",
    tarjeta_url: "",
    foto_url: "",
  })

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await apiClient.get<VehicleResponse>(
        API_ENDPOINTS.GET_USER_VEHICLES
      )
      
      if (response.data?.success && response.data?.data) {
        setVehicles(response.data.data)
      } else {
        setError(response.data?.message || "No se pudieron cargar los vehículos")
      }
    } catch (err: any) {
      console.error("Error fetching vehicles:", err)
      setError(err.response?.data?.message || "Error al cargar vehículos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    setSuccessMessage("")

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.CREATE_USER_VEHICLE,
        formData
      )

      setSuccessMessage(response.message || "Vehículo registrado correctamente")
      setFormData({
        marca: "",
        modelo: "",
        placa: "",
        color: "",
        estado: "ACTIVO",
        soat_url: "",
        licencia_url: "",
        tarjeta_url: "",
        foto_url: "",
      })
      setShowForm(false)

      // Recargar vehículos
      await fetchVehicles()

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al registrar vehículo")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteVehicle = async (vehicleId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este vehículo?")) {
      return
    }

    setDeleteLoading(vehicleId)
    setError("")

    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.DELETE_USER_VEHICLE(vehicleId)
      )

      setSuccessMessage(response.message || "Vehículo eliminado correctamente")
      setVehicles(prev => prev.filter(v => v.id !== vehicleId))

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al eliminar vehículo")
    } finally {
      setDeleteLoading(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Vehículos</CardTitle>
          <CardDescription>Información de los vehículos registrados</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Mis Vehículos</CardTitle>
          <CardDescription>Gestiona tus vehículos registrados</CardDescription>
        </div>
        <Button 
          size="sm" 
          variant={showForm ? "outline" : "default"}
          className="gap-2"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Registrar Vehículo
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-green-700">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de registro */}
        {showForm && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-base">Registrar nuevo vehículo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Marca (ej: Toyota)"
                    value={formData.marca}
                    onChange={(e) => handleFormChange("marca", e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Modelo (ej: Corolla)"
                    value={formData.modelo}
                    onChange={(e) => handleFormChange("modelo", e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Placa (ej: ABC-123)"
                    value={formData.placa}
                    onChange={(e) => handleFormChange("placa", e.target.value.toUpperCase())}
                    required
                  />
                  <Input
                    placeholder="Color"
                    value={formData.color}
                    onChange={(e) => handleFormChange("color", e.target.value)}
                    required
                  />
                  <select
                    value={formData.estado}
                    onChange={(e) => handleFormChange("estado", e.target.value)}
                    className="px-3 py-2 border rounded-md bg-white"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                    <option value="EN_REVISION">EN REVISIÓN</option>
                  </select>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-600">URLs de documentos (opcionales)</p>
                  <Input
                    placeholder="URL de foto del vehículo"
                    value={formData.foto_url}
                    onChange={(e) => handleFormChange("foto_url", e.target.value)}
                  />
                  <Input
                    placeholder="URL del SOAT"
                    value={formData.soat_url}
                    onChange={(e) => handleFormChange("soat_url", e.target.value)}
                  />
                  <Input
                    placeholder="URL de licencia"
                    value={formData.licencia_url}
                    onChange={(e) => handleFormChange("licencia_url", e.target.value)}
                  />
                  <Input
                    placeholder="URL de tarjeta de propiedad"
                    value={formData.tarjeta_url}
                    onChange={(e) => handleFormChange("tarjeta_url", e.target.value)}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setFormData({
                        marca: "",
                        modelo: "",
                        placa: "",
                        color: "",
                        estado: "ACTIVO",
                        soat_url: "",
                        licencia_url: "",
                        tarjeta_url: "",
                        foto_url: "",
                      })
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting} className="gap-2">
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Registrar Vehículo
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de vehículos */}
        {vehicles.length === 0 && !error ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-3">No tienes vehículos registrados</p>
            <Button 
              size="sm"
              onClick={() => setShowForm(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Registra tu primer vehículo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {vehicle.marca} {vehicle.modelo}
                      </h3>
                      <Badge
                        variant={
                          vehicle.estado === "ACTIVO"
                            ? "default"
                            : vehicle.estado === "INACTIVO"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {vehicle.estado}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Placa</p>
                        <p className="font-mono font-semibold">{vehicle.placa}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Color</p>
                        <p className="font-semibold">{vehicle.color}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Registro</p>
                        <p className="font-semibold">
                          {vehicle.fecha_registro 
                            ? new Date(vehicle.fecha_registro).toLocaleDateString('es-CO')
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>

                    {vehicle.foto_url && (
                      <div className="mt-3">
                        <img
                          src={vehicle.foto_url}
                          alt={`${vehicle.marca} ${vehicle.modelo}`}
                          className="h-32 w-32 object-cover rounded border"
                        />
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">
                        Editar
                      </Button>
                      <Button size="sm" variant="outline">
                        Ver Documentos
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        disabled={deleteLoading === vehicle.id}
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="gap-1"
                      >
                        {deleteLoading === vehicle.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
