"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

interface Brand {
  id: number
  nombre: string
}

interface Model {
  id: number
  nombre: string
}

interface Color {
  id: number
  nombre: string
}

export function VehicleRegistrationForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState("")
  
  // Datos dinámicos
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [colors, setColors] = useState<Color[]>([])
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    brandId: "",
    modelId: "",
    plate: "",
    colorId: "",
    soatUrl: "",
    licenciaUrl: "",
    tarjetaUrl: "",
    fotoUrl: ""
  })
  
  const [driverId, setDriverId] = useState<string | null>(null)
  const router = useRouter()

  // Cargar datos iniciales
  useEffect(() => {
    const pending = localStorage.getItem("pendingVerification")
    if (!pending) {
      setError("No se encontró información de conductor. Regístrate primero.")
      setIsLoadingData(false)
      return
    }

    try {
      const parsed = JSON.parse(pending)
      if (parsed.type !== "driver") {
        setError("Debes iniciar sesión como conductor para registrar un vehículo.")
        setIsLoadingData(false)
        return
      }

      setDriverId(parsed.id)
      loadCatalogData()
    } catch (error) {
      setError("Error al leer la información de verificación.")
      setIsLoadingData(false)
    }
  }, [])

  // Cargar marcas, colores y modelos
  const loadCatalogData = async () => {
    try {
      const [brandsRes, colorsRes] = await Promise.all([
        axios.get(`${API_URL}/vehicles/brands`),
        axios.get(`${API_URL}/vehicles/colors`)
      ])

      setBrands(brandsRes.data.brands)
      setColors(colorsRes.data.colors)
      setIsLoadingData(false)
    } catch (err: any) {
      console.error("Error cargando catálogos:", err)
      setError("Error cargando marcas y colores")
      setIsLoadingData(false)
    }
  }

  // Cargar modelos cuando se selecciona marca
  const handleBrandChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value
    setFormData(prev => ({
      ...prev,
      brandId,
      modelId: ""
    }))

    if (!brandId) {
      setModels([])
      return
    }

    try {
      const response = await axios.get(`${API_URL}/vehicles/models?brandId=${brandId}`)
      setModels(response.data.models)
    } catch (err: any) {
      console.error("Error cargando modelos:", err)
      setError("Error al cargar modelos disponibles")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!driverId) {
      setError("No hay conductor válido para registrar el vehículo.")
      setIsLoading(false)
      return
    }

    try {
      // Validaciones
      if (!formData.brandId || !formData.modelId || !formData.plate.trim() || !formData.colorId) {
        setError("Todos los campos obligatorios deben completarse.")
        setIsLoading(false)
        return
      }

      const plateSinGuion = formData.plate.replace(/-/g, '').toUpperCase()
      if (plateSinGuion.length > 6 || plateSinGuion.length < 1) {
        setError("La placa debe tener entre 1 y 6 caracteres.")
        setIsLoading(false)
        return
      }

      await axios.post(`${API_URL}/vehicles`, {
        driverId,
        brandId: parseInt(formData.brandId),
        modelId: parseInt(formData.modelId),
        plate: plateSinGuion,
        colorId: parseInt(formData.colorId),
        soatUrl: formData.soatUrl || null,
        licenciaUrl: formData.licenciaUrl || null,
        tarjetaUrl: formData.tarjetaUrl || null,
        fotoUrl: formData.fotoUrl || null,
      })

      router.push("/auth")
    } catch (err: any) {
      console.error("Error en registro:", err)
      if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Error al registrar el vehículo. Intenta nuevamente.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Cargando datos...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Registra tu vehículo</CardTitle>
          <CardDescription>
            Completa esta información para terminar tu registro como conductor
          </CardDescription>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {/* PASO 1: SELECCIONAR MARCA */}
              <Field>
                <FieldLabel htmlFor="brandId">
                  <span className="font-semibold">Paso 1:</span> Selecciona la marca
                </FieldLabel>
                <select
                  id="brandId"
                  value={formData.brandId}
                  onChange={handleBrandChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  <option value="">-- Selecciona una marca --</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.nombre}
                    </option>
                  ))}
                </select>
                <FieldDescription>
                  Elige el fabricante del vehículo
                </FieldDescription>
              </Field>

              {/* PASO 2: SELECCIONAR MODELO */}
              {formData.brandId && (
                <Field>
                  <FieldLabel htmlFor="modelId">
                    <span className="font-semibold">Paso 2:</span> Selecciona un modelo
                  </FieldLabel>
                  
                  {models.length > 0 ? (
                    <>
                      <select
                        id="modelId"
                        value={formData.modelId}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      >
                        <option value="">-- Selecciona un modelo --</option>
                        {models.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.nombre}
                          </option>
                        ))}
                      </select>
                      <FieldDescription>
                        {models.length} modelo(s) disponible(s) para esta marca
                      </FieldDescription>
                    </>
                  ) : (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        No hay modelos disponibles para esta marca. Consulta al administrador.
                      </p>
                    </div>
                  )}
                </Field>
              )}

              {/* PASO 3: INFORMACIÓN DEL VEHÍCULO */}
              {formData.modelId && (
                <>
                  <Field>
                    <FieldLabel htmlFor="colorId">
                      <span className="font-semibold">Paso 3:</span> Selecciona el color
                    </FieldLabel>
                    <select
                      id="colorId"
                      value={formData.colorId}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    >
                      <option value="">-- Selecciona un color --</option>
                      {colors.map(color => (
                        <option key={color.id} value={color.id}>
                          {color.nombre}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="plate">
                      <span className="font-semibold">Paso 4:</span> Número de placa
                    </FieldLabel>
                    <Input
                      id="plate"
                      type="text"
                      placeholder="ABC123"
                      value={formData.plate}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      maxLength="6"
                      required
                    />
                    <FieldDescription>
                      Máximo 6 caracteres (sin guiones)
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel>
                      <span className="font-semibold">Paso 5:</span> Documentos (opcional)
                    </FieldLabel>
                    <div className="space-y-2">
                      <Field>
                        <FieldLabel htmlFor="soatUrl" className="text-sm">
                          URL del SOAT
                        </FieldLabel>
                        <Input
                          id="soatUrl"
                          type="url"
                          placeholder="https://..."
                          value={formData.soatUrl}
                          onChange={handleInputChange}
                          disabled={isLoading}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="licenciaUrl" className="text-sm">
                          URL de licencia de conducción
                        </FieldLabel>
                        <Input
                          id="licenciaUrl"
                          type="url"
                          placeholder="https://..."
                          value={formData.licenciaUrl}
                          onChange={handleInputChange}
                          disabled={isLoading}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="tarjetaUrl" className="text-sm">
                          URL de tarjeta de propiedad
                        </FieldLabel>
                        <Input
                          id="tarjetaUrl"
                          type="url"
                          placeholder="https://..."
                          value={formData.tarjetaUrl}
                          onChange={handleInputChange}
                          disabled={isLoading}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="fotoUrl" className="text-sm">
                          URL de foto del vehículo
                        </FieldLabel>
                        <Input
                          id="fotoUrl"
                          type="url"
                          placeholder="https://..."
                          value={formData.fotoUrl}
                          onChange={handleInputChange}
                          disabled={isLoading}
                        />
                      </Field>
                    </div>
                  </Field>

                  <Field>
                    <Button
                      type="submit"
                      className="w-full bg-black text-white hover:bg-black/90"
                      disabled={isLoading}
                    >
                      {isLoading ? "Registrando..." : "Completar registro"}
                    </Button>
                  </Field>
                </>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-xs">
        Al hacer clic en continuar, aceptas nuestros{" "}
        <a href="#" className="underline">
          Términos de servicio
        </a>{" "}
        y nuestra{" "}
        <a href="#" className="underline">
          Política de privacidad
        </a>
      </FieldDescription>
    </div>
  )
}
