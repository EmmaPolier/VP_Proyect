# 📋 FASES DEL PROYECTO - VP Project (Vamos Pues)

## 📊 Estado General
**Etapa Actual**: Fase 2 - Funcionalidad Core (40% completado)
- ✅ Infraestructura base implementada
- ✅ Autenticación y registro funcionando
- ⏳ Funcionalidad de viajes en progreso
- ❌ Características avanzadas pendientes

---

## 🎯 FASE 1: Infraestructura Base ✅ COMPLETADA

### Objetivos Alcanzados
- [x] Configurar Oracle XE con esquema completo
- [x] Backend Express.js + pool conexiones
- [x] Frontend Next.js + TypeScript + Tailwind
- [x] Sistema autenticación (JWT + bcryptjs)
- [x] Envío de OTP por email
- [x] Roles y permisos base (CONDUCTOR, PASAJERO)

### Componentes Entregados
```
✅ Backend:   Express + DB pool + Auth controller
✅ Frontend:  Next.js + Login/Signup pages + Dashboard base
✅ BD:        Esquema Oracle con catálogos y sequences
✅ Servicios: Nodemailer para OTP
```

### Endpoints Disponibles
```
POST   /register              - Crear usuario
POST   /verify                - Verificar OTP
POST   /login                 - Login
POST   /vehicles/register     - Registrar vehículo
GET    /health                - Health check
```

---

## 🚀 FASE 2: Funcionalidad Core (EN PROGRESO - 40%)

### 2.1 Sistema de Rutas (CRÍTICA)

#### 2.1.1 Backend - Conductor
- [ ] POST `/routes` - Crear ruta
  - Input: origen, destino, fecha/hora, cupos, precio/cupo
  - Validar: conductor activo, vehículo asignado
  - Output: ID_RUTA, estado PLANEADA
  
- [ ] GET `/routes/:driverId` - Listar rutas del conductor
  - Filtro: estado (PLANEADA, EN_CURSO, COMPLETADA, CANCELADA)
  - Incluir: cupos disponibles, solicitudes pendientes
  
- [ ] PUT `/routes/:routeId` - Actualizar ruta
  - Permitir: modificar hora/cupos antes de iniciar
  - Validar: no hay solicitudes aceptadas
  
- [ ] DELETE `/routes/:routeId` - Cancelar ruta
  - Notificar pasajeros
  - Revertir transacciones si aplica

#### 2.1.2 Backend - Pasajero
- [ ] GET `/routes/search` - Buscar rutas disponibles
  - Filtros: origen, destino, fecha, hora, precio
  - Excluir: propias rutas, rutas canceladas, llenas
  
- [ ] POST `/requests/spot` - Solicitar cupo en ruta
  - Input: ID_RUTA, cantidad cupos
  - Output: ID_SOLICITUD_CUPO, estado PENDIENTE
  
- [ ] GET `/requests/pending` - Ver solicitudes pendientes
  - Estado: aceptadas, rechazadas, pendientes
  
- [ ] DELETE `/requests/:requestId` - Cancelar solicitud
  - Validar: antes de aceptarse

#### 2.1.3 Backend - Aceptar/Rechazar
- [ ] GET `/routes/:routeId/requests` - Ver solicitudes (conductor)
  - Mostrar: pasajero, cantidad cupos, estado
  
- [ ] PUT `/requests/:requestId/accept` - Aceptar solicitud
  - Validar: cupos disponibles
  - Crear: entrada en CUPO_RUTA
  - Restar: cupos disponibles
  
- [ ] PUT `/requests/:requestId/reject` - Rechazar solicitud
  - Estado: RECHAZADA en SOLICITUD_CUPO

#### 2.1.4 Frontend - Conductor
- [ ] Página crear ruta (formulario)
  - Campos: origen, destino, fecha, hora, cupos, precio
  - Validar cliente: campos requeridos, formato
  
- [ ] Dashboard conductor - Mis rutas
  - Tabla: origen, destino, hora, cupos disponibles, estado
  - Acciones: ver solicitudes, iniciar, cancelar
  
- [ ] Modal solicitudes pendientes
  - Cards: foto pasajero, nombre, aceptar/rechazar

#### 2.1.5 Frontend - Pasajero
- [ ] Página búsqueda de rutas
  - Buscador: origen, destino, fecha
  - Filtros: precio máximo, hora, horario
  - Resultados: tarjetas con info ruta, conductor rating
  
- [ ] Modal detalles ruta
  - Info: conductor, vehículo, puntos encuentro
  - Botón: solicitar cupo
  
