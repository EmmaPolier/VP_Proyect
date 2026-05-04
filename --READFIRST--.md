# 📚 ÍNDICE DE DOCUMENTACIÓN - VamonosPues

## 📄 Documentos Generados

### 1. **CRONOGRAMA_DESARROLLO_5SEMANAS.md** ⏰
**Para qué sirve**: Plan detallado hora por hora, tarea por tarea, para cada miembro del equipo  
**Audiencia**: Desarrolladores (es el documento de trabajo diario)  
**Contenido**:
- Desglose por semana (L-V)
- Tareas específicas por rol
- Horas de trabajo asignadas
- Deliverables por semana
- Riesgos y mitigación

**Cómo usarlo**:
- Abrir cada lunes al inicio de la semana
- Cada persona revisa qué le toca
- Seguir el cronograma como guía
- Reportar en standups si hay desvíos

---

### 2. **MATRIZ_RACI.md** 🎯
**Para qué sirve**: Claridad sobre quién es responsable de qué  
**Audiencia**: Todo el equipo (especialmente útil para evitar duplicación)  
**Contenido**:
- Responsabilidades RACI por semana
- Matriz de quién hace qué
- Reglas de oro
- Handoff points entre semanas

**Cómo usarlo**:
- Consultar antes de empezar una tarea
- Saber quién es el "Accountable" (A)
- Saber a quién consultar (C)
- Evitar conflictos de asignación

---

### 3. **ARQUITECTURA_TECNICA.md** 🏗️
**Para qué sirve**: Referencia técnica completa del stack  
**Audiencia**: Desarrolladores, Tech Lead, DevOps  
**Contenido**:
- Diagrama arquitectura general
- Stack tecnológico completo (versiones)
- Estructura de carpetas (backend y frontend)
- Seguridad
- Performance
- Deployment

**Cómo usarlo**:
- Consultar estructura de carpetas al crear archivos
- Revisar para entender arquitectura general
- Referencia para decisiones técnicas
- Base para onboarding de nuevos devs

---

### 4. **TASKS_KANBAN.md** 📋
**Para qué sirve**: Lista de tareas en formato kanban para cada semana  
**Audiencia**: Desarrolladores, Product Owner, Scrum Master  
**Contenido**:
- Tareas organizadas por semana
- Columnas: TODO | IN PROGRESS | DONE
- Tareas críticas (blockers)
- Etiquetas para categorizar
- Definición de hecho (DoD)

**Cómo usarlo**:
- Pasar a "IN PROGRESS" cuando empieza
- Pasar a "DONE" cuando termina
- Identificar blockers rápidamente
- Medir velocidad del equipo

---

### 5. **RESUMEN_EJECUTIVO.md** 📊
**Para qué sirve**: Visión de alto nivel para stakeholders  
**Audiencia**: Gerentes, stakeholders, clientes  
**Contenido**:
- Overview del proyecto
- Equipo y estructura
- Plan de 5 semanas resumido
- Hitos principales
- KPIs
- Riesgos

**Cómo usarlo**:
- Compartir con clientes/stakeholders
- Usar en reuniones de directivos
- Reportar progreso semanal
- Justificar recursos

---

## 🚀 CÓMO EMPEZAR

### DÍA 1 - Lunes Semana 1

1. **Líder Técnico**
   ```
   - Leer: CRONOGRAMA_DESARROLLO_5SEMANAS.md (tu sección S1)
   - Leer: ARQUITECTURA_TECNICA.md (arquitectura general)
   - Hacer: Setup inicial del proyecto (estructura carpetas)
   - Reunión: Kickoff con el equipo (1 hora)
   ```

2. **Developer Backend**
   ```
   - Leer: CRONOGRAMA_DESARROLLO_5SEMANAS.md (tu sección S1)
   - Leer: ARQUITECTURA_TECNICA.md (estructura backend)
   - Revisar: Tabla de tareas TASKS_KANBAN.md (tus tareas S1)
   - Hacer: Setup Express.js estructura
   ```

