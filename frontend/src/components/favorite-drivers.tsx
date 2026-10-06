"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/api-constants'

const ROL_PASAJERO = '1'

interface Driver {
  idUpe: number
  nombres: string
  primerApellido: string
  segundoApellido: string
  calificacion: number
}

interface FavoriteDriver extends Driver {
  fechaAgregado: string
}

interface CandidateDriver extends Driver {
  totalViajes: number
  viajeActivo: boolean
}

interface PublicDriverProfile {
  idUpe: number
  nombre: string
  fotoUrl: string | null
  calificacion: number
  estado: string
  viajesCompletados: number
}

interface DriverTrip {
  rutaId: number
  estado: 'ACTIVA' | 'EN_CURSO' | 'COMPLETADA'
  salida: string
  destino: string
  fechaSalida: string
  cuposDisponibles?: number
  precio?: number
}

interface DriverTripsPage {
  items: DriverTrip[]
  nextCursor: string | null
}

const fullName = (d: Driver) =>
  [d.nombres, d.primerApellido, d.segundoApellido].filter(Boolean).join(' ')

const initials = (d: Driver) =>
  `${d.nombres?.[0] ?? ''}${d.primerApellido?.[0] ?? ''}`.toUpperCase()

function DriverAvatar({ driver }: { driver: Driver }) {
  return (
    <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
      {initials(driver)}
    </div>
  )
}

