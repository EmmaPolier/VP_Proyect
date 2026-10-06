'use client'

import { useState } from 'react'
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

  const sendAlert = async () => {
    if (!window.confirm('¿Confirmas que necesitas ayuda? Se notificará a tus contactos de emergencia.')) return

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
          body: JSON.stringify(location ? { ubicacion: location } : {}),
        }
      )
      const failed = response.data?.destinatarios.filter((recipient) => recipient.estado === 'ERROR').length ?? 0
      setMessage(
        response.data?.estado === 'ENVIADO'
          ? `Alerta enviada a todos tus contactos${location ? ' con ubicación' : ' sin ubicación'}.`
          : `Alerta procesada; fallaron ${failed} envío(s). Contacta a tus contactos por otro medio.`
      )
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo enviar la alerta.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="bg-red-600 text-white hover:bg-red-700"
        onClick={sendAlert}
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
