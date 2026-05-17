/**
 * Utility para gestionar permisos basado en el menú dinámico
 */

export interface MenuPermissions {
  crear: boolean
  actualizar: boolean
  eliminar: boolean
  leer: boolean
}

export interface MenuItem {
  id: number
  nombre: string
  url: string
  orden: number
  permisos: MenuPermissions
}

/**
 * Obtener permisos para una URL específica
 * @param menuItems - Items del menú dinámico
 * @param url - URL a verificar
 * @returns Objeto con permisos o null si no se encuentra
 */
export function getPermissionsForUrl(
  menuItems: MenuItem[],
  url: string
): MenuPermissions | null {
  const menuItem = menuItems.find((item) => item.url === url)
  return menuItem ? menuItem.permisos : null
}

/**
 * Verificar si el usuario puede realizar una acción específica
 * @param menuItems - Items del menú dinámico
 * @param url - URL a verificar
 * @param action - Acción a verificar: 'crear', 'leer', 'actualizar', 'eliminar'
 * @returns true si tiene permiso, false en caso contrario
 */
export function hasPermission(
  menuItems: MenuItem[],
  url: string,
  action: 'crear' | 'leer' | 'actualizar' | 'eliminar'
): boolean {
  const permissions = getPermissionsForUrl(menuItems, url)
  if (!permissions) return false

  return permissions[action]
}

/**
 * Verificar si el usuario puede leer (acceder) una sección
 */
export function canRead(menuItems: MenuItem[], url: string): boolean {
  return hasPermission(menuItems, url, 'leer')
}

/**
 * Verificar si el usuario puede crear en una sección
 */
export function canCreate(menuItems: MenuItem[], url: string): boolean {
  return hasPermission(menuItems, url, 'crear')
}

/**
 * Verificar si el usuario puede actualizar en una sección
 */
export function canUpdate(menuItems: MenuItem[], url: string): boolean {
  return hasPermission(menuItems, url, 'actualizar')
}

/**
 * Verificar si el usuario puede eliminar en una sección
 */
export function canDelete(menuItems: MenuItem[], url: string): boolean {
  return hasPermission(menuItems, url, 'eliminar')
}

/**
 * Obtener URLs accesibles para el usuario (solo menús con permiso de lectura)
 */
export function getAccessibleUrls(menuItems: MenuItem[]): string[] {
  return menuItems
    .filter((item) => item.permisos.leer)
    .map((item) => item.url)
}

/**
 * Verificar si el usuario tiene acceso a una URL
 */
export function hasAccessToUrl(menuItems: MenuItem[], url: string): boolean {
  return getAccessibleUrls(menuItems).includes(url)
}
