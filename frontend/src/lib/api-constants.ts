/**
 * Constantes de API para el Admin Panel
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  // Catálogos
  PERFILES: `${API_BASE_URL}/api/admin/catalogs/perfiles`,
  MARCAS: `${API_BASE_URL}/api/admin/catalogs/marcas`,
  MODELOS: `${API_BASE_URL}/api/admin/catalogs/modelos`,
  COLORES: `${API_BASE_URL}/api/admin/catalogs/colores`,
  ESTADOS: (tipo: string) => `${API_BASE_URL}/api/admin/catalogs/estados/${tipo}`,
  METODOS_PAGO: `${API_BASE_URL}/api/admin/catalogs/metodos-pago`,
  TIPOS_TRANSACCION: `${API_BASE_URL}/api/admin/catalogs/tipos-transaccion`,
};

export const ESTADO_TIPOS = {
  USUARIO: 'usuario',
  VEHICULO: 'vehiculo',
  RUTA: 'ruta',
  SOLICITUD: 'solicitud',
  CUPO: 'cupo',
};

export const CATALOG_CONFIG = {
  perfiles: {
    label: 'Perfiles',
    icon: '👤',
    endpoint: API_ENDPOINTS.PERFILES,
    fields: ['nombre', 'descripcion'],
  },
  marcas: {
    label: 'Marcas de Vehículos',
    icon: '🏷️',
    endpoint: API_ENDPOINTS.MARCAS,
    fields: ['nombre'],
  },
  modelos: {
    label: 'Modelos de Vehículos',
    icon: '🚗',
    endpoint: API_ENDPOINTS.MODELOS,
    fields: ['nombre', 'ano'],
  },
  colores: {
    label: 'Colores',
    icon: '🎨',
    endpoint: API_ENDPOINTS.COLORES,
    fields: ['nombre'],
  },
  estados: {
    label: 'Estados',
    icon: '⚡',
    endpoint: API_ENDPOINTS.ESTADOS('usuario'),
    fields: ['nombre', 'descripcion'],
  },
  'metodos-pago': {
    label: 'Métodos de Pago',
    icon: '💳',
    endpoint: API_ENDPOINTS.METODOS_PAGO,
    fields: ['nombre'],
  },
  'tipos-transaccion': {
    label: 'Tipos de Transacción',
    icon: '💸',
    endpoint: API_ENDPOINTS.TIPOS_TRANSACCION,
    fields: ['nombre', 'descripcion'],
  },
};

export const PAGE_SIZE = 10;
export const MAX_RETRIES = 3;
export const TIMEOUT = 5000;
