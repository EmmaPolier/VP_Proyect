'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GoogleMap, Marker, Polyline, useJsApiLoader, InfoWindow } from '@react-google-maps/api'
import { MapPin, AlertCircle, CheckCircle2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface Route {
  id: number
  departure: string
  availableSeats: number
  totalSeats: number
  price: number
  distance: number
  originLatitude: number
  originLongitude: number
  destinationLatitude: number
  destinationLongitude: number
  conductor: string
  vehicle: string
  rating: number
  meetingPoints?: Array<{
    lat: number
    lng: number
    name: string
    order: number
  }>
}

interface ViewRoutesMapProps {
  onRouteSelected?: (route: Route) => void
}

const containerStyle = {
  width: '100%',
  height: '600px',
}

const defaultCenter = {
  lat: 6.2442,
  lng: -75.5898,
}

export default function ViewRoutesMap({ onRouteSelected }: ViewRoutesMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-passenger',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [map, setMap] = useState<any>(null)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await apiClient.get('/routes', {
          params: {
            origin: 'Medellín',
            destination: 'Medellín',
          }
        })

        if (response.data?.data?.routes) {
          setRoutes(response.data.data.routes)
        } else {
          setRoutes([])
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar rutas')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRoutes()
  }, [])

  const onLoad = (mapInstance: any) => {
    setMap(mapInstance)
    if (routes.length > 0) {
      fitBoundsToRoutes()
    }
  }

  const fitBoundsToRoutes = () => {
    if (!map || routes.length === 0) return

    const bounds = new window.google.maps.LatLngBounds()
    
    routes.forEach((route) => {
      bounds.extend({ lat: route.originLatitude, lng: route.originLongitude })
      bounds.extend({ lat: route.destinationLatitude, lng: route.destinationLongitude })
    })

    map.fitBounds(bounds)
  }

  if (!isLoaded) {
    return <div className="text-center py-8">⏳ Cargando mapa...</div>
  }

  if (loading) {
    return <div className="text-center py-8">⏳ Cargando rutas...</div>
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (routes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>🗺️ Rutas Disponibles</CardTitle>
          <CardDescription>No hay rutas disponibles en este momento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Intenta con otros filtros o vuelve más tarde
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>🗺️ Rutas Disponibles ({routes.length})</CardTitle>
          <CardDescription>Haz click en un marcador o elige una ruta abajo para ver detalles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={selectedRoute ? {
                lat: selectedRoute.originLatitude,
                lng: selectedRoute.originLongitude,
              } : defaultCenter}
              zoom={13}
              onLoad={onLoad}
              options={{
                mapTypeId: 'roadmap',
              }}
            >
              {/* Mostrar todas las rutas */}
              {routes.map((route, idx) => (
                <div key={route.id}>
                  {/* Línea de ruta */}
                  <Polyline
                    path={[
                      { lat: route.originLatitude, lng: route.originLongitude },
                      { lat: route.destinationLatitude, lng: route.destinationLongitude },
                    ]}
                    options={{
                      strokeColor: selectedRoute?.id === route.id ? '#3b82f6' : '#9ca3af',
                      strokeWeight: selectedRoute?.id === route.id ? 3 : 2,
                      geodesic: true,
                      clickable: true,
                    }}
                    onClick={() => {
                      setSelectedRoute(route)
                      onRouteSelected?.(route)
                    }}
                  />

                  {/* Marcador de origen */}
                  <Marker
                    position={{ lat: route.originLatitude, lng: route.originLongitude }}
                    title={`Origen - ${route.conductor}`}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: selectedRoute?.id === route.id ? 12 : 8,
                      fillColor: '#10b981',
                      fillOpacity: selectedRoute?.id === route.id ? 1 : 0.7,
                      strokeColor: '#fff',
                      strokeWeight: 2,
                    }}
                    onClick={() => {
                      setSelectedRoute(route)
                      setSelectedMarker(`origin-${route.id}`)
                      onRouteSelected?.(route)
                    }}
                  >
                    {selectedMarker === `origin-${route.id}` && (
                      <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                        <div className="p-2 text-xs">
                          <p className="font-bold">Origen</p>
                          <p>{route.conductor}</p>
                        </div>
                      </InfoWindow>
                    )}
                  </Marker>

                  {/* Marcador de destino */}
                  <Marker
                    position={{ lat: route.destinationLatitude, lng: route.destinationLongitude }}
                    title={`Destino - $${route.price}`}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: selectedRoute?.id === route.id ? 12 : 8,
                      fillColor: '#ef4444',
                      fillOpacity: selectedRoute?.id === route.id ? 1 : 0.7,
                      strokeColor: '#fff',
                      strokeWeight: 2,
                    }}
                    onClick={() => {
                      setSelectedRoute(route)
                      setSelectedMarker(`dest-${route.id}`)
                      onRouteSelected?.(route)
                    }}
                  >
                    {selectedMarker === `dest-${route.id}` && (
                      <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                        <div className="p-2 text-xs">
                          <p className="font-bold">Destino</p>
                          <p className="text-green-600 font-bold">${route.price}</p>
                        </div>
                      </InfoWindow>
                    )}
                  </Marker>
                </div>
              ))}
            </GoogleMap>
          </div>
        </CardContent>
      </Card>

      {/* Lista de rutas */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>📋 Rutas Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {routes.map((route) => (
              <div
                key={route.id}
                className={`p-3 border rounded-lg cursor-pointer transition ${
                  selectedRoute?.id === route.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedRoute(route)
                  onRouteSelected?.(route)
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-600">Salida: {route.departure}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      {route.conductor} ⭐ {route.rating}
                    </p>
                    <p className="text-xs text-gray-600 mb-1">
                      📍 Distancia: {route.distance} km
                    </p>
                    <p className="text-xs text-gray-600">
                      🚗 Placa: {route.vehicle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">${route.price}</p>
                    <p className="text-xs text-gray-600 mb-2">
                      {route.availableSeats}/{route.totalSeats} cupos
                    </p>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRouteSelected?.(route)
                      }}
                    >
                      Solicitar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

declare global {
  interface Window {
    google: any
  }
}
