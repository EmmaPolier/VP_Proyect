"use client"

import { useState } from "react"
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
import Link from "next/link"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  // Usuarios ficticios disponibles
  const users = [
    { email: "pasajero", password: "123", type: "passenger" },
    { email: "conductor", password: "123", type: "driver" }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validar credenciales
    const user = users.find(u => u.email === email && u.password === password)

    if (!user) {
      setError("Email o contraseña incorrectos")
      setLoading(false)
      return
    }

    // Guardar usuario en localStorage
    localStorage.setItem("currentUser", JSON.stringify({
      email: user.email,
      type: user.type
    }))

    // Simular delay y redirigir
    setTimeout(() => {
      router.push("/dashboard")
    }, 500)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Ingresar</CardTitle>
          <CardDescription>
            Introduce tu correo electrónico a continuación para iniciar sesión en tu cuenta
          </CardDescription>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Demo: <strong>pasajero</strong>/123 o <strong>conductor</strong>/123
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="text"
                placeholder="pasajero o conductor"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <a
                  href="#"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  ¿Olvidó su contraseña?
                </a>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </Field>
            <Field>
              <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
              <Button variant="outline" type="button" className="w-full">
                Ingresar con Google
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
