# VP Project - Aplicación de Transporte 🚗

Aplicación full-stack para gestión de viajes con conductores y pasajeros.

## 🏗️ Arquitectura

```
Frontend (Next.js)  →  Backend (Express.js)  →  SQLite/Oracle
     :3000              :4000                   (Desarrollo/Producción)
```

## 🚀 Instrucciones de Inicio

### Requisitos Previos
- Node.js 18+
- Oracle XE (o ejecutar el script de setup)
- PowerShell

### Paso 1: Configurar Oracle Database
```powershell
# Ejecutar en la raíz del proyecto
.\setup-oracle-database.ps1
```
Este script levantará Oracle XE y ejecutará los scripts SQL.

### Paso 2: Instalar dependencias
```powershell
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Paso 3: Ejecutar los scripts SQL (si no se ejecutaron en Paso 1)
```powershell
# En PowerShell, conectarse a SQL*Plus y ejecutar:
sqlplus system/Emma2006@orcl
SQL> @scripts/1script_DDL_tablas_VamonosPues.sql
SQL> @scripts/2script_constraint_VamonosPues.sql
SQL> @scripts/3script_Indices_VamonosPues.sql
SQL> @scripts/4scripts_DML_VamonosPues.sql
SQL> @scripts/5script_Menu_VamonosPues.sql
SQL> COMMIT;
SQL> EXIT;
```

### Paso 4: Levantar la aplicación
```powershell
# Terminal 1 - Backend (puerto 4000)
cd backend
npm run dev

# Terminal 2 - Frontend (puerto 3000)
cd frontend
npm run dev
```

✅ **¡Listo!** Accede a:
- Frontend: http://localhost:3000
- Backend:  http://localhost:4000
- Oracle XE: Credenciales por defecto (system/Emma2006)

---

## 📖 Documentación Completa

👉 **[Ver guía de instalación detallada](SETUP.md)** para instrucciones paso a paso, requisitos previos, troubleshooting y más.

## 📁 Estructura del Proyecto

```
VP_Proyect/
├── backend/                    # Express.js + Prisma
│   ├── index.js               # Servidor principal
│   ├── prisma/
│   │   ├── schema.prisma      # Esquema de base de datos
│   │   └── migrations/        # Historial de cambios
│   ├── .env                   # Variables de entorno (no hacer git push)
│   ├── package.json
│   └── vamonospues.db         # Base de datos SQLite (local)
│
├── frontend/                   # Next.js + React + TailwindCSS
│   ├── src/
│   │   ├── app/               # Rutas y páginas
│   │   ├── components/        # Componentes reutilizables
│   │   └── hooks/             # Custom hooks
│   ├── .env.local             # Variables de entorno
│   ├── package.json
│   └── next.config.ts
│
├── scripts/                    # Scripts SQL para base de datos
│   ├── 01-schema-complete.sql
│   ├── 02-data-initial.sql
│   └── ...
│
├── SETUP.md                    # ⭐ Guía de instalación detallada
├── install-dependencies.ps1    # Script para instalar dependencias
├── start-dev.ps1              # Script para iniciar la app
├── .env.example               # Ejemplo de variables
└── README.md                  # Este archivo
```

## 🔧 Tecnologías

- **Frontend:** Next.js 16, React 19, TailwindCSS
- **Backend:** Express.js, Prisma ORM
- **Database:** SQLite (desarrollo), Oracle (producción)
- **Auth:** JWT + Bcrypt
- **Email:** Nodemailer (Gmail)

## 📚 Documentación

- **[SETUP.md](SETUP.md)** ⭐ - Guía completa paso a paso (requisitos previos, instalación, configuración)
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** 🆘 - Solución de problemas comunes
- **[scripts/](scripts/)** - Scripts SQL para base de datos (DDL, constraints, índices, datos)

## 🤝 Contribuir

1. Crea una rama: `git checkout -b feature/nombre`
2. Commit: `git commit -m "Descripción del cambio"`
3. Push: `git push origin feature/nombre`
4. Abre un Pull Request

## 📄 Licencia

ISC
