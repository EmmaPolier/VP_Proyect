# 📋 FASES Y PLAN DE PRUEBAS - PROYECTO VAMOS PUES

**Fecha Generada**: 3 de Junio, 2026  
**Estado General**: 62.5% Completado  
**Etapa Actual**: FASE 7 - Historial & Ratings (70% del core)

---

## 📊 RESUMEN EJECUTIVO

| Métrica | Estado |
|---------|--------|
| **Infraestructura Base** | ✅ 100% Completa |
| **Autenticación & Perfiles** | ✅ 95% Completa |
| **Sistema de Rutas** | ⏳ 50% En Progreso |
| **Solicitudes de Cupo** | ⏳ 70% En Progreso |
| **Historial & Calificaciones** | ⏳ 30% En Progreso |
| **Cartera & Pagos** | ⏳ 30% En Progreso |
| **Validaciones & Seguridad** | ❌ 10% Sin Iniciar |
| **Testing Integral** | ❌ 0% Sin Iniciar |

---

# 🎯 PARTE 1: FASES DEL PROYECTO

## ✅ FASE 1: INFRAESTRUCTURA BASE (100% COMPLETADA)

### Componentes Completados
- [x] Pool de conexiones Oracle XE (db.js)
- [x] Servidor Express.js configurado
- [x] Base de datos: 23 tablas + 23 secuencias + índices
- [x] CORS habilitado
- [x] Variables de entorno configuradas
- [x] Next.js + TypeScript + Tailwind + Shadcn UI

### Validación
- ✅ Backend inicia en puerto 4000
- ✅ Frontend inicia en puerto 3000
- ✅ Conexión a Oracle XE verificada

---

## ✅ FASE 2: AUTENTICACIÓN & PERFILES (95% COMPLETADA)

### Componentes Completados
- [x] Registro de usuarios (email, contraseña, documento, teléfono)
- [x] Envío OTP por email (Nodemailer con timeout 5s)
- [x] Verificación de email
- [x] Login con JWT
- [x] Hash de contraseñas con bcryptjs
- [x] Sistema de perfiles: PASAJERO(1), CONDUCTOR(2), ADMIN(3)
- [x] Cambio de rol sin logout (switch-role)
- [x] Multi-perfil para mismo usuario (USUARIO_PERFIL)
- [x] Middleware de autorización por rol

### Usuarios de Prueba Iniciales
```
1. Davison Jaramillo - Documento: 1234567890
   - Rol: PASAJERO
   - Email: davisonjaramillo23251@elpoli.edu.co
   - Saldo Inicial: 0

2. Jose Luis Grajales - Documento: 0987654321
   - Rol: CONDUCTOR
   - Email: jose_grajales23251@elpoli.edu.co
   - Saldo Inicial: 0
   - Vehículo: RENAULT LOGAN Blanco, Placa ABC123

3. Emmanuel Echenique - Documento: 1122334455
   - Rol: ADMIN
   - Email: emmanuelechenique23251@elpoli.edu.co
   - Saldo Inicial: 99999 (especial para pruebas)
```

### ⚠️ BUGS CONOCIDOS A REPARAR
- 🔴 **Password Hash Bug**: Contraseñas almacenadas en plaintext, bcryptjs.compare falla
- 🔴 **OTP Verification**: No valida límite de reintentos
- 🟡 **OTP Timeout**: Falta limpiar códigos expirados

### Validación Requerida
- [ ] Flujo completo: Register → OTP Email → Verify → Login
- [ ] Cambio de rol con 2+ perfiles
- [ ] JWT válido después del login

---

## ✅ FASE 3: REGISTRO DE VEHÍCULOS (90% COMPLETADA)

### Componentes Completados
- [x] Tabla VEHICULO con campos: marca, modelo, color, placa, documentos
- [x] Catálogos: MARCA_VEHICULO (5), MODELO_VEHICULO (5), COLOR_VEHICULO (5)
- [x] Estados de vehículo: ACTIVO, INACTIVO, EN_REVISION
- [x] Validación: Solo CONDUCTOR puede registrar vehículos
- [x] Placa única (UNIQUE constraint)
- [x] Documentos: SOAT, Licencia, Tarjeta Propiedad, Foto

### Datos de Prueba Existentes
```
1 vehículo registrado:
- Marca: RENAULT
- Modelo: LOGAN
- Color: BLANCO
- Placa: ABC123 (ÚNICA)
- Conductor: Jose Luis (0987654321)
- Estado: ACTIVO
```

### Validación Requerida
- [ ] Crear vehículo como CONDUCTOR
- [ ] Placa duplicada rechazada
- [ ] Solo CONDUCTOR puede registrar
- [ ] Pasajero ve catálogos pero no puede registrar

---

## ⏳ FASE 4: SISTEMA DE RUTAS (50% IMPLEMENTADA)

### ✅ Backend Completado
- [x] Controlador: route.controller.js con 11 funciones
- [x] Tabla RUTA: origen, destino, hora, cupos, precio, vehículo, estado
- [x] Tabla PUNTO_ENCUENTRO: puntos intermedios de la ruta
- [x] Estados de ruta: ACTIVA, EN_CURSO, COMPLETADA, CANCELADA
- [x] Validación de cupos con FOR UPDATE (prevención race conditions)
- [x] Email notifications en creación de ruta
- [x] Endpoints: POST `/routes` (crear), GET `/routes/search` (buscar)

