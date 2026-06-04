"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import { API_ENDPOINTS } from "@/lib/api-constants"
import { Loader2, AlertCircle, Plus, Trash2, X } from "lucide-react"

interface Vehicle {
  id: number
  placa: string
  marca: string
  modelo: string
  año: number
  color: string
  estado: string
  soatUrl?: string
  licenciaUrl?: string
  tarjetaUrl?: string
  fotoUrl?: string
  fechaRegistro?: string
}

interface VehiclesResponse {
  total: number
  vehiculos: Vehicle[]
}

interface Brand {
  ID_MAR: number
  NOMBRE_MAR: string
}

interface Model {
  ID_MOD: number
  NOMBRE_MOD: string
  AÑO_MOD: number
}

interface Color {
  ID_COL: number
  NOMBRE_COL: string
}

export function VehiclesList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState("")

  // Catálogos
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [loadingCatalogs, setLoadingCatalogs] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    brandId: "",
    modelId: "",
    plate: "",
    colorId: "",
    soatUrl: "",
    licenciaUrl: "",
    tarjetaUrl: "",
    fotoUrl: "",
  })

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await apiClient.get<VehiclesResponse>(
        API_ENDPOINTS.GET_USER_VEHICLES
      )

      setVehicles(response.vehiculos || [])
    } catch (err: any) {
      console.error("Error fetching vehicles:", err)
      setError(err.response?.data?.error || "Error al cargar vehículos")
    } finally {
      setLoading(false)
    }
  }

  const fetchCatalogs = async () => {
    try {
      setLoadingCatalogs(true)
      
      const [brandsRes, colorsRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.GET_VEHICLE_BRANDS),
        apiClient.get(API_ENDPOINTS.GET_VEHICLE_COLORS),
      ])

      setBrands(brandsRes.brands || [])
      setColors(colorsRes.colors || [])
    } catch (err: any) {
      console.error("Error fetching catalogs:", err)
    } finally {
      setLoadingCatalogs(false)
    }
  }

  const fetchModels = async (brandId: string) => {
    if (!brandId) {
      setModels([])
      return
    }

    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.GET_VEHICLE_MODELS}?brandId=${brandId}`
      )
      setModels(response.models || [])
    } catch (err: any) {
      console.error("Error fetching models:", err)
      setModels([])
    }
  }

  useEffect(() => {
    fetchVehicles()
    fetchCatalogs()
  }, [])

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (field === "brandId") {
      fetchModels(value)
      setFormData(prev => ({ ...prev, modelId: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    setSuccessMessage("")

    try {
      if (!formData.brandId || !formData.modelId || !formData.plate || !formData.colorId) {
        setError("Por favor completa todos los campos requeridos")
        setSubmitting(false)
        return
      }

      const response = await apiClient.post(
        API_ENDPOINTS.CREATE_USER_VEHICLE,
        {
          brandId: parseInt(formData.brandId),
          modelId: parseInt(formData.modelId),
          plate: formData.plate.toUpperCase(),
          colorId: parseInt(formData.colorId),
          soatUrl: formData.soatUrl || undefined,
          licenciaUrl: formData.licenciaUrl || undefined,
          tarjetaUrl: formData.tarjetaUrl || undefined,
          fotoUrl: formData.fotoUrl || undefined,
        }
      )

      setSuccessMessage(response.message || "Vehículo registrado correctamente")
      setFormData({
        brandId: "",
        modelId: "",
        plate: "",
        colorId: "",
        soatUrl: "",
        licenciaUrl: "",
        tarjetaUrl: "",
        fotoUrl: "",
      })
      setShowForm(false)
      setModels([])

      // Recargar vehículos
      await fetchVehicles()

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || "Error al registrar vehículo")
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
      setError(err.response?.data?.error || err.response?.data?.message || "Error al eliminar vehículo")
    } finally {
      setDeleteLoading(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Vehículos</CardTitle>
          <CardDescription>Cargando tus vehículos...</CardDescription>
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
          <CardTitle>Mis Vehículos ({vehicles.length})</CardTitle>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Marca */}
                  <div>
                    <label className="text-sm font-medium">Marca *</label>
                    <Select value={formData.brandId} onValueChange={(value) => handleFormChange("brandId", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Modelo */}
                  <div>
                    <label className="text-sm font-medium">Modelo *</label>
                    <Select value={formData.modelId} onValueChange={(value) => handleFormChange("modelId", value)} disabled={!formData.brandId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={model.id.toString()}>
                            {model.nombre} ({model.año})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Placa */}
                  <div>
                    <label className="text-sm font-medium">Placa *</label>
                    <Input
                      placeholder="ABC-123"
                      value={formData.plate}
                      onChange={(e) => handleFormChange("plate", e.target.value.toUpperCase())}
                      className="mt-1"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="text-sm font-medium">Color *</label>
                    <Select value={formData.colorId} onValueChange={(value) => handleFormChange("colorId", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona color" />
                      </SelectTrigger>
                      <SelectContent>
                        {colors.map((color) => (
                          <SelectItem key={color.id} value={color.id.toString()}>
                            {color.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-3">
                  <p className="text-sm font-medium text-gray-600">URLs de documentos (opcionales)</p>
                  <Input
                    placeholder="URL de foto del vehículo"
                    value={formData.fotoUrl}
                    onChange={(e) => handleFormChange("fotoUrl", e.target.value)}
                  />
                  <Input
                    placeholder="URL del SOAT"
                    value={formData.soatUrl}
                    onChange={(e) => handleFormChange("soatUrl", e.target.value)}
                  />
                  <Input
                    placeholder="URL de licencia"
                    value={formData.licenciaUrl}
                    onChange={(e) => handleFormChange("licenciaUrl", e.target.value)}
                  />
                  <Input
                    placeholder="URL de tarjeta de propiedad"
                    value={formData.tarjetaUrl}
                    onChange={(e) => handleFormChange("tarjetaUrl", e.target.value)}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setFormData({
                        brandId: "",
                        modelId: "",
                        plate: "",
                        colorId: "",
                        soatUrl: "",
                        licenciaUrl: "",
                        tarjetaUrl: "",
                        fotoUrl: "",
                      })
                      setModels([])
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
          <div className="grid gap-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  {vehicle.fotoUrl && (
                    <img
                      src={vehicle.fotoUrl}
                      alt={`${vehicle.marca} ${vehicle.modelo}`}
                      className="h-24 w-24 object-cover rounded border flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {vehicle.marca} {vehicle.modelo} ({vehicle.año})
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

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Placa</p>
                        <p className="font-mono font-semibold text-base">{vehicle.placa}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Color</p>
                        <p className="font-semibold">{vehicle.color}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Registro</p>
                        <p className="font-semibold text-sm">
                          {vehicle.fechaRegistro
                            ? new Date(vehicle.fechaRegistro).toLocaleDateString('es-CO')
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        size="sm" 
                        variant="destructive"
                        disabled={deleteLoading === vehicle.id || vehicles.length === 1}
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        title={vehicles.length === 1 ? "Debes tener al menos un vehículo" : ""}
                        className="gap-1"
                      >
                        {deleteLoading === vehicle.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {vehicles.length === 1 ? 'No puedes eliminar' : 'Eliminar'}
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
