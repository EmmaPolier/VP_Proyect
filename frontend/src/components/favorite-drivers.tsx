"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
    } catch (error: any) {
      setMessage('❌ ' + (error.message || 'No se pudieron cargar los conductores'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authorized) fetchData()
  }, [authorized, fetchData])

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
    } catch (error: any) {
      setMessage('❌ ' + (error.message || 'No se pudieron agregar los conductores'))
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
    } catch (error: any) {
      setMessage('❌ ' + (error.message || 'No se pudo eliminar el conductor'))
    } finally {
      setRemovingId(null)
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

      {/* Favoritos */}
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
    </div>
  )
}