### ✅ Frontend Completado
- [x] Formulario crear ruta con Google Maps
- [x] Tabla "Mis Rutas" (conductor)
- [x] Búsqueda de rutas (pasajero)
- [x] Filtros básicos

### ❌ FALTA IMPLEMENTACIÓN
- [ ] Validación completa de campos
- [ ] Actualización en tiempo real de cupos
- [ ] Editar ruta (solo crear funciona)
- [ ] Cancelar ruta (change estado)
- [ ] Recurrencia de rutas
- [ ] Búsqueda avanzada: horario, precio, distancia
- [ ] Geolocalización en tiempo real

### Validación Requerida (CRÍTICO)
- [ ] Conductor crea ruta: POST `/routes`
  - Campos: origen_lat, origen_lng, destino_lat, destino_lng, hora_salida, cupos (1-6), precio
  - Validar: hora futura, cupos válidos, vehículo activo
  - BD: INSERT RUTA, INSERT PUNTO_ENCUENTRO
  - Response: rutaId, confirmación, email enviado

- [ ] Pasajero busca ruta: GET `/routes/search`
  - Query: origen_lat, origen_lng, destino_lat, destino_lng, fecha, radio_km
  - Response: lista rutas cercanas con info conductor + vehículo + cupos disponibles
  - Performance: verificar índices

---

## ⏳ FASE 5: SOLICITUDES DE CUPO (70% IMPLEMENTADA)

### ✅ Backend Completado
- [x] Tabla SOLICITUD_CUPO: ruta, pasajero, estado, fecha
- [x] Estados: PENDIENTE, ACEPTADA, RECHAZADA, CANCELADA
- [x] Endpoint aceptar solicitud: PUT `/requests/{id}/accept`
- [x] Endpoint rechazar solicitud: PUT `/requests/{id}/reject`
- [x] Validación: T6.1-T6.4 (no auto-reservar, cupos disponibles, etc)
- [x] Tabla CUPO_RUTA: registro de cupo aprobado
- [x] FOR UPDATE locking para prevenir race conditions

### ✅ Frontend Completado
- [x] Dashboard conductor: ver solicitudes pendientes
- [x] Tabla con botones Aceptar/Rechazar
- [x] Notificaciones al pasajero

### ❌ FALTA IMPLEMENTACIÓN
- [ ] Cancelar solicitud (pasajero)
- [ ] Contador de solicitudes en sidebar
- [ ] Notificaciones en tiempo real (Socket.IO)
- [ ] Historial de cambios de estado

### Validación Requerida (CRÍTICO)
- [ ] Pasajero solicita cupo: POST `/requests/spot`
  - Input: rutaId, punto_encuentro_id
  - Validaciones:
    - ❌ No puede solicitar su propia ruta
    - ❌ Cupo no duplicado
    - ❌ Cupos disponibles > 0
  - BD: INSERT SOLICITUD_CUPO (estado=PENDIENTE)
  - Response: solicitudId, confirmación

- [ ] Conductor ve solicitud y acepta/rechaza
  - GET: ver todas las solicitudes de SUS rutas
  - PUT `/requests/{id}/accept`:
    - Validar: cupos > 0, solicitud PENDIENTE
    - UPDATE: SOLICITUD_CUPO.estado = ACEPTADA
    - UPDATE: RUTA.cupos_disponibles -= 1
    - INSERT: CUPO_RUTA (record nuevo)
    - Email: notificar pasajero
  - PUT `/requests/{id}/reject`:
    - UPDATE: SOLICITUD_CUPO.estado = RECHAZADA
    - Email: notificar pasajero

- [ ] Verificar actualización de cupos en tiempo real

---

## ⏳ FASE 6: HISTORIAL & CALIFICACIONES (30% IMPLEMENTADA)

### ✅ Backend Parcial
- [x] Tabla HISTORIAL_VIAJE: registro viajes completados
- [x] Relación CUPO_RUTA → HISTORIAL_VIAJE
- [x] Tabla CALIFICACION: usuario, puntuación (1-5), comentario
- [x] Endpoints GET: `/historial` (list), `/historial/{id}` (detail)

### ✅ Frontend Estructura
- [x] Dashboard: sección "Mis Viajes"
- [x] Modal de calificaciones (estrellas 1-5)

### ❌ FALTA IMPLEMENTACIÓN
- [ ] POST `/historial`: crear registro de viaje completado
- [ ] Endpoint para finalizar ruta (EN_PROGRESO → COMPLETADA)
- [ ] Insertar HISTORIAL_VIAJE automático
- [ ] POST `/calificaciones`: crear calificación
- [ ] GET `/calificaciones/ruta/{id}`: ratings de una ruta
- [ ] Actualizar promedio USUARIO_PERFIL.CALIFICACION_UPE
- [ ] Validar participación en viaje antes de calificar
- [ ] Filtros histórico: fecha, conductor, calificación

### Validación Requerida
- [ ] Conductor finaliza ruta: ruta pasa a COMPLETADA
  - Generar HISTORIAL_VIAJE para cada CUPO_RUTA aceptado
  - Crear TRANSACCIONES_CARTERA para pagos
  - Notificar a pasajeros

