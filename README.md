# VP Project - Aplicación de Transporte 🚗

Aplicación full-stack para gestión de viajes con conductores y pasajeros.

## 🏗️ Arquitectura

```
Frontend (Next.js)  →  Backend (Express.js)  →  SQLite/Oracle
     :3000              :4000                   (Desarrollo/Producción)
```

## 🚀 Quick Start - 3 Pasos (5 minutos)

### 1️⃣ Instalar dependencias
```powershell
.\install-dependencies.ps1
```

### 2️⃣ Inicializar base de datos
```powershell
cd backend
npx prisma migrate dev --name init
cd ..
```

### 3️⃣ Iniciar aplicación
```powershell
.\start-dev.ps1
```

✅ **¡Listo!** Accede a:
- Frontend: http://localhost:3000
- Backend:  http://localhost:4000

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
