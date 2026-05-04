# 📋 BOARD KANBAN - VamonosPues Tasks

## SEMANA 1: FUNDAMENTOS & ARQUITECTURA

### TODO
- [ ] **LÍDER**: Crear estructura carpetas backend (controllers, services, middleware)
- [ ] **LÍDER**: Diseñar arquitectura de respuestas standardizadas y manejo de errores
- [ ] **LÍDER**: Configurar variables de entorno (.env.example)
- [ ] **BACKEND**: Setup Express.js con estructura modular
- [ ] **BACKEND**: Implementar JWT authentication (register + login)
- [ ] **BACKEND**: Crear User service (CRUD básico)
- [ ] **FRONTEND**: Configurar Axios con interceptors
- [ ] **FRONTEND**: Crear AuthContext/hooks para manejo de sesión
- [ ] **FRONTEND**: Refactorizar login-form.tsx con validaciones
- [ ] **FRONTEND**: Refactorizar signup-form.tsx con validaciones
- [ ] **LÍDER**: Crear Prisma schema inicial (User, Vehicle)
- [ ] **LÍDER**: Configurar migraciones Prisma
- [ ] **LÍDER**: Crear seeders para testing

### IN PROGRESS
- [ ] (Esperando asignación)

### DONE
- [ ] Repositorio creado y clonado
- [ ] Docker Compose configurado

---

## SEMANA 2: PERFILES & VEHÍCULOS

### TODO
- [ ] **BACKEND**: Crear API GET /users/:id (perfil completo)
- [ ] **BACKEND**: Crear API PUT /users/:id (actualizar perfil)
- [ ] **BACKEND**: Crear API POST /upload/avatar (subir foto)
- [ ] **BACKEND**: Crear API POST /upload/documents (cédula, SOAT, etc)
- [ ] **BACKEND**: Crear API Vehicle CRUD (create, read, update, delete)
- [ ] **BACKEND**: Implementar validaciones en vehículos
- [ ] **FRONTEND**: Crear página /profile con edición datos
- [ ] **FRONTEND**: Crear componente FileUpload reutilizable
- [ ] **FRONTEND**: Crear página /vehicles (listar, agregar, editar)
- [ ] **FRONTEND**: Integrar APIs de perfil y vehículos
- [ ] **LÍDER**: Code review de estructura y seguridad
- [ ] **LÍDER**: Optimizar queries BD (índices)
- [ ] **LÍDER**: Crear testing suite básico

### IN PROGRESS
- [ ] (Esperando asignación)

### DONE
- [ ] Semana 1 completada

---

## SEMANA 3: RUTAS & BÚSQUEDA

### TODO
- [ ] **BACKEND**: Crear API POST /routes (publicar ruta)
- [ ] **BACKEND**: Crear API GET /routes/search (búsqueda con filtros)
- [ ] **BACKEND**: Crear API GET /routes/:id (detalle ruta)
- [ ] **BACKEND**: Implementar puntos de encuentro (pickup points)
- [ ] **BACKEND**: Validaciones geoespaciales (haversine, etc)
- [ ] **FRONTEND**: Crear página /routes/publish (formulario publicar)
- [ ] **FRONTEND**: Crear componente MapPicker para origen/destino
- [ ] **FRONTEND**: Crear página /routes/search (búsqueda + filtros)
- [ ] **FRONTEND**: Crear componente RouteCard (mostrar ruta)
- [ ] **FRONTEND**: Integrar Google Maps API
- [ ] **FRONTEND**: Crear página /routes/:id (detalle ruta)
- [ ] **LÍDER**: Optimizar búsquedas (índices, caching)
- [ ] **LÍDER**: Testing E2E: publicar → buscar → ver

### IN PROGRESS
- [ ] (Esperando asignación)

### DONE
- [ ] Semana 2 completada

---

## SEMANA 4: SOLICITUDES & CARTERA

### TODO
- [ ] **BACKEND**: Crear API POST /seat-requests (solicitar cupo)
- [ ] **BACKEND**: Crear API PUT /seat-requests/:id/accept (aceptar solicitud)
- [ ] **BACKEND**: Crear API PUT /seat-requests/:id/reject (rechazar solicitud)
- [ ] **BACKEND**: Crear API GET /wallet/:userId (ver saldo)
- [ ] **BACKEND**: Crear API POST /wallet/:userId/topup (recargar)
- [ ] **BACKEND**: Crear API GET /wallet/:userId/transactions (historial)
- [ ] **BACKEND**: Implementar lógica de penalizaciones (cancelación <10 min)
- [ ] **BACKEND**: Crear sistema de notificaciones (eventos)
- [ ] **FRONTEND**: Crear página /seat-requests (mis solicitudes - pasajero)
- [ ] **FRONTEND**: Crear página /dashboard/driver/requests (solicitudes - conductor)
- [ ] **FRONTEND**: Crear página /wallet (ver saldo, recargar, historial)
- [ ] **FRONTEND**: Implementar notificaciones toast
- [ ] **LÍDER**: Testing transacciones y validaciones
- [ ] **LÍDER**: Implementar rate limiting en APIs sensibles

