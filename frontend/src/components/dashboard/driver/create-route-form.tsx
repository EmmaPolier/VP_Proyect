'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'
import { API_BASE_URL } from '@/lib/api-constants'
import { AlertCircle, CheckCircle2, X, MapPin, Plus, Trash2 } from 'lucide-react'
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api'

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
  height: '600px',
}

const defaultCenter = {
  lat: 6.2442,
  lng: -75.5898,
}

const libraries = ['places'] as const

export default function CreateRouteForm({ onRouteCreated, onCancel }: CreateRouteFormProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
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
  const [selectedMeetingPointId, setSelectedMeetingPointId] = useState<string | null>(null)
  const [directionsResult, setDirectionsResult] = useState<any>(null)
  const [totalDistance, setTotalDistance] = useState<string>('')
  const [totalDuration, setTotalDuration] = useState<string>('')

  const originInputRef = useRef<HTMLInputElement>(null)
  const destInputRef = useRef<HTMLInputElement>(null)
  const directionsServiceRef = useRef<any>(null)

  // Agregar punto de encuentro
  const addMeetingPoint = () => {
    if (meetingPoints.length >= 4) {
      setError('Máximo 4 puntos de encuentro permitidos')
      return
    }
    if (!newPointName.trim()) {
      setError('Ingresa un nombre para el punto de encuentro')
      return
    }

    const newPoint: MeetingPoint = {
      id: Date.now().toString(),
      lat: formData.originLat,
      lng: formData.originLng,
      name: newPointName,
      order: meetingPoints.length + 1,
    }
    setMeetingPoints([...meetingPoints, newPoint])
    setNewPointName('')
    setSelectedMeetingPointId(newPoint.id)
    setError(null)
  }

  // Eliminar punto de encuentro
  const removeMeetingPoint = (id: string) => {
    setMeetingPoints(meetingPoints.filter(p => p.id !== id).map((p, idx) => ({
      ...p,
      order: idx + 1,
    })))
    if (selectedMeetingPointId === id) {
      setSelectedMeetingPointId(null)
      setSelectingMode(null)
    }
  }

  // Actualizar punto de encuentro
  const updateMeetingPoint = (id: string, lat: number, lng: number) => {
    setMeetingPoints(meetingPoints.map(p =>
      p.id === id ? { ...p, lat, lng } : p
    ))
  }

  // Setup autocomplete
  useEffect(() => {
    if (!isLoaded || !map) return

    // Inicializar DirectionsService
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new window.google.maps.DirectionsService()
    }

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
    } else if (selectingMode === 'destination') {
      setFormData(prev => ({
        ...prev,
        destinationLat: lat,
        destinationLng: lng,
        destinationName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      }))
      if (destInputRef.current) {
        destInputRef.current.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }
    } else if (selectingMode === 'meeting' && selectedMeetingPointId) {
      updateMeetingPoint(selectedMeetingPointId, lat, lng)
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

  // Calcular la ruta real usando Google Maps Directions API (OPCIONAL - no bloquea si falla)
  const calculateRoute = async () => {
    // No ejecutar si Google Maps no está cargado o servicio no disponible
    if (!isLoaded || !window.google || !directionsServiceRef.current) {
      return
    }

    try {
      const waypoints = meetingPoints
        .sort((a, b) => a.order - b.order)
        .map(p => ({
          location: { lat: p.lat, lng: p.lng },
          stopover: true,
        }))

      const request: any = {
        origin: { lat: formData.originLat, lng: formData.originLng },
        destination: { lat: formData.destinationLat, lng: formData.destinationLng },
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
      }

      // Timeout para Google Maps API (5 segundos)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Google Maps timeout')), 5000)
      )
      const result = await Promise.race([
        directionsServiceRef.current.route(request),
        timeoutPromise
      ])
      
      if (result && result.status === window.google.maps.DirectionsStatus.OK) {
        setDirectionsResult(result)

        // Calcular distancia y duración totales
        let totalDist = 0
        let totalDur = 0
        result.routes[0].legs.forEach((leg: any) => {
          totalDist += leg.distance.value // metros
          totalDur += leg.duration.value // segundos
        })

        const distKm = (totalDist / 1000).toFixed(2)
        const durHours = Math.floor(totalDur / 3600)
        const durMinutes = Math.floor((totalDur % 3600) / 60)

        setTotalDistance(distKm)
        setTotalDuration(
          durHours > 0
            ? `${durHours}h ${durMinutes}m`
            : `${durMinutes}m`
        )
      } else {
        console.warn('Directions request failed:', result?.status)
        setDirectionsResult(null)
      }
    } catch (error: any) {
      // Google Maps errors no bloquean la creación de rutas
      // Solo se usa para mostrar la línea en el mapa
      console.warn('Google Maps visualization unavailable:', error?.message || error)
      setDirectionsResult(null)
    }
  }

  // Recalcular ruta cuando cambien los puntos
  useEffect(() => {
    calculateRoute()
  }, [meetingPoints, formData.originLat, formData.originLng, formData.destinationLat, formData.destinationLng])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (!formData.departure || formData.availableSeats < 1 || formData.availableSeats > 6) {
        throw new Error('Cupos deben ser entre 1 y 6')
      }
      if (formData.price < 1000) {
        throw new Error('Precio debe ser mínimo 1000 COP')
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
        meetingPoints: meetingPoints.map(p => ({
          lat: p.lat,
          lng: p.lng,
          name: p.name,
          order: p.order,
        }))
      }

      const response = await apiClient.post(`${API_BASE_URL}/api/routes`, payload)

      if (response.data?.data?.routeId || response.status === 201) {
        const routeId = response.data?.data?.routeId
        setSuccess(`✅ ¡Ruta creada exitosamente! ID: ${routeId}`)
        onRouteCreated?.(routeId)
        
        setFormData({
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
        setMeetingPoints([])
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
        <CardDescription>La app trazará automáticamente la ruta óptima por las calles</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium block">🚩 Puntos de Encuentro (Máximo 4)</label>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">{meetingPoints.length}/4</span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Nombre del punto (ej: Centro Comercial, Parque...)"
                  value={newPointName}
                  onChange={(e) => setNewPointName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addMeetingPoint()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addMeetingPoint}
                  disabled={meetingPoints.length >= 4}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {meetingPoints.length < 4 && (
                <p className="text-xs text-blue-700">
                  💡 Luego haz click en el mapa para establecer su ubicación
                </p>
              )}
            </div>

            {meetingPoints.length > 0 && (
              <div className="space-y-2">
                {meetingPoints.map((point) => (
                  <div
                    key={point.id}
                    className={`p-3 rounded border transition-all cursor-pointer ${
                      selectedMeetingPointId === point.id
                        ? 'bg-white border-blue-400 shadow-md'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedMeetingPointId(point.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {point.order}
                        </span>
                        <span className="font-medium text-sm">{point.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeMeetingPoint(point.id)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-600 ml-8">
                      Lat: {point.lat.toFixed(4)} | Lng: {point.lng.toFixed(4)}
                    </div>
                    {selectedMeetingPointId === point.id && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectingMode('meeting')}
                        className="mt-2 w-full text-xs"
                      >
                        📍 Seleccionar ubicación en el mapa
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

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
              {directionsResult && (
                <DirectionsRenderer
                  directions={directionsResult}
                  options={{
                    polylineOptions: {
                      strokeColor: '#3b82f6',
                      strokeOpacity: 0.8,
                      strokeWeight: 4,
                    },
                    suppressMarkers: true,
                  }}
                />
              )}

              <Marker
                position={{
                  lat: formData.originLat,
                  lng: formData.originLng,
                }}
                title="Origen"
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: '#10b981',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                }}
              />

              {meetingPoints.map((point) => (
                <Marker
                  key={point.id}
                  position={{
                    lat: point.lat,
                    lng: point.lng,
                  }}
                  title={`${point.order}. ${point.name}`}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#f59e0b',
                    fillOpacity: selectedMeetingPointId === point.id ? 1 : 0.7,
                    strokeColor: '#fff',
                    strokeWeight: selectedMeetingPointId === point.id ? 3 : 2,
                  }}
                />
              ))}

              <Marker
                position={{
                  lat: formData.destinationLat,
                  lng: formData.destinationLng,
                }}
                title="Destino"
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: '#ef4444',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                }}
              />
            </GoogleMap>
            <div className="text-xs text-gray-500 p-2 bg-gray-50 border-t space-y-1">
              <div>📍 La línea azul muestra la ruta óptima por las calles</div>
              {totalDistance && totalDuration && (
                <div className="text-green-700 font-medium">
                  ✅ Ruta: {totalDistance} km · {totalDuration}
                </div>
              )}
            </div>
          </div>

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
                min="1000"
                step="1"
                required
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">Mínimo 1000 COP</div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? 'Creando ruta...' : 'Publicar Ruta'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