3. **Developer Frontend**
   ```
   - Leer: CRONOGRAMA_DESARROLLO_5SEMANAS.md (tu sección S1)
   - Leer: ARQUITECTURA_TECNICA.md (estructura frontend)
   - Revisar: Tabla de tareas TASKS_KANBAN.md (tus tareas S1)
   - Hacer: Setup Next.js estructura
   ```

4. **Todos**
   ```
   - Reunión Kickoff: 10:00 (presentación del proyecto)
   - Standup: 16:00 (qué hicimos, qué haremos mañana)
   ```

### CADA SEMANA

**Lunes 08:00**
- Planning semana: revisar tareas TASKS_KANBAN.md
- Asignar tareas clara

**Martes-Jueves 16:00**
- Standup: 1 hora (qué completé, qué hago hoy, blockers)
- Code reviews según sea necesario

**Viernes 15:00**
- Planning próxima semana
- Retrospectiva rápida

---

## 📊 ESTRUCTURA RECOMENDADA EN JIRA/TRELLO/GitHub

### Epics (Epics grandes)
- Epic 1: Autenticación (S1)
- Epic 2: Gestión Usuarios (S2)
- Epic 3: Rutas (S3)
- Epic 4: Solicitudes & Pagos (S4)
- Epic 5: Chat & Ratings (S5)

### Sprints
- Sprint 1: S1 (Lun - Vie)
- Sprint 2: S2 (Lun - Vie)
- Sprint 3: S3 (Lun - Vie)
- Sprint 4: S4 (Lun - Vie)
- Sprint 5: S5 (Lun - Vie)

### Labels
```
[FRONTEND]  - Trabajo en UI
[BACKEND]   - Trabajo en APIs
[INFRA]     - DevOps/DB
[BLOCKER]   - Bloquea otras tareas
[BUG]       - Correción
[REFACTOR]  - Mejora código
```

---

## 🎯 HITOS POR SEMANA

```
SEMANA 1 HITO: Auth MVP ✓
├─ Backend: JWT funcional
├─ Frontend: Login/Signup
└─ Deliverable: Usuarios pueden registrarse y loguear

SEMANA 2 HITO: Perfiles MVP ✓
├─ Backend: APIs perfiles + uploads
├─ Frontend: UI perfiles
└─ Deliverable: Usuarios pueden editar perfil + registrar vehículo

SEMANA 3 HITO: Búsqueda MVP ✓
├─ Backend: APIs rutas
├─ Frontend: UI búsqueda + mapas
└─ Deliverable: Conductores publican, pasajeros buscan

SEMANA 4 HITO: Pagos MVP ✓
├─ Backend: APIs solicitudes + cartera
├─ Frontend: UI cartera + solicitudes
└─ Deliverable: Flujo completo request → accept → pago

SEMANA 5 HITO: PRODUCCIÓN READY 🚀
├─ Backend: Chat + ratings
├─ Frontend: Chat + ratings UI
└─ Deliverable: App lista para producción
```

---

## 🔑 PUNTOS DE DECISIÓN IMPORTANTES

### DURANTE SEMANA 1
- [ ] ¿Dónde guardar uploads? (Local, S3, Cloudinary)
- [ ] ¿Qué BD producción usar? (PostgreSQL managed)
- [ ] ¿Dónde hostear? (AWS, GCP, Azure, VPS)

### DURANTE SEMANA 3
- [ ] ¿Google Maps API o Leaflet?
- [ ] ¿Cómo cachear búsquedas? (Redis sí/no)
- [ ] ¿Radio máximo de búsqueda?

### DURANTE SEMANA 4
- [ ] ¿Sistema de pagos real o mock? (Stripe, MercadoPago)
- [ ] ¿SMS notifications o email?
- [ ] ¿Push notifications? (Firebase)

