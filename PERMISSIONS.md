# Sistema de Permisos Dinámico - VamonosPues

## 📋 Descripción General

El sistema de permisos dinámico permite controlar el acceso a funcionalidades basadas en roles (PASAJERO, CONDUCTOR, ADMIN). Los permisos se cargan dinámicamente desde la base de datos y se sincronizan entre el frontend y backend.

## 🏗️ Arquitectura

### Base de Datos (Oracle)
- **PERFIL**: Roles del sistema (1=PASAJERO, 2=CONDUCTOR, 3=ADMIN)
- **MENU**: Items del menú (20 total: 7 conducor, 6 pasajero, 7 admin)
- **MENU_PERFIL**: Tabla de permisos (relación MENU ↔ PERFIL)
  - `INSERT_MPE`: Permiso crear
  - `UPDATE_MPE`: Permiso actualizar
  - `DELETE_MPE`: Permiso eliminar
  - `SELECT_MPE`: Permiso leer

### Backend (Express + Oracle)
- **POST /login**: Retorna `id_perfil` del usuario
- **GET /menu/:idPerfil**: Retorna menú dinámico con permisos
- **POST /validate-permission**: Valida permisos en tiempo real

### Frontend (Next.js)
- **usePermissions()**: Hook para acceder a permisos
- **ProtectedContent**: Componente para proteger contenido
- **ProtectedButton**: Botón que se desactiva sin permisos
- **sidebar.tsx**: Menú dinámico basado en permisos

## 🚀 Flujo de Autenticación y Autorización

```
1. Usuario ingresa email/contraseña → /login
2. Backend retorna: { id, nombres, email, id_perfil }
3. Frontend guarda en localStorage con id_perfil
4. Frontend carga menú con GET /menu/:idPerfil
5. Sidebar dinámico renderiza según permisos
6. Cada acción valida permisos antes de ejecutarse
```

## 💡 Uso en Frontend

### Obtener Permisos con el Hook

```typescript
import { usePermissions } from '@/hooks/use-permissions'

export function MyComponent() {
  const {
    menuItems,
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
  } = usePermissions()

  // Verificar permiso específico
  const canCreateUser = canCreate('/admin/users')

  return (
    <div>
      {canCreateUser && <button>+ Crear usuario</button>}
    </div>
  )
}
```

### Proteger Contenido

```typescript
import { ProtectedContent } from '@/components/protected-content'

export function AdminPanel() {
  return (
    <ProtectedContent url="/admin/users" action="leer">
      {/* Este contenido solo aparece si tiene permisos */}
      <h2>Gestión de Usuarios</h2>
      <UserTable />
    </ProtectedContent>
  )
}
```

### Botones Protegidos

```typescript
import { ProtectedButton } from '@/components/protected-content'

export function UserActions() {
  return (
    <div>
      <ProtectedButton 
        url="/admin/users" 
        action="crear"
        className="btn-primary"
      >
        + Crear Usuario
      </ProtectedButton>
    </div>
  )
}
```

## 🔐 Validación en Backend

### Validar Permisos Manualmente

```javascript
// En tus endpoints
const hasPermission = await validatePermission(
  idPerfil,
  '/admin/users',
  'CREATE'
);

if (!hasPermission) {
  return res.status(403).json({ error: 'Permiso denegado' });
}
```

### Usar Middleware de Permisos

```javascript
// En rutas sensibles
app.post(
  '/admin/users',
  permissionMiddleware('CREATE'),
  async (req, res) => {
    // Tu lógica aquí
  }
);
```

### Endpoint de Validación

```bash
POST /validate-permission
Content-Type: application/json

{
  "idPerfil": 2,
  "url": "/driver/routes",
  "action": "CREATE"
}

# Response
{
  "status": "OK",
  "idPerfil": 2,
  "url": "/driver/routes",
  "action": "CREATE",
  "hasPermission": true,
  "timestamp": "2024-05-16T..."
}
```

## 📊 Matriz de Permisos

### PASAJERO (ID = 1)
| Menú | Crear | Leer | Actualizar | Eliminar |
|------|-------|------|-----------|----------|
| Buscar Rutas | ❌ | ✅ | ❌ | ❌ |
| Mis Viajes | ❌ | ✅ | ❌ | ❌ |
| Mis Solicitudes | ✅ | ✅ | ✅ | ✅ |
| Cartera / Saldo | ✅ | ❌ | ❌ | ❌ |
| Mi Perfil | ❌ | ✅ | ✅ | ❌ |
| Configuración | ❌ | ✅ | ✅ | ❌ |

