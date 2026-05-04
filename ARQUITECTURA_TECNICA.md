# 🏗️ ARQUITECTURA TÉCNICA - VamonosPues

---

## 📐 DIAGRAMA ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                             │
└────────────────┬────────────────────────────────────┬────────────┘
                 │                                    │
        ┌────────▼──────────┐                ┌────────▼──────────┐
        │  FRONTEND (3000)  │                │  MOBILE APP (*)   │
        │  Next.js 16       │                │  React Native     │
        │  React 19         │                │  (Futuro)         │
        │  TypeScript       │                └───────────────────┘
        │  TailwindCSS      │
        └────────┬──────────┘
                 │ HTTPS/REST + WebSocket
                 │
        ┌────────▼──────────────────────────────────────────┐
        │          BACKEND API (4000)                       │
        │          Express.js + Node.js 20+                 │
        │                                                   │
        │  ┌──────────────┬──────────────┬──────────────┐  │
        │  │  Routes      │  Controllers │  Middleware  │  │
        │  ├──────────────┼──────────────┼──────────────┤  │
        │  │  Auth        │  Services    │  Error       │  │
        │  │  Users       │  Utils       │  Logging     │  │
        │  │  Routes      │  Constants   │  JWT Auth    │  │
        │  │  Seats       │              │  Validation  │  │
        │  │  Wallet      │              │  CORS        │  │
        │  │  Ratings     │              │  Limiter     │  │
        │  │  Chat        │              │              │  │
        │  └──────────────┴──────────────┴──────────────┘  │
        │                                                   │
        │  Prisma ORM Client                                │
        └────────┬──────────────────────────────────────────┘
                 │ TCP Connection
        ┌────────▼─────────────────────┐
        │   DATABASE LAYER              │
        │   PostgreSQL 15+              │
        │                               │
        │  ┌─────────────────────────┐  │
        │  │ Tablas Principales:     │  │
        │  │ ├─ users                │  │
        │  │ ├─ vehicles             │  │
        │  │ ├─ routes               │  │
        │  │ ├─ seat_requests        │  │
        │  │ ├─ wallets              │  │
        │  │ ├─ wallet_transactions  │  │
        │  │ ├─ ratings              │  │
        │  │ ├─ messages             │  │
        │  │ ├─ chats                │  │
        │  │ └─ trip_history         │  │
        │  └─────────────────────────┘  │
        └───────────────────────────────┘

        ┌────────────────────────────────────────┐
        │      SERVICIOS EXTERNOS                │
        │                                        │
        │  ┌──────────────┬──────────────────┐   │
        │  │ Google Maps  │  Email Service   │   │
        │  │ Geocoding    │  (SendGrid/SMTP) │   │
        │  │ Directions   │                  │   │
        │  └──────────────┴──────────────────┘   │
        │                                        │
        │  ┌──────────────┬──────────────────┐   │
        │  │ File Storage │  Notifications   │   │
        │  │ (Local/S3)   │  (Socket.io)     │   │
        │  └──────────────┴──────────────────┘   │
        └────────────────────────────────────────┘
