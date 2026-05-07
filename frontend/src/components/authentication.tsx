"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export function InputOTPForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [pendingType, setPendingType] = useState<string | null>(null)

  useEffect(() => {
    const pending = localStorage.getItem("pendingVerification")
    if (!pending) {
      setError("No se encontró información de verificación. Regístrate primero.")
      return
    }

    try {
      const parsed = JSON.parse(pending)
      setPendingEmail(parsed.email)
      setPendingType(parsed.type)
    } catch (error) {
      setError("Error al leer la información de verificación.")
    }
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingEmail) {
      setError("No hay email para verificar.")
      return
    }

    if (!code.trim() || code.trim().length !== 6) {
      setError("Introduce un código de 6 dígitos.")
      return
    }

    setError("")
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/verify`, {
        email: pendingEmail,
        code,
      })

      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          type: response.data.role === "DRIVER" ? "driver" : "passenger",
        })
      )
      localStorage.removeItem("pendingVerification")
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Verify error:", err)
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Error al verificar el código. Intenta de nuevo.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md border-0 shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Ingresar código de verificación</CardTitle>
          <CardDescription>
            Le enviamos un código de 6 dígitos a tu correo electrónico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                id="otp-verification"
                value={code}
                onChange={(value: any) => setCode(String(value || ""))}
              >
                <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:rounded-lg *:data-[slot=input-otp-slot]:text-xl *:data-[slot=input-otp-slot]:font-semibold *:data-[slot=input-otp-slot]:border-2">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator className="mx-2 text-muted-foreground text-2xl" />
                <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:rounded-lg *:data-[slot=input-otp-slot]:text-xl *:data-[slot=input-otp-slot]:font-semibold *:data-[slot=input-otp-slot]:border-2">
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <FieldDescription className="text-center">
              ¿No recibiste el código?{" "}
              <a href="#" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Reenviar
              </a>
            </FieldDescription>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={loading || !pendingEmail}>
              {loading ? "Verificando..." : "Verificar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="text-xs text-muted-foreground text-center w-full">
            Al hacer clic en continuar, aceptas nuestros{" "}
            <a href="#" className="underline">
              Términos de servicio
            </a>{" "}
            y nuestra{" "}
            <a href="#" className="underline">
              Política de privacidad
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