- [ ] Ambos roles pueden calificar: POST `/calificaciones`
  - Input: rutaId, usuarioId, puntuación (1-5), comentario
  - Validar: usuario participó en viaje
  - Constraint: (solicitudId, rutaId, documento_calificador) UNIQUE
  - UPDATE: USUARIO_PERFIL.CALIFICACION_UPE (promedio)

- [ ] Ver calificaciones recibidas
  - GET `/calificaciones/me`: ratings recibidos
  - Mostrar: promedio, cantidad, comentarios

---

## ⏳ FASE 7: CARTERA & PAGOS (30% IMPLEMENTADA)

### ✅ Backend Parcial
- [x] Tabla TRANSACCIONES_CARTERA: usuario, tipo, monto, concepto
- [x] Tabla USUARIO.SALDO_CARTERA: saldo disponible
- [x] Tipos: RECARGA, PAGO_VIAJE, REEMBOLSO
- [x] Métodos pago: CARTERA_VIRTUAL, EFECTIVO

### ✅ Frontend Estructura
- [x] Dashboard: widget saldo
- [x] Sección transacciones

### ❌ FALTA IMPLEMENTACIÓN
- [ ] GET `/wallet/balance`: obtener saldo actual
- [ ] GET `/wallet/transactions`: historial movimientos
- [ ] POST `/wallet/recharge`: recargar saldo
- [ ] POST `/wallet/withdraw`: retirar saldo
- [ ] Validar saldo suficiente antes de aceptar cupo
- [ ] Deducción automática: PAGO_VIAJE al aceptar cupo
- [ ] Reembolso si cancela solicitud
- [ ] Transacciones atómicas (evitar inconsistencias)

### Validación Requerida
- [ ] Pasajero recarga saldo: POST `/wallet/recharge`
  - Input: monto, método (Stripe para prueba)
  - Crear: TRANSACCIONES_CARTERA (tipo=RECARGA)
  - UPDATE: USUARIO.SALDO_CARTERA += monto

- [ ] Validar saldo suficiente al aceptar cupo
  - Pasajero debe tener saldo >= precio_ruta
  - Si no: rechazar aceptación

- [ ] Deducción al pagar: PAGO_VIAJE
  - Usuario pasajero: SALDO -= precio
  - Usuario conductor: SALDO += (precio - comisión 10%)
  - Crear 2 registros TRANSACCIONES_CARTERA

- [ ] Reembolso si cancela: REEMBOLSO
  - Si pasajero cancela solicitud aceptada
  - SALDO += precio_original

---

## ❌ FASE 8: VALIDACIONES & SEGURIDAD (10% IMPLEMENTADA)

### ✅ Parcialmente Implementado
- [x] Hash bcryptjs en registro
- [x] JWT para autenticación
- [x] CORS configurado
- [x] Middleware de roles

### ❌ NO IMPLEMENTADO
- [ ] **Validación de entrada (Joi/Zod)**
  - Todos endpoints POST/PUT
  - Formato email, documento, teléfono
  - Números positivos para precios/cupos
  - Validación coordenadas GPS

- [ ] **Sanitización de datos**
  - XSS prevention
  - SQL injection prevention (usar prepared statements)

- [ ] **Rate limiting**
  - Límite intentos login
  - Límite solicitudes API

- [ ] **Recuperación de contraseña**
  - Tabla existe: RECUPERACION_CONTRASENA
  - Endpoint: POST `/auth/forgot-password`
  - Email con token + link
  - Validación token expirado

- [ ] **Validaciones de negocio**
  - Email duplicado en signup
  - Teléfono válido
  - Edad >= 18
  - Documento válido (Cédula Colombia)

---

## ❌ FASE 9: CHAT & NOTIFICACIONES (0% IMPLEMENTADA)

### NO EXISTE
- [ ] Socket.IO para mensajería en tiempo real
- [ ] Notificaciones push
- [ ] Email automáticas en eventos
- [ ] Alertas en tiempo real

### Casos de Uso
- Pasajero ↔ Conductor: coordinar punto encuentro
- Notificación: "Solicitud aceptada", "Viaje comenzado"
- Chat durante el viaje

---

## ❌ FASE 10: TESTING INTEGRAL (0% IMPLEMENTADA)

### NO EXISTE
- [ ] Unit tests (Jest/Vitest)
- [ ] Integration tests
- [ ] E2E tests (Cypress/Playwright)
- [ ] Test coverage reports

---

## ❌ FASE 11: ADMIN & REPORTES (5% IMPLEMENTADA)

### ✅ Básico
- [x] Rutas admin creadas
- [x] Permisos ADMIN en MENU_PERFIL

### ❌ NO IMPLEMENTADO
- [ ] Dashboard admin completo
- [ ] Gestión usuarios: suspender, activar, ver perfiles
- [ ] Gestión catálogos: CRUD marcas, modelos, colores
- [ ] Reportes: usuarios activos, rutas completadas, ingresos
- [ ] Gráficas de uso
- [ ] Auditoria de eventos

---

## ❌ FASE 12: DEPLOY & DEVOPS (0% IMPLEMENTADA)

