# 🚀 GUÍA DE INICIO - SEMANA 1 (ACCIÓN HOY)

## TODOS - LUNES 08:00

### ✅ Setup Inicial (30 minutos)

```bash
# 1. CLONAR Y ENTRAR AL PROYECTO
git clone <repo-url>
cd VP_Proyect

# 2. LEVANTEAR DOCKER
docker compose up -d
# Esperar a que todos los servicios estén ready (~30 segundos)

# 3. VERIFICAR QUE FUNCIONA
curl http://localhost:3000      # Frontend ✅
curl http://localhost:4000/test # Backend ✅
```

### 📖 Documentación de Inicio (20 minutos)

```
TODOS:
1. Leer: QUICK_REFERENCE.md (3 min)
2. Leer: RESUMEN_EJECUTIVO.md (5 min)
3. Leer tu sección: CRONOGRAMA_DESARROLLO_5SEMANAS.md (10 min)
4. Revisar: MATRIZ_RACI.md (2 min)
```

---

## 👨‍💼 LÍDER TÉCNICO - LUNES 08:30

### Responsabilidades Semana 1

#### 08:30 - 10:00 | Arquitectura Setup
- [ ] Crear estructura carpetas backend
  ```
  backend/src/
  ├── controllers/
  ├── services/
  ├── middleware/
  ├── routes/
  ├── utils/
  └── config/
  ```
- [ ] Crear `.env` y `.env.example`
- [ ] Documentar estructura en README.md

#### 10:00 - 12:00 | Prisma Schema Design
- [ ] Refinar prisma schema
- [ ] Agregar User model básico
- [ ] Crear primera migración
- [ ] Documentar en `ARQUITECTURA_TECNICA.md`

#### 14:00 - 16:00 | Project Setup
- [ ] Crear carpeta `uploads/` (docker volume)
- [ ] Setup `.dockerignore`
- [ ] Verificar docker compose funcionando
- [ ] Crear seeders básicos

#### 16:00 - 17:00 | STANDUP
```
Qué hice:
- Setup arquitectura backend
- Prisma schema inicial

Qué haré mañana:
- Refinamiento schema
- Error handling

Blockers:
- Ninguno
```

---

## 🔧 DEV BACKEND - LUNES 08:30

### Responsabilidades Semana 1

#### 08:30 - 10:00 | Express Setup
- [ ] Instalar dependencias
  ```bash
  cd backend
  npm install express cors dotenv prisma @prisma/client bcryptjs jsonwebtoken
  ```
- [ ] Crear `src/app.js` con setup básico
- [ ] Crear `src/server.js` como entry point
- [ ] Test: `npm run dev` debe funcionar

#### 10:00 - 12:00 | JWT Authentication
- [ ] Crear `src/utils/jwt.js`
- [ ] Crear `src/middleware/auth.js`
- [ ] Crear `src/utils/hash.js` (bcrypt)
- [ ] Test local: generar token, verificar

#### 14:00 - 16:00 | User APIs
- [ ] Crear `src/controllers/auth.controller.js`
- [ ] Crear `src/services/user.service.js`
- [ ] Endpoints:
  - `POST /auth/register`
  - `POST /auth/login`
- [ ] Test en Postman/Insomnia

#### 16:00 - 17:00 | STANDUP
```
Qué hice:
- Express setup completo
- JWT auth (register + login)

Qué haré mañana:
- Refinamiento auth
- User service mejorado

Blockers:
- Necesito decisión sobre estructura de errores (próxima reunión)
```

---

## 🎨 DEV FRONTEND - LUNES 08:30

### Responsabilidades Semana 1

#### 08:30 - 10:00 | Next.js Setup
- [ ] Instalar dependencias dev
  ```bash
  cd frontend
  npm install axios zod react-hook-form zustand
  ```
- [ ] Crear carpeta `src/services/`
- [ ] Crear `src/services/api.ts` (axios config)
- [ ] Test: `npm run dev` en puerto 3000

#### 10:00 - 12:00 | Auth Hooks & Context
- [ ] Crear `src/hooks/useAuth.ts`
- [ ] Crear `src/components/AuthProvider.tsx`
- [ ] Setup Zustand store para auth (opcional)
- [ ] Test: Hook funciona sin errores TypeScript

#### 14:00 - 16:00 | Form Components
- [ ] Refactor `src/components/login-form.tsx`
  - Agregar react-hook-form
  - Agregar validaciones con zod
  - Integrar con API
- [ ] Refactor `src/components/signup-form.tsx`
- [ ] Test local: Forms muestran errores

