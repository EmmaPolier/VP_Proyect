# 🚀 Guía de Instalación - VP Project (VamonosPues)

Pasos para que otros desarrolladores clonen el repositorio e inicien la aplicación.

---

## 📋 Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

- **Node.js 20+** → [Descargar](https://nodejs.org/)
- **Git** → [Descargar](https://git-scm.com/)
- **PowerShell 5+** (En Windows)

### Verificar instalación

```powershell
node --version      # Debe ser v20 o superior
npm --version       # Debe ser 10 o superior
git --version       # Debe estar instalado
```

---

## 1️⃣ Clonar el Repositorio

```powershell
git clone <URL_DEL_REPOSITORIO>
cd VP_Proyect
```

---

## 2️⃣ Instalar Dependencias

### Opción A: Instalación Manual (Paso por Paso)

```powershell
# Instalar dependencias del backend
cd backend
npm install
cd ..

# Instalar dependencias del frontend
cd frontend
npm install
cd ..
```

### Opción B: Script Automático (Recomendado)

Desde la raíz del proyecto:

```powershell
.\install-dependencies.ps1
```

---

## 3️⃣ Configurar Variables de Entorno

### Backend (.env)

El archivo ya existe en `backend/.env` pero verifica que tenga:

```
NODE_ENV=development
PORT=4000

# Database (SQLite para desarrollo local)
DATABASE_URL="file:./vamonospues.db"

# JWT Secret (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345

# Email Config
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Frontend URL
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:4000
```

### Frontend (.env.local)

El archivo ya existe en `frontend/.env.local` pero verifica que tenga:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 4️⃣ Inicializar la Base de Datos (SQLite)

### Primera vez (Crear BD y schema)

```powershell
cd backend

# Generar cliente de Prisma
npx prisma generate

# Crear base de datos y ejecutar migraciones
npx prisma migrate dev --name init

cd ..
```

**Resultado esperado:**
- Se crea `backend/vamonospues.db`
- Se crean todas las tablas
- Prisma queda listo para usar

### Ver/Editar datos (Opcional)

```powershell
cd backend
npx prisma studio
cd ..
```

Esto abre una UI en `http://localhost:5555` para ver/editar datos.

---

## 5️⃣ Ejecutar la Aplicación

### Opción A: Dos Terminales (Fácil de ver logs)

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
# Backend corriendo en http://localhost:4000
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
# Frontend corriendo en http://localhost:3000
```

### Opción B: Script Automático (Recomendado)

Desde la raíz del proyecto:

```powershell
.\start-dev.ps1
```

Este script:
- Abre 2 terminales
- Inicia backend en `http://localhost:4000`
- Inicia frontend en `http://localhost:3000`
- Muestra logs en tiempo real

---

## ✅ Verificar que Todo Funciona

### 1. Acceder a la aplicación

```
Frontend: http://localhost:3000
Backend API: http://localhost:4000
```

### 2. Hacer una petición de prueba

```powershell
curl http://localhost:4000
# Debería devolver información de la API
```

### 3. Verificar logs en consola

- **Backend:** Debe mostrar `🚀 Server running on port 4000`
- **Frontend:** Debe mostrar `▲ Ready in Xs` sin errores

---

## 🗄️ Base de Datos

### SQLite (Desarrollo Local) ✅

**Archivo:** `backend/vamonospues.db`

- Auto-creada al ejecutar migraciones
- Perfecta para desarrollo local
- No requiere instalación adicional
- Los datos se guardan en el archivo

### Oracle (Producción)

Si necesitas cambiar a Oracle en producción:

1. Edita `backend/.env`:
```
DATABASE_URL="oracle://c##vamonospues:password@localhost:1521/XE"
```

2. Ejecuta migraciones:
```powershell
npx prisma migrate deploy
```

3. Opcionalmente, corre los scripts SQL desde `scripts/`:
```
01-schema-complete.sql  (Crea tablas + constraints + índices)
02-data-initial.sql     (Inserta datos base)
```

---

## 🐛 Troubleshooting

### Error: "Module not found"

**Solución:**
```powershell
cd backend
rm -r node_modules
npm install
npx prisma generate
```

### Error: "Cannot find module 'dotenv'"

**Solución:**
```powershell
npm install --save dotenv
```

### Error: "EADDRINUSE: address already in use :::4000"

El puerto 4000 está ocupado. Opción:

```powershell
# Matar proceso en puerto 4000
Get-Process | Where-Object {$_.Port -eq 4000} | Stop-Process -Force

# O cambiar puerto en backend/.env
PORT=5000
```

### La BD no se crea

**Solución:**
```powershell
cd backend
npx prisma migrate dev --name init --skip-generate
npx prisma db push
```

### Frontend no se conecta al backend

1. Verifica que backend esté corriendo en `http://localhost:4000`
2. Verifica `frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```
3. Reinicia frontend (Ctrl+C y `npm run dev`)

---

## 📊 Estructura del Proyecto

```
VP_Proyect/
├── backend/                  # Express + Prisma + SQLite/Oracle
│   ├── index.js             # Servidor principal
│   ├── prisma/
│   │   ├── schema.prisma    # Esquema de BD
│   │   └── migrations/      # Historial de cambios
│   ├── .env                 # Variables de entorno
│   ├── package.json
│   └── node_modules/
│
├── frontend/                 # Next.js + React + TailwindCSS
│   ├── src/
│   │   ├── app/             # Páginas y rutas
│   │   ├── components/      # Componentes reutilizables
│   │   └── hooks/           # Custom hooks
│   ├── .env.local           # Variables de entorno
│   ├── package.json
│   └── node_modules/
│
├── scripts/                  # Scripts SQL para Base de Datos
│   ├── 01-schema-complete.sql
│   ├── 02-data-initial.sql
│   └── ...
│
├── README.md                 # Este archivo
├── install-dependencies.ps1  # Script para instalar dependencias
├── start-dev.ps1            # Script para iniciar la app
└── .env.example             # Variables de ejemplo
```

---

## 🚀 Resumen de Comandos Rápidos

```powershell
# 1. Clonar
git clone <URL>
cd VP_Proyect

# 2. Instalar
.\install-dependencies.ps1

# 3. Inicializar BD
cd backend && npx prisma migrate dev --name init && cd ..

# 4. Iniciar
.\start-dev.ps1

# 5. Acceder
# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
```

---

## 📝 Notas Importantes

- ✅ **SQLite** es suficiente para desarrollo local
- ✅ Los datos persisten en `backend/vamonospues.db`
- ✅ La BD se resetea si eliminas `vamonospues.db` y corres migraciones nuevamente
- ✅ Para usar la BD en otra máquina, comparte el archivo `vamonospues.db`
- ⚠️ **Nunca hagas git push de archivos `.env` ni `vamonospues.db`** (ya están en `.gitignore`)

---

## 🆘 ¿Necesitas Ayuda?

1. Revisa los logs de errores en la consola
2. Verifica que los puertos 3000 y 4000 estén disponibles
3. Asegúrate de tener Node.js 20+
4. Intenta eliminar `node_modules` y reinstalar: `npm install`

---

**¡Listo para empezar!** 🎉
