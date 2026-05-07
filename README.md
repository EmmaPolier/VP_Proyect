# VP Project - Aplicación de Transporte

Aplicación full-stack para gestión de viajes con conductores y pasajeros.

## 🏗️ Arquitectura

```
Frontend (Next.js 16)  →  Backend (Express.js)  →  PostgreSQL
     :3000                    :4000                   :5432
```

## 🚀 Quick Start (Desarrollo Local)

### Requisitos previos

- **Node.js 20+**
- **PostgreSQL 15+** (instalado y corriendo en localhost:5432)
- **Git**

### Instalación Rápida

1. **Instalar dependencias:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Iniciar servidores:**
   ```powershell
   # Desde la raíz del proyecto (Windows PowerShell):
   .\start-dev.ps1
   ```

3. **Acceder:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## 📁 Estructura Limpia

```
VP_Proyect/
├── backend/              # Express + Prisma + PostgreSQL
│   ├── index.js         # Servidor
│   ├── prisma/          # Schema y migraciones
│   ├── .env             # Variables de entorno
│   └── node_modules/
├── frontend/            # Next.js + React
│   ├── src/             # Componentes y páginas
│   ├── .env.local       # Variables de entorno
│   └── node_modules/
├── start-dev.ps1        # Script rápido de inicio
├── setup-db.ps1         # Setup de base de datos
├── compose.yaml         # Docker Compose (opcional)
└── README.md           # Este archivo
```

## 🔌 API Endpoints

### Usuarios
- `GET /` - Información de la API
- `GET /test` - Health check
- `GET /users` - Listar usuarios
- `POST /signup` - Registrar usuario
- `POST /login` - Iniciar sesión
- `POST /verify` - Verificar email

### Vehículos
- `POST /vehicles` - Registrar vehículo

## 🗄️ Base de Datos

**PostgreSQL** en `localhost:5432`
- **Base de datos:** `vp_db`
- **Usuario:** `postgres`
- **Tablas:** User, Vehicle

Migraciones automáticas con Prisma.

## 📝 Variables de Entorno

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vp_db?schema=public
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=tu_usuario
EMAIL_PASS=tu_contraseña
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🛠️ Desarrollo

### Backend
```bash
npm run dev              # Iniciar servidor
npx prisma studio      # Abrir Prisma Studio
```

### Frontend
```bash
npm run dev            # Iniciar Next.js
npm run build          # Build producción
```

## 🐳 Docker (Opcional)

Si tienes Docker instalado:
```bash
docker compose up -d
```

## 📚 Documentación Adicional

- [API Endpoints](API_ENDPOINTS.md) - Documentación completa de endpoints
- [Setup Local](SETUP_LOCAL.md) - Instrucciones de configuración detallada
- [Troubleshooting](TROUBLESHOOTING.md) - Solución de problemas comunes

## 📧 Contacto

Para más información sobre el proyecto, revisa la documentación incluida.

### Error de base de datos

Verifica que PostgreSQL está corriendo:

```bash
docker ps | grep vp_db
```

### Limpiar todo y empezar de cero

```bash
docker compose down -v  # Elimina volúmenes
docker compose up -d    # Levanta nuevamente
```

## 📝 Variables de entorno

El archivo `.env` en el backend está configurado automáticamente por Docker Compose. No es necesario modificarlo.

## 🤝 Contribuciones

1. Crea una rama para tu feature: `git checkout -b feature/tu-feature`
2. Commit tus cambios: `git commit -m "Agrega tu feature"`
3. Push a la rama: `git push origin feature/tu-feature`
4. Abre un Pull Request

## 📄 Licencia

ISC
