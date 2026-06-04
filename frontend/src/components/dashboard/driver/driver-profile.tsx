"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import { API_ENDPOINTS } from "@/lib/api-constants"
import { Loader2, AlertCircle, Check, Eye, EyeOff, User, Mail, Phone, Calendar, Shield } from "lucide-react"

interface UserProfile {
  documento: string
  nombres: string
  primerApellido: string
  segundoApellido: string
  email: string
  telefono: string
  fechaNacimiento: string
  saldoCartera: number
  perfiles: Array<{
    id: number
    nombre: string
    calificacion: number
  }>
}

export function DriverProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  
  // Editar información
  const [editingInfo, setEditingInfo] = useState(false)
  const [editFormData, setEditFormData] = useState({
    email: "",
    telefono: "",
    nombres: "",
    primerApellido: "",
    segundoApellido: ""
  })
  const [editingSubmitting, setEditingSubmitting] = useState(false)

  // Cambiar contraseña
  const [editingPassword, setEditingPassword] = useState(false)
  const [passwordFormData, setPasswordFormData] = useState({
    passwordActual: "",
    passwordNueva: "",
    passwordConfirm: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirm: false
  })
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await apiClient.get<UserProfile>(API_ENDPOINTS.GET_PROFILE)
      
      console.log('[DRIVER-PROFILE] Response:', response)

      // apiClient ya devuelve ApiResponse<T>, así que response.data contiene el UserProfile
      if (response?.data && response.data.documento) {
        setProfile(response.data)
        setEditFormData({
          email: response.data.email || "",
          telefono: response.data.telefono || "",
          nombres: response.data.nombres || "",
          primerApellido: response.data.primerApellido || "",
          segundoApellido: response.data.segundoApellido || ""
        })
      } else {
        setError("No se encontraron datos de perfil")
      }
    } catch (err: any) {
      console.error("[DRIVER-PROFILE] Error fetching profile:", err)
      setError(err?.message || "Error al cargar el perfil")
    } finally {
      setLoading(false)
    }
  }

  const handleEditInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditingSubmitting(true)
    setError("")
    setSuccessMessage("")

    try {
      await apiClient.put(API_ENDPOINTS.UPDATE_PROFILE, editFormData)

      setSuccessMessage("¡Perfil actualizado exitosamente!")
      setEditingInfo(false)

      // Recargar perfil
      await fetchProfile()

      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err: any) {
      setError(err?.message || "Error al actualizar el perfil")
    } finally {
      setEditingSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSubmitting(true)
    setError("")
    setSuccessMessage("")

    try {
      if (passwordFormData.passwordNueva !== passwordFormData.passwordConfirm) {
        setError("Las contraseñas nuevas no coinciden")
        setPasswordSubmitting(false)
        return
      }

      if (passwordFormData.passwordNueva.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres")
        setPasswordSubmitting(false)
        return
      }

      await apiClient.post(API_ENDPOINTS.CHANGE_PASSWORD, {
        passwordActual: passwordFormData.passwordActual,
        passwordNueva: passwordFormData.passwordNueva,
        passwordConfirm: passwordFormData.passwordConfirm
      })

      setSuccessMessage("¡Contraseña cambiada exitosamente!")
      setEditingPassword(false)
      setPasswordFormData({
        passwordActual: "",
        passwordNueva: "",
        passwordConfirm: ""
      })

      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err: any) {
      setError(err?.message || "Error al cambiar la contraseña")
    } finally {
      setPasswordSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mi Perfil</CardTitle>
          <CardDescription>Administra tu información personal</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mi Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">No se pudo cargar el perfil</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mensajes */}
      {error && (
        <div className="flex gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {/* Información Básica */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Tu información básica y datos de contacto</CardDescription>
              </div>
            </div>
            {!editingInfo && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingInfo(true)}
              >
                Editar
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {!editingInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-semibold">{profile.documento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nombres</p>
                  <p className="font-semibold">{profile.nombres}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Primer Apellido</p>
                  <p className="font-semibold">{profile.primerApellido || "No registrado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Segundo Apellido</p>
                  <p className="font-semibold">{profile.segundoApellido || "No registrado"}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold break-all">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-semibold">{profile.telefono || "No registrado"}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <Badge className="bg-blue-100 text-blue-800">Perfiles</Badge>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.perfiles.map((perfil) => (
                    <Badge key={perfil.id} variant="secondary" className="text-base py-1 px-3">
                      {perfil.nombre}
                      {perfil.calificacion && (
                        <span className="ml-2 text-yellow-500">⭐ {perfil.calificacion.toFixed(1)}</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div>
                  <p className="text-sm text-gray-600">Saldo en Cartera</p>
                  <p className="font-semibold text-lg text-green-600">
                    ${profile.saldoCartera.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEditInfoSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombres *</label>
                <Input
                  value={editFormData.nombres}
                  onChange={(e) => setEditFormData({ ...editFormData, nombres: e.target.value })}
                  className="mt-1"
                  disabled={editingSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Primer Apellido</label>
                  <Input
                    value={editFormData.primerApellido}
                    onChange={(e) => setEditFormData({ ...editFormData, primerApellido: e.target.value })}
                    className="mt-1"
                    disabled={editingSubmitting}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Segundo Apellido</label>
                  <Input
                    value={editFormData.segundoApellido}
                    onChange={(e) => setEditFormData({ ...editFormData, segundoApellido: e.target.value })}
                    className="mt-1"
                    disabled={editingSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="mt-1"
                  disabled={editingSubmitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  value={editFormData.telefono}
                  onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                  className="mt-1"
                  placeholder="+57..."
                  disabled={editingSubmitting}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingInfo(false)}
                  disabled={editingSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-2"
                  disabled={editingSubmitting}
                >
                  {editingSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Seguridad - Cambiar Contraseña */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-red-600" />
              <div>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>Cambia tu contraseña de forma segura</CardDescription>
              </div>
            </div>
            {!editingPassword && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingPassword(true)}
              >
                Cambiar Contraseña
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {!editingPassword ? (
            <p className="text-sm text-gray-600">
              Tu contraseña se utiliza para acceder a tu cuenta. Cámbiala regularmente para mayor seguridad.
            </p>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Contraseña Actual *</label>
                <div className="relative mt-1">
                  <Input
                    type={showPasswords.actual ? "text" : "password"}
                    value={passwordFormData.passwordActual}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, passwordActual: e.target.value })}
                    disabled={passwordSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPasswords({ ...showPasswords, actual: !showPasswords.actual })}
                  >
                    {showPasswords.actual ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Contraseña Nueva *</label>
                <div className="relative mt-1">
                  <Input
                    type={showPasswords.nueva ? "text" : "password"}
                    value={passwordFormData.passwordNueva}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, passwordNueva: e.target.value })}
                    disabled={passwordSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPasswords({ ...showPasswords, nueva: !showPasswords.nueva })}
                  >
                    {showPasswords.nueva ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
              </div>

              <div>
                <label className="text-sm font-medium">Confirmar Contraseña *</label>
                <div className="relative mt-1">
                  <Input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordFormData.passwordConfirm}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, passwordConfirm: e.target.value })}
                    disabled={passwordSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditingPassword(false)
                    setPasswordFormData({
                      passwordActual: "",
                      passwordNueva: "",
                      passwordConfirm: ""
                    })
                  }}
                  disabled={passwordSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-2"
                  disabled={passwordSubmitting}
                >
                  {passwordSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cambiar Contraseña
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
