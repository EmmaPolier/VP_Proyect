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

export function DriverSignupForm({
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
      // Ir al registro de vehículo
      router.push("/signup/driver/vehicle")
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
          <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
          <CardDescription>
            Introduce tu correo electrónico a continuación para crear tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Davison Jaramillo"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@ejemplo.com"
                />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                    <Input id="password" type="password" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirmar Contraseña
                    </FieldLabel>
                    <Input id="confirm-password" type="password" />
                  </Field>
                </Field>
                <FieldDescription>
                  La contraseña debe tener minimo 8 caracteres.
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
                <FieldDescription className="text-center">
                  ¿Ya tienes una cuenta?{" "}
                  <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                    Iniciar sesión
                  </Link>
                </FieldDescription>
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
