"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import axios from "axios"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/lib/api-constants"
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
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const API_URL = API_BASE_URL

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPerfils, setShowPerfils] = useState(false)
  const [perfiles, setPerfiles] = useState<any[]>([])
  const [credenciales, setCredenciales] = useState<any>(null)
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [showRoleSelector, setShowRoleSelector] = useState(true)

  useEffect(() => {
    const perfilParam = searchParams.get("perfil")
    if (perfilParam === "agregado") {
      setSuccess("✅ Perfil agregado exitosamente. Ahora puedes cambiar entre perfiles al iniciar sesión.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      // Validar que se haya seleccionado un rol
      if (!selectedRole) {
        setError("Debes seleccionar un rol antes de ingresar")
        setLoading(false)
        return
      }

      const response = await axios.post(`${API_URL}/login`, {
        email,
        contrasena: password,
        perfilId: selectedRole,
      })

      // Con perfilId especificado, no debería devolver selectPerfil
      // Iniciar sesión directamente
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: response.data.id,
          email: response.data.email,
          nombres: response.data.nombres,
          documento: response.data.documento,
          id_perfil: response.data.id_perfil,
          perfil_nombre: response.data.perfil_nombre,
          token: response.data.token,
          type: response.data.id_perfil === 2 ? "driver" : response.data.id_perfil === 3 ? "admin" : "passenger",
        })
      )

      router.push("/dashboard")
    } catch (err: any) {
      console.error("Error:", err)
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Error al conectar con el servidor")
      }
      setLoading(false)
    }
  }

  const handleSelectPerfil = async (perfilId: number) => {
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email: credenciales.email,
        contrasena: password,
        perfilId: perfilId
      })

      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: response.data.id,
          email: response.data.email,
          nombres: response.data.nombres,
          documento: response.data.documento,
          id_perfil: response.data.id_perfil,
          perfil_nombre: response.data.perfil_nombre,
          token: response.data.token,
          type: response.data.id_perfil === 2 ? "driver" : response.data.id_perfil === 3 ? "admin" : "passenger",
        })
      )

      router.push("/dashboard")
    } catch (err: any) {
      console.error("Error:", err)
      setError("Error al cambiar perfil")
      setLoading(false)
    }
  }

  if (showPerfils) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Selecciona tu perfil</CardTitle>
            <CardDescription>
              Tienes múltiples perfiles. Elige con cuál deseas continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {perfiles.map((perfil) => (
              <button
                key={perfil.id}
                onClick={() => handleSelectPerfil(perfil.id)}
                disabled={loading}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-left disabled:opacity-50"
              >
                <div className="font-semibold text-gray-900">
                  {perfil.nombre === 'PASAJERO' ? '👤 Pasajero' : '🚗 Conductor'}
                </div>
                <div className="text-sm text-gray-600">
                  ⭐ {perfil.calificacion?.toFixed(1) || '5.0'} estrellas
                </div>
              </button>
            ))}
            <button
              onClick={() => {
                setShowPerfils(false)
                setPerfiles([])
                setCredenciales(null)
              }}
              className="w-full p-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cambiar cuenta
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Selector de rol ANTES de ingresar credenciales
  if (showRoleSelector && !selectedRole) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">¿Cómo deseas ingresar?</CardTitle>
            <CardDescription>
              Selecciona el rol con el que deseas iniciar sesión
            </CardDescription>
            {success && (
              <p className="text-sm text-green-600 mt-2">{success}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => {
                setSelectedRole(1)
                setShowRoleSelector(false)
                setError("")
              }}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-left font-semibold text-gray-900"
            >
              👤 Ingresar como Pasajero
            </button>
            <button
              onClick={() => {
                setSelectedRole(2)
                setShowRoleSelector(false)
                setError("")
              }}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-left font-semibold text-gray-900"
            >
              🚗 Ingresar como Conductor
            </button>
          </CardContent>
        </Card>
        <div className="text-center text-sm text-gray-600">
          ¿No tienes cuenta? <Link href="/signup" className="underline hover:text-blue-600">Registrarse</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Ingresar</CardTitle>
          <CardDescription>
            Introduce tu email y contraseña para iniciar sesión
          </CardDescription>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600 mt-2">{success}</p>
          )}
          {selectedRole && (
            <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200 text-sm">
              <span className="text-gray-700">
                {selectedRole === 1 ? '👤 Ingresando como: Pasajero' : '🚗 Ingresando como: Conductor'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(null)
                  setShowRoleSelector(true)
                  setEmail("")
                  setPassword("")
                  setError("")
                }}
                className="ml-2 text-xs text-blue-600 hover:underline"
              >
                Cambiar rol
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@elpoli.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </Field>
            <Field>
              <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
              <FieldDescription className="text-center">
                ¿No tienes una cuenta?{" "}
                <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
                  Regístrate
                </Link>
              </FieldDescription>
            </Field>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