### NO EXISTE
- [ ] Docker/Docker Compose
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Documentación API (Swagger)
- [ ] .env.example
- [ ] Logs estructurados
- [ ] Monitoring
- [ ] Database backups

---

---

# 🧪 PARTE 2: PLAN DE PRUEBAS HASTA ETAPA ACTUAL

## 📋 PRUEBAS POR ETAPA

### ETAPA 1-2: AUTENTICACIÓN (15 Pruebas)

#### 1.1 Registro de Usuarios
- [ ] **Prueba 1.1.1**: Registrar usuario pasajero exitosamente
  - Email válido, contraseña fuerte
  - Verificar: Usuario creado, estado PENDIENTE, OTP enviado
  
- [ ] **Prueba 1.1.2**: Registrar usuario conductor exitosamente
  - Mismo flujo que pasajero
  - Verificar: USUARIO_PERFIL con rol CONDUCTOR creado

- [ ] **Prueba 1.1.3**: Rechazar registro con email duplicado
  - Intentar registrar con email existente
  - Verificar: Error 400 "Email ya existe"

- [ ] **Prueba 1.1.4**: Rechazar registro con documento duplicado
  - Intentar registrar con cédula existente
  - Verificar: Error 400 "Documento ya registrado"

- [ ] **Prueba 1.1.5**: Validar formato email en registro
  - Email inválido (ej: "notanemail")
  - Verificar: Error 400 "Formato email inválido"

- [ ] **Prueba 1.1.6**: Validar teléfono en registro
  - Teléfono inválido (<10 dígitos)
  - Verificar: Error 400 "Teléfono inválido"

#### 1.2 Verificación de Email (OTP)
- [ ] **Prueba 1.2.1**: Envío de OTP exitoso
  - Registrar usuario → OTP enviado por email
  - Verificar: Email recibido en bandeja

- [ ] **Prueba 1.2.2**: Verificar OTP correcto
  - Copiar código de email
  - POST `/verify-email` con código correcto
  - Verificar: Usuario estado = ACTIVO

- [ ] **Prueba 1.2.3**: Rechazar OTP incorrecto
  - Usar código erróneo
  - Verificar: Error 401 "Código inválido"

- [ ] **Prueba 1.2.4**: Rechazar OTP expirado (>5 min)
  - Esperar 5+ minutos, usar OTP antiguo
  - Verificar: Error 401 "Código expirado"

- [ ] **Prueba 1.2.5**: Reintentar OTP (máx 3)
  - Enviar 4 códigos incorrectos
  - Verificar: 4to intento rechazado

#### 1.3 Login
- [ ] **Prueba 1.3.1**: Login exitoso con credenciales correctas
  - Email + contraseña válidos
  - Verificar: JWT retornado, localStorage updated

- [ ] **Prueba 1.3.2**: Rechazar login con contraseña incorrecta
  - Contraseña errónea
  - Verificar: Error 401 "Credenciales inválidas"

- [ ] **Prueba 1.3.3**: Rechazar login con usuario no verificado
  - Usuario en estado PENDIENTE (OTP no verificado)
  - Verificar: Error 401 "Email no verificado"

- [ ] **Prueba 1.3.4**: Rechazar login con usuario suspendido
  - Usuario en estado SUSPENDIDO
  - Verificar: Error 403 "Usuario suspendido"

#### 1.4 Cambio de Rol (Sin Logout)
- [ ] **Prueba 1.4.1**: Usuario con 2 roles cambia de PASAJERO a CONDUCTOR
  - POST `/switch-role` con rol CONDUCTOR
  - Verificar: JWT actualizado con nuevo rol, sesión activa

- [ ] **Prueba 1.4.2**: Cambio de rol persiste en sesión
  - Cambiar rol → acceder endpoint CONDUCTOR-only
  - Verificar: Acceso permitido

---

### ETAPA 3: REGISTRO DE VEHÍCULOS (8 Pruebas)

- [ ] **Prueba 2.1**: CONDUCTOR registra vehículo exitosamente
  - POST `/vehicles` con datos válidos
  - Verificar: Vehículo creado, estado ACTIVO

- [ ] **Prueba 2.2**: PASAJERO NO puede registrar vehículo
  - POST `/vehicles` como pasajero
  - Verificar: Error 403 "Solo conductores pueden registrar"

- [ ] **Prueba 2.3**: Rechazar placa duplicada
  - Registrar vehículo con placa ABC123 (ya existe)
  - Verificar: Error 409 "Placa ya existe"

- [ ] **Prueba 2.4**: Validar combinación marca-modelo válida
  - POST con marca CHEVROLET + modelo LOGAN (inválido)
  - Verificar: Error 400 "Combinación marca-modelo no válida"

- [ ] **Prueba 2.5**: Validar color existe
  - POST con color "ROSA" (no existe)
  - Verificar: Error 400 "Color no existe"

- [ ] **Prueba 2.6**: GET catálogos disponibles
  - GET `/catalogs/brands` → 5 marcas
  - GET `/catalogs/models` → 5 modelos
  - GET `/catalogs/colors` → 5 colores
  - Verificar: Datos correctos