```

---

## 🛠️ STACK TECNOLÓGICO

### FRONTEND
```json
{
  "framework": "Next.js 16.2.2",
  "runtime": "Node.js 18+",
  "language": "TypeScript 5.x",
  "ui_library": "React 19.2.4",
  "styling": "TailwindCSS 4.x",
  "components": "shadcn/ui (Radix UI)",
  "http_client": "Axios 1.15.2",
  "forms": "react-hook-form 7.x",
  "validation": "zod 3.x",
  "icons": "lucide-react 1.7.0",
  "animations": "framer-motion / tw-animate",
  "state_management": "Zustand / React Context",
  "testing": "Jest + React Testing Library",
  "build_tool": "Turbopack (Next.js default)",
  "linting": "ESLint 9.x + Prettier"
}
```

### BACKEND
```json
{
  "runtime": "Node.js 20+",
  "language": "JavaScript (ES2020+)",
  "framework": "Express.js 5.x",
  "orm": "Prisma 5.x",
  "database": "PostgreSQL 15+",
  "auth": "JWT (jsonwebtoken)",
  "password_hashing": "bcrypt 5.x",
  "validation": "joi / express-validator",
  "real_time": "Socket.io 4.x",
  "file_upload": "multer 1.x",
  "http_server": "Express Built-in",
  "cors": "cors middleware",
  "rate_limiting": "express-rate-limit",
  "logging": "winston / pino",
  "testing": "Jest + Supertest",
  "documentation": "Swagger/OpenAPI 3.x",
  "dotenv": "dotenv 16.x"
}
```

### DATABASE
```json
{
  "type": "Relational (SQL)",
  "provider": "PostgreSQL 15+",
  "connection": "TCP 5432",
  "driver": "pg (node-postgres)",
  "orm_client": "Prisma Client",
  "migration_tool": "Prisma Migrate",
  "backup": "PostgreSQL pg_dump",
  "pooling": "built-in Prisma pools",
  "timezone": "UTC"
}
```

### DEPLOYMENT & DEVOPS
```json
{
  "containerization": "Docker",
  "orchestration": "Docker Compose",
  "repository": "Docker Hub (futuro: GitHub Container Registry)",
  "ci_cd": "GitHub Actions (futuro)",
  "hosting": "VPS / Cloud (AWS/GCP/Azure) - futuro",
  "ssl_certificate": "Let's Encrypt / mkcert (dev)",
  "monitoring": "Winston logs (futuro: DataDog/New Relic)",
  "database_backup": "pg_dump + automated (futuro)"
}
```

---

## 📂 ESTRUCTURA DE CARPETAS

### Backend
```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── users.controller.js
│   │   ├── vehicles.controller.js
│   │   ├── routes.controller.js
│   │   ├── seats.controller.js
│   │   ├── wallet.controller.js
│   │   ├── ratings.controller.js
│   │   ├── chat.controller.js
│   │   └── history.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── vehicle.service.js
│   │   ├── route.service.js
│   │   ├── seat-request.service.js
│   │   ├── wallet.service.js
│   │   ├── rating.service.js
│   │   ├── chat.service.js
│   │   └── history.service.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error-handler.js
│   │   ├── validation.js
│   │   ├── rate-limiter.js
│   │   └── cors.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── vehicles.routes.js
│   │   ├── routes.routes.js
│   │   ├── seats.routes.js
│   │   ├── wallet.routes.js
│   │   ├── ratings.routes.js
│   │   ├── chat.routes.js
│   │   └── history.routes.js
│   │
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── validation.js
│   │   ├── geolocation.js (haversine)
│   │   ├── error-classes.js
│   │   ├── constants.js
│   │   └── logger.js
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── socket.js
│   │   └── multer.js (uploads)
│   │
│   ├── sockets/
│   │   ├── chat.socket.js
│   │   └── notifications.socket.js
│   │
│   └── app.js (Express app)
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds/
│       └── seed.js
│
├── uploads/ (gitignored)
├── logs/ (gitignored)
├── .env.example
├── .dockerignore
├── backend.dockerfile
├── package.json
└── index.js (entry point)
```

### Frontend
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx (root layout)
│   │   ├── page.tsx (redirect)
│   │   ├── globals.css
│   │   │
│   │   ├── auth/
│   │   │   └── page.tsx
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx
│   │   │
│   │   ├── signup/
│   │   │   ├── page.tsx
│   │   │   ├── driver/
│   │   │   │   ├── page.tsx
│   │   │   │   └── vehicle/
│   │   │   │       └── page.tsx
│   │   │   └── passenger/
│   │   │       └── page.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── driver/
│   │   │   │   ├── page.tsx
│   │   │   │   └── requests/
│   │   │   │       └── page.tsx
│   │   │   ├── passenger/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   │
│   │   ├── vehicles/
│   │   │   └── page.tsx
│   │   │
│   │   ├── routes/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx (detalle ruta)
│   │   │   ├── publish/
│   │   │   │   └── page.tsx
│   │   │   └── search/
│   │   │       └── page.tsx
│   │   │
│   │   ├── wallet/
│   │   │   └── page.tsx
│   │   │
│   │   ├── seat-requests/
│   │   │   └── page.tsx
│   │   │
│   │   ├── chat/
│   │   │   └── [routeId]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── history/
│   │   │   └── page.tsx
│   │   │
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   ├── auth-provider.tsx
│   │   │   └── protected-route.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── content.tsx
│   │   │
│   │   ├── routes/
│   │   │   ├── route-card.tsx
│   │   │   ├── route-search.tsx
│   │   │   ├── route-publish-form.tsx
│   │   │   ├── map-picker.tsx
│   │   │   └── route-detail.tsx
│   │   │
│   │   ├── vehicles/
│   │   │   ├── vehicle-list.tsx
│   │   │   ├── vehicle-form.tsx
│   │   │   └── vehicle-card.tsx
│   │   │
│   │   ├── wallet/
│   │   │   ├── wallet-balance.tsx
│   │   │   ├── topup-form.tsx
│   │   │   └── transaction-list.tsx
│   │   │
│   │   ├── seats/
│   │   │   ├── seat-request-form.tsx
│   │   │   ├── seat-request-card.tsx
│   │   │   └── seat-management.tsx
│   │   │
│   │   ├── chat/
│   │   │   ├── message-list.tsx
│   │   │   ├── message-input.tsx
│   │   │   └── chat-window.tsx
│   │   │
│   │   ├── ratings/
│   │   │   ├── rating-modal.tsx
│   │   │   ├── star-rating.tsx
│   │   │   └── rating-display.tsx
│   │   │
│   │   ├── common/
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   └── file-upload.tsx
│   │   │
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── modal.tsx
│   │       ├── toast.tsx
│   │       ├── badge.tsx
│   │       ├── avatar.tsx
│   │       ├── tabs.tsx
│   │       └── ... (otros shadcn/ui)
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-mobile.ts
│   │   ├── use-toast.ts
│   │   ├── use-api.ts
│   │   └── use-geolocation.ts
│   │
│   ├── services/
│   │   ├── api.ts (axios config)
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── vehicle.service.ts
│   │   ├── route.service.ts
│   │   ├── seat.service.ts
│   │   ├── wallet.service.ts
│   │   ├── rating.service.ts
│   │   ├── chat.service.ts
│   │   └── history.service.ts
│   │
│   ├── types/
│   │   ├── index.ts (types globales)
│   │   ├── user.types.ts
│   │   ├── route.types.ts
│   │   ├── seat.types.ts
│   │   ├── wallet.types.ts
│   │   ├── chat.types.ts
│   │   └── api.types.ts
│   │
│   ├── store/ (Zustand)
│   │   ├── auth.store.ts
│   │   ├── ui.store.ts
│   │   └── app.store.ts
│   │
│   ├── utils/
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   │
│   └── lib/
│       ├── utils.ts
│       └── cn.ts (classnames)
│
├── public/
│   ├── images/
│   ├── icons/
│   └── favicon.ico
│
├── .env.example
├── .dockerignore
├── frontend.dockerfile
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.ts
```

