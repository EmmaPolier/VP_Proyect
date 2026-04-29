"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

export function VehicleRegistrationForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500))
      // Ir a verificación
      router.push("/auth")
    } catch (error) {
      console.error("Error en registro:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Registrar tu vehiculo</CardTitle>
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
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="model">Modelo del vehículo</FieldLabel>
                <Input
                  id="model"
                  type="text"
                  placeholder="2020"
                />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="plate">Numero de Placa</FieldLabel>
                    <Input id="plate" type="text" placeholder="ABC-1234" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="color">Color del vehículo</FieldLabel>
                    <Input id="color" type="text" placeholder="Blanco" />
                  </Field>
                </Field>
              </Field>
              
              {/* Vehicle Photos */}
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