### DURANTE SEMANA 5
- [ ] ¿Socket.io escalable? (Redis adapter)
- [ ] ¿Monitoring qué herramienta? (DataDog, New Relic)
- [ ] ¿Log aggregation? (ELK, Splunk)

---

## 📞 COMUNICACIÓN

### CANALES RECOMENDADOS
```
Slack:
├─ #vamonos-general (anuncios)
├─ #vamonos-development (código)
├─ #vamonos-bugs (issues/bugs)
├─ #vamonos-deployment (prod)
└─ #random (off-topic)

GitHub:
├─ Pull requests (code review)
├─ Issues (bugs/features)
└─ Discussions (decisiones)

Reuniones:
├─ Daily Standup: 16:00-17:00 (1 hora)
├─ Plannings: Viernes 15:00 (1 hora)
└─ Code Review: Ad-hoc (<24h)
```

---

## 🎓 DOCUMENTACIÓN PARA DEVELOPERS

### Setup Local (Cada dev debe hacer esto S1-L1)
```bash
git clone <repo>
cd VP_Proyect

# Backend
cd backend
npm install
cp .env.example .env
# Editar .env con DATABASE_URL local

# Frontend
cd ../frontend
npm install
cp .env.example .env
# Editar .env con NEXT_PUBLIC_API_URL=http://localhost:4000

# Docker Compose
docker compose up -d
# Esperar 30s para que DB inicie

# Migraciones Prisma
docker exec vp_backend npx prisma migrate dev --name init

# Test
curl http://localhost:3000  # Frontend OK
curl http://localhost:4000/test  # Backend OK
```

### Workflow Git
```bash
# Crear feature
git checkout -b feature/NOMBRE-TAREA

# Hacer commits frecuentes
git add .
git commit -m "[FRONTEND/BACKEND] Modulo: descripción"

# Pushar
git push origin feature/NOMBRE-TAREA

# PR → Code Review → Merge a develop
```

---

## 🚀 DEPLOYMENT

### Production Checklist (Semana 5)
```
PRE-DEPLOYMENT
- [ ] Todos tests passed
- [ ] Code review completado
- [ ] .env variables configured
- [ ] Database backed up
- [ ] Performance tested
- [ ] Security audit passed

DEPLOYMENT
- [ ] Migrate database
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test smoke tests
- [ ] Monitor logs

POST-DEPLOYMENT
- [ ] Monitor errors
- [ ] Check performance
- [ ] Have rollback ready
- [ ] Document what was deployed
```

---

## 📈 MÉTRICAS DE ÉXITO

**Semana 1**: Auth funcional → Usuarios pueden loguear ✅  
**Semana 2**: Perfiles → Usuarios completos ✅  
**Semana 3**: Búsqueda → Motor funcionando ✅  
**Semana 4**: Pagos → Transacciones OK ✅  
**Semana 5**: Producción → Go Live 🚀  

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Puedo cambiar el cronograma?**  
R: Sí, pero requiere aprobación del Líder Técnico. Reportar changes en standup.

**P: ¿Qué pasa si me atraso?**  
R: Reportar ASAP en standup. Hacer pair programming si es necesario.

**P: ¿Cuándo empiezo la siguiente semana?**  
R: Cuando terminas tu parte actual + code review aprobado.

**P: ¿Dónde voy si tengo dudas arquitectónicas?**  
R: Consulta a Líder Técnico. Documenta la decisión.

**P: ¿Hay buffer para imprevistos?**  
R: 15% del tiempo está reservado. Usa sabiamente.

---

## 📞 CONTACTO & ESCALACIÓN

**Blocker técnico**: Líder Técnico directamente  
**Duda feature**: Consulta en canales Slack  
**Bug crítico**: Escalar en standup  
**Necesito ayuda**: Pair programming con equipo  

---

**¡Listo para comenzar! 🚀**

Si tienes dudas sobre algún documento, consulta primero a tu Líder Técnico.

Última actualización: 2026-05-04