### CONDUCTOR (ID = 2)
| Menú | Crear | Leer | Actualizar | Eliminar |
|------|-------|------|-----------|----------|
| Mis Rutas | ✅ | ✅ | ✅ | ✅ |
| Solicitudes de Cupo | ❌ | ✅ | ✅ | ❌ |
| Mis Vehículos | ✅ | ✅ | ✅ | ✅ |
| Cartera / Saldo | ✅ | ❌ | ❌ | ❌ |
| Historial de Viajes | ❌ | ✅ | ❌ | ❌ |
| Mi Perfil | ❌ | ✅ | ✅ | ❌ |
| Configuración | ❌ | ✅ | ✅ | ❌ |

### ADMIN (ID = 3)
| Menú | Crear | Leer | Actualizar | Eliminar |
|------|-------|------|-----------|----------|
| Gestión de Usuarios | ✅ | ✅ | ✅ | ✅ |
| Gestión de Vehículos | ✅ | ✅ | ✅ | ✅ |
| Gestión de Rutas | ✅ | ✅ | ✅ | ✅ |
| Gestión de Solicitudes | ✅ | ✅ | ✅ | ✅ |
| Catálogos | ✅ | ✅ | ✅ | ✅ |
| Reportes | ❌ | ✅ | ❌ | ❌ |
| Configuración | ❌ | ✅ | ✅ | ❌ |

## 🔄 Actualizar Permisos

Para agregar o modificar permisos, edita la tabla MENU_PERFIL en la BD:

```sql
-- Otorgar permiso de eliminación a PASAJERO para "Mis Solicitudes"
UPDATE MENU_PERFIL 
SET DELETE_MPE = 'S' 
WHERE ID_MENU_MPE = 10 AND ID_PERFIL_MPE = 1;
COMMIT;
```

Los cambios se reflejan automáticamente en la siguiente recarga del menú.

## 📝 Archivos Clave

### Backend
- `backend/index.js`: Endpoints /menu, /validate-permission, /login mejorado
- `backend/db.js`: Conexión a Oracle

### Frontend
- `src/lib/permissions.ts`: Utilidades de permisos
- `src/hooks/use-permissions.ts`: Hook para acceder a permisos
- `src/components/protected-content.tsx`: Componentes ProtectedContent y ProtectedButton
- `src/components/dashboard/sidebar.tsx`: Sidebar dinámico
- `src/components/login-form.tsx`: Login que captura id_perfil

## 🧪 Testing de Permisos

### Test Manual en Postman
1. Hacer login y obtener `id_perfil`
2. Llamar `GET /menu/:id_perfil` para ver menú
3. Llamar `POST /validate-permission` para validar acciones

### Test en Frontend
1. Abrir DevTools → Storage → localStorage
2. Verificar que `currentUser` contiene `id_perfil`
3. Abrir Network y verificar llamadas a `/menu/:id_perfil`

## ⚠️ Consideraciones de Seguridad

1. **Frontend es informativo**: Los permisos en el frontend solo controlan UI
2. **Backend es definitivo**: Siempre valida permisos en el servidor
3. **localStorage no es seguro**: No guardes datos sensibles
4. **HTTPS obligatorio**: En producción, siempre usa HTTPS
5. **Tokens JWT**: Considera agregar tokens JWT para mayor seguridad

## 🐛 Troubleshooting

### "No hay menú disponible"
- Verificar que el usuario tiene perfil asignado en USUARIO_PERFIL
- Verificar que existen registros en MENU_PERFIL para ese perfil

### Permisos no se actualizan
- Limpiar localStorage: `localStorage.clear()`
- Recargar página con F5

### Error "URL no existe en el menú"
- Verificar que la URL está registrada en la tabla MENU
- Revisar si la URL está completa y correcta

## 📚 Próximos Pasos

1. Agregar middleware de autenticación JWT
2. Implementar auditoría de acciones
3. Agregar control de acceso por campo (field-level permissions)
4. Cachear permisos para mejor rendimiento
5. Agregar log de intentos de acceso denegado
