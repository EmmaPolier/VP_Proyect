"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      setError("Link de recuperación inválido")
      setTokenValid(false)
    } else {
      setTokenValid(true)
    }
  }, [token])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsLoading(true)

    try {
      if (!token) {
        setError("Link de recuperación inválido")
        setIsLoading(false)
        return
      }

      if (!formData.password.trim()) {
        setError("La contraseña es requerida")
        setIsLoading(false)
        return
      }

      if (formData.password.length < 8) {
        setError("La contraseña debe tener mínimo 8 caracteres")
        setIsLoading(false)
        return
      }

      if (!formData.confirmPassword.trim()) {
        setError("Confirma tu contraseña")
        setIsLoading(false)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden")
        setIsLoading(false)
        return
      }

      const response = await axios.post(`${API_URL}/reset-password`, {
        token,
        newPassword: formData.password,
        confirmPassword: formData.confirmPassword
      })

      setSuccess(true)
      setFormData({ password: "", confirmPassword: "" })
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push("/auth")
      }, 2000)
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.response?.data?.message || "Error al cambiar la contraseña")
      setIsLoading(false)
    }
  }

  if (tokenValid === false) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Link inválido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
              <p className="text-sm text-red-700">
                El link de recuperación es inválido o ha expirado.
              </p>
            </div>
            <Link href="/auth/forgot-password" className="w-full">
              <Button className="w-full">
                Solicitar nuevo link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Establece tu nueva contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña para recuperar tu cuenta
          </CardDescription>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
          {success && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                ✓ Contraseña actualizada exitosamente
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
                <FieldLabel htmlFor="password">Nueva Contraseña</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading || success}
                  required
                />
                <FieldDescription>
                  Mínimo 8 caracteres
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirmar Contraseña</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading || success}
                  required
                />
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={isLoading || success}
            >
              {isLoading ? "Cambiando contraseña..." : "Cambiar contraseña"}
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
