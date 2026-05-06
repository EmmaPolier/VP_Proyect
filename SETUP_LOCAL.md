# Configuración Local - VP Project Demo

## Requisitos Previos

1. **PostgreSQL instalado localmente**
   - Descargar: https://www.postgresql.org/download/windows/
   - Puerto por defecto: 5432

## Paso 1: Crear Base de Datos y Usuario

```powershell
psql -U postgres
```

Dentro de psql, ejecutar:

```sql
CREATE USER vp_user WITH PASSWORD 'vp_password';
CREATE DATABASE vp_db OWNER vp_user;
GRANT ALL PRIVILEGES ON DATABASE vp_db TO vp_user;
\q
```

Verificar conexión:

```powershell
psql -U vp_user -d vp_db -h localhost
```

## Paso 2: Sincronizar Base de Datos con Prisma

```powershell
cd c:\Dev\VP_Proyect\backend
npm run prisma:push
```

Esto creará las tablas en PostgreSQL basado en el schema.prisma

## Paso 3: Iniciar Backend

En una terminal:

```powershell
cd c:\Dev\VP_Proyect\backend
npm run dev
```

✅ Backend corriendo en: http://localhost:4000

Verificar que funciona:
```
http://localhost:4000/test
```

## Paso 4: Iniciar Frontend

En otra terminal:

```powershell
cd c:\Dev\VP_Proyect\frontend
npm run dev
```

✅ Frontend corriendo en: http://localhost:3000

## Scripts Disponibles

### Backend
- `npm run dev` - Ejecutar servidor
- `npm run prisma:push` - Sincronizar BD con schema
- `npm run prisma:studio` - Abrir Prisma Studio (UI para BD)
- `npm run prisma:generate` - Regenerar cliente Prisma

### Frontend
- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Compilar para producción
- `npm run start` - Ejecutar versión compilada
- `npm run lint` - Verificar linting

## Variables de Entorno

### Backend (.env)
```
DATABASE_URL=postgresql://vp_user:vp_password@localhost:5432/vp_db?schema=public
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Solución de Problemas

### Error de conexión a PostgreSQL
- Verificar que PostgreSQL está corriendo: `Services` en Windows o revisar pgAdmin
- Verificar credenciales en .env

### Error de Prisma Generate
- Eliminar carpeta `node_modules` en backend y ejecutar `npm install` de nuevo

### Puerto ya en uso
- Backend (4000): `netstat -ano | findstr :4000`
- Frontend (3000): `netstat -ano | findstr :3000`

## Demo Rápida

1. Backend → `npm run dev` (desde backend/)
2. Frontend → `npm run dev` (desde frontend/)
3. Abrir http://localhost:3000 en navegador
4. API disponible en http://localhost:4000

¡Listo para demostrar! 🚀
