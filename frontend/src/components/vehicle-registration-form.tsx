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

export function VehicleRegistrationForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    plate: "",
    color: "",
    soatUrl: "",
    licenciaUrl: "",
    tarjetaUrl: "",
    fotoUrl: ""
  })
  const [driverId, setDriverId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const pending = localStorage.getItem("pendingVerification")
    if (!pending) {
      setError("No se encontró información de conductor. Regístrate primero.")
      return
    }

    try {
      const parsed = JSON.parse(pending)
      if (parsed.type !== "driver") {
        setError("Debes iniciar sesión como conductor para registrar un vehículo.")
        return
      }

      setDriverId(parsed.id)
    } catch (error) {
      setError("Error al leer la información de verificación.")
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setError(`No hay conductor válido para registrar el vehículo. (driverId: ${driverId})`)
      setIsLoading(false)
      return
    }

    try {
      if (!formData.brand.trim() || !formData.model.trim() || !formData.plate.trim() || !formData.color.trim()) {
        setError("Todos los campos de vehículo son obligatorios.")
        setIsLoading(false)
        return
      }

      console.log("Enviando vehículo:", {
        driverId,
        brand: formData.brand,
        model: formData.model,
        plate: formData.plate,
        color: formData.color,
        soatUrl: formData.soatUrl,
        licenciaUrl: formData.licenciaUrl,
        tarjetaUrl: formData.tarjetaUrl,
        fotoUrl: formData.fotoUrl,
      })

      await axios.post(`${API_URL}/vehicles`, {
        driverId,
        brand: formData.brand,
        model: formData.model,
        plate: formData.plate,
        color: formData.color,
        soatUrl: formData.soatUrl,
        licenciaUrl: formData.licenciaUrl,
        tarjetaUrl: formData.tarjetaUrl,
        fotoUrl: formData.fotoUrl,
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

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Registrar tu vehículo</CardTitle>
          <CardDescription>
            Completa la información de tu carro para continuar.
          </CardDescription>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="brand">Marca del vehículo</FieldLabel>
                <Input
                  id="brand"
                  type="text"
                  placeholder="Chevrolet"
                  value={formData.brand}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="model">Modelo del vehículo</FieldLabel>
                <Input
                  id="model"
                  type="text"
                  placeholder="2020"
                  value={formData.model}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="plate">Número de Placa</FieldLabel>
                    <Input
                      id="plate"
                      type="text"
                      placeholder="ABC-1234"
                      value={formData.plate}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="color">Color del vehículo</FieldLabel>
                    <Input
                      id="color"
                      type="text"
                      placeholder="Blanco"
                      value={formData.color}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                    />
                  </Field>
                </Field>
              </Field>
              <Field>
                <FieldLabel>Documentos del vehículo</FieldLabel>
                <Field>
                  <FieldLabel htmlFor="soatUrl" className="text-sm">SOAT</FieldLabel>
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
                  <FieldLabel htmlFor="licenciaUrl" className="text-sm">Licencia de conducción</FieldLabel>
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
                  <FieldLabel htmlFor="tarjetaUrl" className="text-sm">Tarjeta de propiedad</FieldLabel>
                  <Input
                    id="tarjetaUrl"
                    type="url"
                    placeholder="https://..."
                    value={formData.tarjetaUrl}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </Field>
              </Field>

              <Field>
                <FieldLabel htmlFor="fotoUrl">Foto del vehículo</FieldLabel>
                <Input
                  id="fotoUrl"
                  type="url"
                  placeholder="https://..."
                  value={formData.fotoUrl}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={isLoading}>
                  {isLoading ? "Registrando..." : "Aceptar"}
                </Button>
              </Field>
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
