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
import { Plus } from "lucide-react"

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
    color: ""
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
      setError("No hay conductor válido para registrar el vehículo.")
      setIsLoading(false)
      return
    }

    try {
      if (!formData.brand.trim() || !formData.model.trim() || !formData.plate.trim() || !formData.color.trim()) {
        setError("Todos los campos de vehículo son obligatorios.")
        setIsLoading(false)
        return
      }

      await axios.post(`${API_URL}/vehicles`, {
        driverId,
        brand: formData.brand,
        model: formData.model,
        plate: formData.plate,
        color: formData.color,
      })

      router.push("/auth")
    } catch (err: any) {
      console.error("Error en registro:", err)
      if (err.response?.data?.message) {
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
                <FieldLabel>Fotos del vehículo</FieldLabel>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <button
                      key={i}
                      type="button"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-muted hover:bg-muted/50 transition-colors"
                    >
                      <Plus className="w-6 h-6 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Foto Vehículo</span>
                    </button>
                  ))}
                </div>
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