- [ ] **Prueba 2.7**: CONDUCTOR con vehículo puede cambiar a PASAJERO
  - Usuario con vehículo registrado
  - POST `/switch-role` a PASAJERO
  - Verificar: Rol cambió, vehículo sigue asignado

- [ ] **Prueba 2.8**: Desactivar vehículo
  - CONDUCTOR actualiza vehículo: estado = INACTIVO
  - Verificar: No aparece en búsquedas de rutas

---

### ETAPA 4: SISTEMA DE RUTAS (20 Pruebas)

#### 2.1 Crear Rutas
- [ ] **Prueba 3.1.1**: CONDUCTOR crea ruta exitosamente
  - POST `/routes` con datos válidos
  - Input: origen_lat, origen_lng, destino_lat, destino_lng, hora_salida, cupos, precio
  - Verificar: rutaId creado, estado ACTIVA, email enviado

- [ ] **Prueba 3.1.2**: PASAJERO NO puede crear ruta
  - POST `/routes` como pasajero
  - Verificar: Error 403

- [ ] **Prueba 3.1.3**: Rechazar cupos < 1 o > 6
  - POST con cupos=0 o cupos=7
  - Verificar: Error 400 "Cupos debe estar entre 1-6"

- [ ] **Prueba 3.1.4**: Rechazar hora pasada
  - POST con hora_salida en pasado
  - Verificar: Error 400 "Hora debe ser futura"

- [ ] **Prueba 3.1.5**: Rechazar precio <= 0
  - POST con precio=-100 o precio=0
  - Verificar: Error 400 "Precio debe ser positivo"

- [ ] **Prueba 3.1.6**: Validar vehículo activo
  - CONDUCTOR con vehículo INACTIVO intenta crear ruta
  - Verificar: Error 400 "Vehículo no está activo"

- [ ] **Prueba 3.1.7**: Crear ruta actualiza CUPO_RUTA
  - Crear ruta con 4 cupos
  - Verificar: RUTA.cupos_disponibles = 4

- [ ] **Prueba 3.1.8**: Email notificación en creación de ruta
  - Crear ruta
  - Verificar: Email enviado a conductor con detalles

#### 2.2 Buscar Rutas
- [ ] **Prueba 3.2.1**: PASAJERO busca rutas exitosamente
  - GET `/routes/search?origen_lat=...&destino_lat=...&fecha=2026-06-03&radio=5`
  - Verificar: Retorna lista de rutas cercanas con info conductor

- [ ] **Prueba 3.2.2**: Filtro por radio (km)
  - Buscar rutas en radio 5km
  - Verificar: Solo rutas dentro del radio (usar haversine distance)

- [ ] **Prueba 3.2.3**: Filtro por fecha
  - Buscar rutas para fecha específica
  - Verificar: Solo rutas de esa fecha

- [ ] **Prueba 3.2.4**: Filtro por precio máximo
  - GET con precio_max=50000
  - Verificar: Solo rutas <= 50000

- [ ] **Prueba 3.2.5**: Búsqueda retorna cupos disponibles
  - GET `/routes/search`
  - Verificar: Cada ruta muestra cupos_disponibles actual

- [ ] **Prueba 3.2.6**: Búsqueda retorna info conductor y vehículo
  - GET retorna: nombre conductor, avatar, calificación, marca-modelo vehículo, placa

- [ ] **Prueba 3.2.7**: Búsqueda vacía si no hay rutas
  - Buscar con parámetros que no coinciden
  - Verificar: Array vacío, no error

#### 2.3 Detalles de Ruta
- [ ] **Prueba 3.3.1**: GET `/routes/{id}` retorna detalles completos
  - Origen, destino, hora, cupos, precio, conductor info, vehículo info

- [ ] **Prueba 3.3.2**: GET incluye puntos de encuentro
  - Ruta tiene PUNTO_ENCUENTRO registrados
  - Verificar: Lista de puntos en response

- [ ] **Prueba 3.3.3**: GET retorna solicitudes pendientes para conductor
  - CONDUCTOR ve qué pasajeros solicitaron cupo

#### 2.4 Estados de Ruta
- [ ] **Prueba 3.4.1**: Ruta comienza en estado ACTIVA
  - Crear ruta, verificar estado = ACTIVA

- [ ] **Prueba 3.4.2**: CONDUCTOR cambia ruta a EN_CURSO
  - Iniciar viaje: PUT `/routes/{id}` con estado EN_CURSO
  - Verificar: cambio de estado, notificación a pasajeros

- [ ] **Prueba 3.4.3**: CONDUCTOR no puede editar si hay solicitudes aceptadas
  - Ruta tiene CUPO_RUTA.estado = ACEPTADA
  - Intentar editar: precio, hora, cupos
  - Verificar: Error 409 "No se puede editar ruta con cupos reservados"

---

### ETAPA 5: SOLICITUDES DE CUPO (15 Pruebas)

#### 3.1 Crear Solicitud
- [ ] **Prueba 4.1.1**: PASAJERO solicita cupo exitosamente
  - POST `/requests/spot` con rutaId válido
  - Verificar: SOLICITUD_CUPO creada, estado PENDIENTE

- [ ] **Prueba 4.1.2**: Rechazar si PASAJERO es el conductor
  - Pasajero intenta solicitar en propia ruta
  - Verificar: Error 400 "No puedes solicitar en tu propia ruta"

