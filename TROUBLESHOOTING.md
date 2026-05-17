# 🆘 Troubleshooting - Solución de Problemas

Guía para resolver los problemas más comunes al instalar y ejecutar VP_Proyect.

---

## ❌ Error: "command not found: npm"

**Causa:** Node.js no está instalado o no está en el PATH.

**Solución:**
1. Descargar Node.js desde https://nodejs.org/ (version 20 o superior)
2. Instalar y reiniciar la terminal
3. Verificar: `node --version` y `npm --version`

---

## ❌ Error: "Module not found: express, cors, dotenv..."

**Causa:** Las dependencias no se instalaron correctamente.

**Solución:**
```powershell
# Backend
cd backend
rm -r node_modules package-lock.json
npm install
cd ..

# Frontend
cd frontend
rm -r node_modules package-lock.json
npm install
cd ..
```

---

## ❌ Error: "Cannot find module 'prisma'"

**Causa:** Prisma no se generó correctamente.

**Solución:**
```powershell
cd backend
npx prisma generate
npx prisma migrate dev --name init
cd ..
```

---

## ❌ Error: "EADDRINUSE: address already in use :::4000"

**Causa:** El puerto 4000 (backend) ya está en uso.

**Soluciones:**

**Opción 1: Matar el proceso que usa el puerto**
```powershell
Get-Process | Where-Object {$_.Port -eq 4000} | Stop-Process -Force
```

**Opción 2: Cambiar el puerto en backend/.env**
```
PORT=5000
```
Luego edita `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## ❌ Error: "EADDRINUSE: address already in use :::3000"

**Causa:** El puerto 3000 (frontend) ya está en uso.

**Soluciones:**

**Opción 1: Matar el proceso que usa el puerto**
```powershell
Get-Process | Where-Object {$_.Port -eq 3000} | Stop-Process -Force
```

**Opción 2: Cambiar el puerto en frontend/package.json**
```json
"scripts": {
  "dev": "next dev -p 3001"
}
```

---

## ❌ Error: "PRISMA_GENERATOR_MANAGED_SOURCE_FILE_WARNING"

**Causa:** Aviso de Prisma, usualmente no es un error real.

**Solución:**
Ignora este aviso. Si la aplicación funciona, está bien.

---

## ❌ Error: "sqlite3 not installed" o base de datos no se crea

**Causa:** SQLite no se instala correctamente con Prisma.

**Solución:**
```powershell
cd backend

# Limpiar y reinstalar
rm -r node_modules .prisma
npm install

# Generar cliente Prisma
npx prisma generate

# Crear base de datos
npx prisma db push
npx prisma migrate dev --name init

cd ..
```

---

## ❌ Error: "Database 'vamonospues.db' does not exist"

**Causa:** La base de datos no se ha inicializado.

**Solución:**
```powershell
cd backend
npx prisma migrate dev --name init
cd ..
```

Esto creará automáticamente `backend/vamonospues.db`.

---

## ❌ Error: "Frontend no se conecta al backend"

**Síntomas:**
- La página carga pero no hay datos
- Errores de CORS
- Error "Cannot connect to API"

**Soluciones:**

**1. Verifica que el backend está corriendo:**
```powershell
curl http://localhost:4000
# Debería devolver información de la API
```

**2. Verifica las variables de entorno del frontend:**
- Abre `frontend/.env.local`
- Comprueba que dice: `NEXT_PUBLIC_API_URL=http://localhost:4000`
- Si cambió el puerto, actualiza aquí también

**3. Reinicia el frontend:**
```powershell
# En la terminal del frontend
Ctrl+C
npm run dev
```

---

## ❌ Error: "Cannot find file './vamonospues.db'"

**Causa:** La base de datos no existe.

**Solución:**
```powershell
cd backend

# Crear la base de datos desde cero
npx prisma migrate reset --force

# O si prefieres de forma segura
npx prisma migrate dev --name init

cd ..
```

---

## ❌ Error: "Port 4000 is already in use" en .\start-dev.ps1

**Causa:** El puerto está ocupado por otro proceso.