- [ ] Dashboard pasajero - Mis solicitudes
  - Estados: pendientes, aceptadas, canceladas
  - Acciones: cancelar solicitud

### 2.2 Historial de Viajes (ALTA)

#### Backend
- [ ] GET `/trips/history` - Historial viajes usuario
  - Filtro: rol (conductor/pasajero), rango fechas
  - Incluir: origen, destino, conductor/pasajero, fecha, calificación
  
- [ ] POST `/trips/:tripId/complete` - Marcar viaje completado
  - Validar: todos pasajeros confirmados
  - Estado: COMPLETADA en HISTORIAL_VIAJE
  
- [ ] GET `/trips/:tripId` - Detalles viaje
  - Pasajeros, conductor, horario real

#### Frontend
- [ ] Dashboard - Pestaña Historial
  - Filtros: fecha, estado, conductor/pasajero
  - Tabla: con detalles y opción calificar

### 2.3 Sistema de Calificaciones (ALTA)

#### Backend
- [ ] POST `/ratings` - Dejar calificación
  - Input: rated_user, rater_user, puntos (1-5), comentario, viaje
  - Validar: usuario participó en viaje
  
- [ ] GET `/users/:userId/rating` - Rating promedio usuario
  
- [ ] GET `/ratings/user/:userId` - Calificaciones recibidas

#### Frontend
- [ ] Modal calificar (después viaje completado)
  - Stars (1-5), comentario, botón enviar
  
- [ ] Perfil usuario - mostrar rating promedio
  - Incluir: total calificaciones, últimos comentarios

---

## 💾 FASE 3: Gestión de Cartera y Pagos (MEDIA)

### 3.1 Backend
- [ ] GET `/wallet/balance` - Saldo actual usuario
  - Total disponible, en tránsito, bloqueado
  
- [ ] GET `/transactions` - Historial transacciones
  - Filtros: tipo (pago, reembolso, depósito), rango fechas
  - Incluir: monto, estado, descripción, fecha
  
- [ ] POST `/payment/process` - Procesar pago
  - Cuando: pasajero acepta ruta, conductor inicia viaje
  - Tipo: DEBITO, bloquear en cartera
  
- [ ] POST `/refund` - Reembolso
  - Cuando: viaje cancelado, rechazo solicitud
  - Tipo: CREDITO, retornar a cartera

### 3.2 Frontend
- [ ] Dashboard - Pestaña Cartera
  - Mostrar: saldo disponible, en tránsito, historial
  
- [ ] Método de pago (integración Stripe/PayPal)
  - Depositar saldo, agregar tarjeta

---

## 🗺️ FASE 4: Ubicación y Mapas (MEDIA)

### 4.1 Backend
- [ ] POST `/routes/:routeId/waypoints` - Crear puntos encuentro
  - Input: coordenadas (lat, lon), dirección, descripción
  - Calcular: distancia entre puntos
  
- [ ] GET `/routes/:routeId/waypoints` - Listar puntos
  
- [ ] POST `/location/current` - Actualizar ubicación (tiempo real)
  - Input: usuario ID, coordenadas
  - Guardar: en caché para pasajeros

### 4.2 Frontend
- [ ] Mapa búsqueda de rutas
  - Mostrar: rutas disponibles en mapa
  - Filtrar: por zona geográfica
  
- [ ] Mapa viaje en progreso (tiempo real)
  - Mostrar: ubicación conductor + pasajeros
  - Actualizar: cada 5-10 segundos

---

## 💬 FASE 5: Notificaciones y Chat (BAJA)

### 5.1 Backend
- [ ] WebSocket/Socket.IO para tiempo real
  - Conexión: user_id, room (route_id)
  
- [ ] POST `/chat/:routeId/message` - Enviar mensaje
  - Usuarios: conductor + pasajeros de la ruta
  
- [ ] Notificaciones:
  - Solicitud recibida (conductor)
  - Solicitud aceptada/rechazada (pasajero)
  - Viaje iniciado/completado
  - Calificación recibida

### 5.2 Frontend
- [ ] Chat modal (durante viaje)
  - Listar mensajes, input envío
  
- [ ] Toast notifications
  - Estado rutas, nuevas solicitudes
  
- [ ] Sistema bell (notificaciones no leídas)

---

## 🔐 FASE 6: Validación y Seguridad

### Backend
- [ ] Validación de entrada (Joi)
  - Sanitizar todos los inputs
  - Validar formatos: email, teléfono, fechas
  
