# 📝 Documentación de Cambios Temporales - VP Project

**Fecha**: 6 de Mayo de 2026  
**Razón**: Inicializar proyecto sin Docker ni PostgreSQL instalados localmente  
**Estado**: Temporal - Requiere restauración a PostgreSQL

---

## 🔄 Cambios Realizados

### 1. **Backend: Prisma Schema** (`backend/prisma/schema.prisma`)

**CAMBIO**: Cambio de PostgreSQL a SQLite

```diff
- datasource db {
-   provider = "postgresql"
-   url      = env("DATABASE_URL")
- }

+ datasource db {
+   provider = "sqlite"
+   url      = "file:./dev.db"
+ }
```

**Razón**: PostgreSQL no estaba instalado. SQLite funciona sin dependencias externas.

**Cómo restaurar**:
```bash
# Editar: backend/prisma/schema.prisma
# 1. Cambiar provider a "postgresql"
# 2. Cambiar url a: env("DATABASE_URL")
# 3. Ejecutar migraciones:
cd backend
npx prisma migrate reset
# 4. Reiniciar backend
npm run dev
```

---

### 2. **Backend: Variables de Entorno** (`backend/.env`)

**CAMBIO**: DATABASE_URL comentado y explicación agregada

```ini
# CAMBIO TEMPORAL: Este .env fue generado automáticamente
# Si PostgreSQL está disponible, descomenta:
# DATABASE_URL=postgresql://vp_user:vp_password@localhost:5432/vp_db?schema=public

# SQLite se está usando actualmente (configurado en prisma/schema.prisma)
```

**Razón**: Documentar la configuración original y facilitar La restauración.

**Cómo restaurar**:
```bash
# 1. Descomentar la línea DATABASE_URL en backend/.env
# 2. Restaurar schema.prisma (ver paso 1)
# 3. Ejecutar migraciones
```

---

### 3. **Frontend: Variables de Entorno** (`frontend/.env.local`)

**Archivo creado** con configuración correcta:

```ini
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Razón**: Necesario para que el frontend sepa dónde encontrar el backend.

**Cambios requeridos para PostgreSQL**: ✅ NINGUNO - Este archivo no necesita cambios

---

## 🗄️ Base de Datos

### Estado Actual
- **Motor**: SQLite
- **Ubicación**: `backend/dev.db`
- **Modelos**: User (id, name, email)
- **Migraciones**: `backend/prisma/migrations/20260506131309_init/`

### Estado Original
- **Motor**: PostgreSQL
- **Puerto**: 5432
- **Usuario**: vp_user
- **Contraseña**: vp_password
- **BD**: vp_db
- **Host**: localhost (desarrollo local)

---

## 🚀 Pasos para Restaurar a PostgreSQL

### Prerequisitos
- PostgreSQL 12+ instalado y corriendo en puerto 5432

### Procedimiento

1. **Verificar PostgreSQL**
   ```powershell
   psql --version
   postgres -V
   ```

2. **Crear BD y usuario** (si no existen)
   ```sql
   psql -U postgres
   -- Dentro de psql:
   CREATE USER vp_user WITH PASSWORD 'vp_password';
   CREATE DATABASE vp_db OWNER vp_user;
   GRANT ALL PRIVILEGES ON DATABASE vp_db TO vp_user;
   \q
   ```

3. **Restaurar Prisma Schema**
   ```bash
   cd backend
   # Editar prisma/schema.prisma:
   # - Cambiar: provider = "postgresql"
   # - Cambiar: url = env("DATABASE_URL")
   ```

4. **Descomentar DATABASE_URL**
   ```bash
   # Editar backend/.env:
   # Descomentar: DATABASE_URL=postgresql://vp_user:vp_password@localhost:5432/vp_db?schema=public
   ```

5. **Eliminar SQLite** (opcional)
   ```bash
   cd backend
   rm -Force dev.db
   rmdir -Force prisma/migrations
   ```

6. **Ejecutar migraciones**
   ```bash
   cd backend
   npx prisma migrate deploy
   # O si quieres desde cero:
   # npx prisma migrate reset
   ```

7. **Regenerar Prisma Client**
   ```bash
   cd backend
   npx prisma generate
   ```

8. **Reiniciar Backend**
   ```bash
   # Matar el proceso actual (node index.js)
   # Ejecutar nuevamente
   npm run dev
   ```

---

## 📋 Checklist de Restauración

- [ ] PostgreSQL instalado y corriendo
- [ ] BD `vp_db` y usuario `vp_user` creados
- [ ] `backend/prisma/schema.prisma` restaurado a PostgreSQL
- [ ] `backend/.env` con DATABASE_URL descomentada
- [ ] `backend/dev.db` eliminado (opcional)
- [ ] Migraciones ejecutadas: `npx prisma migrate deploy`
- [ ] Prisma Client regenerado: `npx prisma generate`
- [ ] Backend reiniciado
- [ ] Verificar conexión: `http://localhost:4000/test` debe responder

---

## 📞 Ayuda Rápida

### Verificar que backend funciona:
```bash
curl http://localhost:4000/test
# Debería responder: {"message":"API is working!"}
```

### Verificar que frontend funciona:
```bash
# Abre navegador: http://localhost:3000
```

### Revisar logs de Prisma:
```bash
cd backend
npx prisma studio  # UI para ver datos
```

---

## 🔐 Seguridad

⚠️ **IMPORTANTE**: El archivo `.env` contiene credenciales de BD. 
- ✅ Ya está en `.gitignore`
- ✅ Nunca comitear `.env`
- ✅ Cambiar contraseña en producción
- ✅ Usar variables de entorno en hosting

---

**Última actualización**: 6 de Mayo de 2026