---

## 🔐 SEGURIDAD

### Frontend Security
- ✅ HTTPS en producción
- ✅ JWT en localStorage (considerar sessionStorage)
- ✅ XSS protection (React sanitizes by default)
- ✅ CSRF tokens en formularios sensibles
- ✅ Input validation client-side

### Backend Security
- ✅ JWT authentication
- ✅ bcrypt password hashing (rounds: 10)
- ✅ Rate limiting (express-rate-limit)
- ✅ CORS policy restrictivo
- ✅ Input validation + sanitization
- ✅ SQL Injection prevention (Prisma)
- ✅ Environment variables (.env)
- ✅ HTTPS only (con reverse proxy)
- ✅ Security headers (helmet.js - opcional)
- ✅ Logging de acciones sensibles

### Database Security
- ✅ Contraseñas fuertes
- ✅ Backups regulares
- ✅ Usuarios con permisos mínimos
- ✅ Encriptación de campos sensibles (futuro)
- ✅ Audit logs

---

## 📊 PERFORMANCE

### Frontend
- Lazy loading de rutas (Next.js)
- Code splitting automático
- Image optimization
- Memoization de componentes
- Virtual scrolling para listas largas

### Backend
- Connection pooling (Prisma)
- Caching de búsquedas (Redis - futuro)
- Indexing en BD (search fields)
- Pagination en listados
- Compression middleware

### Database
- Índices en campos usados en WHERE/JOIN
- Estadísticas actualizadas
- Query optimization
- Connection pooling

---

## 🔄 FLUJO DE DATOS

### Ejemplo: Buscar Rutas (Pasajero)

```
1. FRONTEND
   - Usuario ingresa origen, destino, fecha
   - Validación client-side
   
2. HTTP REQUEST
   - GET /api/routes/search?origin=X&destination=Y&date=Z
   - Headers: Authorization: Bearer {JWT}
   
3. BACKEND
   - Middleware: Verificar JWT
   - Controller: routes.controller.searchRoutes()
   - Service: route.service.searchByFilters()
   - Prisma: Query BD con filters
   
4. DATABASE
   - SELECT routes WHERE origin LIKE origin
     AND destination LIKE destination
     AND departure_date = date
     AND available_seats > 0
   
5. RESPONSE
   - 200 OK con array de rutas
   
6. FRONTEND
   - Renderizar resultados
   - Mostrar en mapa
   - Permitir seleccionar ruta
```

---

## 🚀 DEPLOYMENT

### Development
```bash
docker compose up -d
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
# DB: localhost:5432
```

### Staging (Futuro)
- VPS Linux (Ubuntu 22.04)
- Docker + Docker Compose
- Nginx reverse proxy
- Let's Encrypt SSL
- PostgreSQL managed

### Production (Futuro)
- Kubernetes OR Docker Swarm
- Load balancer
- CDN para assets
- RDS PostgreSQL (AWS)
- CloudFront distribution
- Monitoring + Alerting

---

## 📈 ESCALABILIDAD

### Horizontal Scaling
- Backend: Múltiples instancias con load balancer
- Database: Read replicas + primary
- Cache: Redis cluster
- Files: S3 para uploads

### Vertical Scaling
- Aumentar CPU/RAM servidores
- Upgrade database
- Optimize queries

### Monitoreo
- Application logs (Winston/Datadog)
- Database performance (slow query logs)
- Server metrics (CPU, memoria, disk)
- Error tracking (Sentry)

---

## 📚 REFERENCIAS

- Prisma: https://www.prisma.io/docs
- Express: https://expressjs.com
- Next.js: https://nextjs.org/docs
- PostgreSQL: https://www.postgresql.org/docs
- Socket.io: https://socket.io/docs

