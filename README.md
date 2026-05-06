# VP Project - Aplicación de Transporte

Aplicación full-stack para gestión de viajes con conductores y pasajeros.

## 🏗️ Arquitectura

```
Frontend (Next.js 16)  →  Backend (Express.js)  →  PostgreSQL
     :3000                    :4000                   :5432
```

## 🚀 Requisitos previos

- Docker y Docker Compose instalados
- Git
- Node.js 16+ (opcional, solo para desarrollo local)

## 📦 Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone <tu-repo-url>
cd VP_Proyect
```

### 2. Levantar todos los servicios con Docker

```bash
docker compose up -d
```

Esto levantará:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **PostgreSQL Database**: localhost:5432

### 3. Crear la base de datos (primera vez)

Desde dentro del contenedor backend, corre las migraciones:

```bash
docker exec -it vp_backend npx prisma migrate dev --name init
```

## 💻 Desarrollo Local sin Docker

Si prefieres desarrollar sin Docker, sigue los pasos en [SETUP_LOCAL.md](./SETUP_LOCAL.md)

**Resumen rápido:**
1. Instalar PostgreSQL localmente
2. Crear BD y usuario (ver SETUP_LOCAL.md)
3. Backend: `cd backend && npm install && npm run prisma:push && npm run dev`
4. Frontend: `cd frontend && npm install && npm run dev`

## 📖 Uso

### 🔐 Crear una cuenta

1. Abre http://localhost:3000
2. Haz clic en "Regístrate"
3. Completa el formulario con:
   - Nombre completo
   - Email
   - Contraseña (mínimo 8 caracteres)

### 🔓 Iniciar sesión

1. Usa el email y contraseña que registraste
2. Serás redirigido al dashboard

## 🛠️ Estructura del Proyecto

```
VP_Proyect/
├── frontend/              # Next.js app (React 19)
│   ├── src/
│   │   ├── app/          # Rutas (login, signup, dashboard)
│   │   ├── components/   # Componentes reutilizables
│   │   └── lib/          # Utilidades
│   ├── package.json
│   └── frontend.dockerfile
│
├── backend/               # Express.js API
│   ├── index.js          # Servidor Express
│   ├── prisma/
│   │   └── schema.prisma # Definición de modelos
│   ├── package.json
│   └── backend.dockerfile
│
├── compose.yaml          # Orquestación Docker
└── README.md
```

## 🗄️ Base de datos

### Modelo User

```prisma
model User {
  id    Int     @id @default(autoincrement())
  name  String
  email String
}
```

### Endpoints API

- `GET /test` - Prueba del servidor
- `GET /users` - Obtener todos los usuarios
- `GET /users/:id` - Obtener usuario por ID
- `POST /users` - Crear nuevo usuario
  ```json
  {
    "name": "contraseña",
    "email": "correo@ejemplo.com"
  }
  ```

## 🔄 Flujo de desarrollo

1. **Hacer cambios** en el código
2. **Reconstruir contenedores** (si cambias dependencies):
   ```bash
   docker compose down
   docker compose up -d
   ```
3. **Verificar cambios** en http://localhost:3000 o http://localhost:4000

## 🐛 Solución de problemas

### El frontend no se conecta al backend

Asegúrate de que la variable `NEXT_PUBLIC_API_URL` esté configurada correctamente en `compose.yaml`:

```yaml
environment:
  - NEXT_PUBLIC_API_URL=http://localhost:4000
```

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