### IN PROGRESS
- [ ] (Esperando asignación)

### DONE
- [ ] Semana 3 completada

---

## SEMANA 5: CHAT, RATINGS & DEPLOYMENT

### TODO
- [ ] **BACKEND**: Configurar Socket.io para chat en tiempo real
- [ ] **BACKEND**: Crear API GET /chats/:routeId (historial chat)
- [ ] **BACKEND**: Crear API POST /messages (enviar mensaje)
- [ ] **BACKEND**: Crear API POST /ratings (crear calificación)
- [ ] **BACKEND**: Crear API GET /users/:id/ratings (ver calificaciones)
- [ ] **BACKEND**: Crear API GET /history/:userId (historial viajes)
- [ ] **FRONTEND**: Crear página /chat/:routeId (chat window)
- [ ] **FRONTEND**: Crear componente MessageList y MessageInput
- [ ] **FRONTEND**: Crear modal de calificación post-viaje
- [ ] **FRONTEND**: Crear página /history (historial viajes)
- [ ] **FRONTEND**: Conectar Socket.io client
- [ ] **LÍDER**: Testing integral (E2E flows)
- [ ] **LÍDER**: Security audit básico
- [ ] **LÍDER**: Preparación deployment
- [ ] **LÍDER**: Crear documentación final
- [ ] **BACKEND**: Crear documentación Swagger API
- [ ] **FRONTEND**: Performance optimization
- [ ] **FRONTEND**: Testing responsive en mobile

### IN PROGRESS
- [ ] (Esperando asignación)

### DONE
- [ ] Semana 4 completada

---

## TAREAS CRÍTICAS (BLOCKERS)

| Tarea | Asignado | Prioridad | Deadline |
|-------|----------|-----------|----------|
| Diseño Prisma Schema | LÍDER | 🔴 CRÍTICO | L1 |
| JWT Authentication | BACKEND | 🔴 CRÍTICO | M1 |
| API Search Rutas | BACKEND | 🔴 CRÍTICO | M3 |
| Maps Integration | FRONTEND | 🟡 ALTO | M3 |
| Solicitudes & Cartera | BACKEND | 🟡 ALTO | M4 |
| Socket.io Chat | BACKEND | 🟡 ALTO | M5 |
| Docker Deployment | LÍDER | 🟢 MEDIO | M5 |

---

## ETIQUETAS PARA TASKS

```
[FRONTEND] - Trabajo en UI/UX
[BACKEND]  - Trabajo en APIs/Servicios
[INFRA]    - DevOps/Database/Deployment
[BUG]      - Correción de errores
[REFACTOR] - Mejora de código existente
[DOCS]     - Documentación
[TEST]     - Testing
[REVIEW]   - Code review pendiente
[BLOCKER]  - Bloquea otras tareas
```

---

## NOTES & DEPENDENCIES

### Semana 1 → Semana 2
- ✅ Requisito: Auth JWT funcional
- ✅ Requisito: BD schema básico
- ⚠️ Blocker: Sistema de uploads decidido

### Semana 2 → Semana 3
- ✅ Requisito: Perfiles + vehículos funcionando
- ⚠️ Blocker: Google Maps API key configurada

### Semana 3 → Semana 4
- ✅ Requisito: Búsqueda de rutas funcionando
- ⚠️ Blocker: Ninguno previsto

### Semana 4 → Semana 5
- ✅ Requisito: Cartera y transacciones funcionando
- ⚠️ Blocker: Socket.io setup completado

### Semana 5 → PRODUCCIÓN
- ✅ Requisito: Testing integral pasado
- ✅ Requisito: Documentación completa
- ⚠️ Blocker: Configuración producción (.env)

---

## DEFINICIÓN DE HECHO (DOD)

Cada tarea se considera DONE cuando:

1. ✅ **Código escrito** y commiteado a rama feature
2. ✅ **Pasó tests** (unitarios si existen)
3. ✅ **Code review** aprobado por otro developer
4. ✅ **Documentado** (comentarios en código)
5. ✅ **Sin warnings** (linter passa clean)
6. ✅ **Integraciones probadas** (si toca múltiples capas)
7. ✅ **Mergeado a develop** (no a main)

---

## REUNIONES DIARIAS

**Standup: 16:00-17:00 (1 hora)**

Cada persona reporta:
1. ✅ Qué completé hoy
2. 📋 Qué haré mañana
3. 🚧 Blockers/necesito ayuda

**Code Review: Ad-hoc**
- Mínimo 2 ojos antes de merge
- Máximo 24h response time
- Comentarios constructivos

---

## MÉTRICAS DE ÉXITO

### Por Semana
- [ ] 70%+ tareas completadas
- [ ] 0 blockers sin resolver
- [ ] Code coverage > 70%
- [ ] 0 bugs críticos

### Global (5 semanas)
- [ ] 100% requisitos funcionales
- [ ] Deployment exitoso
- [ ] Documentación completa
- [ ] Equipo motivado y con energía