#### 16:00 - 17:00 | STANDUP
```
Qué hice:
- Next.js estructura completa
- Login/Signup forms mejorados
- API client configurado

Qué haré mañana:
- Integración con backend
- Error handling mejorado

Blockers:
- Esperando que backend esté ready (coordinar con Dev Backend)
```

---

## 📋 TODO LUNES

### Pre-Standup (16:00)
- [ ] Todos: Confirmar que docker está corriendo
- [ ] Backend: API /test responde 200
- [ ] Frontend: http://localhost:3000 abre
- [ ] Líder: Documentar decisiones arquitectónicas

### Standup (16:00-17:00)
```
ORDEN:
1. Líder Técnico: Arquitectura (5 min)
2. Dev Backend: Auth status (5 min)
3. Dev Frontend: Forms status (5 min)
4. Todos: Plan Martes (5 min)
```

### Post-Standup
- [ ] Commit cambios a rama feature
- [ ] Push a repositorio
- [ ] Crear Draft PR para review

---

## 📅 MARTES-VIERNES

### Rutina Diaria
```
08:00-12:00 │ Desarrollo
12:00-13:00 │ Almuerzo
13:00-16:00 │ Desarrollo
16:00-17:00 │ STANDUP + Descanso
```

### Cada Dev
- [ ] Commit diario mínimo
- [ ] Push antes de salir
- [ ] Code review de PRs abiertas
- [ ] Actualizar TASKS_KANBAN.md

### Líder
- [ ] Code review de PRs
- [ ] Identificar blockers
- [ ] Ajustar plan si es necesario
- [ ] Documentar decisiones

---

## 🎯 VIERNES 15:00 - PLANNING S2

```
15:00-15:15 | Retrospectiva S1
- Qué funcionó
- Qué no funcionó
- Qué mejorar

15:15-15:45 | Planing S2
- Revisar CRONOGRAMA_DESARROLLO_5SEMANAS.md Semana 2
- Asignar tareas S2
- Identificar dependencias

15:45-16:00 | Q&A + Descanso
```

---

## 🚨 SI TIENES PROBLEMAS

### Docker no inicia
```bash
docker compose down
docker compose up -d --force-recreate
docker ps  # Verificar todos los servicios
```

### Prisma migration error
```bash
docker exec vp_backend npx prisma db push
docker exec vp_backend npx prisma migrate dev
```

### Backend no compila
```bash
cd backend
npm install --force
npm run dev
```

### Frontend error TypeScript
```bash
cd frontend
npm install --force
npm run dev
```

### Base datos corrupta
```bash
docker compose down
docker volume rm vp_proyect_db_data
docker compose up -d
# Esperar 30s para que BD inicie
docker exec vp_backend npx prisma migrate dev
```

---

## 📊 SUCCESS CRITERIA - FIN SEMANA 1

### 100% Completado Si:

✅ **Backend**
- [ ] `POST /auth/register` funciona
- [ ] `POST /auth/login` funciona
- [ ] JWT tokens se generan correctamente
- [ ] Prisma schema actualizado
- [ ] Documentación API generada

✅ **Frontend**
- [ ] Login page funcional
- [ ] Signup page funcional
- [ ] Forms conectadas con backend
- [ ] Error messages muestran
- [ ] Validaciones frontend trabajan

✅ **Infraestructura**
- [ ] Docker compose funcionando
- [ ] Todos los servicios corriendo
- [ ] Documentación actualizada
- [ ] Git workflow establecido

✅ **Equipo**
- [ ] Standups diarios completados
- [ ] Todos los PRs revisados
- [ ] Commits pushados
- [ ] Plan Semana 2 definido

---

## 📞 CONTACTO URGENTE

**Líder Técnico Bloqueado**: Slack directamente  
**Backend/Frontend Issue**: Slack + Standup urgente  
**Docker Problem**: Llamada rápida (5 min)  

---

## 📚 REFERENCIAS

**Documentos**:
- CRONOGRAMA_DESARROLLO_5SEMANAS.md (tu plan completo)
- ARQUITECTURA_TECNICA.md (decisiones técnicas)
- MATRIZ_RACI.md (quién hace qué)

**Links útiles**:
- Express: https://expressjs.com
- Prisma: https://www.prisma.io/docs
- Next.js: https://nextjs.org/docs
- JWT: https://jwt.io

---

## ✨ RECUERDA

> Esta primera semana es la base de todo.
> Si auth funciona bien, el resto es más fácil.
> 
> Comunica problemas temprano.
> Pide ayuda si la necesitas.
> ¡Que comience la aventura! 🚀

---

**Documento creado**: 2026-05-04 08:00  
**Para**: Equipo VamonosPues  
**Acción**: HOY - LUNES SEMANA 1

