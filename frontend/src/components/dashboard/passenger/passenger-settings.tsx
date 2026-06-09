"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/api-constants'

interface UserProfile {
  documento: string
  nombres: string
  primerApellido: string
  segundoApellido: string
  email: string
  telefono: string
  perfiles: Array<{
    id: number
    nombre: string
    calificacion: number
  }>
  saldoCartera: number
}

export function PassengerSettings() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false)
  const [deleteAccountMessage, setDeleteAccountMessage] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<UserProfile>(API_ENDPOINTS.GET_PROFILE)
      if (response?.data && response.data.documento) {
        setProfile(response.data)
      }
    } catch (error) {
      console.error('Error cargando perfil:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('⚠️ ¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible.')) {
      return
    }

    if (!confirm('⚠️ ADVERTENCIA: Se perderán todos tus datos, solicitudes, historial y saldo. ¿Deseas continuar?')) {
      return
    }

    setDeleteAccountLoading(true)
    setDeleteAccountMessage('')

    try {
      const response = await apiClient.post(API_ENDPOINTS.DELETE_ACCOUNT, {})
      setDeleteAccountMessage('✅ ' + (response.message || 'Cuenta eliminada correctamente'))
      
      setTimeout(() => {
        localStorage.removeItem('currentUser')
        localStorage.removeItem('rolActivo')
        localStorage.removeItem('perfilNombre')
        localStorage.removeItem('usuario')
        localStorage.removeItem('perfiles')
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      setDeleteAccountMessage('❌ ' + (error.message || 'No se pudo eliminar la cuenta'))
    } finally {
      setDeleteAccountLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Cargando información de configuración...</p>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">No se pudo cargar la información de tu cuenta</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Información de Cuenta */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Cuenta</CardTitle>
          <CardDescription>Detalles de tu perfil de pasajero</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Datos Personales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Documento</label>
                  <p className="text-sm font-medium">{profile.documento}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nombres</label>
                  <p className="text-sm font-medium">{profile.nombres}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Primer Apellido</label>
                  <p className="text-sm font-medium">{profile.primerApellido}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Segundo Apellido</label>
                  <p className="text-sm font-medium">{profile.segundoApellido}</p>
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm font-medium break-all">{profile.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                  <p className="text-sm font-medium">{profile.telefono}</p>
                </div>
              </div>
            </div>

            {/* Perfiles */}
            {profile.perfiles && profile.perfiles.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Tus Perfiles</h3>
                <div className="flex flex-wrap gap-3">
                  {profile.perfiles.map((perfil) => (
                    <div key={perfil.id} className="flex items-center gap-2">
                      <Badge variant="outline" className="px-3 py-1">
                        {perfil.nombre}
                        <span className="ml-2 text-yellow-500">⭐ {perfil.calificacion.toFixed(1)}</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cartera */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Saldo en Cartera</h3>
              <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
                <p className="text-sm text-muted-foreground mb-1">Saldo disponible</p>
                <p className="text-3xl font-bold text-green-600">
                  ${profile.saldoCartera?.toLocaleString('es-CO', { minimumFractionDigits: 2 }) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zona de Peligro */}
      <Card className="border-red-200">
        <CardHeader className="border-b border-red-200">
          <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
          <CardDescription>Acciones irreversibles</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="font-semibold text-red-900 mb-2">Eliminar Cuenta</h4>
            <p className="text-sm text-red-800 mb-4">
              ⚠️ Esta acción es <strong>irreversible</strong>. Se eliminarán todos tus datos:
            </p>
            <ul className="text-sm text-red-800 mb-4 ml-4 list-disc space-y-1">
              <li>Información personal y de contacto</li>
              <li>Todas tus solicitudes de viajes</li>
              <li>Historial de viajes completados</li>
              <li>Saldo en cartera y transacciones</li>
              <li>Calificaciones y reseñas</li>
              <li>Historial de pagos</li>
            </ul>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteAccountLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAccountLoading ? 'Eliminando...' : 'Eliminar mi cuenta permanentemente'}
            </Button>
            {deleteAccountMessage && (
              <div className="mt-3 rounded-lg bg-white p-3 text-sm border border-red-200">
                {deleteAccountMessage}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
