# ✅ Proyecto Configurado para Desarrollo Local

## 📝 Resumen de Cambios

Se ha completado la configuración del proyecto **VP Project** para ejecutarse localmente sin Docker.

### Archivos Creados:

1. **SETUP_LOCAL.md** - Guía completa de configuración paso a paso
2. **API_ENDPOINTS.md** - Documentación de todos los endpoints de la API
3. **TROUBLESHOOTING.md** - Guía de solución de problemas
4. **backend/.env** - Variables de entorno del backend (apunta a localhost:5432)
5. **frontend/.env.local** - Variables de entorno del frontend
6. **backend/prisma/init_db.sql** - Script SQL para crear BD y usuario
7. **setup.ps1** - Script de instalación de dependencias
8. **setup-db.ps1** - Script de creación automática de BD
9. **start-dev.ps1** - Script para iniciar servidores rápidamente
10. **start.ps1** - Script completo con setup y inicio

### Archivos Modificados:

1. **backend/package.json** - Agregados scripts para desarrollo:
   - `npm run dev` - Ejecutar servidor
   - `npm run prisma:push` - Sincronizar BD
   - `npm run prisma:studio` - Abrir Prisma Studio
   - `npm run prisma:generate` - Regenerar cliente Prisma

2. **README.md** - Agregada sección de desarrollo local

---

## 🚀 Inicio Rápido (3 pasos)

### Opción 1: Automático (Recomendado)

```powershell
# Abre PowerShell en la carpeta del proyecto
.\start-dev.ps1
```

Esto:
1. Instala dependencias si falta
2. Levanta Backend en puerto 4000
3. Levanta Frontend en puerto 3000

**Listo en ~30 segundos** ✅

### Opción 2: Manual

```powershell
# Terminal 1 - Backend
cd backend
npm install
npm run prisma:push  # (primera vez)
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### Opción 3: Setup Completo (si es primera vez)

```powershell
# Setup de dependencias
.\setup.ps1

# Setup de BD (si necesitas crear usuario/BD en PostgreSQL)
.\setup-db.ps1

# Iniciar
.\start-dev.ps1
```

---

## 📍 URLs de Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Test**: http://localhost:4000/test
- **Prisma Studio**: `npm run prisma:studio` en backend/

---

## 🛠️ Requisitos Previos

✅ Node.js 18+ (instalado)
✅ PostgreSQL 12+ (debe estar corriendo)

### Verificar instalación:
```powershell
node --version
npm --version
psql --version
```

### Si no tienes PostgreSQL:
- Descargar: https://www.postgresql.org/download/windows/
- Instalar y recordar contraseña del usuario `postgres`
- Usar script `setup-db.ps1` para crear BD automáticamente

---

## 📚 Documentación

Consulta estos archivos para más información:

- **SETUP_LOCAL.md** - Guía detallada de configuración
- **API_ENDPOINTS.md** - Documentación de API (6 endpoints CRUD)
- **TROUBLESHOOTING.md** - Solución de problemas comunes
- **backend/prisma/schema.prisma** - Modelo de datos (User)

---

## 🗄️ Base de Datos

**Credenciales locales:**
- Usuario: `vp_user`
- Contraseña: `vp_password`
- BD: `vp_db`
- Host: `localhost:5432`

### Tabla User:
```sql
id    | name   | email
------|--------|-------------------
1     | Juan   | juan@example.com
```

---

## 🔌 Endpoints API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /test | Verifica API |
| GET | /users | Obtiene todos |
| GET | /users/:id | Obtiene uno |
| POST | /users | Crea usuario |
| PUT | /users/:id | Actualiza |
| DELETE | /users/:id | Elimina |

Ver **API_ENDPOINTS.md** para ejemplos de uso.

---

## 🧪 Test Rápido

Verificar que todo funciona:

```powershell
# Abrir navegador
http://localhost:3000

# O desde terminal
curl http://localhost:4000/test
# Debe retornar: {"message":"API is working!"}
```

---

## ⚡ Comandos Útiles

```powershell
# Backend
cd backend
npm run dev              # Ejecutar servidor
npm run prisma:push     # Sincronizar BD
npm run prisma:studio   # Abrir UI de BD
npm run prisma:generate # Regenerar cliente

# Frontend
cd frontend
npm run dev    # Desarrollo con hot-reload
npm run build  # Compilar
npm run start  # Ejecutar compilación
npm run lint   # Verificar código

# Utilidades
netstat -ano | findstr :3000  # Ver si puerto 3000 está en uso
netstat -ano | findstr :4000  # Ver si puerto 4000 está en uso
taskkill /PID <PID> /F        # Matar proceso
```

---

## 🎯 Próximos Pasos

1. ✅ Ejecutar `.\start-dev.ps1`
2. ✅ Acceder a http://localhost:3000
3. ✅ Probar endpoints en http://localhost:4000/test
4. ✅ Explorar código en `frontend/src/` y `backend/`
5. ✅ Consultar documentación si hay dudas

---

## 📞 Soporte

Si encuentras problemas:
1. Consulta **TROUBLESHOOTING.md**
2. Verifica logs en consola
3. Asegúrate que PostgreSQL está corriendo
4. Ejecuta: `curl http://localhost:4000/test`

---

## 📝 Notas

- Las variables de entorno están configuradas para localhost
- No necesitas Docker para desarrollo local
- Backend usa Prisma ORM con PostgreSQL
- Frontend es Next.js 16 con React 19
- Base de datos sincroniza automáticamente con `npm run prisma:push`

**¡Listo para desarrollar! 🎉**