**Solución:**
```powershell
# Listar procesos que usan puerto 4000
Get-NetTCPConnection -LocalPort 4000 | Select-Object OwningProcess, ProcessName

# Matar el proceso (reemplaza PID con el número)
Stop-Process -Id <PID> -Force
```

---

## ❌ Error: "Cannot execute script" en PowerShell

**Síntomas:**
```
File cannot be loaded because running scripts is disabled on this system
```

**Solución:**
```powershell
# Ejecutar como administrador y permitir scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Luego ejecutar el script
.\install-dependencies.ps1
```

---

## ❌ Error: "npm ERR! code ERESOLVE"

**Causa:** Hay conflictos de dependencias entre paquetes.

**Solución:**
```powershell
npm install --legacy-peer-deps
```

---

## ❌ Error: "The prisma schema has not changed"

**Causa:** Ya has ejecutado migraciones antes con el mismo schema.

**Solución:**
```powershell
cd backend

# Si la BD ya existe y está correctamente inicializada
npx prisma db push

# Si quieres resetear todo (⚠️ BORRA TODOS LOS DATOS)
npx prisma migrate reset

cd ..
```

---

## ❌ Error: "next: not found" o Next.js no inicia

**Causa:** Next.js no se instaló correctamente.

**Solución:**
```powershell
cd frontend
rm -r node_modules .next
npm install
npm run dev
cd ..
```

---

## ❌ La aplicación funciona pero muestra "Loading..." infinitamente

**Causa:** Problemas de conectividad entre frontend y backend.

**Soluciones:**

1. **Verifica que ambos servidores estén corriendo**
2. **En consola del navegador (F12 → Console), busca errores**
3. **Reinicia ambos servidores:**
   ```powershell
   # Terminal 1 (Backend): Ctrl+C y npm run dev
   # Terminal 2 (Frontend): Ctrl+C y npm run dev
   ```

---

## ❌ Error: "Could not resolve '@prisma/client'"

**Causa:** Prisma client no se generó.

**Solución:**
```powershell
cd backend
npx prisma generate
npm run dev
cd ..
```

---

## ❌ La base de datos está corrupta o quiero empezar de nuevo

**Solución:**
```powershell
cd backend

# OPCIÓN 1: Resetear con warning (⚠️ BORRA TODOS LOS DATOS)
npx prisma migrate reset

# OPCIÓN 2: Eliminar archivos manualmente
rm vamonospues.db
rm -r prisma/migrations

# OPCIÓN 3: Crear todo de nuevo
npx prisma migrate dev --name init

cd ..
```

---

## ✅ Checklist para Verificar que Todo Funciona

- [ ] Node.js 20+ instalado: `node --version`
- [ ] npm funcionando: `npm --version`
- [ ] Backend corriendo: `curl http://localhost:4000`
- [ ] Frontend cargando: `http://localhost:3000` abre en navegador
- [ ] Base de datos creada: `backend/vamonospues.db` existe
- [ ] Sin errores en consola del navegador (F12)
- [ ] Sin errores en terminales de backend/frontend

---

## 🆘 Si nada funciona

1. **Elimina todo e empieza de cero:**
   ```powershell
   # En backend/
   rm -r node_modules .prisma vamonospues.db prisma/migrations
   rm package-lock.json
   
   # En frontend/
   rm -r node_modules .next
   rm package-lock.json
   
   # Luego reinstala
   .\install-dependencies.ps1
   ```

2. **Verifica requisitos mínimos:**
   - Node.js 20+
   - npm 10+
   - PowerShell 5+
   - Permisos de administrador (si es necesario)

3. **Revisa los logs completos:**
   - Copia los mensajes de error completos
   - Busca en Google o ChatGPT el error específico
   - Pide ayuda mostrando los logs exactos

---

## 📞 Contacto

Si el problema persiste:
1. Verifica que seguiste SETUP.md paso a paso
2. Revisa este documento
3. Comparte los logs completos de error
4. Pide ayuda en el grupo del proyecto

---

**¡Esperamos que funcione! 🚀**
