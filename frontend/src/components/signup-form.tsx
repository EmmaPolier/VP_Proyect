"use client"

import { useState } from "react"
import Link from "next/link"
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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    document: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    role: "PASSENGER"
  })
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleRoleChange = (role: "PASSENGER" | "DRIVER") => {
    setFormData(prev => ({
      ...prev,
      role,
    }))
  }

  const validateForm = (): string | null => {
    // Validar nombre
    if (!formData.name.trim()) {
      return "El nombre es requerido"
    }

    // Validar apellido
    if (!formData.lastname.trim()) {
      return "El apellido es requerido"
    }

    // Validar documento
    if (!formData.document.trim()) {
      return "El documento es requerido"
    }

    const docNumbers = formData.document.replace(/\D/g, "")
    if (docNumbers.length < 5) {
      return "El documento debe tener mínimo 5 dígitos (ej: 12345678)"
    }

    if (docNumbers.length > 11) {
      return "El documento no puede tener más de 11 dígitos"
    }

    // Validar email
    if (!formData.email.trim()) {
      return "El email es requerido"
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "Introduce un email válido"
    }

    if (!formData.email.endsWith("@elpoli.edu.co")) {
      return "El email debe usar el dominio @elpoli.edu.co"
    }

    // Validar teléfono
    if (!formData.phone.trim()) {
      return "El teléfono es requerido"
    }

    const phoneNumbers = formData.phone.replace(/\D/g, "")
    if (phoneNumbers.length < 10) {
      return "El teléfono debe tener mínimo 10 dígitos (ej: 3001234567)"
    }

    if (phoneNumbers.length > 10) {
      return "El teléfono debe tener exactamente 10 dígitos"
    }

    if (!phoneNumbers.match(/^3\d{9}$/)) {
      return "El teléfono debe comenzar con 3 (ej: 3001234567)"
    }

    // Validar contraseña
    if (formData.password.length < 8) {
      return "La contraseña debe tener mínimo 8 caracteres"
    }

    if (formData.password !== formData.confirmPassword) {
      return "Las contraseñas no coinciden"
    }

    return null
  }

  const handleCreateAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validar formulario completo
      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        setIsLoading(false)
        return
      }

      // Enviar datos al servidor
      const response = await axios.post(`${API_URL}/register`, {
        documento: formData.document,
        nombres: formData.name,
        primerApellido: formData.lastname,
        segundoApellido: "",
        email: formData.email,
        telefono: formData.phone || "",
        fechaNacimiento: formData.birthDate || null,
        contrasena: formData.password,
        fotoUrl: null,
        perfil: formData.role === "DRIVER" ? "CONDUCTOR" : "PASAJERO",
      })

      if (response.status === 201) {
        localStorage.setItem(
          "pendingVerification",
          JSON.stringify({
            id: response.data.usuario.documento,
            email: response.data.usuario.email,
            type: formData.role === "DRIVER" ? "driver" : "passenger",
          })
        )

        if (formData.role === "DRIVER") {
          router.push("/signup/driver/vehicle")
        } else {
          router.push("/auth")
        }
      }
    } catch (err: any) {
      console.error("Error:", err)
      
      // Prioridad de mensajes de error
      if (err.response?.data?.message) {
        // Mensaje específico del servidor
        setError(err.response.data.message)
      } else if (err.response?.data?.error) {
        // Campo de error alternativo
        setError(err.response.data.error)
      } else if (err.response?.status === 400) {
        // Error de validación
        setError("Error en los datos ingresados. Verifica todos los campos.")
      } else if (err.response?.status === 500) {
        // Error del servidor
        setError("Error en el servidor. Intenta más tarde.")
      } else if (err.code === "ERR_NETWORK") {
        setError("Error de conexión. Verifica tu conexión a internet.")
      } else {
        setError("Error al crear la cuenta. Intenta de nuevo.")
      }
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Crear tu cuenta</CardTitle>
          <CardDescription>
            Introduce tus datos para crear tu cuenta
          </CardDescription>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAccount}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="lastname">Apellido</FieldLabel>
                <Input
                  id="lastname"
                  type="text"
                  placeholder="García"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="document">Documento de identidad</FieldLabel>
                <Input
                  id="document"
                  type="text"
                  placeholder="123456789"
                  value={formData.document}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="birthDate">Fecha de nacimiento (Opcional)</FieldLabel>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@elpoli.edu.co"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="3001234567"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel>Tipo de cuenta</FieldLabel>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="role"
                      value="PASSENGER"
                      checked={formData.role === "PASSENGER"}
                      onChange={() => handleRoleChange("PASSENGER")}
                      disabled={isLoading}
                    />
                    Pasajero
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="role"
                      value="DRIVER"
                      checked={formData.role === "DRIVER"}
                      onChange={() => handleRoleChange("DRIVER")}
                      disabled={isLoading}
                    />
                    Conductor
                  </label>
                </div>
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                    <Input 
                      id="password" 
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">
                      Confirmar Contraseña
                    </FieldLabel>
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  La contraseña debe tener mínimo 8 caracteres.
                </FieldDescription>
              </Field>
              <Field>
                <Button 
                  type="submit" 
                  className="w-full bg-black text-white hover:bg-black/90" 
                  disabled={isLoading}
                >
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
