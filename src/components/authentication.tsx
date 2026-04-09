"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

export function InputOTPForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      router.push("/dashboard")
    }, 500)
  }

  return (
    <Card className="mx-auto max-w-md border-0 shadow-none">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Ingresar codigo de verificacion</CardTitle>
        <CardDescription>
          Le enviamos un codigo de 6 digitos a su dirección de correo electrónico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <Field className="flex flex-col items-center">
            <InputOTP maxLength={6} id="otp-verification">
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
            <FieldDescription className="text-center mt-4">
              ¿No recibiste el codigo?{" "}
              <a href="#" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Reenviar
              </a>
            </FieldDescription>
          </Field>

          <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={loading}>
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
  )
}
