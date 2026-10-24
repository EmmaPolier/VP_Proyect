'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/api-constants'

interface EmergencyResult {
  estado: 'ENVIADO' | 'ERROR'
  ubicacionIncluida: boolean
  destinatarios: Array<{ contactoId: number; estado: 'ENVIADO' | 'ERROR' }>
}

interface EmergencyAlertButtonProps {
  routeId: number
}

interface EmergencyTypeOption {
  id: number
  nombre: string
}


function getCurrentLocation(): Promise<{ latitud: number; longitud: number } | null> {
  if (!navigator.geolocation) return Promise.resolve(null)
    
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitud: coords.latitude, longitud: coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
    )
  })
}

export function EmergencyAlertButton({ routeId }: EmergencyAlertButtonProps) {
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [typesEmergencies, setTypesEmergencies] = useState<EmergencyTypeOption[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [errorTypes, setErrorTypes] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  
  useEffect(() => {
    let cancelled = false
    
    async function loadTypes() {
      try {
        setLoadingTypes(true)
        setErrorTypes(null)
  
        const response = await apiClient.fetch<EmergencyTypeOption[]>(
          API_ENDPOINTS.EMERGENCY_TYPES
        )
  
        if (!cancelled) {
          setTypesEmergencies(response.data ?? [])
        }
      } catch (error) {
        if (!cancelled) {
          setErrorTypes(
            error instanceof Error
            ? error.message
            : 'No se pudieron cargar los tipos de emergencia.'
          )
        }
      } finally {
        if (!cancelled) setLoadingTypes(false)
      }
    }
  
    void loadTypes()
  
    return () => {
      cancelled = true
    }
  }, [])
  
  const sendAlert = async (type: EmergencyTypeOption) => {
    if (!window.confirm(
      `¿Confirmas una alerta por ${type.nombre}? Se notificará a tus contactos de emergencia.`
    )) return

    setMenuOpen(false)
    setSending(true)
    setMessage(null)
    setError(null)

    try {
      const location = await getCurrentLocation()
      const response = await apiClient.fetch<EmergencyResult>(
        API_ENDPOINTS.ROUTE_EMERGENCY(routeId),
        {
          method: 'POST',
          headers: { 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({
            tipoEmergenciaId: type.id,
            ...(location ? { ubicacion: location } : {}),
          }),
        }
      )

      const failed = 
        response.data?.destinatarios.filter(
          (recipient) => recipient.estado === 'ERROR'
        ).length ?? 0

      setMessage(
        response.data?.estado === 'ENVIADO'
          ? `Alerta de ${type.nombre.toLowerCase()} enviada a todos tus contactos${location ? ' con ubicación' : ' sin ubicación'}.`
          : `Alerta procesada; fallaron ${failed} envío(s). Contacta a tus contactos por otro medio.`
      )
    } catch (requestError) {
      setError(
        requestError instanceof Error 
        ? requestError.message 
        : 'No se pudo enviar la alerta.'
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-2">
      {menuOpen && (
        <div
          role="group"
          aria-label="Selecciona el tipo de emergencia"
          className="mb-2 flex w-full max-w-xs flex-col gap-2 rounded-md border bg-background p-3 shadow-md"
        >
          <p className="text-sm font-medium">¿Qué tipo de emergencia tienes?</p>

          {loadingTypes && (
            <p role="status" className="text-sm text-muted-foreground">
              Cargando opciones...
            </p>
          )}

          {errorTypes && (
            <p role="alert" className="text-sm text-red-700">
              {errorTypes}
            </p>
          )}

          {!loadingTypes && !errorTypes && typesEmergencies.length === 0 && (
            <p role="alert" className="text-sm text-red-700">
              No hay tipos de emergencia activos.
            </p>
          )}

          {typesEmergencies.map((type) => (
            <Button
              key={type.id}
              type="button"
              variant="outline"
              className="justify-start whitespace-normal text-left"
              onClick={() => sendAlert(type)}
              disabled={sending || loadingTypes}
            >
              {type.nombre}
            </Button>
          ))}
        </div>
      )}

      <Button
        type="button"
        className="bg-red-600 text-white hover:bg-red-700"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
        disabled={sending}
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        {sending ? 'Enviando alerta…' : 'Emergencia'}
      </Button>
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  )
}
