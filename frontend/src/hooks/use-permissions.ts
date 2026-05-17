/**
 * Hook para gestionar permisos en componentes
 */

import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  MenuItem,
  MenuPermissions,
  hasPermission,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  getAccessibleUrls,
  hasAccessToUrl,
} from '@/lib/permissions'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface CurrentUser {
  id_perfil: number
  [key: string]: any
}

export function usePermissions() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Cargar usuario del localStorage
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) {
      setError('No hay usuario autenticado')
      setLoading(false)
      return
    }

    try {
      const user = JSON.parse(userStr) as CurrentUser
      setCurrentUser(user)

      // Cargar menú dinámico
      fetchMenu(user.id_perfil)
    } catch (err) {
      console.error('Error parsing user:', err)
      setError('Error al cargar usuario')
      setLoading(false)
    }
  }, [])

  const fetchMenu = async (idPerfil: number) => {
    try {
      const response = await axios.get(`${API_URL}/menu/${idPerfil}`)
      setMenuItems(response.data.menu || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching menu:', err)
      setError('Error al cargar permisos')
      setMenuItems([])
    } finally {
      setLoading(false)
    }
  }

  // Funciones de utilidad
  const checkPermission = (
    url: string,
    action: 'crear' | 'leer' | 'actualizar' | 'eliminar'
  ) => hasPermission(menuItems, url, action)

  const checkCanRead = (url: string) => canRead(menuItems, url)
  const checkCanCreate = (url: string) => canCreate(menuItems, url)
  const checkCanUpdate = (url: string) => canUpdate(menuItems, url)
  const checkCanDelete = (url: string) => canDelete(menuItems, url)
  const getAccessible = () => getAccessibleUrls(menuItems)
  const checkAccess = (url: string) => hasAccessToUrl(menuItems, url)

  return {
    menuItems,
    currentUser,
    loading,
    error,
    // Funciones
    hasPermission: checkPermission,
    canRead: checkCanRead,
    canCreate: checkCanCreate,
    canUpdate: checkCanUpdate,
    canDelete: checkCanDelete,
    getAccessibleUrls: getAccessible,
    hasAccessToUrl: checkAccess,
  }
}
