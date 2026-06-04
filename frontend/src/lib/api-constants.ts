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
  MENU_BY_PROFILE: (idPerfil: number) => `${API_BASE_URL}/menu/${idPerfil}`,
  ESTADOS: (tipo: string) => `${API_BASE_URL}/api/admin/catalogs/estados/${tipo}`,
  METODOS_PAGO: `${API_BASE_URL}/api/admin/catalogs/metodos-pago`,
  TIPOS_TRANSACCION: `${API_BASE_URL}/api/admin/catalogs/tipos-transaccion`,
  USUARIOS: `${API_BASE_URL}/api/admin/usuarios`,
  VEHICULOS: `${API_BASE_URL}/api/admin/vehiculos`,

  // Rutas y solicitudes
  SEARCH_ROUTES: `${API_BASE_URL}/api/routes/search`,
  CREATE_ROUTE: `${API_BASE_URL}/api/routes`,
  CREATE_SOLICITUD: (routeId: string | number) => `${API_BASE_URL}/api/routes/${routeId}/solicitudes`,
  CANCEL_SOLICITUD: (solicitudId: string | number) => `${API_BASE_URL}/api/routes/solicitudes/${solicitudId}/cancelar`,
  ACCEPT_SOLICITUD: (solicitudId: string | number) => `${API_BASE_URL}/api/routes/solicitudes/${solicitudId}/aceptar`,
  REJECT_SOLICITUD: (solicitudId: string | number) => `${API_BASE_URL}/api/routes/solicitudes/${solicitudId}/rechazar`,
  MY_SOLICITUDES: `${API_BASE_URL}/api/routes/solicitudes/mine`,
  DRIVER_SOLICITUDES: `${API_BASE_URL}/api/routes/solicitudes/driver`,
  DRIVER_ROUTES: `${API_BASE_URL}/api/routes/mis-rutas`,
  PASSENGER_DASHBOARD: `${API_BASE_URL}/api/routes/dashboard`,
  DRIVER_DASHBOARD: `${API_BASE_URL}/api/routes/driver-dashboard`,
  FINALIZE_ROUTE: (routeId: string | number) => `${API_BASE_URL}/api/routes/${routeId}/finalizar`,

  // Calificaciones
  USER_RATINGS: (documento: string) => `${API_BASE_URL}/api/calificaciones/${documento}`,
  USER_RATING_STATS: (documento: string) => `${API_BASE_URL}/api/calificaciones/${documento}/estadisticas`,
  CREATE_CALIFICACION: `${API_BASE_URL}/api/calificaciones`,

  // Cartera virtual / historial
  WALLET_SALDO: `${API_BASE_URL}/api/cartera/saldo`,
  WALLET_HISTORIAL: `${API_BASE_URL}/api/cartera/historial`,
  WALLET_RECARGA: `${API_BASE_URL}/api/cartera/recarga`,

  // Usuario
  DELETE_ACCOUNT: `${API_BASE_URL}/users/delete-account`,
  GET_USER_VEHICLES: `${API_BASE_URL}/api/usuario/vehiculos`,
  CREATE_USER_VEHICLE: `${API_BASE_URL}/api/usuario/vehiculos`,
  DELETE_USER_VEHICLE: (vehicleId: number) => `${API_BASE_URL}/api/usuario/vehiculos/${vehicleId}`,
  GET_TRAVEL_HISTORY: `${API_BASE_URL}/api/usuario/historial-viajes`,
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
    formFields: ['brandId', 'nombre', 'ano'],
    fieldTypes: {
      brandId: 'select',
      ano: 'number',
    },
    requiredFields: ['brandId', 'nombre', 'ano'],
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
    endpoint: API_ENDPOINTS.ESTADOS,
    fields: ['nombre', 'descripcion'],
    tipoOptions: [
      { label: 'Usuario', value: ESTADO_TIPOS.USUARIO },
      { label: 'Vehículo', value: ESTADO_TIPOS.VEHICULO },
      { label: 'Ruta', value: ESTADO_TIPOS.RUTA },
      { label: 'Solicitud', value: ESTADO_TIPOS.SOLICITUD },
      { label: 'Cupo ruta', value: ESTADO_TIPOS.CUPO },
    ],
    defaultTipo: ESTADO_TIPOS.USUARIO,
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
  usuarios: {
    label: 'Usuarios',
    icon: '👥',
    endpoint: API_ENDPOINTS.USUARIOS,
    fields: ['documento', 'nombres', 'primerApellido', 'email', 'telefono', 'perfil', 'estado'],
    formFields: [
      'documento',
      'nombres',
      'primerApellido',
      'segundoApellido',
      'email',
      'telefono',
      'fechaNacimiento',
      'idPerfil',
      'idEstado',
      'contrasena',
    ],
    fieldTypes: {
      fechaNacimiento: 'date',
      idPerfil: 'number',
      idEstado: 'number',
      contrasena: 'password',
    },
    requiredFields: ['documento', 'nombres', 'primerApellido', 'email', 'telefono', 'fechaNacimiento', 'idPerfil', 'idEstado'],
  },
  vehiculos: {
    label: 'Vehículos',
    icon: '🚗',
    endpoint: API_ENDPOINTS.VEHICULOS,
    fields: ['placa', 'marca', 'modelo', 'color', 'estado', 'documentoUsuario', 'fechaRegistro'],
    formFields: [
      'placa',
      'documentoUsuario',
      'idMarca',
      'idModelo',
      'idColor',
      'idEstado',
      'fechaRegistro',
      'soatUrl',
      'licenciaUrl',
      'tarjetaUrl',
      'vehiculoUrl',
    ],
    fieldTypes: {
      idMarca: 'number',
      idModelo: 'number',
      idColor: 'number',
      idEstado: 'number',
      fechaRegistro: 'date',
    },
    requiredFields: ['placa', 'documentoUsuario', 'idMarca', 'idModelo', 'idColor', 'idEstado', 'soatUrl', 'licenciaUrl', 'tarjetaUrl', 'vehiculoUrl'],
  },
};

export const PAGE_SIZE = 10;
export const MAX_RETRIES = 3;
export const TIMEOUT = 5000;