export function FavoriteDrivers() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<FavoriteDriver[]>([])
  const [candidates, setCandidates] = useState<CandidateDriver[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null)
  const [driverProfile, setDriverProfile] = useState<PublicDriverProfile | null>(null)
  const [driverTrips, setDriverTrips] = useState<DriverTrip[]>([])
  const [tripStatus, setTripStatus] = useState<DriverTrip['estado']>('ACTIVA')
  const [tripCursor, setTripCursor] = useState<string | null>(null)
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([])
  const [nextTripCursor, setNextTripCursor] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [tripLoading, setTripLoading] = useState(false)
  const [requestingRouteId, setRequestingRouteId] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'CARTERA_VIRTUAL'>('EFECTIVO')

  // Solo pasajeros: sin sesión -> /login, otro rol -> /dashboard
  useEffect(() => {
    if (!localStorage.getItem('currentUser')) {
      router.replace('/login')
      return
    }
    if (localStorage.getItem('rolActivo') !== ROL_PASAJERO) {
      router.replace('/dashboard')
      return
    }
    setAuthorized(true)
  }, [router])

  const fetchData = useCallback(async () => {
    try {
      const [favRes, candRes] = await Promise.all([
        apiClient.get<FavoriteDriver[]>(API_ENDPOINTS.FAVORITE_DRIVERS),
        apiClient.get<CandidateDriver[]>(API_ENDPOINTS.FAVORITE_DRIVER_CANDIDATES),
      ])
      setFavorites(favRes?.data ?? [])
      setCandidates(candRes?.data ?? [])
      setSelected(new Set())
    } catch (error: unknown) {
      setMessage('❌ ' + (error instanceof Error ? error.message : 'No se pudieron cargar los conductores'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authorized) fetchData()
  }, [authorized, fetchData])

  useEffect(() => {
    if (selectedDriverId === null) {
      setDriverProfile(null)
      return
    }

    let cancelled = false
    const loadDriverProfile = async () => {
      setDetailLoading(true)
      setMessage('')
      try {
        const profileResponse = await apiClient.get<PublicDriverProfile>(
          API_ENDPOINTS.PUBLIC_DRIVER_PROFILE(selectedDriverId)
        )
        if (cancelled) return
        setDriverProfile(profileResponse.data ?? null)
      } catch (error: unknown) {
        if (!cancelled) {
          setDriverProfile(null)
          setMessage('❌ ' + (error instanceof Error ? error.message : 'No se pudo cargar el perfil del conductor'))
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    }

    loadDriverProfile()
    return () => {
      cancelled = true
    }
  }, [selectedDriverId])

  useEffect(() => {
    if (selectedDriverId === null) {
      setDriverTrips([])
      setNextTripCursor(null)
      return
    }

    let cancelled = false
    const loadTripPage = async () => {
      setTripLoading(true)
      setDriverTrips([])
      setNextTripCursor(null)
      try {
        const response = await apiClient.get<DriverTripsPage>(
          API_ENDPOINTS.DRIVER_TRIPS(selectedDriverId),
          {
            estado: tripStatus,
            limite: 20,
            ...(tripCursor ? { cursor: tripCursor } : {}),
          }
        )
        if (!cancelled) {
          setDriverTrips(response.data?.items ?? [])
          setNextTripCursor(response.data?.nextCursor ?? null)
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setMessage('❌ ' + (error instanceof Error ? error.message : 'No se pudieron cargar más viajes'))
        }
      } finally {
        if (!cancelled) setTripLoading(false)
      }
    }

    loadTripPage()
    return () => {
      cancelled = true
    }
  }, [selectedDriverId, tripCursor, tripStatus])

  const toggleSelected = (idUpe: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idUpe)) next.delete(idUpe)
      else next.add(idUpe)
      return next
    })
  }

  const handleAdd = async () => {
    if (selected.size === 0) return
    setAdding(true)
    setMessage('')
    try {
      const response = await apiClient.post(API_ENDPOINTS.FAVORITE_DRIVERS, {
        idsUpeConductor: Array.from(selected),
      })
      setMessage('✅ ' + (response.message || 'Conductores agregados a favoritos'))
      await fetchData()
    } catch (error: unknown) {
      setMessage('❌ ' + (error instanceof Error ? error.message : 'No se pudieron agregar los conductores'))
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (driver: FavoriteDriver) => {
    if (!confirm(`¿Quitar a ${fullName(driver)} de tus favoritos?`)) return
    setRemovingId(driver.idUpe)
    setMessage('')
    try {
      const response = await apiClient.delete(API_ENDPOINTS.DELETE_FAVORITE_DRIVER(driver.idUpe))
      setMessage('✅ ' + (response.message || 'Conductor eliminado de favoritos'))
      await fetchData()
    } catch (error: unknown) {
      setMessage('❌ ' + (error instanceof Error ? error.message : 'No se pudo eliminar el conductor'))
    } finally {
      setRemovingId(null)
    }
  }

  const openDriverDetail = (idUpe: number) => {
    setSelectedDriverId(idUpe)
    setTripStatus('ACTIVA')
    setTripCursor(null)
    setCursorHistory([])
    setNextTripCursor(null)
  }

  const changeTripStatus = (status: DriverTrip['estado']) => {
    setTripStatus(status)
    setTripCursor(null)
    setCursorHistory([])
    setNextTripCursor(null)
  }

  const loadNextTripPage = () => {
    if (!nextTripCursor) return
    setCursorHistory((history) => [...history, tripCursor])
    setTripCursor(nextTripCursor)
  }

  const loadPreviousTripPage = () => {
    if (cursorHistory.length === 0) return
    const previousCursor = cursorHistory[cursorHistory.length - 1]
    setCursorHistory((history) => history.slice(0, -1))
    setTripCursor(previousCursor)
  }

  const requestTrip = async (trip: DriverTrip) => {
    if (trip.estado !== 'ACTIVA' || !trip.cuposDisponibles || trip.cuposDisponibles < 1) return
    if (!window.confirm(`¿Solicitas un cupo para la ruta #${trip.rutaId} por $${trip.precio ?? 0}?`)) return

    setRequestingRouteId(trip.rutaId)
    setMessage('')
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.CREATE_SOLICITUD(trip.rutaId),
        { paymentMethod, amount: trip.precio }
      )
      setMessage('✅ ' + (response.message || 'Solicitud enviada correctamente'))
    } catch (error: unknown) {
      setMessage('❌ ' + (error instanceof Error ? error.message : 'No se pudo solicitar el cupo'))
    } finally {
      setRequestingRouteId(null)
    }
  }

  if (!authorized || loading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Cargando conductores...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg border bg-card p-3 text-sm">{message}</div>
      )}

      {selectedDriverId !== null && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Detalle del conductor</CardTitle>
                <CardDescription>Información pública y viajes de este conductor</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedDriverId(null)}>
                Volver a favoritos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {detailLoading ? (
              <p className="text-sm text-muted-foreground">Cargando perfil y viajes...</p>
            ) : driverProfile ? (
              <>
                <div className="flex items-center gap-3">
                  {driverProfile.fotoUrl ? (
                    <Image
                      src={driverProfile.fotoUrl}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="size-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {driverProfile.nombre.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{driverProfile.nombre}</h3>
                    <p className="text-sm text-muted-foreground">
                      ⭐ {Number(driverProfile.calificacion).toFixed(1)} · {driverProfile.estado} · {driverProfile.viajesCompletados} viajes completados
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <label className="grid gap-1 text-sm">
                    Filtrar viajes
                    <select
                      className="h-9 rounded-md border bg-background px-3"
                      value={tripStatus}
                      onChange={(event) => changeTripStatus(event.target.value as DriverTrip['estado'])}
                    >
                      <option value="ACTIVA">Disponibles</option>
                      <option value="EN_CURSO">En curso</option>
                      <option value="COMPLETADA">Completados</option>
                    </select>
                  </label>
                  {tripStatus === 'ACTIVA' && (
                    <label className="grid gap-1 text-sm">
                      Método de pago
                      <select
                        className="h-9 rounded-md border bg-background px-3"
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}
                      >
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="CARTERA_VIRTUAL">Cartera virtual</option>
                      </select>
                    </label>
                  )}
                </div>

                {tripLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando viajes...</p>
                ) : driverTrips.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay viajes para este filtro.</p>
                ) : (
                  <div className="space-y-3">
                    {driverTrips.map((trip) => (
                      <div key={trip.rutaId} className="rounded-lg border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">Ruta #{trip.rutaId} · {trip.estado}</p>
                            <p className="text-sm text-muted-foreground">
                              Salida aproximada: {trip.salida} · Destino aproximado: {trip.destino}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(trip.fechaSalida).toLocaleString()}
                            </p>
                            {trip.estado !== 'COMPLETADA' && (
                              <p className="text-sm">
                                {trip.cuposDisponibles} cupos disponibles · ${trip.precio}
                              </p>
                            )}
                          </div>
                          {trip.estado === 'ACTIVA' && (trip.cuposDisponibles ?? 0) > 0 && (
                            <Button
                              onClick={() => requestTrip(trip)}
                              disabled={requestingRouteId === trip.rutaId}
                            >
                              {requestingRouteId === trip.rutaId ? 'Enviando...' : 'Solicitar cupo'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={loadPreviousTripPage}
                    disabled={cursorHistory.length === 0 || tripLoading}
                  >
                    Página anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={loadNextTripPage}
                    disabled={!nextTripCursor || tripLoading}
                  >
                    Siguiente página
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No se encontró el perfil del conductor.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Favoritos */}
      {selectedDriverId === null && <>
      <Card>
        <CardHeader>
          <CardTitle>Mis conductores favoritos</CardTitle>
          <CardDescription>Conductores que guardaste para reconocerlos fácilmente</CardDescription>
        </CardHeader>
        <CardContent>
          {favorites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no tienes conductores favoritos. Agrégalos desde la lista de abajo.
            </p>
          ) : (
            <ItemGroup>
              {favorites.map((driver) => (
                <Item key={driver.idUpe} variant="outline">
                  <ItemMedia>
                    <DriverAvatar driver={driver} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{fullName(driver)}</ItemTitle>
                    <ItemDescription>
                      <span className="text-yellow-500">⭐ {Number(driver.calificacion).toFixed(1)}</span>
                      {' · '}Favorito desde {driver.fechaAgregado}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDriverDetail(driver.idUpe)}
                    >
                      Ver perfil y viajes
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(driver)}
                      disabled={removingId === driver.idUpe}
                    >
                      {removingId === driver.idUpe ? 'Quitando...' : 'Quitar'}
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      {/* Candidatos */}
      <Card>
        <CardHeader>
          <CardTitle>Conductores con los que has viajado</CardTitle>
          <CardDescription>
            Selecciona uno o varios para agregarlos a tus favoritos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay conductores disponibles. Aparecerán aquí cuando tengas viajes aceptados o completados.
            </p>
          ) : (
            <>
              <ItemGroup>
                {candidates.map((driver) => (
                  <Item
                    key={driver.idUpe}
                    asChild
                    variant="outline"
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <label>
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={selected.has(driver.idUpe)}
                        onChange={() => toggleSelected(driver.idUpe)}
                        disabled={adding}
                      />
                      <ItemMedia>
                        <DriverAvatar driver={driver} />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>
                          {fullName(driver)}
                          {driver.viajeActivo && <Badge variant="secondary">Viaje activo</Badge>}
                        </ItemTitle>
                        <ItemDescription>
                          <span className="text-yellow-500">⭐ {Number(driver.calificacion).toFixed(1)}</span>
                          {' · '}
                          {driver.totalViajes} {driver.totalViajes === 1 ? 'viaje' : 'viajes'}
                        </ItemDescription>
                      </ItemContent>
                    </label>
                  </Item>
                ))}
              </ItemGroup>
              <Button onClick={handleAdd} disabled={selected.size === 0 || adding}>
                {adding
                  ? 'Agregando...'
                  : selected.size > 0
                    ? `Agregar a favoritos (${selected.size})`
                    : 'Agregar a favoritos'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      </>}
    </div>
  )
}
