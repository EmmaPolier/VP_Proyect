# Guía de Solución de Problemas

## PostgreSQL

### Error: "could not connect to server"

**Problema:** PostgreSQL no está corriendo

**Soluciones:**
1. Verificar si PostgreSQL está instalado:
   ```powershell
   psql --version
   ```

2. Si está instalado pero no corriendo, iniciarlo:
   - **Windows**: Abrir Services (`services.msc`) y buscar "PostgreSQL"
   - O reiniciar: `net start postgresql-x64-15` (ajustar versión)

3. Verificar que está escuchando en puerto 5432:
   ```powershell
   netstat -ano | findstr :5432
   ```

---

### Error: "FATAL: role does not exist"

**Problema:** El usuario vp_user no existe en PostgreSQL

**Solución:**
```powershell
# Conectar como admin
psql -U postgres -h localhost

# Crear usuario
CREATE USER vp_user WITH PASSWORD 'vp_password';
CREATE DATABASE vp_db OWNER vp_user;
GRANT ALL PRIVILEGES ON DATABASE vp_db TO vp_user;
\q
```

---

### Error: "database does not exist"

**Problema:** La BD vp_db no fue creada

**Solución:**
Ejecutar el script setup-db.ps1 o hacer:
```powershell
psql -U postgres
CREATE DATABASE vp_db OWNER vp_user;
\q
```

---

## Backend (Node.js)

### Error: "Cannot find module '@prisma/client'"

**Problema:** Dependencias no instaladas

**Soluciones:**
```powershell
cd backend
npm install

# Si persiste, limpiar y reinstalar
rm -r node_modules
rm package-lock.json
npm install
```

---

### Error: "Port 4000 is already in use"

**Problema:** Ya hay algo usando puerto 4000

**Soluciones:**
```powershell
# Ver qué está usando el puerto
netstat -ano | findstr :4000

# Matar el proceso (sustituir PID)
taskkill /PID <PID> /F

# O cambiar puerto en index.js
```

---

### Error: "Prisma schema validation failed"

**Problema:** Schema de Prisma inválido

**Solución:**
```powershell
cd backend

# Limpiar y regenerar
rm -r prisma/migrations (si existe)
npx prisma generate
npx prisma db push
```

---

### Error: "connection refused" desde Frontend

**Problema:** Backend no está corriendo o URL está mal

**Soluciones:**
1. Verificar que Backend está corriendo en puerto 4000
2. Verificar `.env.local` en frontend tiene:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```
3. Verificar CORS en backend (debe estar en index.js)

---

## Frontend (Next.js)

### Error: "Port 3000 is already in use"

**Problema:** Ya hay algo usando puerto 3000

**Soluciones:**
```powershell
# Ver qué está usando
netstat -ano | findstr :3000

# Matar proceso
taskkill /PID <PID> /F

# O usar otro puerto
npm run dev -- -p 3001
```

---

### Error: "Cannot find module 'next'"

**Problema:** Dependencias no instaladas

**Soluciones:**
```powershell
cd frontend
npm install

# Si falla, limpiar
rm -r node_modules .next
npm install
npm run build
npm run dev
```

---

### Error: "NEXT_PUBLIC_API_URL is undefined"

**Problema:** Variables de entorno no cargadas

**Soluciones:**
1. Crear o verificar `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

2. Reiniciar servidor (Next.js carga variables al iniciar):
   ```powershell
   npm run dev
   ```

---

## Problemas Generales

### Verificar que todo está corriendo

```powershell
# Backend
curl http://localhost:4000/test

# Frontend (verá HTML si está corriendo)
curl http://localhost:3000

# PostgreSQL
psql -U vp_user -d vp_db -h localhost -c "SELECT 1;"
```

---

### Ver logs del Backend (si está en background)

Si iniciaste Backend con `start-dev.ps1`:
```powershell
Get-Job -Name VP-Backend | Receive-Job -Keep
```

---

### Reset completo (último recurso)

```powershell
# Detener servidores
# Ctrl+C en las terminales

# Limpiar dependencias
cd backend
rm -r node_modules package-lock.json
cd ../frontend
rm -r node_modules package-lock.json .next

# Reinstalar
cd ../backend
npm install
npm run prisma:push
npm run dev

# En otra terminal
cd frontend
npm install
npm run dev
```

---

### Contacto / Más ayuda

- Revisar logs en consola con máximo detalle
- Verificar que PostgreSQL está corriendo: `psql -U vp_user -d vp_db`
- Verificar configuración de .env en backend
- Verificar configuración de .env.local en frontend
