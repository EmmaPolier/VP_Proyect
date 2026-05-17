/**
 * Componente para proteger contenido basado en permisos
 */

'use client'

import React from 'react'
import { usePermissions } from '@/hooks/use-permissions'

interface ProtectedContentProps {
  url: string
  action: 'crear' | 'leer' | 'actualizar' | 'eliminar'
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Componente que renderiza contenido solo si el usuario tiene permisos
 */
export function ProtectedContent({
  url,
  action,
  children,
  fallback = null,
}: ProtectedContentProps) {
  const { menuItems, loading, error } = usePermissions()

  if (loading) {
    return <div className="p-4 text-muted-foreground">Cargando permisos...</div>
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error al cargar permisos: {error}
      </div>
    )
  }

  // Verificar si el usuario tiene permiso para esta acción
  const menuItem = menuItems.find((item) => item.url === url)
  
  if (!menuItem) {
    return <>{fallback || <div className="p-4 text-yellow-600">Recurso no encontrado en el menú</div>}</>
  }

  const hasPermission = menuItem.permisos[action]

  if (!hasPermission) {
    return (
      <>{fallback || <div className="p-4 text-red-600">No tienes permiso para {action.toLowerCase()} en esta sección</div>}</>
    )
  }

  return <>{children}</>
}

interface ProtectedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  url: string
  action: 'crear' | 'leer' | 'actualizar' | 'eliminar'
  children: React.ReactNode
}

/**
 * Botón que se desactiva si el usuario no tiene permisos
 */
export function ProtectedButton({
  url,
  action,
  children,
  ...props
}: ProtectedButtonProps) {
  const { menuItems, loading, error } = usePermissions()

  if (loading || error) {
    return (
      <button {...props} disabled>
        {children}
      </button>
    )
  }

  const menuItem = menuItems.find((item) => item.url === url)
  const hasPermission = menuItem?.permisos[action] ?? false

  return (
    <button
      {...props}
      disabled={!hasPermission || props.disabled}
      title={
        !hasPermission
          ? `No tienes permiso para ${action.toLowerCase()}`
          : props.title
      }
    >
      {children}
    </button>
  )
}