- [ ] **Prueba 4.1.3**: Rechazar si ruta NO tiene cupos
  - Ruta con cupos_disponibles = 0
  - Verificar: Error 400 "No hay cupos disponibles"

- [ ] **Prueba 4.1.4**: Rechazar si PASAJERO ya solicitó en esa ruta
  - Pasajero solicita ruta, luego intenta de nuevo
  - Verificar: Error 409 "Ya has solicitado cupo en esta ruta"

- [ ] **Prueba 4.1.5**: Validación T6.1: Auto-reserva
  - Solicitud previene que pasajero reserve 2+ cupos en misma ruta
  - Verificar: Constraint aplicado

- [ ] **Prueba 4.1.6**: Validación T6.2: Cupo duplicado
  - Evitar 2 SOLICITUD_CUPO del mismo pasajero en misma ruta
  - Verificar: UNIQUE constraint

- [ ] **Prueba 4.1.7**: Email notificación al CONDUCTOR
  - Pasajero solicita cupo
  - Verificar: Email enviado al conductor con detalles pasajero

#### 3.2 Aceptar Solicitud
- [ ] **Prueba 4.2.1**: CONDUCTOR acepta solicitud exitosamente
  - PUT `/requests/{id}/accept`
  - Verificar: SOLICITUD_CUPO.estado = ACEPTADA, cupos_disponibles -= 1

- [ ] **Prueba 4.2.2**: Rechazo si cupos_disponibles = 0
  - Ruta sin cupos
  - PUT para aceptar
  - Verificar: Error 400 "No hay cupos disponibles"

- [ ] **Prueba 4.2.3**: Email notificación al PASAJERO (aceptada)
  - Conductor acepta
  - Verificar: Email "Tu solicitud ha sido aceptada"

- [ ] **Prueba 4.2.4**: Crear CUPO_RUTA al aceptar
  - Aceptar solicitud
  - Verificar: Nuevo registro en CUPO_RUTA con estado RESERVADO

- [ ] **Prueba 4.2.5**: CONDUCTOR ve múltiples solicitudes
  - Ruta con 3 solicitudes diferentes
  - GET `/requests` (conductor)
  - Verificar: Todas aparecen en tabla

#### 3.3 Rechazar Solicitud
- [ ] **Prueba 4.3.1**: CONDUCTOR rechaza solicitud
  - PUT `/requests/{id}/reject`
  - Verificar: SOLICITUD_CUPO.estado = RECHAZADA

- [ ] **Prueba 4.3.2**: Email notificación al PASAJERO (rechazada)
  - Conductor rechaza
  - Verificar: Email "Tu solicitud ha sido rechazada"

- [ ] **Prueba 4.3.3**: Rechazar no libera cupo (porque nunca fue aceptado)
  - Solicitud siempre en PENDIENTE
  - Rechazar: cupos_disponibles NO se incrementa

---

### ETAPA 6: HISTORIAL & CALIFICACIONES (12 Pruebas)

#### 4.1 Historial de Viajes
- [ ] **Prueba 5.1.1**: CONDUCTOR finaliza ruta exitosamente
  - PUT `/routes/{id}/complete` o similar
  - Verificar: Estado → COMPLETADA, HISTORIAL_VIAJE creado

- [ ] **Prueba 5.1.2**: Crear HISTORIAL_VIAJE para cada CUPO_RUTA aceptado
  - Ruta con 2 cupos aceptados
  - Finalizar ruta
  - Verificar: 2 registros en HISTORIAL_VIAJE

- [ ] **Prueba 5.1.3**: GET `/historial` retorna viajes del usuario
  - PASAJERO: viajes donde fue pasajero
  - CONDUCTOR: viajes donde fue conductor
  - Verificar: Lista correcta

- [ ] **Prueba 5.1.4**: GET `/historial/{id}` retorna detalles viaje
  - Origen, destino, hora, otro usuario, precio, fecha

- [ ] **Prueba 5.1.5**: Historial filtra por rol
  - Mismo usuario con 2 roles
  - Cambiar rol
  - GET `/historial` debe mostrar solo viajes del rol actual

- [ ] **Prueba 5.1.6**: HISTORIAL_VIAJE registra fecha completado
  - Viaje completado
  - Verificar: FECHA_COMPLETADO_HVI = SYSDATE

#### 4.2 Calificaciones
- [ ] **Prueba 5.2.1**: PASAJERO califica CONDUCTOR post-viaje
  - POST `/ratings` con rutaId, puntuación (1-5), comentario
  - Verificar: CALIFICACION creada

- [ ] **Prueba 5.2.2**: CONDUCTOR califica PASAJERO post-viaje
  - POST `/ratings` (el conductor califica)
  - Verificar: CALIFICACION creada

- [ ] **Prueba 5.2.3**: Validar puntuación entre 1-5
  - POST con puntuación 0 o 6
  - Verificar: Error 400 "Puntuación debe ser 1-5"

- [ ] **Prueba 5.2.4**: Validar participación en viaje
  - Usuario intenta calificar viaje donde no participó
  - Verificar: Error 403 "No participaste en este viaje"

