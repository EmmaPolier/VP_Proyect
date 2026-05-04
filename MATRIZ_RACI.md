# 📊 MATRIZ RACI - VamonosPues Development
## (Responsible, Accountable, Consulted, Informed)

---

## SEMANA 1: FUNDAMENTOS

| Actividad | Líder Técnico | Dev Backend | Dev Frontend |
|-----------|---------------|-------------|--------------|
| Setup Express estructura | **R/A** | **R** | I |
| Diseño Prisma Schema | **R/A** | **C** | I |
| JWT Autenticación | **C** | **R/A** | **C** |
| Setup Next.js/TypeScript | I | **C** | **R/A** |
| Login/Signup Forms | **C** | **C** | **R/A** |
| Docker Compose config | **R/A** | **C** | **C** |
| Testing Integración | **R/A** | **R** | **R** |

---

## SEMANA 2: USUARIOS & VEHÍCULOS

| Actividad | Líder Técnico | Dev Backend | Dev Frontend |
|-----------|---------------|-------------|--------------|
| Perfiles de usuario APIs | **C** | **R/A** | **C** |
| Sistema de uploads | **A** | **R** | **R** |
| CRUD Vehículos | **C** | **R/A** | **C** |
| UI Perfil usuario | **C** | **C** | **R/A** |
| Página vehículos (driver) | I | **C** | **R/A** |
| Optimización BD | **R/A** | **C** | I |
| E2E Testing | **R/A** | **R** | **R** |

---

## SEMANA 3: RUTAS & BÚSQUEDA

| Actividad | Líder Técnico | Dev Backend | Dev Frontend |
|-----------|---------------|-------------|--------------|
| Prisma models rutas | **R/A** | **C** | I |
| Integración Maps API | **A** | **C** | **R** |
| API crear ruta | **C** | **R/A** | **C** |
| API búsqueda rutas | **C** | **R/A** | **C** |
| UI Publicar ruta | **C** | **C** | **R/A** |
| UI Búsqueda + Mapa | **C** | **C** | **R/A** |
| Detalle ruta page | I | **C** | **R/A** |
| Optimización search | **R/A** | **R** | **C** |

---

## SEMANA 4: SOLICITUDES & CARTERA

| Actividad | Líder Técnico | Dev Backend | Dev Frontend |
|-----------|---------------|-------------|--------------|
| Models solicitudes/cartera | **R/A** | **C** | I |
| Lógica pagos/penalizaciones | **R/A** | **C** | I |
| API solicitudes cupo | **C** | **R/A** | **C** |
| API aceptar/rechazar | **C** | **R/A** | **C** |
| API Cartera Virtual | **C** | **R/A** | **C** |
| UI Solicitudes | **C** | **C** | **R/A** |
| UI Cartera/Recargas | **C** | **C** | **R/A** |
| Notificaciones sistema | **A** | **R** | **R** |
| Testing transacciones | **R/A** | **R** | **R** |

---

## SEMANA 5: CHAT, RATINGS & DEPLOYMENT

| Actividad | Líder Técnico | Dev Backend | Dev Frontend |
|-----------|---------------|-------------|--------------|
| WebSocket architecture | **R/A** | **C** | **C** |
| API Chat/Mensajes | **C** | **R/A** | **C** |
| UI Chat component | **C** | **C** | **R/A** |
| API Calificaciones | **C** | **R/A** | **C** |
| UI Ratings system | **C** | **C** | **R/A** |
| API Historial viajes | **C** | **R/A** | **C** |
| UI Historial page | **C** | **C** | **R/A** |
| Testing integral | **R/A** | **R** | **R** |
| Deployment producción | **R/A** | **R** | **C** |
| Documentación final | **R/A** | **R** | **R** |

---

## LEYENDA

| Código | Significado |
|--------|------------|
| **R** | Responsible (Quien hace el trabajo) |
| **A** | Accountable (Quien es responsable del resultado) |
| **C** | Consulted (Consultar antes de proceder) |
| **I** | Informed (Mantener informado) |

---

## REGLAS DE ORO

✅ **Una (A) por actividad** - Un accountable claro  
✅ **Al menos una (R) por actividad** - Alguien debe hacerlo  
✅ **Máximo 2 (R) en actividades críticas** - Evitar fragmentación  
✅ **Comunicación clara** - (C) debe avisar antes de proceder  
✅ **Reunión diaria** - Sincronizar y resolver blockers

---

## HANDOFF POINTS (Puntos de Transición)

### S1 → S2
- **Backend**: Autenticación JWT lista y documentada
- **Frontend**: Login/Signup funcionales
- **Entregable**: Flujo auth end-to-end funcionando

### S2 → S3  
- **Backend**: Perfiles y vehículos con uploads
- **Frontend**: UI perfiles y vehículos
- **Entregable**: Usuario puede completar perfil + registrar vehículo

### S3 → S4
- **Backend**: APIs rutas y búsqueda optimizadas
- **Frontend**: Publicar ruta y buscar ruta funcional
- **Entregable**: Conductor puede publicar, pasajero puede buscar

### S4 → S5
- **Backend**: Solicitudes, cartera, pagos funcionando
- **Frontend**: Solicitudes y cartera UI
- **Entregable**: Flujo completo request → accept → payment

### S5 → PRODUCCIÓN
- **Backend**: Chat, ratings, historial + tests
- **Frontend**: Chat, ratings, historial UI
- **Todo**: Documentación, deployment, rollback ready

---
