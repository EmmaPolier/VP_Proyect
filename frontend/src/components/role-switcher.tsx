"use client"

import { useState } from "react"
import axios from "axios"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

interface RoleSwitcherProps {
  perfiles: Array<{ id: number; nombre: string; calificacion: number }>
  rolActual: number
  onRoleSwitch?: (nuevoRol: number) => void
}

export function RoleSwitcher({
  perfiles,
  rolActual,
  onRoleSwitch,
}: RoleSwitcherProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>(rolActual.toString())
  const [error, setError] = useState("")

  const handleSwitchRole = async () => {
    if (parseInt(selectedRole) === rolActual) {
      return // Sin cambios
    }

    setError("")
    setIsLoading(true)

    try {
      const token = localStorage.getItem("authToken")
      
      if (!token) {
        setError("No hay sesión activa")
        setIsLoading(false)
        return
      }

      const response = await axios.post(
        `${API_URL}/switch-role`,
        { perfilId: parseInt(selectedRole) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (response.status === 200) {
        // Guardar nuevo token
        localStorage.setItem("authToken", response.data.token)
        
        // Guardar rol activo
        localStorage.setItem("rolActivo", selectedRole)
        localStorage.setItem("perfilNombre", response.data.perfil_nombre)

        // Notificar al componente padre
        if (onRoleSwitch) {
          onRoleSwitch(parseInt(selectedRole))
        }

        // Recargar para actualizar la UI
        window.location.reload()
      }
    } catch (err: any) {
      console.error("Error al cambiar rol:", err)
      
      if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else if (err.code === "ERR_NETWORK") {
        setError("Error de conexión con el servidor")
      } else {
        setError("Error al cambiar de rol")
      }
      
      // Revertir selección
      setSelectedRole(rolActual.toString())
      setIsLoading(false)
    }
  }

  if (perfiles.length <= 1) {
    return null // No mostrar si solo tiene un rol
  }

  const rolActualNombre = perfiles.find(p => p.id === rolActual)?.nombre || "Desconocido"

  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm text-gray-600">Cambiar rol:</span>
      
      <Select value={selectedRole} onValueChange={setSelectedRole}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {perfiles.map((perfil) => (
            <SelectItem key={perfil.id} value={perfil.id.toString()}>
              {perfil.nombre} ({perfil.calificacion.toFixed(1)}⭐)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        onClick={handleSwitchRole}
        disabled={
          isLoading || 
          parseInt(selectedRole) === rolActual
        }
        size="sm"
        variant={parseInt(selectedRole) !== rolActual ? "default" : "outline"}
      >
        {isLoading ? "Cambiando..." : "Cambiar"}
      </Button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