- [ ] **Prueba 5.2.5**: Actualizar promedio USUARIO_PERFIL.CALIFICACION_UPE
  - Usuario recibe 2 calificaciones: 4 y 5 (promedio 4.5)
  - Verificar: USUARIO_PERFIL.CALIFICACION_UPE = 4.5

- [ ] **Prueba 5.2.6**: Constraint UNIQUE (solicitudId, rutaId, documento_calificador)
  - Usuario intenta calificar 2 veces el mismo viaje
  - Verificar: Error 409 "Ya has calificado este viaje"

- [ ] **Prueba 5.2.7**: GET `/ratings/{usuarioId}` retorna historial calificaciones
  - Ver todas las calificaciones que recibió un usuario

---

### ETAPA 7: CARTERA & PAGOS (10 Pruebas)

#### 5.1 Balance y Transacciones
- [ ] **Prueba 6.1.1**: GET `/wallet/balance` retorna saldo actual
  - USUARIO.SALDO_CARTERA
  - Verificar: Valor correcto, formato número

- [ ] **Prueba 6.1.2**: GET `/wallet/transactions` retorna historial
  - Lista todos TRANSACCIONES_CARTERA del usuario
  - Campos: fecha, tipo (RECARGA/PAGO_VIAJE/REEMBOLSO), monto, saldo_anterior, saldo_nuevo

- [ ] **Prueba 6.1.3**: Filtro transacciones por tipo
  - GET con filtro tipo=RECARGA
  - Verificar: Solo RECARGA

- [ ] **Prueba 6.1.4**: Filtro transacciones por fecha
  - GET con rango de fechas
  - Verificar: Solo transacciones en rango

#### 5.2 Recarga de Saldo
- [ ] **Prueba 6.2.1**: PASAJERO recarga saldo exitosamente
  - POST `/wallet/recharge` con monto 50000
  - Crear TRANSACCIONES_CARTERA (tipo=RECARGA)
  - Verificar: USUARIO.SALDO_CARTERA += 50000

- [ ] **Prueba 6.2.2**: Rechazar monto <= 0
  - POST con monto -1000
  - Verificar: Error 400

- [ ] **Prueba 6.2.3**: Límite máximo de recarga
  - POST con monto 10000000 (irreal)
  - Verificar: Error 400 (si existe límite)

#### 5.3 Pago de Viajes
- [ ] **Prueba 6.3.1**: Validar saldo suficiente antes de aceptar cupo
  - PASAJERO con saldo 10000, ruta cuesta 50000
  - Solicitar → Conductor acepta
  - Verificar: Error 400 "Saldo insuficiente"

- [ ] **Prueba 6.3.2**: Deducción PAGO_VIAJE al aceptar cupo
  - PASAJERO con saldo 100000
  - Ruta cuesta 30000
  - Conductor acepta solicitud
  - Verificar: 
    - USUARIO.SALDO_CARTERA -= 30000 (pasajero)
    - TRANSACCIONES_CARTERA tipo=PAGO_VIAJE creada
    - USUARIO.SALDO_CARTERA += 27000 (conductor, sin 10% comisión)

- [ ] **Prueba 6.3.3**: Transacción PAGO_VIAJE es atómica
  - Si falla deducción pasajero → no aplica abono conductor
  - Verificar: Consistencia BD

#### 5.4 Reembolsos
- [ ] **Prueba 6.4.1**: Reembolso si PASAJERO cancela solicitud aceptada
  - PASAJERO cancela SOLICITUD_CUPO (estado=ACEPTADA)
  - Crear TRANSACCIONES_CARTERA tipo=REEMBOLSO
  - Verificar: SALDO_CARTERA += precio original

---

### INTEGRACIÓN: FLUJOS COMPLETOS (15 Pruebas)

#### 6.1 Flujo Conductor: Crear Ruta → Recibir Solicitudes → Aceptar
- [ ] **Prueba 7.1.1**: Flujo completo (CONDUCTOR)
  1. Login como CONDUCTOR (Jose Luis)
  2. POST `/routes` → crea ruta Medellín-Bogotá, 4 cupos, $50.000
  3. GET `/routes/conductor/my-routes` → ve su ruta
  4. Recibe notificación email

- [ ] **Prueba 7.1.2**: Flujo completo (PASAJERO solicita)
  1. Login como PASAJERO (Davison)
  2. Recarga saldo: POST `/wallet/recharge` $100.000
  3. GET `/routes/search` → encuentra ruta del conductor
  4. POST `/requests/spot` → solicita cupo
  5. Notificación email al conductor

- [ ] **Prueba 7.1.3**: Flujo completo (CONDUCTOR acepta)
  1. Login como CONDUCTOR
  2. GET `/requests` → ve solicitud de Davison
  3. PUT `/requests/{id}/accept` → acepta
  4. Verificar: cupos_disponibles 4→3, SALDO Davison -$50k, SALDO Jose +$45k (comisión)
  5. Email notificación a Davison

- [ ] **Prueba 7.1.4**: Flujo completo (Finalizar ruta)
  1. CONDUCTOR marca ruta como EN_PROGRESO
  2. CONDUCTOR marca ruta como COMPLETADA
  3. Verificar: HISTORIAL_VIAJE creado para Davison

