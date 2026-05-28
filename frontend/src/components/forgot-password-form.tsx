"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import Link from "next/link"

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

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsLoading(true)

    try {
      if (!email.trim()) {
        setError("El email es requerido")
        setIsLoading(false)
        return
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Introduce un email válido")
        setIsLoading(false)
        return
      }

      await axios.post(`${API_URL}/forgot-password`, {
        email
      })

      setSuccess(true)
      setEmail("")
      
      // Mostrar mensaje de éxito durante 5 segundos
      setTimeout(() => {
        router.push("/auth")
      }, 3000)
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.response?.data?.message || "Error al procesar la solicitud")
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Recupera tu contraseña</CardTitle>
          <CardDescription>
            Ingresa tu email para recibir un link de recuperación
          </CardDescription>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
          {success && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                ✓ Si el email está registrado, recibirás un link de recuperación en tu bandeja de entrada.
              </p>
              <p className="text-sm text-green-600 mt-1">
                Redirigiendo al login...
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || success}
                  required
                />
                <FieldDescription>
                  El email con el que registraste tu cuenta
                </FieldDescription>
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={isLoading || success}
            >
              {isLoading ? "Enviando..." : "Enviar link de recuperación"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">¿Recuerdas tu contraseña? </span>
            <Link href="/auth" className="text-blue-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
