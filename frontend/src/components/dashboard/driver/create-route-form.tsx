'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'
import { AlertCircle, CheckCircle2, X, MapPin } from 'lucide-react'
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api'

interface CreateRouteFormProps {
  onRouteCreated?: (routeId: number) => void
  onCancel?: () => void
}

interface MeetingPoint {
  id: string
  lat: number
  lng: number
  name: string
  order: number
}

const containerStyle = {
  width: '100%',
  height: '500px',
}

const defaultCenter = {
  lat: 6.2442,
  lng: -75.5898,
}

export default function CreateRouteForm({ onRouteCreated, onCancel }: CreateRouteFormProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [map, setMap] = useState<any>(null)

  const [formData, setFormData] = useState({
    originLat: 6.251839,
    originLng: -75.581228,
    originName: 'San Cristóbal',
    destinationLat: 6.197458,
    destinationLng: -75.567108,
    destinationName: 'Politécnico',
    departure: '2026-06-05T14:30',
    availableSeats: 4,
    price: 15000,
  })

  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>([])
  const [selectingMode, setSelectingMode] = useState<null | 'origin' | 'destination' | 'meeting'>(null)
  const [newPointName, setNewPointName] = useState('')
  const originInputRef = useRef<HTMLInputElement>(null)
  const destInputRef = useRef<HTMLInputElement>(null)

  // Setup autocomplete
  useEffect(() => {
    if (!isLoaded || !map) return

    if (originInputRef.current && !window.originAutocomplete) {
      const originAutocomplete = new window.google.maps.places.Autocomplete(originInputRef.current)
      originAutocomplete.addListener('place_changed', () => {
        const place = originAutocomplete.getPlace()
        if (place.geometry?.location) {
          setFormData(prev => ({
            ...prev,
            originLat: place.geometry!.location!.lat(),
            originLng: place.geometry!.location!.lng(),
            originName: place.formatted_address || place.name || 'Ubicación',
          }))
          if (map) {
            map.panTo(place.geometry.location)
          }
        }
      })
      window.originAutocomplete = originAutocomplete
    }

    if (destInputRef.current && !window.destAutocomplete) {
      const destAutocomplete = new window.google.maps.places.Autocomplete(destInputRef.current)
      destAutocomplete.addListener('place_changed', () => {
        const place = destAutocomplete.getPlace()
        if (place.geometry?.location) {
          setFormData(prev => ({
            ...prev,
            destinationLat: place.geometry!.location!.lat(),
            destinationLng: place.geometry!.location!.lng(),
            destinationName: place.formatted_address || place.name || 'Ubicación',
          }))
          if (map) {
            map.panTo(place.geometry.location)
          }
        }
      })
      window.destAutocomplete = destAutocomplete
    }
  }, [isLoaded, map])

  const onLoad = (mapInstance: any) => {
    setMap(mapInstance)
  }

  const handleMapClick = (e: any) => {
    if (!selectingMode) return

    const lat = e.latLng.lat()
    const lng = e.latLng.lng()

    if (selectingMode === 'origin') {
      setFormData(prev => ({
        ...prev,
        originLat: lat,
        originLng: lng,
        originName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      }))
      if (originInputRef.current) {
        originInputRef.current.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }
    } else {
      setFormData(prev => ({
        ...prev,
        destinationLat: lat,
        destinationLng: lng,
        destinationName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      }))
      if (destInputRef.current) {
        destInputRef.current.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }
    }

    setSelectingMode(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Validaciones básicas
      if (!formData.departure || formData.availableSeats < 1 || formData.availableSeats > 6) {
        throw new Error('Cupos deben ser entre 1 y 6')
      }
      if (formData.price <= 0) {
        throw new Error('Precio debe ser mayor a 0')
      }

      const departureDate = new Date(formData.departure)
      const now = new Date()
      if (departureDate <= now) {
        throw new Error('La fecha de salida debe ser en el futuro')
      }

      const payload = {
        originLat: formData.originLat,
        originLng: formData.originLng,
        destinationLat: formData.destinationLat,
        destinationLng: formData.destinationLng,
        departure: formData.departure,
        availableSeats: formData.availableSeats,
        price: formData.price,
        meetingPoints: []
      }

      const response = await apiClient.post('/routes', payload)

      if (response.data?.data?.routeId || response.status === 201) {
        const routeId = response.data?.data?.routeId
        setSuccess(`✅ ¡Ruta creada exitosamente! ID: ${routeId}`)
        onRouteCreated?.(routeId)
        
        // Reset form
        setFormData({
          originLat: 4.7110,
          originLng: -74.0721,
          originName: 'Politécnico',
          destinationLat: 4.6976,
          destinationLng: -74.0891,
          destinationName: 'Centro',
          departure: '2026-06-05T14:30',
          availableSeats: 4,
          price: 15000,
        })
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al crear ruta')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) {
    return <div className="text-center py-8">⏳ Cargando mapa...</div>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>📍 Publicar Nueva Ruta</CardTitle>
        <CardDescription>Busca ubicaciones o haz click en el mapa para seleccionar origen y destino</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mensajes */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Origen */}
          <div>
            <label className="text-sm font-medium block mb-2">📍 Origen</label>
            <div className="space-y-2">
              <Input
                ref={originInputRef}
                type="text"
                placeholder="Escribe una dirección o busca..."
                defaultValue={formData.originName}
                className="w-full"
              />
              <Button
                type="button"
                variant={selectingMode === 'origin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectingMode(selectingMode === 'origin' ? null : 'origin')}
              >
                {selectingMode === 'origin' ? '✓ Click en el mapa' : 'Seleccionar en mapa'}
              </Button>
              <div className="text-xs text-gray-500">
                Lat: {formData.originLat.toFixed(4)} | Lng: {formData.originLng.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Destino */}
          <div>
            <label className="text-sm font-medium block mb-2">📍 Destino</label>
            <div className="space-y-2">
              <Input
                ref={destInputRef}
                type="text"
                placeholder="Escribe una dirección o busca..."
                defaultValue={formData.destinationName}
                className="w-full"
              />
              <Button
                type="button"
                variant={selectingMode === 'destination' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectingMode(selectingMode === 'destination' ? null : 'destination')}
              >
                {selectingMode === 'destination' ? '✓ Click en el mapa' : 'Seleccionar en mapa'}
              </Button>
              <div className="text-xs text-gray-500">
                Lat: {formData.destinationLat.toFixed(4)} | Lng: {formData.destinationLng.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="border rounded-lg overflow-hidden">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={defaultCenter}
              zoom={13}
              onLoad={onLoad}
              onClick={handleMapClick}
              options={{
                cursor: selectingMode ? 'crosshair' : 'default',
              }}
            >
              {/* Marcador origen */}
              <Marker
                position={{
                  lat: formData.originLat,
                  lng: formData.originLng,
                }}
                title="Origen"
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#10b981',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                }}
              />

              {/* Marcador destino */}
              <Marker
                position={{
                  lat: formData.destinationLat,
                  lng: formData.destinationLng,
                }}
                title="Destino"
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#ef4444',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                }}
              />
            </GoogleMap>
            <div className="text-xs text-gray-500 p-2 bg-gray-50 border-t">
              {selectingMode ? '📍 Haz click en el mapa para seleccionar el punto' : '💡 Busca ubicaciones o usa el botón anterior para seleccionar en el mapa'}
            </div>
          </div>

          {/* Fecha y hora */}
          <div>
            <label className="text-sm font-medium block mb-2">📅 Fecha y hora de salida</label>
            <Input
              type="datetime-local"
              name="departure"
              value={formData.departure}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>

          {/* Cupos y precio */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">👥 Cupos disponibles</label>
              <Input
                type="number"
                name="availableSeats"
                value={formData.availableSeats}
                onChange={handleChange}
                min="1"
                max="6"
                required
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">Entre 1 y 6</div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">💵 Precio por cupo</label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="1"
                step="100"
                required
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">COP</div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading || selectingMode !== null}
              className="flex-1"
            >
              {loading ? '⏳ Publicando...' : '✅ Publicar Ruta'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onCancel?.()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

declare global {
  interface Window {
    google: any
    originAutocomplete?: any
    destAutocomplete?: any
  }
}

// Extend window for Google Maps types
declare global {
  interface Window {
    google: any
    originAutocomplete?: any
    destAutocomplete?: any
  }
}