#### 6.2 Flujo Calificación Post-Viaje
- [ ] **Prueba 7.2.1**: CONDUCTOR califica PASAJERO
  1. Después de viaje completado
  2. POST `/ratings` con puntuación 5, comentario "Excelente pasajero"
  3. Verificar: CALIFICACION creada, USUARIO_PERFIL.CALIFICACION actualizada

- [ ] **Prueba 7.2.2**: PASAJERO califica CONDUCTOR
  1. Después de viaje completado
  2. POST `/ratings` con puntuación 5, comentario "Buen conductor"
  3. Verificar: CALIFICACION creada, USUARIO_PERFIL.CALIFICACION actualizada

#### 6.3 Flujo Con Cambio de Rol
- [ ] **Prueba 7.3.1**: Usuario PASAJERO cambia a CONDUCTOR
  1. Davison (PASAJERO) → POST `/switch-role` a CONDUCTOR
  2. POST `/vehicles` → registra vehículo
  3. POST `/routes` → crea ruta
  4. Verificar: Rol cambió, puede hacer acciones de conductor

- [ ] **Prueba 7.3.2**: Usuario CONDUCTOR cambia a PASAJERO
  1. Jose Luis (CONDUCTOR) → POST `/switch-role` a PASAJERO
  2. GET `/routes/search` → puede buscar rutas
  3. POST `/requests/spot` → puede solicitar cupos
  4. Verificar: Permisos aplicados correctamente

#### 6.4 Validaciones de Negocio
- [ ] **Prueba 7.4.1**: No permitir auto-reserva (T6.1)
  - CONDUCTOR intenta solicitar cupo en propia ruta
  - Verificar: Error 400

- [ ] **Prueba 7.4.2**: Cupo no duplicado (T6.2)
  - PASAJERO intenta solicitar 2 veces misma ruta
  - Verificar: Error 409

- [ ] **Prueba 7.4.3**: Race condition con FOR UPDATE
  - 2 pasajeros intentan simultáneamente solicitar último cupo
  - Verificar: Solo 1 solicitud aceptada, otro rechazado por "Sin cupos"

- [ ] **Prueba 7.4.4**: Creación de perfil usuario multi-rol
  - Mismo usuario puede ser PASAJERO + CONDUCTOR
  - Cambiar rol sin logout
  - Verificar: Permisos correctos para cada rol

- [ ] **Prueba 7.4.5**: Validaciones atomicidad en pago
  - Si falla INSERT TRANSACCIONES_CARTERA → no se aplica cambio SALDO
  - Verificar: Transacción se revierte completamente

---

## 📊 MATRIZ DE COBERTURA DE PRUEBAS

```
ETAPA / COMPONENTE              PRUEBAS TOTALES    ESTADO
────────────────────────────────────────────────
1. Autenticación                15 pruebas         ⏳ Falta testing
2. Vehículos                    8 pruebas          ⏳ Falta testing
3. Sistema Rutas               20 pruebas         ⏳ Falta testing
4. Solicitudes Cupo            15 pruebas         ⏳ Falta testing
5. Historial & Ratings         12 pruebas         ⏳ Falta testing
6. Cartera & Pagos             10 pruebas         ⏳ Falta testing
7. Flujos Integrales           15 pruebas         ⏳ Falta testing
────────────────────────────────────────────────
TOTAL HASTA ETAPA ACTUAL       95 PRUEBAS         ⏳ 0% Ejecutadas
```

---

## 🚨 BUGS CRÍTICOS A REPARAR ANTES DE TESTING

```
1. 🔴 PASSWORD HASH BUG
   - Contraseñas guardadas en plaintext
   - bcryptjs.compare() siempre falla
   - IMPACTO: Login imposible
   - PRIORIDAD: CRÍTICA (1 hora)

2. 🔴 CARTERA TRANSACTION NOT ATOMIC
   - Accept sin deducción de pago
   - IMPACTO: Pérdida de dinero
   - PRIORIDAD: CRÍTICA (30 min)

3. 🟡 OTP VERIFICATION
   - No valida límite de reintentos (máx 3)
   - IMPACTO: Fuerza bruta posible
   - PRIORIDAD: ALTA

4. 🟡 OTP CLEANUP
   - Códigos expirados no se limpian
   - IMPACTO: BD crece innecesariamente
   - PRIORIDAD: MEDIA
```

---

## 📝 NOTAS IMPORTANTES

### Datos de Prueba Disponibles
- 3 usuarios creados: Davison, Jose Luis, Emmanuel
- 1 vehículo: RENAULT LOGAN Blanca, placa ABC123
- Catálogos completos: 5 marcas, 5 modelos, 5 colores

### Convenciones de Testing
- Documentos: 10 dígitos cédula Colombia
- Correos: formato válido (@elpoli.edu.co)
- Teléfono: formato +57 (código país)
- Precios: COP (moneda local)
- Distancias: km
- Horarios: Formato HH24:MI

### Stack para Testing Manual
- Postman: pruebas API backend
- Next.js dev: frontend en http://localhost:3000
- MySQL Workbench o similar: inspeccionar BD
- MailHog o similar: capturar emails de prueba

---

**Generado**: 3 de Junio, 2026  
**Última Actualización**: 12:45 PM  
**Próxima Revisión**: Post-ejecución de pruebas
