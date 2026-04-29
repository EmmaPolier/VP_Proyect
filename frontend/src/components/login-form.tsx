"use client"

import { useState } from "react"
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
import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Obtener todos los usuarios desde el backend
      const response = await axios.get(`${API_URL}/users`)
      const users = response.data

      // Validar credenciales (email como usuario, password como contraseña)
      const user = users.find(
        (u: any) => u.email === email && u.name === password
      )

      if (!user) {
        setError("Email o contraseña incorrectos")
        setLoading(false)
        return
      }

      // Guardar usuario en localStorage
      localStorage.setItem("currentUser", JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name
      }))

      // Redirigir al dashboard
      router.push("/dashboard")
    } catch (err) {
      console.error("Error:", err)
      setError("Error al conectar con el servidor")
      setLoading(false)
    }
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
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
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