- [ ] Rate limiting
  - Por IP: máx 100 req/hora
  - Por usuario: máx 1000 req/hora
  
- [ ] CORS mejorado
  - Whitelist de dominios
  - Validar origen
  
- [ ] SQL Injection prevention
  - Usar prepared statements (✅ ya en oracledb)
  
- [ ] Password reset
  - POST `/auth/forgot-password` - Enviar reset link
  - POST `/auth/reset-password` - Actualizar password
  
- [ ] Verificación de documentos
  - Upload: cédula, licencia, SOAT
  - Validación: no vacío, formato imagen

### Frontend
- [ ] Validación en cliente (Zod/React Hook Form)
  - Todos los formularios
  
- [ ] Error boundaries
  - Capturar crashes por componente

---

## 📚 FASE 7: Testing y Documentación

### Backend
- [ ] Tests unitarios (Jest)
  - Controllers: auth, routes, requests
  - Services: email
  
- [ ] Tests integración
  - Flujo completo: registrar → crear ruta → solicitar → aceptar
  
- [ ] Swagger/OpenAPI
  - Documentar todos los endpoints

### Frontend
- [ ] Tests unitarios (Vitest)
  - Componentes, hooks
  
- [ ] Tests E2E (Cypress)
  - Login → crear ruta → buscar → solicitar
  
- [ ] README actualizado
  - Guía local dev, deploy

---

## 🚢 FASE 8: DevOps y Deploy

### Configuración
- [ ] Docker
  - Dockerfile backend (Node.js)
  - Dockerfile frontend (Next.js)
  - Docker Compose (backend + Oracle)
  
- [ ] Enviroments
  - .env.local (desarrollo)
  - .env.production (producción)
  - .env.example (template)
  
- [ ] CI/CD
  - GitHub Actions: lint, test, build
  - Deployment automático

### Hosting
- [ ] Backend: Heroku / Railway / Azure App Service
- [ ] Frontend: Vercel / Netlify
- [ ] BD: Oracle Cloud / AWS RDS

---

## 📅 Timeline Estimado

| Fase | Duración | Completado |
|------|----------|-----------|
| 1. Infraestructura | 2 sem | ✅ 100% |
| 2. Funcionalidad Core | 4 sem | ⏳ 40% |
| 3. Cartera y Pagos | 2 sem | ❌ 0% |
| 4. Mapas | 1 sem | ❌ 0% |
| 5. Notificaciones | 1 sem | ❌ 0% |
| 6. Seguridad | 1 sem | ❌ 0% |
| 7. Testing | 2 sem | ❌ 0% |
| 8. DevOps | 1 sem | ❌ 0% |
| **TOTAL** | **14 sem** | **28%** |

---

## 🎯 Próximos Pasos INMEDIATOS

### 🔴 Esta Semana (Sprint 1)
1. Endpoints Backend - Rutas (CRUD conductor)
2. Endpoints Backend - Solicitudes (CRUD pasajero)
3. Frontend - Formulario crear ruta
4. Frontend - Búsqueda de rutas

### Semana Siguiente (Sprint 2)
1. Endpoints aceptar/rechazar solicitudes
2. Dashboard conductor - ver solicitudes
3. Dashboard pasajero - mostrar búsquedas
4. Validación de entrada (backend)

---

## 📋 Checklist Funcionalidades Críticas

- [ ] **Crear Ruta** - Conductor registra viaje
- [ ] **Buscar Rutas** - Pasajero busca disponibles
- [ ] **Solicitar Cupo** - Pasajero pide entrada
- [ ] **Aceptar Solicitud** - Conductor aprueba
- [ ] **Ver Historial** - Ambos ven viajes pasados
- [ ] **Calificar Usuario** - Post-viaje rating
- [ ] **Gestión Cartera** - Pagos básicos
- [ ] **Mapa Búsqueda** - Ubicaciones rutas
- [ ] **Notificaciones** - Estados viaje
- [ ] **Chat** - Comunicación durante viaje

---

## 📞 Dependencias Externas

- **Nodemailer** ✅ - Envío emails OTP
- **Stripe/PayPal** - Pendiente para pagos
- **Google Maps API** - Pendiente para mapas
- **Socket.IO** - Pendiente para chat/tiempo real
- **Cloudinary/S3** - Pendiente para upload archivos

---

*Última actualización: 2026-05-19*
*Proyecto: VP Project - Carpooling App*
*Responsable: Equipo de Desarrollo*
